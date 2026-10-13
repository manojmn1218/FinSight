import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useFinance } from '../context/FinanceContext';
import { Eye, EyeOff, TrendingUp, Shield, Zap } from 'lucide-react';

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

const FEATURES = [
  { icon: TrendingUp, label: 'Smart Budget Tracking', desc: 'AI-powered spending analysis', bg: '#a78bfa' },
  { icon: Shield, label: 'Bank-grade Security', desc: '256-bit encryption on all data', bg: '#34d399' },
  { icon: Zap, label: 'Real-time Insights', desc: 'Instant financial recommendations', bg: '#60a5fa' },
];

export default function LoginPage() {
  const nav = useNavigate();
  const { loginWithPassword, loginWithGoogle, isAuthenticated, data, databaseStatus } = useFinance();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const hasGoogleClientId = Boolean(
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'FINSIGHT_PLACEHOLDER_CLIENT_ID'
  );

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      nav(data.isAdmin ? '/admin' : '/dashboard');
    }
  }, [isAuthenticated, data.isAdmin, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await loginWithPassword(email, password);
    setLoading(false);

    if (result.success) {
      if (email.trim().toLowerCase() === 'admin@finsight.com') {
        nav('/admin');
      } else {
        nav('/dashboard');
      }
    } else {
      setError(result.error || 'Login failed.');
    }
  };

  const handleGoogleSuccess = async (response: any) => {
    if (response.credential) {
      setError('');
      setInfoMsg('');
      setLoading(true);
      const result = await loginWithGoogle(response.credential);
      setLoading(false);

      if (result.success) {
        nav('/dashboard');
      } else {
        setError(result.error || 'Google sign-in failed.');
      }
    }
  };

  const handleCustomPopupLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError('');
      setInfoMsg('');
      setLoading(true);
      const result = await loginWithGoogle({ accessToken: tokenResponse.access_token });
      setLoading(false);
      if (result.success) {
        nav('/dashboard');
      } else {
        setError(result.error || 'Google sign-in failed.');
      }
    },
    onError: (err) => {
      console.warn('[Google Sign-In Popup Error]', err);
      setError('Google sign-in popup was cancelled or failed.');
    },
  });

  const handleCustomGoogleClick = () => {
    setInfoMsg(
      'Google OAuth is integrated! To enable live one-click popup, add your Google Cloud Client ID to .env as VITE_GOOGLE_CLIENT_ID.'
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="panel" style={{ display: 'flex', width: '100%', maxWidth: 1080, minHeight: 600, overflow: 'hidden', padding: 0, zIndex: 1, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {/* Left — Brand */}
        <motion.div
          style={{ flex: 1.2, padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <img src="/ft.jpeg" alt="FinSight" className="app-logo auth-blend" style={{ width: 46, height: 46 }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>FinSight</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Smart AI Finance</div>
            </div>
          </div>

          <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
            Take control of<br />
            <span style={{ background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>your financial future</span>
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 40, maxWidth: 440 }}>
            Track spending, set budgets, and get AI-powered insights — all in one beautiful dashboard.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${f.bg}20`, color: f.bg, flexShrink: 0 }}>
                  <f.icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right — Login form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 48px', background: 'var(--bg2)' }}>
          <motion.div
            style={{ width: '100%', maxWidth: 360 }}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Welcome back</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Log in to your account</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>Enter your credentials to access your dashboard</p>

            {/* Google Authentication — Single Button */}
            <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44 }}>
              {hasGoogleClientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed.')}
                  theme="filled_black"
                  shape="pill"
                  text="continue_with"
                  width="340"
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
                  <span>Continue with Google</span>
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

            <form onSubmit={submit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && (
                <div style={{ padding: '12px 14px', background: 'rgba(248,113,113,0.12)', color: '#f87171', borderRadius: 8, fontSize: 13, fontWeight: 500, border: '1px solid rgba(248,113,113,0.25)', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              <div>
                <label className="label">Email address</label>
                <input type="email" autoComplete="new-password" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="input" />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="label" style={{ marginBottom: 0 }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 500 }}>Forgot?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required className="input" style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Logging in...' : 'Continue'}
              </button>

              <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginTop: 8 }}>
                Don't have an account? <Link to="/signup" style={{ fontWeight: 600 }}>Sign up free</Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
