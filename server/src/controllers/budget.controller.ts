import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/budgets?month=5&year=2026
// Returns all budgets for the given month/year, with how much has been spent
// in each category so the frontend can render progress bars.
// Defaults to the current month/year if no query params are provided.
export async function getBudgets(req: AuthRequest, res: Response): Promise<void> {
  const now = new Date();
  const month = parseInt(req.query.month as string) || now.getMonth() + 1; // 1-12
  const year = parseInt(req.query.year as string) || now.getFullYear();

  // Get all budgets the user has set for this month
  const budgets = await prisma.budget.findMany({
    where: { userId: req.userId, month, year },
    orderBy: { category: 'asc' },
  });

  // Get all expense transactions for this user in this month/year
  // We'll use these to calculate how much has been spent per category
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59); // last day of month

  const expenses = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      type: 'EXPENSE',
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Build a map of { category -> total spent } from the expense transactions
  const spentByCategory: Record<string, number> = {};
  for (const t of expenses) {
    spentByCategory[t.category] = (spentByCategory[t.category] ?? 0) + t.amount;
  }

  // Enrich each budget with spending data — this is what the frontend actually needs
  const enrichedBudgets = budgets.map((b) => {
    const spent = spentByCategory[b.category] ?? 0;
    const remaining = b.limitAmount - spent;
    const percentUsed = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;

    return {
      ...b,
      spent: parseFloat(spent.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      percentUsed: parseFloat(percentUsed.toFixed(1)),
    };
  });

  res.json({ budgets: enrichedBudgets, month, year });
}

// POST /api/budgets
// Creates or updates a budget for a category/month/year.
// We use upsert because the schema has a unique constraint on
// [userId, category, month, year] — so if one already exists, we update it.
export async function upsertBudget(req: AuthRequest, res: Response): Promise<void> {
  const { category, limitAmount, month, year } = req.body;

  if (!category || !limitAmount || !month || !year) {
    res.status(400).json({ message: 'Category, limitAmount, month, and year are required' });
    return;
  }

  if (typeof limitAmount !== 'number' || limitAmount <= 0) {
    res.status(400).json({ message: 'limitAmount must be a positive number' });
    return;
  }

  if (month < 1 || month > 12) {
    res.status(400).json({ message: 'Month must be between 1 and 12' });
    return;
  }

  const budget = await prisma.budget.upsert({
    // The unique key to look up an existing record
    where: {
      userId_category_month_year: {
        userId: req.userId!,
        category,
        month,
        year,
      },
    },
    // If it exists, just update the limit amount
    update: { limitAmount },
    // If it doesn't exist, create it fresh
    create: {
      userId: req.userId!,
      category,
      limitAmount,
      month,
      year,
    },
  });

  res.status(201).json({ budget });
}

// DELETE /api/budgets/:id
export async function deleteBudget(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await prisma.budget.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'Budget not found' });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ message: 'Not authorized to delete this budget' });
    return;
  }

  await prisma.budget.delete({ where: { id } });
  res.json({ message: 'Budget deleted' });
}
