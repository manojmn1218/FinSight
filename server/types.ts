export interface ExpenseItem {
  name: string;
  amount: number;
  color: string;
}

export interface UserDocument {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  monthlyIncome: number;
  totalBalance: number;
  expenses: ExpenseItem[];
  savingsPercent: number;
  isOnboarded: boolean;
  isAdmin: boolean;
  currentPlan: 'Basic' | 'Pro' | 'Elite';
  statementUploaded: boolean;
  statementUploadsCount: number;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  phone?: string;
  occupation?: string;
  city?: string;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon?: 'short' | 'medium' | 'long';
  currency?: string;
  stealthMode?: boolean;
  panMasked?: string;
  emergencyMonths?: number;
  financialFocus?: string;
  notifications?: {
    emailDigest?: boolean;
    highExpenseAlert?: boolean;
    budgetWarning?: boolean;
    goalMilestones?: boolean;
    securityAlerts?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDocument {
  id: string;
  userEmail: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  isRecurring: boolean;
  balance?: number;
  source?: 'pdf' | 'setu' | 'manual';
  createdAt: string;
}

export interface GoalDocument {
  id: string;
  userEmail: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  color: string;
  createdAt: string;
}

export interface PortfolioAssetDocument {
  id: string;
  userEmail: string;
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  assetType: 'stock' | 'crypto' | 'etf' | 'mutual_fund';
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseState {
  users: Record<string, UserDocument>;
  transactions: Record<string, TransactionDocument[]>;
  goals: Record<string, GoalDocument[]>;
  portfolio: Record<string, PortfolioAssetDocument[]>;
}
