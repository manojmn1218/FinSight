import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, CreditCard, DollarSign, TrendingUp, ArrowUpRight, PiggyBank, Sparkles, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const panel: React.CSSProperties = { background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' };

export default function DashboardPage() {
  const { data, totalExpenses, savingsAmount, budget } = useFinance();
  const [timeRange, setTimeRange] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [metric, setMetric] = React.useState<'balance' | 'savings' | 'both'>('balance');
  const [selectedDate, setSelectedDate] = React.useState<string>('');

  const netCashFlow = data.monthlyIncome - totalExpenses;
  const currentTotalSavings = data.totalBalance * (data.savingsPercent / 100);
  const chartData = React.useMemo(() => {
    const today = new Date();
    const result = [];
    
    if (timeRange === 'daily') {
      const dailyCashFlow = netCashFlow / 30;
      const dailySavings = savingsAmount / 30;
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const name = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const balance = Math.max(0, Math.round(data.totalBalance - (dailyCashFlow * i)));
        const savings = Math.max(0, Math.round(currentTotalSavings - (dailySavings * i)));
        result.push({ name, balance, savings });
      }
    } else if (timeRange === 'weekly') {
      const weeklyCashFlow = netCashFlow / 4;
      const weeklySavings = savingsAmount / 4;
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i * 7);
        const name = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const balance = Math.max(0, Math.round(data.totalBalance - (weeklyCashFlow * i)));
        const savings = Math.max(0, Math.round(currentTotalSavings - (weeklySavings * i)));
        result.push({ name, balance, savings });
      }
    } else if (timeRange === 'yearly') {
      const yearlyCashFlow = netCashFlow * 12;
      const yearlySavings = savingsAmount * 12;
      for (let i = 4; i >= 0; i--) {
        const name = (today.getFullYear() - i).toString();
        const balance = Math.max(0, Math.round(data.totalBalance - (yearlyCashFlow * i)));
        const savings = Math.max(0, Math.round(currentTotalSavings - (yearlySavings * i)));
        result.push({ name, balance, savings });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const name = d.toLocaleDateString('en-US', { month: 'short' });
        const balance = Math.max(0, Math.round(data.totalBalance - (netCashFlow * i)));
        const savings = Math.max(0, Math.round(currentTotalSavings - (savingsAmount * i)));
        result.push({ name, balance, savings });
      }
    }
    return result;
  }, [data.totalBalance, netCashFlow, timeRange, currentTotalSavings, savingsAmount]);

  const dateStatus = React.useMemo(() => {
    if (!selectedDate) return null;
    const target = new Date(selectedDate);
    const today = new Date();
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffDays = Math.floor((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    
    const dailyCashFlow = netCashFlow / 30;
    const dailySavings = savingsAmount / 30;
    
    const balance = Math.max(0, Math.round(data.totalBalance - (dailyCashFlow * diffDays)));
    const savings = Math.max(0, Math.round(currentTotalSavings - (dailySavings * diffDays)));
    return { balance, savings };
  }, [selectedDate, data.totalBalance, netCashFlow, currentTotalSavings, savingsAmount]);

  const pieData = data.expenses.filter(e => e.amount > 0).map(e => ({ name: e.name, value: e.amount, color: e.color }));

  const usedPct = data.monthlyIncome > 0 ? Math.round((totalExpenses / data.monthlyIncome) * 100) : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Total Balance', value: fmt(data.totalBalance), icon: Wallet, bg: 'rgba(167,139,250,0.12)', clr: '#a78bfa' },
    { label: 'Monthly Income', value: fmt(data.monthlyIncome), icon: TrendingUp, bg: 'rgba(52,211,153,0.12)', clr: '#34d399', badge: 'Income', badgeBg: 'rgba(52,211,153,0.12)', badgeClr: '#34d399' },
    { label: 'Total Expenses', value: fmt(totalExpenses), icon: CreditCard, bg: 'rgba(244,114,182,0.12)', clr: '#f472b6', badge: `${usedPct}%`, badgeBg: 'rgba(244,114,182,0.12)', badgeClr: '#f472b6' },
    { label: 'Monthly Budget', value: fmt(budget), icon: DollarSign, bg: budget >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', clr: budget >= 0 ? '#34d399' : '#f87171', badge: budget >= 0 ? 'Healthy' : 'Over!', badgeBg: budget >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', badgeClr: budget >= 0 ? '#34d399' : '#f87171' },
  ];

  const an = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.35 } });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative' }}>
      {/* Header */}
      <motion.div {...an(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
            {greeting}, <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.userName || 'there'}</span> 👋
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)' }}>Here's your financial snapshot for this month.</p>
        </div>
        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', transition: 'background 0.2s' }}>
          <Edit2 size={16} /> Edit Data
        </Link>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} style={{ ...panel, padding: 22 }} {...an(i + 1)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.clr }}><s.icon size={22} /></div>
              {s.badge && <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: s.badgeBg, color: s.badgeClr, display: 'flex', alignItems: 'center', gap: 3 }}>{s.badge === 'Income' && <ArrowUpRight size={12} />}{s.badge}</span>}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Savings bar */}
      <motion.div style={{ ...panel, padding: 22 }} {...an(5)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}><PiggyBank size={20} /> Savings Goal</h3>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>{data.savingsPercent}% of income</span>
        </div>
        <div style={{ width: '100%', height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ height: '100%', width: `${Math.min(usedPct, 100)}%`, borderRadius: 5, background: 'var(--grad)', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text2)' }}>
          <span>Expenses: {fmt(totalExpenses)}</span>
          <span>Target savings: {fmt(savingsAmount)}</span>
          <span>Remaining: {fmt(budget)}</span>
        </div>
      </motion.div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 18 }}>
        {/* Area chart */}
        <motion.div style={{ ...panel, padding: 22 }} {...an(6)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Trend</h3>
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                {(['balance', 'savings', 'both'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      background: metric === m ? 'var(--surface)' : 'transparent',
                      color: metric === m ? 'var(--text)' : 'var(--text2)',
                      border: 'none',
                      outline: 'none',
                      textTransform: 'capitalize',
                      boxShadow: metric === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, background: 'var(--bg2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: timeRange === t ? 'var(--surface)' : 'transparent',
                    color: timeRange === t ? 'var(--text)' : 'var(--text2)',
                    border: 'none',
                    outline: 'none',
                    textTransform: 'capitalize',
                    boxShadow: timeRange === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, background: 'var(--bg2)', padding: '10px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Check status on:</span>
              <input 
                 type="date" 
                 value={selectedDate} 
                 onChange={(e) => setSelectedDate(e.target.value)}
                 style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', padding: '4px 8px', borderRadius: 6, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            {dateStatus && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Projected Balance: <strong style={{ color: '#a78bfa' }}>{fmt(dateStatus.balance)}</strong></span>
                <span style={{ color: 'var(--text2)' }}>Projected Savings: <strong style={{ color: '#34d399' }}>{fmt(dateStatus.savings)}</strong></span>
              </div>
            )}
          </div>

          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)' }} formatter={(v: number, n: string) => [`₹${v.toLocaleString('en-IN')}`, n.charAt(0).toUpperCase() + n.slice(1)]} />
                {(metric === 'balance' || metric === 'both') && <Area type="monotone" dataKey="balance" stroke="#a78bfa" strokeWidth={2.5} fill="url(#g1)" />}
                {(metric === 'savings' || metric === 'both') && <Area type="monotone" dataKey="savings" stroke="#34d399" strokeWidth={2.5} fill="url(#g2)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div style={{ ...panel, padding: 22, display: 'flex', flexDirection: 'column' }} {...an(7)}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</h3>
          {pieData.length > 0 ? (
            <>
              <div style={{ flex: 1, minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                      {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)' }} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text2)' }}>{d.name}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>
              <Sparkles size={32} />
              <p>No expense data yet.<br />Complete onboarding to see your breakdown.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Tip */}
      <motion.div style={{ ...panel, display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 22px', background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.1)' }} {...an(8)}>
        <Sparkles size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>AI Insight</h4>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            {usedPct > 80
              ? `You're spending ${usedPct}% of your income. Consider cutting discretionary expenses to build your savings buffer.`
              : budget >= 0
                ? `Great job! You're on track to save ₹${savingsAmount.toLocaleString('en-IN')} this month (${data.savingsPercent}% of income). Keep it up!`
                : `Your expenses + savings exceed income. Try adjusting categories to hit your ${data.savingsPercent}% savings target.`}
          </p>
        </div>
      </motion.div>

    </div>
  );
}
