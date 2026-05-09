import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { askAI } from '../services/ai.service';

// POST /api/ai/chat
// Receives a message from the user, builds a financial context snapshot from
// their real data, then passes both to Claude and streams the response back.
export async function chat(req: AuthRequest, res: Response): Promise<void> {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ message: 'Message is required' });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
    res.status(503).json({ message: 'AI features are not yet configured. Add your ANTHROPIC_API_KEY to server/.env to enable them.' });
    return;
  }

  // ── Build financial context ──
  // We pull the user's recent data so Claude can give personalized advice
  // rather than generic responses.

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Last 30 transactions (enough context without being too verbose for the prompt)
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { date: 'desc' },
    take: 30,
  });

  // Current month budgets
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const budgets = await prisma.budget.findMany({
    where: { userId: req.userId, month, year },
  });

  const monthExpenses = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      type: 'EXPENSE',
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Compute spending per category for budget context
  const spentByCategory: Record<string, number> = {};
  for (const t of monthExpenses) {
    spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + t.amount;
  }

  // Overall summary totals across all-time transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // ── Format context as readable text ──
  // This becomes part of Claude's system prompt so it "knows" the user's finances.
  const transactionLines = transactions
    .map((t) => {
      const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const sign = t.type === 'INCOME' ? '+' : '-';
      return `  ${date}: ${t.category} ${sign}$${t.amount.toFixed(2)}${t.notes ? ` (${t.notes})` : ''}`;
    })
    .join('\n');

  const budgetLines = budgets.length > 0
    ? budgets.map((b) => {
        const spent = spentByCategory[b.category] ?? 0;
        const pct = ((spent / b.limitAmount) * 100).toFixed(0);
        const status = spent > b.limitAmount ? '⚠ OVER BUDGET' : '';
        return `  ${b.category}: $${spent.toFixed(2)} spent of $${b.limitAmount.toFixed(2)} limit (${pct}%) ${status}`;
      }).join('\n')
    : '  No budgets set for this month.';

  const financialContext = `
TODAY: ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
CURRENT MONTH: ${now.toLocaleString('en-US', { month: 'long' })} ${year}

RECENT TRANSACTIONS (last ${transactions.length}):
${transactionLines || '  No transactions yet.'}

BUDGET STATUS FOR ${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} ${year}:
${budgetLines}

OVERALL SUMMARY (from visible transactions):
  Total Income:   $${totalIncome.toFixed(2)}
  Total Expenses: $${totalExpenses.toFixed(2)}
  Net Balance:    $${(totalIncome - totalExpenses).toFixed(2)}
`.trim();

  // Send to Claude and return the reply
  const reply = await askAI(message.trim(), financialContext);
  res.json({ reply });
}
