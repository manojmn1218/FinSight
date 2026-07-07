import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Crown, Plus, Trash2, Calendar, UserCheck, Lock, Wallet, LineChart, Briefcase, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';

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

export default function PortfolioPage() {
  const { data } = useFinance();
  const isWealth = data.currentPlan === 'Wealth';
  const txns = data.transactions || [];

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
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmt(Number(v)), 'Net Worth']} />
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
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [fmt(Number(v)), '']} />
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
