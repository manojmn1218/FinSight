import type { Transaction, FinancialGoal } from '../utils/types';

const TOKEN_KEY = 'fs_auth_token';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  monthlyIncome: number;
  totalBalance: number;
  savingsPercent: number;
  currentPlan: 'Basic' | 'Pro' | 'Elite';
  expenses: Array<{ name: string; amount: number; color: string }>;
  isOnboarded: boolean;
  isAdmin: boolean;
  statementUploaded: boolean;
  statementUploadsCount: number;
  avatarUrl?: string;
}

export interface PortfolioAsset {
  id?: string;
  symbol: string;
  name: string;
  shares: number;
  avgBuyPrice: number;
  assetType: 'stock' | 'crypto' | 'etf' | 'mutual_fund';
}

export interface DatabaseStatus {
  connected: boolean;
  mode: string;
  storageFile: string | null;
  error: string | null;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null, remember: boolean = true) {
    this.token = token;
    if (token) {
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');

    const token = this.getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const url = apiBase ? `${apiBase}${endpoint}` : endpoint;

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: any) {
      // If server is still booting up (takes ~3s to connect to MongoDB), give it one retry
      if (retries > 0) {
        await new Promise(res => setTimeout(res, 1200));
        return this.request<T>(endpoint, options, retries - 1);
      }

      const isNetworkErr = err.name === 'TypeError' || String(err.message || '').toLowerCase().includes('fetch');
      if (isNetworkErr) {
        throw new Error(
          'Cannot connect to FinSight backend server. Please make sure the server is running on http://127.0.0.1:5000 (run "npm run dev").'
        );
      }
      throw err;
    }

    if (response.status === 401 || response.status === 403) {
      // If unauthorized, clear invalid token
      if (endpoint !== '/api/auth/login' && endpoint !== '/api/auth/register') {
        this.setToken(null);
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error || data.message || `Request failed (${response.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  // --- Auth ---
  async register(email: string, password: string, name: string) {
    const data = await this.request<{ message: string; token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ message: string; token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async googleLogin(credential?: string, accessToken?: string) {
    const data = await this.request<{ message: string; token: string; user: UserProfile }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential, accessToken }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request<{ user: UserProfile; databaseStatus: DatabaseStatus }>('/api/auth/me', {
      method: 'GET',
    });
  }

  async logout() {
    try {
      await this.request<{ message: string }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      this.setToken(null);
    }
  }

  // --- User Profile ---
  async updateProfile(updates: Partial<UserProfile>) {
    return this.request<{ message: string; user: UserProfile }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async resetProfile() {
    return this.request<{ message: string; user: UserProfile }>('/api/user/reset', {
      method: 'POST',
    });
  }

  // --- Transactions ---
  async getTransactions() {
    return this.request<{ transactions: Transaction[] }>('/api/transactions', {
      method: 'GET',
    });
  }

  async addTransactions(transactions: Transaction[]) {
    return this.request<{ message: string; transactions: Transaction[] }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify({ transactions }),
    });
  }

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    return this.request<{ message: string; transaction: Transaction }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTransaction(id: string) {
    return this.request<{ message: string }>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Goals ---
  async getGoals() {
    return this.request<{ goals: FinancialGoal[] }>('/api/goals', {
      method: 'GET',
    });
  }

  async addGoal(goal: Omit<FinancialGoal, 'id' | 'createdAt'>) {
    return this.request<{ message: string; goal: FinancialGoal }>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  }

  async updateGoal(id: string, updates: Partial<FinancialGoal>) {
    return this.request<{ message: string; goal: FinancialGoal }>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGoal(id: string) {
    return this.request<{ message: string }>(`/api/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Portfolio Assets ---
  async getPortfolio() {
    return this.request<{ assets: PortfolioAsset[] }>('/api/portfolio', {
      method: 'GET',
    });
  }

  async savePortfolio(assets: PortfolioAsset[]) {
    return this.request<{ message: string; assets: PortfolioAsset[] }>('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ assets }),
    });
  }

  // --- Admin ---
  async getAdminUsers() {
    return this.request<{ users: UserProfile[] }>('/api/admin/users', {
      method: 'GET',
    });
  }

  async getAdminStats() {
    return this.request<{ stats: any }>('/api/admin/stats', {
      method: 'GET',
    });
  }

  async updateAdminUser(email: string, updates: Record<string, any>) {
    return this.request<{ message: string; user: UserProfile }>(`/api/admin/users/${encodeURIComponent(email)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // --- System Health & Database Explorer ---
  async getHealth() {
    return this.request<{ status: string; timestamp: string; uptime: number; database: DatabaseStatus }>('/api/health', {
      method: 'GET',
    });
  }

  async getDatabaseOverview() {
    return this.request<{ status: DatabaseStatus; collections: Array<{ name: string; count: number }> }>('/api/admin/database/overview', {
      method: 'GET',
    });
  }

  async getDatabaseCollection(name: string) {
    return this.request<{ collection: string; count: number; documents: any[] }>(`/api/admin/database/collection/${name}`, {
      method: 'GET',
    });
  }
}

export const api = new ApiService();
