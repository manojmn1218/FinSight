import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useFinance } from '../context/FinanceContext';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Info,
  Sparkles,
  Cpu,
  KeyRound,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import OtpModal from '../components/OtpModal';
import FinSightLogo from '../components/FinSightLogo';
import Tilt3DCard from '../components/3d/Tilt3DCard';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

const INSTITUTIONAL_PILLARS = [
  {
    icon: ShieldCheck,
    badge: '100% In-Browser Wasm',
    title: 'Client-Side Statement Sandbox',
    desc: 'Bank statements (SBI, HDFC, ICICI, Axis, Kotak) parse locally in memory. Unencrypted data never touches remote servers.',
    accent: '#15803d',
    glow: 'rgba(21, 128, 61, 0.15)',
  },
  {
    icon: Cpu,
    badge: 'NumPy 2.5 • Brownian Motion',
    title: 'Stochastic Simulation Engine',
    desc: 'Run 1,000+ Monte Carlo portfolio simulations and inflation-adjusted retirement corpus projections in real time.',
    accent: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.15)',
  },
  {
    icon: Sparkles,
    badge: '1-Click Privacy Shield',
    title: 'Stealth Mode Protection',
    desc: 'Instantly obscure balances, portfolio allocations, and transactions with a single click for secure public viewing.',
    accent: '#b45309',
    glow: 'rgba(180, 83, 9, 0.15)',
  },
];

export default function LoginPage() {
  const nav = useNavigate();
  const {
    loginWithPassword,
    loginWithGoogle,
    verifyOtpAndLogin,
    resendOtp,
    isAuthenticated,
    data,
    isLoading,
    logoutUser,
  } = useFinance();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigateAfterAuth = (authEmail: string, isAdmin?: boolean) => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'finsight27@gmail.com').toLowerCase();
    if (isAdmin || authEmail.toLowerCase() === adminEmail) {
      nav('/admin');
    } else {
      nav('/dashboard');
    }
  };

  // OTP modal state
  const [otpState, setOtpState] = useState<{
    isOpen: boolean;
    email: string;
    purpose: 'login' | 'google_auth';
    otpPreview?: string;
  }>({
    isOpen: false,
    email: '',
    purpose: 'login',
    otpPreview: '',
  });

  const hasGoogleClientId = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'FINSIGHT_PLACEHOLDER_CLIENT_ID'
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const result = await loginWithPassword(cleanEmail, password, rememberMe);
    setLoading(false);

    if (result.success) {
      if (result.requiresOtp) {
        setOtpState({
          isOpen: true,
          email: result.email || cleanEmail,
          purpose: 'login',
          otpPreview: result.otpPreview,
        });
        return;
      }

      navigateAfterAuth(cleanEmail, result.isAdmin);
    } else {
      setError(result.error || 'Invalid credentials. Access denied.');
    }
  };

  const handleGoogleSuccess = async (response: { credential?: string }) => {
    if (response.credential) {
      setError('');
      setInfoMsg('');
      setLoading(true);
      const result = await loginWithGoogle(response.credential, rememberMe);
      setLoading(false);

      if (result.success) {
        if (result.requiresOtp) {
          setOtpState({
            isOpen: true,
            email: result.email || email || 'Google Account',
            purpose: 'google_auth',
            otpPreview: result.otpPreview,
          });
          return;
        }
        navigateAfterAuth(result.email || '', result.isAdmin);
      } else {
        setError(result.error || 'Google sign-in failed.');
      }
    }
  };

  const handleVerifyOtp = async (code: string) => {
    const res = await verifyOtpAndLogin(otpState.email, code, otpState.purpose, rememberMe);
    if (res.success) {
      setOtpState(prev => ({ ...prev, isOpen: false }));
      navigateAfterAuth(otpState.email, res.isAdmin);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleResendOtp = async () => {
    return resendOtp(otpState.email, otpState.purpose);
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          color: 'var(--pop)',
          fontWeight: 600,
          fontSize: 15,
          gap: 12,
        }}
      >
        <RefreshCw size={20} className="animate-spin" />
        Verifying security session...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <motion.div
          className="panel"
          style={{
            width: '100%',
            maxWidth: 460,
            padding: '44px 36px',
            textAlign: 'center',
            zIndex: 1,
            boxShadow: 'var(--shadow-3d)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Link to="/dashboard" aria-label="Go to Dashboard">
              <FinSightLogo size={60} className="app-logo auth-blend" style={{ cursor: 'pointer' }} />
            </Link>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(21, 128, 61, 0.1)',
              color: 'var(--green)',
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              letterSpacing: 0.5,
            }}
          >
            <CheckCircle2 size={14} /> ACTIVE SESSION AUTHENTICATED
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: 'var(--text)', letterSpacing: -0.5 }}>
            Welcome back to FinSight
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.6 }}>
            Signed in as <strong style={{ color: 'var(--text)' }}>{data.userEmail || 'Active User'}</strong>. Your
            encrypted session is live and ready.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              onClick={() => nav(data.isAdmin ? '/admin' : '/dashboard')}
            >
              Continue to Dashboard <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 13,
                fontWeight: 600,
                borderColor: 'rgba(220, 38, 38, 0.3)',
                color: 'var(--red)',
                background: 'transparent',
              }}
              onClick={() => logoutUser()}
            >
              Sign out &amp; switch account
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleCustomGoogleClick = () => {
    setInfoMsg(
      'Google OAuth is integrated! To enable live one-click popup, add your Google Cloud Client ID to .env as VITE_GOOGLE_CLIENT_ID.'
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Ambient background glows */}
      <div className="blob blob-1" style={{ opacity: 0.7 }} />
      <div className="blob blob-2" style={{ opacity: 0.5 }} />

      {/* Subtle background grid lines for architectural fintech feel */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            'radial-gradient(circle at 50% 20%, rgba(234, 88, 12, 0.05) 0%, transparent 65%), linear-gradient(to right, rgba(28, 25, 23, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(28, 25, 23, 0.03) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 48px 48px, 48px 48px',
          opacity: 0.8,
        }}
      />

      <div
        className="panel auth-split-panel"
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 1120,
          minHeight: 640,
          overflow: 'hidden',
          padding: 0,
          zIndex: 1,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-3d)',
        }}
      >
        {/* Left — Institutional Showcase */}
        <motion.div
          style={{
            flex: 1.15,
            padding: '52px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid var(--border)',
            background: 'var(--bg2)',
            position: 'relative',
          }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Brand & Eyebrow */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
              <Link
                to="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <FinSightLogo size={44} className="app-logo auth-blend" />
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4, color: 'var(--text)' }}>
                    FinSight
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      letterSpacing: 1.2,
                      fontWeight: 700,
                    }}
                  >
                    Autonomous Wealth Engine
                  </div>
                </div>
              </Link>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(21, 128, 61, 0.1)',
                  color: 'var(--green)',
                  border: '1px solid rgba(21, 128, 61, 0.25)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--green)',
                    animation: 'pulse 1.8s infinite',
                  }}
                />
                Client-Side Sandbox
              </span>
            </div>

            <h1
              style={{
                fontSize: 36,
                fontWeight: 900,
                lineHeight: 1.15,
                marginBottom: 14,
                letterSpacing: -0.8,
                color: 'var(--text)',
              }}
            >
              Institutional precision for{' '}
              <span
                style={{
                  background: 'var(--grad)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                personal capital.
              </span>
            </h1>

            <p style={{ fontSize: 14.5, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 32, maxWidth: 440 }}>
              Audit multi-bank statements 100% locally in-browser. Zero cloud leakage, automated ledger parsing, and
              stochastic wealth simulations.
            </p>

            {/* Pillar Cards with 3D Micro-Tilt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {INSTITUTIONAL_PILLARS.map((pillar, i) => (
                <Tilt3DCard
                  key={pillar.title}
                  maxTilt={4}
                  glareOpacity={0.08}
                  glowColor={pillar.glow}
                  style={{
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    padding: '16px 18px',
                    boxShadow: 'var(--shadow)',
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${pillar.accent}15`,
                        color: pillar.accent,
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <pillar.icon size={19} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                          {pillar.title}
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: pillar.accent,
                            background: `${pillar.accent}12`,
                            padding: '2px 7px',
                            borderRadius: 6,
                            letterSpacing: 0.3,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pillar.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.5 }}>
                        {pillar.desc}
                      </div>
                    </div>
                  </motion.div>
                </Tilt3DCard>
              ))}
            </div>
          </div>

          {/* Institutional Trust Footnote */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 18,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              color: 'var(--text3)',
            }}
          >
            <span>Verified 40+ Indian &amp; Global Banks</span>
            <span style={{ fontWeight: 600, color: 'var(--text2)' }}>AES-256 • SOC2 Ready</span>
          </div>
        </motion.div>

        {/* Right — Elevated Auth Console */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '52px 44px',
            background: 'var(--surface)',
          }}
        >
          <motion.div
            style={{ width: '100%', maxWidth: 380 }}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--pop)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              <KeyRound size={12} /> SECURE AUTHENTICATION
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: 'var(--text)', letterSpacing: -0.5 }}>
              Sign in to your vault
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.5 }}>
              Enter your credentials to unlock your autonomous wealth portfolio.
            </p>

            {/* Google Authentication Button */}
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44 }}>
              {hasGoogleClientId ? (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in was cancelled or failed.')}
                    theme="filled_black"
                    shape="pill"
                    text="continue_with"
                    width="380"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCustomGoogleClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    padding: '11px 18px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg2)',
                    color: 'var(--text)',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(28,25,23,0.04)',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--pop)';
                    e.currentTarget.style.background = 'var(--surface-hover)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--bg2)';
                  }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              )}
            </div>

            {/* Info Message (e.g. Google Client ID instructions) */}
            {infoMsg && (
              <div
                style={{
                  padding: '11px 14px',
                  background: 'rgba(2, 132, 199, 0.08)',
                  color: 'var(--blue)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12.5,
                  marginBottom: 18,
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                  fontWeight: 700,
                }}
              >
                or with email
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Form */}
            <form onSubmit={submit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    color: 'var(--red)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    fontWeight: 500,
                    border: '1px solid rgba(220, 38, 38, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </div>
                  {error.includes('backend server') && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text2)',
                        borderTop: '1px solid rgba(220, 38, 38, 0.15)',
                        paddingTop: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      <Info size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      <strong>Tip:</strong> Run{' '}
                      <code style={{ color: 'var(--pop)', background: 'rgba(28,25,23,0.06)', padding: '1px 5px', borderRadius: 4 }}>
                        npm run dev
                      </code>{' '}
                      to start backend services.
                    </div>
                  )}
                </div>
              )}

              {/* Email Input with Icon */}
              <div>
                <label
                  htmlFor="login-email"
                  className="label"
                  style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}
                >
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text3)',
                      pointerEvents: 'none',
                      display: 'flex',
                    }}
                  >
                    <Mail size={16} />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="input"
                    style={{
                      paddingLeft: 40,
                      height: 44,
                      fontSize: 14,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      transition: 'all var(--transition)',
                    }}
                  />
                </div>
              </div>

              {/* Password Input with Icon & Toggle */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    htmlFor="login-password"
                    className="label"
                    style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text2)', marginBottom: 0 }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--pop)',
                      textDecoration: 'none',
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text3)',
                      pointerEvents: 'none',
                      display: 'flex',
                    }}
                  >
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="input"
                    style={{
                      paddingLeft: 40,
                      paddingRight: 42,
                      height: 44,
                      fontSize: 14,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      transition: 'all var(--transition)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text3)',
                      cursor: 'pointer',
                      display: 'flex',
                      padding: 4,
                      borderRadius: 4,
                    }}
                  >
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 30-Day Remember Me Card Option */}
              <label
                htmlFor="remember-me-30d"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${rememberMe ? 'var(--pop)' : 'var(--border)'}`,
                  background: rememberMe ? 'var(--pop-glow)' : 'var(--bg2)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    id="remember-me-30d"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: 'var(--pop)',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    Remember me for 30 days
                  </span>
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: rememberMe ? 'var(--pop-dark)' : 'var(--text3)',
                    background: rememberMe ? 'rgba(234, 88, 12, 0.18)' : 'transparent',
                    padding: '2px 8px',
                    borderRadius: 6,
                    letterSpacing: 0.3,
                  }}
                >
                  {rememberMe ? '30d Trusted' : '24h Standard'}
                </span>
              </label>

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: 6,
                  height: 46,
                  fontSize: 14.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Sign up link */}
              <p style={{ fontSize: 13.5, color: 'var(--text2)', textAlign: 'center', marginTop: 10 }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ fontWeight: 700, color: 'var(--pop)', textDecoration: 'none' }}>
                  Create an account
                </Link>
              </p>

              {/* Legal Links */}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                  textAlign: 'center',
                  fontSize: 11,
                  color: 'var(--text3)',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                }}
              >
                <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
                <span>•</span>
                <Link to="/legal#privacy" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
                <span>•</span>
                <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                  DMCA Notice
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <OtpModal
        isOpen={otpState.isOpen}
        email={otpState.email}
        purpose={otpState.purpose}
        otpPreview={otpState.otpPreview}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onCancel={() => setOtpState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
