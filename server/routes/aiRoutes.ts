import { Router, Response } from 'express';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import { parseStatementWithAi } from '../services/aiStatementParser';
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

export default router;
