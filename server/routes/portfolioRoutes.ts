import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/portfolio
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const assets = await db.getPortfolio(userEmail);
    return res.json({ assets });
  } catch (error: any) {
    console.error('[Portfolio] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch portfolio.' });
  }
});

// POST /api/portfolio
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const { assets } = req.body;

    if (!Array.isArray(assets)) {
      return res.status(400).json({ error: 'Assets must be an array.' });
    }

    const saved = await db.savePortfolio(userEmail, assets);
    return res.json({ message: 'Portfolio saved successfully', assets: saved });
  } catch (error: any) {
    console.error('[Portfolio] Save error:', error);
    return res.status(500).json({ error: 'Failed to save portfolio.' });
  }
});

export default router;
