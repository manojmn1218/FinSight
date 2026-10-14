import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Search, Filter, Trash2, ChevronDown, ArrowUpDown,
  CheckCircle2, AlertCircle, Loader2, Lock, Eye, EyeOff, Landmark,
  Sparkles, Check, X, SlidersHorizontal, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, RefreshCw, Layers
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { parsePdfFile, extractTransactions, PasswordRequiredError } from '../utils/transactionParser';
import { CATEGORIES, CATEGORY_CONFIG } from '../utils/types';
import type { Category, Transaction } from '../utils/types';
import { Link } from 'react-router-dom';
import BankConnect from '../components/BankConnect';
import type { BankDataResult } from '../utils/setuApi';
import { api, type AiParseResponse, type AiStatusResponse } from '../services/api';

const fmt = (n: number) => (n < 0 ? '-' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

interface AiStagedTransaction {
  id: string;
  selected: boolean;
  date: string;
  cleanMerchant: string;
  rawDescription: string;
  amount: number;
  category: Category;
  isRecurring: boolean;
  confidence: number;
}

export default function TransactionsPage() {
  const { data, addTransactions, updateTransaction, deleteTransaction } = useFinance();
  const txns = useMemo(() => data.transactions || [], [data.transactions]);

  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsingStage, setParsingStage] = useState('Extracting statement text…');
  const [parseResult, setParseResult] = useState<{
    count: number;
    range: string;
    provider?: string;
    model?: string;
  } | null>(null);
  const [parseError, setParseError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 25;
  const fileRef = useRef<HTMLInputElement>(null);

  // --- AI Engine Info ---
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

  useEffect(() => {
    api.getAiStatus()
      .then(res => setAiStatus(res))
      .catch(() => {
        // Fallback info if offline
        setAiStatus({
          hasGeminiKey: false,
          activeProvider: 'heuristic_fallback',
          model: 'smart-nlp-engine',
          version: '2.5',
          features: ['Merchant Normalization', '12-Category Mapping'],
        });
      });
  }, []);

  // --- Bank Connect state ---
  const [showBankConnect, setShowBankConnect] = useState(false);
  const [bankResult, setBankResult] = useState<{ count: number; account: string } | null>(null);

  // --- Password modal state ---
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pdfPassword, setPdfPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // --- AI Review Modal State ---
  const [showAiReview, setShowAiReview] = useState(false);
  const [stagedTransactions, setStagedTransactions] = useState<AiStagedTransaction[]>([]);
  const [aiReviewMeta, setAiReviewMeta] = useState<AiParseResponse | null>(null);
  const [editingStagedCat, setEditingStagedCat] = useState<string | null>(null);

  // --- Core parse logic (with AI extraction & staging) ---
  const doParse = async (file: File, password?: string) => {
    setParsing(true);
    setParsingStage('Extracting text from PDF pages…');
    setParseError('');
    setParseResult(null);

    try {
      // 1. Extract text lines from PDF in browser
      const lines = await parsePdfFile(file, password);
      if (!lines || lines.length === 0) {
        setParseError('No text could be extracted from this PDF. It may be a scanned image or empty statement.');
        setParsing(false);
        return;
      }

      // 2. Send extracted lines to backend AI Classification service
      setParsingStage(
        aiStatus?.activeProvider === 'gemini'
          ? '⚡ Google Gemini 2.5 Flash analyzing merchants & categories…'
          : '⚡ Smart Neural Engine analyzing merchants & categories…'
      );

      let aiResult: AiParseResponse;
      try {
        aiResult = await api.parseStatementWithAi(lines);
      } catch (apiErr: any) {
        console.warn('[TransactionsPage] Backend AI request failed, utilizing client fallback:', apiErr);
        // Resilient client-side fallback
        const localTxns = extractTransactions(lines);
        aiResult = {
          provider: 'heuristic_fallback',
          model: 'client-nlp-fallback',
          summary: {
            totalTransactions: localTxns.length,
            totalDebits: localTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
            totalCredits: localTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            categoriesFound: {},
          },
          transactions: localTxns.map(t => ({
            id: t.id,
            date: t.date,
            rawDescription: t.description,
            cleanMerchant: t.description,
            amount: t.amount,
            category: t.category,
            isRecurring: t.isRecurring,
            confidence: 0.85,
            balance: t.balance,
          })),
        };
      }

      if (!aiResult.transactions || aiResult.transactions.length === 0) {
        setParseError('Could not find recognizable transactions in this statement. Please verify the file format.');
        setParsing(false);
        return;
      }

      // 3. Stage transactions for user confirmation & category fine-tuning
      const staged: AiStagedTransaction[] = aiResult.transactions.map(t => ({
        id: t.id,
        selected: true,
        date: t.date,
        cleanMerchant: t.cleanMerchant,
        rawDescription: t.rawDescription,
        amount: t.amount,
        category: t.category,
        isRecurring: t.isRecurring,
        confidence: t.confidence,
      }));

      setStagedTransactions(staged);
      setAiReviewMeta(aiResult);
      setShowAiReview(true);

      // Clear password state on success
      setNeedsPassword(false);
      setPdfPassword('');
      setPendingFile(null);
      setPasswordError('');
    } catch (err) {
      if (err instanceof PasswordRequiredError) {
        setPendingFile(file);
        setNeedsPassword(true);
        setPasswordError(password ? 'Incorrect password. Please try again.' : '');
      } else {
        const message = err instanceof Error ? err.message : String(err);
        setParseError(message || "Failed to parse the PDF. Make sure it's a valid bank statement.");
        console.error(err);
      }
    }
    setParsing(false);
  };

  // --- Confirm and import approved AI transactions ---
  const handleApproveAiTransactions = () => {
    const selected = stagedTransactions.filter(t => t.selected);
    if (selected.length === 0) {
      setParseError('Please select at least one transaction to import.');
      return;
    }

    const txnsToImport: Transaction[] = selected.map(t => ({
      id: 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      date: t.date,
      description: t.cleanMerchant,
      amount: t.amount,
      category: t.category,
      isRecurring: t.isRecurring,
      source: 'pdf',
    }));

    addTransactions(txnsToImport);

    const dates = txnsToImport.map(t => t.date).sort();
    const from = new Date(dates[0]).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    const to = new Date(dates[dates.length - 1]).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

    setParseResult({
      count: txnsToImport.length,
      range: from === to ? from : `${from} – ${to}`,
      provider: aiReviewMeta?.provider === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Smart Neural Engine',
      model: aiReviewMeta?.model,
    });

    setShowAiReview(false);
    setStagedTransactions([]);
    setAiReviewMeta(null);
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

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1160, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            Transactions
            <span
              style={{
                fontSize: 12,
                fontWeight: 650,
                padding: '4px 10px',
                borderRadius: 20,
                background: aiStatus?.activeProvider === 'gemini'
                  ? 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.18))'
                  : 'linear-gradient(135deg, rgba(52,211,153,0.18), rgba(99,102,241,0.18))',
                border: aiStatus?.activeProvider === 'gemini'
                  ? '1px solid rgba(168,85,247,0.35)'
                  : '1px solid rgba(52,211,153,0.35)',
                color: aiStatus?.activeProvider === 'gemini' ? '#c084fc' : '#34d399',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Sparkles size={12} />
              {aiStatus?.activeProvider === 'gemini' ? 'Google Gemini 2.5 Flash' : 'AI Neural Engine'}
            </span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Upload statement PDFs or connect your bank. FinSight AI extracts text and maps to 12 exact categories.
          </p>
        </div>
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
        {/* PDF Upload zone with AI Indicator */}
        <div
          className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !parsing && fileRef.current?.click()}
          style={{
            margin: 0,
            cursor: parsing ? 'wait' : 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          {/* AI Banner in Card */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--purple)',
              background: 'rgba(129,140,248,0.1)',
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px solid rgba(129,140,248,0.2)',
            }}
          >
            <Sparkles size={11} /> AI Auto-Categorize
          </div>

          {parsing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
              <div style={{ position: 'relative' }}>
                <Loader2 size={38} color="var(--purple)" style={{ animation: 'spin 1s linear infinite' }} />
                <Sparkles size={16} color="#c084fc" style={{ position: 'absolute', top: -4, right: -4 }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600 }}>Analyzing Statement with AI…</p>
              <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', maxWidth: 360 }}>{parsingStage}</p>
            </motion.div>
          ) : (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 10,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={24} color="var(--purple)" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                {dragOver ? 'Drop your PDF here' : 'Upload Bank Statement (PDF)'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, textAlign: 'center' }}>
                Drag & drop bank statement PDF. AI normalizes merchant names & matches 12 categories.
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}>
                  <FileText size={11} /> PDF e-Statements
                </span>
                <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                  <ShieldCheck size={11} /> Password Supported
                </span>
              </div>
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
            width: 48, height: 48, borderRadius: 14, marginBottom: 10,
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

      {/* Parse success notification */}
      {parseResult && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 'var(--radius)', padding: '12px 18px', fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle2 size={18} color="var(--green)" />
            <span>
              <strong>Successfully imported {parseResult.count} transactions</strong> ({parseResult.range})
              {parseResult.provider && (
                <span style={{ marginLeft: 8, color: 'var(--text2)', fontSize: 12 }}>
                  • Classified via <strong>{parseResult.provider}</strong>
                </span>
              )}
            </span>
          </div>
          <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setParseResult(null)}>
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Parse error notification */}
      {parseError && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius)', padding: '12px 18px', fontSize: 13, color: 'var(--red)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={18} />
            <span>{parseError}</span>
          </div>
          <button className="btn-ghost" style={{ padding: '2px 8px', fontSize: 12, color: 'var(--text)' }} onClick={() => setParseError('')}>
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Stats summary strip */}
      {txns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div className="panel" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Total Transactions</p>
            <p style={{ fontSize: 22, fontWeight: 700 }}>{txns.length}</p>
          </div>
          <div className="panel" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Total Income (Credits)</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>+{fmt(totalIncome)}</p>
          </div>
          <div className="panel" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Total Spending (Debits)</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>-{fmt(totalExpense)}</p>
          </div>
          <div className="panel" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Active Categories</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--purple)' }}>
              {new Set(txns.map(t => t.category)).size} / 12
            </p>
          </div>
        </div>
      )}

      {/* Main Table Panel */}
      {txns.length > 0 && (
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 280, maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                type="text"
                className="input"
                placeholder="Search merchant, notes, category…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                style={{ paddingLeft: 34, fontSize: 13 }}
              />
            </div>

            {/* Category Filter Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className={`btn-ghost ${catFilter === 'all' ? 'active' : ''}`}
                onClick={() => { setCatFilter('all'); setPage(0); }}
                style={{
                  padding: '5px 12px', fontSize: 12, borderRadius: 20,
                  background: catFilter === 'all' ? 'var(--purple)' : 'transparent',
                  color: catFilter === 'all' ? '#fff' : 'var(--text2)',
                }}
              >
                All ({txns.length})
              </button>
              {CATEGORIES.map(cat => {
                const count = txns.filter(t => t.category === cat).length;
                if (count === 0) return null;
                const isSelected = catFilter === cat;
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => { setCatFilter(isSelected ? 'all' : cat); setPage(0); }}
                    style={{
                      padding: '4px 10px', fontSize: 11, borderRadius: 20, border: '1px solid',
                      borderColor: isSelected ? cfg.color : 'var(--border)',
                      background: isSelected ? cfg.bg : 'transparent',
                      color: isSelected ? cfg.color : 'var(--text2)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    <span>{cfg.icon}</span> {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer', width: 130 }} onClick={() => toggleSort('date')}>
                    Date <ArrowUpDown size={11} style={{ verticalAlign: 'middle', opacity: 0.5 }} />
                  </th>
                  <th>Merchant / Description</th>
                  <th style={{ cursor: 'pointer', width: 140 }} onClick={() => toggleSort('amount')}>
                    Amount <ArrowUpDown size={11} style={{ verticalAlign: 'middle', opacity: 0.5 }} />
                  </th>
                  <th style={{ width: 180 }}>FinSight Category</th>
                  <th style={{ textAlign: 'right', width: 80 }}>Action</th>
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
                        <span
                          className="cat-badge"
                          style={{ background: cfg.bg, color: cfg.color, cursor: 'pointer' }}
                          onClick={() => setEditingCat(editingCat === tx.id ? null : tx.id)}
                        >
                          {cfg.icon} {tx.category} <ChevronDown size={10} />
                        </span>
                        {editingCat === tx.id && (
                          <div className="cat-dropdown" style={{ zIndex: 10 }}>
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
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No transactions recorded yet</p>
          <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 460, margin: '0 auto 20px' }}>
            Upload your bank statement PDF above. Google Gemini AI will extract transactions and classify them into your 12 exact categories.
          </p>
          <button className="btn-primary" onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Upload size={15} /> Upload First Statement
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* AI EXTRACTION & CLASSIFICATION REVIEW MODAL    */}
      {/* ═══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAiReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 300, padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="panel"
              style={{
                maxWidth: 960, width: '100%', maxHeight: '90vh',
                display: 'flex', flexDirection: 'column', padding: 0,
                border: '1px solid rgba(168,85,247,0.3)',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 30px rgba(168,85,247,0.15)',
                overflow: 'hidden',
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.05))',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                  }}>
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>AI Statement Classification Review</h2>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                        background: aiReviewMeta?.provider === 'gemini' ? 'rgba(168,85,247,0.2)' : 'rgba(52,211,153,0.2)',
                        color: aiReviewMeta?.provider === 'gemini' ? '#c084fc' : '#34d399',
                        border: '1px solid currentColor',
                      }}>
                        {aiReviewMeta?.provider === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Smart Neural Fallback'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: '2px 0 0' }}>
                      Review normalized merchant names and category matches before importing to your ledger.
                    </p>
                  </div>
                </div>

                <button
                  className="btn-ghost"
                  onClick={() => setShowAiReview(false)}
                  style={{ padding: 6, borderRadius: '50%' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Summary Metrics Bar */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
                padding: '16px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Transactions Found</p>
                  <p style={{ fontSize: 18, fontWeight: 700, margin: '2px 0 0' }}>
                    {stagedTransactions.filter(t => t.selected).length} of {stagedTransactions.length} Selected
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Total Inflow (Credits)</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', margin: '2px 0 0' }}>
                    +{fmt(stagedTransactions.filter(t => t.selected && t.amount > 0).reduce((s, t) => s + t.amount, 0))}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Total Outflow (Debits)</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '2px 0 0' }}>
                    -{fmt(stagedTransactions.filter(t => t.selected && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0))}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 600 }}>Categories Identified</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--purple)', margin: '2px 0 0' }}>
                    {new Set(stagedTransactions.filter(t => t.selected).map(t => t.category)).size} Categories
                  </p>
                </div>
              </div>

              {/* Category distribution pill row */}
              <div style={{
                padding: '10px 24px', display: 'flex', gap: 6, overflowX: 'auto',
                borderBottom: '1px solid var(--border)', background: 'var(--surface2)',
                alignItems: 'center', fontSize: 11,
              }}>
                <span style={{ color: 'var(--text3)', fontWeight: 600, marginRight: 4 }}>Categorized:</span>
                {CATEGORIES.map(cat => {
                  const count = stagedTransactions.filter(t => t.category === cat).length;
                  if (count === 0) return null;
                  const cfg = CATEGORY_CONFIG[cat];
                  return (
                    <span
                      key={cat}
                      style={{
                        padding: '3px 8px', borderRadius: 12, background: cfg.bg,
                        color: cfg.color, border: '1px solid', borderColor: cfg.color + '40',
                        display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
                      }}
                    >
                      {cfg.icon} {cat}: <strong>{count}</strong>
                    </span>
                  );
                })}
              </div>

              {/* Staged Transactions Table */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 2 }}>
                      <th style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={stagedTransactions.every(t => t.selected)}
                          onChange={e => {
                            const checked = e.target.checked;
                            setStagedTransactions(st => st.map(t => ({ ...t, selected: checked })));
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ width: 110 }}>Date</th>
                      <th>AI Cleaned Merchant</th>
                      <th style={{ width: 130 }}>Amount</th>
                      <th style={{ width: 190 }}>Exact Category Match</th>
                      <th style={{ width: 90, textAlign: 'right' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedTransactions.map(t => {
                      const cfg = CATEGORY_CONFIG[t.category];
                      return (
                        <tr key={t.id} style={{ opacity: t.selected ? 1 : 0.45 }}>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={t.selected}
                              onChange={e => {
                                const checked = e.target.checked;
                                setStagedTransactions(st => st.map(item => item.id === t.id ? { ...item, selected: checked } : item));
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text2)', whiteSpace: 'nowrap', fontSize: 13 }}>
                            {t.date}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text)' }}>
                              {t.cleanMerchant}
                              {t.isRecurring && (
                                <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--amber)', fontWeight: 650, background: 'rgba(240,180,41,0.1)', padding: '1px 6px', borderRadius: 8 }}>
                                  🔁 Sub
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.rawDescription}>
                              {t.rawDescription}
                            </div>
                          </td>
                          <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 650, fontSize: 13.5, color: t.amount >= 0 ? 'var(--green)' : 'var(--text)' }}>
                            {t.amount >= 0 ? '+' : ''}{fmt(t.amount)}
                          </td>
                          <td style={{ position: 'relative' }}>
                            <span
                              className="cat-badge"
                              style={{ background: cfg.bg, color: cfg.color, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                              onClick={() => setEditingStagedCat(editingStagedCat === t.id ? null : t.id)}
                            >
                              {cfg.icon} {t.category} <ChevronDown size={11} />
                            </span>

                            {editingStagedCat === t.id && (
                              <div className="cat-dropdown" style={{ zIndex: 20, position: 'absolute', top: 32, left: 0 }}>
                                {CATEGORIES.map(cat => (
                                  <button
                                    key={cat}
                                    onClick={() => {
                                      setStagedTransactions(st => st.map(item => item.id === t.id ? { ...item, category: cat } : item));
                                      setEditingStagedCat(null);
                                    }}
                                  >
                                    <span>{CATEGORY_CONFIG[cat].icon}</span> {cat}
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
                            <span style={{
                              color: t.confidence >= 0.9 ? 'var(--green)' : t.confidence >= 0.7 ? 'var(--amber)' : 'var(--text3)',
                              fontWeight: 600,
                            }}>
                              {Math.round(t.confidence * 100)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--surface)', flexWrap: 'wrap', gap: 12,
              }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Selected <strong>{stagedTransactions.filter(t => t.selected).length}</strong> of {stagedTransactions.length} transactions
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setShowAiReview(false);
                      setStagedTransactions([]);
                    }}
                    style={{ padding: '8px 18px', fontSize: 13 }}
                  >
                    Discard
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleApproveAiTransactions}
                    disabled={stagedTransactions.filter(t => t.selected).length === 0}
                    style={{
                      padding: '8px 22px', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                      boxShadow: '0 4px 14px rgba(168,85,247,0.3)',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    Approve & Import to Ledger ({stagedTransactions.filter(t => t.selected).length})
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="panel"
              onClick={e => e.stopPropagation()}
              style={{ width: 420, maxWidth: '90vw', padding: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={22} color="var(--purple)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Password Protected PDF</h3>
                  <p style={{ fontSize: 13, color: 'var(--text2)', margin: '2px 0 0' }}>Enter password to decrypt your statement</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter PDF password"
                    value={pdfPassword}
                    onChange={e => setPdfPassword(e.target.value)}
                    autoFocus
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {passwordError && (
                  <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{passwordError}</p>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => { setNeedsPassword(false); setPendingFile(null); setPdfPassword(''); setPasswordError(''); }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={!pdfPassword.trim()}>
                    Unlock & Parse with AI
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
