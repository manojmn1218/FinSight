import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, DollarSign, Target, Save, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Your Profile</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Manage your personal details and financial targets.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'flex-start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div className="panel" style={{ padding: 28 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="var(--purple)" /> Personal Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Subscription Tier</label>
                <select value={plan} onChange={e => setPlan(e.target.value)} className="input" style={{ cursor: 'pointer', appearance: 'none' }}>
                  <option value="Basic">Basic (Free)</option>
                  <option value="Pro">Pro (₹349/mo)</option>
                  <option value="Wealth">Wealth (₹899/mo)</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div className="panel" style={{ padding: 28 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={18} color="var(--green)" /> Financial Baseline
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label">Monthly Income (₹)</label>
                <input type="number" value={income} onChange={e => setIncome(e.target.value)} className="input" required />
              </div>
              <div>
                <label className="label">Total Balance (₹)</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="input" required />
              </div>
            </div>
          </motion.div>

          <motion.div className="panel" style={{ padding: 28 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={18} color="var(--blue)" /> Savings Goal
            </h3>
            <div>
              <label className="label">Target Savings Percentage (%)</label>
              <input type="number" value={savingsPercent} onChange={e => setSavingsPercent(e.target.value)} className="input" required />
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>Recommended: 20% to 30% of your income.</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <motion.div className="panel" style={{ padding: 28 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Expense Categories</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Update your monthly allocated expenses below to adjust your AI budgeting.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {expenses.map((ex, i) => (
                <div key={ex.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: ex.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{ex.name}</span>
                  <div style={{ position: 'relative', width: 130 }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 13, pointerEvents: 'none' }}>₹</span>
                    <input type="number" value={ex.amount} onChange={e => {
                      const copy = [...expenses];
                      copy[i] = { ...copy[i], amount: Number(e.target.value) || 0 };
                      setExpenses(copy);
                    }} className="input" style={{ paddingLeft: 24 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: 16,
              borderRadius: 14,
              fontSize: 15,
              background: saved ? 'var(--green)' : undefined,
              boxShadow: saved ? '0 8px 24px rgba(52,211,153,0.25)' : undefined,
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {saved ? <><CheckCircle2 size={18} /> Saved Successfully!</> : <><Save size={18} /> Save Profile Settings</>}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
