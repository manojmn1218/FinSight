import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';

export default function ReportsPage() {
  const { data } = useFinance();

  const chartData = data.expenses.filter(e => e.amount > 0).map(e => ({
    name: e.name,
    spent: e.amount,
    budget: Math.round(e.amount * 1.2), // Mock allocated budget
  }));

  const panel: React.CSSProperties = { padding: 32, background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Financial Reports</h1>
        <p style={{ color: 'var(--text2)' }}>Detailed breakdown of your spending vs budget.</p>
      </div>

      <div style={{ ...panel, height: 500 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 28 }}>Spending by Category</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip cursor={{ fill: 'var(--border)' }} contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)' }} />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Bar dataKey="spent" name="Actual Spent" fill="#f472b6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="budget" name="Budget Allocated" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '85%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
            Complete onboarding to see your reports.
          </div>
        )}
      </div>
    </div>
  );
}
