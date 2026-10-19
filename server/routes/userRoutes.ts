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

  // Auto-heal totalBalance if 0 but user has statement transactions with running balances
  if (!user.totalBalance || user.totalBalance === 0) {
    const txns = await db.getTransactions(req.user!.email);
    const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
    const lastWithBal = [...sorted].reverse().find(t => {
      if (typeof t.balance === 'number' && !isNaN(t.balance)) return true;
      const raw = t.rawDescription || t.description || '';
      const m = raw.match(/[\d,]+\.\d{2}/g);
      return m && m.length >= 2;
    });

    if (lastWithBal) {
      let bal = lastWithBal.balance;
      if (bal == null) {
        const raw = lastWithBal.rawDescription || lastWithBal.description || '';
        const m = raw.match(/[\d,]+\.\d{2}/g);
        if (m && m.length >= 2) {
          bal = parseFloat(m[m.length - 1].replace(/,/g, ''));
        }
      }
      if (typeof bal === 'number' && !isNaN(bal) && bal >= 0) {
        const rounded = Math.round(bal * 100) / 100;
        await db.updateUser(req.user!.email, { totalBalance: rounded });
        user.totalBalance = rounded;
      }
    }
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
      avatarUrl,
      phone,
      occupation,
      city,
      riskTolerance,
      investmentHorizon,
      currency,
      stealthMode,
      panMasked,
      emergencyMonths,
      financialFocus,
      notifications,
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
    if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl;
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof occupation === 'string') updates.occupation = occupation.trim();
    if (typeof city === 'string') updates.city = city.trim();
    if (typeof riskTolerance === 'string') updates.riskTolerance = riskTolerance;
    if (typeof investmentHorizon === 'string') updates.investmentHorizon = investmentHorizon;
    if (typeof currency === 'string') updates.currency = currency;
    if (typeof stealthMode === 'boolean') updates.stealthMode = stealthMode;
    if (typeof panMasked === 'string') updates.panMasked = panMasked.trim();
    if (typeof emergencyMonths === 'number') updates.emergencyMonths = emergencyMonths;
    if (typeof financialFocus === 'string') updates.financialFocus = financialFocus.trim();
    if (notifications && typeof notifications === 'object') updates.notifications = notifications;

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
