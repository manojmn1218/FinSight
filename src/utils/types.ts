// ═══════════════════════════════════════════════
// Shared Types — PDF Transaction Analyzer
// ═══════════════════════════════════════════════

export const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Utilities',
  'Rent',
  'Subscriptions',
  'Health',
  'Education',
  'Transfer',
  'ATM',
  'Salary',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_CONFIG: Record<Category, { color: string; bg: string; icon: string }> = {
  'Food & Dining':  { color: '#f472b6', bg: 'rgba(244,114,182,0.1)', icon: '🍔' },
  'Shopping':       { color: '#818cf8', bg: 'rgba(129,140,248,0.1)', icon: '🛍️' },
  'Transport':      { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  icon: '🚗' },
  'Utilities':      { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  icon: '💡' },
  'Rent':           { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: '🏠' },
  'Subscriptions':  { color: '#f0b429', bg: 'rgba(240,180,41,0.1)',  icon: '📺' },
  'Health':         { color: '#fb7185', bg: 'rgba(251,113,133,0.1)', icon: '🏥' },
  'Education':      { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)',  icon: '📚' },
  'Transfer':       { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: '🔄' },
  'ATM':            { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', icon: '🏧' },
  'Salary':         { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  icon: '💰' },
  'Other':          { color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: '📌' },
};

export interface Transaction {
  id: string;
  date: string;           // ISO date string YYYY-MM-DD
  description: string;
  amount: number;          // positive = credit, negative = debit
  category: Category;
  isRecurring: boolean;
  balance?: number;
  source?: 'pdf' | 'setu' | 'manual';  // data source identifier
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;        // ISO date
  color: string;
  createdAt: string;
}

export interface MonthSummary {
  month: string;           // YYYY-MM
  label: string;           // "Jan 2026"
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categoryBreakdown: Partial<Record<Category, number>>;
}

export interface RecurringPayment {
  description: string;
  averageAmount: number;
  frequency: 'monthly' | 'weekly' | 'quarterly';
  occurrences: number;
  category: Category;
  lastDate: string;
}

// ═══════════════════════════════════════════════
// Setu Account Aggregator Types
// ═══════════════════════════════════════════════

export type SetuConsentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED' | 'EXPIRED' | 'FAILED';

export interface SetuConsentState {
  consentId: string;
  status: SetuConsentStatus;
  redirectUrl: string;
  mobileNumber: string;
  createdAt: string;
}

/** Raw transaction from Setu's FI DEPOSIT response */
export interface SetuFITransaction {
  type: 'DEBIT' | 'CREDIT';
  mode: string;
  amount: number;
  currentBalance: string;
  transactionTimestamp: string;
  valueDate: string;
  txnId: string;
  narration: string;
  reference: string;
}

/** Shape of Setu's FI DEPOSIT data */
export interface SetuFIData {
  account: {
    linkedAccRef: string;
    maskedAccNumber: string;
    type: string;
    profile: {
      holders: {
        holder: Array<{
          name: string;
          email?: string;
          mobile?: string;
          pan?: string;
        }>;
      };
    };
    summary: {
      currentBalance: string;
      currency: string;
      branch: string;
      facility: string;
      ifscCode: string;
      openingDate: string;
      status: string;
      type: string;
    };
    transactions: {
      transaction: SetuFITransaction[];
    };
  };
}
