import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import OtpModal from '../components/OtpModal';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export default function SignupPage() {
  const nav = useNavigate();
  const { registerUser, loginWithGoogle, verifyOtpAndLogin, resendOtp } = useFinance();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // OTP modal state
  const [otpState, setOtpState] = useState<{
    isOpen: boolean;
    email: string;
    purpose: 'signup' | 'google_auth';
    otpPreview?: string;
  }>({
    isOpen: false,
    email: '',
    purpose: 'signup',
    otpPreview: '',
  });

  const hasGoogleClientId = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'FINSIGHT_PLACEHOLDER_CLIENT_ID'
  );

  const [loading, setLoading] = useState(false);

  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One number', pass: /[0-9]/.test(password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const allPass = passwordChecks.every(c => c.pass);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!allPass) {
      setError('Password does not satisfy security requirements (minimum 8 characters with uppercase, number, and special character).');
      return;
    }

    setLoading(true);
    const result = await registerUser(cleanEmail, password, cleanName);
    setLoading(false);

    if (result.success) {
      if (result.requiresOtp) {
        setOtpState({
          isOpen: true,
          email: result.email || cleanEmail,
          purpose: 'signup',
          otpPreview: result.otpPreview,
        });
        return;
      }
      nav('/onboarding');
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    if (response.credential) {
      setError('');
      setInfoMsg('');
      const result = await loginWithGoogle(response.credential);
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
        nav('/dashboard');
      } else {
        setError(result.error || 'Google sign-up failed.');
      }
    }
  };

  const handleCustomPopupSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setInfoMsg('');
      const result = await loginWithGoogle({ accessToken: tokenResponse.access_token });
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
        nav('/dashboard');
      } else {
        setError(result.error || 'Google sign-up failed.');
      }
    },
    onError: (err) => {
      console.warn('[Google Sign-Up Popup Error]', err);
      setError('Google sign-up popup was cancelled or failed.');
    },
  });

  const handleCustomGoogleClick = () => {
    setInfoMsg(
      'Google OAuth is integrated! To enable live one-click signup, add your Google Cloud Client ID to .env as VITE_GOOGLE_CLIENT_ID.'
    );
  };

  const handleVerifyOtp = async (code: string) => {
    const res = await verifyOtpAndLogin(otpState.email, code, otpState.purpose);
    if (res.success) {
      setOtpState(prev => ({ ...prev, isOpen: false }));
      nav('/onboarding');
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const handleResendOtp = async () => {
    return resendOtp(otpState.email, otpState.purpose);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="blob blob-3" style={{ left: '-10%', top: '-10%', width: 500, height: 500 }} />
      <div className="blob blob-2" style={{ right: '-5%', bottom: '-5%', width: 400, height: 400 }} />

      <motion.div
        className="panel"
        style={{ width: 420, padding: '40px 36px', zIndex: 1 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <img src="/ft.jpeg" alt="FinSight" className="app-logo auth-blend" style={{ width: 48, height: 48 }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, textAlign: 'center' }}>Get started free</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Create your account</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, textAlign: 'center' }}>Join thousands managing their finances smarter.</p>

        {error && (
          <div style={{ padding: '12px 14px', background: 'rgba(248,113,113,0.12)', color: '#f87171', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16, border: '1px solid rgba(248,113,113,0.25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{error}</span>
            </div>
            {error.includes('backend server') && (
              <div style={{ fontSize: 12, color: 'var(--text2)', borderTop: '1px solid rgba(248,113,113,0.2)', paddingTop: 6, lineHeight: 1.4 }}>
                💡 <strong>Tip:</strong> In your terminal, run <code style={{ color: '#a78bfa', background: 'rgba(0,0,0,0.2)', padding: '1px 5px', borderRadius: 4 }}>npm run dev</code> to start both frontend &amp; backend.
              </div>
            )}
          </div>
        )}

        {/* Google Authentication — Single Button */}
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44 }}>
          {hasGoogleClientId ? (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-up was cancelled or failed.')}
              theme="filled_black"
              shape="pill"
              text="signup_with"
              width="348"
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
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <GoogleIcon />
              <span>Sign up with Google</span>
            </button>
          )}
        </div>

        {infoMsg && (
          <div style={{ padding: '10px 14px', background: 'rgba(96,165,250,0.12)', color: '#93c5fd', borderRadius: 8, fontSize: 12, marginBottom: 14, border: '1px solid rgba(96,165,250,0.25)', lineHeight: 1.4 }}>
            {infoMsg}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="label">Full name</label>
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label">Email address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required className="input" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {passwordChecks.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.pass ? 'var(--green)' : 'var(--text3)' }}>
                    {c.pass ? <Check size={14} /> : <XIcon size={14} />}
                    {c.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={!allPass || loading} className="btn-primary" style={{ width: '100%', marginTop: 8, opacity: (allPass && !loading) ? 1 : 0.5, cursor: (allPass && !loading) ? 'pointer' : 'not-allowed' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginTop: 8 }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
          </p>
        </form>
      </motion.div>

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
