import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { Transaction } from '../types';

// This is the shape of the summary object the backend sends back
interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

// Everything components need: the data, loading/error state, and action functions
interface UseTransactionsReturn {
  transactions: Transaction[];
  summary: Summary;
  loading: boolean;
  error: string | null;
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id'>) => Promise<void>;
  editTransaction: (id: string, data: Partial<Omit<Transaction, 'id'>>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useCallback so this function reference stays stable — safe to put in useEffect deps
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data.transactions);
      setSummary(data.summary);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch automatically when the hook is first used
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Adds a transaction then refreshes the list so totals stay accurate
  async function addTransaction(data: Omit<Transaction, 'id'>) {
    await api.post('/transactions', data);
    await fetchTransactions();
  }

  // Updates a transaction then refreshes
  async function editTransaction(id: string, data: Partial<Omit<Transaction, 'id'>>) {
    await api.put(`/transactions/${id}`, data);
    await fetchTransactions();
  }

  // Deletes a transaction then refreshes
  async function removeTransaction(id: string) {
    await api.delete(`/transactions/${id}`);
    await fetchTransactions();
  }

  return { transactions, summary, loading, error, fetchTransactions, addTransaction, editTransaction, removeTransaction };
}
