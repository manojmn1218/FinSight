import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { BarChart3, TrendingUp, TrendingDown, Wallet, FileText, ArrowRight, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORY_CONFIG } from '../utils/types';
import { computeMonthSummaries } from '../utils/transactionParser';
import type { Category } from '../utils/types';
import { motion } from 'framer-motion';

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function ReportsPage() {
  const { data, totalExpenses, savingsAmount } = useFinance();
  const txns = useMemo(() => data.transactions || [], [data.transactions]);
  const hasTxns = txns.length > 0;

  // Monthly summaries
  const monthlySummaries = useMemo(() => computeMonthSummaries(txns), [txns]);

  // Category breakdown from transactions
  const categoryData = useMemo(() => {
    if (!hasTxns) {
      return data.expenses.filter(e => e.amount > 0).map(e => ({
        name: e.name, spent: e.amount, color: e.color,
      }));
    }
    const cats: Record<string, number> = {};
    for (const tx of txns) {
      if (tx.amount < 0) {
        cats[tx.category] = (cats[tx.category] || 0) + Math.abs(tx.amount);
      }
    }
    return Object.entries(cats)
      .map(([name, spent]) => ({
        name, spent: Math.round(spent),
        color: CATEGORY_CONFIG[name as keyof typeof CATEGORY_CONFIG]?.color || '#94a3b8',
      }))
      .sort((a, b) => b.spent - a.spent);
  }, [hasTxns, txns, data.expenses]);

  // Monthly income vs expense
  const monthlyData = useMemo(() => {
    if (!hasTxns) return [];
    const months: Record<string, { income: number; expenses: number }> = {};
    for (const tx of txns) {
      const key = tx.date.slice(0, 7);
      if (!months[key]) months[key] = { income: 0, expenses: 0 };
      if (tx.amount >= 0) months[key].income += tx.amount;
      else months[key].expenses += Math.abs(tx.amount);
    }
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: Math.round(d.income), expenses: Math.round(d.expenses),
      }));
  }, [hasTxns, txns]);

  // Summary stats
  const txSummary = useMemo(() => {
    if (!hasTxns) return null;
    const income = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expense;
    const topCategory = categoryData.length > 0 ? categoryData[0] : null;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
    return { income, expense, net, topCategory, count: txns.length, savingsRate };
  }, [hasTxns, txns, categoryData]);

  // Budget recommendations
  const budgetRecs = useMemo(() => {
    if (!txSummary) return [];
    const recs: { icon: any; title: string; desc: string; type: 'success' | 'warning' | 'danger' }[] = [];

    // Savings recommendation
    if (txSummary.savingsRate >= 20) {
      recs.push({
        icon: CheckCircle2,
        title: `Savings rate: ${txSummary.savingsRate}%`,
        desc: `You're saving ${txSummary.savingsRate}% of your income — above the recommended 20%. Consider investing surplus into mutual funds or FDs for better returns.`,
        type: 'success',
      });
    } else if (txSummary.savingsRate >= 0) {
      recs.push({
        icon: AlertTriangle,
        title: `Savings rate: ${txSummary.savingsRate}%`,
        desc: `Your savings rate is below the recommended 20%. You need to save an additional ${fmt(txSummary.income * 0.2 - txSummary.net)} per period. Review your top spending categories for potential cuts.`,
        type: 'warning',
      });
    } else {
      recs.push({
        icon: AlertTriangle,
        title: `Deficit: Spending exceeds income`,
        desc: `You're spending ${fmt(Math.abs(txSummary.net))} more than you earn. This is unsustainable. Immediately reduce non-essential expenses and consider increasing income sources.`,
        type: 'danger',
      });
    }

    // Top category recommendation
    if (txSummary.topCategory && txSummary.expense > 0) {
      const topPct = Math.round((txSummary.topCategory.spent / txSummary.expense) * 100);
      if (topPct > 40) {
        recs.push({
          icon: AlertTriangle,
          title: `${txSummary.topCategory.name}: ${topPct}% of spending`,
          desc: `Your spending on ${txSummary.topCategory.name} (${fmt(txSummary.topCategory.spent)}) makes up ${topPct}% of all expenses — this is concentrated risk. Set a monthly budget cap for this category.`,
          type: 'warning',
        });
      } else {
        recs.push({
          icon: CheckCircle2,
          title: `Spending is well-distributed`,
          desc: `Your top category ${txSummary.topCategory.name} accounts for ${topPct}% of spending — a healthy distribution. Keep monitoring for unexpected changes.`,
          type: 'success',
        });
      }
    }

    // Monthly trend recommendation
    if (monthlySummaries.length >= 2) {
      const last = monthlySummaries[monthlySummaries.length - 1];
      const prev = monthlySummaries[monthlySummaries.length - 2];
      const change = prev.totalExpenses > 0 ? Math.round(((last.totalExpenses - prev.totalExpenses) / prev.totalExpenses) * 100) : 0;
      if (change > 15) {
        recs.push({
          icon: AlertTriangle,
          title: `Spending increased ${change}% month-over-month`,
          desc: `Your expenses went from ${fmt(prev.totalExpenses)} to ${fmt(last.totalExpenses)} — a ${change}% increase. Investigate what changed and set alerts for budget limits.`,
          type: 'warning',
        });
      } else if (change < -10) {
        recs.push({
          icon: CheckCircle2,
          title: `Spending decreased ${Math.abs(change)}% month-over-month`,
          desc: `Great work! You reduced spending from ${fmt(prev.totalExpenses)} to ${fmt(last.totalExpenses)}. Keep this momentum going.`,
          type: 'success',
        });
      }
    }

    return recs;
  }, [txSummary, monthlySummaries]);

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };
  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Financial Reports</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          {hasTxns
            ? `Insights from ${txSummary?.count} parsed transactions.`
            : 'Detailed breakdown of your spending vs budget.'}
        </p>
      </div>

      {/* Summary Cards */}
      {txSummary && (
        <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} {...an(0)}>
          <div className="panel panel-glow" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={18} color="#34d399" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Total Income</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{fmt(txSummary.income)}</p>
          </div>
          <div className="panel panel-glow" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(244,114,182,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown size={18} color="#f472b6" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Total Expenses</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--pink)' }}>{fmt(txSummary.expense)}</p>
          </div>
          <div className="panel panel-glow" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `rgba(${txSummary.net >= 0 ? '52,211,153' : '248,113,113'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color={txSummary.net >= 0 ? '#34d399' : '#f87171'} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Net Savings</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: txSummary.net >= 0 ? 'var(--green)' : 'var(--red)' }}>{txSummary.net >= 0 ? '+' : '-'}{fmt(txSummary.net)}</p>
          </div>
          <div className="panel panel-glow" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart3 size={18} color="#818cf8" />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Top Category</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{txSummary.topCategory?.name || '—'}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{txSummary.topCategory ? fmt(txSummary.topCategory.spent) : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: hasTxns ? '3fr 2fr' : '1fr', gap: 16 }}>
        {hasTxns && monthlyData.length > 0 && (
          <motion.div className="panel" style={{ padding: 24 }} {...an(1)}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={18} color="var(--purple)" /> Monthly Income vs Expenses
            </h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip cursor={{ fill: 'rgba(129,140,248,0.04)' }} contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                  <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                  <Bar dataKey="income" name="Income" fill="#34d399" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f472b6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        <motion.div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }} {...an(2)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="var(--purple)" /> Spending by Category
          </h3>
          {categoryData.length > 0 ? (
            <>
              <div style={{ flex: 1, minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="spent" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                      {categoryData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                {categoryData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text2)' }}>{d.name}</span>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{fmt(d.spent)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text3)', fontSize: 14 }}>
              <BarChart3 size={36} />
              <p>No expense data to display.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly Summary Table */}
      {monthlySummaries.length > 0 && (
        <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} {...an(3)}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>📅 Detailed Monthly Breakdown</h3>
            <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}>
              {monthlySummaries.length} months
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Txn Count</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Savings</th>
                  <th>Savings Rate</th>
                  <th>Top Category</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map(s => {
                  // Count txns in this month
                  const monthTxnCount = txns.filter(t => t.date.startsWith(s.month)).length;
                  const topCat = Object.entries(s.categoryBreakdown).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
                  const sRate = s.totalIncome > 0 ? Math.round((s.netSavings / s.totalIncome) * 100) : 0;
                  const topCatCfg = topCat ? CATEGORY_CONFIG[topCat[0] as Category] : null;

                  return (
                    <tr key={s.month}>
                      <td style={{ fontWeight: 600 }}>{s.label}</td>
                      <td style={{ color: 'var(--text2)' }}>{monthTxnCount}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 500 }}>{fmt(s.totalIncome)}</td>
                      <td style={{ color: 'var(--pink)', fontWeight: 500 }}>{fmt(s.totalExpenses)}</td>
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
                {/* Totals row */}
                {monthlySummaries.length > 1 && txSummary && (
                  <tr style={{ fontWeight: 700, background: 'rgba(129,140,248,0.04)' }}>
                    <td>Total</td>
                    <td style={{ color: 'var(--text2)' }}>{txns.length}</td>
                    <td style={{ color: 'var(--green)' }}>{fmt(txSummary.income)}</td>
                    <td style={{ color: 'var(--pink)' }}>{fmt(txSummary.expense)}</td>
                    <td style={{ color: txSummary.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {txSummary.net >= 0 ? '+' : ''}{fmt(txSummary.net)}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: txSummary.savingsRate >= 20 ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                        color: txSummary.savingsRate >= 20 ? '#34d399' : '#f0b429',
                      }}>
                        {txSummary.savingsRate}%
                      </span>
                    </td>
                    <td>—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Budget Recommendations */}
      {budgetRecs.length > 0 && (
        <motion.div {...an(4)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color="var(--amber)" /> Budget Recommendations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {budgetRecs.map((rec, i) => {
              const Icon = rec.icon;
              return (
                <div key={i} className={`alert-card alert-card--${rec.type}`}>
                  <div style={{
                    padding: 8, borderRadius: 10, flexShrink: 0,
                    background: rec.type === 'success' ? 'rgba(52,211,153,0.1)' : rec.type === 'warning' ? 'rgba(240,180,41,0.1)' : 'rgba(248,113,113,0.1)',
                    color: rec.type === 'success' ? 'var(--green)' : rec.type === 'warning' ? 'var(--amber)' : 'var(--red)',
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{rec.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{rec.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Fallback static chart */}
      {!hasTxns && categoryData.length > 0 && (
        <motion.div className="panel" style={{ padding: 24 }} {...an(3)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="var(--purple)" /> Budget Overview (Onboarding Data)
          </h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.map(c => ({ name: c.name, spent: c.spent, budget: Math.round(c.spent * 1.2) }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip cursor={{ fill: 'rgba(129,140,248,0.04)' }} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} />
                <Bar dataKey="spent" name="Actual Spent" fill="#f472b6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="budget" name="Budget Allocated" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Upload CTA */}
      {!hasTxns && (
        <Link to="/transactions" className="panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={22} color="var(--purple)" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Get detailed reports from your bank statements</h4>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Upload a PDF to see real income vs expense charts, category breakdowns, and more.</p>
          </div>
          <ArrowRight size={18} color="var(--text3)" />
        </Link>
      )}
    </div>
  );
}
