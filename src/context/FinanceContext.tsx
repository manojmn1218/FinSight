import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Transaction, FinancialGoal } from '../utils/types';
import { api, type UserProfile, type DatabaseStatus } from '../services/api';

interface ExpenseItem {
  name: string;
  amount: number;
  color: string;
}

export interface FinData {
  userName: string;
  userEmail: string;
  monthlyIncome: number;
  totalBalance: number;
  expenses: ExpenseItem[];
  savingsPercent: number;
  isOnboarded: boolean;
  isAdmin: boolean;
  currentPlan: string;
  transactions: Transaction[];
  financialGoals: FinancialGoal[];
  statementUploaded: boolean;
  statementUploadsCount?: number;
}

interface FinCtx {
  data: FinData;
  setData: (d: Partial<FinData>) => Promise<void>;
  reset: () => Promise<void>;
  totalExpenses: number;
  savingsAmount: number;
  budget: number;
  allUsers: FinData[];
  isAuthenticated: boolean;
  isLoading: boolean;
  databaseStatus: DatabaseStatus | null;
  checkDatabaseStatus: () => Promise<void>;
  loginAs: (email: string) => void;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (payload: { credential?: string; accessToken?: string } | string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  sessionTimeLeft: number;
  refreshUserData: () => Promise<void>;
  // Transaction methods
  addTransactions: (txns: Transaction[]) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Goal methods
  addGoal: (goal: FinancialGoal) => Promise<void>;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  transactions: [],
  financialGoals: [],
  statementUploaded: false,
  statementUploadsCount: 0,
};

const Ctx = createContext<FinCtx | null>(null);

function profileToFinData(profile: UserProfile, txns: Transaction[] = [], goals: FinancialGoal[] = []): FinData {
  return {
    userName: profile.name || '',
    userEmail: profile.email || '',
    monthlyIncome: profile.monthlyIncome || 0,
    totalBalance: profile.totalBalance || 0,
    currentPlan: profile.currentPlan || 'Basic',
    expenses: profile.expenses && profile.expenses.length > 0 ? profile.expenses : INIT.expenses,
    savingsPercent: profile.savingsPercent || 20,
    isOnboarded: !!profile.isOnboarded,
    isAdmin: !!profile.isAdmin,
    transactions: txns || [],
    financialGoals: goals || [],
    statementUploaded: !!profile.statementUploaded,
    statementUploadsCount: profile.statementUploadsCount || 0,
  };
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setFinData] = useState<FinData>(INIT);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus | null>(null);
  const [adminUsersList, setAdminUsersList] = useState<FinData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // --- Session timeout ---
  const [sessionStart, setSessionStart] = useState<number | null>(() => {
    const s = localStorage.getItem('fs_session_start');
    return s ? Number(s) : null;
  });
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT_MS);

  const isAuthenticated = useMemo(() => {
    if (!currentUserEmail) return false;
    if (!sessionStart) return false;
    if (sessionTimeLeft <= 0) return false;
    return true;
  }, [currentUserEmail, sessionStart, sessionTimeLeft]);

  // Session countdown timer
  useEffect(() => {
    if (!sessionStart || !currentUserEmail) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStart;
      const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);
      setSessionTimeLeft(remaining);
      if (remaining <= 0) {
        logoutUser();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart, currentUserEmail]);

  // Load user data from backend API
  const refreshUserData = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const [meRes, txnsRes, goalsRes] = await Promise.all([
        api.getMe(),
        api.getTransactions().catch(() => ({ transactions: [] })),
        api.getGoals().catch(() => ({ goals: [] })),
      ]);

      setDatabaseStatus(meRes.databaseStatus);
      const finData = profileToFinData(meRes.user, txnsRes.transactions, goalsRes.goals);
      setFinData(finData);
      setCurrentUserEmail(finData.userEmail);

      // If user is admin, also load all platform users
      if (finData.isAdmin) {
        try {
          const adminRes = await api.getAdminUsers();
          setAdminUsersList(adminRes.users.map(u => profileToFinData(u)));
        } catch (e) {
          console.warn('[FinanceContext] Could not fetch admin users:', e);
        }
      }
    } catch (err) {
      console.warn('[FinanceContext] Auth check failed:', err);
      api.setToken(null);
      setCurrentUserEmail(null);
      setFinData(INIT);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  const checkDatabaseStatus = useCallback(async () => {
    try {
      const res = await api.getHealth();
      setDatabaseStatus(res.database);
    } catch {
      setDatabaseStatus(null);
    }
  }, []);

  // Periodic health & db check
  useEffect(() => {
    checkDatabaseStatus();
    const interval = setInterval(checkDatabaseStatus, 10000);
    return () => clearInterval(interval);
  }, [checkDatabaseStatus]);

  const loginWithPassword = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.login(cleanEmail, password);

      const [txnsRes, goalsRes] = await Promise.all([
        api.getTransactions().catch(() => ({ transactions: [] })),
        api.getGoals().catch(() => ({ goals: [] })),
      ]);

      const finData = profileToFinData(res.user, txnsRes.transactions, goalsRes.goals);
      setFinData(finData);
      setCurrentUserEmail(finData.userEmail);

      const now = Date.now();
      setSessionStart(now);
      localStorage.setItem('fs_session_start', String(now));

      if (finData.isAdmin) {
        api.getAdminUsers()
          .then(adminRes => setAdminUsersList(adminRes.users.map(u => profileToFinData(u))))
          .catch(() => {});
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Login failed.' };
    }
  }, []);

  const loginWithGoogle = useCallback(async (payload: { credential?: string; accessToken?: string } | string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cred = typeof payload === 'string' ? payload : payload.credential;
      const access = typeof payload === 'object' ? payload.accessToken : undefined;
      const res = await api.googleLogin(cred, access);

      const [txnsRes, goalsRes] = await Promise.all([
        api.getTransactions().catch(() => ({ transactions: [] })),
        api.getGoals().catch(() => ({ goals: [] })),
      ]);

      const finData = profileToFinData(res.user, txnsRes.transactions, goalsRes.goals);
      setFinData(finData);
      setCurrentUserEmail(finData.userEmail);

      const now = Date.now();
      setSessionStart(now);
      localStorage.setItem('fs_session_start', String(now));

      if (finData.isAdmin) {
        api.getAdminUsers()
          .then(adminRes => setAdminUsersList(adminRes.users.map(u => profileToFinData(u))))
          .catch(() => {});
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Google sign-in failed.' };
    }
  }, []);

  const registerUser = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await api.register(cleanEmail, password, name);

      const finData = profileToFinData(res.user, [], []);
      setFinData(finData);
      setCurrentUserEmail(finData.userEmail);

      const now = Date.now();
      setSessionStart(now);
      localStorage.setItem('fs_session_start', String(now));

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed.' };
    }
  }, []);

  const logoutUser = useCallback(() => {
    api.logout().catch(() => {});
    setCurrentUserEmail(null);
    setSessionStart(null);
    localStorage.removeItem('fs_session_start');
    setFinData(INIT);
    setAdminUsersList([]);
  }, []);

  const loginAs = useCallback((email: string) => {
    setCurrentUserEmail(email);
    setFinData(prev => ({ ...prev, userEmail: email }));
    const now = Date.now();
    setSessionStart(now);
    localStorage.setItem('fs_session_start', String(now));
  }, []);

  const setData = useCallback(async (d: Partial<FinData>) => {
    // Optimistic UI update
    setFinData(prev => ({ ...prev, ...d }));

    try {
      const payload: Partial<UserProfile> = {};
      if (d.userName !== undefined) payload.name = d.userName;
      if (d.monthlyIncome !== undefined) payload.monthlyIncome = d.monthlyIncome;
      if (d.totalBalance !== undefined) payload.totalBalance = d.totalBalance;
      if (d.savingsPercent !== undefined) payload.savingsPercent = d.savingsPercent;
      if (d.currentPlan !== undefined) payload.currentPlan = d.currentPlan as any;
      if (d.isOnboarded !== undefined) payload.isOnboarded = d.isOnboarded;
      if (d.expenses !== undefined) payload.expenses = d.expenses;
      if (d.statementUploaded !== undefined) payload.statementUploaded = d.statementUploaded;
      if (d.statementUploadsCount !== undefined) payload.statementUploadsCount = d.statementUploadsCount;

      await api.updateProfile(payload);
    } catch (err) {
      console.error('[FinanceContext] Failed to persist profile changes to backend:', err);
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      await api.resetProfile();
      await refreshUserData();
    } catch (err) {
      console.error('[FinanceContext] Failed to reset profile:', err);
    }
  }, [refreshUserData]);

  // Transaction CRUD
  const addTransactions = useCallback(async (txns: Transaction[]) => {
    // Optimistic update
    setFinData(prev => {
      const existing = prev.transactions || [];
      const sigs = new Set(existing.map(t => `${t.date}_${t.amount}_${t.description.slice(0, 20)}`));
      const toAdd = txns.filter(t => !sigs.has(`${t.date}_${t.amount}_${t.description.slice(0, 20)}`));
      return {
        ...prev,
        transactions: [...existing, ...toAdd],
        statementUploaded: true,
        statementUploadsCount: (prev.statementUploadsCount || 0) + 1,
      };
    });

    try {
      await api.addTransactions(txns);
      // Reload fresh transactions from server
      const res = await api.getTransactions();
      setFinData(prev => ({ ...prev, transactions: res.transactions }));
    } catch (err) {
      console.error('[FinanceContext] Failed to save transactions to database:', err);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setFinData(prev => ({
      ...prev,
      transactions: (prev.transactions || []).map(t => (t.id === id ? { ...t, ...updates } : t)),
    }));

    try {
      await api.updateTransaction(id, updates);
    } catch (err) {
      console.error('[FinanceContext] Failed to update transaction on backend:', err);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    setFinData(prev => ({
      ...prev,
      transactions: (prev.transactions || []).filter(t => t.id !== id),
    }));

    try {
      await api.deleteTransaction(id);
    } catch (err) {
      console.error('[FinanceContext] Failed to delete transaction on backend:', err);
    }
  }, []);

  // Goal CRUD
  const addGoal = useCallback(async (goal: FinancialGoal) => {
    setFinData(prev => ({
      ...prev,
      financialGoals: [...(prev.financialGoals || []), goal],
    }));

    try {
      const res = await api.addGoal(goal);
      if (res.goal) {
        setFinData(prev => ({
          ...prev,
          financialGoals: [...(prev.financialGoals || []).filter(g => g.id !== goal.id), res.goal],
        }));
      }
    } catch (err) {
      console.error('[FinanceContext] Failed to add goal to database:', err);
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<FinancialGoal>) => {
    setFinData(prev => ({
      ...prev,
      financialGoals: (prev.financialGoals || []).map(g => (g.id === id ? { ...g, ...updates } : g)),
    }));

    try {
      await api.updateGoal(id, updates);
    } catch (err) {
      console.error('[FinanceContext] Failed to update goal on backend:', err);
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    setFinData(prev => ({
      ...prev,
      financialGoals: (prev.financialGoals || []).filter(g => g.id !== id),
    }));

    try {
      await api.deleteGoal(id);
    } catch (err) {
      console.error('[FinanceContext] Failed to delete goal on backend:', err);
    }
  }, []);

  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const savingsAmount = Math.round((data.monthlyIncome * data.savingsPercent) / 100);
  const budget = data.monthlyIncome - totalExpenses - savingsAmount;

  const allUsers = useMemo(() => {
    if (adminUsersList.length > 0) return adminUsersList;
    return currentUserEmail ? [data] : [];
  }, [adminUsersList, currentUserEmail, data]);

  return (
    <Ctx.Provider
      value={{
        data,
        setData,
        reset,
        totalExpenses,
        savingsAmount,
        budget,
        allUsers,
        isAuthenticated,
        isLoading,
        databaseStatus,
        checkDatabaseStatus,
        loginAs,
        loginWithPassword,
        loginWithGoogle,
        registerUser,
        logoutUser,
        sessionTimeLeft,
        refreshUserData,
        addTransactions,
        updateTransaction,
        deleteTransaction,
        addGoal,
        updateGoal,
        deleteGoal,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFinance requires FinanceProvider');
  return c;
}
