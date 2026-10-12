import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type { DatabaseState, UserDocument, TransactionDocument, GoalDocument, PortfolioAssetDocument } from '../types';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'finsight_db.json');

const INITIAL_EXPENSES = [
  { name: 'Rent', amount: 15000, color: '#a78bfa' },
  { name: 'Food', amount: 8000, color: '#f472b6' },
  { name: 'Transport', amount: 3500, color: '#60a5fa' },
  { name: 'Utilities', amount: 2500, color: '#34d399' },
  { name: 'Entertainment', amount: 4000, color: '#fbbf24' },
  { name: 'Other', amount: 2000, color: '#94a3b8' },
];

function getInitialState(): DatabaseState {
  const adminHash = bcrypt.hashSync('Admin@123', 10);
  const now = new Date().toISOString();

  return {
    users: {
      'admin@finsight.com': {
        id: 'usr_admin',
        email: 'admin@finsight.com',
        name: 'System Administrator',
        passwordHash: adminHash,
        monthlyIncome: 150000,
        totalBalance: 450000,
        expenses: INITIAL_EXPENSES,
        savingsPercent: 30,
        isOnboarded: true,
        isAdmin: true,
        currentPlan: 'Elite',
        statementUploaded: true,
        statementUploadsCount: 3,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
      },
    },
    transactions: {},
    goals: {},
    portfolio: {},
  };
}

class LocalDatabase {
  private state: DatabaseState;
  private isSaving = false;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || {},
          transactions: parsed.transactions || {},
          goals: parsed.goals || {},
          portfolio: parsed.portfolio || {},
        };
      }
    } catch (err) {
      console.warn('[LocalDB] Could not load existing DB file, initializing fresh:', err);
    }

    const initial = getInitialState();
    this.persistSync(initial);
    return initial;
  }

  private persistSync(stateToSave: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(stateToSave, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('[LocalDB] Failed to save state synchronously:', err);
    }
  }

  private async save() {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmp = `${DB_FILE}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(this.state, null, 2), 'utf-8');
      await fs.promises.rename(tmp, DB_FILE);
    } catch (err) {
      console.error('[LocalDB] Failed to write database to disk:', err);
    } finally {
      this.isSaving = false;
    }
  }

  // --- Users ---
  async findUserByEmail(email: string): Promise<UserDocument | null> {
    const key = email.trim().toLowerCase();
    const user = this.state.users[key];
    return user ? { ...user } : null;
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    const user = Object.values(this.state.users).find(u => u.id === id);
    return user ? { ...user } : null;
  }

  async createUser(userData: Omit<UserDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserDocument> {
    const emailKey = userData.email.trim().toLowerCase();
    const now = new Date().toISOString();
    const newUser: UserDocument = {
      ...userData,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: emailKey,
      createdAt: now,
      updatedAt: now,
    };
    this.state.users[emailKey] = newUser;
    await this.save();
    return { ...newUser };
  }

  async updateUser(email: string, updates: Partial<UserDocument>): Promise<UserDocument | null> {
    const key = email.trim().toLowerCase();
    const existing = this.state.users[key];
    if (!existing) return null;

    const updated: UserDocument = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.users[key] = updated;
    await this.save();
    return { ...updated };
  }

  async getAllUsers(): Promise<UserDocument[]> {
    return Object.values(this.state.users).map(u => ({ ...u }));
  }

  // --- Transactions ---
  async getTransactions(userEmail: string): Promise<TransactionDocument[]> {
    const key = userEmail.trim().toLowerCase();
    return (this.state.transactions[key] || []).map(t => ({ ...t }));
  }

  async addTransactions(userEmail: string, txns: Array<Omit<TransactionDocument, 'id' | 'userEmail' | 'createdAt'> & { id?: string }>): Promise<TransactionDocument[]> {
    const key = userEmail.trim().toLowerCase();
    const existing = this.state.transactions[key] || [];
    const existingSignatures = new Set(existing.map(t => `${t.date}_${t.amount}_${t.description.slice(0, 20)}`));

    const created: TransactionDocument[] = [];
    const now = new Date().toISOString();

    for (const t of txns) {
      const sig = `${t.date}_${t.amount}_${t.description.slice(0, 20)}`;
      if (existingSignatures.has(sig)) continue;

      const newTxn: TransactionDocument = {
        ...t,
        id: t.id || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userEmail: key,
        createdAt: now,
      };
      existing.push(newTxn);
      created.push(newTxn);
      existingSignatures.add(sig);
    }

    this.state.transactions[key] = existing;
    await this.save();
    return created;
  }

  async updateTransaction(userEmail: string, txnId: string, updates: Partial<TransactionDocument>): Promise<TransactionDocument | null> {
    const key = userEmail.trim().toLowerCase();
    const list = this.state.transactions[key] || [];
    const idx = list.findIndex(t => t.id === txnId);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };
    this.state.transactions[key] = list;
    await this.save();
    return { ...list[idx] };
  }

  async deleteTransaction(userEmail: string, txnId: string): Promise<boolean> {
    const key = userEmail.trim().toLowerCase();
    const list = this.state.transactions[key] || [];
    const initialLen = list.length;
    this.state.transactions[key] = list.filter(t => t.id !== txnId);
    if (this.state.transactions[key].length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }

  // --- Goals ---
  async getGoals(userEmail: string): Promise<GoalDocument[]> {
    const key = userEmail.trim().toLowerCase();
    return (this.state.goals[key] || []).map(g => ({ ...g }));
  }

  async addGoal(userEmail: string, goal: Omit<GoalDocument, 'id' | 'userEmail' | 'createdAt'> & { id?: string }): Promise<GoalDocument> {
    const key = userEmail.trim().toLowerCase();
    const existing = this.state.goals[key] || [];
    const newGoal: GoalDocument = {
      ...goal,
      id: goal.id || `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userEmail: key,
      createdAt: new Date().toISOString(),
    };
    existing.push(newGoal);
    this.state.goals[key] = existing;
    await this.save();
    return { ...newGoal };
  }

  async updateGoal(userEmail: string, goalId: string, updates: Partial<GoalDocument>): Promise<GoalDocument | null> {
    const key = userEmail.trim().toLowerCase();
    const list = this.state.goals[key] || [];
    const idx = list.findIndex(g => g.id === goalId);
    if (idx === -1) return null;

    list[idx] = { ...list[idx], ...updates };
    this.state.goals[key] = list;
    await this.save();
    return { ...list[idx] };
  }

  async deleteGoal(userEmail: string, goalId: string): Promise<boolean> {
    const key = userEmail.trim().toLowerCase();
    const list = this.state.goals[key] || [];
    const initialLen = list.length;
    this.state.goals[key] = list.filter(g => g.id !== goalId);
    if (this.state.goals[key].length !== initialLen) {
      await this.save();
      return true;
    }
    return false;
  }

  // --- Portfolio Assets ---
  async getPortfolio(userEmail: string): Promise<PortfolioAssetDocument[]> {
    const key = userEmail.trim().toLowerCase();
    return (this.state.portfolio[key] || []).map(a => ({ ...a }));
  }

  async savePortfolio(userEmail: string, assets: PortfolioAssetDocument[]): Promise<PortfolioAssetDocument[]> {
    const key = userEmail.trim().toLowerCase();
    this.state.portfolio[key] = assets.map(a => ({
      ...a,
      userEmail: key,
      updatedAt: new Date().toISOString(),
    }));
    await this.save();
    return (this.state.portfolio[key] || []).map(a => ({ ...a }));
  }

  getState(): DatabaseState {
    return this.state;
  }
}

export const localDb = new LocalDatabase();
