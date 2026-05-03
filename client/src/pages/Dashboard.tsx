import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/formatCurrency';
import SpendingPieChart from '../components/charts/SpendingPieChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';

export default function Dashboard() {
  const { user } = useAuth();
  const { transactions, summary, loading } = useTransactions();

  // ── Pie chart data ──
  // Group all EXPENSE transactions by category and sum their amounts.
  // useMemo means this only recalculates when `transactions` changes — not on every render.
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === 'EXPENSE') {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      }
    }
    // Convert the {category: total} map into [{name, value}] array for Recharts
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // biggest slices first
  }, [transactions]);

  // ── Bar chart data ──
  // Group transactions by month for the last 6 months, summing income and expenses per month.
  const barData = useMemo(() => {
    const now = new Date();
    const months: { year: number; month: number; label: string }[] = [];

    // Build a list of the last 6 months (including current)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleString('en-US', { month: 'short' }),
      });
    }

    return months.map(({ year, month, label }) => {
      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });

      const income = monthTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      return { month: label, income, expenses };
    });
  }, [transactions]);

  // ── Recent transactions ──
  // Just the 5 most recent to show in the dashboard preview
  const recent = transactions.slice(0, 5);

  return (
    <div className="p-6 space-y-6">

      {/* ── Greeting ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's your financial summary</p>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="Total Balance"
          value={formatCurrency(summary.balance)}
          valueColor={summary.balance >= 0 ? 'text-blue-600' : 'text-red-500'}
          loading={loading}
        />
        <SummaryCard
          label="Total Income"
          value={formatCurrency(summary.totalIncome)}
          valueColor="text-green-600"
          loading={loading}
        />
        <SummaryCard
          label="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          valueColor="text-red-500"
          loading={loading}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Spending by Category</h2>
          <SpendingPieChart data={pieData} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Income vs Expenses (6 months)</h2>
          <MonthlyBarChart data={barData} />
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Transactions</h2>
          <Link to="/transactions" className="text-xs text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {loading && (
          <p className="p-6 text-sm text-gray-400 text-center">Loading…</p>
        )}

        {!loading && recent.length === 0 && (
          <p className="p-6 text-sm text-gray-400 text-center">
            No transactions yet.{' '}
            <Link to="/transactions" className="text-blue-600 hover:underline">Add your first one</Link>
          </p>
        )}

        <div className="divide-y divide-gray-100">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.category}</p>
                <p className="text-xs text-gray-400">
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {t.notes && ` · ${t.notes}`}
                </p>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                {t.type === 'INCOME' ? '+' : '−'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Helper components & functions ──

function SummaryCard({ label, value, valueColor, loading }: {
  label: string;
  value: string;
  valueColor: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {loading
        ? <div className="h-7 w-24 bg-gray-100 animate-pulse rounded" />
        : <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      }
    </div>
  );
}

// Returns "morning", "afternoon", or "evening" based on the current hour
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
