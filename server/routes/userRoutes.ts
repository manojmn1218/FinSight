import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/user/profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = await db.findUserByEmail(req.user!.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

// PUT /api/user/profile
router.put('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;

    // Do not allow demo admin account to mutate profile if protected
    if (userEmail === 'admin@finsight.com' && req.body.isProtectedAdmin) {
      return res.status(403).json({ error: 'System administrator profile cannot be modified.' });
    }

    const {
      name,
      monthlyIncome,
      totalBalance,
      savingsPercent,
      currentPlan,
      isOnboarded,
      expenses,
      statementUploaded,
      statementUploadsCount,
    } = req.body;

    const updates: Record<string, any> = {};
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof monthlyIncome === 'number') updates.monthlyIncome = monthlyIncome;
    if (typeof totalBalance === 'number') updates.totalBalance = totalBalance;
    if (typeof savingsPercent === 'number') updates.savingsPercent = savingsPercent;
    if (typeof currentPlan === 'string') updates.currentPlan = currentPlan;
    if (typeof isOnboarded === 'boolean') updates.isOnboarded = isOnboarded;
    if (Array.isArray(expenses)) updates.expenses = expenses;
    if (typeof statementUploaded === 'boolean') updates.statementUploaded = statementUploaded;
    if (typeof statementUploadsCount === 'number') updates.statementUploadsCount = statementUploadsCount;

    const updatedUser = await db.updateUser(userEmail, updates);

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('[User] Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/user/reset
router.post('/reset', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const defaultExpenses = [
      { name: 'Rent', amount: 0, color: '#a78bfa' },
      { name: 'Food', amount: 0, color: '#f472b6' },
      { name: 'Transport', amount: 0, color: '#60a5fa' },
      { name: 'Utilities', amount: 0, color: '#34d399' },
      { name: 'Entertainment', amount: 0, color: '#fbbf24' },
      { name: 'Other', amount: 0, color: '#94a3b8' },
    ];

    const updated = await db.updateUser(userEmail, {
      monthlyIncome: 0,
      totalBalance: 0,
      savingsPercent: 20,
      isOnboarded: false,
      expenses: defaultExpenses,
      statementUploaded: false,
    });

    return res.json({ message: 'Financial profile reset successfully', user: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to reset profile.' });
  }
});

// POST /api/user/clear-all
router.post('/clear-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;

    // 1. Wipe all user transactions, goals, and portfolio assets
    await db.clearAllUserData(userEmail);

    // 2. Reset financial numbers and statement state on user profile
    const defaultExpenses = [
      { name: 'Rent', amount: 0, color: '#a78bfa' },
      { name: 'Food', amount: 0, color: '#f472b6' },
      { name: 'Transport', amount: 0, color: '#60a5fa' },
      { name: 'Utilities', amount: 0, color: '#34d399' },
      { name: 'Entertainment', amount: 0, color: '#fbbf24' },
      { name: 'Other', amount: 0, color: '#94a3b8' },
    ];

    const updated = await db.updateUser(userEmail, {
      monthlyIncome: 0,
      totalBalance: 0,
      savingsPercent: 20,
      isOnboarded: false,
      expenses: defaultExpenses,
      statementUploaded: false,
      statementUploadsCount: 0,
    });

    return res.json({
      message: 'All transactions, goals, and financial data have been permanently cleared.',
      user: updated,
    });
  } catch (error: any) {
    console.error('[User] Clear all data error:', error);
    return res.status(500).json({ error: 'Failed to clear all data.' });
  }
});

export default router;
