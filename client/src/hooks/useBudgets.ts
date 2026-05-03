import { useState, useEffect, useCallback } from 'react';
import api from '../api';
import type { Budget } from '../types';

// The enriched budget shape — extends the base Budget with spending data
// that the backend computes for us
export interface EnrichedBudget extends Budget {
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface UseBudgetsReturn {
  budgets: EnrichedBudget[];
  loading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  saveBudget: (data: { category: string; limitAmount: number; month: number; year: number }) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

// The hook accepts a month (1-12) and year so the Budgets page can
// pass whichever month the user is currently viewing
export function useBudgets(month: number, year: number): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<EnrichedBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/budgets', { params: { month, year } });
      setBudgets(data.budgets);
    } catch {
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [month, year]); // re-fetch automatically when the month/year changes

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  async function saveBudget(data: { category: string; limitAmount: number; month: number; year: number }) {
    await api.post('/budgets', data);
    await fetchBudgets();
  }

  async function removeBudget(id: string) {
    await api.delete(`/budgets/${id}`);
    await fetchBudgets();
  }

  return { budgets, loading, error, fetchBudgets, saveBudget, removeBudget };
}
