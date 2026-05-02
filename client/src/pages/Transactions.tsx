import { useState, FormEvent } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatCurrency';
import type { Category } from '../types';

// All valid categories from our types — used to populate the category dropdown
const CATEGORIES: Category[] = [
  'Food', 'Transport', 'Housing', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Income', 'Other',
];

// The shape of the add-transaction form fields
interface FormState {
  amount: string;       // string because HTML inputs are always strings
  type: 'INCOME' | 'EXPENSE';
  category: Category;
  date: string;
  notes: string;
}

const DEFAULT_FORM: FormState = {
  amount: '',
  type: 'EXPENSE',
  category: 'Food',
  date: new Date().toISOString().split('T')[0], // today's date in YYYY-MM-DD
  notes: '',
};

export default function Transactions() {
  const { transactions, summary, loading, error, addTransaction, removeTransaction } = useTransactions();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError('Please enter a valid positive amount');
      return;
    }

    setSubmitting(true);
    try {
      await addTransaction({
        amount,
        type: form.type,
        category: form.category,
        date: form.date,
        notes: form.notes || undefined,
      });
      setForm(DEFAULT_FORM); // reset form on success
      setShowForm(false);
    } catch {
      setFormError('Failed to add transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction?')) return;
    await removeTransaction(id);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {/* ── Summary cards ── */}
        {/* These numbers come from the backend summary — no client-side math needed */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Income</p>
            <p className="text-xl font-semibold text-green-600">{formatCurrency(summary.totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Expenses</p>
            <p className="text-xl font-semibold text-red-500">{formatCurrency(summary.totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Balance</p>
            <p className={`text-xl font-semibold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {formatCurrency(summary.balance)}
            </p>
          </div>
        </div>

        {/* ── Add transaction form ── */}
        {/* Only shown when the user clicks "+ Add Transaction" */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">New Transaction</h2>

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle — switches between INCOME and EXPENSE */}
              <div className="flex gap-2">
                {(['EXPENSE', 'INCOME'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === 'EXPENSE'
                          ? 'bg-red-100 text-red-700 border-2 border-red-300'
                          : 'bg-green-100 text-green-700 border-2 border-green-300'
                        : 'bg-gray-100 text-gray-500 border-2 border-transparent'
                    }`}
                  >
                    {t === 'EXPENSE' ? '− Expense' : '+ Income'}
                  </button>
                ))}
              </div>

              {/* Amount + Category on same row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Grocery run, Netflix sub..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {submitting ? 'Saving…' : 'Save Transaction'}
              </button>
            </form>
          </div>
        )}

        {/* ── Transaction list ── */}
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">

          {loading && (
            <p className="p-6 text-sm text-gray-400 text-center">Loading transactions…</p>
          )}

          {error && (
            <p className="p-6 text-sm text-red-500 text-center">{error}</p>
          )}

          {!loading && !error && transactions.length === 0 && (
            <p className="p-6 text-sm text-gray-400 text-center">
              No transactions yet. Add your first one above.
            </p>
          )}

          {/* Each row: category + date on the left, amount + delete on the right */}
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.category}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(t.date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {t.notes && ` · ${t.notes}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'INCOME' ? '+' : '−'}{formatCurrency(t.amount)}
                </span>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                  aria-label="Delete transaction"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
