import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FinancialCore3D from '../components/3d/FinancialCore3D';

export default function ComingSoonPage() {
  const nav = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', padding: 24 }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} style={{ width: 220, height: 220, marginBottom: 12 }}>
        <FinancialCore3D healthScore={85} savingsRate={35} />
      </motion.div>
      <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -0.6 }}>Coming Soon</h1>
      <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 460, marginBottom: 32, lineHeight: 1.6 }}>
        These premium features are in active development. Check back for upcoming releases.
      </p>
      <button onClick={() => nav(-1)} className="btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );
}
