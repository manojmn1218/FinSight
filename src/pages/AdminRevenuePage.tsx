import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  backdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function AdminRevenuePage() {
  const { data } = useFinance();
  const appRevenue = data.currentPlan === 'Pro' ? 349 : data.currentPlan === 'Wealth' ? 899 : 0;

  const chartData = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const name = d.toLocaleDateString('en-US', { month: 'short' });
      const revenue = Math.max(0, appRevenue - (i * (appRevenue * 0.1))); 
      const expenses = 23450; // AWS + OpenAI + Vercel + Domains
      result.push({ name, revenue, expenses });
    }
    return result;
  }, [appRevenue]);

  const tx = appRevenue > 0 ? [{
    id: `tx_1`,
    user: data.userName || 'Unknown User',
    amount: `₹${appRevenue.toLocaleString('en-IN')}`,
    date: 'Subscription Payment',
    status: 'Success'
  }] : [];
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Revenue Analytics</h1>
        <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>Detailed breakdown of platform financial health.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: 'Total MRR', value: `₹${appRevenue.toLocaleString('en-IN')}`, icon: DollarSign, trend: appRevenue > 0 ? '+Growth' : 'Stable' },
          { label: 'Average Revenue Per User', value: `₹${appRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, trend: 'Stable' },
          { label: 'Churn Rate', value: '0.0%', icon: CreditCard, trend: 'Perfect' },
        ].map((k) => (
          <div key={k.label} style={{ ...panel, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(167, 139, 250, 0.1)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} />
              </div>
              <span style={{ fontSize: 11, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--green)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><ArrowUpRight size={12}/>{k.trend}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{k.label}</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{k.value}</h2>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ ...panel, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Revenue vs Expenses</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} itemStyle={{ color: 'var(--purple)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={3} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={3} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ ...panel, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Recent Transactions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tx.length > 0 ? tx.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.user}</div>
                    <div style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>{t.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: t.status === 'Refunded' ? 'var(--text2)' : 'var(--text)', textDecoration: t.status === 'Refunded' ? 'line-through' : 'none' }}>{t.amount}</div>
                    <div style={{ fontSize: 11, color: t.status === 'Refunded' ? 'var(--red)' : 'var(--green)', marginTop: 4, fontWeight: 600 }}>{t.status}</div>
                  </div>
                </div>
              )) : <div style={{ color: 'var(--text3)', fontSize: 13 }}>No transactions found.</div>}
            </div>
          </div>

          <div style={{ ...panel, padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Development Expenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { name: 'AWS Hosting & Servers', amount: '₹12,500' },
                { name: 'OpenAI API Usage', amount: '₹8,200' },
                { name: 'Vercel Pro', amount: '₹1,900' },
                { name: 'Domains & SSL', amount: '₹850' }
              ].map(exp => (
                <div key={exp.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{exp.name}</div>
                  <div style={{ fontWeight: 700, color: 'var(--red)' }}>-{exp.amount}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
