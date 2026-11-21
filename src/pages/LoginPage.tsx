import React, { useState } from 'react';
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
import Tilt3DCard from '../components/3d/Tilt3DCard';

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

// Surrounding floating telemetry satellites to fill the atmosphere dynamically
const FLOATING_SATELLITES = [
  {
    id: 'vault',
    icon: Shield,
    title: 'Zero-Knowledge Vault',
    desc: 'AES-256 client encryption',
    tag: 'BANK-GRADE',
    color: '#15803d',
    bg: 'rgba(21, 128, 61, 0.12)',
    style: { top: '12%', left: 'max(3%, calc(50% - 640px))' },
    anim: { y: [0, -12, 0] },
    duration: 6.5,
    delay: 0,
  },
  {
    id: 'forecast',
    icon: TrendingUp,
    title: 'Monte Carlo Engine',
    desc: 'Stochastic runway & wealth',
    tag: '+18.4% YOY',
    color: '#ea580c',
    bg: 'rgba(234, 88, 12, 0.12)',
    style: { top: '16%', right: 'max(3%, calc(50% - 640px))' },
    anim: { y: [0, 14, 0] },
    duration: 7.2,
    delay: 0.8,
  },
  {
    id: 'ai-parser',
    icon: Zap,
    title: 'Gemini Multimodal AI',
    desc: '12-category PDF ingestion',
    tag: '180ms OCR',
    color: '#0284c7',
    bg: 'rgba(2, 132, 199, 0.12)',
    style: { bottom: '14%', left: 'max(4%, calc(50% - 620px))' },
    anim: { y: [0, 10, 0] },
    duration: 6.8,
    delay: 0.4,
  },
  {
    id: 'sessions',
    icon: Activity,
    title: 'Persistent Session',
    desc: '30-day device authorization',
    tag: '0 REPETITIVE OTP',
    color: '#b45309',
    bg: 'rgba(180, 83, 9, 0.12)',
    style: { bottom: '15%', right: 'max(4%, calc(50% - 620px))' },
    anim: { y: [0, -11, 0] },
    duration: 6.0,
    delay: 1.2,
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
  const [rememberMe, setRememberMe] = useState(true);
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
          minHeight: '100vh',
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
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic ambient luminous blobs */}
      <div className="blob blob-1" style={{ opacity: 0.7 }} />
      <div className="blob blob-2" style={{ opacity: 0.55 }} />

      {/* Floating Top Header Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 1200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
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
          <FinSightLogo size={36} className="app-logo auth-blend" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>FinSight</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
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
            padding: '6px 14px',
            borderRadius: 20,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
            fontSize: 12,
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
      {/* FLOATING SATELLITES (Visible on >= 1024px)       */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="hidden lg:block pointer-events-none" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        {FLOATING_SATELLITES.map(s => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.id}
              style={{
                position: 'absolute',
                ...s.style,
                padding: '14px 18px',
                borderRadius: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-3d)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: 250,
                pointerEvents: 'auto',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              animate={s.anim}
              transition={{
                repeat: Infinity,
                duration: s.duration,
                ease: 'easeInOut',
                delay: s.delay,
              }}
              whileHover={{ scale: 1.04, borderColor: s.color }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: s.bg,
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.title}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.desc}
                </div>
                <div style={{ marginTop: 3 }}>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: s.color,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* FLOATING CENTERPIECE AUTHENTICATION CARD        */}
      {/* ═══════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 440,
          zIndex: 5,
          position: 'relative',
          margin: '72px 0 24px 0',
        }}
      >
        <Tilt3DCard
          maxTilt={4}
          glareOpacity={0.1}
          glowColor="rgba(234, 88, 12, 0.2)"
          style={{
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '40px 36px 32px 36px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-3d)',
              backdropFilter: 'blur(24px)',
              position: 'relative',
            }}
          >
            {/* Top Security Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(234, 88, 12, 0.08)',
                color: 'var(--pop)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <Sparkles size={12} />
              <span>Institutional Gate</span>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 24 }}>
              Sign in to access your autonomous financial command center.
            </p>

            {/* Google Authentication — Single One-Click Action */}
            <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44 }}>
              {hasGoogleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed.')}
                  theme="filled_black"
                  shape="pill"
                  text="continue_with"
                  width="368"
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
                    gap: 12,
                    padding: '11px 18px',
                    borderRadius: 24,
                    border: '1px solid var(--border)',
                    background: 'var(--bg2)',
                    color: 'var(--text)',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '10px 14px',
                  background: 'rgba(2, 132, 199, 0.09)',
                  color: '#0284c7',
                  borderRadius: 10,
                  fontSize: 12,
                  marginBottom: 16,
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  lineHeight: 1.45,
                }}
              >
                <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{infoMsg}</span>
              </motion.div>
            )}

            {/* Crisp Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '18px 0 20px 0',
                color: 'var(--text3)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span>Or with email</span>
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
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: '#dc2626',
                  fontSize: 12.5,
                  fontWeight: 500,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Credentials Form */}
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Email Input */}
              <div>
                <label
                  htmlFor="login-email"
                  style={{
                    display: 'block',
                    fontSize: 12.5,
                    fontWeight: 600,
                    marginBottom: 6,
                    color: 'var(--text)',
                  }}
                >
                  Work or personal email
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
                      paddingLeft: 38,
                      fontSize: 13.5,
                      background: 'var(--bg3)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label
                    htmlFor="login-password"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text)',
                    }}
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: 11.5,
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
                      paddingLeft: 38,
                      paddingRight: 40,
                      fontSize: 13.5,
                      background: 'var(--bg3)',
                      borderColor: 'var(--border)',
                    }}
                  />
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
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
                      right: 10,
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
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* 30-Day Session Persistence Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--bg2)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{
                      accentColor: 'var(--pop)',
                      width: 16,
                      height: 16,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                    Remember me for 30 days
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
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
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Sign up prompt */}
              <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginTop: 4 }}>
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
                  marginTop: 8,
                  paddingTop: 14,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  fontSize: 10.5,
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
                  fontSize: 11,
                  color: 'var(--text3)',
                  marginTop: -4,
                }}
              >
                <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'none', marginRight: 8 }}>
                  Terms of Service
                </Link>
                •
                <Link to="/legal#privacy" style={{ color: 'var(--text3)', textDecoration: 'none', margin: '0 8px' }}>
                  Privacy Policy
                </Link>
                •
                <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'none', marginLeft: 8 }}>
                  DMCA
                </Link>
              </div>
            </form>
          </div>
        </Tilt3DCard>
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
