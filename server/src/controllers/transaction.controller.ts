import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /api/transactions
// Returns all transactions for the logged-in user, newest first.
// We also compute a running summary (total income, total expenses, net balance)
// so the frontend doesn't have to calculate it separately.
export async function getTransactions(req: AuthRequest, res: Response): Promise<void> {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { date: 'desc' },
  });

  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === 'INCOME') acc.totalIncome += t.amount;
      else acc.totalExpenses += t.amount;
      return acc;
    },
    { totalIncome: 0, totalExpenses: 0 }
  );

  res.json({
    transactions,
    summary: {
      ...summary,
      balance: summary.totalIncome - summary.totalExpenses,
    },
  });
}

// POST /api/transactions
// Creates a new transaction. We validate all required fields before touching the DB.
// The userId comes from the JWT (req.userId), NOT from the request body —
// this prevents a user from creating transactions for someone else.
export async function createTransaction(req: AuthRequest, res: Response): Promise<void> {
  const { amount, type, category, date, notes } = req.body;

  if (!amount || !type || !category || !date) {
    res.status(400).json({ message: 'Amount, type, category, and date are required' });
    return;
  }

  if (!['INCOME', 'EXPENSE'].includes(type)) {
    res.status(400).json({ message: 'Type must be INCOME or EXPENSE' });
    return;
  }

  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ message: 'Amount must be a positive number' });
    return;
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: req.userId!,
      amount,
      type,
      category,
      date: new Date(date),
      notes: notes || null,
    },
  });

  res.status(201).json({ transaction });
}

// PUT /api/transactions/:id
// Updates an existing transaction. We first check the transaction exists AND belongs
// to the current user — this prevents user A from editing user B's transactions.
export async function updateTransaction(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { amount, type, category, date, notes } = req.body;

  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'Transaction not found' });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ message: 'Not authorized to edit this transaction' });
    return;
  }

  if (type && !['INCOME', 'EXPENSE'].includes(type)) {
    res.status(400).json({ message: 'Type must be INCOME or EXPENSE' });
    return;
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount }),
      ...(type && { type }),
      ...(category && { category }),
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  });

  res.json({ transaction });
}

// DELETE /api/transactions/:id
// Deletes a transaction. Same ownership check as update.
export async function deleteTransaction(req: AuthRequest, res: Response): Promise<void> {
  const id = req.params.id as string;

  const existing = await prisma.transaction.findUnique({ where: { id } });

  if (!existing) {
    res.status(404).json({ message: 'Transaction not found' });
    return;
  }

  if (existing.userId !== req.userId) {
    res.status(403).json({ message: 'Not authorized to delete this transaction' });
    return;
  }

  await prisma.transaction.delete({ where: { id } });
  res.json({ message: 'Transaction deleted' });
}
