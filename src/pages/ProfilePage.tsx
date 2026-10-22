import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Globe,
  Crown,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Smartphone,
  Briefcase,
  MapPin,
  Target,
  Sparkles,
  Save,
  ArrowRight,
  Mail,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { api } from '../services/api';

// Occupations
const OCCUPATIONS = [
  'Software Engineer / Technology',
  'Product Designer / Creative',
  'Finance & Investment Professional',
  'Business Founder / Entrepreneur',
  'Doctor / Healthcare Professional',
  'Corporate Executive / Management',
  'Consultant / Strategy',
  'Freelancer / Independent Contractor',
  'Academic / Researcher',
  'Student',
  'Other',
];

// Income brackets
const INCOME_BRACKETS = [
  'Under ₹5 Lakhs',
  '₹5 Lakhs – ₹12 Lakhs',
  '₹12 Lakhs – ₹25 Lakhs',
  '₹25 Lakhs – ₹50 Lakhs',
  '₹50 Lakhs – ₹1 Crore',
  'Above ₹1 Crore',
];

// Financial Goals
const FINANCIAL_FOCUSES = [
  'Wealth Accumulation & Growth',
  'Financial Independence & Retire Early (FIRE)',
  'Real Estate & Home Acquisition',
  'Debt Freedom & Liability Elimination',
  'Child Education & Family Legacy',
  'Emergency & Capital Preservation',
];

export default function ProfilePage() {
  const { data, setData, reset, clearAllData } = useFinance();
  const [activeTab, setActiveTab] = useState<'identity' | 'risk' | 'security' | 'preferences' | 'subscription'>('identity');

  // Form states
  const [name, setName] = useState(data.userName || '');
  const [phone, setPhone] = useState(data.phone || '');
  const [city, setCity] = useState(data.city || 'Bengaluru, India');
  const [occupation, setOccupation] = useState(data.occupation || 'Software Engineer / Technology');
  const [incomeBracket, setIncomeBracket] = useState('₹12 Lakhs – ₹25 Lakhs');
  const [panMasked, setPanMasked] = useState(data.panMasked || 'ABCDE••••F');
  const [motto, setMotto] = useState('Building systematic, long-term generational wealth.');

  // Strategy & Risk
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'moderate' | 'aggressive'>(data.riskTolerance || 'moderate');
  const [investmentHorizon, setInvestmentHorizon] = useState<'short' | 'medium' | 'long'>(data.investmentHorizon || 'medium');
  const [financialFocus, setFinancialFocus] = useState(data.financialFocus || 'Wealth Accumulation & Growth');
  const [emergencyMonths, setEmergencyMonths] = useState(data.emergencyMonths ?? 6);
  const [savingsPercent, setSavingsPercent] = useState(data.savingsPercent || 25);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [stealthMode, setStealthMode] = useState(!!data.stealthMode);

  // Preferences & Notifications
  const [currency, setCurrency] = useState(data.currency || 'INR');
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY');
  const [notifications, setNotifications] = useState(data.notifications || {
    emailDigest: true,
    highExpenseAlert: true,
    budgetWarning: true,
    goalMilestones: true,
    securityAlerts: true,
  });

  // Action status
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state from data
  useEffect(() => {
    if (data.userName) setName(data.userName);
    if (data.phone) setPhone(data.phone);
    if (data.city) setCity(data.city);
    if (data.occupation) setOccupation(data.occupation);
    if (data.riskTolerance) setRiskTolerance(data.riskTolerance);
    if (data.investmentHorizon) setInvestmentHorizon(data.investmentHorizon);
    if (data.currency) setCurrency(data.currency);
    if (data.stealthMode !== undefined) setStealthMode(data.stealthMode);
    if (data.panMasked) setPanMasked(data.panMasked);
    if (data.emergencyMonths) setEmergencyMonths(data.emergencyMonths);
    if (data.financialFocus) setFinancialFocus(data.financialFocus);
    if (data.savingsPercent) setSavingsPercent(data.savingsPercent);
    if (data.notifications) setNotifications(data.notifications);
  }, [data]);

  // Handle Profile Save
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    await setData({
      userName: name.trim() || 'User',
      phone: phone.trim(),
      city: city.trim(),
      occupation: occupation.trim(),
      riskTolerance,
      investmentHorizon,
      financialFocus,
      emergencyMonths,
      savingsPercent: Number(savingsPercent) || 20,
      currency,
      stealthMode,
      panMasked: panMasked.trim(),
      notifications,
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'New passwords do not match.', isError: true });
      return;
    }

    if (newPassword.length < 8) {
      setPwdMsg({ text: 'Password must be at least 8 characters long.', isError: true });
      return;
    }

    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPwdMsg({ text: 'Password updated successfully.', isError: false });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMsg({ text: res.message || 'Failed to change password.', isError: true });
      }
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Failed to change password.', isError: true });
    }
  };

  // Export User Profile JSON
  const handleExportProfileJson = () => {
    const profileDump = {
      user: {
        name: data.userName,
        email: data.userEmail,
        phone,
        city,
        occupation,
        currentPlan: data.currentPlan,
        riskTolerance,
        investmentHorizon,
        financialFocus,
        savingsPercent,
      },
      transactionsCount: data.transactions?.length || 0,
      goalsCount: data.financialGoals?.length || 0,
      exportedAt: new Date().toISOString(),
      security: {
        twoFactorStatus: 'Twilio SendGrid OTP Verified',
      },
    };

    const blob = new Blob([JSON.stringify(profileDump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FinSight_Profile_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const initials = (name || data.userName || 'User')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Informative Redirection Banner for Manual Data Entry */}
      <div
        className="panel"
        style={{
          padding: '14px 20px',
          marginBottom: 24,
          background: 'rgba(129, 140, 248, 0.08)',
          borderColor: 'rgba(129, 140, 248, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(129, 140, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
            <Sparkles size={16} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Looking to enter manual transactions, assets, loans, or category limits?
            </p>
            <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--text2)' }}>
              Detailed financial records are now housed inside the dedicated <strong>Manual Entry Hub</strong>.
            </p>
          </div>
        </div>
        <Link
          to="/manual-entry"
          className="btn-outline"
          style={{ padding: '8px 16px', fontSize: 12, gap: 6, borderColor: 'var(--purple)', color: 'var(--purple)' }}
        >
          Go to Manual Entry Hub <ArrowRight size={14} />
        </Link>
      </div>

      {/* Hero Profile Banner */}
      <motion.div
        className="panel"
        style={{
          padding: '32px 36px',
          marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.12) 0%, rgba(192, 132, 252, 0.08) 50%, rgba(244, 114, 182, 0.05) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            {/* Avatar */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                background: 'var(--grad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 800,
                color: '#ffffff',
                boxShadow: '0 8px 24px rgba(129, 140, 248, 0.35)',
                border: '3px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              {initials}
            </div>

            {/* Profile Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                  {name || 'FinSight User'}
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: data.currentPlan === 'Wealth' ? 'rgba(240, 180, 41, 0.2)' : 'rgba(129, 140, 248, 0.2)',
                    color: data.currentPlan === 'Wealth' ? 'var(--amber)' : 'var(--purple)',
                    border: '1px solid rgba(129, 140, 248, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {data.currentPlan || 'Basic'} Tier
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <ShieldCheck size={13} /> SendGrid Verified
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text2)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} /> {data.userEmail || 'user@example.com'}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={14} /> {city}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Briefcase size={14} /> {occupation}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 18px', borderRadius: 14, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Security Score</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', margin: '4px 0 0 0' }}>96% High</p>
            </div>
            <div style={{ padding: '12px 18px', borderRadius: 14, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>Savings Target</p>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--purple)', margin: '4px 0 0 0' }}>{savingsPercent}%</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 26, overflowX: 'auto' }}>
        {[
          { id: 'identity', label: 'Personal & Identity', icon: User },
          { id: 'risk', label: 'Financial Persona & Strategy', icon: Target },
          { id: 'security', label: 'Security & Verification', icon: Shield },
          { id: 'preferences', label: 'Preferences & Alerts', icon: Bell },
          { id: 'subscription', label: 'Plan & Governance', icon: Crown },
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
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. PERSONAL & IDENTITY TAB */}
      {activeTab === 'identity' && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Primary Details Panel */}
            <motion.div className="panel" style={{ padding: 28 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} color="var(--purple)" /> Core Identity
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Full Legal Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Registered Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={data.userEmail || ''}
                      disabled
                      className="input"
                      style={{ opacity: 0.7, cursor: 'not-allowed', paddingRight: 90 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 11,
                        color: 'var(--green)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    Email verification powered by Twilio SendGrid API.
                  </p>
                </div>

                <div>
                  <label className="label">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Location (City, Country)</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </motion.div>

            {/* Professional & Financial Profile Panel */}
            <motion.div className="panel" style={{ padding: 28 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={18} color="var(--blue)" /> Professional Demographics
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label">Occupation / Industry</label>
                  <select
                    value={occupation}
                    onChange={e => setOccupation(e.target.value)}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  >
                    {OCCUPATIONS.map(occ => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Annual Household Income Bracket</label>
                  <select
                    value={incomeBracket}
                    onChange={e => setIncomeBracket(e.target.value)}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  >
                    {INCOME_BRACKETS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Masked PAN / Tax Identifier</label>
                  <input
                    type="text"
                    placeholder="ABCDE••••F"
                    value={panMasked}
                    onChange={e => setPanMasked(e.target.value)}
                    className="input"
                  />
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    Used for regulatory compliance benchmarks. FinSight never stores unmasked tax numbers.
                  </p>
                </div>

                <div>
                  <label className="label">Personal Financial Motto</label>
                  <input
                    type="text"
                    value={motto}
                    onChange={e => setMotto(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{
                padding: '14px 32px',
                background: saveSuccess ? 'var(--green)' : undefined,
                boxShadow: saveSuccess ? '0 8px 24px rgba(52,211,153,0.3)' : undefined,
              }}
            >
              {saveSuccess ? <><CheckCircle2 size={16} /> Identity Saved!</> : isSaving ? 'Saving...' : <><Save size={16} /> Save Identity Settings</>}
            </button>
          </div>
        </form>
      )}

      {/* 2. FINANCIAL PERSONA & STRATEGY TAB */}
      {activeTab === 'risk' && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Risk Tolerance Cards */}
          <div className="panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={18} color="var(--purple)" /> Investment Risk Appetite
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              Select your volatility tolerance to tailor financial insights, portfolio rebalancing recommendations, and net-worth projections.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[
                {
                  id: 'conservative',
                  title: 'Conservative',
                  icon: '🛡️',
                  desc: 'Capital preservation first. High allocation to Fixed Deposits, Sovereign Gold, and liquid debt funds with minimal drawdown.',
                  alloc: '70% Debt / Cash • 20% Equity • 10% Gold',
                },
                {
                  id: 'moderate',
                  title: 'Balanced / Moderate',
                  icon: '⚖️',
                  desc: 'Optimal blend of wealth growth and safety. Core allocation in broad-market index funds, bluechip equities, and sovereign bonds.',
                  alloc: '55% Equity • 35% Debt • 10% Gold',
                },
                {
                  id: 'aggressive',
                  title: 'Aggressive Growth',
                  icon: '🚀',
                  desc: 'Maximum long-term compounding. High exposure to mid-cap and small-cap stocks, momentum equity, and emerging asset classes.',
                  alloc: '80% Equity • 15% Alternative • 5% Cash',
                },
              ].map(card => {
                const isSelected = riskTolerance === card.id;
                return (
                  <div
                    key={card.id}
                    onClick={() => setRiskTolerance(card.id as any)}
                    style={{
                      padding: 22,
                      borderRadius: 16,
                      border: isSelected ? '2px solid var(--purple)' : '1px solid var(--border)',
                      background: isSelected ? 'rgba(129, 140, 248, 0.08)' : 'var(--bg2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: isSelected ? 'var(--purple)' : 'var(--text)' }}>
                      {card.title}
                    </h4>
                    <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, margin: '0 0 12px 0' }}>{card.desc}</p>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', background: 'var(--bg3)', padding: '6px 10px', borderRadius: 8 }}>
                      {card.alloc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goals & Emergency Buffer */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="panel" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Primary Financial Focus</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FINANCIAL_FOCUSES.map(focus => {
                  const isSelected = financialFocus === focus;
                  return (
                    <label
                      key={focus}
                      onClick={() => setFinancialFocus(focus)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: isSelected ? '1px solid var(--purple)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(129, 140, 248, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'var(--purple)' : 'var(--text)',
                      }}
                    >
                      <input
                        type="radio"
                        name="finFocus"
                        checked={isSelected}
                        onChange={() => setFinancialFocus(focus)}
                        style={{ accentColor: 'var(--purple)' }}
                      />
                      {focus}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="panel" style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Savings Ratio & Emergency Buffer</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
                  Adjust target savings allocation. Recommended benchmark: 20% to 35% of post-tax income.
                </p>

                {/* Savings Slider */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Monthly Target Savings Rate</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--purple)' }}>{savingsPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={savingsPercent}
                    onChange={e => setSavingsPercent(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--purple)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    <span>5% (Starter)</span>
                    <span>25% (Balanced)</span>
                    <span>50%+ (FIRE)</span>
                  </div>
                </div>

                {/* Emergency Months */}
                <div>
                  <label className="label">Emergency Contingency Target (Months of expenses)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[3, 6, 9, 12].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEmergencyMonths(m)}
                        style={{
                          padding: '10px 0',
                          borderRadius: 10,
                          border: emergencyMonths === m ? '1.5px solid var(--purple)' : '1px solid var(--border)',
                          background: emergencyMonths === m ? 'rgba(129, 140, 248, 0.15)' : 'var(--bg2)',
                          color: emergencyMonths === m ? 'var(--purple)' : 'var(--text2)',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {m} Months
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
                style={{ width: '100%', padding: 14, marginTop: 20 }}
              >
                {saveSuccess ? <><CheckCircle2 size={16} /> Strategy Saved!</> : <><Save size={16} /> Save Strategy Settings</>}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. SECURITY & VERIFICATION TAB */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 2FA & Authentication Status */}
          <div className="panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="var(--green)" /> Authentication & Two-Factor Security
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ padding: 20, borderRadius: 14, background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <ShieldCheck size={20} color="var(--green)" />
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--green)' }}>Twilio SendGrid 2FA Active</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                  Every login and password recovery request generates a cryptographically random 6-digit OTP code dispatched directly to your inbox via Twilio SendGrid API.
                </p>
              </div>

              <div style={{ padding: 20, borderRadius: 14, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Smartphone size={18} color="var(--purple)" />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Rolling Session Authentication</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                  Sessions are secured with JWT and automated 24-hour expiration countdowns with instantaneous revocation on logout.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Stealth Mode */}
          <div className="panel" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ maxWidth: 650 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {stealthMode ? <EyeOff size={18} color="var(--purple)" /> : <Eye size={18} color="var(--text2)" />}
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Stealth / Privacy Shield Mode</h4>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                When enabled, financial balances, net worth values, and transaction amounts are masked as <code>₹••••••</code> across all FinSight views. Ideal when using the app in public cafes or workspaces.
              </p>
            </div>

            <button
              onClick={() => {
                const next = !stealthMode;
                setStealthMode(next);
                setData({ stealthMode: next });
              }}
              className="btn-outline"
              style={{
                padding: '10px 22px',
                borderColor: stealthMode ? 'var(--purple)' : 'var(--border)',
                background: stealthMode ? 'rgba(129, 140, 248, 0.15)' : 'transparent',
                color: stealthMode ? 'var(--purple)' : 'var(--text)',
                fontWeight: 700,
              }}
            >
              {stealthMode ? 'Stealth Mode Active' : 'Enable Stealth Mode'}
            </button>
          </div>

          {/* Password Change Form */}
          <div className="panel" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={18} color="var(--purple)" /> Update Master Password
            </h3>

            {pwdMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  marginBottom: 18,
                  fontSize: 13,
                  background: pwdMsg.isError ? 'rgba(248, 113, 113, 0.12)' : 'rgba(52, 211, 153, 0.12)',
                  color: pwdMsg.isError ? 'var(--red)' : 'var(--green)',
                  border: `1px solid ${pwdMsg.isError ? 'rgba(248, 113, 113, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                }}
              >
                {pwdMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, alignItems: 'flex-end' }}>
              <div>
                <label className="label">Current Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">New Master Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <button type="submit" className="btn-primary" style={{ width: '100%', padding: 13 }}>
                  <Lock size={15} /> Update Password
                </button>
              </div>
            </form>

            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Hide password characters' : 'Show password characters'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PREFERENCES & ALERTS TAB */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Currency & Localization */}
            <div className="panel" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={18} color="var(--blue)" /> Localization & Display
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label className="label">Primary Display Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="INR">₹ INR — Indian Rupee</option>
                    <option value="USD">$ USD — US Dollar</option>
                    <option value="EUR">€ EUR — Euro</option>
                    <option value="GBP">£ GBP — British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="label">Date Display Format</label>
                  <select
                    value={dateFormat}
                    onChange={e => setDateFormat(e.target.value as any)}
                    className="input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 14/10/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/14/2026)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Switches */}
            <div className="panel" style={{ padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={18} color="var(--purple)" /> Email & Alert Subscriptions
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'emailDigest', label: 'Monthly Financial Digest', desc: 'Summary of income, savings rate, and category expenses.' },
                  { key: 'highExpenseAlert', label: 'High Transaction Alert', desc: 'Notify on single transactions exceeding ₹10,000.' },
                  { key: 'budgetWarning', label: 'Budget Threshold Alerts', desc: 'Warn when any category exceeds 80% and 100% of budget cap.' },
                  { key: 'goalMilestones', label: 'Goal Milestone Celebrations', desc: 'Notifications on achieving 25%, 50%, and 100% of financial goals.' },
                  { key: 'securityAlerts', label: 'Security & Sign-in Notices', desc: 'Alerts when account is accessed from new IP addresses.' },
                ].map(item => {
                  const checked = (notifications as any)[item.key] !== false;
                  return (
                    <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                        style={{ marginTop: 3, width: 16, height: 16, accentColor: 'var(--purple)', cursor: 'pointer' }}
                      />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.label}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: 11, color: 'var(--text3)' }}>{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isSaving} className="btn-primary" style={{ padding: '14px 32px' }}>
              {saveSuccess ? <><CheckCircle2 size={16} /> Preferences Saved!</> : <><Save size={16} /> Save Preferences</>}
            </button>
          </div>
        </form>
      )}

      {/* 5. SUBSCRIPTION & DATA GOVERNANCE TAB */}
      {activeTab === 'subscription' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Plan Tier Showcase */}
          <div className="panel" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Membership & Subscription Tier</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0 0 0' }}>Current active membership level and entitlement status.</p>
              </div>
              <Link to="/premium" className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>
                <Zap size={14} /> Compare All Plans
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { name: 'Basic', price: 'Free Forever', active: data.currentPlan === 'Basic', perks: ['Statement PDF Extraction', 'Manual Entry Hub', '1 Financial Goal', 'Standard Analytics'] },
                { name: 'Pro', price: '₹349 / month', active: data.currentPlan === 'Pro', perks: ['Unlimited Bank Statements', 'AI Expense Categorization', 'Unlimited Financial Goals', 'Full CSV & PDF Exports'] },
                { name: 'Wealth', price: '₹899 / month', active: data.currentPlan === 'Wealth', perks: ['Everything in Pro', 'Setu Live Account Aggregator', 'Portfolio Deep Analytics', 'Certified CFP Financial Advisor'] },
              ].map(tier => (
                <div
                  key={tier.name}
                  style={{
                    padding: 22,
                    borderRadius: 16,
                    border: tier.active ? '2px solid var(--purple)' : '1px solid var(--border)',
                    background: tier.active ? 'rgba(129, 140, 248, 0.08)' : 'var(--bg2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{tier.name}</h4>
                    {tier.active && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--green)', color: '#000', fontWeight: 800 }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--purple)', margin: '0 0 16px 0' }}>{tier.price}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                    {tier.perks.map(p => (
                      <li key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle2 size={13} color="var(--green)" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Data Export & Backup */}
          <div className="panel" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>Personal Data Portability</h4>
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
                Download a complete cryptographically structured JSON backup of your identity settings, transactions, and goals.
              </p>
            </div>
            <button onClick={handleExportProfileJson} className="btn-outline" style={{ padding: '12px 24px', fontSize: 13, gap: 8 }}>
              <Download size={16} /> Export Profile JSON Backup
            </button>
          </div>

          {/* Danger Zone */}
          <div className="panel" style={{ padding: 28, borderColor: 'rgba(248, 113, 113, 0.3)', background: 'rgba(248, 113, 113, 0.03)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--red)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> Danger Zone
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
              Actions taken here permanently impact your records and cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Reset all financial numbers and category budgets to starting defaults?')) {
                    await reset();
                    alert('Profile financial values reset.');
                  }
                }}
                className="btn-outline"
                style={{ borderColor: 'rgba(248, 113, 113, 0.4)', color: 'var(--red)', fontSize: 13 }}
              >
                Reset Financial Balances
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Wipe ALL financial statements, uploaded records, transactions, and goals completely?')) {
                    await clearAllData();
                    alert('All financial transaction and goal records wiped.');
                  }
                }}
                className="btn-outline"
                style={{ borderColor: 'var(--red)', background: 'rgba(248, 113, 113, 0.1)', color: 'var(--red)', fontSize: 13 }}
              >
                Clear All Transactions & Statements
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
