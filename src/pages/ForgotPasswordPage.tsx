import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const submit = (e: React.FormEvent) => { e.preventDefault(); alert('Demo — no real email sent.'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 600, height: 600, background: '#f472b6', filter: 'blur(200px)', opacity: 0.08, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderRadius: '50%' }} />

      <motion.div
        style={{ width: 400, padding: '40px 36px', background: 'var(--surface)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 28, boxShadow: '0 8px 40px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1 }}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Reset Password</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>Enter your email and we'll send you instructions to reset your password.</p>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Email address</label>
            <input type="email" placeholder="you@example.com" required style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <button type="submit" style={{ width: '100%', padding: '14px 0', borderRadius: 999, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 20, boxShadow: '0 4px 20px rgba(167,139,250,0.3)', fontFamily: 'inherit' }}>
            Send reset link
          </button>
          <p style={{ textAlign: 'center', fontSize: 13 }}>Back to <Link to="/login" style={{ fontWeight: 600 }}>Login</Link></p>
        </form>
      </motion.div>
    </div>
  );
}
