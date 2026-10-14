import { Router, Response } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import { parseStatementWithAi, reclassifyTransactionsWithAi } from '../services/aiStatementParser';
import { db } from '../config/db';

const router = Router();

// GET /api/ai/status — check active AI engine status
router.get('/status', (_req, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== 'your_gemini_api_key_here');
  return res.json({
    hasGeminiKey: hasKey,
    activeProvider: hasKey ? 'gemini' : 'heuristic_fallback',
    model: hasKey ? 'gemini-2.5-flash' : 'smart-nlp-engine',
    version: '2.5',
    features: [
      'Automatic Bank Statement OCR/Text Classification',
      'Merchant Entity Normalization',
      'Strict 12-Category Financial Mapping',
      'Debit/Credit Sign Detection',
      'Recurring Subscription Flagging',
    ],
  });
});

// POST /api/ai/configure-key — configure & test Google Gemini API key
router.post('/configure-key', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 15) {
      return res.status(400).json({ error: 'Please provide a valid Google Gemini API key.' });
    }

    const key = apiKey.trim();

    // Verify key with a fast test call to Gemini 2.5 Flash
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });

    try {
      await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Ping test',
        config: { maxOutputTokens: 5 },
      });
    } catch (testErr: any) {
      console.error('[AI Config] Gemini key validation failed:', testErr?.message || testErr);
      return res.status(400).json({
        error: `Gemini API key verification failed: ${testErr?.message || 'Invalid API key or unauthorized'}. Please verify your key at https://aistudio.google.com.`,
      });
    }

    // Set in runtime process.env
    process.env.GEMINI_API_KEY = key;

    // Update .env file safely
    try {
      const fs = await import('fs');
      const path = await import('path');
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let content = fs.readFileSync(envPath, 'utf-8');
        if (content.includes('GEMINI_API_KEY=')) {
          content = content.replace(/GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${key}`);
        } else {
          content += `\nGEMINI_API_KEY=${key}\n`;
        }
        fs.writeFileSync(envPath, content, 'utf-8');
      }
    } catch (envWriteErr) {
      console.warn('[AI Config] Could not persist key to .env file:', envWriteErr);
    }

    return res.json({
      success: true,
      message: 'Google Gemini 2.5 Flash connected and verified successfully!',
      activeProvider: 'gemini',
      model: 'gemini-2.5-flash',
    });
  } catch (error: any) {
    console.error('[AI Config] Setup error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to configure Gemini API key.' });
  }
});

// POST /api/ai/parse-statement — parse raw PDF text lines with Gemini / Fallback
router.post('/parse-statement', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const { lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: "lines" must be a non-empty array of text extracted from the bank statement PDF.',
      });
    }

    // Check user statement upload limits for Basic plan
    const user = await db.findUserByEmail(userEmail);
    if (user && user.currentPlan === 'Basic' && (user.statementUploadsCount || 0) >= 3) {
      return res.status(403).json({
        error: 'Statement upload limit reached: Basic accounts are limited to 3 PDF statement uploads. Upgrade to Pro for unlimited uploads.',
        code: 'UPLOAD_LIMIT_REACHED',
      });
    }

    // Process with AI parser
    const result = await parseStatementWithAi(lines);

    return res.json(result);
  } catch (error: any) {
    console.error('[AI Route] Statement parse error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to parse statement with AI.',
    });
  }
});

// POST /api/ai/reclassify — reclassify existing transactions using AI neural intelligence
router.post('/reclassify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const currentTxns = await db.getTransactions(userEmail);

    if (!currentTxns || currentTxns.length === 0) {
      return res.status(400).json({ error: 'No transactions found to reclassify.' });
    }

    const itemsToClassify = currentTxns.map((t: any) => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      description: t.description,
      rawDescription: t.rawDescription,
      currentCategory: t.category,
    }));

    const result = await reclassifyTransactionsWithAi(itemsToClassify);

    // Apply updates in database
    let updatedCount = 0;
    for (const item of result.items) {
      const updatePayload: Record<string, any> = {
        category: item.category,
        isRecurring: item.isRecurring,
      };
      if (item.cleanMerchant && item.cleanMerchant !== 'Bank Transaction' && item.cleanMerchant !== 'Upi') {
        updatePayload.description = item.cleanMerchant;
      }
      const updated = await db.updateTransaction(userEmail, item.id, updatePayload);
      if (updated) updatedCount++;
    }

    const refreshedTxns = await db.getTransactions(userEmail);

    return res.json({
      message: `Successfully reclassified ${updatedCount} transaction(s) with ${result.model}`,
      provider: result.provider,
      model: result.model,
      transactions: refreshedTxns,
    });
  } catch (error: any) {
    console.error('[AI Reclassify Route] Error:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to reclassify transactions with AI.',
    });
  }
});

export default router;
