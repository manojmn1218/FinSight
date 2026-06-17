import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const submit = (e: React.FormEvent) => { e.preventDefault(); alert('Demo — no real email sent.'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div className="blob blob-1" style={{ width: 600, height: 600, left: '50%', top: '50%', transform: 'translate(-50%,-50%)', animationDelay: '-6s' }} />

      <motion.div
        className="panel"
        style={{ width: 400, padding: '40px 36px', zIndex: 1 }}
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Reset Password</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>Enter your email and we'll send you instructions to reset your password.</p>

        <form onSubmit={submit}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Email address</label>
            <input type="email" placeholder="you@example.com" required className="input" />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginBottom: 20 }}>
            Send reset link
          </button>
          <p style={{ textAlign: 'center', fontSize: 13 }}>Back to <Link to="/login" style={{ fontWeight: 600 }}>Login</Link></p>
        </form>
      </motion.div>
    </div>
  );
}
