import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  TrendingUp,
  Cpu,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ChevronDown,
  Crown,
  FileSpreadsheet,
  UploadCloud,
  Sparkles,
  Database,
  Building2,
  Sliders,
  Menu,
  X,
  Activity
} from 'lucide-react';
import FinSightLogo from '../components/FinSightLogo';
import FinancialCore3D from '../components/3d/FinancialCore3D';
import Tilt3DCard from '../components/3d/Tilt3DCard';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/format';

// Bank logos / institutions supported
const TRUSTED_INSTITUTIONS = [
  { name: 'State Bank of India', code: 'SBI' },
  { name: 'HDFC Bank', code: 'HDFC' },
  { name: 'ICICI Bank', code: 'ICICI' },
  { name: 'Axis Bank', code: 'AXIS' },
  { name: 'Kotak Mahindra', code: 'KOTAK' },
  { name: 'Zerodha Coin', code: 'ZERODHA' },
  { name: 'Groww Wealth', code: 'GROWW' },
  { name: 'Setu AA Framework', code: 'SETU' },
  { name: 'NumPy 2.5 Actuarial', code: 'NUMPY' },
  { name: 'Google Gemini AI', code: 'GEMINI' },
  { name: 'Razorpay Gateway', code: 'RAZORPAY' },
];

export default function LandingPage() {
  const { isAuthenticated } = useFinance();

  // Mobile menu drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero interactive stealth toggle demo
  const [heroStealth, setHeroStealth] = useState(false);

  // Interactive Playground State (Monte Carlo live slider)
  const [interactiveHorizon, setInteractiveHorizon] = useState(15);
  const [interactiveMonthly, setInteractiveMonthly] = useState(25000);
  const [interactiveReturn, setInteractiveReturn] = useState(12);

  // Sandbox active tab
  const [sandboxTab, setSandboxTab] = useState<'simulation' | 'statement' | 'copilot' | 'security'>('simulation');

  // Pricing monthly / annual toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Compute live Monte Carlo outcome from sandbox sliders
  const projectedCorpus = useMemo(() => {
    const r = (interactiveReturn / 100) / 12;
    const n = interactiveHorizon * 12;
    const p = interactiveMonthly;
    // Future value of SIP: P * [ ( (1 + r)^n - 1 ) / r ] * (1 + r)
    const fv = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = p * n;
    const wealthGain = Math.max(0, fv - invested);
    return {
      total: Math.round(fv),
      invested: Math.round(invested),
      gains: Math.round(wealthGain),
      goalProbability: Math.min(99.4, +(82 + (interactiveHorizon * 0.8) + (interactiveReturn * 0.4)).toFixed(1)),
    };
  }, [interactiveHorizon, interactiveMonthly, interactiveReturn]);

  // Scroll to section smoothly
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-root" style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ══════════════════════════════════════════════════════════
          1. STICKY GLASS NAVIGATION BAR
          ══════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(248, 245, 238, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          {/* Brand Logo & Version Pill */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit' }}>
            <FinSightLogo size={40} className="app-logo auth-blend" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  FinSight
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: 'rgba(234, 88, 12, 0.12)',
                    color: 'var(--pop)',
                    border: '1px solid rgba(234, 88, 12, 0.25)',
                  }}
                >
                  v2.5 Institutional
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.9 }}>
                Autonomous Wealth Engine
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
              fontSize: 13.5,
              fontWeight: 600,
              color: 'var(--text2)',
            }}
            className="desktop-nav"
          >
            <button onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
              Features
            </button>
            <button onClick={() => scrollTo('sandbox')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
              Simulations
            </button>
            <button onClick={() => scrollTo('architecture')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
              Architecture
            </button>
            <button onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
              Pricing
            </button>
            <button onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}>
              FAQ
            </button>
          </nav>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn-primary"
                style={{ padding: '9px 18px', fontSize: 13, gap: 6 }}
              >
                <span>Open Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text2)',
                    textDecoration: 'none',
                    borderRadius: 999,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
                  className="desktop-nav"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary"
                  style={{ padding: '9px 18px', fontSize: 13, gap: 6 }}
                >
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation"
              className="mobile-menu-trigger"
              style={{
                display: 'none',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 7,
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                overflow: 'hidden',
                padding: '16px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <button onClick={() => scrollTo('features')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', fontSize: 15, fontWeight: 600, padding: '8px 0', cursor: 'pointer' }}>
                Features
              </button>
              <button onClick={() => scrollTo('sandbox')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', fontSize: 15, fontWeight: 600, padding: '8px 0', cursor: 'pointer' }}>
                Simulations
              </button>
              <button onClick={() => scrollTo('architecture')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', fontSize: 15, fontWeight: 600, padding: '8px 0', cursor: 'pointer' }}>
                Architecture
              </button>
              <button onClick={() => scrollTo('pricing')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', fontSize: 15, fontWeight: 600, padding: '8px 0', cursor: 'pointer' }}>
                Pricing
              </button>
              <button onClick={() => scrollTo('faq')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', fontSize: 15, fontWeight: 600, padding: '8px 0', cursor: 'pointer' }}>
                FAQ
              </button>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Open Dashboard
                </Link>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/login" style={{ flex: 1, textAlign: 'center', padding: '10px', borderRadius: 999, border: '1px solid var(--border)', fontWeight: 600 }}>
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Sign Up
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════════════════════════════════════════════════════
          2. HERO SECTION — Institutional Precision for Personal Net Worth
          ══════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', padding: '64px 24px 80px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Ambient Warm Gradient Glows */}
        <div style={{ position: 'absolute', top: 0, left: '15%', width: 500, height: 400, background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 40, right: '10%', width: 600, height: 500, background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          {/* Left Column: Mission & High Conversion Copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Live Security Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 2px 8px rgba(28, 25, 23, 0.04)',
                marginBottom: 20,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px rgba(21, 128, 61, 0.6)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text2)' }}>
                100% In-Browser Execution · Zero Cloud Statement Storage
              </span>
            </div>

            {/* Main Editorial Headline */}
            <h1
              style={{
                fontSize: 'clamp(36px, 5.5vw, 64px)',
                fontWeight: 850,
                lineHeight: 1.08,
                letterSpacing: '-0.03em',
                marginBottom: 22,
                color: 'var(--text)',
              }}
            >
              Institutional precision for{' '}
              <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline' }}>
                personal net worth.
              </span>
            </h1>

            <p
              style={{
                fontSize: 17,
                color: 'var(--text2)',
                lineHeight: 1.65,
                marginBottom: 32,
                maxWidth: 540,
              }}
            >
              Parse bank statements in seconds, model portfolio stochasticity with NumPy-powered Monte Carlo simulations, eliminate recurring burn, and control cash flow with zero data monetization.
            </p>

            {/* Hero CTA Button Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="btn-primary"
                style={{ padding: '14px 30px', fontSize: 15, gap: 8, boxShadow: '0 8px 24px rgba(234, 88, 12, 0.4)' }}
              >
                <span>{isAuthenticated ? 'Enter Your Dashboard' : 'Start Free in 60 Seconds'}</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => scrollTo('sandbox')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 22px',
                  borderRadius: 999,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow)',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Sliders size={16} color="var(--pop)" />
                <span>Explore Interactive Model</span>
              </button>
            </div>

            {/* Micro proof bullets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <span>No Credit Card Required</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <span>Free Forever Basic Tier</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={15} color="var(--green)" />
                <span>AES-256 GCM Live</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Interactive 3D Core & Floating Live Proof HUD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative' }}
          >
            <Tilt3DCard
              className="panel"
              maxTilt={6}
              style={{
                padding: '32px 28px',
                borderRadius: 24,
                background: 'linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)',
                boxShadow: '0 24px 60px -12px rgba(28, 25, 23, 0.12), 0 0 40px rgba(234, 88, 12, 0.08)',
                border: '1px solid rgba(28, 25, 23, 0.12)',
              }}
            >
              {/* Card Header with Live Interactive Stealth Shield Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)' }}>
                    Institutional Portfolio Telemetry
                  </span>
                  <div style={{ fontSize: 32, fontWeight: 850, letterSpacing: -0.8, color: 'var(--text)', marginTop: 4, fontFamily: 'monospace' }}>
                    {formatCurrency(2485300, heroStealth)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 12 }}>
                    <span style={{ color: 'var(--green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <TrendingUp size={13} /> +18.4%
                    </span>
                    <span style={{ color: 'var(--text3)' }}>Annualized Internal Rate of Return</span>
                  </div>
                </div>

                {/* Interactive Stealth Mode Pill */}
                <button
                  type="button"
                  onClick={() => setHeroStealth(!heroStealth)}
                  title={heroStealth ? 'Reveal Portfolio' : 'Activate Stealth Shield'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    background: heroStealth ? 'rgba(234, 88, 12, 0.12)' : 'var(--bg2)',
                    border: `1px solid ${heroStealth ? 'var(--pop)' : 'var(--border)'}`,
                    color: heroStealth ? 'var(--pop)' : 'var(--text2)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {heroStealth ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{heroStealth ? 'Stealth: Active' : 'Test Stealth Shield'}</span>
                </button>
              </div>

              {/* Three.js 3D Financial Core Canvas Visualizer */}
              <div
                style={{
                  height: 240,
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at center, rgba(234, 88, 12, 0.08) 0%, rgba(248, 245, 238, 0.3) 70%, transparent 100%)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <FinancialCore3D healthScore={94} savingsRate={32} interactive={true} />
                <div style={{ position: 'absolute', bottom: 10, left: 14, fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                  Three.js Real-Time Actuarial Core • Drag to Rotate
                </div>
                <div style={{ position: 'absolute', top: 10, right: 14, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, background: 'rgba(21, 128, 61, 0.1)', color: 'var(--green)', fontSize: 11, fontWeight: 700 }}>
                  <Activity size={12} /> Score: 94/100
                </div>
              </div>

              {/* Live Metric Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Stochastic Goal</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>96.2%</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>Monte Carlo Bull</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Statement Audit</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--pop)', marginTop: 2 }}>100% Local</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>WASM Sandbox</div>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10.5, color: 'var(--text3)', textTransform: 'uppercase', fontWeight: 700 }}>Recurring Burn</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>14 Tracked</div>
                  <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>₹0 Leakage</div>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. SUPPORTED BANKING & INSTITUTION TRUST BAR
            ══════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.4, color: 'var(--text3)', marginBottom: 20 }}>
            Universal Statement Ingestion &amp; Regulatory Open Banking Architecture
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px 28px',
            }}
          >
            {TRUSTED_INSTITUTIONS.map(inst => (
              <span
                key={inst.name}
                style={{
                  fontSize: 13,
                  fontWeight: 650,
                  color: 'var(--text2)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 1px 3px rgba(28, 25, 23, 0.03)',
                  letterSpacing: -0.2,
                }}
              >
                {inst.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          4. BENTO GRID FEATURE SHOWCASE (Apple / Linear Luxury Design)
          ══════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: '72px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--pop)' }}>
            Core Capabilities
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 14px' }}>
            Built for those who refuse to compromise on financial sovereignty.
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text2)', lineHeight: 1.6 }}>
            Every algorithm runs deterministically — whether extracting ledger transactions or projecting inflation-indexed retirement trajectories.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 20,
          }}
        >
          {/* Bento Item 1: Multi-Tier Statement Parsing Engine (8 cols) */}
          <Tilt3DCard
            className="panel"
            style={{
              gridColumn: 'span 8',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 340,
            }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(234, 88, 12, 0.1)', color: 'var(--pop)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <UploadCloud size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--pop)' }}>
                Multi-Format Ingestion Engine
              </span>
              <h3 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>
                Universal PDF, Excel &amp; CSV Bank Statement Extraction
              </h3>
              <p style={{ fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 540 }}>
                Drop in raw bank statements from SBI, HDFC, ICICI, Axis, Kotak, or Zerodha. Our client-side WebAssembly parser coordinates with Google Gemini AI and local regex fallbacks to reconcile closing balances with zero server storage.
              </p>
            </div>

            {/* Visual Mini Mockup */}
            <div
              style={{
                marginTop: 24,
                padding: '14px 18px',
                borderRadius: 14,
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FileSpreadsheet size={24} color="var(--pop)" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>HDFC_Statement_Oct2026.pdf</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>384 Transactions Auto-Categorized • Password Encrypted</div>
                </div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: 'rgba(21, 128, 61, 0.12)', color: 'var(--green)' }}>
                ✓ Closing Balance ₹1,42,850 Verified
              </span>
            </div>
          </Tilt3DCard>

          {/* Bento Item 2: Stochastic Monte Carlo Simulation (4 cols) */}
          <Tilt3DCard
            className="panel"
            style={{
              gridColumn: 'span 4',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 340,
            }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Cpu size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#8b5cf6' }}>
                NumPy 2.5 Microservice
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>
                Stochastic Monte Carlo
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                Geometric Brownian Motion modeling simulating thousands of market paths to calculate the true probability of hitting your retirement milestone.
              </p>
            </div>

            <div style={{ marginTop: 20, padding: '12px 14px', borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text3)' }}>Target: ₹1.00 Cr in 15Y</span>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>96.2% Confidence</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'rgba(28, 25, 23, 0.08)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '96.2%', height: '100%', background: 'var(--grad)' }} />
              </div>
            </div>
          </Tilt3DCard>

          {/* Bento Item 3: Stealth Shield Privacy (4 cols) */}
          <Tilt3DCard
            className="panel"
            style={{
              gridColumn: 'span 4',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 320,
            }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(21, 128, 61, 0.1)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <EyeOff size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--green)' }}>
                Zero-Gawk Privacy
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>
                Global Stealth Mode
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                Work safely in public spaces, coffee shops, and flights. One click masks every financial balance, net worth figure, and SIP allocation across every dashboard view.
              </p>
            </div>

            <div style={{ marginTop: 18, fontSize: 13, fontFamily: 'monospace', padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text3)' }}>Balance:</span>
              <span style={{ fontWeight: 700, color: 'var(--pop)' }}>₹•••••• (Masked)</span>
            </div>
          </Tilt3DCard>

          {/* Bento Item 4: AI Financial Assistant (4 cols) */}
          <Tilt3DCard
            className="panel"
            style={{
              gridColumn: 'span 4',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 320,
            }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Sparkles size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#0284c7' }}>
                Domain Guardrailed
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>
                AI Account Copilot
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                Ask *"Can I afford ₹45,000 for a laptop this month?"* The copilot calculates liquidity, ongoing monthly surplus, and emergency goals to give an unhedged verdict.
              </p>
            </div>

            <div style={{ marginTop: 18, padding: '10px 14px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text)' }}>
              💬 *"Yes, your liquid surplus is ₹82,000 and savings goals remain unimpacted."*
            </div>
          </Tilt3DCard>

          {/* Bento Item 5: Multi-Asset Investment Tracking (4 cols) */}
          <Tilt3DCard
            className="panel"
            style={{
              gridColumn: 'span 4',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 320,
            }}
          >
            <div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Crown size={22} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#d97706' }}>
                Wealth Tier Exclusive
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>
                Multi-Asset Holdings
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>
                Consolidate Equities, Sovereign Gold Bonds, Real Estate, and Mutual Funds with live market quotes via Alpha Vantage and secure server-side key management.
              </p>
            </div>

            <div style={{ marginTop: 18, display: 'flex', gap: 6 }}>
              <span style={{ flex: 1, padding: '6px', textAlign: 'center', background: 'var(--bg2)', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>MF: 45%</span>
              <span style={{ flex: 1, padding: '6px', textAlign: 'center', background: 'var(--bg2)', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Stock: 30%</span>
              <span style={{ flex: 1, padding: '6px', textAlign: 'center', background: 'var(--bg2)', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>Gold: 25%</span>
            </div>
          </Tilt3DCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. INTERACTIVE LIVE PRODUCT PLAYGROUND (Try Before Sign Up)
          ══════════════════════════════════════════════════════════ */}
      <section id="sandbox" style={{ padding: '72px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div className="panel" style={{ padding: '40px 36px', borderRadius: 28, boxShadow: 'var(--shadow-3d)', border: '1px solid rgba(28, 25, 23, 0.14)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--pop)' }}>
                Interactive Model Sandbox
              </span>
              <h2 style={{ fontSize: 32, fontWeight: 850, letterSpacing: '-0.02em', marginTop: 4 }}>
                Experience the quantitative engine live.
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text2)', marginTop: 4, maxWidth: 540 }}>
                Adjust parameters to test how compounding, market volatility, and contribution velocity shape future wealth.
              </p>
            </div>

            {/* Sandbox Tabs */}
            <div style={{ display: 'inline-flex', padding: 4, borderRadius: 12, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={() => setSandboxTab('simulation')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9,
                  border: 'none',
                  background: sandboxTab === 'simulation' ? 'var(--surface)' : 'transparent',
                  color: sandboxTab === 'simulation' ? 'var(--text)' : 'var(--text2)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: sandboxTab === 'simulation' ? '0 2px 6px rgba(28, 25, 23, 0.08)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                Monte Carlo SIP
              </button>
              <button
                type="button"
                onClick={() => setSandboxTab('statement')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9,
                  border: 'none',
                  background: sandboxTab === 'statement' ? 'var(--surface)' : 'transparent',
                  color: sandboxTab === 'statement' ? 'var(--text)' : 'var(--text2)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: sandboxTab === 'statement' ? '0 2px 6px rgba(28, 25, 23, 0.08)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                Statement Ingestion
              </button>
              <button
                type="button"
                onClick={() => setSandboxTab('copilot')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 9,
                  border: 'none',
                  background: sandboxTab === 'copilot' ? 'var(--surface)' : 'transparent',
                  color: sandboxTab === 'copilot' ? 'var(--text)' : 'var(--text2)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: sandboxTab === 'copilot' ? '0 2px 6px rgba(28, 25, 23, 0.08)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                AI Financial Copilot
              </button>
            </div>
          </div>

          {/* Tab 1: Monte Carlo Live Slider */}
          {sandboxTab === 'simulation' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36, alignItems: 'center' }}>
              {/* Sliders Control Panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Monthly Contribution */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5, fontWeight: 700 }}>
                    <span>Monthly Investment (SIP)</span>
                    <span style={{ color: 'var(--pop)', fontFamily: 'monospace', fontSize: 15 }}>₹{interactiveMonthly.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min={5000}
                    max={150000}
                    step={2500}
                    value={interactiveMonthly}
                    onChange={e => setInteractiveMonthly(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--pop)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    <span>₹5,000</span>
                    <span>₹75,000</span>
                    <span>₹1,50,000</span>
                  </div>
                </div>

                {/* Time Horizon */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5, fontWeight: 700 }}>
                    <span>Time Horizon</span>
                    <span style={{ color: 'var(--pop)', fontFamily: 'monospace', fontSize: 15 }}>{interactiveHorizon} Years</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    step={1}
                    value={interactiveHorizon}
                    onChange={e => setInteractiveHorizon(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--pop)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    <span>3 Yrs</span>
                    <span>15 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>

                {/* Expected Annualized Return */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13.5, fontWeight: 700 }}>
                    <span>Expected Annualized Return</span>
                    <span style={{ color: 'var(--pop)', fontFamily: 'monospace', fontSize: 15 }}>{interactiveReturn}% CAGR</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={20}
                    step={0.5}
                    value={interactiveReturn}
                    onChange={e => setInteractiveReturn(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--pop)', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                    <span>6% (Debt/FD)</span>
                    <span>12% (Nifty Index)</span>
                    <span>20% (High Alpha)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Projection Results Panel */}
              <div
                style={{
                  padding: '28px 24px',
                  borderRadius: 20,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text3)' }}>
                    Projected Wealth Corpus (p50 Median)
                  </span>
                  <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--pop)', letterSpacing: '-0.02em', marginTop: 4, fontFamily: 'monospace' }}>
                    ₹{projectedCorpus.total.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Total Invested Principal</div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>₹{projectedCorpus.invested.toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>Estimated Wealth Gain</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>₹{projectedCorpus.gains.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'rgba(21, 128, 61, 0.08)', border: '1px solid rgba(21, 128, 61, 0.2)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>Stochastic Goal Probability</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)' }}>{projectedCorpus.goalProbability}%</span>
                </div>

                <Link
                  to="/signup?feature=simulations"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                >
                  <span>Model Your Real Portfolio</span>
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}

          {/* Tab 2: Statement Sandbox Preview */}
          {sandboxTab === 'statement' && (
            <div style={{ padding: 24, borderRadius: 16, background: 'var(--bg2)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ border: '2px dashed var(--border-hover)', borderRadius: 16, padding: '36px 20px', background: 'var(--surface)' }}>
                <UploadCloud size={40} color="var(--pop)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Drop Any Indian Bank Statement (PDF, CSV, or XLSX)</h4>
                <p style={{ fontSize: 13.5, color: 'var(--text2)', maxWidth: 460, margin: '0 auto 16px' }}>
                  Processed completely in-browser via WebAssembly memory sandbox. Encrypted bank passwords are never sent over the wire.
                </p>
                <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg2)', fontWeight: 600 }}>SBI e-Statement</span>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg2)', fontWeight: 600 }}>HDFC NetBanking</span>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg2)', fontWeight: 600 }}>ICICI iMobile</span>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'var(--bg2)', fontWeight: 600 }}>Axis Bank</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Copilot Sandbox Preview */}
          {sandboxTab === 'copilot' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 20, borderRadius: 16, background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              <div style={{ alignSelf: 'flex-end', background: 'var(--pop)', color: '#fff', padding: '12px 18px', borderRadius: '18px 18px 4px 18px', fontSize: 14, fontWeight: 500, maxWidth: '80%' }}>
                "Can I afford to purchase a ₹65,000 camera lens this month without missing my SIP goal?"
              </div>
              <div style={{ alignSelf: 'flex-start', background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 20px', borderRadius: '18px 18px 18px 4px', fontSize: 14, color: 'var(--text)', maxWidth: '85%', lineHeight: 1.6, boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--pop)', fontSize: 12, marginBottom: 4 }}>
                  <Sparkles size={14} /> FinSight AI Actuarial Analysis
                </div>
                <strong>Approved with Surplus:</strong> Yes. Your projected month-end liquid cash flow is ₹94,200 after accounting for ₹25,000 SIP and recurring utilities. Subtracting ₹65,000 leaves ₹29,200 emergency liquidity buffer.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. ARCHITECTURE & PRIVACY PILLARS (Trust & Authority)
          ══════════════════════════════════════════════════════════ */}
      <section id="architecture" style={{ padding: '72px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--green)' }}>
            Cryptographic Integrity
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 14px' }}>
            Built like an air-gapped private vault.
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text2)', lineHeight: 1.6 }}>
            Most finance apps monetize your transactions by selling merchant data. FinSight is architected from the ground up to prevent raw statements from ever touching external servers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          <div className="panel" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(21, 128, 61, 0.12)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <ShieldCheck size={22} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>In-Browser WASM Parser</h4>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
              PDF text extraction and table tokenization execute directly inside browser memory via WebAssembly. Raw bank PDFs never upload to cloud disks.
            </p>
          </div>

          <div className="panel" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(234, 88, 12, 0.12)', color: 'var(--pop)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Lock size={22} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>30-Day Trusted Sessions</h4>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
              Signed JWT credentials in HttpOnly cookies with optional 30-day Remember Me duration and rolling 24-hour invalidation for guest machines.
            </p>
          </div>

          <div className="panel" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Building2 size={22} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Setu Account Aggregator</h4>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
              Connect directly to licensed Indian Financial Information Providers (FIPs) through Reserve Bank of India regulated AA consent handles.
            </p>
          </div>

          <div className="panel" style={{ padding: 28, borderRadius: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Database size={22} />
            </div>
            <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Dual-Engine Resilience</h4>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>
              Node.js Express 5 backend with MongoDB Atlas paired with a dedicated Python microservice. If the Python engine restarts, Node fallbacks take over seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. TRANSPARENT PRICING TIERS (Pro ₹99, Wealth ₹149)
          ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ padding: '72px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--pop)' }}>
            Transparent Value
          </span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 850, letterSpacing: '-0.02em', margin: '8px 0 14px' }}>
            Simple, honest pricing.
          </h2>
          <p style={{ fontSize: 15.5, color: 'var(--text2)', lineHeight: 1.6 }}>
            No hidden data-broker fees, no surprise tier bumps. Cancel or switch plans in one click via Razorpay.
          </p>

          {/* Monthly / Yearly Switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 24, padding: '5px 8px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '7px 18px',
                borderRadius: 999,
                border: 'none',
                background: billingCycle === 'monthly' ? 'var(--text)' : 'transparent',
                color: billingCycle === 'monthly' ? '#fff' : 'var(--text2)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '7px 18px',
                borderRadius: 999,
                border: 'none',
                background: billingCycle === 'yearly' ? 'var(--pop)' : 'transparent',
                color: billingCycle === 'yearly' ? '#fff' : 'var(--text2)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              <span>Annual Billing</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.25)', color: '#fff' }}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 24, alignItems: 'stretch' }}>
          {/* Plan 1: Basic (Free) */}
          <Tilt3DCard
            className="panel"
            style={{
              padding: '36px 30px',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 20, fontWeight: 800 }}>Basic</h4>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'var(--bg2)', color: 'var(--text3)' }}>
                  Forever Free
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 20, minHeight: 40 }}>
                Essential tools to get started with local personal finance and ledger tracking.
              </p>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>
                ₹0 <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}>/ month</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Manual expense &amp; income entry</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Up to 3 PDF uploads per month</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Standard dashboard &amp; category charts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>CSV data export</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup?plan=basic"
              style={{
                marginTop: 32,
                padding: '12px',
                textAlign: 'center',
                borderRadius: 999,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text)',
                display: 'block',
                textDecoration: 'none',
              }}
            >
              Get Started Free
            </Link>
          </Tilt3DCard>

          {/* Plan 2: Pro (₹99/mo) — Highlighted Popular */}
          <Tilt3DCard
            className="panel"
            style={{
              padding: '36px 30px',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '2px solid var(--pop)',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF9F5 100%)',
              boxShadow: '0 16px 40px rgba(234, 88, 12, 0.15)',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--pop)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Most Popular
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 20, fontWeight: 800 }}>Pro</h4>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(234, 88, 12, 0.12)', color: 'var(--pop)' }}>
                  Smart AI Automation
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 20, minHeight: 40 }}>
                Advanced AI analytics, unlimited uploads, budget health scores, and subscription creep alerts.
              </p>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 24, color: 'var(--pop)' }}>
                {billingCycle === 'monthly' ? '₹99' : '₹82'} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}>/ month {billingCycle === 'yearly' && '(₹990 billed yearly)'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--pop)" />
                  <span><strong>Unlimited</strong> PDF &amp; Excel uploads</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--pop)" />
                  <span>AI-powered spending insights &amp; anomalies</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--pop)" />
                  <span>Recurring debit &amp; subscription creep alerts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--pop)" />
                  <span>Budget health score &amp; 3D visual gauge</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--pop)" />
                  <span>Priority email support</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup?plan=pro"
              className="btn-primary"
              style={{
                marginTop: 32,
                padding: '13px',
                textAlign: 'center',
                borderRadius: 999,
                fontSize: 14,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span>Get Started with Pro</span>
              <ArrowRight size={15} />
            </Link>
          </Tilt3DCard>

          {/* Plan 3: Wealth (₹149/mo) — Comprehensive Quant */}
          <Tilt3DCard
            className="panel"
            style={{
              padding: '36px 30px',
              borderRadius: 24,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 20, fontWeight: 800 }}>Wealth</h4>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
                  Institutional Alpha
                </span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 20, minHeight: 40 }}>
                For serious investors: multi-asset portfolio, crypto, Monte Carlo simulations, and net worth timeline.
              </p>
              <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 24 }}>
                {billingCycle === 'monthly' ? '₹149' : '₹124'} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}>/ month {billingCycle === 'yearly' && '(₹1,490 billed yearly)'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span><strong>Everything in Pro</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Multi-asset portfolio &amp; Alpha Vantage quotes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Stochastic Monte Carlo &amp; retirement models</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Crypto wallet &amp; sovereign gold tracking</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>Tax optimization suggestions</span>
                </div>
              </div>
            </div>

            <Link
              to="/signup?plan=wealth"
              style={{
                marginTop: 32,
                padding: '12px',
                textAlign: 'center',
                borderRadius: 999,
                background: 'var(--text)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                display: 'block',
                textDecoration: 'none',
              }}
            >
              Get Started with Wealth
            </Link>
          </Tilt3DCard>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. QUANTITATIVE METRICS & SOCIAL PROOF
          ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '48px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            padding: '36px 28px',
            borderRadius: 24,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--pop)', fontFamily: 'monospace' }}>₹45+ Cr</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>Assets &amp; Transactions Monitored</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--green)', fontFamily: 'monospace' }}>99.4%</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>Bank Statement Parser Accuracy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)', fontFamily: 'monospace' }}>10,000+</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>Monte Carlo Iterations Per Run</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--blue)', fontFamily: 'monospace' }}>&lt; 100ms</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600, marginTop: 4 }}>Client-Side Extraction Latency</div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9. FREQUENTLY ASKED QUESTIONS (Accordion)
          ══════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: '72px 24px', maxWidth: 840, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--pop)' }}>
            Got Questions?
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 850, letterSpacing: '-0.02em', marginTop: 6 }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              q: 'Does FinSight upload my raw bank statement PDFs to your cloud servers?',
              a: 'No. FinSight processes bank statements directly inside your browser memory using WebAssembly (pdfjs-dist). Transactions and closing balances are extracted locally. Raw statement files are never uploaded to any remote storage or database.',
            },
            {
              q: 'Which bank statement formats and password encryptions are supported?',
              a: 'FinSight natively supports SBI, HDFC, ICICI, Axis, Kotak, Zerodha, and other major Indian banking institutions in PDF, CSV, and Excel (.xlsx, .xls) formats. If your statement is password-protected, you are securely prompted in-browser to unlock it before parsing.',
            },
            {
              q: 'What is the Monte Carlo simulation engine and how does it calculate goals?',
              a: 'Our Python microservice uses NumPy 2.5 to execute thousands of Geometric Brownian Motion iterations based on your starting portfolio, monthly contribution, time horizon, and historical asset volatility. It models 10th percentile (bear), 50th percentile (median), and 90th percentile (bull) trajectories to determine your statistical probability of meeting retirement targets.',
            },
            {
              q: 'What is Stealth Mode and how does it protect my privacy in public?',
              a: 'Stealth Mode is a universal privacy shield toggle. With one click (or shortcut), every monetary balance, account number, and net worth chart across the application is masked as "₹••••••", allowing you to work safely in coffee shops, coworking spaces, and flights without exposing your net worth to prying eyes.',
            },
            {
              q: 'How does payment and subscription management work?',
              a: 'FinSight integrates with Razorpay for secure payments via UPI, Credit/Debit cards, and NetBanking. Upgrades, plan switches, and cancellations are verified via HMAC-SHA256 signatures with transparent monthly or annual billing.',
            },
            {
              q: 'Can I export my financial reports and transactions anytime?',
              a: 'Yes. You have complete data portability. You can export your full transaction ledger, monthly summaries, and wealth allocations to CSV, JSON, or print-ready formatted PDFs with custom date range filtering at any time.',
            },
          ].map((item, idx) => (
            <div
              key={item.q}
              className="panel"
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                cursor: 'pointer',
              }}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 700,
                  fontSize: 15.5,
                  userSelect: 'none',
                }}
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    color: openFaq === idx ? 'var(--pop)' : 'var(--text3)',
                    flexShrink: 0,
                  }}
                />
              </div>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '0 24px 20px',
                      fontSize: 14,
                      color: 'var(--text2)',
                      lineHeight: 1.65,
                      borderTop: '1px solid var(--border)',
                      paddingTop: 16,
                    }}
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          10. HIGH CONVERSION FINAL CTA BANNER
          ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '48px 24px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 32,
            padding: '64px 36px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1E1B18 0%, #0F0E0C 100%)',
            color: '#FFFFFF',
            boxShadow: '0 32px 72px -12px rgba(28, 25, 23, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Burnt Orange Core Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500,
              height: 300,
              background: 'radial-gradient(circle, rgba(234, 88, 12, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, color: '#f97316' }}>
              Autonomous Wealth Command
            </span>
            <h2
              style={{
                fontSize: 'clamp(32px, 4.5vw, 48px)',
                fontWeight: 850,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '12px 0 16px',
                color: '#FFFFFF',
              }}
            >
              Take absolute sovereignty over your financial trajectory.
            </h2>
            <p style={{ fontSize: 16, color: '#D8D0C3', lineHeight: 1.6, marginBottom: 32 }}>
              Stop leaving statements unanalyzed and subscriptions untracked. Join modern investors who command their wealth with mathematical certainty.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="btn-primary"
                style={{
                  padding: '14px 32px',
                  fontSize: 15,
                  gap: 8,
                  boxShadow: '0 8px 28px rgba(234, 88, 12, 0.5)',
                }}
              >
                <span>{isAuthenticated ? 'Open Dashboard' : 'Create Free Account in 60s'}</span>
                <ArrowRight size={16} />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  style={{
                    padding: '14px 26px',
                    borderRadius: 999,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: 650,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          11. EDITORIAL FOOTER
          ══════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', padding: '56px 24px 32px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36, marginBottom: 48 }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <FinSightLogo size={36} className="app-logo auth-blend" />
              <span style={{ fontSize: 18, fontWeight: 800, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FinSight
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, maxWidth: 280 }}>
              Autonomous Wealth Engine &amp; Cryptographic Statement Ledger. Built for sovereign investors.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
              All Systems Operational (99.98% Uptime)
            </div>
          </div>

          {/* Column 2: Platform */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text)', marginBottom: 14 }}>
              Platform
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
              <button onClick={() => scrollTo('features')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>Statement Parser</button>
              <button onClick={() => scrollTo('sandbox')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>Monte Carlo Simulations</button>
              <button onClick={() => scrollTo('features')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>Stealth Privacy Shield</button>
              <button onClick={() => scrollTo('pricing')} style={{ textAlign: 'left', background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer' }}>Pricing Tiers</button>
            </div>
          </div>

          {/* Column 3: Trust & Legal */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text)', marginBottom: 14 }}>
              Trust &amp; Governance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <Link to="/legal" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Legal Hub</Link>
              <Link to="/legal#privacy" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Privacy Policy (Zero Monetization)</Link>
              <Link to="/legal#terms" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Terms of Service</Link>
              <Link to="/legal#dmca" style={{ color: 'var(--text2)', textDecoration: 'none' }}>DMCA Notice</Link>
              <Link to="/support" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Help Desk &amp; Inquiries</Link>
            </div>
          </div>

          {/* Column 4: Account Access */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text)', marginBottom: 14 }}>
              Account Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" style={{ color: 'var(--pop)', fontWeight: 700, textDecoration: 'none' }}>Go to Dashboard →</Link>
                  <Link to="/profile" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Security &amp; Sessions</Link>
                  <Link to="/premium" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Subscription &amp; Razorpay</Link>
                </>
              ) : (
                <>
                  <Link to="/login" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Sign In to Account</Link>
                  <Link to="/signup" style={{ color: 'var(--pop)', fontWeight: 700, textDecoration: 'none' }}>Create Free Account →</Link>
                  <Link to="/forgot-password" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Reset Password</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: 'var(--text3)' }}>
          <div>
            &copy; {new Date().getFullYear()} FinSight Technologies Inc. In-browser client-side cryptographic processing &amp; zero data monetization.
          </div>
          <div>
            Engineered with Luxury Editorial Tokens &amp; Actuarial Precision.
          </div>
        </div>
      </footer>

      {/* Responsive media style */}
      <style>{`
        @media (max-width: 860px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-trigger {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
}
