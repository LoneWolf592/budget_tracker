import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SliceData {
  name: string;   // category name
  value: number;  // total amount spent
}

interface Props {
  data: SliceData[];
}

// One color per spending category — cycles if there are more than 9 categories
const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#84cc16'];

export default function SpendingPieChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        No expense data yet
      </div>
    );
  }

  return (
    // ResponsiveContainer makes the chart fill whatever width its parent gives it
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          // No label on the slices — the legend handles that
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        {/* Tooltip shows the category + dollar amount on hover */}
        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
