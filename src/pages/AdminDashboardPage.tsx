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
  const { allUsers } = useFinance();
  const appRevenue = allUsers.reduce((sum, u) => sum + (u.currentPlan === 'Pro' ? 349 : u.currentPlan === 'Wealth' ? 899 : 0), 0);
  const activeUsers = allUsers.filter(u => u.isOnboarded).length;

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
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  });

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };

  return (
    <div className="page-enter" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>Dashboard Overview</h1>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {[
          { label: 'Platform Users (Active)', value: String(activeUsers), icon: Users, trend: `+${allUsers.length} this month`, clr: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
          { label: 'Total MRR', value: `₹${appRevenue.toLocaleString('en-IN')}`, icon: CreditCard, trend: appRevenue > 0 ? '+Growth' : 'Stable', clr: '#34d399', bg: 'rgba(52,211,153,0.1)' },
          { label: 'Server Load', value: `${Math.min(100, activeUsers * 2)}%`, icon: Server, trend: 'Stable', clr: '#f0b429', bg: 'rgba(240,180,41,0.1)' },
          { label: 'Active Sessions', value: String(allUsers.length), icon: ShieldAlert, trend: 'Current', clr: '#f472b6', bg: 'rgba(244,114,182,0.1)' },
        ].map((k, i) => (
          <motion.div key={k.label} className="panel panel-glow" style={{ padding: 24 }} {...an(i)}>
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
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <motion.div className="panel" style={{ padding: 24 }} {...an(4)}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Revenue Growth (MRR)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'var(--purple)' }} cursor={{ stroke: 'var(--border)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2.5} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div className="panel" style={{ padding: 24 }} {...an(5)}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>System Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { name: 'Database Cluster', status: 'Healthy', color: 'var(--green)' },
              { name: 'Payment Gateway', status: 'Operational', color: 'var(--green)' },
              { name: 'AI Analytics Engine', status: 'High Load', color: 'var(--amber)' },
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
