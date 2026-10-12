import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/goals
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const goals = await db.getGoals(userEmail);
    return res.json({ goals });
  } catch (error: any) {
    console.error('[Goals] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch goals.' });
  }
});

// POST /api/goals
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const { name, targetAmount, currentAmount, deadline, color } = req.body;

    if (!name || typeof targetAmount !== 'number') {
      return res.status(400).json({ error: 'Goal name and target amount are required.' });
    }

    const created = await db.addGoal(userEmail, {
      name: String(name).trim(),
      targetAmount,
      currentAmount: typeof currentAmount === 'number' ? currentAmount : 0,
      deadline: deadline || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      color: color || '#818cf8',
    });

    return res.status(201).json({ message: 'Goal created successfully', goal: created });
  } catch (error: any) {
    console.error('[Goals] Create error:', error);
    return res.status(500).json({ error: 'Failed to create goal.' });
  }
});

// PUT /api/goals/:id
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const goalId = req.params.id;
    const updates = req.body;

    const updated = await db.updateGoal(userEmail, goalId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Goal not found.' });
    }

    return res.json({ message: 'Goal updated successfully', goal: updated });
  } catch (error: any) {
    console.error('[Goals] Update error:', error);
    return res.status(500).json({ error: 'Failed to update goal.' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const goalId = req.params.id;

    const success = await db.deleteGoal(userEmail, goalId);
    if (!success) {
      return res.status(404).json({ error: 'Goal not found or already deleted.' });
    }

    return res.json({ message: 'Goal deleted successfully' });
  } catch (error: any) {
    console.error('[Goals] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete goal.' });
  }
});

export default router;
