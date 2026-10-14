import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Search, Filter, Trash2, ChevronDown, ArrowUpDown,
  CheckCircle2, AlertCircle, Loader2, Lock, Eye, EyeOff, Landmark,
  Sparkles, Check, X, SlidersHorizontal, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, RefreshCw, Layers, PieChart, Calendar, Tag, ChevronLeft, ChevronRight
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

/**
 * Normalizes and formats transaction descriptions into a rich merchant title & subtitle.
 * Handles UPI paths, bank codes, and legacy collapsed tags gracefully.
 */
function formatTransactionDisplay(tx: Transaction) {
  const raw = (tx.description || '').trim();
  const isCredit = tx.amount > 0;
  let title = raw;
  let subtitle = '';

  // 1. If it's a bare or collapsed label ("Upi", "UPI", "Bank Upi Transfer", "Imps", "Transfer", "Tfr", etc.)
  if (!raw || /^(upi|imps|neft|rtgs|transfer|bank upi transfer|bank transaction|tfr|trfr|trf|acc tfr|a\/c tfr|account transfer)$/i.test(raw)) {
    const typeLabel = /imps/i.test(raw) ? 'IMPS' : /neft/i.test(raw) ? 'NEFT' : /tfr|transfer/i.test(raw) ? 'A/C Transfer' : 'UPI';
    const cat = tx.category || 'Transfer';

    const categoryTitles: Record<string, string> = {
      'Food & Dining': `${cat} • ${typeLabel} Payment`,
      'Shopping': `${cat} • ${typeLabel} Purchase`,
      'Transport': `${cat} • Ride / Fuel`,
      'Utilities': `${cat} • Utility Bill Payment`,
      'Rent': `House Rent • ${typeLabel} Transfer`,
      'Subscriptions': `Subscription • ${typeLabel} Auto-Debit`,
      'Health': `Health & Medical • ${typeLabel} Payment`,
      'Education': `Education & Course Fee`,
      'Salary': `Salary • Direct Deposit`,
      'ATM': `ATM Cash Withdrawal`,
      'Transfer': isCredit ? `${typeLabel} Money Received` : `${typeLabel} Money Sent`,
      'Other': isCredit ? `${typeLabel} Credit Inflow` : `${typeLabel} Digital Payment`,
    };

    title = categoryTitles[cat] || (isCredit ? `${typeLabel} Transfer Inflow` : `${typeLabel} Payment`);
    subtitle = `${typeLabel} • ${isCredit ? 'Credit Inflow' : 'Debit Outflow'}`;
    return { title, subtitle };
  }

  // 1b. Handle Account Transfers / TFR descriptions (e.g. "Interest Dep Tfr", "Cdm... Wdl Tfr", "Acc Tfr")
  if (/\b(tfr|trfr|trf|acc tfr|a\/c tfr)\b/i.test(raw)) {
    if (/interest\s*dep/i.test(raw)) {
      return {
        title: 'Interest Deposit Transfer',
        subtitle: `Bank A/C Interest • ${isCredit ? 'Credit Inflow' : 'Debit'}`,
      };
    }
    if (/interest\s*wdl/i.test(raw)) {
      return {
        title: 'Interest Withdrawal Transfer',
        subtitle: `Bank A/C Interest Adjustment • ${isCredit ? 'Credit' : 'Debit Outflow'}`,
      };
    }
    if (/cdm/i.test(raw)) {
      const isDep = /dep/i.test(raw);
      return {
        title: isDep ? 'CDM Cash Deposit Transfer' : 'CDM Cash Withdrawal Transfer',
        subtitle: `Cash Deposit Machine • ${isDep ? 'Credit Inflow' : 'Debit Outflow'}`,
      };
    }
    if (/\b(?:dep|deposit)\s*tfr\b/i.test(raw)) {
      return {
        title: 'Account Deposit Transfer',
        subtitle: `Direct Bank Deposit • ${isCredit ? 'Credit Inflow' : 'Debit'}`,
      };
    }
    if (/\b(?:wdl|withdrawal)\s*tfr\b/i.test(raw)) {
      return {
        title: 'Account Withdrawal Transfer',
        subtitle: `Direct Bank Withdrawal • ${isCredit ? 'Credit' : 'Debit Outflow'}`,
      };
    }
    return {
      title: raw.replace(/\b(tfr|trf|trfr)\b/gi, 'Transfer').trim(),
      subtitle: `Account Transfer • ${isCredit ? 'Credit Inflow' : 'Debit Outflow'}`,
    };
  }

  // 2. Check for leading date pattern: "05/10/2026 - - UPI/DR/..."
  const datePrefixMatch = title.match(/^(\d{2}[-/]\d{2}[-/]\d{2,4})\s*[-:–\s]*(.*)$/);
  if (datePrefixMatch) {
    title = datePrefixMatch[2] || title;
    subtitle = datePrefixMatch[1];
  }

  // 3. Match Indian UPI format: UPI/DR/123456789012/MERCHANT/BANK/...
  const upiMatch = title.match(/UPI[\/\-_](?:DR|CR)?[\/\-_]?(\d+)(?:[\/\-_]([^\/\-_]+))?(?:[\/\-_]([^\/\-_]+))?/i);
  if (upiMatch) {
    const ref = upiMatch[1];
    const partA = (upiMatch[2] || '').trim();
    const partB = (upiMatch[3] || '').trim();

    const gatewayIgnore = /^(PYTM|PAYTM|OKAXIS|OKHDFCBANK|OKSBI|OKICICI|YESB|HDFCBANK|SBI|ICICI|AXIS|AIRP|YES|PUNB|BARB|CNRB|DR|CR)$/i;

    let merchant = '';
    if (partA && !gatewayIgnore.test(partA) && !/^\d+$/.test(partA)) {
      merchant = partA;
    } else if (partB && !gatewayIgnore.test(partB) && !/^\d+$/.test(partB)) {
      merchant = partB;
    }

    if (merchant) {
      return {
        title: merchant.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
        subtitle: `UPI • Ref: ${ref}` + (partB && partB !== merchant ? ` • ${partB}` : ''),
      };
    } else {
      return {
        title: `UPI Payment (Ref #${ref.slice(-6)})`,
        subtitle: `UPI Ref: ${ref} • ${isCredit ? 'Credit' : 'Debit'}`,
      };
    }
  }

  // 4. Handle general slash-separated: e.g. CMS/1234/AMAZON/
  if (title.includes('/')) {
    const parts = title.split('/').map(p => p.trim()).filter(Boolean);
    const ignoreList = /^(UPI|NEFT|IMPS|RTGS|ACH|POS|ECOM|CMS|ATM|NFS|INB|MB|DR|CR|PYTM|PAYTM|OKAXIS|OKHDFCBANK|OKSBI|OKICICI|HDFC|ICICI|SBI|AXIS)$/i;
    const candidate = parts.find(p => {
      const stripped = p.replace(/^[-_\s]+|[-_\s]+$/g, '');
      return stripped.length >= 3 && !/^\d+$/.test(stripped) && !ignoreList.test(stripped);
    });

    if (candidate) {
      subtitle = raw;
      title = candidate;
    }
  }

  // 5. Clean common prefixes and handles
  title = title.replace(/^(?:[-_\s]*)(?:UPI|NEFT|IMPS|RTGS|ACH|POS|ECOM|CMS|ATM|NFS|INB|MB|TRANSFER TO|SENT TO|RECEIVED FROM)[\s\/:_-]+/gi, '');
  title = title.replace(/@[a-zA-Z0-9._-]+/g, '');
  title = title.replace(/[-_/:.*#|]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // 6. Capitalize nicely
  if (title.length >= 2 && !title.startsWith(':')) {
    title = title
      .split(' ')
      .filter(w => w.length > 0 && !/^\d+$/.test(w))
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return {
    title: title || raw || 'Transaction',
    subtitle: subtitle || (raw !== title ? raw : ''),
  };
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
  const [perPage, setPerPage] = useState<number>(25);
  const fileRef = useRef<HTMLInputElement>(null);

  // --- AI Engine Info ---
  const [aiStatus, setAiStatus] = useState<AiStatusResponse | null>(null);

  useEffect(() => {
    api.getAiStatus()
      .then(res => setAiStatus(res))
      .catch(() => {
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

  // --- Core parse logic ---
  const doParse = async (file: File, password?: string) => {
    setParsing(true);
    setParsingStage('Extracting text from PDF pages…');
    setParseError('');
    setParseResult(null);

    try {
      const lines = await parsePdfFile(file, password);
      if (!lines || lines.length === 0) {
        setParseError('No text could be extracted from this PDF. It may be a scanned image or empty statement.');
        setParsing(false);
        return;
      }

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
      rawDescription: t.rawDescription || t.cleanMerchant,
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

  const handleBankSuccess = (result: BankDataResult) => {
    addTransactions(result.transactions);
    setBankResult({
      count: result.transactions.length,
      account: result.accountInfo?.maskedAccNumber || 'Bank Account',
    });
    setParseResult(null);
    setParseError('');
  };

  // --- Filtering & Sorting ---
  const filtered = useMemo(() => {
    let list = [...txns];
    if (search.trim()) {
      const s = search.toLowerCase().trim();
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

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* ═══════════════════════════════════════════════ */}
      {/* PAGE HEADER                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 750, margin: 0, letterSpacing: '-0.5px' }}>
              Transactions
            </h1>
            <span
              style={{
                fontSize: 12,
                fontWeight: 650,
                padding: '4px 12px',
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
                gap: 6,
              }}
            >
              <Sparkles size={13} />
              {aiStatus?.activeProvider === 'gemini' ? 'Google Gemini 2.5 Flash' : 'AI Neural Engine'}
            </span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, margin: 0 }}>
            Unified ledger with automated bank statement OCR & exact 12-category matching.
          </p>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13 }}
          >
            <Upload size={15} /> Upload Statement (PDF)
          </button>
        </div>
      </div>

      {/* Upload limit warning for Basic users */}
      {data.currentPlan === 'Basic' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', background: 'rgba(129,140,248,0.06)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13,
          }}
        >
          <span style={{ color: 'var(--text2)' }}>
            📁 Statement Uploads: <strong>{data.statementUploadsCount || 0}/3</strong> processed on free plan.
          </span>
          {(data.statementUploadsCount || 0) >= 3 ? (
            <Link to="/premium" style={{ color: 'var(--purple)', fontWeight: 650, textDecoration: 'none' }}>
              Upgrade to Pro for Unlimited Uploads →
            </Link>
          ) : (
            <span style={{ color: 'var(--text3)' }}>Basic plan limit</span>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* 4-COLUMN STATS METRIC GRID                     */}
      {/* ═══════════════════════════════════════════════ */}
      {txns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {/* Card 1: Total Transactions */}
          <div className="panel panel-glow" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', flexShrink: 0,
            }}>
              <Layers size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
                Total Records
              </p>
              <p style={{ fontSize: 24, fontWeight: 750, margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                {txns.length}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text2)', margin: '2px 0 0' }}>
                {filtered.length !== txns.length ? `${filtered.length} filtered` : 'All statement & manual entries'}
              </p>
            </div>
          </div>

          {/* Card 2: Total Credits */}
          <div className="panel panel-glow" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80', flexShrink: 0,
            }}>
              <ArrowDownLeft size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
                Total Inflow (Credits)
              </p>
              <p style={{ fontSize: 24, fontWeight: 750, color: 'var(--green)', margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                +{fmt(totalIncome)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text2)', margin: '2px 0 0' }}>
                {txns.filter(t => t.amount > 0).length} credit transactions
              </p>
            </div>
          </div>

          {/* Card 3: Total Debits */}
          <div className="panel panel-glow" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', flexShrink: 0,
            }}>
              <ArrowUpRight size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
                Total Outflow (Debits)
              </p>
              <p style={{ fontSize: 24, fontWeight: 750, color: 'var(--text)', margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                -{fmt(totalExpense)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text2)', margin: '2px 0 0' }}>
                {txns.filter(t => t.amount < 0).length} debit expenses
              </p>
            </div>
          </div>

          {/* Card 4: Active Categories */}
          <div className="panel panel-glow" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.15))',
              border: '1px solid rgba(168,85,247,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', flexShrink: 0,
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <p style={{ fontSize: 11.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', margin: 0 }}>
                Active Categories
              </p>
              <p style={{ fontSize: 24, fontWeight: 750, color: 'var(--purple)', margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                {new Set(txns.map(t => t.category)).size} / 12
              </p>
              <p style={{ fontSize: 11, color: 'var(--text2)', margin: '2px 0 0' }}>
                Exact FinSight classification
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* UPLOAD & CONNECT 2-COLUMN GRID                 */}
      {/* ═══════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* PDF Upload zone */}
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

          <div style={{
            position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center',
            gap: 5, fontSize: 11, fontWeight: 700, color: 'var(--purple)',
            background: 'rgba(129,140,248,0.12)', padding: '3px 9px', borderRadius: 12,
            border: '1px solid rgba(129,140,248,0.25)',
          }}>
            <Sparkles size={11} /> AI Auto-Categorizer
          </div>

          {parsing ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
              <div style={{ position: 'relative' }}>
                <Loader2 size={38} color="var(--purple)" style={{ animation: 'spin 1s linear infinite' }} />
                <Sparkles size={16} color="#c084fc" style={{ position: 'absolute', top: -4, right: -4 }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 650, margin: 0 }}>Analyzing Bank Statement…</p>
              <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', maxWidth: 360, margin: 0 }}>{parsingStage}</p>
            </motion.div>
          ) : (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 10,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.14), rgba(59,130,246,0.14))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Upload size={22} color="var(--purple)" />
              </div>
              <p style={{ fontSize: 15, fontWeight: 650, marginBottom: 4 }}>
                {dragOver ? 'Drop PDF statement here' : 'Upload Bank Statement (PDF)'}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 12, textAlign: 'center', maxWidth: 380 }}>
                Drop e-statement. Gemini AI normalizes cryptic merchant codes and auto-matches to 12 categories.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}>
                  <FileText size={11} /> PDF Statements
                </span>
                <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                  <ShieldCheck size={11} /> Password Encrypted OK
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
            borderColor: 'rgba(129,140,248,0.18)',
          }}
        >
          <div style={{
            width: 48, height: 48, borderRadius: 14, marginBottom: 10,
            background: 'linear-gradient(135deg, rgba(96,165,250,0.14), rgba(129,140,248,0.14))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Landmark size={22} color="#818cf8" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 650, marginBottom: 4 }}>Connect Bank Account</p>
          <p style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 12, textAlign: 'center', maxWidth: 380 }}>
            Securely sync live transactions via RBI-regulated Account Aggregator network.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="badge" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>
              🔒 RBI Regulated
            </span>
            <span className="badge" style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa' }}>
              ⚡ Instant Sync
            </span>
          </div>
        </div>
      </div>

      {/* Parse success notification */}
      {parseResult && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)',
            borderRadius: 'var(--radius)', padding: '14px 20px', fontSize: 13,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={20} color="var(--green)" />
            <span>
              <strong>Successfully imported {parseResult.count} transactions</strong> ({parseResult.range})
              {parseResult.provider && (
                <span style={{ marginLeft: 8, color: 'var(--text2)' }}>
                  • Classified via <strong>{parseResult.provider}</strong>
                </span>
              )}
            </span>
          </div>
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setParseResult(null)}>
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Parse error notification */}
      {parseError && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius)', padding: '14px 20px', fontSize: 13, color: 'var(--red)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle size={20} />
            <span>{parseError}</span>
          </div>
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: 'var(--text)' }} onClick={() => setParseError('')}>
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Smart Banner if generic or legacy transactions are present */}
      {txns.some(t => /^(upi|imps|neft|rtgs|transfer|bank upi transfer)$/i.test((t.description || '').trim())) && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,246,0.08))',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            color: 'var(--text)',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <strong style={{ color: 'var(--purple)', fontSize: 13.5 }}>AI Statement Neural Parser is Active</strong>
              <p style={{ margin: '3px 0 0', color: 'var(--text2)', fontSize: 12.5, lineHeight: 1.4 }}>
                We've enhanced your display with contextual category descriptions! You can also re-upload your PDF statement above anytime to let Google Gemini 2.5 Flash extract all specific merchant names (Swiggy, Zepto, individual recipients) with 100% precision.
              </p>
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => fileRef.current?.click()}
            style={{ padding: '8px 18px', fontSize: 12.5, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Upload size={13} /> Re-upload Statement
          </button>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* MAIN TRANSACTIONS CARD — MODERN CSS GRID       */}
      {/* ═══════════════════════════════════════════════ */}
      {txns.length > 0 && (
        <div className="tx-grid-card">
          {/* Controls Bar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 1fr) auto',
            gap: 16,
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.015)',
          }}>
            {/* Search Input with count */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text3)',
                }}
              />
              <input
                type="text"
                className="input"
                placeholder="Search merchant, notes, category…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                style={{ paddingLeft: 40, paddingRight: search ? 36 : 14, fontSize: 13.5 }}
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setPage(0); }}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text3)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Right Controls: Sort & Items per page */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {/* Sort Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--text3)' }}>Sort:</span>
                <button
                  className="btn-ghost"
                  onClick={() => toggleSort('date')}
                  style={{
                    padding: '5px 10px', fontSize: 12, borderRadius: 8,
                    background: sortBy === 'date' ? 'rgba(129,140,248,0.12)' : 'transparent',
                    color: sortBy === 'date' ? 'var(--purple)' : 'var(--text2)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  Date {sortBy === 'date' && (sortDir === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => toggleSort('amount')}
                  style={{
                    padding: '5px 10px', fontSize: 12, borderRadius: 8,
                    background: sortBy === 'amount' ? 'rgba(129,140,248,0.12)' : 'transparent',
                    color: sortBy === 'amount' ? 'var(--purple)' : 'var(--text2)',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}
                >
                  Amount {sortBy === 'amount' && (sortDir === 'desc' ? '↓' : '↑')}
                </button>
              </div>

              {/* Rows Per Page */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text3)', borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
                <span>Show:</span>
                {[25, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => { setPerPage(cnt); setPage(0); }}
                    style={{
                      padding: '4px 8px', fontSize: 11.5, borderRadius: 6, border: 'none',
                      background: perPage === cnt ? 'var(--purple)' : 'transparent',
                      color: perPage === cnt ? '#fff' : 'var(--text3)',
                      cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter Chips Grid */}
          <div style={{
            display: 'flex',
            gap: 8,
            padding: '12px 24px',
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto',
            alignItems: 'center',
            background: 'var(--surface2)',
            scrollbarWidth: 'thin',
          }}>
            <button
              onClick={() => { setCatFilter('all'); setPage(0); }}
              style={{
                padding: '6px 14px', fontSize: 12, borderRadius: 20, border: '1px solid',
                borderColor: catFilter === 'all' ? 'var(--purple)' : 'var(--border)',
                background: catFilter === 'all' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'transparent',
                color: catFilter === 'all' ? '#fff' : 'var(--text2)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 650,
                boxShadow: catFilter === 'all' ? '0 2px 10px rgba(168,85,247,0.3)' : 'none',
                whiteSpace: 'nowrap',
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
                    padding: '5px 12px', fontSize: 12, borderRadius: 20, border: '1px solid',
                    borderColor: isSelected ? cfg.color : 'var(--border)',
                    background: isSelected ? cfg.bg : 'transparent',
                    color: isSelected ? cfg.color : 'var(--text2)',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontWeight: isSelected ? 700 : 500,
                    boxShadow: isSelected ? `0 2px 12px ${cfg.color}35` : 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cfg.icon}</span> {cat}
                  <span style={{
                    fontSize: 10.5,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: isSelected ? cfg.color : 'rgba(255,255,255,0.06)',
                    color: isSelected ? '#fff' : 'var(--text3)',
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CSS Grid Header */}
          <div className="tx-grid-header">
            <div
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              onClick={() => toggleSort('date')}
              title="Sort by date"
            >
              Date
              <ArrowUpDown size={12} style={{ opacity: sortBy === 'date' ? 1 : 0.4 }} />
            </div>

            <div>Merchant / Description</div>

            <div
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 6,
                paddingRight: 18,
              }}
              onClick={() => toggleSort('amount')}
              title="Sort by amount"
            >
              Amount
              <ArrowUpDown size={12} style={{ opacity: sortBy === 'amount' ? 1 : 0.4 }} />
            </div>

            <div>FinSight Category</div>

            <div style={{ textAlign: 'right' }}>Actions</div>
          </div>

          {/* CSS Grid Data Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {paged.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text3)' }}>
                <Search size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>No matching transactions found</p>
                <p style={{ fontSize: 13 }}>Try adjusting your search query or selecting a different category filter.</p>
                <button
                  className="btn-ghost"
                  onClick={() => { setSearch(''); setCatFilter('all'); }}
                  style={{ marginTop: 12, fontSize: 12 }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              paged.map(tx => {
                const cfg = CATEGORY_CONFIG[tx.category] || CATEGORY_CONFIG['Other'];
                const { title, subtitle } = formatTransactionDisplay(tx);
                const isCredit = tx.amount > 0;

                return (
                  <div key={tx.id} className="tx-grid-row">
                    {/* Column 1: Date */}
                    <div className="tx-grid-col-date">
                      <span style={{ fontWeight: 650, fontSize: 13, color: 'var(--text)' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {new Date(tx.date).toLocaleDateString('en-IN', { year: 'numeric' })}
                      </span>
                    </div>

                    {/* Column 2: Merchant & Description */}
                    <div className="tx-grid-col-merchant">
                      <div
                        className="tx-grid-merchant-icon"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          borderColor: cfg.color + '30',
                        }}
                      >
                        {cfg.icon}
                      </div>

                      <div className="tx-grid-merchant-details">
                        <div className="tx-grid-merchant-title">
                          <span title={tx.description}>{title}</span>
                          {tx.isRecurring && (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 650,
                              color: 'var(--amber)',
                              background: 'rgba(240,180,41,0.1)',
                              padding: '1px 6px',
                              borderRadius: 6,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}>
                              🔁 Recurring
                            </span>
                          )}
                        </div>
                        {subtitle && (
                          <div className="tx-grid-merchant-sub" title={subtitle}>
                            {subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Column 3: Amount */}
                    <div className="tx-grid-col-amount">
                      <span
                        className="tx-grid-amount-val"
                        style={{ color: isCredit ? 'var(--green)' : 'var(--text)' }}
                      >
                        {isCredit ? '+' : ''}{fmt(tx.amount)}
                      </span>
                      <span
                        className="tx-grid-amount-badge"
                        style={{ color: isCredit ? 'var(--green)' : 'var(--text3)' }}
                      >
                        {isCredit ? 'Credit' : 'Debit'}
                      </span>
                    </div>

                    {/* Column 4: Category */}
                    <div className="tx-grid-col-category">
                      <span
                        className="cat-badge"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1px solid ${cfg.color}35`,
                          padding: '5px 12px',
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          borderRadius: 20,
                          cursor: 'pointer',
                        }}
                        onClick={() => setEditingCat(editingCat === tx.id ? null : tx.id)}
                      >
                        <span>{cfg.icon}</span> {tx.category} <ChevronDown size={12} />
                      </span>

                      {editingCat === tx.id && (
                        <div className="cat-dropdown" style={{ zIndex: 30 }}>
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              onClick={() => {
                                updateTransaction(tx.id, { category: cat });
                                setEditingCat(null);
                              }}
                              style={{
                                fontWeight: tx.category === cat ? 700 : 500,
                                color: tx.category === cat ? 'var(--purple)' : 'var(--text)',
                              }}
                            >
                              <span>{CATEGORY_CONFIG[cat].icon}</span> {cat}
                              {tx.category === cat && <Check size={14} style={{ marginLeft: 'auto' }} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 5: Action */}
                    <div className="tx-grid-col-actions">
                      <button
                        className="tx-grid-del-btn"
                        title="Delete transaction"
                        onClick={() => deleteTransaction(tx.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Grid Bar */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 24px',
              borderTop: '1px solid var(--border)',
              fontSize: 13,
              background: 'rgba(255, 255, 255, 0.01)',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <span style={{ color: 'var(--text2)' }}>
                Showing <strong>{page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> transactions
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn-ghost"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>

                <span style={{ fontSize: 12.5, color: 'var(--text3)', padding: '0 6px' }}>
                  Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
                </span>

                <button
                  className="btn-ghost"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  style={{
                    padding: '6px 12px',
                    fontSize: 12.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {txns.length === 0 && !parsing && !parseResult && (
        <div className="panel" style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.12))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <FileText size={32} color="var(--purple)" />
          </div>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No transactions recorded yet</p>
          <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Upload your bank statement PDF above. Google Gemini AI will extract transactions and classify them into your 12 exact categories.
          </p>
          <button className="btn-primary" onClick={() => fileRef.current?.click()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Upload size={16} /> Upload First Statement
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
                      const cfg = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG['Other'];
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
