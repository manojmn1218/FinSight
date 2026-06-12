import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, Target, Save, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const panel: React.CSSProperties = { padding: 32, background: 'var(--surface)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' };
const inp: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit' };

export default function ProfilePage() {
  const { data, setData } = useFinance();
  
  const [name, setName] = useState(data.userName || '');
  const [email, setEmail] = useState(data.userEmail || '');
  const [plan, setPlan] = useState(data.currentPlan || 'Basic');
  const [income, setIncome] = useState(String(data.monthlyIncome));
  const [balance, setBalance] = useState(String(data.totalBalance));
  const [savingsPercent, setSavingsPercent] = useState(String(data.savingsPercent || 20));
  const [expenses, setExpenses] = useState(data.expenses);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setData({
      userName: name.trim() || 'User',
      userEmail: email.trim() || 'user@example.com',
      currentPlan: plan,
      monthlyIncome: Number(income) || 0,
      totalBalance: Number(balance) || 0,
      savingsPercent: Number(savingsPercent) || 0,
      expenses,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Your Profile</h1>
          <p style={{ color: 'var(--text2)' }}>Manage your personal details and financial targets.</p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'flex-start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div style={panel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={20} color="#a78bfa" /> Personal Details
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={inp} required />
              
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6, marginTop: 16 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} required />

              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6, marginTop: 16 }}>Subscription Tier</label>
              <select value={plan} onChange={e => setPlan(e.target.value)} style={{...inp, cursor: 'pointer', appearance: 'none'}}>
                <option value="Basic">Basic (Free)</option>
                <option value="Pro">Pro (₹349/mo)</option>
                <option value="Wealth">Wealth (₹899/mo)</option>
              </select>
            </div>
          </motion.div>

          <motion.div style={panel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={20} color="#34d399" /> Financial Baseline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Monthly Income (₹)</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} style={inp} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Total Balance (₹)</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} style={inp} required />
              </div>
            </div>
          </motion.div>

          <motion.div style={panel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={20} color="#60a5fa" /> Savings Goal
            </h3>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Target Savings Percentage (%)</label>
              <input type="number" value={savingsPercent} onChange={e => setSavingsPercent(e.target.value)} style={inp} required />
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Recommended: 20% to 30% of your income.</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div style={panel} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Expense Categories</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Update your monthly allocated expenses below to adjust your AI budgeting.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {expenses.map((ex, i) => (
                <div key={ex.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: ex.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{ex.name}</span>
                  <div style={{ position: 'relative', width: 140 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13 }}>₹</span>
                    <input type="number" value={ex.amount} onChange={e => {
                      const copy = [...expenses];
                      copy[i].amount = Number(e.target.value) || 0;
                      setExpenses(copy);
                    }} style={{ ...inp, paddingLeft: 24 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '16px', borderRadius: 16, border: 'none', background: saved ? '#34d399' : 'var(--grad)', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: saved ? '0 8px 24px rgba(52,211,153,0.3)' : '0 8px 24px rgba(167,139,250,0.3)', transition: 'background 0.3s, box-shadow 0.3s' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {saved ? <><CheckCircle2 size={20} /> Saved Successfully!</> : <><Save size={20} /> Save Profile Settings</>}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
