import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useFinance } from '../context/FinanceContext';
import {
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
  Zap,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Activity,
  Sparkles,
  Info,
} from 'lucide-react';
import OtpModal from '../components/OtpModal';
import FinSightLogo from '../components/FinSightLogo';
import InteractiveCard3D from '../components/3d/InteractiveCard3D';

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
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Eliminate any page-level vertical scrollbar while viewing the login page
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);

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
          color: 'var(--purple)',
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        Verifying security session...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100dvh',
          maxHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <motion.div
          className="panel"
          style={{
            width: '100%',
            maxWidth: 440,
            padding: '40px 36px',
            textAlign: 'center',
            zIndex: 1,
            backdropFilter: 'blur(20px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-3d)',
            borderRadius: 'var(--radius)',
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Link to="/dashboard" aria-label="Go to Dashboard">
              <FinSightLogo size={56} className="app-logo auth-blend" style={{ cursor: 'pointer' }} />
            </Link>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Active Session Found</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.5 }}>
            You are currently signed in as <strong style={{ color: 'var(--text)' }}>{data.userEmail || 'Active User'}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              onClick={() => nav(data.isAdmin ? '/admin' : '/dashboard')}
            >
              Continue to Dashboard
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 14,
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171',
              }}
              onClick={() => logoutUser()}
            >
              Sign out &amp; Log in as different user
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
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100vh',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8px, 1.5vh, 16px) 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
        boxSizing: 'border-box',
      }}
    >
      {/* Dynamic ambient luminous blobs */}
      <div className="blob blob-1" style={{ opacity: 0.65 }} />
      <div className="blob blob-2" style={{ opacity: 0.5 }} />

      {/* Floating Top Header Bar */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%',
          maxWidth: 1020,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'clamp(8px, 1.4vh, 16px)',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <FinSightLogo size={32} className="app-logo auth-blend" />
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: -0.4 }}>FinSight</div>
            <div style={{ fontSize: 9.5, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Wealth Engine
            </div>
          </div>
        </Link>

        {/* Live system status indicator pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            fontSize: 11.5,
            fontWeight: 500,
            color: 'var(--text2)',
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#15803d',
              boxShadow: '0 0 8px #15803d',
            }}
          />
          <span className="hidden sm:inline">Systems Operational</span>
          <span style={{ color: 'var(--text3)' }}>•</span>
          <Link
            to="/signup"
            style={{
              color: 'var(--pop)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Create account →
          </Link>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════════ */}
      {/* FLOATING COMMAND DECK MASTER CONTAINER          */}
      {/* ═══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 1020,
          maxHeight: 'calc(100vh - clamp(60px, 9vh, 90px))',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-3d)',
          backdropFilter: 'blur(28px)',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          zIndex: 5,
          position: 'relative',
          flexShrink: 1,
        }}
      >
        {/* ───────────────────────────────────────────── */}
        {/* LEFT WING: THE LIVE FINANCIAL TELEMETRY DECK  */}
        {/* ───────────────────────────────────────────── */}
        <div
          className="hidden md:flex"
          style={{
            flex: '1 1 50%',
            padding: 'clamp(18px, 2.5vh, 28px) clamp(20px, 2.5vw, 32px)',
            background: 'var(--bg2)',
            borderRight: '1px solid var(--border)',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Ambient Radial Light */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '-20%',
              width: '140%',
              height: '140%',
              background: 'radial-gradient(circle at 30% 30%, rgba(234, 88, 12, 0.08) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          <div>
            {/* Top Deck Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--pop)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              <Sparkles size={11} />
              <span>Autonomous Balance Sheet</span>
            </div>

            <h2 style={{ fontSize: 'clamp(18px, 2.2vh, 22px)', fontWeight: 800, lineHeight: 1.25, letterSpacing: -0.4, marginBottom: 6 }}>
              Institutional precision for personal net worth.
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.45, marginBottom: 'clamp(8px, 1.5vh, 14px)' }}>
              Client-side encrypted statement parsing, automated cash runway models, and predictive actuarial intelligence.
            </p>

            {/* Embedded Interactive 3D Card Showcase (Scaled to fit comfortably) */}
            <div style={{ display: 'flex', justifyContent: 'center', height: 195, margin: '2px 0 10px 0' }}>
              <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', width: 380 }}>
                <InteractiveCard3D
                  balance={384500}
                  userName="FinSight Vault Account"
                  bankName="Obsidian Sovereign"
                  currency="₹"
                />
              </div>
            </div>
          </div>

          {/* Bottom Live Telemetry Pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#15803d', marginBottom: 2 }}>
                <TrendingUp size={12} />
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Runway</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>14.2 mos</div>
              <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>+18.4% YoY</div>
            </div>

            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--pop)', marginBottom: 2 }}>
                <Zap size={12} />
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Multimodal</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>180ms</div>
              <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>12 Categories</div>
            </div>

            <div style={{ padding: '8px 10px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0284c7', marginBottom: 2 }}>
                <Shield size={12} />
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Security</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AES-256</div>
              <div style={{ fontSize: 9.5, color: 'var(--text3)' }}>0 Plain-Text</div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* RIGHT WING: THE FLOATING AUTHENTICATION GATE  */}
        {/* ───────────────────────────────────────────── */}
        <div
          style={{
            flex: '1 1 50%',
            padding: 'clamp(18px, 2.5vh, 28px) clamp(20px, 2.8vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'var(--surface)',
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: 360, width: '100%', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                borderRadius: 20,
                background: 'rgba(21, 128, 61, 0.08)',
                color: '#15803d',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              <Activity size={12} />
              <span>Secure Authentication</span>
            </div>

            <h1 style={{ fontSize: 'clamp(20px, 2.4vh, 24px)', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.45, marginBottom: 12 }}>
              Log in to manage your unified wealth, transactions, and simulations.
            </p>

            {/* Google Authentication — Single One-Click Action */}
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', width: '100%', minHeight: 38 }}>
              {hasGoogleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed.')}
                  theme="filled_black"
                  shape="pill"
                  text="continue_with"
                  width="360"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleCustomGoogleClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '9px 16px',
                    borderRadius: 20,
                    border: '1px solid var(--border)',
                    background: 'var(--bg2)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--bg3)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'var(--bg2)')}
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
              )}
            </div>

            {/* Informational Toast / Notice */}
            {infoMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(2, 132, 199, 0.09)',
                  color: '#0284c7',
                  borderRadius: 8,
                  fontSize: 11.5,
                  marginBottom: 10,
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  lineHeight: 1.4,
                }}
              >
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{infoMsg}</span>
              </motion.div>
            )}

            {/* Crisp Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '8px 0 10px 0',
                color: 'var(--text3)',
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>Or sign in with email</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: '#dc2626',
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 10,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Credentials Form */}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {/* Email Input */}
              <div>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: 11.5,
                    fontWeight: 600,
                    marginBottom: 3,
                    color: 'var(--text)',
                  }}
                >
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-email"
                    type="email"
                    className="input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    autoComplete="email"
                    required
                    style={{
                      width: '100%',
                      paddingLeft: 34,
                      paddingTop: 8,
                      paddingBottom: 8,
                      fontSize: 13,
                      background: 'var(--bg3)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Mail
                    size={15}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text3)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text2)',
                      textDecoration: 'none',
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={show ? 'text' : 'password'}
                    className="input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    style={{
                      width: '100%',
                      paddingLeft: 34,
                      paddingRight: 36,
                      paddingTop: 8,
                      paddingBottom: 8,
                      fontSize: 13,
                      background: 'var(--bg3)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Lock
                    size={15}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text3)',
                      pointerEvents: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text3)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* 30-Day Session Persistence Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 10,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: 'var(--pop)',
                      width: 14,
                      height: 14,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                    Remember me for 30 days
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: rememberMe ? 'var(--pop)' : 'var(--text3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {rememberMe ? '30d active' : '24h session'}
                </span>
              </label>

              {/* Primary Submit CTA Button */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  marginTop: 2,
                  padding: '10px 18px',
                  fontSize: 13,
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
                    <RefreshCw size={15} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Workspace</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Sign up prompt */}
              <p style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'center', marginTop: 1 }}>
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  style={{
                    fontWeight: 600,
                    color: 'var(--pop)',
                    textDecoration: 'none',
                  }}
                >
                  Sign up free
                </Link>
              </p>

              {/* Security & Compliance Badges */}
              <div
                style={{
                  marginTop: 4,
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  fontSize: 9.5,
                  fontWeight: 600,
                  color: 'var(--text3)',
                  letterSpacing: 0.5,
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
                  fontSize: 10,
                  color: 'var(--text3)',
                  marginTop: 1,
                }}
              >
                <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'none', marginRight: 6 }}>
                  Terms
                </Link>
                •
                <Link to="/legal#privacy" style={{ color: 'var(--text3)', textDecoration: 'none', margin: '0 6px' }}>
                  Privacy
                </Link>
                •
                <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'none', marginLeft: 6 }}>
                  DMCA
                </Link>
              </div>
            </form>
          </div>
        </div>
      </motion.div>

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
