import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

export default function InsightsPage() {
  const { data, totalExpenses, budget } = useFinance();
  const usedPct = data.monthlyIncome > 0 ? Math.round((totalExpenses / data.monthlyIncome) * 100) : 0;

  const insights = [
    { icon: TrendingUp, title: 'Spending Analysis', desc: usedPct > 0 ? `You're using ${usedPct}% of your income on expenses. ${usedPct > 70 ? 'Consider reducing non-essential categories.' : 'Great balance — you have room for savings!'}` : 'Complete your onboarding to get personalized spending analysis.', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    { icon: AlertCircle, title: 'Budget Alert', desc: budget >= 0 ? `Your remaining monthly budget is ₹${budget.toLocaleString('en-IN')}. You're within safe limits.` : `Warning: Your expenses exceed your budget by ₹${Math.abs(budget).toLocaleString('en-IN')}. Consider cutting back.`, color: budget >= 0 ? '#f0b429' : '#f87171', bg: budget >= 0 ? 'rgba(240,180,41,0.08)' : 'rgba(248,113,113,0.08)' },
    { icon: Lightbulb, title: 'Savings Tip', desc: data.totalBalance > 0 ? `You have ₹${data.totalBalance.toLocaleString('en-IN')} in savings. Consider investing a portion in a high-yield savings account or mutual fund for better returns.` : 'Start building your emergency fund — aim for at least 3 months of expenses.', color: '#818cf8', bg: 'rgba(129,140,248,0.08)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>AI Insights</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Personalized financial advice based on your data.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <motion.div
              key={ins.title}
              className="panel panel-glow"
              style={{ padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'flex-start', borderLeft: `3px solid ${ins.color}`, cursor: 'default' }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            >
              <div style={{ padding: 10, background: ins.bg, borderRadius: 12, color: ins.color, flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{ins.title}</h3>
                <p style={{ color: 'var(--text2)', lineHeight: 1.65, fontSize: 14 }}>{ins.desc}</p>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 4 }} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
