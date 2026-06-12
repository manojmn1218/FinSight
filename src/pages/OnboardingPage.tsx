import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { User, DollarSign, CreditCard, Target, ArrowRight, ArrowLeft, Check, Sparkles, Activity } from 'lucide-react';

const STEPS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'income', label: 'Income', icon: DollarSign },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
  { id: 'savings', label: 'Savings', icon: Target },
];

const DEFAULT_EXP = [
  { name: 'Rent', amount: 0, color: '#a78bfa' },
  { name: 'Food', amount: 0, color: '#f472b6' },
  { name: 'Transport', amount: 0, color: '#60a5fa' },
  { name: 'Utilities', amount: 0, color: '#34d399' },
  { name: 'Entertainment', amount: 0, color: '#fbbf24' },
  { name: 'Other', amount: 0, color: '#94a3b8' },
];

const SAVE_OPTS = [10, 15, 20, 25, 30];

const card: React.CSSProperties = { padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' };
const inp: React.CSSProperties = { width: '100%', padding: '13px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
const inpPre: React.CSSProperties = { ...inp, paddingLeft: 30 };
const prefix: React.CSSProperties = { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14, fontWeight: 500, pointerEvents: 'none' };

export default function OnboardingPage() {
  const nav = useNavigate();
  const { setData } = useFinance();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [balance, setBalance] = useState('');
  const [expenses, setExpenses] = useState(DEFAULT_EXP);
  const [saveGoal, setSaveGoal] = useState(20);

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const incNum = Number(income) || 0;
  const savAmt = Math.round((incNum * saveGoal) / 100);
  const remaining = incNum - totalExp - savAmt;

  const updExp = (i: number, v: string) => {
    const copy = [...expenses];
    copy[i] = { ...copy[i], amount: Number(v) || 0 };
    setExpenses(copy);
  };

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return Number(income) > 0;
    return true;
  };

  const finish = () => {
    setData({ userName: name.trim(), monthlyIncome: incNum, totalBalance: Number(balance) || 0, expenses, savingsPercent: saveGoal, isOnboarded: true });
    nav('/dashboard');
  };

  const anim = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.25 } };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Blobs */}
      <div style={{ position: 'absolute', width: 400, height: 400, background: '#a78bfa', filter: 'blur(180px)', opacity: 0.08, top: -60, left: -60, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, background: '#f472b6', filter: 'blur(160px)', opacity: 0.06, bottom: -40, right: -40, borderRadius: '50%' }} />

      {/* Sidebar progress */}
      <div style={{ width: 250, padding: '32px 24px', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <img src="/ft.jpeg" alt="" className="app-logo" style={{ width: 34, height: 34 }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>FinSight</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {STEPS.map((s, i) => {
            const done = i < step; const active = i === step;
            const Icon = done ? Check : s.icon;
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, background: active ? 'rgba(167,139,250,0.08)' : 'transparent' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'rgba(52,211,153,0.15)' : active ? '#a78bfa' : 'rgba(255,255,255,0.05)', color: done ? '#34d399' : active ? '#fff' : '#475569', fontSize: 14, flexShrink: 0 }}>
                  <Icon size={14} />
                </div>
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: done ? '#34d399' : active ? 'var(--text)' : '#475569' }}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '48px 56px', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" {...anim} style={{ textAlign: 'center', width: '100%', maxWidth: 400 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#a78bfa' }}><User size={32} /></div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>What should we call you?</h2>
                <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>This name will appear on your dashboard.</p>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Manoj" autoFocus style={{ ...inp, fontSize: 18, padding: '16px 20px', textAlign: 'center', borderRadius: 14 }} />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" {...anim} style={{ textAlign: 'center', width: '100%', maxWidth: 460 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#34d399' }}><DollarSign size={32} /></div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Your income & balance</h2>
                <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>We'll use this to calculate your monthly budget.</p>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Monthly Income (after tax)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={prefix}>₹</span>
                      <input type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="50000" min="0" required style={inpPre} />
                    </div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Current Savings</label>
                    <div style={{ position: 'relative' }}>
                      <span style={prefix}>₹</span>
                      <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="150000" min="0" style={inpPre} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" {...anim} style={{ textAlign: 'center', width: '100%', maxWidth: 520 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(244,114,182,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#f472b6' }}><CreditCard size={32} /></div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Monthly expenses</h2>
                <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 28 }}>Estimate your spending — you can adjust later.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'left' }}>
                  {expenses.map((ex, i) => (
                    <div key={ex.name} style={{ ...card, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: ex.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{ex.name}</span>
                      <div style={{ position: 'relative', width: 110 }}>
                        <span style={{ ...prefix, left: 8, fontSize: 13 }}>₹</span>
                        <input type="number" value={ex.amount || ''} onChange={e => updExp(i, e.target.value)} placeholder="0" min="0" style={{ ...inp, padding: '10px 10px 10px 24px', fontSize: 13 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '14px 18px', borderRadius: 10, background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.15)', fontSize: 14, fontWeight: 500 }}>
                  <span>Total monthly expenses</span>
                  <span style={{ fontWeight: 700, color: '#f472b6' }}>₹{totalExp.toLocaleString('en-IN')}</span>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" {...anim} style={{ textAlign: 'center', width: '100%', maxWidth: 440 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#60a5fa' }}><Target size={32} /></div>
                <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Savings goal</h2>
                <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 24 }}>What % of income do you want to save each month?</p>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
                  {SAVE_OPTS.map(p => (
                    <button key={p} type="button" onClick={() => setSaveGoal(p)} style={{ padding: '12px 24px', borderRadius: 999, border: `1.5px solid ${saveGoal === p ? '#a78bfa' : 'var(--border)'}`, background: saveGoal === p ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.03)', color: saveGoal === p ? '#a78bfa' : 'var(--text2)', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: saveGoal === p ? '0 0 16px rgba(167,139,250,0.2)' : 'none' }}>
                      {p}%
                    </button>
                  ))}
                </div>

                {/* Summary */}
                <div style={{ textAlign: 'left', padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, marginBottom: 16 }}><Sparkles size={18} color="#fbbf24" /> Budget Summary</h4>
                  {[
                    { label: 'Monthly Income', val: `₹${incNum.toLocaleString('en-IN')}`, color: '#34d399' },
                    { label: 'Total Expenses', val: `− ₹${totalExp.toLocaleString('en-IN')}`, color: '#f472b6' },
                    { label: `Savings (${saveGoal}%)`, val: `− ₹${savAmt.toLocaleString('en-IN')}`, color: '#60a5fa' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: 'var(--text2)' }}>
                      <span>{r.label}</span><span style={{ fontWeight: 600, color: r.color }}>{r.val}</span>
                    </div>
                  ))}
                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: 16, fontWeight: 700 }}>
                    <span>Remaining Budget</span>
                    <span style={{ color: remaining >= 0 ? '#34d399' : '#f87171' }}>₹{remaining.toLocaleString('en-IN')}</span>
                  </div>
                  {remaining < 0 && <p style={{ fontSize: 13, color: '#fbbf24', marginTop: 12 }}>⚠️ Expenses + savings exceed income. Consider adjusting.</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text2)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button type="button" onClick={() => {
            setData({ userName: name.trim() || 'Guest', monthlyIncome: incNum || 80000, totalBalance: Number(balance) || 150000, expenses: expenses.reduce((s, e) => s + e.amount, 0) > 0 ? expenses : DEFAULT_EXP.map(e => ({...e, amount: Math.round(80000 * 0.1)})), savingsPercent: saveGoal, isOnboarded: true });
            nav('/dashboard');
          }} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}>
            Skip for now
          </button>
          <div style={{ flex: 1 }} />
          {step < 3 ? (
            <button type="button" disabled={!canNext()} onClick={() => setStep(step + 1)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, border: 'none', background: canNext() ? 'var(--grad)' : '#1e293b', color: canNext() ? '#fff' : '#475569', fontSize: 15, fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: canNext() ? '0 4px 20px rgba(167,139,250,0.3)' : 'none' }}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={finish} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 999, border: 'none', background: 'var(--grad)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 0 30px rgba(167,139,250,0.35)', animation: 'pulse 2s ease-in-out infinite' }}>
              <Sparkles size={16} /> Launch My Dashboard
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{box-shadow:0 0 20px rgba(167,139,250,0.3)} 50%{box-shadow:0 0 40px rgba(167,139,250,0.55)} }`}</style>
    </div>
  );
}
