import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Search, Filter, Trash2, ChevronDown, ArrowUpDown, CheckCircle2, AlertCircle, Loader2, Lock, Eye, EyeOff, Landmark } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { parseStatementPdf, PasswordRequiredError } from '../utils/transactionParser';
import { CATEGORIES, CATEGORY_CONFIG } from '../utils/types';
import type { Category } from '../utils/types';
import { Link } from 'react-router-dom';
import BankConnect from '../components/BankConnect';
import type { BankDataResult } from '../utils/setuApi';

const fmt = (n: number) => (n < 0 ? '-' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function TransactionsPage() {
  const { data, addTransactions, updateTransaction, deleteTransaction } = useFinance();
  const txns = data.transactions || [];

  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<{ count: number; range: string } | null>(null);
  const [parseError, setParseError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 25;
  const fileRef = useRef<HTMLInputElement>(null);

  // --- Bank Connect state ---
  const [showBankConnect, setShowBankConnect] = useState(false);
  const [bankResult, setBankResult] = useState<{ count: number; account: string } | null>(null);

  // --- Password modal state ---
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // --- Core parse logic (with optional password) ---
  const doParse = async (file: File, password?: string) => {
    setParsing(true);
    setParseError('');
    setParseResult(null);

    try {
      const transactions = await parseStatementPdf(file, password);
      if (transactions.length === 0) {
        setParseError('No transactions could be extracted from this PDF. Try a different bank statement format.');
        setParsing(false);
        return;
      }
      addTransactions(transactions);
      const dates = transactions.map(t => t.date).sort();
      const from = new Date(dates[0]).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      const to = new Date(dates[dates.length - 1]).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      setParseResult({ count: transactions.length, range: from === to ? from : `${from} – ${to}` });
      // Clear password state on success
      setNeedsPassword(false);
      setPdfPassword('');
      setPendingFile(null);
      setPasswordError('');
    } catch (err) {
      if (err instanceof PasswordRequiredError) {
        // PDF needs a password — show the modal
        setPendingFile(file);
        setNeedsPassword(true);
        setPasswordError(password ? 'Incorrect password. Please try again.' : '');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setParseError(message || 'Failed to parse the PDF. Make sure it\'s a valid bank statement.');
        console.error(err);
      }
    }
    setParsing(false);
  };

  // --- Upload handler ---
  const handleFile = async (file: File) => {
    if (data.currentPlan === 'Basic' && (data.statementUploadsCount || 0) >= 3) {
      setParseError('Statement upload limit reached: Basic accounts are limited to 3 PDF uploads. Upgrade to Pro for unlimited statements.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Please upload a PDF file.');
      return;
    }
    await doParse(file);
  };

  // --- Password submit handler ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile || !pdfPassword.trim()) return;
    setPasswordError('');
    await doParse(pendingFile, pdfPassword.trim());
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // --- Bank Connect success handler ---
  const handleBankSuccess = (result: BankDataResult) => {
    addTransactions(result.transactions);
    setBankResult({
      count: result.transactions.length,
      account: result.accountInfo?.maskedAccNumber || 'Bank Account',
    });
    setParseResult(null);
    setParseError('');
  };

  // --- Filtering, sorting, pagination ---
  const filtered = useMemo(() => {
    let list = [...txns];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(s) || t.category.toLowerCase().includes(s));
    }
    if (catFilter !== 'all') {
      list = list.filter(t => t.category === catFilter);
    }
    list.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'date') return mul * (a.date.localeCompare(b.date));
      return mul * (Math.abs(a.amount) - Math.abs(b.amount));
    });
    return list;
  }, [txns, search, catFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const totalIncome = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const toggleSort = (col: 'date' | 'amount') => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Transactions</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Upload bank statements or connect your bank account to manage your transaction history.</p>
      </div>

      {/* Upload limit warning for Basic users */}
      {data.currentPlan === 'Basic' && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'rgba(129,140,248,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13 }}
        >
          <span style={{ color: 'var(--text2)' }}>
            📁 Statement Uploads: <strong>{data.statementUploadsCount || 0}/3</strong> processed on free plan.
          </span>
          {(data.statementUploadsCount || 0) >= 3 ? (
            <Link to="/premium" style={{ color: 'var(--purple)', fontWeight: 650, textDecoration: 'none' }}>Upgrade to Pro for Unlimited Uploads →</Link>
          ) : (
            <span style={{ color: 'var(--text3)' }}>Basic plan limit</span>
          )}
        </motion.div>
      )}

      {/* Upload & Connect options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* PDF Upload zone */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          style={{ margin: 0 }}
        >
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {parsing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader2 size={36} color="var(--purple)" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>Parsing your statement…</p>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>Extracting transactions and categorizing expenses</p>
            </motion.div>
          ) : (
            <>
              <Upload size={32} color="var(--purple)" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                {dragOver ? 'Drop your PDF here' : 'Upload Bank Statement'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
                Drag & drop a PDF or click to browse.
              </p>
              <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}>
                <FileText size={12} /> PDF files only
              </span>
            </>
          )}
        </div>

        {/* Bank Connect zone */}
        <div
          className="upload-zone"
          onClick={() => setShowBankConnect(true)}
          style={{
            margin: 0, cursor: 'pointer',
            background: 'linear-gradient(135deg, rgba(96,165,250,0.04), rgba(129,140,248,0.06))',
            borderColor: 'rgba(129,140,248,0.15)',
          }}
        >
          <div style={{
            width: 52, height: 52, borderRadius: 14, marginBottom: 10,
            background: 'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(129,140,248,0.12))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Landmark size={24} color="#818cf8" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Connect Bank Account</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
            Securely fetch transactions via RBI Account Aggregator.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 10 }}>🔒 RBI Regulated</span>
            <span className="badge" style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', fontSize: 10 }}>⚡ Instant</span>
          </div>
        </div>
      </div>

      {/* BankConnect Modal */}
      <BankConnect
        isOpen={showBankConnect}
        onClose={() => setShowBankConnect(false)}
        onSuccess={handleBankSuccess}
      />

      {/* Password modal for encrypted PDFs */}
      <AnimatePresence>
        {needsPassword && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
            onClick={() => { setNeedsPassword(false); setPendingFile(null); setPdfPassword(''); setPasswordError(''); }}
          >
            <motion.div
              className="panel" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
              style={{ padding: 32, width: 420, maxWidth: '90vw', position: 'relative', boxShadow: 'var(--shadow-lg)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={22} color="var(--amber)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>Password Protected PDF</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                    {pendingFile?.name || 'Your bank statement'} requires a password.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                {passwordError && (
                  <div style={{ padding: 10, background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={14} /> {passwordError}
                  </div>
                )}

                <label className="label">PDF Password</label>
                <div style={{ position: 'relative', marginBottom: 18 }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pdfPassword}
                    onChange={e => setPdfPassword(e.target.value)}
                    placeholder="Enter statement password"
                    autoFocus
                    required
                    className="input"
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 18, lineHeight: 1.5 }}>
                  💡 Most Indian banks use your <strong>Customer ID</strong>, <strong>Account Number</strong>, or <strong>DOB (DDMMYYYY)</strong> as the PDF password.
                </p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }}
                    onClick={() => { setNeedsPassword(false); setPendingFile(null); setPdfPassword(''); setPasswordError(''); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 22px', fontSize: 13 }} disabled={parsing || !pdfPassword.trim()}>
                    {parsing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Unlocking…</> : 'Unlock & Parse'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parse result / error */}
      <AnimatePresence>
        {parseResult && (
          <motion.div className="panel" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', borderLeft: '3px solid var(--green)' }}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CheckCircle2 size={20} color="var(--green)" />
            <div>
              <span style={{ fontWeight: 600 }}>Successfully parsed {parseResult.count} transactions</span>
              <span style={{ color: 'var(--text2)', marginLeft: 8, fontSize: 13 }}>({parseResult.range})</span>
            </div>
          </motion.div>
        )}
        {bankResult && (
          <motion.div className="panel" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', borderLeft: '3px solid #60a5fa' }}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Landmark size={20} color="#60a5fa" />
            <div>
              <span style={{ fontWeight: 600 }}>Imported {bankResult.count} transactions from {bankResult.account}</span>
              <span style={{ color: 'var(--text2)', marginLeft: 8, fontSize: 13 }}>via Account Aggregator</span>
            </div>
          </motion.div>
        )}
        {parseError && (
          <motion.div className="panel" style={{ padding: '14px 20px', display: 'flex', gap: 12, alignItems: 'center', borderLeft: '3px solid var(--red)' }}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <AlertCircle size={20} color="var(--red)" />
            <span style={{ fontSize: 14 }}>{parseError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick stats */}
      {txns.length > 0 && (
        <div style={{ display: 'flex', gap: 14 }}>
          <div className="stat-pill"><span className="stat-label">Transactions</span><span className="stat-value">{txns.length}</span></div>
          <div className="stat-pill"><span className="stat-label">Total Income</span><span className="stat-value" style={{ color: 'var(--green)' }}>{fmt(totalIncome)}</span></div>
          <div className="stat-pill"><span className="stat-label">Total Expenses</span><span className="stat-value" style={{ color: 'var(--pink)' }}>{fmt(totalExpense)}</span></div>
          <div className="stat-pill"><span className="stat-label">Net Savings</span><span className="stat-value" style={{ color: totalIncome - totalExpense >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(totalIncome - totalExpense)}</span></div>
        </div>
      )}

      {/* Transaction table */}
      {txns.length > 0 && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--border)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 10, padding: '8px 14px', flex: '1 1 220px' }}>
              <Search size={16} color="var(--text3)" />
              <input type="text" placeholder="Search transactions..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: '100%', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={14} color="var(--text3)" />
              <select value={catFilter} onChange={e => { setCatFilter(e.target.value as any); setPage(0); }}
                className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>
                <option value="all">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="tx-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('date')}>
                    Date <ArrowUpDown size={11} style={{ verticalAlign: 'middle', opacity: 0.5 }} />
                  </th>
                  <th>Description</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('amount')}>
                    Amount <ArrowUpDown size={11} style={{ verticalAlign: 'middle', opacity: 0.5 }} />
                  </th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(tx => {
                  const cfg = CATEGORY_CONFIG[tx.category];
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: 'var(--text2)' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {tx.description}
                        {tx.isRecurring && <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>🔁 Recurring</span>}
                      </td>
                      <td style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: tx.amount >= 0 ? 'var(--green)' : 'var(--text)' }}>
                        {tx.amount >= 0 ? '+' : ''}{fmt(tx.amount)}
                      </td>
                      <td style={{ position: 'relative' }}>
                        <span className="cat-badge" style={{ background: cfg.bg, color: cfg.color }}
                          onClick={() => setEditingCat(editingCat === tx.id ? null : tx.id)}>
                          {cfg.icon} {tx.category} <ChevronDown size={10} />
                        </span>
                        {editingCat === tx.id && (
                          <div className="cat-dropdown">
                            {CATEGORIES.map(cat => (
                              <button key={cat} onClick={() => { updateTransaction(tx.id, { category: cat }); setEditingCat(null); }}>
                                <span>{CATEGORY_CONFIG[cat].icon}</span> {cat}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-ghost" style={{ padding: 6, color: 'var(--red)' }} onClick={() => deleteTransaction(tx.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderTop: '1px solid var(--border)', fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: '4px 12px', fontSize: 12 }}>Prev</button>
                <button className="btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: '4px 12px', fontSize: 12 }}>Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {txns.length === 0 && !parsing && !parseResult && (
        <div className="panel" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <FileText size={40} color="var(--text3)" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No transactions yet</p>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>Upload your bank statement above to get started with automatic expense tracking.</p>
        </div>
      )}
    </div>
  );
}
