import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  { name: 'Basic', price: 'Free', desc: 'Perfect for getting started.', features: ['Basic budgeting', 'Manual entry', 'Standard reports'], popular: false, btn: 'Current Plan', outline: true },
  { name: 'Pro', price: '₹349/mo', desc: 'AI insights and automated tracking.', features: ['Automated bank sync', 'AI-powered insights', 'Custom categories', 'Export CSV/PDF'], popular: true, btn: 'Upgrade to Pro', outline: false },
  { name: 'Wealth', price: '₹899/mo', desc: 'For serious investors and growing enterprises.', features: ['Everything in Pro', 'Investment tracking', 'Crypto integration', '1-on-1 advisor/mo'], popular: false, btn: 'Get Wealth', outline: true },
];

const panel: React.CSSProperties = { padding: 32, background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', position: 'relative', width: 300 };

export default function PremiumPage() {
  const nav = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 560 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>Upgrade to Premium</h1>
        <p style={{ color: 'var(--text2)', fontSize: 16, lineHeight: 1.6 }}>Unlock the full power of FinSight AI — deeper insights, automated tracking, and total control.</p>
      </div>

      <div style={{ display: 'flex', gap: 28, justifyContent: 'center' }}>
        {PLANS.map((p, i) => (
          <motion.div key={p.name} style={{ ...panel, border: p.popular ? '2px solid #a78bfa' : '1px solid var(--border)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            {p.popular && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--grad)', padding: '4px 16px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#fff' }}>MOST POPULAR</div>}
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{p.name}</h3>
            <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>{p.price}</div>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28, minHeight: 40 }}>{p.desc}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, marginBottom: 28 }}>
              {p.features.map(f => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, fontSize: 14 }}><Check size={16} color="#34d399" />{f}</li>)}
            </ul>
            <button 
              onClick={() => p.name !== 'Basic' && nav('/coming-soon')}
              style={{ padding: '12px 0', borderRadius: 999, fontWeight: 600, cursor: p.name === 'Basic' ? 'default' : 'pointer', fontSize: 14, fontFamily: 'inherit', color: p.outline ? 'var(--text)' : '#fff', background: p.outline ? 'transparent' : 'var(--grad)', border: p.outline ? '2px solid var(--border)' : 'none' }}>
              {p.btn}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
