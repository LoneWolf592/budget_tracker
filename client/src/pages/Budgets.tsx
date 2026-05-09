import { useState, type FormEvent } from 'react';
import { useBudgets } from '../hooks/useBudgets';
import { formatCurrency } from '../utils/formatCurrency';
import type { Category } from '../types';

const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Housing', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Other',
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Budgets() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState(now.getFullYear());

  const { budgets, loading, error, saveBudget, removeBudget } = useBudgets(month, year);

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<Category>('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Navigate to the previous month, wrapping from January back to December
  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }

  // Navigate to the next month
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const amount = parseFloat(limitAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid positive amount');
      return;
    }

    setSubmitting(true);
    try {
      await saveBudget({ category, limitAmount: amount, month, year });
      setLimitAmount('');
      setShowForm(false);
    } catch {
      setFormError('Failed to save budget. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this budget?')) return;
    await removeBudget(id);
  }

  // How much of the total budget across all categories has been used
  const totalLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Set Budget'}
        </button>
      </div>

      {/* ── Month navigator ── */}
      {/* Lets the user browse previous months to review past budgets */}
      <div className="flex items-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          ←
        </button>
        <span className="text-base font-semibold text-gray-800 w-36 text-center">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          →
        </button>
      </div>

      {/* ── Overall summary bar ── */}
      {/* Shows total spent across all budgets for the selected month */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Overall spending</span>
            <span className="text-gray-500">
              {formatCurrency(totalSpent)} of {formatCurrency(totalLimit)}
            </span>
          </div>
          <ProgressBar percent={(totalSpent / totalLimit) * 100} />
        </div>
      )}

      {/* ── Add budget form ── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Set a Budget for {MONTH_NAMES[month - 1]} {year}
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            If a budget already exists for this category and month, it will be updated.
          </p>

          {formError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {submitting ? 'Saving…' : 'Save Budget'}
            </button>
          </form>
        </div>
      )}

      {/* ── Budget cards ── */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading budgets…</p>}
      {error && <p className="text-sm text-red-500 text-center py-8">{error}</p>}

      {!loading && !error && budgets.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">No budgets set for {MONTH_NAMES[month - 1]} {year}.</p>
          <p className="text-gray-400 text-sm mt-1">Click <strong>+ Set Budget</strong> to add one.</p>
        </div>
      )}

      <div className="space-y-3">
        {budgets.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">{b.category}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatCurrency(b.spent)} spent · {formatCurrency(b.remaining)} remaining
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Status badge — color changes based on how much of the budget is used */}
                <StatusBadge percent={b.percentUsed} />
                <span className="text-sm font-medium text-gray-600">
                  {b.percentUsed.toFixed(0)}%
                </span>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  aria-label="Remove budget"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Progress bar for this category */}
            <ProgressBar percent={b.percentUsed} />

            {/* Limit label below the bar */}
            <div className="flex justify-between mt-1.5 text-xs text-gray-400">
              <span>$0</span>
              <span>Limit: {formatCurrency(b.limitAmount)}</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Helper components ──

// The progress bar fills based on percent, capped at 100% width.
// Color: green under 75%, yellow 75–90%, red over 90%
function ProgressBar({ percent }: { percent: number }) {
  const capped = Math.min(percent, 100);
  const color =
    percent >= 90 ? 'bg-red-500' :
    percent >= 75 ? 'bg-yellow-400' :
    'bg-green-500';

  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${capped}%` }}
      />
    </div>
  );
}

// Small badge showing budget health at a glance
function StatusBadge({ percent }: { percent: number }) {
  if (percent >= 100) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Over budget</span>;
  if (percent >= 90) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-500">Almost over</span>;
  if (percent >= 75) return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">Watch out</span>;
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-600">On track</span>;
}
