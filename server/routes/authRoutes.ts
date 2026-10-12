import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/db';
import { generateToken, authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const DEFAULT_EXPENSES = [
  { name: 'Rent', amount: 0, color: '#a78bfa' },
  { name: 'Food', amount: 0, color: '#f472b6' },
  { name: 'Transport', amount: 0, color: '#60a5fa' },
  { name: 'Utilities', amount: 0, color: '#34d399' },
  { name: 'Entertainment', amount: 0, color: '#fbbf24' },
  { name: 'Other', amount: 0, color: '#94a3b8' },
];

// POST /api/auth/register
router.post('/register', async (req, res: Response) => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(name).trim();

    // Password policy verification
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one special character.' });
    }

    const existingUser = await db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await db.createUser({
      email: cleanEmail,
      name: cleanName,
      passwordHash,
      monthlyIncome: 0,
      totalBalance: 0,
      savingsPercent: 20,
      currentPlan: 'Basic',
      expenses: DEFAULT_EXPENSES,
      isOnboarded: false,
      isAdmin: cleanEmail === 'admin@finsight.com',
      statementUploaded: false,
      statementUploadsCount: 0,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        monthlyIncome: newUser.monthlyIncome,
        totalBalance: newUser.totalBalance,
        savingsPercent: newUser.savingsPercent,
        currentPlan: newUser.currentPlan,
        expenses: newUser.expenses,
        isOnboarded: newUser.isOnboarded,
        isAdmin: newUser.isAdmin,
        statementUploaded: newUser.statementUploaded,
        statementUploadsCount: newUser.statementUploadsCount,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await db.findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check account lockout
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
      const minutesLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account is temporarily locked due to multiple failed attempts. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      const isLocked = attempts >= MAX_LOGIN_ATTEMPTS;

      await db.updateUser(cleanEmail, {
        failedLoginAttempts: attempts,
        lockedUntil: isLocked ? new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString() : null,
      });

      if (isLocked) {
        return res.status(423).json({
          error: 'Too many failed login attempts. Your account has been locked for 15 minutes.',
        });
      }

      return res.status(401).json({
        error: `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) remaining.`,
      });
    }

    // Reset attempts on successful login
    await db.updateUser(cleanEmail, {
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    const token = generateToken(user);

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        monthlyIncome: user.monthlyIncome,
        totalBalance: user.totalBalance,
        savingsPercent: user.savingsPercent,
        currentPlan: user.currentPlan,
        expenses: user.expenses,
        isOnboarded: user.isOnboarded,
        isAdmin: user.isAdmin,
        statementUploaded: user.statementUploaded,
        statementUploadsCount: user.statementUploadsCount,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  return res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      monthlyIncome: user.monthlyIncome,
      totalBalance: user.totalBalance,
      savingsPercent: user.savingsPercent,
      currentPlan: user.currentPlan,
      expenses: user.expenses,
      isOnboarded: user.isOnboarded,
      isAdmin: user.isAdmin,
      statementUploaded: user.statementUploaded,
      statementUploadsCount: user.statementUploadsCount,
    },
    databaseStatus: db.getStatus(),
  });
});

// POST /api/auth/logout
router.post('/logout', (_req, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
});

export default router;
