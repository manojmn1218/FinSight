import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Trash2,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  Sliders,
  Coins,
  Sparkles
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CATEGORIES, CATEGORY_CONFIG, type Category, type Transaction } from '../utils/types';
import { api } from '../services/api';

// Payment mode options
const PAYMENT_MODES = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash', 'Cheque'] as const;

// Asset category options
const ASSET_CATEGORIES = [
  'Real Estate',
  'Mutual Funds',
  'Equity / Stocks',
  'Gold & Precious Metals',
  'Fixed Deposits / Bonds',
  'Crypto Assets',
  'Cash & Liquid Savings',
  'Vehicle / Auto',
  'Other',
] as const;

// Liability types
const LIABILITY_TYPES = [
  'Home Loan',
  'Car / Vehicle Loan',
  'Personal Loan',
  'Education Loan',
  'Credit Card Outstanding',
  'BNPL / Consumer Loan',
  'Family / Private Loan',
] as const;

interface ManualAsset {
  id: string;
  name: string;
  category: (typeof ASSET_CATEGORIES)[number];
  currentValue: number;
  purchaseCost: number;
  purchaseDate?: string;
  cagr?: number;
  institution?: string;
  notes?: string;
}

interface ManualLiability {
  id: string;
  title: string;
  type: (typeof LIABILITY_TYPES)[number];
  lender: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  monthlyEmi: number;
  dueDay: number;
  remainingMonths: number;
}

export default function ManualEntryPage() {
  const { data, setData, addTransactions, deleteTransaction } = useFinance();
  const [activeTab, setActiveTab] = useState<'transactions' | 'assets' | 'liabilities' | 'budgets' | 'presets'>('transactions');

  // Notification toast state
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' } | null>(null);

  const showToast = (title: string, desc: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: DETAILED TRANSACTIONS STATE & HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const [txnType, setTxnType] = useState<'debit' | 'credit'>('debit');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnCategory, setTxnCategory] = useState<Category>('Food & Dining');
  const [txnDesc, setTxnDesc] = useState('');
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txnPaymentMode, setTxnPaymentMode] = useState<string>('UPI');
  const [txnBank, setTxnBank] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [txnRecurring, setTxnRecurring] = useState(false);

  // Transaction list filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOnlyManual, setFilterOnlyManual] = useState<boolean>(true);

  // Filtered transactions
  const manualTransactions = useMemo(() => {
    let list = (data.transactions || []).filter(t => !filterOnlyManual || t.source === 'manual');

    if (filterType === 'debit') list = list.filter(t => t.amount < 0);
    if (filterType === 'credit') list = list.filter(t => t.amount > 0);
    if (filterCategory !== 'all') list = list.filter(t => t.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  }, [data.transactions, filterOnlyManual, filterType, filterCategory, searchQuery]);

  // Overall manual metrics
  const allManualTxns = useMemo(() => {
    return (data.transactions || []).filter(t => t.source === 'manual');
  }, [data.transactions]);

  const totalManualInflow = useMemo(() => {
    return allManualTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  }, [allManualTxns]);

  const totalManualOutflow = useMemo(() => {
    return Math.abs(allManualTxns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  }, [allManualTxns]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(txnAmount);
    if (isNaN(val) || val <= 0) {
      showToast('Invalid Amount', 'Please provide a positive amount for the transaction.', 'info');
      return;
    }
    if (!txnDesc.trim()) {
      showToast('Description Required', 'Please enter a description or merchant name.', 'info');
      return;
    }

    const finalAmount = txnType === 'credit' ? Math.abs(val) : -Math.abs(val);
    const fullDesc = txnBank.trim()
      ? `${txnDesc.trim()} [${txnPaymentMode} • ${txnBank.trim()}]`
      : txnRef.trim()
      ? `${txnDesc.trim()} (Ref: ${txnRef.trim()})`
      : txnDesc.trim();

    const newTxn: Transaction = {
      id: `man_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: txnDate,
      description: fullDesc,
      amount: finalAmount,
      category: txnCategory,
      isRecurring: txnRecurring,
      source: 'manual',
    };

    await addTransactions([newTxn]);

    // Reset form fields
    setTxnAmount('');
    setTxnDesc('');
    setTxnRef('');
    setTxnBank('');

    showToast('Entry Recorded', `Successfully saved manual ${txnType === 'credit' ? 'income' : 'expense'} of ₹${Math.abs(val).toLocaleString('en-IN')}`);
  };

  const handleDeleteTxn = async (id: string, desc: string) => {
    if (window.confirm(`Delete manual record "${desc}"?`)) {
      await deleteTransaction(id);
      showToast('Record Deleted', 'Transaction removed from your financial ledger.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: DETAILED ASSETS STATE & HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const [manualAssets, setManualAssets] = useState<ManualAsset[]>(() => {
    try {
      const stored = localStorage.getItem(`fs_manual_assets_${data.userEmail || 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync assets with backend portfolio on initial mount
  useEffect(() => {
    if (!data.userEmail) return;
    try {
      const stored = localStorage.getItem(`fs_manual_assets_${data.userEmail}`);
      if (stored) {
        setManualAssets(JSON.parse(stored));
      } else {
        api.getPortfolio().then(res => {
          if (res.assets && res.assets.length > 0) {
            const mapped: ManualAsset[] = res.assets.map(a => ({
              id: a.id || `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: a.name || a.symbol,
              category: a.assetType === 'crypto' ? 'Crypto Assets' : a.assetType === 'mutual_fund' ? 'Mutual Funds' : 'Equity / Stocks',
              currentValue: (a.shares || 1) * (a.avgBuyPrice || 0),
              purchaseCost: (a.shares || 1) * (a.avgBuyPrice || 0),
              institution: a.symbol,
            }));
            setManualAssets(mapped);
          }
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [data.userEmail]);

  const saveAssetsState = (newAssets: ManualAsset[]) => {
    setManualAssets(newAssets);
    if (data.userEmail) {
      localStorage.setItem(`fs_manual_assets_${data.userEmail}`, JSON.stringify(newAssets));
    }
    // Also sync to portfolio API
    const mapped = newAssets.map(a => ({
      id: a.id,
      symbol: a.name.slice(0, 8).toUpperCase().replace(/\s+/g, ''),
      name: a.name,
      shares: 1,
      avgBuyPrice: a.currentValue,
      assetType: a.category === 'Crypto Assets' ? 'crypto' as const : a.category === 'Mutual Funds' ? 'mutual_fund' as const : 'stock' as const,
    }));
    api.savePortfolio(mapped).catch(() => {});
  };

  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<(typeof ASSET_CATEGORIES)[number]>('Mutual Funds');
  const [assetValue, setAssetValue] = useState('');
  const [assetCost, setAssetCost] = useState('');
  const [assetDate, setAssetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assetCagr, setAssetCagr] = useState('12');
  const [assetInstitution, setAssetInstitution] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const curVal = parseFloat(assetValue);
    const buyCost = parseFloat(assetCost) || curVal;
    if (!assetName.trim() || isNaN(curVal) || curVal <= 0) {
      showToast('Valid Asset Required', 'Please provide asset title and market value.', 'info');
      return;
    }

    const newAsset: ManualAsset = {
      id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: assetName.trim(),
      category: assetCategory,
      currentValue: curVal,
      purchaseCost: buyCost,
      purchaseDate: assetDate,
      cagr: parseFloat(assetCagr) || undefined,
      institution: assetInstitution.trim() || undefined,
      notes: assetNotes.trim() || undefined,
    };

    saveAssetsState([newAsset, ...manualAssets]);
    setAssetName('');
    setAssetValue('');
    setAssetCost('');
    setAssetInstitution('');
    setAssetNotes('');

    showToast('Asset Registered', `Added "${newAsset.name}" valued at ₹${curVal.toLocaleString('en-IN')}`);
  };

  const handleDeleteAsset = (id: string, name: string) => {
    if (window.confirm(`Remove asset record "${name}"?`)) {
      const filtered = manualAssets.filter(a => a.id !== id);
      saveAssetsState(filtered);
      showToast('Asset Removed', `"${name}" removed from portfolio tracking.`);
    }
  };

  const totalAssetValue = useMemo(() => manualAssets.reduce((s, a) => s + a.currentValue, 0), [manualAssets]);
  const totalAssetCost = useMemo(() => manualAssets.reduce((s, a) => s + a.purchaseCost, 0), [manualAssets]);
  const assetGain = totalAssetValue - totalAssetCost;
  const assetGainPercent = totalAssetCost > 0 ? (assetGain / totalAssetCost) * 100 : 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: DETAILED LIABILITIES & LOANS STATE & HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const [manualLiabilities, setManualLiabilities] = useState<ManualLiability[]>(() => {
    try {
      const stored = localStorage.getItem(`fs_manual_liabilities_${data.userEmail || 'guest'}`);
      return stored ? JSON.parse(stored) : [
        {
          id: 'liab_demo_1',
          title: 'Prime Home Loan',
          type: 'Home Loan',
          lender: 'HDFC Bank',
          principalAmount: 4500000,
          outstandingBalance: 3820000,
          interestRate: 8.65,
          monthlyEmi: 41250,
          dueDay: 5,
          remainingMonths: 184,
        },
      ];
    } catch {
      return [];
    }
  });

  const saveLiabilitiesState = (items: ManualLiability[]) => {
    setManualLiabilities(items);
    if (data.userEmail) {
      localStorage.setItem(`fs_manual_liabilities_${data.userEmail}`, JSON.stringify(items));
    }
  };

  const [loanTitle, setLoanTitle] = useState('');
  const [loanType, setLoanType] = useState<(typeof LIABILITY_TYPES)[number]>('Home Loan');
  const [loanLender, setLoanLender] = useState('');
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanOutstanding, setLoanOutstanding] = useState('');
  const [loanInterest, setLoanInterest] = useState('8.5');
  const [loanEmi, setLoanEmi] = useState('');
  const [loanDueDay, setLoanDueDay] = useState('5');
  const [loanTenure, setLoanTenure] = useState('60');

  const handleAddLiability = (e: React.FormEvent) => {
    e.preventDefault();
    const princ = parseFloat(loanPrincipal);
    const outstand = parseFloat(loanOutstanding) || princ;
    const emi = parseFloat(loanEmi);

    if (!loanTitle.trim() || isNaN(princ) || isNaN(emi) || princ <= 0) {
      showToast('Details Missing', 'Please fill title, sanctioned amount, and monthly EMI.', 'info');
      return;
    }

    const newLiab: ManualLiability = {
      id: `liab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: loanTitle.trim(),
      type: loanType,
      lender: loanLender.trim() || 'Scheduled Bank',
      principalAmount: princ,
      outstandingBalance: outstand,
      interestRate: parseFloat(loanInterest) || 8.5,
      monthlyEmi: emi,
      dueDay: parseInt(loanDueDay) || 5,
      remainingMonths: parseInt(loanTenure) || 36,
    };

    saveLiabilitiesState([newLiab, ...manualLiabilities]);
    setLoanTitle('');
    setLoanLender('');
    setLoanPrincipal('');
    setLoanOutstanding('');
    setLoanEmi('');

    showToast('Liability Logged', `Recorded "${newLiab.title}" with monthly EMI of ₹${emi.toLocaleString('en-IN')}`);
  };

  const handleDeleteLiability = (id: string, title: string) => {
    if (window.confirm(`Delete loan entry "${title}"?`)) {
      const filtered = manualLiabilities.filter(l => l.id !== id);
      saveLiabilitiesState(filtered);
      showToast('Liability Deleted', `"${title}" has been removed.`);
    }
  };

  const totalOutstandingDebt = useMemo(() => manualLiabilities.reduce((s, l) => s + l.outstandingBalance, 0), [manualLiabilities]);
  const totalMonthlyEmi = useMemo(() => manualLiabilities.reduce((s, l) => s + l.monthlyEmi, 0), [manualLiabilities]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4: CATEGORY BUDGETS STATE & HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const [budgetList, setBudgetList] = useState(data.expenses || []);
  const [savingBudgets, setSavingBudgets] = useState(false);

  useEffect(() => {
    if (data.expenses && data.expenses.length > 0) {
      setBudgetList(data.expenses);
    }
  }, [data.expenses]);

  const handleBudgetChange = (idx: number, amount: number) => {
    const updated = [...budgetList];
    updated[idx] = { ...updated[idx], amount: Math.max(0, amount) };
    setBudgetList(updated);
  };

  const handleSaveBudgets = async () => {
    setSavingBudgets(true);
    await setData({ expenses: budgetList });
    setSavingBudgets(false);
    showToast('Budgets Updated', 'Category spending limits saved and synced to your dashboard.');
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 5: 1-CLICK QUICK PRESETS
  // ═══════════════════════════════════════════════════════════════════════════
  const QUICK_PRESETS = [
    { title: 'Monthly Salary Credit', amount: 75000, type: 'credit' as const, category: 'Salary' as Category, desc: 'Monthly Salary Credit [Net Banking • HDFC]' },
    { title: 'Apartment House Rent', amount: 24000, type: 'debit' as const, category: 'Rent' as Category, desc: 'Apartment Monthly Rent [UPI • Landlord]' },
    { title: 'Weekly Supermarket Grocery', amount: 4200, type: 'debit' as const, category: 'Food & Dining' as Category, desc: 'Supermarket Provisions & Essentials [Credit Card]' },
    { title: 'Electricity & Utility Bill', amount: 1850, type: 'debit' as const, category: 'Utilities' as Category, desc: 'Electricity Board Online Payment [UPI]' },
    { title: 'Broadband Internet Fiber', amount: 999, type: 'debit' as const, category: 'Utilities' as Category, desc: 'High-Speed Fiber Broadband Bill [UPI]' },
    { title: 'Mutual Fund Index SIP', amount: 15000, type: 'debit' as const, category: 'Transfer' as Category, desc: 'Nifty 50 Index Fund Monthly SIP [Net Banking]' },
    { title: 'Dining Out & Food Delivery', amount: 1250, type: 'debit' as const, category: 'Food & Dining' as Category, desc: 'Dinner & Food Delivery [UPI]' },
    { title: 'Streaming & Cloud Subscriptions', amount: 1199, type: 'debit' as const, category: 'Subscriptions' as Category, desc: 'OTT & Cloud Subscriptions Bundle [Credit Card]' },
  ];

  const handleApplyPreset = async (preset: (typeof QUICK_PRESETS)[0]) => {
    const newTxn: Transaction = {
      id: `man_preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      description: preset.desc,
      amount: preset.type === 'credit' ? preset.amount : -preset.amount,
      category: preset.category,
      isRecurring: true,
      source: 'manual',
    };
    await addTransactions([newTxn]);
    showToast('Preset Added', `Recorded "${preset.title}" (₹${preset.amount.toLocaleString('en-IN')})`);
  };

  // CSV Export for manual entries
  const exportManualCsv = () => {
    if (allManualTxns.length === 0) {
      showToast('No Records', 'No manual transactions to export.', 'info');
      return;
    }
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Source'];
    const rows = allManualTxns.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      Math.abs(t.amount),
      t.amount >= 0 ? 'Income' : 'Expense',
      t.category,
      t.source || 'manual',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinSight_Manual_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Complete', 'Manual records exported as CSV.');
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast notification banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 9999,
              background: toastMessage.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(59, 130, 246, 0.95)',
              backdropFilter: 'blur(12px)',
              color: '#ffffff',
              padding: '14px 20px',
              borderRadius: 14,
              boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 300,
            }}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{toastMessage.title}</p>
              <p style={{ fontSize: 12, margin: '2px 0 0 0', opacity: 0.9 }}>{toastMessage.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>Manual Entry Hub</h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(129, 140, 248, 0.15)',
                color: 'var(--purple)',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Granular Data Entry
            </span>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 650, lineHeight: 1.5 }}>
            Record detailed transactions, track physical and unlinked assets, manage debt & EMI commitments, and calibrate monthly category budget allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportManualCsv} className="btn-outline" style={{ padding: '10px 18px', fontSize: 13 }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <motion.div className="panel" style={{ padding: '20px 22px' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Manual Records</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(129, 140, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
              <FileSpreadsheet size={18} />
            </div>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{allManualTxns.length}</p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Total manual ledger entries</p>
        </motion.div>

        <motion.div className="panel" style={{ padding: '20px 22px' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Manual Inflow</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(52, 211, 153, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--green)' }}>
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', margin: 0 }}>
            +₹{totalManualInflow.toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Recorded earnings & credits</p>
        </motion.div>

        <motion.div className="panel" style={{ padding: '20px 22px' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Manual Outflow</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(248, 113, 113, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--red)', margin: 0 }}>
            -₹{totalManualOutflow.toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Recorded expenses & debits</p>
        </motion.div>

        <motion.div className="panel" style={{ padding: '20px 22px' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Offline Assets Tracked</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(240, 180, 41, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--amber)' }}>
              <Coins size={18} />
            </div>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--amber)', margin: 0 }}>
            ₹{totalAssetValue.toLocaleString('en-IN')}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{manualAssets.length} asset holdings logged</p>
        </motion.div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 24, overflowX: 'auto' }}>
        {[
          { id: 'transactions', label: 'Detailed Transactions', icon: FileSpreadsheet, count: allManualTxns.length },
          { id: 'assets', label: 'Assets & Investments', icon: Coins, count: manualAssets.length },
          { id: 'liabilities', label: 'Liabilities & EMIs', icon: Landmark, count: manualLiabilities.length },
          { id: 'budgets', label: 'Category Budgets', icon: Sliders },
          { id: 'presets', label: '1-Click Presets', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 12,
                border: 'none',
                background: isActive ? 'var(--surface-hover)' : 'transparent',
                color: isActive ? 'var(--purple)' : 'var(--text2)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 10,
                    background: isActive ? 'rgba(129, 140, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? 'var(--purple)' : 'var(--text3)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. TRANSACTIONS TAB */}
      {activeTab === 'transactions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* Add Transaction Form */}
          <motion.div className="panel" style={{ padding: 24 }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusCircle size={18} color="var(--purple)" /> Record New Transaction
            </h3>

            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type Toggle: Debit vs Credit */}
              <div>
                <label className="label" style={{ marginBottom: 6 }}>Transaction Nature</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setTxnType('debit')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: txnType === 'debit' ? '1.5px solid var(--red)' : '1px solid var(--border)',
                      background: txnType === 'debit' ? 'rgba(248, 113, 113, 0.12)' : 'var(--bg2)',
                      color: txnType === 'debit' ? 'var(--red)' : 'var(--text2)',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowUpRight size={16} /> Expense (Debit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnType('credit')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: txnType === 'credit' ? '1.5px solid var(--green)' : '1px solid var(--border)',
                      background: txnType === 'credit' ? 'rgba(52, 211, 153, 0.12)' : 'var(--bg2)',
                      color: txnType === 'credit' ? 'var(--green)' : 'var(--text2)',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowDownLeft size={16} /> Income (Credit)
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="label">Amount (₹) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text3)', fontSize: 16 }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={txnAmount}
                    onChange={e => setTxnAmount(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 34, fontSize: 16, fontWeight: 700 }}
                    required
                  />
                </div>
              </div>

              {/* Description / Merchant */}
              <div>
                <label className="label">Merchant / Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Reliance Fresh, Netflix, Client Retainer"
                  value={txnDesc}
                  onChange={e => setTxnDesc(e.target.value)}
                  className="input"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="label">Category</label>
                <select
                  value={txnCategory}
                  onChange={e => setTxnCategory(e.target.value as Category)}
                  className="input"
                  style={{ cursor: 'pointer' }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat]?.icon || '📌'} {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Payment Mode */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={txnDate}
                    onChange={e => setTxnDate(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Payment Mode</label>
                  <select
                    value={txnPaymentMode}
                    onChange={e => setTxnPaymentMode(e.target.value)}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  >
                    {PAYMENT_MODES.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bank Account & Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Bank / Wallet</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC, ICICI, Cash"
                    value={txnBank}
                    onChange={e => setTxnBank(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Ref / UPI ID</label>
                  <input
                    type="text"
                    placeholder="Optional UTR / ID"
                    value={txnRef}
                    onChange={e => setTxnRef(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              {/* Recurring Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={txnRecurring}
                  onChange={e => setTxnRecurring(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--purple)', cursor: 'pointer' }}
                />
                Mark as recurring (Monthly recurring commitment)
              </label>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 4 }}>
                <PlusCircle size={16} /> Save Transaction Entry
              </button>
            </form>
          </motion.div>

          {/* Transactions List & Explorer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filter Toolbar */}
            <div className="panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
                  <input
                    type="text"
                    placeholder="Search manual records..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input"
                    style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
                  />
                </div>

                {/* Filter Type */}
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as any)}
                  className="input"
                  style={{ width: 130, height: 38, fontSize: 13, cursor: 'pointer' }}
                >
                  <option value="all">All Flows</option>
                  <option value="debit">Expenses only</option>
                  <option value="credit">Income only</option>
                </select>

                {/* Filter Category */}
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="input"
                  style={{ width: 150, height: 38, fontSize: 13, cursor: 'pointer' }}
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text3)' }}>
                <span>Showing {manualTransactions.length} transaction(s)</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={filterOnlyManual}
                    onChange={e => setFilterOnlyManual(e.target.checked)}
                    style={{ accentColor: 'var(--purple)', cursor: 'pointer' }}
                  />
                  Only manual entries
                </label>
              </div>
            </div>

            {/* List */}
            {manualTransactions.length === 0 ? (
              <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
                <FileSpreadsheet size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No Transactions Found</h4>
                <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
                  {allManualTxns.length === 0
                    ? 'No manual records added yet. Use the form on the left to record your first transaction.'
                    : 'No transactions match your current search and filter criteria.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {manualTransactions.map(txn => {
                  const isCredit = txn.amount >= 0;
                  const cfg = CATEGORY_CONFIG[txn.category] || { icon: '📌', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' };
                  return (
                    <motion.div
                      key={txn.id}
                      className="panel"
                      style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 12,
                            background: cfg.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {cfg.icon}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: '0 0 3px 0' }}>
                            {txn.description}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text3)' }}>
                            <span>{txn.date}</span>
                            <span>•</span>
                            <span style={{ color: cfg.color, fontWeight: 500 }}>{txn.category}</span>
                            {txn.source === 'manual' && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: '1px 6px',
                                  borderRadius: 8,
                                  background: 'rgba(129, 140, 248, 0.15)',
                                  color: 'var(--purple)',
                                  fontWeight: 600,
                                }}
                              >
                                Manual
                              </span>
                            )}
                            {txn.isRecurring && (
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'rgba(240, 180, 41, 0.15)', color: 'var(--amber)', fontWeight: 600 }}>
                                Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <p
                          style={{
                            fontWeight: 800,
                            fontSize: 16,
                            margin: 0,
                            color: isCredit ? 'var(--green)' : 'var(--red)',
                            textAlign: 'right',
                          }}
                        >
                          {isCredit ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                        <button
                          onClick={() => handleDeleteTxn(txn.id, txn.description)}
                          title="Delete manual record"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text3)',
                            cursor: 'pointer',
                            padding: 6,
                            borderRadius: 8,
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ASSETS TAB */}
      {activeTab === 'assets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* Add Asset Form */}
          <motion.div className="panel" style={{ padding: 24 }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Coins size={18} color="var(--amber)" /> Add Asset / Holding
            </h3>

            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Asset Title / Identifier *</label>
                <input
                  type="text"
                  placeholder="e.g. Sovereign Gold Bonds 2026, Bangalore Plot"
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Asset Classification</label>
                <select
                  value={assetCategory}
                  onChange={e => setAssetCategory(e.target.value as any)}
                  className="input"
                  style={{ cursor: 'pointer' }}
                >
                  {ASSET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Current Market Value (₹) *</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={assetValue}
                    onChange={e => setAssetValue(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Purchase / Cost Basis (₹)</label>
                  <input
                    type="number"
                    placeholder="Original Cost"
                    value={assetCost}
                    onChange={e => setAssetCost(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Acquisition Date</label>
                  <input
                    type="date"
                    value={assetDate}
                    onChange={e => setAssetDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12.0"
                    value={assetCagr}
                    onChange={e => setAssetCagr(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Custodian / Broker / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Zerodha, SBI Mutual Fund, Physical"
                  value={assetInstitution}
                  onChange={e => setAssetInstitution(e.target.value)}
                  className="input"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 4 }}>
                <PlusCircle size={16} /> Register Asset
              </button>
            </form>
          </motion.div>

          {/* Asset List & Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Overview Banner */}
            <div className="panel" style={{ padding: '20px 24px', background: 'var(--grad-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px 0' }}>Total Portfolio Worth</p>
                  <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--amber)' }}>
                    ₹{totalAssetValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px 0' }}>Total Cost Basis</p>
                  <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                    ₹{totalAssetCost.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px 0' }}>Unrealized Gain / Loss</p>
                  <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: assetGain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {assetGain >= 0 ? '+' : ''}₹{assetGain.toLocaleString('en-IN')} ({assetGainPercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Asset Items */}
            {manualAssets.length === 0 ? (
              <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
                <Coins size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No Assets Logged</h4>
                <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
                  Add properties, mutual fund folios, gold, or private holdings to monitor your holistic net worth.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {manualAssets.map(asset => {
                  const gain = asset.currentValue - asset.purchaseCost;
                  const pct = asset.purchaseCost > 0 ? (gain / asset.purchaseCost) * 100 : 0;
                  return (
                    <motion.div
                      key={asset.id}
                      className="panel"
                      style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{asset.name}</h4>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 10,
                              background: 'rgba(240, 180, 41, 0.15)',
                              color: 'var(--amber)',
                              fontWeight: 600,
                            }}
                          >
                            {asset.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
                          {asset.institution && <span>Custodian: {asset.institution}</span>}
                          {asset.cagr && <span>Expected: {asset.cagr}% p.a.</span>}
                          <span>Cost: ₹{asset.purchaseCost.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>
                            ₹{asset.currentValue.toLocaleString('en-IN')}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 600, margin: '2px 0 0 0', color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {gain >= 0 ? '+' : ''}₹{gain.toLocaleString('en-IN')} ({pct.toFixed(1)}%)
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAsset(asset.id, asset.name)}
                          title="Delete asset record"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text3)',
                            cursor: 'pointer',
                            padding: 6,
                            borderRadius: 8,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. LIABILITIES & LOANS TAB */}
      {activeTab === 'liabilities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: 24, alignItems: 'flex-start' }}>
          {/* Add Loan Form */}
          <motion.div className="panel" style={{ padding: 24 }} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Landmark size={18} color="var(--red)" /> Log Debt / Loan Commitment
            </h3>

            <form onSubmit={handleAddLiability} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Loan / Debt Title *</label>
                <input
                  type="text"
                  placeholder="e.g. SBI Home Loan, Axis Car Loan"
                  value={loanTitle}
                  onChange={e => setLoanTitle(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Liability Type</label>
                <select
                  value={loanType}
                  onChange={e => setLoanType(e.target.value as any)}
                  className="input"
                  style={{ cursor: 'pointer' }}
                >
                  {LIABILITY_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Lender Institution / Bank</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={loanLender}
                  onChange={e => setLoanLender(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Sanctioned Amount (₹) *</label>
                  <input
                    type="number"
                    placeholder="Total Principal"
                    value={loanPrincipal}
                    onChange={e => setLoanPrincipal(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Outstanding Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="Current Balance"
                    value={loanOutstanding}
                    onChange={e => setLoanOutstanding(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Monthly EMI (₹) *</label>
                  <input
                    type="number"
                    placeholder="Monthly Payment"
                    value={loanEmi}
                    onChange={e => setLoanEmi(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="8.5"
                    value={loanInterest}
                    onChange={e => setLoanInterest(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">EMI Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={loanDueDay}
                    onChange={e => setLoanDueDay(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Tenure Left (Months)</label>
                  <input
                    type="number"
                    placeholder="Months remaining"
                    value={loanTenure}
                    onChange={e => setLoanTenure(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14, marginTop: 4 }}>
                <PlusCircle size={16} /> Save Liability Record
              </button>
            </form>
          </motion.div>

          {/* Liabilities List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Overview Banner */}
            <div className="panel" style={{ padding: '20px 24px', background: 'var(--grad-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px 0' }}>Total Outstanding Debt</p>
                  <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--red)' }}>
                    ₹{totalOutstandingDebt.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px 0' }}>Monthly EMI Burden</p>
                  <p style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--purple)' }}>
                    ₹{totalMonthlyEmi.toLocaleString('en-IN')} / mo
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: '0 0 4px 0' }}>Active Commitments</p>
                  <p style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
                    {manualLiabilities.length} Loan(s)
                  </p>
                </div>
              </div>
            </div>

            {manualLiabilities.length === 0 ? (
              <div className="panel" style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
                <Landmark size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No Liabilities Logged</h4>
                <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto' }}>
                  Track your mortgages, car loans, and EMIs to calculate accurate debt payoff schedules.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {manualLiabilities.map(liab => {
                  const paid = liab.principalAmount - liab.outstandingBalance;
                  const paidPct = liab.principalAmount > 0 ? (paid / liab.principalAmount) * 100 : 0;
                  return (
                    <motion.div
                      key={liab.id}
                      className="panel"
                      style={{ padding: '18px 22px' }}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{liab.title}</h4>
                            <span
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 10,
                                background: 'rgba(248, 113, 113, 0.15)',
                                color: 'var(--red)',
                                fontWeight: 600,
                              }}
                            >
                              {liab.type}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>
                            {liab.lender} • {liab.interestRate}% p.a. • EMI due on {liab.dueDay}th of month
                          </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--red)' }}>
                              ₹{liab.outstandingBalance.toLocaleString('en-IN')} left
                            </p>
                            <p style={{ fontSize: 12, color: 'var(--text2)', margin: '2px 0 0 0' }}>
                              EMI: ₹{liab.monthlyEmi.toLocaleString('en-IN')}/mo
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLiability(liab.id, liab.title)}
                            title="Delete liability"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text3)',
                              cursor: 'pointer',
                              padding: 6,
                              borderRadius: 8,
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Payoff Progress */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
                          <span>Principal Repaid: {paidPct.toFixed(1)}%</span>
                          <span>{liab.remainingMonths} Months Remaining</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg3)', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, Math.max(0, paidPct))}%`,
                              background: 'var(--green)',
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. BUDGETS TAB */}
      {activeTab === 'budgets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Monthly Category Budgets</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                Calibrate monthly spending caps per category to enforce savings targets and receive early notifications.
              </p>
            </div>
            <button
              onClick={handleSaveBudgets}
              disabled={savingBudgets}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              {savingBudgets ? 'Saving Targets...' : 'Save Category Budgets'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {budgetList.map((item, idx) => {
              const cfg = CATEGORY_CONFIG[item.name as Category] || { icon: '📌', color: item.color || '#818cf8', bg: 'rgba(129,140,248,0.1)' };
              return (
                <div key={item.name} className="panel" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: cfg.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                        }}
                      >
                        {cfg.icon}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Target limit</span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text3)' }}>
                      ₹
                    </span>
                    <input
                      type="number"
                      step="500"
                      value={item.amount}
                      onChange={e => handleBudgetChange(idx, parseFloat(e.target.value) || 0)}
                      className="input"
                      style={{ paddingLeft: 32, fontWeight: 700, fontSize: 15 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 1-CLICK PRESETS TAB */}
      {activeTab === 'presets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="panel" style={{ padding: '24px 28px', background: 'var(--grad-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Sparkles size={20} color="var(--purple)" />
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Rapid Financial Entry Templates</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 650, margin: 0 }}>
              Quickly inject standard recurring salaries, rental payments, utility invoices, and mutual fund SIPs with 1 click.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {QUICK_PRESETS.map((preset, i) => {
              const isCredit = preset.type === 'credit';
              const cfg = CATEGORY_CONFIG[preset.category] || { icon: '📌', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' };
              return (
                <motion.div
                  key={preset.title}
                  className="panel panel-glow"
                  style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background: cfg.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}
                      >
                        {cfg.icon}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 3px 0' }}>{preset.title}</h4>
                        <span style={{ fontSize: 12, color: cfg.color, fontWeight: 500 }}>{preset.category}</span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: isCredit ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {isCredit ? '+' : '-'}₹{preset.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>{preset.desc}</p>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="btn-outline"
                    style={{ width: '100%', padding: '10px 14px', fontSize: 13, gap: 6 }}
                  >
                    <PlusCircle size={15} /> Add to Ledger
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
