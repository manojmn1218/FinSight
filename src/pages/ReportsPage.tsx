import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const { data } = useFinance();

  const chartData = data.expenses.filter(e => e.amount > 0).map(e => ({
    name: e.name,
    spent: e.amount,
    budget: Math.round(e.amount * 1.2),
  }));

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Financial Reports</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Detailed breakdown of your spending vs budget.</p>
      </div>

      <div className="panel" style={{ padding: 28, height: 480 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={18} color="var(--purple)" /> Spending by Category
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip cursor={{ fill: 'rgba(129,140,248,0.04)' }} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
              <Bar dataKey="spent" name="Actual Spent" fill="#f472b6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="budget" name="Budget Allocated" fill="#818cf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '85%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', fontSize: 14 }}>
            <BarChart3 size={36} />
            <p>Complete onboarding to see your reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
