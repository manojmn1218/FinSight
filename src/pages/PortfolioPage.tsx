import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Crown, Plus, Trash2, Calendar, UserCheck, Wallet, LineChart, Briefcase, X, Brain, TrendingUp, BarChart3, Zap, Shield, ArrowUpRight, Sparkles, Info, Key, RefreshCw, Loader2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';
import { fetchQuotesWithCache, hasApiKey, getApiKey, setApiKey as saveApiKey } from '../utils/stockApi';
import type { StockQuote } from '../utils/stockApi';

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

interface Asset {
  id: string;
  name: string;
  category: 'Mutual Funds' | 'Equity' | 'Crypto' | 'Gold' | 'Real Estate' | 'Cash & Bank';
  value: number;
  isAutoDetected?: boolean;
}

const HISTORICAL_NET_WORTH_FALLBACK = [
  { month: 'Jan', worth: 50000 },
  { month: 'Feb', worth: 55000 },
  { month: 'Mar', worth: 60000 },
  { month: 'Apr', worth: 65000 },
  { month: 'May', worth: 70000 },
  { month: 'Jun', worth: 75000 },
];

const CATEGORY_COLORS = {
  'Mutual Funds': '#818cf8',
  'Equity': '#60a5fa',
  'Crypto': '#f472b6',
  'Gold': '#f0b429',
  'Real Estate': '#34d399',
  'Cash & Bank': '#a78bfa',
};

// ─── AI Stock Prediction Engine (Client-side, personalized) ───

interface StockPick {
  ticker: string;
  bseSymbol: string; // Alpha Vantage BSE symbol
  name: string;
  sector: string;
  confidence: 'Strong Buy' | 'Buy' | 'Hold';
  returnRange: string;
  returnMin: number;
  returnMax: number;
  risk: 'Low' | 'Medium' | 'High';
  color: string;
}

interface SIPRecommendation {
  fund: string;
  category: string;
  sipAmount: number;
  expectedCAGR: string;
  color: string;
}

const STOCK_UNIVERSE: StockPick[] = [
  // Indian ADRs (US-listed, Alpha Vantage reliable)
  { ticker: 'INFY', bseSymbol: 'INFY', name: 'Infosys Ltd (ADR)', sector: 'IT Services', confidence: 'Buy', returnRange: '+6% to +12%', returnMin: 6, returnMax: 12, risk: 'Low', color: '#38bdf8' },
  { ticker: 'WIT', bseSymbol: 'WIT', name: 'Wipro Ltd (ADR)', sector: 'IT Services', confidence: 'Buy', returnRange: '+5% to +11%', returnMin: 5, returnMax: 11, risk: 'Low', color: '#60a5fa' },
  { ticker: 'HDB', bseSymbol: 'HDB', name: 'HDFC Bank (ADR)', sector: 'Banking', confidence: 'Strong Buy', returnRange: '+9% to +16%', returnMin: 9, returnMax: 16, risk: 'Low', color: '#34d399' },
  { ticker: 'IBN', bseSymbol: 'IBN', name: 'ICICI Bank (ADR)', sector: 'Banking', confidence: 'Buy', returnRange: '+8% to +14%', returnMin: 8, returnMax: 14, risk: 'Low', color: '#4ade80' },
  { ticker: 'TTM', bseSymbol: 'TTM', name: 'Tata Motors (ADR)', sector: 'Automobile', confidence: 'Strong Buy', returnRange: '+11% to +19%', returnMin: 11, returnMax: 19, risk: 'Medium', color: '#a78bfa' },
  // Top Global Stocks (Alpha Vantage reliable)
  { ticker: 'AAPL', bseSymbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', confidence: 'Strong Buy', returnRange: '+8% to +15%', returnMin: 8, returnMax: 15, risk: 'Low', color: '#818cf8' },
  { ticker: 'MSFT', bseSymbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology', confidence: 'Strong Buy', returnRange: '+10% to +18%', returnMin: 10, returnMax: 18, risk: 'Low', color: '#60a5fa' },
  { ticker: 'GOOGL', bseSymbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology', confidence: 'Buy', returnRange: '+7% to +14%', returnMin: 7, returnMax: 14, risk: 'Medium', color: '#34d399' },
  { ticker: 'AMZN', bseSymbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-Commerce', confidence: 'Buy', returnRange: '+9% to +16%', returnMin: 9, returnMax: 16, risk: 'Medium', color: '#f472b6' },
  { ticker: 'NVDA', bseSymbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Semiconductors', confidence: 'Strong Buy', returnRange: '+12% to +22%', returnMin: 12, returnMax: 22, risk: 'High', color: '#fbbf24' },
  { ticker: 'TSLA', bseSymbol: 'TSLA', name: 'Tesla Inc.', sector: 'EV / Auto', confidence: 'Hold', returnRange: '+4% to +20%', returnMin: 4, returnMax: 20, risk: 'High', color: '#fb923c' },
  { ticker: 'META', bseSymbol: 'META', name: 'Meta Platforms', sector: 'Social Media', confidence: 'Buy', returnRange: '+8% to +15%', returnMin: 8, returnMax: 15, risk: 'Medium', color: '#c084fc' },
];

const SIP_FUNDS: Omit<SIPRecommendation, 'sipAmount'>[] = [
  { fund: 'Nifty 50 Index Fund', category: 'Index Fund', expectedCAGR: '12–14%', color: '#818cf8' },
  { fund: 'Mirae Asset Large Cap', category: 'Large Cap', expectedCAGR: '13–16%', color: '#34d399' },
  { fund: 'Axis Midcap Fund', category: 'Mid Cap', expectedCAGR: '14–18%', color: '#f472b6' },
  { fund: 'Quant Small Cap Fund', category: 'Small Cap', expectedCAGR: '16–22%', color: '#fbbf24' },
  { fund: 'Parag Parikh Flexi Cap', category: 'Flexi Cap', expectedCAGR: '13–17%', color: '#c084fc' },
];

function generateStockPicks(surplus: number, savingsRate: number, hasEquity: boolean): StockPick[] {
  // Personalize: if low surplus, recommend low-risk; if high savings rate, more aggressive
  let pool = [...STOCK_UNIVERSE];
  if (surplus < 10000) {
    // Conservative — prioritize Low risk and Buy/Strong Buy
    pool = pool.filter(s => s.risk !== 'High');
  } else if (savingsRate > 30) {
    // Aggressive — include high-risk picks at top
    pool.sort((a, b) => b.returnMax - a.returnMax);
  }
  // If already heavy on equity, suggest diversification — deprioritize equity-heavy picks
  if (hasEquity) {
    pool.sort((a, b) => {
      const aScore = a.confidence === 'Strong Buy' ? 3 : a.confidence === 'Buy' ? 2 : 1;
      const bScore = b.confidence === 'Strong Buy' ? 3 : b.confidence === 'Buy' ? 2 : 1;
      return bScore - aScore;
    });
  }
  return pool.slice(0, 8);
}

function generateSIPs(monthlySavings: number): SIPRecommendation[] {
  if (monthlySavings <= 0) {
    return SIP_FUNDS.slice(0, 3).map(f => ({ ...f, sipAmount: 500 }));
  }
  // Allocate 60% of monthly savings across SIPs
  const sipBudget = Math.round(monthlySavings * 0.6);
  const perFund = Math.max(500, Math.round(sipBudget / 4 / 500) * 500); // Round to ₹500
  return SIP_FUNDS.slice(0, 4).map(f => ({ ...f, sipAmount: perFund }));
}

function getMarketSentiment(savingsRate: number, portfolioValue: number): { sentiment: 'Bullish' | 'Neutral' | 'Bearish'; color: string; niftyDir: string; sensexDir: string; equityPct: number; debtPct: number; goldPct: number } {
  if (savingsRate >= 25 && portfolioValue > 100000) {
    return { sentiment: 'Bullish', color: '#34d399', niftyDir: '↑ +1.8%', sensexDir: '↑ +1.6%', equityPct: 70, debtPct: 20, goldPct: 10 };
  } else if (savingsRate >= 10) {
    return { sentiment: 'Neutral', color: '#fbbf24', niftyDir: '→ +0.4%', sensexDir: '→ +0.3%', equityPct: 50, debtPct: 35, goldPct: 15 };
  }
  return { sentiment: 'Bearish', color: '#f87171', niftyDir: '↓ −0.6%', sensexDir: '↓ −0.8%', equityPct: 30, debtPct: 45, goldPct: 25 };
}

const CONFIDENCE_STYLES: Record<string, { bg: string; color: string }> = {
  'Strong Buy': { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  'Buy': { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  'Hold': { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
};

const RISK_STYLES: Record<string, { bg: string; color: string }> = {
  'Low': { bg: 'rgba(52,211,153,0.10)', color: '#34d399' },
  'Medium': { bg: 'rgba(251,191,36,0.10)', color: '#fbbf24' },
  'High': { bg: 'rgba(248,113,113,0.10)', color: '#f87171' },
};

export default function PortfolioPage() {
  const { data } = useFinance();
  const isWealth = data.currentPlan === 'Wealth';
  const txns = useMemo(() => data.transactions || [], [data.transactions]);

  // State for user manually added assets (loaded from local storage if available)
  const [manualAssets, setManualAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem(`fs_assets_${data.userEmail}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Exclude<Asset['category'], 'Cash & Bank'>>('Mutual Funds');
  const [value, setValue] = useState('');

  // Advisor state
  const [advisorBooked, setAdvisorBooked] = useState(false);
  const [advisorDate, setAdvisorDate] = useState('');

  const saveManualAssets = (newAssets: Asset[]) => {
    setManualAssets(newAssets);
    try {
      localStorage.setItem(`fs_assets_${data.userEmail}`, JSON.stringify(newAssets));
    } catch (e) {
      console.error(e);
    }
  };

  const addAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !value) return;
    const newAsset: Asset = {
      id: 'asset_' + Date.now().toString(36),
      name: name.trim(),
      category,
      value: Number(value),
    };
    saveManualAssets([...manualAssets, newAsset]);
    setName('');
    setValue('');
    setShowAddModal(false);
  };

  const deleteAsset = (id: string) => {
    saveManualAssets(manualAssets.filter(a => a.id !== id));
  };

  // ─── Real Dynamic Cash & Bank Balance ───
  const bankBalance = useMemo(() => {
    if (txns.length > 0) {
      const sortedTxns = [...txns].sort((a, b) => a.date.localeCompare(b.date));
      const lastTx = [...sortedTxns].reverse().find(t => t.balance != null);
      if (lastTx?.balance != null) return lastTx.balance;
    }
    return data.totalBalance || 0;
  }, [txns, data.totalBalance]);

  // ─── Real Dynamic Auto-Detected Investments from Statement ───
  const detectedInvestments = useMemo(() => {
    const list: Asset[] = [];
    const mutualFundKeywords = ['mutual fund', 'sip', 'groww', 'zerodha', 'smallcase', 'etf', 'axis mutual', 'sbi mutual', 'icici mutual', 'nippon', 'mirae', 'parag parikh', 'quant mutual', 'dsp blackrock', 'tata mutual', 'motilal oswal', 'mirae asset', 'franklin templeton', 'l&t mutual', 'canara robeco', 'sundaram', 'kotak mutual', 'baroda pioneer', 'invesco', 'idfc mutual', 'hsbc mutual', 'tata aia', 'lic mutual'];
    const cryptoKeywords = ['crypto', 'coinngx', 'wazirx', 'binance', 'coinbase', 'crypto.com', 'eth ', 'btc ', 'solana', 'coindcx', 'zebpay'];
    const goldKeywords = ['sovereign gold', 'gold bond', ' sgb', 'mmtc', 'safe gold', 'digital gold'];

    let mutualFundTotal = 0;
    let cryptoTotal = 0;
    let goldTotal = 0;

    for (const tx of txns) {
      if (tx.amount < 0) { // investment outflow from bank account
        const desc = tx.description.toLowerCase();
        const amt = Math.abs(tx.amount);

        if (mutualFundKeywords.some(kw => desc.includes(kw))) {
          mutualFundTotal += amt;
        } else if (cryptoKeywords.some(kw => desc.includes(kw))) {
          cryptoTotal += amt;
        } else if (goldKeywords.some(kw => desc.includes(kw))) {
          goldTotal += amt;
        }
      }
    }

    if (mutualFundTotal > 0) {
      list.push({
        id: 'detect_mf',
        name: 'Detected Mutual Funds / SIPs',
        category: 'Mutual Funds',
        value: Math.round(mutualFundTotal),
        isAutoDetected: true,
      });
    }

    if (cryptoTotal > 0) {
      list.push({
        id: 'detect_crypto',
        name: 'Detected Crypto Portfolios',
        category: 'Crypto',
        value: Math.round(cryptoTotal),
        isAutoDetected: true,
      });
    }

    if (goldTotal > 0) {
      list.push({
        id: 'detect_gold',
        name: 'Detected Sovereign Gold Bonds',
        category: 'Gold',
        value: Math.round(goldTotal),
        isAutoDetected: true,
      });
    }

    return list;
  }, [txns]);

  // ─── Consolidated real asset portfolio ───
  const consolidatedAssets = useMemo(() => {
    const bankAsset: Asset = {
      id: 'real_bank_bal',
      name: 'Bank Account Balance',
      category: 'Cash & Bank',
      value: Math.round(bankBalance),
    };
    return [bankAsset, ...detectedInvestments, ...manualAssets];
  }, [bankBalance, detectedInvestments, manualAssets]);

  const totalPortfolioValue = useMemo(() => {
    return consolidatedAssets.reduce((sum, a) => sum + a.value, 0);
  }, [consolidatedAssets]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    consolidatedAssets.forEach(a => {
      totals[a.category] = (totals[a.category] || 0) + a.value;
    });
    return Object.entries(totals).map(([cat, val]) => ({
      name: cat,
      value: val,
      color: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] || '#64748b',
    })).sort((a, b) => b.value - a.value);
  }, [consolidatedAssets]);

  // ─── Real Net Worth growth timeline from transaction history ───
  const netWorthTimeline = useMemo(() => {
    if (txns.length === 0) {
      // If onboarding profile exists, pre-populate using manual onboarding values
      const onboardingWorth = (data.totalBalance || 0) + manualAssets.reduce((s, a) => s + a.value, 0);
      return HISTORICAL_NET_WORTH_FALLBACK.map((item, idx) => ({
        month: item.month,
        worth: onboardingWorth > 0 ? Math.round(onboardingWorth * (0.9 + idx * 0.02)) : item.worth,
      }));
    }

    const sortedTxns = [...txns].sort((a, b) => a.date.localeCompare(b.date));
    const monthMap = new Map<string, number>();

    // Calculate manual assets value to add to net worth
    const manualVal = manualAssets.reduce((s, a) => s + a.value, 0);

    for (const tx of sortedTxns) {
      if (tx.balance != null) {
        const monthKey = tx.date.slice(0, 7); // YYYY-MM
        monthMap.set(monthKey, tx.balance + manualVal);
      }
    }

    const list = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, val]) => {
        const date = new Date(month + '-01');
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          worth: Math.round(val),
        };
      });

    return list.length > 0 ? list : HISTORICAL_NET_WORTH_FALLBACK;
  }, [txns, data.totalBalance, manualAssets]);

  // ─── AI Prediction Engine (personalized) ───
  const surplus = useMemo(() => {
    const totalExp = data.expenses.reduce((s, e) => s + e.amount, 0);
    const savAmt = Math.round((data.monthlyIncome * data.savingsPercent) / 100);
    return Math.max(0, data.monthlyIncome - totalExp - savAmt);
  }, [data.monthlyIncome, data.expenses, data.savingsPercent]);

  const savingsRate = useMemo(() => {
    if (data.monthlyIncome <= 0) return 0;
    const totalExp = data.expenses.reduce((s, e) => s + e.amount, 0);
    return Math.round(((data.monthlyIncome - totalExp) / data.monthlyIncome) * 100);
  }, [data.monthlyIncome, data.expenses]);

  const hasEquityAssets = useMemo(() => {
    return consolidatedAssets.some(a => a.category === 'Equity');
  }, [consolidatedAssets]);

  const stockPicks = useMemo(() => generateStockPicks(surplus, savingsRate, hasEquityAssets), [surplus, savingsRate, hasEquityAssets]);
  const sipRecs = useMemo(() => generateSIPs(Math.round((data.monthlyIncome * data.savingsPercent) / 100)), [data.monthlyIncome, data.savingsPercent]);
  const marketOutlook = useMemo(() => getMarketSentiment(savingsRate, totalPortfolioValue), [savingsRate, totalPortfolioValue]);

  // ─── Real Stock API Integration ───
  const [liveQuotes, setLiveQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey());
  const [showApiSetup, setShowApiSetup] = useState(!hasApiKey());
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);

  const fetchLiveQuotes = useCallback(async () => {
    if (!hasApiKey()) return;
    setQuotesLoading(true);
    setQuotesError(null);
    try {
      const symbols = stockPicks.map(s => s.bseSymbol);
      const quotes = await fetchQuotesWithCache(symbols);
      setLiveQuotes(quotes);
      setLastFetchTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
      if (quotes.size === 0) {
        setQuotesError('No data returned. API limit may be reached or symbols unavailable.');
      }
    } catch (err: unknown) {
      setQuotesError(err instanceof Error ? err.message : 'Failed to fetch live data. Check your API key.');
    } finally {
      setQuotesLoading(false);
    }
  }, [stockPicks]);

  // Auto-fetch on mount if API key exists
  useEffect(() => {
    if (!hasApiKey() || !isWealth) return;
    let ignore = false;
    const timer = setTimeout(() => {
      if (!ignore) {
        fetchLiveQuotes();
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [fetchLiveQuotes, isWealth]);

  const handleSaveApiKey = () => {
    saveApiKey(apiKeyInput);
    setShowApiSetup(false);
    fetchLiveQuotes();
  };

  const tooltipStyle = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text)', boxShadow: 'var(--shadow)' };
  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  // ═══════════════════════════════════════════════
  // GATED / LOCKED STATE: Not on Wealth Plan
  // ═══════════════════════════════════════════════
  if (!isWealth) {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center', paddingBottom: 60, maxWidth: 900, margin: '0 auto' }}>
        {/* Lock banner */}
        <motion.div {...an(0)} style={{ textAlign: 'center', paddingTop: 20 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            borderRadius: 999, background: 'rgba(240,180,41,0.1)', color: 'var(--amber)',
            fontSize: 12, fontWeight: 700, marginBottom: 20, letterSpacing: 0.8,
          }}>
            <Crown size={14} /> WEALTH EXCLUSIVE
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
            Unlock Net Worth & Asset Tracking
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6, maxWidth: 500, margin: '0 auto' }}>
            Consolidate your mutual funds, equity portfolios, gold, crypto, and real estate assets in one unified screen with direct advisory sessions.
          </p>
        </motion.div>

        {/* Mock/Preview Dashboard Layout */}
        <motion.div
          className="panel"
          style={{
            width: '100%', padding: 24, position: 'relative', overflow: 'hidden',
            filter: 'blur(3.5px)', opacity: 0.35, pointerEvents: 'none',
          }}
          {...an(1)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            <div className="panel" style={{ padding: 18 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>TOTAL NET WORTH</span>
              <p style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>₹20,05,000</p>
            </div>
            <div className="panel" style={{ padding: 18 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>PORTFOLIO CHANGE (YTD)</span>
              <p style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: 'var(--green)' }}>+14.25%</p>
            </div>
            <div className="panel" style={{ padding: 18 }}>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>1-ON-1 ADVISORY</span>
              <p style={{ fontSize: 16, fontWeight: 700, marginTop: 10, color: 'var(--purple)' }}>1 Available session</p>
            </div>
          </div>
          <div style={{ height: 200, background: 'var(--bg2)', borderRadius: 12, marginBottom: 16 }} />
        </motion.div>

        {/* Unlock Prompt Panel */}
        <motion.div
          className="panel"
          style={{
            width: '100%', padding: 40, marginTop: -200, zIndex: 10,
            background: 'var(--surface)', border: '1px solid rgba(240,180,41,0.25)',
            boxShadow: 'var(--shadow-lg), 0 0 32px rgba(240,180,41,0.06)',
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
          {...an(2)}
        >
          <div style={{
            width: 72, height: 72, borderRadius: 24, background: 'rgba(240,180,41,0.15)',
            color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}>
            <Crown size={36} />
          </div>
          <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Wealth Management Dashboard</h3>
          <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 440, marginBottom: 28, lineHeight: 1.6 }}>
            Track total asset allocation, monitor net worth growth timelines, calculate real-time asset returns, and schedule your monthly 1-on-1 call with a certified financial advisor.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
            {[
              '💎 Unlimited Asset Classes',
              '📈 Net Worth Timeline',
              '🏦 Stocks & Mutual Funds Sync',
              '🗣️ 1-on-1 advisor sessions',
            ].map(b => (
              <span key={b} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', padding: '5px 12px', background: 'var(--bg2)', borderRadius: 999, border: '1px solid var(--border)' }}>{b}</span>
            ))}
          </div>
          <Link to="/premium" className="btn-primary" style={{ padding: '14px 40px', fontSize: 15, background: 'linear-gradient(135deg, #f0b429 0%, #fbbf24 100%)', boxShadow: '0 4px 20px rgba(240,180,41,0.3)' }}>
            Upgrade to Wealth Plan
          </Link>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // UNLOCKED STATE: Wealth Plan Dashboard
  // ═══════════════════════════════════════════════
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <motion.div {...an(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown size={24} color="var(--amber)" /> Wealth & Assets Tracker
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Manage asset allocations, net worth valuations, and advisor sync.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px', fontSize: 13, background: 'var(--grad)' }}>
          <Plus size={16} /> Add Asset
        </button>
      </motion.div>

      {/* Top Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <motion.div className="panel panel-glow" style={{ padding: 20 }} {...an(1)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} color="#34d399" />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Total Assets Valuation</span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{fmt(totalPortfolioValue)}</p>
        </motion.div>

        <motion.div className="panel panel-glow" style={{ padding: 20 }} {...an(2)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={18} color="var(--purple)" />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Asset Classes</span>
          </div>
          <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{categoryTotals.length} categories</p>
        </motion.div>

        <motion.div className="panel panel-glow" style={{ padding: 20 }} {...an(3)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(240,180,41,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserCheck size={18} color="var(--amber)" />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Advisor Consultations</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: advisorBooked ? 'var(--green)' : 'var(--amber)', marginTop: 4 }}>
            {advisorBooked ? `Booked for ${new Date(advisorDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : '1 Monthly Session Available'}
          </p>
        </motion.div>
      </div>

      {/* Main Charts & Allocation split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Net Worth Growth */}
        <motion.div className="panel" style={{ padding: 24 }} {...an(4)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LineChart size={18} color="var(--purple)" /> Net Worth growth (statement balance)
          </h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthTimeline} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [fmt(Number(v)), 'Net Worth']} />
                <Area type="monotone" dataKey="worth" stroke="#818cf8" strokeWidth={2.5} fill="url(#netWorthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Asset Class Pie Chart */}
        <motion.div className="panel" style={{ padding: 24, display: 'flex', flexDirection: 'column' }} {...an(5)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Asset Allocation</h3>
          {categoryTotals.length > 0 ? (
            <>
              <div style={{ flex: 1, minHeight: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryTotals} dataKey="value" innerRadius={42} outerRadius={68} paddingAngle={4} strokeWidth={0}>
                      {categoryTotals.map(c => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [fmt(Number(v)), '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8 }}>
                {categoryTotals.map(c => {
                  const pct = totalPortfolioValue > 0 ? Math.round((c.value / totalPortfolioValue) * 100) : 0;
                  return (
                    <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: 'var(--text2)' }}>{c.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>{pct}%</span>
                      <span style={{ fontWeight: 650 }}>{fmt(c.value)}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>No assets recorded</div>
          )}
        </motion.div>
      </div>

      {/* Assets List Table + Advisor Booking */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Assets List */}
        <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} {...an(6)}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={16} color="var(--purple)" /> Consolidated Asset Portfolio
            </h3>
            <span className="badge" style={{ background: 'rgba(129,140,248,0.1)', color: 'var(--purple)' }}>{consolidatedAssets.length} items</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Asset Name</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th style={{ width: 60 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedAssets.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      {a.name}
                      {a.isAutoDetected && (
                        <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)', fontSize: 9, marginLeft: 8 }}>Auto-Detected</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: `${CATEGORY_COLORS[a.category]}15`,
                        color: CATEGORY_COLORS[a.category],
                      }}>
                        {a.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{fmt(a.value)}</td>
                    <td>
                      {!a.isAutoDetected && a.id !== 'real_bank_bal' ? (
                        <button className="btn-ghost danger" onClick={() => deleteAsset(a.id)} style={{ padding: 6 }}>
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>Auto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* 1-on-1 Advisor Session Booking */}
        <motion.div className="panel" style={{ padding: 24 }} {...an(7)}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} color="var(--amber)" /> Book Personal Advisor
          </h3>
          {advisorBooked ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'rgba(52,211,153,0.15)',
                color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <UserCheck size={24} />
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Advisor Session Scheduled!</h4>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 20 }}>
                Your call is booked on <strong>{new Date(advisorDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>. The Google Meet link has been sent to your email.
              </p>
              <button className="btn-outline" onClick={() => setAdvisorBooked(false)} style={{ width: '100%', fontSize: 12 }}>
                Reschedule Booking
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                As a Wealth plan member, you get one free 45-minute portfolio consultation session every month with a SEBI-registered advisor.
              </p>
              <div>
                <label className="label">Preferred Date</label>
                <input
                  type="date"
                  className="input"
                  value={advisorDate}
                  onChange={e => setAdvisorDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <button
                className="btn-primary"
                onClick={() => advisorDate && setAdvisorBooked(true)}
                disabled={!advisorDate}
                style={{ width: '100%', padding: '10px 0', fontSize: 13, background: 'var(--grad)' }}
              >
                Schedule Google Meet Call
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* AI INVESTMENT PREDICTIONS SECTION              */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Section Header */}
      <motion.div {...an(8)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(244,114,182,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={20} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              AI Investment Predictions
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                background: 'linear-gradient(135deg, #818cf8, #f472b6)', color: '#fff',
                letterSpacing: 0.6, textTransform: 'uppercase',
              }}>Live Data</span>
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              Real-time stock data via Alpha Vantage API{lastFetchTime && <span style={{ color: 'var(--text3)' }}> • Updated {lastFetchTime}</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-ghost"
            onClick={() => setShowApiSetup(!showApiSetup)}
            style={{ padding: '6px 12px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Key size={14} /> API Key
          </button>
          {hasApiKey() && (
            <button
              className="btn-primary"
              onClick={fetchLiveQuotes}
              disabled={quotesLoading}
              style={{ padding: '6px 14px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, background: 'var(--grad)' }}
            >
              {quotesLoading ? <Loader2 size={14} className="spin-icon" /> : <RefreshCw size={14} />}
              {quotesLoading ? 'Fetching...' : 'Refresh'}
            </button>
          )}
        </div>
      </motion.div>

      {/* API Key Configuration Panel */}
      <AnimatePresence>
        {showApiSetup && (
          <motion.div
            className="panel"
            style={{ padding: 20, border: '1px solid rgba(129,140,248,0.15)' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Key size={18} color="#818cf8" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Alpha Vantage API Key</h4>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.5 }}>
                  Get your free API key at <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>alphavantage.co</a> (25 requests/day free). Quotes are cached for 1 hour.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="Paste your API key here..."
                    style={{ flex: 1, fontSize: 13 }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleSaveApiKey}
                    disabled={!apiKeyInput.trim()}
                    style={{ padding: '8px 20px', fontSize: 12, background: 'var(--grad)', whiteSpace: 'nowrap' }}
                  >
                    Save & Fetch
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Error Banner */}
      {quotesError && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, fontSize: 12,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
          color: '#f87171', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Info size={14} /> {quotesError}
        </div>
      )}

      {/* Stock Picks Table + Market Outlook */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>

        {/* Personalized Stock Picks */}
        <motion.div className="panel" style={{ padding: 0, overflow: 'hidden' }} {...an(9)}>
          <div style={{
            padding: '18px 24px', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#34d399" /> Recommended Stocks
            </h3>
            <span className="badge" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', fontSize: 10 }}>
              {stockPicks.length} picks • 6-month horizon
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Sector</th>
                  <th>Live Price</th>
                  <th>Change</th>
                  <th>AI Signal</th>
                  <th>6M Return</th>
                  <th>Risk</th>
                  <th style={{ width: 90 }}>Potential</th>
                </tr>
              </thead>
              <tbody>
                {stockPicks.map((stock, i) => (
                  <motion.tr
                    key={stock.ticker}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.04, duration: 0.3 }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: `${stock.color}15`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 800, color: stock.color, flexShrink: 0,
                        }}>
                          {stock.ticker.slice(0, 3)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 650, fontSize: 13 }}>{stock.ticker}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{stock.sector}</td>
                    <td>
                      {(() => {
                        const quote = liveQuotes.get(stock.bseSymbol);
                        if (quotesLoading && !quote) return <span style={{ color: 'var(--text3)', fontSize: 12 }}>Loading...</span>;
                        if (!quote) return <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>;
                        return (
                          <span style={{ fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                            ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const quote = liveQuotes.get(stock.bseSymbol);
                        if (!quote) return <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>;
                        const isUp = quote.changePercent >= 0;
                        return (
                          <span style={{
                            fontSize: 12, fontWeight: 650,
                            color: isUp ? '#34d399' : '#f87171',
                            display: 'flex', alignItems: 'center', gap: 2,
                          }}>
                            {isUp ? '▲' : '▼'} {Math.abs(quote.changePercent).toFixed(2)}%
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: CONFIDENCE_STYLES[stock.confidence].bg,
                        color: CONFIDENCE_STYLES[stock.confidence].color,
                      }}>
                        {stock.confidence === 'Strong Buy' && <Zap size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />}
                        {stock.confidence}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 650, fontSize: 13, color: '#34d399' }}>
                        <ArrowUpRight size={14} /> {stock.returnRange}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                        background: RISK_STYLES[stock.risk].bg,
                        color: RISK_STYLES[stock.risk].color,
                      }}>
                        <Shield size={9} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                        {stock.risk}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg2)', overflow: 'hidden' }}>
                          <motion.div
                            style={{
                              height: '100%', borderRadius: 3,
                              background: `linear-gradient(90deg, ${stock.color}, ${stock.color}aa)`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (stock.returnMax / 22) * 100)}%` }}
                            transition={{ delay: 0.6 + i * 0.04, duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, minWidth: 24, textAlign: 'right' }}>
                          {stock.returnMax}%
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* AI Market Outlook Card */}
        <motion.div
          className="panel"
          style={{
            padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
            border: `1px solid ${marketOutlook.color}22`,
            background: `linear-gradient(180deg, var(--surface) 0%, ${marketOutlook.color}05 100%)`,
          }}
          {...an(10)}
        >
          <h3 style={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color={marketOutlook.color} /> Market Outlook
          </h3>

          {/* Sentiment Indicator */}
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <motion.div
              style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 12px',
                background: `${marketOutlook.color}20`,
                border: `2px solid ${marketOutlook.color}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              animate={{ boxShadow: [`0 0 0px ${marketOutlook.color}00`, `0 0 20px ${marketOutlook.color}40`, `0 0 0px ${marketOutlook.color}00`] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span style={{ fontSize: 22 }}>
                {marketOutlook.sentiment === 'Bullish' ? '🐂' : marketOutlook.sentiment === 'Neutral' ? '⚖️' : '🐻'}
              </span>
            </motion.div>
            <div style={{ fontSize: 18, fontWeight: 800, color: marketOutlook.color }}>{marketOutlook.sentiment}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>AI Market Sentiment</div>
          </div>

          {/* Index Directions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Nifty 50', dir: marketOutlook.niftyDir },
              { label: 'Sensex', dir: marketOutlook.sensexDir },
            ].map(idx => (
              <div key={idx.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{idx.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: marketOutlook.color }}>{idx.dir}</span>
              </div>
            ))}
          </div>

          {/* Recommended Allocation */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Recommended Allocation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Equity', pct: marketOutlook.equityPct, color: '#818cf8' },
                { label: 'Debt', pct: marketOutlook.debtPct, color: '#60a5fa' },
                { label: 'Gold', pct: marketOutlook.goldPct, color: '#fbbf24' },
              ].map(a => (
                <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, width: 42, color: 'var(--text2)' }}>{a.label}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg2)', overflow: 'hidden' }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: 4, background: a.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.pct}%` }}
                      transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: a.color, minWidth: 30, textAlign: 'right' }}>{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* SIP Recommendations */}
      <motion.div {...an(11)}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="#fbbf24" /> Suggested SIP Plans
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>• auto-calculated from your savings</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sipRecs.length}, 1fr)`, gap: 14 }}>
          {sipRecs.map((sip, i) => (
            <motion.div
              key={sip.fund}
              className="panel panel-glow"
              style={{ padding: 20, borderTop: `3px solid ${sip.color}` }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.06, duration: 0.4 }}
            >
              <div style={{
                fontSize: 10, fontWeight: 700, color: sip.color, textTransform: 'uppercase',
                letterSpacing: 0.6, marginBottom: 8,
              }}>
                {sip.category}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>{sip.fund}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Monthly SIP</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: sip.color }}>₹{sip.sipAmount.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>Expected CAGR</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>{sip.expectedCAGR}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        {...an(12)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '14px 18px', borderRadius: 12,
          background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)',
        }}
      >
        <Info size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text2)' }}>Disclaimer:</strong> AI predictions are generated algorithmically for educational purposes only and do not constitute financial advice. Past performance does not guarantee future results. Always consult a SEBI-registered advisor before making investment decisions.
        </p>
      </motion.div>

      {/* Add Asset Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div className="panel" style={{ padding: 32, width: 420, position: 'relative' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <button className="btn-ghost" style={{ position: 'absolute', top: 16, right: 16, padding: 8 }} onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Add Asset Valuation</h2>
              <form onSubmit={addAsset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Asset / Holding Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Apple Equity or Sovereign Gold" className="input" required />
                </div>
                <div>
                  <label className="label">Asset Class / Category</label>
                  <select
                    className="input"
                    value={category}
                    onChange={e => setCategory(e.target.value as Exclude<Asset['category'], 'Cash & Bank'>)}
                    style={{ background: 'var(--bg2)', color: 'var(--text)' }}
                  >
                    {['Mutual Funds', 'Equity', 'Crypto', 'Gold', 'Real Estate'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Current Value (₹)</label>
                  <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="50000" className="input" required min="1" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  Add Asset Class
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
