import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';

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

interface UserCredential {
  passwordHash: string;
  createdAt: string;
  lastLogin: string;
  loginAttempts: number;
  lockedUntil: string | null;
}

interface FinCtx {
  data: FinData;
  setData: (d: Partial<FinData>) => void;
  reset: () => void;
  totalExpenses: number;
  savingsAmount: number;
  budget: number;
  allUsers: FinData[];
  isAuthenticated: boolean;
  loginAs: (email: string) => void;
  loginWithPassword: (email: string, password: string) => { success: boolean; error?: string };
  registerUser: (email: string, password: string, name: string) => { success: boolean; error?: string };
  logoutUser: () => void;
  sessionTimeLeft: number;
}

// Simple SHA-256 hash using SubtleCrypto (sync fallback for SSR)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '__finsight_salt_2026__');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function hashPasswordSync(password: string): string {
  // Simple deterministic hash for synchronous use
  let hash = 0;
  const salted = password + '__finsight_salt_2026__';
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'sync_' + Math.abs(hash).toString(16);
}

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

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
  const [usersMap, setUsersMap] = useState<Record<string, FinData>>(() => {
    try {
      const s = localStorage.getItem('fs_users');
      // Migrate old data if present
      const oldDataStr = localStorage.getItem('fs_data');
      if (!s && oldDataStr) {
        const oldData = JSON.parse(oldDataStr);
        if (oldData.userEmail) {
          const m = { [oldData.userEmail]: oldData };
          localStorage.setItem('fs_users', JSON.stringify(m));
          return m;
        }
      }
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('fs_current_user');
  });

  const data = useMemo(() => {
    if (currentUserEmail === 'admin@finsight.com') {
      return { ...INIT, isAdmin: true };
    }
    if (currentUserEmail && usersMap[currentUserEmail]) {
      return usersMap[currentUserEmail];
    }
    return INIT;
  }, [currentUserEmail, usersMap]);

  const allUsers = useMemo(() => Object.values(usersMap), [usersMap]);

  useEffect(() => { localStorage.setItem('fs_users', JSON.stringify(usersMap)); }, [usersMap]);
  useEffect(() => { 
    if (currentUserEmail) localStorage.setItem('fs_current_user', currentUserEmail); 
    else localStorage.removeItem('fs_current_user');
  }, [currentUserEmail]);

  const setData = (d: Partial<FinData>) => {
    if (!currentUserEmail || currentUserEmail === 'admin@finsight.com') return;
    setUsersMap(prev => ({
      ...prev,
      [currentUserEmail]: { ...prev[currentUserEmail], ...d }
    }));
  };

  // --- Session timeout ---
  const [sessionStart, setSessionStart] = useState<number | null>(() => {
    const s = localStorage.getItem('fs_session_start');
    return s ? Number(s) : null;
  });
  const [sessionTimeLeft, setSessionTimeLeft] = useState(SESSION_TIMEOUT_MS);
  const activityRef = useRef(Date.now());

  const isAuthenticated = useMemo(() => {
    if (!currentUserEmail) return false;
    if (!sessionStart) return false;
    if (Date.now() - sessionStart > SESSION_TIMEOUT_MS) return false;
    return true;
  }, [currentUserEmail, sessionStart, sessionTimeLeft]);

  // Track user activity to extend session
  useEffect(() => {
    const onActivity = () => { activityRef.current = Date.now(); };
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('click', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('click', onActivity);
    };
  }, []);

  // Session countdown timer
  useEffect(() => {
    if (!sessionStart || !currentUserEmail) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionStart;
      const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);
      setSessionTimeLeft(remaining);
      if (remaining <= 0) {
        // Auto-logout on timeout
        setCurrentUserEmail(null);
        setSessionStart(null);
        localStorage.removeItem('fs_current_user');
        localStorage.removeItem('fs_session_start');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStart, currentUserEmail]);

  // --- Credentials store ---
  const [credsMap, setCredsMap] = useState<Record<string, UserCredential>>(() => {
    try {
      const s = localStorage.getItem('fs_creds');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  useEffect(() => { localStorage.setItem('fs_creds', JSON.stringify(credsMap)); }, [credsMap]);

  const registerUser = useCallback((email: string, password: string, name: string): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    if (credsMap[trimmedEmail]) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { success: false, error: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { success: false, error: 'Password must contain at least one number.' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { success: false, error: 'Password must contain at least one special character.' };
    }
    const hash = hashPasswordSync(password);
    setCredsMap(prev => ({
      ...prev,
      [trimmedEmail]: {
        passwordHash: hash,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        loginAttempts: 0,
        lockedUntil: null
      }
    }));
    setUsersMap(prev => ({
      ...prev,
      [trimmedEmail]: { ...INIT, userEmail: trimmedEmail, userName: name.trim() }
    }));
    return { success: true };
  }, [credsMap]);

  const loginWithPassword = useCallback((email: string, password: string): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();

    // Admin bypass
    if (trimmedEmail === 'admin@finsight.com' && password === 'admin123') {
      setCurrentUserEmail(trimmedEmail);
      const now = Date.now();
      setSessionStart(now);
      localStorage.setItem('fs_session_start', String(now));
      return { success: true };
    }

    const cred = credsMap[trimmedEmail];
    if (!cred) {
      return { success: false, error: 'No account found with this email.' };
    }

    // Check lockout
    if (cred.lockedUntil && new Date(cred.lockedUntil).getTime() > Date.now()) {
      const minsLeft = Math.ceil((new Date(cred.lockedUntil).getTime() - Date.now()) / 60000);
      return { success: false, error: `Account locked. Try again in ${minsLeft} minute(s).` };
    }

    const hash = hashPasswordSync(password);
    if (hash !== cred.passwordHash) {
      const attempts = cred.loginAttempts + 1;
      const locked = attempts >= MAX_LOGIN_ATTEMPTS;
      setCredsMap(prev => ({
        ...prev,
        [trimmedEmail]: {
          ...prev[trimmedEmail],
          loginAttempts: attempts,
          lockedUntil: locked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null
        }
      }));
      if (locked) {
        return { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' };
      }
      return { success: false, error: `Incorrect password. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) remaining.` };
    }

    // Success — reset attempts, update lastLogin
    setCredsMap(prev => ({
      ...prev,
      [trimmedEmail]: {
        ...prev[trimmedEmail],
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date().toISOString()
      }
    }));
    setCurrentUserEmail(trimmedEmail);
    const now = Date.now();
    setSessionStart(now);
    localStorage.setItem('fs_session_start', String(now));
    return { success: true };
  }, [credsMap]);

  const loginAs = (email: string) => {
    setCurrentUserEmail(email);
    if (email !== 'admin@finsight.com' && !usersMap[email]) {
      setUsersMap(prev => ({
        ...prev,
        [email]: { ...INIT, userEmail: email }
      }));
    }
    const now = Date.now();
    setSessionStart(now);
    localStorage.setItem('fs_session_start', String(now));
  };

  const logoutUser = () => {
    setCurrentUserEmail(null);
    setSessionStart(null);
    localStorage.removeItem('fs_current_user');
    localStorage.removeItem('fs_session_start');
  };

  const reset = () => { 
    if (!currentUserEmail || currentUserEmail === 'admin@finsight.com') return;
    setUsersMap(prev => ({
      ...prev,
      [currentUserEmail]: { ...INIT, userEmail: currentUserEmail }
    }));
  };

  const totalExpenses = data.expenses.reduce((s, e) => s + e.amount, 0);
  const savingsAmount = Math.round((data.monthlyIncome * data.savingsPercent) / 100);
  const budget = data.monthlyIncome - totalExpenses - savingsAmount;

  return (
    <Ctx.Provider value={{ data, setData, reset, totalExpenses, savingsAmount, budget, allUsers, isAuthenticated, loginAs, loginWithPassword, registerUser, logoutUser, sessionTimeLeft }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFinance() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useFinance requires FinanceProvider');
  return c;
}
