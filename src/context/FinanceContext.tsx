import React, { createContext, useContext, useState, useEffect } from 'react';

interface ExpenseItem {
  name: string;
  amount: number;
  color: string;
}

interface FinData {
  userName: string;
  userEmail: string;
  monthlyIncome: number;
  totalBalance: number;
  expenses: ExpenseItem[];
  savingsPercent: number;
  isOnboarded: boolean;
  isAdmin: boolean;
  currentPlan: string;
}

interface FinCtx {
  data: FinData;
  setData: (d: Partial<FinData>) => void;
  reset: () => void;
  totalExpenses: number;
  savingsAmount: number;
  budget: number;
}

const INIT: FinData = {
  userName: '',
  userEmail: '',
  monthlyIncome: 0,
  totalBalance: 0,
  currentPlan: 'Basic',
  expenses: [
    { name: 'Rent', amount: 0, color: '#a78bfa' },
    { name: 'Food', amount: 0, color: '#f472b6' },
    { name: 'Transport', amount: 0, color: '#60a5fa' },
    { name: 'Utilities', amount: 0, color: '#34d399' },
    { name: 'Entertainment', amount: 0, color: '#fbbf24' },
    { name: 'Other', amount: 0, color: '#94a3b8' },
  ],
  savingsPercent: 20,
  isOnboarded: false,
  isAdmin: false,
};

const Ctx = createContext<FinCtx | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, _setData] = useState<FinData>(() => {
    try {
      const s = localStorage.getItem('fs_data');
      return s ? { ...INIT, ...JSON.parse(s) } : INIT;
    } catch { return INIT; }
  });

  useEffect(() => { localStorage.setItem('fs_data', JSON.stringify(data)); }, [data]);

  const setData = (d: Partial<FinData>) => _setData(p => ({ ...p, ...d }));
  const reset = () => { localStorage.removeItem('fs_data'); _setData(INIT); };

  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const savingsAmount = Math.round((data.monthlyIncome * data.savingsPercent) / 100);
  const budget = data.monthlyIncome - totalExpenses - savingsAmount;

  return (
    <Ctx.Provider value={{ data, setData, reset, totalExpenses, savingsAmount, budget }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFinance() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFinance requires FinanceProvider');
  return c;
}
