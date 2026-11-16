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
  Cpu,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Info,
  Fingerprint,
  Activity,
} from 'lucide-react';
import OtpModal from '../components/OtpModal';
import FinSightLogo from '../components/FinSightLogo';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

const ARCH_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Zero-Knowledge Storage',
    desc: 'Local browser AES-256 encryption. Zero unencrypted financial telemetry.',
    badge: 'AES-256',
  },
  {
    icon: Cpu,
    title: 'WASM Monte Carlo Sandbox',
    desc: 'Real-time runway simulations execute client-side at native assembly speed.',
    badge: 'CLIENT WASM',
  },
  {
    icon: Fingerprint,
    title: 'Cryptographic Session Pinning',
    desc: 'Persistent 30-day device authorization with zero repetitive 2FA friction.',
    badge: '30D TOKEN',
  },
];

const ASSET_TELEMETRY = [
  { label: 'EQUITIES', pct: '54%', color: '#ea580c' },
  { label: 'TREASURIES', pct: '22%', color: '#15803d' },
  { label: 'PHYSICAL GOLD', pct: '14%', color: '#b45309' },
  { label: 'LIQUID CASH', pct: '10%', color: '#0284c7' },
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

  const handleCustomGoogleClick = () => {
    setInfoMsg(
      'Google OAuth is integrated! To enable live one-click popup, add your Google Cloud Client ID to .env as VITE_GOOGLE_CLIENT_ID.'
    );
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
          fontFamily: 'inherit',
          letterSpacing: '-0.01em',
          gap: 12,
        }}
      >
        <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Verifying cryptographic security session...</span>
      </div>
    );
  }

  // Active Session Found Screen
  if (isAuthenticated) {
    const userInitial = (data.userEmail?.[0] || 'U').toUpperCase();
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          position: 'relative',
          background: 'var(--bg)',
        }}
      >
        <motion.div
          className="panel"
          style={{
            width: '100%',
            maxWidth: 480,
            padding: '44px 36px',
            textAlign: 'center',
            position: 'relative',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-3d)',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo & Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Link to="/dashboard" aria-label="FinSight Dashboard">
              <FinSightLogo size={56} className="app-logo" style={{ cursor: 'pointer' }} />
            </Link>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 9999,
              background: 'rgba(21, 128, 61, 0.08)',
              border: '1px solid rgba(21, 128, 61, 0.25)',
              color: '#15803d',
              fontSize: 11,
              fontWeight: 600,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '0.08em',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#15803d',
                boxShadow: '0 0 6px #15803d',
              }}
            />
            ACTIVE SESSION PERSISTED
          </div>

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.14) 0%, rgba(234, 88, 12, 0.04) 100%)',
              border: '2px solid rgba(234, 88, 12, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--pop)',
            }}
          >
            {userInitial}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Welcome back
          </h2>

          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.5 }}>
            Currently authenticated as{' '}
            <strong style={{ color: 'var(--text)', wordBreak: 'break-all' }}>
              {data.userEmail || 'Active User'}
            </strong>
            {data.isAdmin && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 8,
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'rgba(234, 88, 12, 0.12)',
                  color: 'var(--pop)',
                }}
              >
                ADMIN
              </span>
            )}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px 20px',
                fontSize: 14,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={() => nav(data.isAdmin ? '/admin' : '/dashboard')}
            >
              <span>Continue to {data.isAdmin ? 'Admin Console' : 'Dashboard'}</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{
                width: '100%',
                padding: '11px 20px',
                fontSize: 13,
                fontWeight: 500,
                borderColor: 'rgba(220, 38, 38, 0.3)',
                color: '#dc2626',
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

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        background: 'var(--bg)',
      }}
    >
      <div
        className="panel auth-split-panel"
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: 1120,
          minHeight: 640,
          overflow: 'hidden',
          padding: 0,
          borderRadius: 16,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: 'var(--shadow-3d)',
        }}
      >
        {/* LEFT COLUMN: Cockpit / Telemetry HUD */}
        <motion.div
          style={{
            flex: 1.25,
            padding: '52px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid var(--border)',
            background: 'var(--bg2)',
          }}
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Top Brand & Status Strip */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 36,
              }}
            >
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <FinSightLogo size={38} className="app-logo" />
                <div>
                  <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    FinSight
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--text3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.12em',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    Autonomous Wealth Engine
                  </div>
                </div>
              </Link>

              {/* Status Indicator */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'rgba(21, 128, 61, 0.08)',
                  border: '1px solid rgba(21, 128, 61, 0.22)',
                  color: '#15803d',
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '0.06em',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#15803d',
                    boxShadow: '0 0 6px #15803d',
                  }}
                />
                SYS: OPERATIONAL
              </div>
            </div>

            {/* Display Headline */}
            <h1
              style={{
                fontSize: 34,
                fontWeight: 800,
                lineHeight: 1.18,
                letterSpacing: '-0.03em',
                marginBottom: 14,
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
                sovereign wealth.
              </span>
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text2)',
                lineHeight: 1.6,
                marginBottom: 28,
                maxWidth: 460,
              }}
            >
              Parse financial statements locally in-browser, run deterministic runway models, and eliminate recurring burn with zero third-party telemetry.
            </p>

            {/* Live Portfolio Telemetry HUD Widget */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                marginBottom: 24,
                boxShadow: 'var(--shadow)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text3)',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '0.08em',
                  }}
                >
                  <Activity size={13} style={{ color: 'var(--pop)' }} />
                  <span>SIMULATED PORTFOLIO TRAJECTORY</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#15803d',
                    background: 'rgba(21, 128, 61, 0.08)',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  <TrendingUp size={11} />
                  <span>+14.2% YoY</span>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div style={{ width: '100%', height: 42, marginBottom: 12, position: 'relative' }}>
                <svg
                  viewBox="0 0 300 44"
                  preserveAspectRatio="none"
                  style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ea580c" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Fill area */}
                  <path
                    d="M 0 36 C 40 34, 70 30, 110 24 C 150 18, 190 22, 230 12 C 265 4, 285 6, 300 2 L 300 44 L 0 44 Z"
                    fill="url(#wealthGrad)"
                  />
                  {/* Stroke line */}
                  <path
                    d="M 0 36 C 40 34, 70 30, 110 24 C 150 18, 190 22, 230 12 C 265 4, 285 6, 300 2"
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {/* Endpoint glowing node */}
                  <circle cx="300" cy="2" r="4" fill="#ea580c" />
                  <circle cx="300" cy="2" r="7" fill="none" stroke="#ea580c" strokeWidth="1" opacity="0.4" />
                </svg>
              </div>

              {/* Telemetry Chips */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                }}
              >
                {ASSET_TELEMETRY.map(item => (
                  <div key={item.label} style={{ fontSize: 10, lineHeight: 1.3 }}>
                    <div
                      style={{
                        color: 'var(--text3)',
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        fontSize: 9,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: item.color,
                          marginRight: 4,
                          verticalAlign: 'middle',
                        }}
                      />
                      {item.pct}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Micro-Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ARCH_PILLARS.map((item, idx) => (
                <motion.div
                  key={item.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 1px 3px rgba(28,25,23,0.03)',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08, duration: 0.3 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(234, 88, 12, 0.08)',
                      color: 'var(--pop)',
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={17} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {item.title}
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'var(--bg3)',
                          color: 'var(--text3)',
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Security Note */}
          <div
            style={{
              paddingTop: 20,
              marginTop: 20,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text3)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={12} style={{ color: 'var(--pop)' }} />
              Hardware Security Enclave Ready
            </span>
            <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 10 }}>
              VER 2.4.0
            </span>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Form Cockpit */}
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
            {/* Form Eyebrow & Title */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--pop)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 8,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              }}
            >
              // VERIFIED ACCESS GATEWAY
            </div>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.025em',
                marginBottom: 6,
                color: 'var(--text)',
              }}
            >
              Sign in to FinSight
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 24 }}>
              Authenticate to unlock your financial workspace.
            </p>

            {/* Google Authentication — Single Unified Button */}
            <div style={{ marginBottom: 20, width: '100%', minHeight: 44 }}>
              {hasGoogleClientId ? (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in was cancelled or failed.')}
                    theme="outline"
                    shape="rectangular"
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
                    borderRadius: 10,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 1px 2px rgba(28,25,23,0.04)',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                    e.currentTarget.style.background = 'var(--bg2)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              )}
            </div>

            {infoMsg && (
              <div
                style={{
                  padding: '11px 14px',
                  background: 'rgba(2, 132, 199, 0.08)',
                  color: '#0284c7',
                  borderRadius: 8,
                  fontSize: 12.5,
                  marginBottom: 16,
                  border: '1px solid rgba(2, 132, 199, 0.22)',
                  lineHeight: 1.45,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span
                style={{
                  fontSize: 10,
                  color: 'var(--text3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                or credentials
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Email + Password Form */}
            <form onSubmit={submit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(220, 38, 38, 0.08)',
                    color: '#dc2626',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 500,
                    border: '1px solid rgba(220, 38, 38, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </div>
                  {error.includes('backend server') && (
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text2)',
                        borderTop: '1px solid rgba(220, 38, 38, 0.15)',
                        paddingTop: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      <Info size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      <strong>Tip:</strong> In your terminal, run{' '}
                      <code
                        style={{
                          color: 'var(--pop)',
                          background: 'rgba(234, 88, 12, 0.08)',
                          padding: '1px 5px',
                          borderRadius: 4,
                          fontFamily: 'ui-monospace, monospace',
                        }}
                      >
                        npm run dev
                      </code>{' '}
                      to launch both client &amp; server.
                    </div>
                  )}
                </div>
              )}

              {/* Email Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>
                    Work or personal email
                  </label>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--text3)',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    }}
                  >
                    REQUIRED
                  </span>
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="input"
                />
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--pop)',
                      textDecoration: 'none',
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="input"
                    style={{ paddingRight: 42 }}
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
                      transition: 'color 0.15s ease',
                    }}
                    onMouseOver={e => (e.currentTarget.style.color = 'var(--text)')}
                    onMouseOut={e => (e.currentTarget.style.color = 'var(--text3)')}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* 30-Day Hardened Remember Me Switch */}
              <label
                htmlFor="remember-me-30d"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '11px 13px',
                  borderRadius: 10,
                  border: `1.5px solid ${rememberMe ? 'rgba(234, 88, 12, 0.45)' : 'var(--border)'}`,
                  background: rememberMe ? 'rgba(234, 88, 12, 0.05)' : 'var(--surface)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                      Remember this device
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      Bypasses repetitive 2FA for 30 days
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: rememberMe ? 'rgba(234, 88, 12, 0.12)' : 'var(--bg3)',
                    color: rememberMe ? 'var(--pop)' : 'var(--text3)',
                    flexShrink: 0,
                  }}
                >
                  {rememberMe ? '30D TRUSTED' : '24H SESSION'}
                </div>
              </label>

              {/* Submit CTA */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: 6,
                  padding: '13px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Sign up prompt */}
              <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginTop: 6 }}>
                New to FinSight?{' '}
                <Link
                  to="/signup"
                  style={{
                    fontWeight: 600,
                    color: 'var(--pop)',
                    textDecoration: 'none',
                  }}
                >
                  Create an account
                </Link>
              </p>

              {/* Security & Compliance Badges */}
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 14,
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--text3)',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                <span>AES-256 GCM</span>
                <span>•</span>
                <span>0-LOGS</span>
                <span>•</span>
                <span>SOC2 TYPE II</span>
              </div>

              {/* Legal Links */}
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 11,
                  color: 'var(--text3)',
                  marginTop: -4,
                }}
              >
                <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                  Terms of Service
                </Link>
                <span style={{ margin: '0 8px' }}>•</span>
                <Link to="/legal#privacy" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                  Privacy Policy
                </Link>
                <span style={{ margin: '0 8px' }}>•</span>
                <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'none' }}>
                  DMCA
                </Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* OTP Verification Modal */}
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
