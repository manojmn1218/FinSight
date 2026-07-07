import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Trash2, X, Calendar, DollarSign, Lock } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { FinancialGoal } from '../utils/types';
import { Link } from 'react-router-dom';

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#f0b429', '#60a5fa', '#c084fc', '#fb7185', '#38bdf8'];

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function GoalsPage() {
  const { data, addGoal, updateGoal, deleteGoal } = useFinance();
  const goals = data.financialGoals || [];

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const createGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !target || !deadline) return;
    const goal: FinancialGoal = {
      id: 'goal_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      targetAmount: Number(target),
      currentAmount: 0,
      deadline,
      color: COLORS[goals.length % COLORS.length],
      createdAt: new Date().toISOString(),
    };
    addGoal(goal);
    setShowModal(false);
    setName(''); setTarget(''); setDeadline('');
  };

  const contribute = (id: string) => {
    const amt = Number(addAmount);
    if (!amt || amt <= 0) return;
    const goal = goals.find(g => g.id === id);
    if (goal) {
      updateGoal(id, { currentAmount: goal.currentAmount + amt });
    }
    setAddingTo(null);
    setAddAmount('');
  };

  const an = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Financial Goals</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Set targets and track your progress toward financial milestones.</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }} onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Goal
        </button>
      </div>

      {/* Goals grid */}
      {goals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {goals.map((g, i) => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
            const monthlyNeeded = remaining > 0 ? Math.round(remaining / monthsLeft) : 0;

            return (
              <motion.div key={g.id} className="panel" style={{ padding: 24, position: 'relative', overflow: 'visible' }} {...an(i)}>
                {/* Delete button */}
                <button className="btn-ghost" style={{ position: 'absolute', top: 16, right: 16, padding: 6, color: 'var(--text3)' }}
                  onClick={() => deleteGoal(g.id)}>
                  <Trash2 size={14} />
                </button>

                {/* Icon + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={22} color={g.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{g.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text3)' }}>{daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline passed'}</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="goal-progress-bar" style={{ marginBottom: 12 }}>
                  <div className="goal-progress-fill" style={{ width: `${pct}%`, background: g.color }} />
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
                  <span>{fmt(g.currentAmount)} <span style={{ color: 'var(--text3)' }}>of {fmt(g.targetAmount)}</span></span>
                  <span style={{ fontWeight: 700, color: pct >= 100 ? 'var(--green)' : g.color }}>{pct}%</span>
                </div>

                {/* Monthly needed */}
                {pct < 100 && monthlyNeeded > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, padding: '8px 12px', background: 'var(--bg2)', borderRadius: 8 }}>
                    Save <strong style={{ color: 'var(--text)' }}>{fmt(monthlyNeeded)}/month</strong> to reach your goal on time.
                  </div>
                )}

                {pct >= 100 ? (
                  <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', color: 'var(--green)', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>
                    🎉 Goal Achieved!
                  </div>
                ) : (
                  <>
                    {addingTo === g.id ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="number" placeholder="Amount" value={addAmount} onChange={e => setAddAmount(e.target.value)}
                          className="input" style={{ flex: 1, padding: '8px 12px', fontSize: 13 }} autoFocus />
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => contribute(g.id)}>Add</button>
                        <button className="btn-ghost" style={{ padding: '8px' }} onClick={() => { setAddingTo(null); setAddAmount(''); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button className="btn-outline" style={{ width: '100%', fontSize: 13, padding: '10px 0' }} onClick={() => setAddingTo(g.id)}>
                        <DollarSign size={14} /> Log Contribution
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="panel" style={{ padding: '56px 32px', textAlign: 'center' }}>
          <Target size={44} color="var(--text3)" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No financial goals yet</p>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>Create your first goal to start tracking progress toward your financial milestones.</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Create Goal</button>
        </div>
      )}

      {/* Create goal modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div className="panel" style={{ padding: 32, width: 420, position: 'relative' }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <button className="btn-ghost" style={{ position: 'absolute', top: 16, right: 16, padding: 8 }} onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
              {data.currentPlan === 'Basic' && goals.length >= 3 ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <Lock size={36} color="var(--purple)" style={{ margin: '0 auto 16px' }} />
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Goal Limit Reached</h2>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.5 }}>
                    Free accounts are limited to tracking up to 3 financial goals simultaneously. Upgrade to Pro for unlimited goals, daily contribution logging, and budget health calculators.
                  </p>
                  <Link to="/premium" className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    Upgrade to Pro ⚡
                  </Link>
                </div>
              ) : (
                <>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Create Financial Goal</h2>
                  <form onSubmit={createGoal} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label className="label">Goal Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Emergency Fund" className="input" required />
                    </div>
                    <div>
                      <label className="label">Target Amount (₹)</label>
                      <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="100000" className="input" required min="1" />
                    </div>
                    <div>
                      <label className="label">Target Date</label>
                      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input" required />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
                      <Target size={16} /> Create Goal
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
