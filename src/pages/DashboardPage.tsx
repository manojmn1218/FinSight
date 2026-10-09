import React, { useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Edit2, Upload, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, Calendar, Landmark, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_CONFIG } from '../utils/types';
import { computeMonthSummaries, detectRecurringGrouped } from '../utils/transactionParser';
import type { Transaction, Category } from '../utils/types';

const fmt = (n: number) => (n < 0 ? '-' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

// ─── Budget Health Score ───
function HealthGauge({ score, label }: { score: number; label: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#34d399' : score >= 50 ? '#f0b429' : '#f87171';

  return (
    <div className="health-gauge" style={{ width: 140, height: 140 }}>
      <svg className="health-gauge-ring" width="140" height="140">
        <circle className="health-gauge-bg" cx="70" cy="70" r={r} />
        <circle className="health-gauge-fill" cx="70" cy="70" r={r}
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="health-gauge-label">
        <span style={{ fontSize: 28, fontWeight: 800, color }}>{score}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data } = useFinance();
  const txns: Transaction[] = useMemo(() => data.transactions || [], [data.transactions]);
  const hasTxns = txns.length > 0;

  // ─── Compute everything from transactions ───
  const txnStats = useMemo(() => {
    if (!hasTxns) return null;

    const totalIncome = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpenses = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const netCashFlow = totalIncome - totalExpenses;

    // Current balance
    const sortedTxns = [...txns].sort((a, b) => a.date.localeCompare(b.date));
    const lastTxnWithBal = [...sortedTxns].reverse().find(t => t.balance != null);
    const currentBalance = lastTxnWithBal?.balance ?? netCashFlow;

    // Category breakdown
    const catMap: Record<string, number> = {};
    txns.filter(t => t.amount < 0).forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
    });
    const categoryBreakdown = Object.entries(catMap)
      .map(([cat, amount]) => ({
        name: cat,
        value: Math.round(amount),
        color: CATEGORY_CONFIG[cat as Category]?.color || '#64748b',
        icon: CATEGORY_CONFIG[cat as Category]?.icon || '📌',
      }))
      .sort((a, b) => b.value - a.value);

    // Monthly data
    const monthMap = new Map<string, { income: number; expenses: number; balance: number | null }>();
    for (const tx of sortedTxns) {
      const month = tx.date.slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { income: 0, expenses: 0, balance: null });
      const m = monthMap.get(month)!;
      if (tx.amount >= 0) m.income += tx.amount;
      else m.expenses += Math.abs(tx.amount);
      if (tx.balance != null) m.balance = tx.balance;
    }
    const monthlyData = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => {
        const date = new Date(month + '-01');
        return {
          name: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          month,
          income: Math.round(d.income),
          expenses: Math.round(d.expenses),
          net: Math.round(d.income - d.expenses),
          balance: d.balance != null ? Math.round(d.balance) : null,
        };
      });

    // Date range
    const dates = txns.map(t => t.date).sort();
    const dateFrom = dates[0];
    const dateTo = dates[dates.length - 1];

    // Savings rate
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    // Avg daily spending
    const dayCount = Math.max(1, Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const avgDailySpending = Math.round(totalExpenses / dayCount);

    // Top expenses
    const topExpenses = [...txns]
      .filter(t => t.amount < 0)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);

    // Budget Health Score (0-100)
    const savingsScore = Math.min(40, savingsRate * 2);
    const concentrationScore = (() => {
      if (categoryBreakdown.length === 0 || totalExpenses === 0) return 20;
      const topPct = categoryBreakdown[0].value / totalExpenses;
      return Math.min(20, Math.round((1 - topPct) * 30));
    })();
    const trendScore = (() => {
      if (monthlyData.length < 2) return 20;
      const last = monthlyData[monthlyData.length - 1].expenses;
      const prev = monthlyData[monthlyData.length - 2].expenses;
      if (prev === 0) return 20;
      const change = (last - prev) / prev;
      return Math.min(20, Math.max(0, Math.round((1 - change) * 20)));
    })();
    const balanceScore = currentBalance > 0 ? Math.min(20, Math.round((currentBalance / (totalExpenses || 1)) * 10)) : 0;
    const healthScore = Math.min(100, Math.max(0, savingsScore + concentrationScore + trendScore + balanceScore));

    return {
      totalIncome: Math.round(totalIncome),
      totalExpenses: Math.round(totalExpenses),
      netCashFlow: Math.round(netCashFlow),
      currentBalance: Math.round(currentBalance),
      categoryBreakdown,
      monthlyData,
      topExpenses,
      savingsRate,
      avgDailySpending,
      dateFrom,
      dateTo,
      txnCount: txns.length,
      healthScore,
    };
  }, [txns, hasTxns]);

  // Recurring payments
  const recurringGroups = useMemo(() => {
    if (!hasTxns) return [];
    return detectRecurringGrouped(txns);
  }, [txns, hasTxns]);

  // Monthly summaries
  const monthlySummaries = useMemo(() => {
    if (!hasTxns) return [];
    return computeMonthSummaries(txns);
  }, [txns, hasTxns]);

  // Fallback values
  const totalExpensesFallback = data.expenses.reduce((s, e) => s + e.amount, 0);
  const savingsAmountFallback = Math.round((data.monthlyIncome * data.savingsPercent) / 100);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };

  // ═══════════════════════════════════════════════
  // TRANSACTION-DRIVEN DASHBOARD
  // ═══════════════════════════════════════════════
  if (hasTxns && txnStats) {
    const stats = [
      {
        label: 'Total Income', value: fmt(txnStats.totalIncome), icon: TrendingUp,
        clr: '#34d399', bg: 'rgba(52,211,153,0.1)',
        badge: `${txnStats.savingsRate}% saved`, badgeBg: 'rgba(52,211,153,0.1)', badgeClr: '#34d399',
        badgeIcon: ArrowUpRight,
      },
      {
        label: 'Total Expenses', value: fmt(txnStats.totalExpenses), icon: CreditCard,
        clr: '#f472b6', bg: 'rgba(244,114,182,0.1)',
        badge: txnStats.categoryBreakdown[0]?.name || 'Expenses', badgeBg: 'rgba(244,114,182,0.1)', badgeClr: '#f472b6',
        badgeIcon: ArrowDownRight,
      },
      {
        label: 'Net Cash Flow', value: fmt(txnStats.netCashFlow),
        icon: txnStats.netCashFlow >= 0 ? TrendingUp : TrendingDown,
        clr: txnStats.netCashFlow >= 0 ? '#34d399' : '#f87171',
        bg: txnStats.netCashFlow >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
        badge: txnStats.netCashFlow >= 0 ? 'Surplus' : 'Deficit',
        badgeBg: txnStats.netCashFlow >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
        badgeClr: txnStats.netCashFlow >= 0 ? '#34d399' : '#f87171',
      },
      {
        label: 'Current Balance', value: fmt(txnStats.currentBalance), icon: Wallet,
        clr: '#818cf8', bg: 'rgba(129,140,248,0.1)',
        badge: `${txnStats.txnCount} txns`, badgeBg: 'rgba(129,140,248,0.1)', badgeClr: '#818cf8',
      },
    ];

    const dateRange = (() => {
      const from = new Date(txnStats.dateFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const to = new Date(txnStats.dateTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return `${from} – ${to}`;
    })();

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header */}
        <motion.div {...an(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              {greeting}, <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.userName || 'there'}</span> 👋
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text2)' }}>
              <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {dateRange} · {txnStats.txnCount} transactions analyzed
            </p>
          </div>
          <Link to="/transactions" className="btn-outline" style={{ padding: '9px 18px', fontSize: 13 }}>
            <Upload size={15} /> Upload More
          </Link>
        </motion.div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} className="panel panel-glow" style={{ padding: 20 }} {...an(i + 1)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.clr }}>
                  <s.icon size={20} />
                </div>
                {s.badge && (
                  <span className="badge" style={{ background: s.badgeBg, color: s.badgeClr }}>
                    {s.badgeIcon && <s.badgeIcon size={11} />}{s.badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Income vs Expenses Bar + Budget Health Score */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16 }}>
          {/* Spending Progress */}
          <motion.div className="panel" style={{ padding: 20 }} {...an(5)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
                📊 Income vs Expenses
              </h3>
              <span className="badge" style={{
                background: txnStats.savingsRate >= 20 ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                color: txnStats.savingsRate >= 20 ? 'var(--green)' : 'var(--amber)'
              }}>
                {txnStats.savingsRate >= 20 ? '✅ Healthy' : '⚠️ Low savings'}
              </span>
            </div>
            <div style={{ width: '100%', height: 10, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{
                height: '100%',
                width: `${Math.min(txnStats.totalIncome > 0 ? (txnStats.totalExpenses / txnStats.totalIncome) * 100 : 0, 100)}%`,
                borderRadius: 6,
                background: (txnStats.totalExpenses / (txnStats.totalIncome || 1)) > 0.8 ? 'linear-gradient(90deg, #f472b6, #f87171)' : 'var(--grad)',
                boxShadow: '0 0 12px rgba(129,140,248,0.3)',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
              <span>Income: <strong style={{ color: 'var(--green)' }}>{fmt(txnStats.totalIncome)}</strong></span>
              <span>Expenses: <strong style={{ color: 'var(--pink)' }}>{fmt(txnStats.totalExpenses)}</strong></span>
              <span>Saved: <strong style={{ color: txnStats.netCashFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(txnStats.netCashFlow)}</strong></span>
              <span>Avg daily: <strong style={{ color: 'var(--text)' }}>{fmt(txnStats.avgDailySpending)}</strong></span>
            </div>
          </motion.div>

          {/* Health Score Gauge */}
          <motion.div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 180, position: 'relative', overflow: 'hidden' }} {...an(5)}>
            {data.currentPlan === 'Basic' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, textAlign: 'center', padding: '10px 0' }}>
                <Lock size={20} color="var(--purple)" />
                <span style={{ fontSize: 13, fontWeight: 700 }}>Health Score</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.4 }}>Available on Pro plan</span>
                <Link to="/premium" className="badge" style={{ background: 'var(--grad)', color: '#fff', padding: '4px 10px', marginTop: 4 }}>Unlock ⚡</Link>
              </div>
            ) : (
              <>
                <HealthGauge score={txnStats.healthScore} label="Health" />
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>
                  {txnStats.healthScore >= 75 ? 'Excellent financial health' : txnStats.healthScore >= 50 ? 'Room for improvement' : 'Needs attention'}
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
          {/* Monthly Bar Chart */}
          <motion.div className="panel" style={{ padding: 20 }} {...an(6)}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Monthly Trend</h3>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={txnStats.monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown, n: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, String(n).charAt(0).toUpperCase() + String(n).slice(1)]} />
                  <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} name="Income" />
                  <Bar dataKey="expenses" fill="#f472b6" radius={[4, 4, 0, 0]} barSize={20} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Category Pie Chart */}
          <motion.div className="panel" style={{ padding: 20, display: 'flex', flexDirection: 'column' }} {...an(7)}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown</h3>
            {txnStats.categoryBreakdown.length > 0 ? (
              <>
                <div style={{ flex: 1, minHeight: 190 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={txnStats.categoryBreakdown} dataKey="value" innerRadius={48} outerRadius={76} paddingAngle={4} strokeWidth={0}>
                        {txnStats.categoryBreakdown.map(e => <Cell key={e.name} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                  {txnStats.categoryBreakdown.slice(0, 6).map(d => {
                    const pct = txnStats.totalExpenses > 0 ? Math.round((d.value / txnStats.totalExpenses) * 100) : 0;
                    return (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: 'var(--text2)' }}>{d.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>{pct}%</span>
                        <span style={{ fontWeight: 600, fontSize: 12 }}>{fmt(d.value)}</span>
                      </div>
                    );
                  })}
                  {txnStats.categoryBreakdown.length > 6 && (
                    <Link to="/analytics" style={{ fontSize: 11, color: 'var(--purple)', textAlign: 'center', marginTop: 4 }}>
                      +{txnStats.categoryBreakdown.length - 6} more →
                    </Link>
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', fontSize: 13 }}>
                <Sparkles size={28} />
                <p>No expense transactions found.</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Net Savings Trend */}
        {txnStats.monthlyData.length > 1 && (
          <motion.div className="panel" style={{ padding: 20 }} {...an(8)}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Net Savings Trend</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={txnStats.monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Net Savings']} />
                  <Area type="monotone" dataKey="net" stroke="#818cf8" strokeWidth={2} fill="url(#gNet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* AI Insight */}
        {data.currentPlan === 'Basic' ? (
          <motion.div className="panel" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px 20px', borderLeft: '3px solid var(--purple)' }} {...an(9)}>
            <Lock size={18} color="var(--purple)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', marginBottom: 2 }}>AI Spending Insights</h4>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>Get automated spending insights and anomaly detection with the Pro plan.</p>
            </div>
            <Link to="/premium" className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>Unlock</Link>
          </motion.div>
        ) : (
          <motion.div className="panel" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 20px', borderLeft: '3px solid var(--amber)' }} {...an(9)}>
            <Sparkles size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--amber)' }}>AI Insight</h4>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                {(() => {
                  const topCat = txnStats.categoryBreakdown[0];
                  const spendPct = txnStats.totalIncome > 0 ? Math.round((txnStats.totalExpenses / txnStats.totalIncome) * 100) : 0;
                  if (spendPct > 90)
                    return `⚠️ You're spending ${spendPct}% of your income. ${topCat ? `Biggest: ${topCat.name} (${fmt(topCat.value)}). ` : ''}Reduce discretionary spending to build an emergency fund.`;
                  if (spendPct > 70)
                    return `You're spending ${spendPct}% of your income. ${topCat ? `${topCat.name} leads at ${fmt(topCat.value)}. ` : ''}Aim to bring spending below 70% for a healthy savings buffer.`;
                  return `Great job! Saving ${txnStats.savingsRate}% of income (${fmt(txnStats.netCashFlow)} net). ${topCat ? `Top spend: ${topCat.name} at ${fmt(topCat.value)}. ` : ''}Avg daily: ${fmt(txnStats.avgDailySpending)}.`;
                })()}
              </p>
            </div>
          </motion.div>
        )}

        {/* Recurring Payment Alerts */}
        {recurringGroups.length > 0 && (
          <motion.div className="panel" style={{ padding: 20, position: 'relative', overflow: 'hidden' }} {...an(10)}>
            {data.currentPlan === 'Basic' && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.85)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, textAlign: 'center' }}>
                <Lock size={24} color="var(--purple)" />
                <h4 style={{ fontSize: 15, fontWeight: 700 }}>Smart Recurring Payment Detection</h4>
                <p style={{ fontSize: 12, color: 'var(--text2)', maxWidth: 320, lineHeight: 1.5 }}>Unlock subscription tracking, alerts for price increases, and potential annual saving estimates.</p>
                <Link to="/premium" className="btn-primary" style={{ padding: '8px 20px', fontSize: 13, marginTop: 4 }}>Upgrade to Pro</Link>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
                <RefreshCw size={16} color="var(--purple)" /> Recurring Payments
                <span className="notif-badge" style={{ marginLeft: 4 }}>{recurringGroups.length}</span>
              </h3>
              <Link to="/analytics" className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>Details <ArrowRight size={12} /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recurringGroups.slice(0, 5).map((rg, i) => {
                const cfg = CATEGORY_CONFIG[rg.category];
                return (
                  <div key={i} className={`alert-card ${rg.isHighCost ? 'alert-card--warning' : 'alert-card--info'}`}>
                    <span style={{ fontSize: 18, marginTop: 2 }}>{cfg?.icon || '📌'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rg.description}</span>
                        {rg.isHighCost && (
                          <span className="badge" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', fontSize: 10 }}>
                            <AlertTriangle size={10} /> High Cost
                          </span>
                        )}
                        {!rg.isHighCost && (
                          <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)', fontSize: 10 }}>
                            <CheckCircle2 size={10} /> OK
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text3)' }}>
                        <span>{rg.frequency} · {rg.occurrences}x detected</span>
                        <span>{rg.category}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(rg.avgAmount)}<span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>/ea</span></div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>~{fmt(rg.estimatedAnnualCost)}/yr</div>
                    </div>
                  </div>
                );
              })}
              {recurringGroups.length > 5 && (
                <Link to="/analytics" style={{ fontSize: 12, color: 'var(--purple)', textAlign: 'center', padding: 8 }}>
                  View all {recurringGroups.length} recurring payments →
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* Top Expenses + Recent Transactions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <motion.div className="panel" style={{ padding: 20 }} {...an(11)}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔥 Top Expenses</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {txnStats.topExpenses.map((tx, i) => {
                const cfg = CATEGORY_CONFIG[tx.category];
                return (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < txnStats.topExpenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{cfg?.icon || '📌'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} · {tx.category}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'var(--pink)' }}>
                      {fmt(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div className="panel" style={{ padding: 20 }} {...an(12)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Transactions</h3>
              <Link to="/transactions" className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>View All <ArrowRight size={12} /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {txns.slice(-5).reverse().map((tx, i) => {
                const cfg = CATEGORY_CONFIG[tx.category];
                return (
                  <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>{cfg?.icon || '📌'}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                      </div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13, fontVariantNumeric: 'tabular-nums', color: tx.amount >= 0 ? 'var(--green)' : 'var(--text)' }}>
                      {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Monthly Summary Table */}
        {monthlySummaries.length > 0 && (
          <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} {...an(13)}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>📅 Monthly Summary</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Net Savings</th>
                    <th>Savings Rate</th>
                    <th>Top Category</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaries.map(s => {
                    const topCat = Object.entries(s.categoryBreakdown).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
                    const sRate = s.totalIncome > 0 ? Math.round((s.netSavings / s.totalIncome) * 100) : 0;
                    const topCatCfg = topCat ? CATEGORY_CONFIG[topCat[0] as Category] : null;
                    return (
                      <tr key={s.month}>
                        <td style={{ fontWeight: 600 }}>{s.label}</td>
                        <td style={{ color: 'var(--green)' }}>{fmt(s.totalIncome)}</td>
                        <td style={{ color: 'var(--pink)' }}>{fmt(s.totalExpenses)}</td>
                        <td style={{ color: s.netSavings >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {s.netSavings >= 0 ? '+' : ''}{fmt(s.netSavings)}
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: sRate >= 20 ? 'rgba(52,211,153,0.1)' : sRate >= 0 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                            color: sRate >= 20 ? '#34d399' : sRate >= 0 ? '#f0b429' : '#f87171',
                          }}>
                            {sRate}%
                          </span>
                        </td>
                        <td>
                          {topCat ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                              <span>{topCatCfg?.icon || '📌'}</span>
                              {topCat[0]}
                              <span style={{ color: 'var(--text3)', marginLeft: 4 }}>{fmt(topCat[1] as number)}</span>
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // FALLBACK: No transactions — show upload CTA
  // ═══════════════════════════════════════════════
  const pieData = data.expenses.filter(e => e.amount > 0).map(e => ({ name: e.name, value: e.amount, color: e.color }));
  const usedPct = data.monthlyIncome > 0 ? Math.round((totalExpensesFallback / data.monthlyIncome) * 100) : 0;

  const fallbackStats = [
    { label: 'Total Balance', value: fmt(data.totalBalance), icon: Wallet, clr: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    { label: 'Monthly Income', value: fmt(data.monthlyIncome), icon: TrendingUp, clr: '#34d399', bg: 'rgba(52,211,153,0.1)', badge: 'Income', badgeBg: 'rgba(52,211,153,0.1)', badgeClr: '#34d399' },
    { label: 'Total Expenses', value: fmt(totalExpensesFallback), icon: CreditCard, clr: '#f472b6', bg: 'rgba(244,114,182,0.1)', badge: `${usedPct}%`, badgeBg: 'rgba(244,114,182,0.1)', badgeClr: '#f472b6' },
    { label: 'Savings Target', value: fmt(savingsAmountFallback), icon: TrendingUp, clr: '#34d399', bg: 'rgba(52,211,153,0.1)', badge: `${data.savingsPercent}%`, badgeBg: 'rgba(52,211,153,0.1)', badgeClr: '#34d399' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <motion.div {...an(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
            {greeting}, <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{data.userName || 'there'}</span> 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Upload a bank statement or connect your account to see your real financial data here.</p>
        </div>
        <Link to="/profile" className="btn-outline" style={{ padding: '9px 18px', fontSize: 13 }}>
          <Edit2 size={15} /> Edit Data
        </Link>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {fallbackStats.map((s, i) => (
          <motion.div key={s.label} className="panel panel-glow" style={{ padding: 20 }} {...an(i + 1)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.clr }}>
                <s.icon size={20} />
              </div>
              {s.badge && (
                <span className="badge" style={{ background: s.badgeBg, color: s.badgeClr }}>
                  {s.badge === 'Income' && <ArrowUpRight size={11} />}{s.badge}
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Upload CTA — Enhanced */}
      <motion.div className="panel" style={{ padding: '36px 32px', textAlign: 'center', background: 'var(--grad-subtle)' }} {...an(5)}>
        <Upload size={44} color="var(--purple)" style={{ marginBottom: 16, opacity: 0.8 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Unlock Your Financial Dashboard</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>
          Upload your bank statement PDF or connect your bank account directly to get automatic expense categorization, monthly summaries, budget health scoring, and recurring payment alerts.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/transactions" className="btn-primary" style={{ padding: '12px 28px' }}>
            <Upload size={16} /> Upload Bank Statement
          </Link>
          <Link to="/transactions?connect=true" className="btn-outline" style={{ padding: '12px 28px', borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa' }}>
            <Landmark size={16} /> Connect Bank Account
          </Link>
          <Link to="/profile" className="btn-outline" style={{ padding: '12px 28px' }}>
            <Edit2 size={16} /> Enter Data Manually
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, fontSize: 12, color: 'var(--text3)' }}>
          {['📊 Category Analytics', '📅 Monthly Summaries', '🔁 Recurring Alerts', '💡 AI Insights', '📤 Export Reports'].map(f => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </motion.div>

      {/* Pie chart if profile data exists */}
      {pieData.length > 0 && (
        <motion.div className="panel" style={{ padding: 20 }} {...an(6)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Expense Breakdown (Profile Data)</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={76} paddingAngle={4} strokeWidth={0}>
                  {pieData.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
