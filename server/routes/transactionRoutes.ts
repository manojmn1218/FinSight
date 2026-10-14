import { Router, Response } from 'express';
import { db } from '../config/db';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/transactions
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const transactions = await db.getTransactions(userEmail);
    return res.json({ transactions });
  } catch (error: any) {
    console.error('[Transactions] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
});

// POST /api/transactions
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const { transactions, transaction } = req.body;

    const listToInsert = Array.isArray(transactions)
      ? transactions
      : transaction
      ? [transaction]
      : [];

    if (listToInsert.length === 0) {
      return res.status(400).json({ error: 'No transaction data provided.' });
    }

    const inserted = await db.addTransactions(userEmail, listToInsert);

    // If transactions were imported, update statementUploaded flag
    const currentUser = await db.findUserByEmail(userEmail);
    if (currentUser) {
      const newCount = (currentUser.statementUploadsCount || 0) + (Array.isArray(transactions) ? 1 : 0);
      await db.updateUser(userEmail, {
        statementUploaded: true,
        statementUploadsCount: newCount,
      });
    }

    return res.status(201).json({
      message: `Successfully processed ${inserted.length} transaction(s)`,
      transactions: inserted,
    });
  } catch (error: any) {
    console.error('[Transactions] Add error:', error);
    return res.status(500).json({ error: 'Failed to save transactions.' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const txnId = req.params.id;
    const updates = req.body;

    const updated = await db.updateTransaction(userEmail, txnId, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    return res.json({ message: 'Transaction updated successfully', transaction: updated });
  } catch (error: any) {
    console.error('[Transactions] Update error:', error);
    return res.status(500).json({ error: 'Failed to update transaction.' });
  }
});

// DELETE /api/transactions — clear all transactions for current user
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const deletedCount = await db.clearTransactions(userEmail);
    return res.json({ message: `Successfully cleared ${deletedCount} transaction(s)`, deletedCount });
  } catch (error: any) {
    console.error('[Transactions] Clear all error:', error);
    return res.status(500).json({ error: 'Failed to clear transactions.' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const txnId = req.params.id;

    const success = await db.deleteTransaction(userEmail, txnId);
    if (!success) {
      return res.status(404).json({ error: 'Transaction not found or already deleted.' });
    }

    return res.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('[Transactions] Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete transaction.' });
  }
});

export default router;
