import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { Eye, EyeOff, TrendingUp, Shield, Zap, Activity } from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, label: 'Smart Budget Tracking', desc: 'AI-powered spending analysis', bg: '#a78bfa' },
  { icon: Shield, label: 'Bank-grade Security', desc: '256-bit encryption on all data', bg: '#34d399' },
  { icon: Zap, label: 'Real-time Insights', desc: 'Instant financial recommendations', bg: '#60a5fa' },
];

export default function LoginPage() {
  const nav = useNavigate();
  const { data, setData } = useFinance();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@finsight.com' && password === 'admin123') {
      setData({ isAdmin: true });
      nav('/admin');
    } else if (email && password.length >= 6) {
      setData({ isAdmin: false, userEmail: email });
      nav(data.isOnboarded ? '/dashboard' : '/onboarding');
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', width: 600, height: 600, background: '#a78bfa', filter: 'blur(180px)', opacity: 0.12, top: '0%', left: '10%', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, background: '#f472b6', filter: 'blur(180px)', opacity: 0.1, bottom: '0%', right: '10%', borderRadius: '50%' }} />

      <div style={{ display: 'flex', width: '100%', maxWidth: 1080, minHeight: 600, background: 'var(--surface)', backdropFilter: 'blur(30px)', border: '1px solid var(--border)', borderRadius: 32, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.15)', position: 'relative', zIndex: 1 }}>
        {/* Left — Brand */}
        <motion.div
          style={{ flex: 1.2, padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)' }}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
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
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>Welcome back</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Log in to your account</h2>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>Enter your credentials to access your dashboard</p>

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {error && <div style={{ padding: 12, background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>{error}</div>}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>Password</label>
                  <Link to="/forgot-password" style={{ fontSize: 13, fontWeight: 500 }}>Forgot?</Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required style={{ width: '100%', padding: '13px 16px', paddingRight: 44, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" style={{ width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4, boxShadow: '0 4px 20px rgba(167,139,250,0.3)', fontFamily: 'inherit' }}>
                Continue
              </button>

              <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
                Don't have an account? <Link to="/signup" style={{ fontWeight: 600 }}>Sign up free</Link>
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
