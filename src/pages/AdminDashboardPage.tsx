import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, CreditCard, ShieldAlert, Server, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinance } from '../context/FinanceContext';

const panel: React.CSSProperties = {
  background: 'var(--surface)',
  backdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 20,
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function AdminDashboardPage() {
  const { data } = useFinance();
  const appRevenue = data.currentPlan === 'Pro' ? 349 : data.currentPlan === 'Wealth' ? 899 : 0;

  const chartData = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const name = d.toLocaleDateString('en-US', { month: 'short' });
      const revenue = Math.max(0, appRevenue - (i * (appRevenue * 0.1))); 
      result.push({ name, revenue });
    }
    return result;
  }, [appRevenue]);

  const an = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.05, duration: 0.4 },
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>Dashboard Overview</h1>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {[
          { label: 'Platform Users (Active)', value: data.isOnboarded ? '1' : '0', icon: Users, trend: '+1 this month' },
          { label: 'Total MRR', value: `₹${appRevenue.toLocaleString('en-IN')}`, icon: CreditCard, trend: appRevenue > 0 ? '+Growth' : 'Stable' },
          { label: 'Server Load', value: data.isOnboarded ? '12%' : '0%', icon: Server, trend: 'Stable' },
          { label: 'Active Sessions', value: '1', icon: ShieldAlert, trend: 'Current' },
        ].map((k, i) => (
          <motion.div key={k.label} style={{ ...panel, padding: 24 }} {...an(i)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(167, 139, 250, 0.1)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <k.icon size={20} />
              </div>
              <span style={{ fontSize: 11, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--green)', padding: '4px 8px', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><ArrowUpRight size={12}/>{k.trend}</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{k.label}</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{k.value}</h2>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <motion.div style={{ ...panel, padding: 24 }} {...an(4)}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Revenue Growth (MRR)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)' }} itemStyle={{ color: 'var(--purple)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#a78bfa" strokeWidth={3} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div style={{ ...panel, padding: 24 }} {...an(5)}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>System Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'Database Cluster', status: 'Healthy', color: 'var(--green)' },
              { name: 'Payment Gateway', status: 'Operational', color: 'var(--green)' },
              { name: 'AI Analytics Engine', status: 'High Load', color: '#fbbf24' },
              { name: 'Email Dispatcher', status: 'Healthy', color: 'var(--green)' },
              { name: 'Security Firewall', status: 'Active (2 blocked)', color: 'var(--purple)' },
            ].map(sys => (
              <div key={sys.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{sys.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sys.color }} />
                  <span style={{ fontSize: 13, color: sys.color }}>{sys.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
