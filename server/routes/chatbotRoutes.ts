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
    const [txns, goals, portfolio] = await Promise.all([
      db.getTransactions(user.email).catch(() => []),
      db.getGoals(user.email).catch(() => []),
      db.getPortfolio(user.email).catch(() => []),
    ]);

    // Financial calculations & aggregations for deep accounting intelligence
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    let totalDebits = 0;
    let totalCredits = 0;
    let largestExpense = { description: 'None', amount: 0, date: '' };
    const recurringTxns: Array<{ description: string; amount: number; category: string }> = [];

    for (const t of txns) {
      if (t.amount < 0) {
        const absAmt = Math.abs(t.amount);
        totalDebits += absAmt;
        const cat = t.category || 'Other';
        if (!categoryTotals[cat]) {
          categoryTotals[cat] = { total: 0, count: 0 };
        }
        categoryTotals[cat].total += absAmt;
        categoryTotals[cat].count += 1;

        if (absAmt > largestExpense.amount) {
          largestExpense = { description: t.description || 'Expense', amount: absAmt, date: t.date };
        }
        if (t.isRecurring) {
          recurringTxns.push({ description: t.description, amount: absAmt, category: cat });
        }
      } else if (t.amount > 0) {
        totalCredits += t.amount;
      }
    }

    const topCategories = Object.entries(categoryTotals)
      .map(([category, { total, count }]) => ({ category, total: Math.round(total * 100) / 100, count }))
      .sort((a, b) => b.total - a.total);

    const income = user.monthlyIncome ?? 0;
    const expenses = user.monthlyExpenses ?? Math.round(totalDebits);
    const surplus = Math.max(0, income - expenses);
    const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : (user.savingsPercent ?? 0);

    // Budget Health Score calculation (0 - 100)
    let healthScore = 50;
    if (income > 0) {
      if (savingsRate >= 30) healthScore += 30;
      else if (savingsRate >= 20) healthScore += 20;
      else if (savingsRate >= 10) healthScore += 10;
      else healthScore -= 10;

      if ((user.totalBalance ?? 0) > expenses * 3) healthScore += 20;
      else if ((user.totalBalance ?? 0) > expenses) healthScore += 10;
    }
    healthScore = Math.min(100, Math.max(10, healthScore));

    const uploadCount = user.statementUploadsCount || 0;
    const currentPlan = (user.currentPlan || user.plan || 'Basic').toLowerCase();
    const uploadsRemaining = currentPlan === 'basic' ? Math.max(0, 3 - uploadCount) : 'Unlimited';

    const goalsAnalysis = goals.map(g => {
      const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      return {
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        remaining,
        percentComplete: pct,
        deadline: g.deadline || 'No deadline set',
      };
    });

    const portfolioAssetsTotal = portfolio.reduce((sum, a) => sum + (a.shares * a.avgBuyPrice), 0);

    const userContext = {
      name: user.name || 'User',
      email: user.email,
      totalBalance: user.totalBalance ?? 0,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlySurplus: surplus,
      savingsPercent: savingsRate,
      budgetHealthScore: healthScore,
      plan: currentPlan,
      statementUploadsCount: uploadCount,
      uploadsRemaining,
      phoneVerified: !!user.phone,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      netCashFlow: Math.round((totalCredits - totalDebits) * 100) / 100,
      largestExpense,
      categorySpending: categoryTotals,
      topCategories,
      recurringSubscriptions: recurringTxns,
      goals: goalsAnalysis,
      portfolioAssetsCount: portfolio.length,
      portfolioAssetsTotal: Math.round(portfolioAssetsTotal * 100) / 100,
      recentTransactions: txns.slice(0, 20).map(t => ({
        date: t.date,
        amount: t.amount,
        category: t.category,
        description: t.description || 'Transaction',
        balance: t.balance,
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

      function getDynamicRefusal(rawMsg: string): string {
        const m = rawMsg.toLowerCase();
        if (/weather|temperature|forecast|rain|climate/.test(m)) {
          return "I cannot provide weather updates. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details. Let me know if you would like to check your balance, recent expenses, or savings goals instead!";
        }
        if (/code|coding|python|javascript|typescript|java|c\+\+|script|algorithm|bug|function/.test(m)) {
          return "I cannot assist with coding, programming, or software scripts. As FinSight's dedicated assistant, my role is strictly to help you manage your financial accounts, statement transactions, and budget health on FinSight.";
        }
        if (/cricket|football|fifa|ipl|olympics|sports|match|score|tournament/.test(m)) {
          return "I don't have information on sports match scores or tournament winners. As FinSight's dedicated AI assistant, I only answer questions regarding the FinSight platform and your personal financial records.";
        }
        if (/recipe|cook|bake|ingredients|biryani|dish|cuisine/.test(m)) {
          return "I cannot assist with cooking recipes or culinary questions. As FinSight's financial assistant, I am designed to assist you with your bank statements, expense tracking, and savings milestones.";
        }
        if (/movie|film|actor|actress|cinema|song|music|celebrity/.test(m)) {
          return "I cannot provide information about movies, celebrities, or entertainment. As FinSight's dedicated AI co-pilot, I only answer questions related to the FinSight website and your personal financial accounts.";
        }
        if (/president|minister|politics|election|government|parliament/.test(m)) {
          return "I cannot answer questions regarding world politics or government officials. As FinSight's dedicated assistant, my role is strictly focused on your FinSight account and financial health.";
        }
        if (/capital of|where is|geography|country of|continent/.test(m)) {
          return "I cannot answer questions about world geography, countries, or capitals. As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details.";
        }
        const snippet = rawMsg.trim().slice(0, 50);
        return `I cannot answer questions regarding "${snippet}". As FinSight's dedicated AI assistant, I only answer questions related to the FinSight website, its features, and your personal account details. Let me know if you need help with your budget, transactions, or goals!`;
      }

      let fallbackReply = getDynamicRefusal(message);

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

      const isOut = fallbackReply.startsWith('I cannot') || fallbackReply.startsWith("I don't");

      res.json({
        reply: fallbackReply,
        provider: 'express-local-fallback',
        isOutOfScope: isOut,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: unknown) {
    console.error('[Chatbot Route Error]:', err);
    res.status(500).json({ error: 'Internal chatbot server error' });
  }
});

export default router;
