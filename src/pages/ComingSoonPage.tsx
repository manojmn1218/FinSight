import React from 'react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function ComingSoonPage() {
  const nav = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(167,139,250,0.15)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Sparkles size={40} />
        </div>
      </motion.div>
      <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Coming Soon!</h1>
      <p style={{ fontSize: 18, color: 'var(--text2)', maxWidth: 500, marginBottom: 40, lineHeight: 1.6 }}>
        We are working hard to build these advanced premium features. Check back later for our official launch.
      </p>
      <button onClick={() => nav(-1)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );
}
