import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  { name: 'Basic', price: 'Free', desc: 'Perfect for getting started.', features: ['Basic budgeting', 'Manual entry', 'Standard reports'], popular: false, btn: 'Current Plan', outline: true },
  { name: 'Pro', price: '₹349/mo', desc: 'AI insights and automated tracking.', features: ['Automated bank sync', 'AI-powered insights', 'Custom categories', 'Export CSV/PDF'], popular: true, btn: 'Upgrade to Pro', outline: false },
  { name: 'Wealth', price: '₹899/mo', desc: 'For serious investors and growing enterprises.', features: ['Everything in Pro', 'Investment tracking', 'Crypto integration', '1-on-1 advisor/mo'], popular: false, btn: 'Get Wealth', outline: true },
];

export default function PremiumPage() {
  const nav = useNavigate();
  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 40 }}>
      <div style={{ textAlign: 'center', marginBottom: 48, maxWidth: 560 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>Upgrade to Premium</h1>
        <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.6 }}>Unlock the full power of FinSight AI — deeper insights, automated tracking, and total control.</p>
      </div>

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        {PLANS.map((p, i) => (
          <motion.div
            key={p.name}
            className={`panel ${p.popular ? 'gradient-border' : ''}`}
            style={{
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              width: 320,
              position: 'relative',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {p.popular && (
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--grad)', padding: '4px 16px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>
                MOST POPULAR
              </div>
            )}
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{p.name}</h3>
            <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, letterSpacing: -1 }}>{p.price}</div>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28, minHeight: 44, lineHeight: 1.5 }}>{p.desc}</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {p.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                  <Check size={18} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--text)' }}>{f}</span>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={() => p.name !== 'Basic' && nav('/coming-soon')}
              className={p.outline ? 'btn-outline' : 'btn-primary'}
              style={{ width: '100%', cursor: p.name === 'Basic' ? 'default' : 'pointer', opacity: p.name === 'Basic' ? 0.7 : 1 }}
              disabled={p.name === 'Basic'}
            >
              {p.btn}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
