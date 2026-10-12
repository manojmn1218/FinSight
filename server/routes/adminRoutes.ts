import { Router, Response } from 'express';
import { db } from '../config/db';
import { UserModel } from '../models/User';
import { TransactionModel } from '../models/Transaction';
import { GoalModel } from '../models/Goal';
import { AssetModel } from '../models/Asset';
import { localDb } from '../storage/localDb';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Require both valid token AND admin privileges for all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users
router.get('/users', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getAllUsers();
    // Return sanitized users
    const sanitized = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      monthlyIncome: u.monthlyIncome,
      totalBalance: u.totalBalance,
      savingsPercent: u.savingsPercent,
      currentPlan: u.currentPlan,
      expenses: u.expenses,
      isOnboarded: u.isOnboarded,
      isAdmin: u.isAdmin,
      statementUploaded: u.statementUploaded,
      statementUploadsCount: u.statementUploadsCount,
      failedLoginAttempts: u.failedLoginAttempts,
      lockedUntil: u.lockedUntil,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    return res.json({ users: sanitized });
  } catch (error: any) {
    console.error('[Admin] Fetch users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.getAllUsers();
    const totalUsers = users.length;
    const onboardedUsers = users.filter(u => u.isOnboarded).length;
    const proUsers = users.filter(u => u.currentPlan === 'Pro' || u.currentPlan === 'Elite').length;
    const totalBalance = users.reduce((sum, u) => sum + (u.totalBalance || 0), 0);

    return res.json({
      stats: {
        totalUsers,
        onboardedUsers,
        proUsers,
        totalBalance,
        serverUptimeSeconds: Math.floor(process.uptime()),
        database: db.getStatus(),
      },
    });
  } catch (error: any) {
    console.error('[Admin] Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// PUT /api/admin/users/:email
router.put('/users/:email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetEmail = req.params.email.trim().toLowerCase();
    const { currentPlan, isAdmin, unlock } = req.body;

    const updates: Record<string, any> = {};
    if (currentPlan) updates.currentPlan = currentPlan;
    if (typeof isAdmin === 'boolean') updates.isAdmin = isAdmin;
    if (unlock) {
      updates.failedLoginAttempts = 0;
      updates.lockedUntil = null;
    }

    const updated = await db.updateUser(targetEmail, updates);
    if (!updated) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: 'User updated successfully', user: updated });
  } catch (error: any) {
    console.error('[Admin] Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

// GET /api/admin/database/overview
router.get('/database/overview', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const isMongo = db.isMongoActive();
    let collections: Array<{ name: string; count: number }> = [];

    if (isMongo) {
      const [usersCount, txnCount, goalCount, assetCount] = await Promise.all([
        UserModel.countDocuments(),
        TransactionModel.countDocuments(),
        GoalModel.countDocuments(),
        AssetModel.countDocuments(),
      ]);
      collections = [
        { name: 'users', count: usersCount },
        { name: 'transactions', count: txnCount },
        { name: 'goals', count: goalCount },
        { name: 'assets', count: assetCount },
      ];
    } else {
      const state = localDb.getState();
      collections = [
        { name: 'users', count: Object.keys(state.users || {}).length },
        { name: 'transactions', count: Object.values(state.transactions || {}).flat().length },
        { name: 'goals', count: Object.values(state.goals || {}).flat().length },
        { name: 'assets', count: Object.values(state.portfolio || {}).flat().length },
      ];
    }

    return res.json({
      status: db.getStatus(),
      collections,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch database overview' });
  }
});

// GET /api/admin/database/collection/:name
router.get('/database/collection/:name', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const name = req.params.name.toLowerCase();
    const isMongo = db.isMongoActive();
    let documents: any[] = [];

    if (isMongo) {
      if (name === 'users') {
        documents = await UserModel.find().sort({ createdAt: -1 }).limit(100);
      } else if (name === 'transactions') {
        documents = await TransactionModel.find().sort({ date: -1 }).limit(100);
      } else if (name === 'goals') {
        documents = await GoalModel.find().sort({ createdAt: -1 }).limit(100);
      } else if (name === 'assets') {
        documents = await AssetModel.find().sort({ symbol: 1 }).limit(100);
      }
      documents = documents.map(d => (d.toJSON ? d.toJSON() : d));
    } else {
      const state = localDb.getState();
      if (name === 'users') {
        documents = Object.values(state.users || {});
      } else if (name === 'transactions') {
        documents = Object.values(state.transactions || {}).flat();
      } else if (name === 'goals') {
        documents = Object.values(state.goals || {}).flat();
      } else if (name === 'assets') {
        documents = Object.values(state.portfolio || {}).flat();
      }
    }

    return res.json({ collection: name, count: documents.length, documents });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch collection data' });
  }
});

export default router;
