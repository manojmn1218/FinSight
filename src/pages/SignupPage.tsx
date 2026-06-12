import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Activity } from 'lucide-react';

export default function SignupPage() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);

  const submit = (e: React.FormEvent) => { e.preventDefault(); nav('/onboarding'); };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 500, height: 500, background: '#a78bfa', filter: 'blur(180px)', opacity: 0.1, top: -100, left: -80, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, background: '#f472b6', filter: 'blur(180px)', opacity: 0.08, bottom: -80, right: -60, borderRadius: '50%' }} />

      <motion.div
        style={{ width: 420, padding: '40px 36px', background: 'var(--surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <img src="/ft.jpeg" alt="FinSight" className="app-logo auth-blend" style={{ width: 48, height: 48 }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10, textAlign: 'center' }}>Get started free</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>Create your account</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28, textAlign: 'center' }}>Join thousands managing their finances smarter.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Full name</label>
            <input type="text" placeholder="Your name" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Email address</label>
            <input type="email" placeholder="you@example.com" required style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} placeholder="Min. 8 characters" required minLength={8} style={{ ...inputStyle, paddingRight: 44 }} />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" style={{ width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 4, boxShadow: '0 4px 20px rgba(167,139,250,0.3)', fontFamily: 'inherit' }}>
            Create account
          </button>
          <p style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Log in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
