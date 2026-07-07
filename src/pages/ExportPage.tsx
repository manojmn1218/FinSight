import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, FileSpreadsheet, FileText, Calendar, CheckCircle2, Lock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { computeMonthSummaries } from '../utils/transactionParser';
import { CATEGORY_CONFIG } from '../utils/types';
import { useNavigate } from 'react-router-dom';

export default function ExportPage() {
  const { data } = useFinance();
  const nav = useNavigate();
  const txns = data.transactions || [];
  const goals = data.financialGoals || [];
  const summaries = useMemo(() => computeMonthSummaries(txns), [txns]);


  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [includeCats, setIncludeCats] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);
  const [exported, setExported] = useState('');

  const filteredTxns = useMemo(() => {
    let list = [...txns];
    if (dateFrom) list = list.filter(t => t.date >= dateFrom);
    if (dateTo) list = list.filter(t => t.date <= dateTo);
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [txns, dateFrom, dateTo]);

  // --- CSV Export ---
  const exportCsv = () => {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Balance'];
    const rows = filteredTxns.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      Math.abs(t.amount).toFixed(2),
      t.amount >= 0 ? 'Credit' : 'Debit',
      t.category,
      t.balance?.toFixed(2) || '',
    ]);

    let csv = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');

    if (includeCats && summaries.length > 0) {
      csv += '\n\n--- Category Summary ---\n';
      csv += 'Category,Total Amount\n';
      const catMap: Record<string, number> = {};
      filteredTxns.filter(t => t.amount < 0).forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount); });
      Object.entries(catMap).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
        csv += `${cat},${amt.toFixed(2)}\n`;
      });
    }

    if (includeGoals && goals.length > 0) {
      csv += '\n\n--- Financial Goals ---\n';
      csv += 'Goal,Target,Current,Progress,Deadline\n';
      goals.forEach(g => {
        const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
        csv += `"${g.name}",${g.targetAmount},${g.currentAmount},${pct}%,${g.deadline}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finsight-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExported('csv');
    setTimeout(() => setExported(''), 3000);
  };

  // --- Text/PDF report ---
  const exportTextReport = () => {
    let report = `FinSight Financial Report\n`;
    report += `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}\n`;
    report += `User: ${data.userName} (${data.userEmail})\n`;
    report += `${'═'.repeat(50)}\n\n`;

    // Summary
    const totalIncome = filteredTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalExpense = filteredTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    report += `SUMMARY\n${'─'.repeat(30)}\n`;
    report += `Total Transactions: ${filteredTxns.length}\n`;
    report += `Total Income:   ₹${totalIncome.toLocaleString('en-IN')}\n`;
    report += `Total Expenses: ₹${totalExpense.toLocaleString('en-IN')}\n`;
    report += `Net Savings:    ₹${(totalIncome - totalExpense).toLocaleString('en-IN')}\n\n`;

    if (includeCats) {
      report += `CATEGORY BREAKDOWN\n${'─'.repeat(30)}\n`;
      const catMap: Record<string, number> = {};
      filteredTxns.filter(t => t.amount < 0).forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount); });
      Object.entries(catMap).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => {
        report += `  ${cat.padEnd(20)} ₹${amt.toLocaleString('en-IN')}\n`;
      });
      report += '\n';
    }

    if (includeGoals && goals.length > 0) {
      report += `FINANCIAL GOALS\n${'─'.repeat(30)}\n`;
      goals.forEach(g => {
        const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
        report += `  ${g.name}: ₹${g.currentAmount.toLocaleString('en-IN')} / ₹${g.targetAmount.toLocaleString('en-IN')} (${pct}%)\n`;
      });
      report += '\n';
    }

    // Monthly summaries
    if (summaries.length > 0) {
      report += `MONTHLY SUMMARIES\n${'─'.repeat(30)}\n`;
      summaries.forEach(s => {
        report += `  ${s.label.padEnd(12)} Income: ₹${s.totalIncome.toLocaleString('en-IN').padStart(10)}  Expenses: ₹${s.totalExpenses.toLocaleString('en-IN').padStart(10)}  Net: ₹${s.netSavings.toLocaleString('en-IN').padStart(10)}\n`;
      });
      report += '\n';
    }

    report += `\nGenerated by FinSight AI Finance Dashboard`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finsight-report-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setExported('txt');
    setTimeout(() => setExported(''), 3000);
  };

  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Export Reports</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Download your financial data for tax filing, personal records, or sharing.</p>
      </div>

      {/* Date range */}
      <motion.div className="panel" style={{ padding: 28 }} {...an(0)}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--purple)" /> Date Range
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="label">From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
          {filteredTxns.length} transactions in range{dateFrom || dateTo ? '' : ' (all time)'}
        </p>
      </motion.div>

      {/* Options */}
      <motion.div className="panel" style={{ padding: 28 }} {...an(1)}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Include in Report</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={includeCats} onChange={e => setIncludeCats(e.target.checked)}
              style={{ accentColor: 'var(--purple)', width: 16, height: 16 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Category Breakdown</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Spending summary grouped by category</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={includeGoals} onChange={e => setIncludeGoals(e.target.checked)}
              style={{ accentColor: 'var(--purple)', width: 16, height: 16 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Financial Goals Progress</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Current progress toward each saved goal</div>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Export buttons */}
      <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} {...an(2)}>
        <button className="panel panel-glow" onClick={exportCsv} disabled={txns.length === 0}
          style={{ padding: 28, border: 'none', cursor: txns.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: txns.length === 0 ? 0.5 : 1, fontFamily: 'inherit', color: 'var(--text)' }}>
          <FileSpreadsheet size={28} color="var(--green)" style={{ marginBottom: 12 }} />
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Export as CSV</h4>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>
            Download a spreadsheet-compatible file for Excel, Google Sheets, or tax software.
          </p>
          {exported === 'csv' ? (
            <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Downloaded!</span>
          ) : (
            <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)' }}><Download size={11} /> .csv</span>
          )}
        </button>

        {data.currentPlan === 'Basic' ? (
          <button className="panel panel-glow" onClick={() => nav('/premium')}
            style={{ padding: 28, border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} color="var(--purple)" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 0.5 }}>PRO ONLY</span>
            </div>
            <FileText size={28} color="var(--text3)" style={{ marginBottom: 12, opacity: 0.5 }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text2)' }}>Export as Report</h4>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5, marginBottom: 12 }}>
              Download a formatted text report with summaries, breakdowns, and insights.
            </p>
            <span className="badge" style={{ background: 'var(--grad)', color: '#fff' }}><Lock size={11} /> Unlock Report Export</span>
          </button>
        ) : (
          <button className="panel panel-glow" onClick={exportTextReport} disabled={txns.length === 0}
            style={{ padding: 28, border: 'none', cursor: txns.length === 0 ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: txns.length === 0 ? 0.5 : 1, fontFamily: 'inherit', color: 'var(--text)' }}>
            <FileText size={28} color="var(--purple)" style={{ marginBottom: 12 }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Export as Report</h4>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>
              Download a formatted text report with summaries, breakdowns, and insights.
            </p>
            {exported === 'txt' ? (
              <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={14} /> Downloaded!</span>
            ) : (
              <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}><Download size={11} /> .txt</span>
            )}
          </button>
        )}
      </motion.div>
    </div>
  );
}
