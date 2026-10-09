import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, ArrowRight, ShoppingBag, RefreshCw, PiggyBank, CalendarDays, Flame, Target, CreditCard, Wallet, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_CONFIG } from '../utils/types';
import { Link } from 'react-router-dom';

const fmt = (n: number) => '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });

export default function InsightsPage() {
  const { data, totalExpenses, budget } = useFinance();
  const usedPct = data.monthlyIncome > 0 ? Math.round((totalExpenses / data.monthlyIncome) * 100) : 0;
  const txns = useMemo(() => data.transactions || [], [data.transactions]);
  const hasTxns = txns.length > 0;

  // --- Build rich, transaction-based insights ---
  const insights = useMemo(() => {
    const results: { icon: React.ElementType; title: string; desc: string; color: string; bg: string; link?: string }[] = [];

    if (!hasTxns) {
      // Onboarding-only insights
      results.push({
        icon: TrendingUp,
        title: 'Spending Analysis',
        desc: usedPct > 0
          ? `You're using ${usedPct}% of your income on expenses. ${usedPct > 70 ? 'Consider reducing non-essential categories.' : 'Great balance — you have room for savings!'}`
          : 'Complete your onboarding to get personalized spending analysis.',
        color: '#34d399', bg: 'rgba(52,211,153,0.08)',
      });
      results.push({
        icon: AlertCircle,
        title: 'Budget Alert',
        desc: budget >= 0
          ? `Your remaining monthly budget is ${fmt(budget)}. You're within safe limits.`
          : `Warning: Your expenses exceed your budget by ${fmt(Math.abs(budget))}. Consider cutting back.`,
        color: budget >= 0 ? '#f0b429' : '#f87171',
        bg: budget >= 0 ? 'rgba(240,180,41,0.08)' : 'rgba(248,113,113,0.08)',
      });
      results.push({
        icon: Lightbulb,
        title: 'Savings Tip',
        desc: data.totalBalance > 0
          ? `You have ${fmt(data.totalBalance)} in savings. Consider investing a portion in a high-yield savings account or mutual fund for better returns.`
          : 'Start building your emergency fund — aim for at least 3 months of expenses.',
        color: '#818cf8', bg: 'rgba(129,140,248,0.08)',
      });
      return results;
    }

    // --- Transaction-powered insights ---
    const income = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expenses;
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

    // Category breakdown
    const catMap: Record<string, number> = {};
    txns.filter(t => t.amount < 0).forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount); });
    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

    // Monthly breakdown
    const monthMap: Record<string, { income: number; expense: number }> = {};
    txns.forEach(t => {
      const m = t.date.slice(0, 7);
      if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 };
      if (t.amount >= 0) monthMap[m].income += t.amount;
      else monthMap[m].expense += Math.abs(t.amount);
    });
    const months = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
    const avgMonthlyExpense = months.length > 0 ? Math.round(months.reduce((s, [, d]) => s + d.expense, 0) / months.length) : 0;

    // 1. Overview
    results.push({
      icon: Wallet,
      title: 'Financial Overview',
      desc: `From ${txns.length} transactions: Total income ${fmt(income)}, total expenses ${fmt(expenses)}, net ${net >= 0 ? 'surplus' : 'deficit'} of ${fmt(net)}. ${months.length > 1 ? `Avg monthly spend: ${fmt(avgMonthlyExpense)}.` : ''}`,
      color: '#818cf8', bg: 'rgba(129,140,248,0.08)',
      link: '/reports',
    });

    // 2. Top spending category
    if (sortedCats.length > 0) {
      const [topCat, topAmt] = sortedCats[0];
      const topPct = expenses > 0 ? Math.round((topAmt / expenses) * 100) : 0;
      const cfg = CATEGORY_CONFIG[topCat as keyof typeof CATEGORY_CONFIG];
      results.push({
        icon: ShoppingBag,
        title: `Top Spend: ${topCat} (${topPct}%)`,
        desc: `${fmt(topAmt)} spent on ${topCat}, making up ${topPct}% of all expenses.${sortedCats.length > 1 ? ` Runner-up: ${sortedCats[1][0]} at ${fmt(sortedCats[1][1])}.` : ''} ${topPct > 40 ? 'This is a high concentration — consider diversifying or reducing.' : ''}`,
        color: cfg?.color || '#818cf8',
        bg: cfg?.bg || 'rgba(129,140,248,0.08)',
        link: '/analytics',
      });
    }

    // 3. Savings rate
    results.push({
      icon: PiggyBank,
      title: savingsRate >= 20 ? `💪 Strong Savings: ${savingsRate}%` : `⚠️ Low Savings: ${savingsRate}%`,
      desc: savingsRate >= 30
        ? `Excellent! You're saving ${savingsRate}% of your income (${fmt(net)}). You're well above the 20% recommended rate. Consider investing the surplus in mutual funds or FDs.`
        : savingsRate >= 20
          ? `Healthy savings rate at ${savingsRate}%. You're meeting the recommended 20% target. Keep it steady!`
          : savingsRate >= 0
            ? `Your savings rate is ${savingsRate}%, below the recommended 20%. You need to save ${fmt(income * 0.2 - net)} more per period to hit the target. Review your top categories for cuts.`
            : `You're spending more than you earn by ${fmt(Math.abs(net))}. This is unsustainable — immediately review and reduce non-essential spending.`,
      color: savingsRate >= 20 ? '#34d399' : savingsRate >= 0 ? '#f0b429' : '#f87171',
      bg: savingsRate >= 20 ? 'rgba(52,211,153,0.08)' : savingsRate >= 0 ? 'rgba(240,180,41,0.08)' : 'rgba(248,113,113,0.08)',
    });

    // 4. Spending trend (if multiple months)
    if (months.length >= 2) {
      const lastMonth = months[months.length - 1];
      const prevMonth = months[months.length - 2];
      const change = lastMonth[1].expense - prevMonth[1].expense;
      const changePct = prevMonth[1].expense > 0 ? Math.round((change / prevMonth[1].expense) * 100) : 0;
      const lastLabel = new Date(lastMonth[0] + '-01').toLocaleDateString('en-US', { month: 'long' });
      const prevLabel = new Date(prevMonth[0] + '-01').toLocaleDateString('en-US', { month: 'long' });

      results.push({
        icon: change > 0 ? TrendingUp : TrendingDown,
        title: change > 0 ? `Spending Up ${Math.abs(changePct)}%` : `Spending Down ${Math.abs(changePct)}%`,
        desc: change > 0
          ? `Your spending increased from ${fmt(prevMonth[1].expense)} in ${prevLabel} to ${fmt(lastMonth[1].expense)} in ${lastLabel} (+${Math.abs(changePct)}%). Review what changed.`
          : `Great news! Spending dropped from ${fmt(prevMonth[1].expense)} in ${prevLabel} to ${fmt(lastMonth[1].expense)} in ${lastLabel} (−${Math.abs(changePct)}%). Keep it up!`,
        color: change > 0 ? '#f87171' : '#34d399',
        bg: change > 0 ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
        link: '/reports',
      });
    }

    // 5. Largest single transaction
    const largestExpense = txns.filter(t => t.amount < 0).sort((a, b) => a.amount - b.amount)[0];
    if (largestExpense) {
      results.push({
        icon: CreditCard,
        title: 'Biggest Single Expense',
        desc: `Your largest transaction was ${fmt(Math.abs(largestExpense.amount))} on "${largestExpense.description.slice(0, 50)}" (${new Date(largestExpense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}). ${Math.abs(largestExpense.amount) > avgMonthlyExpense * 0.3 ? 'This is a significant chunk of your monthly spend.' : ''}`,
        color: '#f472b6',
        bg: 'rgba(244,114,182,0.08)',
        link: '/transactions',
      });
    }

    // 6. Recurring payments
    const recurringTxns = txns.filter(t => t.isRecurring);
    const recurringTotal = recurringTxns.reduce((s, t) => s + Math.abs(t.amount), 0);
    if (recurringTxns.length > 0) {
      results.push({
        icon: RefreshCw,
        title: `${recurringTxns.length} Recurring Payments (${fmt(recurringTotal)})`,
        desc: `We detected ${recurringTxns.length} recurring transactions totaling ${fmt(recurringTotal)}. Review them to identify unused subscriptions or services you can downgrade.`,
        color: '#f0b429',
        bg: 'rgba(240,180,41,0.08)',
        link: '/analytics',
      });
    }

    // 7. Emergency fund check
    if (data.totalBalance > 0) {
      const monthsCovered = avgMonthlyExpense > 0 ? Math.round(data.totalBalance / avgMonthlyExpense) : 0;
      results.push({
        icon: Target,
        title: monthsCovered >= 6 ? '✅ Emergency Fund: Healthy' : monthsCovered >= 3 ? '🟡 Emergency Fund: Adequate' : '🔴 Emergency Fund: Low',
        desc: monthsCovered > 0
          ? `Your balance of ${fmt(data.totalBalance)} covers ~${monthsCovered} month(s) of expenses at your avg spend of ${fmt(avgMonthlyExpense)}/mo. ${monthsCovered < 3 ? 'Aim for at least 3-6 months of coverage.' : monthsCovered < 6 ? 'You\'re close to the 6-month target — keep going!' : 'Excellent cushion! Consider investing the surplus.'}`
          : `Build an emergency fund of at least ${fmt(avgMonthlyExpense * 3)} (3 months of expenses).`,
        color: monthsCovered >= 6 ? '#34d399' : monthsCovered >= 3 ? '#f0b429' : '#f87171',
        bg: monthsCovered >= 6 ? 'rgba(52,211,153,0.08)' : monthsCovered >= 3 ? 'rgba(240,180,41,0.08)' : 'rgba(248,113,113,0.08)',
      });
    }

    // 8. Spending days analysis
    const dayMap: Record<string, number> = {};
    txns.filter(t => t.amount < 0).forEach(t => {
      const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayMap[day] = (dayMap[day] || 0) + Math.abs(t.amount);
    });
    const topDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    if (topDay) {
      results.push({
        icon: CalendarDays,
        title: `You Spend Most on ${topDay[0]}s`,
        desc: `${topDay[0]} is your highest spending day with ${fmt(topDay[1])} total. Being mindful of ${topDay[0]} spending habits could help reduce unnecessary purchases.`,
        color: '#60a5fa',
        bg: 'rgba(96,165,250,0.08)',
      });
    }

    // 9. Category diversity
    if (sortedCats.length >= 3) {
      const top3Pct = expenses > 0 ? Math.round(((sortedCats[0][1] + sortedCats[1][1] + sortedCats[2][1]) / expenses) * 100) : 0;
      if (top3Pct > 80) {
        results.push({
          icon: Flame,
          title: `Top 3 Categories = ${top3Pct}% of Spend`,
          desc: `${sortedCats[0][0]}, ${sortedCats[1][0]}, and ${sortedCats[2][0]} account for ${top3Pct}% of all spending. Focus your budget optimization efforts on these three areas for maximum impact.`,
          color: '#fb923c',
          bg: 'rgba(251,146,60,0.08)',
          link: '/analytics',
        });
      }
    }

    return results;
  }, [hasTxns, txns, usedPct, budget, data.totalBalance]);

  if (data.currentPlan === 'Basic') {
    return (
      <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh', textAlign: 'center', padding: 20 }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.4 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(167,139,250,0.15)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Lock size={40} />
          </div>
        </motion.div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Unlock AI-Powered Insights</h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 440, marginBottom: 32, lineHeight: 1.6 }}>
          AI Insights analyzes your actual statement details to spot transaction anomalies, detect hidden subscription creep, optimize savings targets, and predict cash flow trends.
        </p>
        <Link to="/premium" className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
          Upgrade to Pro ⚡
        </Link>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40, fontSize: 12, color: 'var(--text3)' }}>
          <span>📈 Saving predictions</span>
          <span>🚨 Creep alerts</span>
          <span>📊 Tax optimization</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>AI Insights</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          {hasTxns
            ? `${insights.length} personalized insights from ${txns.length} analyzed transactions.`
            : 'Personalized financial advice based on your data.'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          const content = (
            <motion.div
              key={ins.title}
              className="panel panel-glow"
              style={{ padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'flex-start', borderLeft: `3px solid ${ins.color}`, cursor: ins.link ? 'pointer' : 'default', textDecoration: 'none', color: 'inherit' }}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }}
            >
              <div style={{ padding: 10, background: ins.bg, borderRadius: 12, color: ins.color, flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{ins.title}</h3>
                <p style={{ color: 'var(--text2)', lineHeight: 1.65, fontSize: 13 }}>{ins.desc}</p>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text3)', flexShrink: 0, marginTop: 4 }} />
            </motion.div>
          );

          return ins.link
            ? <Link key={ins.title} to={ins.link} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>
            : content;
        })}
      </div>
    </div>
  );
}
