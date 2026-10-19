import { Router } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';

const router = Router();
const PYTHON_CHATBOT_URL = process.env.PYTHON_CHATBOT_URL || 'http://127.0.0.1:5005';

router.post('/message', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Fetch up-to-date user context from database
    const [txns, goals] = await Promise.all([
      db.getTransactions(user.email).catch(() => []),
      db.getGoals(user.email).catch(() => []),
    ]);

    const userContext = {
      name: user.name || 'User',
      email: user.email,
      totalBalance: user.totalBalance ?? 0,
      monthlyIncome: user.monthlyIncome ?? 0,
      monthlyExpenses: user.monthlyExpenses ?? 0,
      savingsPercent: user.savingsPercent ?? 0,
      plan: user.plan || 'basic',
      recentTransactions: txns.slice(0, 15).map(t => ({
        date: t.date,
        amount: t.amount,
        category: t.category,
        description: t.description || 'Transaction',
      })),
      goals: goals.map(g => ({
        name: g.name,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        deadline: g.deadline,
      })),
    };

    // Forward to Python microservice
    try {
      const response = await fetch(`${PYTHON_CHATBOT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          conversationHistory: conversationHistory || [],
          userContext,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python Chatbot responded with status ${response.status}`);
      }

      const data = await response.json();
      res.json({
        reply: data.reply,
        provider: data.provider,
        isOutOfScope: data.isOutOfScope,
        timestamp: new Date().toISOString(),
      });
    } catch (pythonErr) {
      console.warn('[Chatbot Route] Python service unreachable, using local fallback:', pythonErr);
      const lowerMsg = message.toLowerCase();
      let fallbackReply = "Cannot say. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details.";

      if (lowerMsg.includes('balance')) {
        fallbackReply = `Your current statement balance is **₹${(user.totalBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.`;
      } else if (lowerMsg.includes('income')) {
        fallbackReply = `Your recorded monthly income is **₹${(user.monthlyIncome ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.`;
      } else if (lowerMsg.includes('expense') || lowerMsg.includes('spend')) {
        fallbackReply = `Your recorded monthly expenses are **₹${(user.monthlyExpenses ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.`;
      } else if (lowerMsg.includes('upload') || lowerMsg.includes('statement')) {
        fallbackReply = `You can upload bank statements by visiting the **Transactions** page (\`/transactions\`) and dragging your PDF statement into the upload box.`;
      } else if (lowerMsg.includes('goal')) {
        if (goals.length > 0) {
          fallbackReply = `You have ${goals.length} active financial goals:\n` + goals.map(g => `• **${g.name}**: ₹${g.currentAmount} of ₹${g.targetAmount}`).join('\n');
        } else {
          fallbackReply = `You haven't set any savings goals yet. You can create one on the **Goals** page (\`/goals\`).`;
        }
      }

      res.json({
        reply: fallbackReply,
        provider: 'express-local-fallback',
        isOutOfScope: fallbackReply.startsWith('Cannot say'),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: unknown) {
    console.error('[Chatbot Route Error]:', err);
    res.status(500).json({ error: 'Internal chatbot server error' });
  }
});

export default router;
