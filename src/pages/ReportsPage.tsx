import React, { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { FileText, ShieldAlert, CheckCircle2, AlertTriangle, Printer, Sparkles, TrendingUp, TrendingDown, BookOpen, Scale, Landmark } from 'lucide-react';
import { CATEGORY_CONFIG } from '../utils/types';
import { computeMonthSummaries } from '../utils/transactionParser';
import type { Category } from '../utils/types';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function ReportsPage() {
  const { data } = useFinance();
  const txns = useMemo(() => data.transactions || [], [data.transactions]);
  const hasTxns = txns.length > 0;

  // Monthly summaries
  const monthlySummaries = useMemo(() => computeMonthSummaries(txns), [txns]);

  // Overall calculations
  const totalIncome = useMemo(() => txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0), [txns]);
  const totalExpenses = useMemo(() => txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0), [txns]);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netWorthRate() / totalIncome) * 100) : 0;

  function netWorthRate() {
    return netSavings;
  }

  // --- Real category-wise spending ---
  const actualCategorySpent = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of txns) {
      if (tx.amount < 0) {
        map[tx.category] = (map[tx.category] || 0) + Math.abs(tx.amount);
      }
    }
    return map;
  }, [txns]);

  // --- Budget Variance calculation ---
  const varianceData = useMemo(() => {
    // Map manual/onboarded category budgets
    const budgets: Record<string, number> = {};
    data.expenses.forEach(e => {
      budgets[e.name] = e.amount;
    });

    // Make sure we include all categories
    const allCategories = new Set([...Object.keys(budgets), ...Object.keys(actualCategorySpent)]);

    return [...allCategories].map(cat => {
      const budgetVal = budgets[cat] || 0;
      const actualVal = actualCategorySpent[cat] || 0;
      const diff = budgetVal - actualVal;
      const status = diff >= 0 ? 'under' : 'over';
      const pctUsed = budgetVal > 0 ? Math.round((actualVal / budgetVal) * 100) : 100;

      return {
        category: cat,
        budget: budgetVal,
        actual: actualVal,
        variance: diff,
        status,
        pctUsed,
      };
    }).sort((a, b) => b.actual - a.actual);
  }, [data.expenses, actualCategorySpent]);

  // --- Executive Audit Opinion / Health metrics ---
  const healthRatios = useMemo(() => {
    const fixedCategories = ['Rent', 'Utilities', 'Bills', 'Education', 'Health'];
    const discretionaryCategories = ['Food & Dining', 'Shopping', 'Transport', 'Subscriptions', 'ATM', 'Other'];

    let fixedSpent = 0;
    let discretionarySpent = 0;

    for (const [cat, amt] of Object.entries(actualCategorySpent)) {
      if (fixedCategories.includes(cat)) {
        fixedSpent += amt;
      } else {
        discretionarySpent += amt;
      }
    }

    const fixedPct = totalExpenses > 0 ? Math.round((fixedSpent / totalExpenses) * 100) : 0;
    const discretionaryPct = totalExpenses > 0 ? Math.round((discretionarySpent / totalExpenses) * 100) : 0;

    // Runway (How many months can user survive on current average spending)
    const avgMonthlyExpense = monthlySummaries.length > 0 ? totalExpenses / monthlySummaries.length : totalExpenses;
    const currentBalance = data.totalBalance || 0;
    const survivalRunway = avgMonthlyExpense > 0 ? (currentBalance / avgMonthlyExpense).toFixed(1) : '0';

    return {
      fixedPct,
      discretionaryPct,
      survivalRunway,
    };
  }, [actualCategorySpent, totalExpenses, monthlySummaries, data.totalBalance]);

  // --- Formal audit opinion generation ---
  const auditOpinion = useMemo(() => {
    if (!hasTxns) {
      return {
        status: 'PENDING',
        text: 'Report generation is pending. Please upload a bank statement PDF in the transactions section to perform a full audit.',
        color: 'var(--text3)',
      };
    }
    if (netSavings < 0) {
      return {
        status: 'DEFICIT ALERT',
        text: `The audit has flagged an active cash deficit. Expenses exceed total income by ${fmt(Math.abs(netSavings))}. Discretionary expenditures represent ${healthRatios.discretionaryPct}% of expenses, signaling potential overhead reduction sectors.`,
        color: 'var(--red)',
      };
    }
    if (savingsRate < 20) {
      return {
        status: 'CAUTION',
        text: `Your account exhibits active savings of ${savingsRate}%. While positive, this remains below the recommended benchmark threshold of 20%. Budget variance analysis identifies over-budget spending that should be adjusted.`,
        color: 'var(--amber)',
      };
    }
    return {
      status: 'HEATHY',
      text: `Your financials reflect a healthy savings rate of ${savingsRate}% (${fmt(netSavings)} surplus). Fixed costs are balanced, and you possess an estimated cash runway of ${healthRatios.survivalRunway} months.`,
      color: 'var(--green)',
    };
  }, [hasTxns, netSavings, savingsRate, healthRatios]);

  const handlePrint = () => {
    window.print();
  };

  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  return (
    <div className="page-enter reports-print-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960, margin: '0 auto' }}>
      
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Financial Statement & Audit</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Formal balance ledger, category budget variance analysis, and liquidity audit.</p>
        </div>
        <button onClick={handlePrint} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }} disabled={!hasTxns}>
          <Printer size={16} /> Print Statement
        </button>
      </div>

      {!hasTxns ? (
        <div className="panel" style={{ padding: '80px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <FileText size={48} color="var(--text3)" />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>No Statement Uploaded</h2>
          <p style={{ color: 'var(--text2)', maxWidth: 440, fontSize: 14, lineHeight: 1.6 }}>
            Formal audit reports, budget variance tables, and liquidity indexes are computed using actual transaction history. Please upload your bank statements.
          </p>
          <Link to="/transactions" className="btn-primary" style={{ padding: '10px 24px' }}>Upload Statement</Link>
        </div>
      ) : (
        <>
          {/* Executive Summary Card (Audit Style) */}
          <motion.div className="panel" style={{ padding: 28, borderLeft: `4px solid ${auditOpinion.color}` }} {...an(0)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 750, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={13} /> EXECUTIVE AUDIT SUMMARY
              </span>
              <span className="badge" style={{ background: `${auditOpinion.color}15`, color: auditOpinion.color, fontSize: 11, fontWeight: 700 }}>
                {auditOpinion.status}
              </span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Auditor's Financial Opinion</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
              "{auditOpinion.text}"
            </p>
          </motion.div>

          {/* Key Financial Ledger & Ratios */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>
            {/* Balance Ledger */}
            <motion.div className="panel" style={{ padding: 24 }} {...an(1)}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Landmark size={15} /> Current Ledger Summary
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Total Statement Income', value: totalIncome, color: 'var(--green)' },
                  { label: 'Total Statement Expenses', value: totalExpenses, color: 'var(--pink)' },
                  { label: 'Operating Net Surplus', value: netSavings, color: netSavings >= 0 ? 'var(--green)' : 'var(--red)', bold: true },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                    <span style={{ color: row.color, fontWeight: row.bold ? 700 : 600 }}>{fmt(row.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Assessment Ratios */}
            <motion.div className="panel" style={{ padding: 24 }} {...an(2)}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Scale size={15} /> Liquidity & Ratios Audit
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>Savings Rate</span>
                  <span style={{ fontWeight: 650 }}>{savingsRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>Fixed Expenses %</span>
                  <span style={{ fontWeight: 650 }}>{healthRatios.fixedPct}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>Discretionary %</span>
                  <span style={{ fontWeight: 650 }}>{healthRatios.discretionaryPct}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>Survival Runway</span>
                  <span style={{ fontWeight: 650, color: Number(healthRatios.survivalRunway) > 3 ? 'var(--green)' : 'var(--amber)' }}>
                    {healthRatios.survivalRunway} months
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Budget Variance Table */}
          <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} {...an(3)}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>📊 Category Budget Variance analysis</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Target Budget</th>
                    <th>Actual Spent</th>
                    <th>Variance (B - A)</th>
                    <th>% Used</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {varianceData.map(v => {
                    const cfg = CATEGORY_CONFIG[v.category as Category];
                    return (
                      <tr key={v.category}>
                        <td style={{ fontWeight: 600 }}>
                          <span style={{ marginRight: 6 }}>{cfg?.icon || '📌'}</span>
                          {v.category}
                        </td>
                        <td>{v.budget > 0 ? fmt(v.budget) : '—'}</td>
                        <td style={{ fontWeight: 500 }}>{fmt(v.actual)}</td>
                        <td style={{ color: v.variance >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {v.variance >= 0 ? '+' : ''}{fmt(v.variance)}
                        </td>
                        <td style={{ fontVariantNumeric: 'tabular-nums' }}>{v.pctUsed}%</td>
                        <td>
                          <span className="badge" style={{
                            background: v.status === 'under' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                            color: v.status === 'under' ? 'var(--green)' : 'var(--red)',
                          }}>
                            {v.status === 'under' ? 'Under Limit' : 'Overspent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Detailed Monthly breakdown */}
          <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} {...an(4)}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>📅 Monthly Breakdown history</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="summary-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Income</th>
                    <th>Expenses</th>
                    <th>Net Balance</th>
                    <th>Savings Margin</th>
                    <th>Top Category Spent</th>
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
                        <td style={{ color: s.netSavings >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 650 }}>
                          {s.netSavings >= 0 ? '+' : ''}{fmt(s.netSavings)}
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: sRate >= 20 ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                            color: sRate >= 20 ? 'var(--green)' : 'var(--amber)',
                          }}>
                            {sRate}%
                          </span>
                        </td>
                        <td>
                          {topCat ? (
                            <span style={{ fontSize: 13 }}>
                              <span style={{ marginRight: 4 }}>{topCatCfg?.icon || '📌'}</span>
                              {topCat[0]} ({fmt(topCat[1] as number)})
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
        </>
      )}

      {/* CSS for print mode */}
      <style>{`
        @media print {
          body {
            background: #fff !important;
            color: #000 !important;
          }
          .no-print {
            display: none !important;
          }
          .reports-print-wrapper {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .panel {
            background: #fff !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid;
          }
          .summary-table th {
            background: #f1f5f9 !important;
            color: #000 !important;
            border-bottom: 2px solid #ccc !important;
          }
          .summary-table td {
            border-bottom: 1px solid #eee !important;
          }
          .badge {
            border: 1px solid currentColor !important;
            background: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}
