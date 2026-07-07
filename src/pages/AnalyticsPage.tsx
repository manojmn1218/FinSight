import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, Sparkles, BarChart3, RefreshCw, ArrowRight, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { computeMonthSummaries, detectRecurringGrouped } from '../utils/transactionParser';
import { CATEGORY_CONFIG } from '../utils/types';
import type { Category } from '../utils/types';
import { Link } from 'react-router-dom';

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN');

export default function AnalyticsPage() {
  const { data } = useFinance();
  const txns = data.transactions || [];

  const summaries = useMemo(() => computeMonthSummaries(txns), [txns]);
  const recurringGroups = useMemo(() => detectRecurringGrouped(txns), [txns]);

  // Category totals for pie
  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    txns.filter(t => t.amount < 0).forEach(t => { map[t.category] = (map[t.category] || 0) + Math.abs(t.amount); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([cat, val]) => ({
      name: cat,
      value: Math.round(val),
      color: CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG]?.color || '#64748b',
    }));
  }, [txns]);

  // Cumulative savings over time
  const savingsTimeline = useMemo(() => {
    let cumulative = 0;
    return summaries.map(s => {
      cumulative += s.netSavings;
      return { name: s.label, savings: cumulative };
    });
  }, [summaries]);

  // Group recurring by category
  const recurringByCategory = useMemo(() => {
    const map = new Map<string, { items: typeof recurringGroups; total: number }>();
    for (const rg of recurringGroups) {
      if (!map.has(rg.category)) map.set(rg.category, { items: [], total: 0 });
      const entry = map.get(rg.category)!;
      entry.items.push(rg);
      entry.total += rg.estimatedAnnualCost;
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [recurringGroups]);

  const totalRecurringAnnual = recurringGroups.reduce((s, rg) => s + rg.estimatedAnnualCost, 0);
  const highCostCount = recurringGroups.filter(rg => rg.isHighCost).length;

  // Budget recommendations
  const recommendations = useMemo(() => {
    if (txns.length === 0) return [];
    const recs: { title: string; desc: string; color: string; bg: string }[] = [];

    if (catTotals.length > 0) {
      const top = catTotals[0];
      recs.push({
        title: `Top Expense: ${top.name}`,
        desc: `You've spent ${fmt(top.value)} on ${top.name}. This is your largest spending category. Consider setting a monthly cap.`,
        color: CATEGORY_CONFIG[top.name as keyof typeof CATEGORY_CONFIG]?.color || '#818cf8',
        bg: CATEGORY_CONFIG[top.name as keyof typeof CATEGORY_CONFIG]?.bg || 'rgba(129,140,248,0.08)',
      });
    }

    if (recurringGroups.length > 0) {
      recs.push({
        title: `${recurringGroups.length} Recurring Payments (~${fmt(totalRecurringAnnual)}/yr)`,
        desc: `You have ${recurringGroups.length} recurring charges totaling an estimated ₹${Math.round(totalRecurringAnnual).toLocaleString('en-IN')}/year.${highCostCount > 0 ? ` ${highCostCount} are flagged as high-cost — review them for potential savings.` : ' All seem reasonable.'}`,
        color: highCostCount > 0 ? '#f0b429' : '#34d399',
        bg: highCostCount > 0 ? 'rgba(240,180,41,0.08)' : 'rgba(52,211,153,0.08)',
      });
    }

    const totalInc = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExp = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate = totalInc > 0 ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0;
    recs.push({
      title: savingsRate >= 20 ? '🎉 Great Savings Rate!' : '⚠️ Low Savings Rate',
      desc: savingsRate >= 20
        ? `Your savings rate is ${savingsRate}%. That's above the recommended 20%. Keep it up!`
        : `Your savings rate is only ${savingsRate}%. Financial experts recommend saving at least 20% of income.`,
      color: savingsRate >= 20 ? '#34d399' : '#f87171',
      bg: savingsRate >= 20 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
    });

    return recs;
  }, [txns, catTotals, recurringGroups, totalRecurringAnnual, highCostCount]);

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };
  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  if (txns.length === 0) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center' }}>
        <BarChart3 size={48} color="var(--text3)" />
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>No Transaction Data</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 400 }}>Upload a bank statement in the Transactions tab to unlock spending analytics, trend charts, and budget recommendations.</p>
        <Link to="/transactions" className="btn-primary" style={{ marginTop: 8 }}>Go to Transactions</Link>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Spending Analytics</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Deep insights from your {txns.length} parsed transactions.</p>
      </div>

      {/* Monthly income vs expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        <motion.div className="panel" style={{ padding: 24 }} {...an(0)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="var(--purple)" /> Monthly Income vs Expenses
          </h3>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaries} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, '']} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="totalIncome" name="Income" fill="#34d399" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalExpenses" name="Expenses" fill="#f472b6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category pie */}
        <motion.div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }} {...an(1)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Category Breakdown</h3>
          {catTotals.length > 0 ? (
            <>
              <div style={{ flex: 1, minHeight: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catTotals} dataKey="value" innerRadius={46} outerRadius={72} paddingAngle={3} strokeWidth={0}>
                      {catTotals.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
                {catTotals.slice(0, 6).map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text2)' }}>{d.name}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>No expense data</div>
          )}
        </motion.div>
      </div>

      {/* Savings trend */}
      {savingsTimeline.length > 1 && (
        <motion.div className="panel" style={{ padding: 24 }} {...an(2)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Cumulative Savings Trend</h3>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={savingsTimeline} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Net Savings']} />
                <Area type="monotone" dataKey="savings" stroke="#34d399" strokeWidth={2.5} fill="url(#savGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Budget Recommendations + Recurring Payments (enhanced) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recommendations */}
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} {...an(3)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--amber)" /> AI Recommendations
          </h3>
          {recommendations.map((rec, i) => (
            <div key={i} className="panel" style={{ padding: '16px 20px', borderLeft: `3px solid ${rec.color}` }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: rec.color }}>{rec.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{rec.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Enhanced Recurring Payments */}
        <motion.div className="panel" style={{ padding: 24 }} {...an(4)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={16} color="var(--purple)" /> Recurring Payments
            </h3>
            {recurringGroups.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {highCostCount > 0 && (
                  <span className="badge" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)' }}>
                    <AlertTriangle size={10} /> {highCostCount} high-cost
                  </span>
                )}
                <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}>
                  ~{fmt(totalRecurringAnnual)}/yr
                </span>
              </div>
            )}
          </div>

          {recurringGroups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Grouped by category */}
              {recurringByCategory.map(([category, { items, total }]) => {
                const cfg = CATEGORY_CONFIG[category as Category];
                return (
                  <div key={category}>
                    {/* Category header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0 6px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 14 }}>{cfg?.icon || '📌'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: cfg?.color || 'var(--text2)' }}>{category}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>~{fmt(total)}/yr</span>
                    </div>

                    {/* Items */}
                    {items.map((rg, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0 10px 24px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rg.description}</span>
                            {rg.isHighCost ? (
                              <AlertTriangle size={12} color="var(--amber)" style={{ flexShrink: 0 }} />
                            ) : (
                              <CheckCircle2 size={12} color="var(--green)" style={{ flexShrink: 0 }} />
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                            {rg.frequency} · {rg.occurrences}x · last {new Date(rg.lastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(rg.avgAmount)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text3)' }}>{fmt(rg.estimatedAnnualCost)}/yr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No recurring payments detected.</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
