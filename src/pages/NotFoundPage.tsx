import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft, Home, HelpCircle } from 'lucide-react';
import FinSightLogo from '../components/FinSightLogo';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient glow */}
      <div className="blob blob-1" style={{ top: '15%', left: '20%', width: 450, height: 450, opacity: 0.12 }} />
      <div className="blob blob-2" style={{ bottom: '15%', right: '20%', width: 400, height: 400, opacity: 0.12 }} />

      <motion.div
        className="panel panel-glow"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{
          maxWidth: 520,
          width: '100%',
          padding: '48px 36px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 28 }}>
          <FinSightLogo size={40} className="app-logo" />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: 'var(--text)' }}>FinSight</span>
        </Link>

        <div style={{
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: -2,
          background: 'var(--grad)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
          marginBottom: 12,
        }}>
          404
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Page Not Found</h1>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 32 }}>
          The link you followed may be broken, or the page may have been moved. Everything else in your financial dashboard is safe and sound.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            <Home size={16} /> Return to Dashboard
          </Link>
          <Link to="/support" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            <HelpCircle size={16} /> Support Center
          </Link>
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)' }}>
          <Link to="/legal" style={{ color: 'var(--text3)', textDecoration: 'underline', marginRight: 12 }}>Legal Hub</Link>
          •
          <Link to="/legal#privacy" style={{ color: 'var(--text3)', textDecoration: 'underline', margin: '0 12px' }}>Privacy</Link>
          •
          <Link to="/legal#dmca" style={{ color: 'var(--text3)', textDecoration: 'underline', marginLeft: 12 }}>DMCA</Link>
        </div>
      </motion.div>

      <footer style={{ marginTop: 32, fontSize: 12, color: 'var(--text3)', zIndex: 1 }}>
        &copy; {new Date().getFullYear()} FinSight Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
}

