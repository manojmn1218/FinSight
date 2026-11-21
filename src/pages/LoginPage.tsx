import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useFinance } from '../context/FinanceContext';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Shield,
  Zap,
  Sparkles,
  Info,
} from 'lucide-react';
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

  // Authentication mode: 'login' | 'otp' (Fluid CodeXR transition)
  const [authStep, setAuthStep] = useState<'login' | 'otp'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // OTP state & 6 individual digit cells
  const [otpPurpose, setOtpPurpose] = useState<'login' | 'google_auth'>('login');
  const [otpPreview, setOtpPreview] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpCooldown, setOtpCooldown] = useState(30);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first OTP box whenever switching to OTP step
  useEffect(() => {
    if (authStep === 'otp') {
      const timer = setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [authStep]);

  // Resend cooldown timer
  useEffect(() => {
    if (authStep !== 'otp' || otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown(c => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [authStep, otpCooldown]);

  const hasGoogleClientId = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'FINSIGHT_PLACEHOLDER_CLIENT_ID'
  );

  const navigateAfterAuth = (authEmail: string, isAdmin?: boolean) => {
    const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'finsight27@gmail.com').toLowerCase();
    if (isAdmin || authEmail.toLowerCase() === adminEmail) {
      nav('/admin');
    } else {
      nav('/dashboard');
    }
  };

  // --- Login Form Submit ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
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
        setOtpPurpose('login');
        if (result.otpPreview) setOtpPreview(result.otpPreview);
        setOtpDigits(['', '', '', '', '', '']);
        setOtpCooldown(30);
        setAuthStep('otp');
        return;
      }
      navigateAfterAuth(cleanEmail, result.isAdmin);
    } else {
      setError(result.error || 'Invalid credentials. Access denied.');
    }
  };

  // --- Google OAuth Handler ---
  const handleGoogleSuccess = async (response: { credential?: string }) => {
    if (response.credential) {
      setError('');
      setInfoMsg('');
      setLoading(true);
      const result = await loginWithGoogle(response.credential, rememberMe);
      setLoading(false);

      if (result.success) {
        if (result.requiresOtp) {
          setOtpPurpose('google_auth');
          if (result.otpPreview) setOtpPreview(result.otpPreview);
          setOtpDigits(['', '', '', '', '', '']);
          setOtpCooldown(30);
          setAuthStep('otp');
          return;
        }
        navigateAfterAuth(result.email || email || '', result.isAdmin);
      } else {
        setError(result.error || 'Google sign-in failed.');
      }
    }
  };

  // --- OTP Verification Logic ---
  const executeOtpVerification = async (codeToVerify: string) => {
    setError('');
    setInfoMsg('');
    setVerifyingOtp(true);

    const cleanEmail = email.trim().toLowerCase();
    const res = await verifyOtpAndLogin(cleanEmail, codeToVerify, otpPurpose, rememberMe);
    setVerifyingOtp(false);

    if (res.success) {
      navigateAfterAuth(cleanEmail, res.isAdmin);
    } else {
      setError(res.error || 'Invalid verification code. Please check and try again.');
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (!clean) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    const char = clean.slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    setError('');

    // Advance to next box
    if (index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto-verify when 6th digit entered
    const fullCode = next.join('');
    if (fullCode.length === 6 && !next.includes('')) {
      executeOtpVerification(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!paste) return;

    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < paste.length; i++) {
      next[i] = paste[i];
    }
    setOtpDigits(next);
    setError('');

    const focusIdx = Math.min(5, paste.length);
    otpInputsRef.current[focusIdx]?.focus();

    if (paste.length === 6) {
      executeOtpVerification(paste);
    }
  };

  const handleResendOtp = async () => {
    if (otpCooldown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setError('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const res = await resendOtp(cleanEmail, otpPurpose);
    setResendingOtp(false);

    if (res.success) {
      setOtpCooldown(30);
      if (res.otpPreview) setOtpPreview(res.otpPreview);
      setInfoMsg(res.message || 'A fresh verification code has been dispatched to your email.');
    } else {
      setError(res.error || 'Failed to dispatch verification code. Please retry in a moment.');
    }
  };

  const handleAutofillDemoOtp = (code: string) => {
    const chars = code.split('').slice(0, 6);
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < chars.length; i++) {
      next[i] = chars[i];
    }
    setOtpDigits(next);
    setError('');
    executeOtpVerification(code);
  };

  // --- Active Session Found View ---
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
          gap: 10,
        }}
      >
        <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>Validating security session...</span>
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
        <div className="blob blob-1" style={{ opacity: 0.5 }} />
        <div className="blob blob-2" style={{ opacity: 0.4 }} />

        <motion.div
          style={{
            width: '100%',
            maxWidth: 440,
            padding: '36px 32px',
            textAlign: 'center',
            zIndex: 1,
            backdropFilter: 'blur(24px)',
            background: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid rgba(234, 88, 12, 0.2)',
            boxShadow: 'var(--shadow-3d)',
            borderRadius: 24,
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <Link to="/dashboard" aria-label="Go to Dashboard">
              <FinSightLogo size={54} className="app-logo auth-blend" style={{ cursor: 'pointer' }} />
            </Link>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            Active Session Detected
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.5 }}>
            You are signed in as <strong style={{ color: 'var(--text)' }}>{data.userEmail || 'Active User'}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={() => nav(data.isAdmin ? '/admin' : '/dashboard')}
            >
              <span>Continue to Workspace</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 13.5,
                borderColor: 'rgba(220, 38, 38, 0.35)',
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
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* ═══════════════════════════════════════════════ */}
      {/* AMBIENT ATMOSPHERIC BACKGROUND (NON-EMPTY FEEL) */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="blob blob-1" style={{ opacity: 0.6, width: 450, height: 450 }} />
      <div className="blob blob-2" style={{ opacity: 0.45, width: 400, height: 400 }} />

      {/* Subtle radial ambient aura centered around the card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 720,
          height: 720,
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, rgba(248, 245, 238, 0) 65%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Floating Satellite Badges Surrounding the Card */}
      {/* Satellite 1: Top-Left */}
      <div
        className="satellite-badge top-left"
        style={{
          position: 'absolute',
          top: '12%',
          left: 'max(4%, calc(50% - 380px))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(28, 25, 23, 0.08)',
          boxShadow: 'var(--shadow)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text2)',
          zIndex: 1,
          animation: 'floatingBadge1 5s ease-in-out infinite',
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
        <Shield size={14} style={{ color: 'var(--pop)' }} />
        <span>256-Bit SSL Encryption</span>
      </div>

      {/* Satellite 2: Top-Right */}
      <div
        className="satellite-badge top-right"
        style={{
          position: 'absolute',
          top: '14%',
          right: 'max(4%, calc(50% - 380px))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(28, 25, 23, 0.08)',
          boxShadow: 'var(--shadow)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text2)',
          zIndex: 1,
          animation: 'floatingBadge2 6s ease-in-out infinite',
        }}
      >
        <Zap size={14} style={{ color: '#ea580c' }} />
        <span>Sub-second Auth Pipeline</span>
      </div>

      {/* Satellite 3: Bottom-Left */}
      <div
        className="satellite-badge bottom-left"
        style={{
          position: 'absolute',
          bottom: '12%',
          left: 'max(4%, calc(50% - 370px))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(28, 25, 23, 0.08)',
          boxShadow: 'var(--shadow)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text2)',
          zIndex: 1,
          animation: 'floatingBadge3 5.5s ease-in-out infinite',
        }}
      >
        <Sparkles size={14} style={{ color: '#b45309' }} />
        <span>SendGrid 2FA Verified</span>
      </div>

      {/* Satellite 4: Bottom-Right */}
      <div
        className="satellite-badge bottom-right"
        style={{
          position: 'absolute',
          bottom: '14%',
          right: 'max(4%, calc(50% - 370px))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(28, 25, 23, 0.08)',
          boxShadow: 'var(--shadow)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text2)',
          zIndex: 1,
          animation: 'floatingBadge4 6.2s ease-in-out infinite',
        }}
      >
        <CheckCircle2 size={14} style={{ color: '#15803d' }} />
        <span>SOC-2 Type II Standards</span>
      </div>

      {/* Inline styles for keyframe floating badges */}
      <style>{`
        @keyframes floatingBadge1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes floatingBadge2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1.2deg); }
        }
        @keyframes floatingBadge3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(0.8deg); }
        }
        @keyframes floatingBadge4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(-1deg); }
        }
        @media (max-width: 860px) {
          .satellite-badge {
            display: none !important;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════ */}
      {/* THE HERO: FLOATING LUMINOUS CARD CONTAINER      */}
      {/* ═══════════════════════════════════════════════ */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: 440,
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(234, 88, 12, 0.22)',
          borderRadius: 24,
          boxShadow: '0 24px 64px -12px rgba(28, 25, 23, 0.12), 0 0 32px rgba(234, 88, 12, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Glowing electric accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #ff6b35 30%, #ea580c 70%, transparent)',
          }}
        />

        <div style={{ padding: '36px 32px 32px' }}>
          {/* Brand header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Link
              to="/dashboard"
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.12) 0%, rgba(255, 107, 53, 0.05) 100%)',
                  border: '1px solid rgba(234, 88, 12, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  boxShadow: '0 8px 20px -4px rgba(234, 88, 12, 0.15)',
                }}
              >
                <FinSightLogo size={36} className="app-logo auth-blend" />
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: -0.4,
                  color: 'var(--text)',
                  marginBottom: 4,
                }}
              >
                {authStep === 'login' ? 'Welcome Back' : 'Two-Factor Verification'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text2)', maxWidth: 320, lineHeight: 1.45 }}>
                {authStep === 'login'
                  ? 'Sign in to access your FinSight intelligence workspace'
                  : 'Enter the 6-digit verification code sent to your email'}
              </p>
            </Link>
          </div>

          {/* Inline alert messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#dc2626',
                fontSize: 12.5,
                lineHeight: 1.4,
                marginBottom: 18,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </motion.div>
          )}

          {infoMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -6, height: 0 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(234, 88, 12, 0.08)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                color: 'var(--pop-dark)',
                fontSize: 12.5,
                lineHeight: 1.4,
                marginBottom: 18,
              }}
            >
              <Info size={16} style={{ flexShrink: 0, marginTop: 1, color: 'var(--pop)' }} />
              <span>{infoMsg}</span>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════ */}
          {/* ANIMATED STEP METAMORPHOSIS (CodeXR REEL CORE)  */}
          {/* ═══════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {authStep === 'login' ? (
              /* ── STEP 1: LOGIN VIEW ── */
              <motion.div
                key="step-login"
                initial={{ opacity: 0, x: -16, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.98 }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Google Sign-in */}
                <div style={{ marginBottom: 18 }}>
                  {hasGoogleClientId ? (
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google sign-in encounter was rejected.')}
                        theme="outline"
                        size="large"
                        width="100%"
                        text="continue_with"
                        shape="pill"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setInfoMsg(
                          'Google OAuth is integrated! To enable live one-click sign-in, add VITE_GOOGLE_CLIENT_ID to .env.'
                        )
                      }
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: 14,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: 13.5,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: 'var(--shadow)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(28, 25, 23, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '18px 0',
                    fontSize: 11.5,
                    color: 'var(--text3)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span>or enter email</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>

                {/* Email + Password Form */}
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="login-email"
                      style={{
                        display: 'block',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'var(--text2)',
                        marginBottom: 6,
                      }}
                    >
                      Work or Personal Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={17}
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text3)',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        required
                        autoComplete="email"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: 14,
                          border: '1px solid var(--border)',
                          background: 'var(--bg3)',
                          color: 'var(--text)',
                          fontSize: 13.5,
                          outline: 'none',
                          transition: 'border 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#ea580c';
                          e.target.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.15)';
                          e.target.style.background = '#ffffff';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'var(--bg3)';
                        }}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <label
                        htmlFor="login-password"
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: 'var(--text2)',
                        }}
                      >
                        Account Password
                      </label>
                      <Link
                        to="/forgot-password"
                        style={{
                          fontSize: 12,
                          color: 'var(--pop)',
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={17}
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text3)',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        style={{
                          width: '100%',
                          padding: '11px 42px 11px 40px',
                          borderRadius: 14,
                          border: '1px solid var(--border)',
                          background: 'var(--bg3)',
                          color: 'var(--text)',
                          fontSize: 13.5,
                          outline: 'none',
                          transition: 'border 0.2s, box-shadow 0.2s',
                        }}
                        onFocus={e => {
                          e.target.style.borderColor = '#ea580c';
                          e.target.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.15)';
                          e.target.style.background = '#ffffff';
                        }}
                        onBlur={e => {
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'var(--bg3)';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text3)',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* 30-Day Remember Me Checkbox */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 2,
                    }}
                  >
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      style={{
                        accentColor: '#ea580c',
                        cursor: 'pointer',
                        width: 15,
                        height: 15,
                      }}
                    />
                    <label
                      htmlFor="remember-me"
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text2)',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      Keep me signed in for 30 days
                    </label>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      padding: '12px 20px',
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderRadius: 14,
                    }}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Verifying credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to FinSight</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </motion.button>

                  {/* Direct OTP switch link */}
                  <div style={{ textAlign: 'center', marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setInfoMsg('');
                        setOtpDigits(['', '', '', '', '', '']);
                        setAuthStep('otp');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text3)',
                        fontSize: 12,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: '4px 8px',
                      }}
                    >
                      Have an active 2FA OTP code? Verify directly →
                    </button>
                  </div>
                </form>

                {/* Sign up prompt */}
                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text2)' }}>
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    style={{
                      fontWeight: 600,
                      color: 'var(--pop)',
                      textDecoration: 'none',
                    }}
                  >
                    Create account free
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* ── STEP 2: SMOOTH MORPHING OTP VIEW (CodeXR Signature) ── */
              <motion.div
                key="step-otp"
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Animated Pulsing Shield Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <motion.div
                    animate={{
                      scale: [1, 1.08, 1],
                      boxShadow: [
                        '0 0 0 0 rgba(234, 88, 12, 0.3)',
                        '0 0 0 10px rgba(234, 88, 12, 0)',
                        '0 0 0 0 rgba(234, 88, 12, 0)',
                      ],
                    }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #ff6b35 0%, #ea580c 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px -4px rgba(234, 88, 12, 0.35)',
                    }}
                  >
                    <ShieldCheck size={26} />
                  </motion.div>
                </div>

                {/* Email chip with quick edit option */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: 'var(--bg3)',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {email.trim() || 'user@example.com'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setInfoMsg('');
                      setAuthStep('login');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--pop)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    Edit email
                  </button>
                </div>

                {/* Demo OTP auto-fill badge (if preview is available from backend) */}
                {otpPreview && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: 'rgba(234, 88, 12, 0.08)',
                      border: '1px dashed rgba(234, 88, 12, 0.3)',
                      textAlign: 'center',
                      fontSize: 12,
                      color: 'var(--pop-dark)',
                      cursor: 'pointer',
                    }}
                    onClick={() => handleAutofillDemoOtp(otpPreview)}
                    title="Click to automatically fill code"
                  >
                    <span>Test Demo Code: </span>
                    <strong style={{ letterSpacing: 2, fontFamily: 'monospace', fontSize: 13 }}>
                      {otpPreview}
                    </strong>
                    <span style={{ marginLeft: 6, fontSize: 11, textDecoration: 'underline' }}>
                      (Click to autofill)
                    </span>
                  </div>
                )}

                {/* 6 Individual Interactive Digit Cells (CodeXR Signature) */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 8,
                    marginBottom: 20,
                  }}
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      disabled={verifyingOtp}
                      style={{
                        width: 48,
                        height: 56,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        color: 'var(--text)',
                        background: digit ? '#ffffff' : 'var(--bg3)',
                        border: digit ? '2px solid #ea580c' : '1px solid var(--border)',
                        borderRadius: 14,
                        outline: 'none',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: digit
                          ? '0 0 0 3px rgba(234, 88, 12, 0.18), 0 4px 12px rgba(234, 88, 12, 0.12)'
                          : 'none',
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#ea580c';
                        e.target.style.boxShadow =
                          '0 0 0 3px rgba(234, 88, 12, 0.25), 0 0 16px rgba(234, 88, 12, 0.2)';
                        e.target.style.background = '#ffffff';
                        e.target.select();
                      }}
                      onBlur={e => {
                        if (!e.target.value) {
                          e.target.style.borderColor = 'var(--border)';
                          e.target.style.boxShadow = 'none';
                          e.target.style.background = 'var(--bg3)';
                        }
                      }}
                    />
                  ))}
                </div>

                {/* Verify & Proceed Button */}
                <motion.button
                  type="button"
                  className="btn-primary"
                  onClick={() => executeOtpVerification(otpDigits.join(''))}
                  disabled={verifyingOtp || otpDigits.join('').length < 6}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 14,
                    opacity: otpDigits.join('').length === 6 ? 1 : 0.7,
                  }}
                >
                  {verifyingOtp ? (
                    <>
                      <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Validating code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Verify &amp; Enter Workspace</span>
                    </>
                  )}
                </motion.button>

                {/* Resend Cooldown & Action */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginTop: 16,
                    fontSize: 12.5,
                    color: 'var(--text2)',
                  }}
                >
                  {otpCooldown > 0 ? (
                    <span>
                      Resend code in <strong style={{ color: 'var(--pop)' }}>{otpCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendingOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--pop)',
                        fontWeight: 600,
                        fontSize: 12.5,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '4px 8px',
                      }}
                    >
                      <RefreshCw
                        size={13}
                        className={resendingOtp ? 'spin' : ''}
                        style={{ animation: resendingOtp ? 'spin 1s linear infinite' : 'none' }}
                      />
                      <span>Didn't receive code? Resend now</span>
                    </button>
                  )}
                </div>

                {/* Back to Login Button */}
                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setInfoMsg('');
                      setAuthStep('login');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text3)',
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--text)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text3)';
                    }}
                  >
                    <ArrowLeft size={14} />
                    <span>Back to password login</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compliance & Security strip */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 16,
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
            <span>0-LOGS ARCHITECTURE</span>
            <span>•</span>
            <span>SOC2 TYPE II</span>
          </div>

          {/* Legal Links */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text3)',
              marginTop: 10,
            }}
          >
            <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'none', marginRight: 8 }}>
              Terms
            </Link>
            •
            <Link to="/legal#privacy" style={{ color: 'var(--text3)', textDecoration: 'none', margin: '0 8px' }}>
              Privacy
            </Link>
            •
            <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'none', marginLeft: 8 }}>
              DMCA
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
