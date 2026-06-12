import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';

export default function InsightsPage() {
  const { data, totalExpenses, budget } = useFinance();
  const usedPct = data.monthlyIncome > 0 ? Math.round((totalExpenses / data.monthlyIncome) * 100) : 0;

  const panel: React.CSSProperties = { padding: 24, background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.25)', display: 'flex', gap: 20, alignItems: 'flex-start' };

  const insights = [
    { icon: TrendingUp, title: 'Spending Analysis', desc: usedPct > 0 ? `You're using ${usedPct}% of your income on expenses. ${usedPct > 70 ? 'Consider reducing non-essential categories.' : 'Great balance — you have room for savings!'}` : 'Complete your onboarding to get personalized spending analysis.', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { icon: AlertCircle, title: 'Budget Alert', desc: budget >= 0 ? `Your remaining monthly budget is ₹${budget.toLocaleString('en-IN')}. You're within safe limits.` : `Warning: Your expenses exceed your budget by ₹${Math.abs(budget).toLocaleString('en-IN')}. Consider cutting back.`, color: budget >= 0 ? '#fbbf24' : '#f87171', bg: budget >= 0 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)' },
    { icon: Lightbulb, title: 'Savings Tip', desc: data.totalBalance > 0 ? `You have ₹${data.totalBalance.toLocaleString('en-IN')} in savings. Consider investing a portion in a high-yield savings account or mutual fund for better returns.` : 'Start building your emergency fund — aim for at least 3 months of expenses.', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>AI Insights</h1>
        <p style={{ color: 'var(--text2)' }}>Personalized financial advice based on your data.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <motion.div key={ins.title} style={panel} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <div style={{ padding: 12, background: ins.bg, borderRadius: 12, color: ins.color, flexShrink: 0 }}><Icon size={24} /></div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{ins.title}</h3>
                <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{ins.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
