import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, X as XIcon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export default function SignupPage() {
  const nav = useNavigate();
  const { registerUser, loginAs } = useFinance();
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const passwordChecks = useMemo(() => [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One number', pass: /[0-9]/.test(password) },
    { label: 'One special character', pass: /[^A-Za-z0-9]/.test(password) },
  ], [password]);

  const allPass = passwordChecks.every(c => c.pass);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    const result = registerUser(email, password, name);
    if (result.success) {
      loginAs(email.trim().toLowerCase());
      nav('/onboarding');
    } else {
      setError(result.error || 'Registration failed.');
    }
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

        {error && <div style={{ padding: 12, background: 'rgba(248,113,113,0.1)', color: '#f87171', borderRadius: 8, fontSize: 13, fontWeight: 500, marginBottom: 16 }}>{error}</div>}

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
          <button type="submit" disabled={!allPass} className="btn-primary" style={{ width: '100%', marginTop: 8, opacity: allPass ? 1 : 0.5, cursor: allPass ? 'pointer' : 'not-allowed' }}>
            Create account
          </button>
          <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center', marginTop: 8 }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
