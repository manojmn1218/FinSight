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
  const { allUsers } = useFinance();
  const appRevenue = allUsers.reduce((sum, u) => sum + (u.currentPlan === 'Pro' ? 349 : u.currentPlan === 'Wealth' ? 899 : 0), 0);

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

  const tx = allUsers
    .filter(u => u.currentPlan === 'Pro' || u.currentPlan === 'Wealth')
    .map((u, i) => ({
      id: `tx_${i}`,
      user: u.userName || u.userEmail,
      amount: `₹${u.currentPlan === 'Pro' ? '349' : '899'}`,
      date: 'Subscription Payment',
      status: 'Success'
    }));

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };

  return (
    <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>Revenue Analytics</h1>
        <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>Detailed breakdown of platform financial health.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: 'Total MRR', value: `₹${appRevenue.toLocaleString('en-IN')}`, icon: DollarSign, trend: appRevenue > 0 ? '+Growth' : 'Stable', clr: '#34d399', bg: 'rgba(52,211,153,0.1)' },
          { label: 'Average Revenue Per User', value: `₹${appRevenue > 0 ? Math.round(appRevenue / allUsers.length).toLocaleString('en-IN') : '0'}`, icon: TrendingUp, trend: 'Stable', clr: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
          { label: 'Churn Rate', value: '0.0%', icon: CreditCard, trend: 'Perfect', clr: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
        ].map((k, i) => (
          <div key={k.label} className="panel panel-glow" style={{ padding: 24, animationDelay: `${i * 0.1}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: k.bg, color: k.clr, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} />
              </div>
              <span className="badge" style={{ background: k.bg, color: k.clr }}>
                {k.trend.startsWith('+') && <ArrowUpRight size={11}/>}{k.trend}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{k.label}</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}>{k.value}</h2>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div className="panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Revenue vs Expenses</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--text)' }} cursor={{ stroke: 'var(--border)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5} fill="url(#revGrad)" name="Revenue" />
                <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2.5} fill="url(#expGrad)" name="Expenses" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel" style={{ padding: 24 }}>
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
              )) : <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No transactions found.</div>}
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
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
