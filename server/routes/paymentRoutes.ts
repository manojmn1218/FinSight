import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { authenticateToken, type AuthenticatedRequest } from '../middleware/auth';
import { db } from '../config/db';
import type { PaymentDocument } from '../types';

const router = Router();

// Pricing definition in Paise (1 INR = 100 paise)
const PRICING_PAISE: Record<'pro' | 'wealth', { monthly: number; yearly: number }> = {
  pro: {
    monthly: 99 * 100, // ₹99 -> 9900 paise
    yearly: 990 * 100, // ₹990 -> 99000 paise
  },
  wealth: {
    monthly: 149 * 100, // ₹149 -> 14900 paise
    yearly: 1490 * 100, // ₹1490 -> 149000 paise
  },
};

/**
 * Returns a configured Razorpay instance or null if credentials are not set.
 */
function getRazorpayInstance(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) {
    return null;
  }

  return new Razorpay({ key_id, key_secret });
}

/**
 * GET /api/payment/config
 * Returns public Razorpay configuration for client initialization.
 */
router.get('/config', (_req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || '';
  const isConfigured = !!(keyId && process.env.RAZORPAY_KEY_SECRET?.trim());

  res.json({
    isConfigured,
    keyId,
    currency: 'INR',
    plans: {
      pro: {
        monthly: 99,
        yearly: 990,
      },
      wealth: {
        monthly: 149,
        yearly: 1490,
      },
    },
  });
});

/**
 * POST /api/payment/create-order
 * Creates a new Razorpay order for subscription checkout.
 */
router.post('/create-order', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const { planId, billingCycle } = req.body;

    if (!planId || !['pro', 'wealth'].includes(planId.toLowerCase())) {
      res.status(400).json({ error: 'Invalid plan selected. Choose "pro" or "wealth".' });
      return;
    }

    const cycle: 'monthly' | 'yearly' = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const targetPlanKey = planId.toLowerCase() as 'pro' | 'wealth';
    const amountInPaise = PRICING_PAISE[targetPlanKey][cycle];

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      res.status(400).json({
        error: 'Razorpay payment gateway is not configured. Please supply RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.',
        isConfigured: false,
      });
      return;
    }

    const shortReceipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.random().toString(36).slice(-4)}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: shortReceipt,
      notes: {
        userEmail,
        planId: targetPlanKey,
        billingCycle: cycle,
        appName: 'FinSight',
      },
    });

    console.log(`💳 [Razorpay] Order created: ${order.id} for ${userEmail} (${targetPlanKey} - ${cycle} - ₹${amountInPaise / 100})`);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID?.trim(),
      planId: targetPlanKey,
      planName: targetPlanKey === 'wealth' ? 'Wealth' : 'Pro',
      billingCycle: cycle,
      amountInRupees: amountInPaise / 100,
    });
  } catch (err: any) {
    console.error('[Razorpay Order Creation Error]:', err);
    res.status(500).json({
      error: err.message || 'Failed to initialize payment order with Razorpay.',
    });
  }
});

/**
 * POST /api/payment/verify-payment
 * Cryptographically verifies Razorpay payment signature and upgrades user plan.
 */
router.post('/verify-payment', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      billingCycle,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ error: 'Missing payment signature verification parameters.' });
      return;
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
    if (!keySecret) {
      res.status(500).json({ error: 'Server Razorpay secret is not configured in .env.' });
      return;
    }

    // Cryptographic verification of Razorpay HMAC SHA256 signature
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );

    if (!isMatch) {
      console.warn(`🚨 [Razorpay Security] Signature mismatch for order: ${razorpay_order_id}`);
      res.status(400).json({ error: 'Invalid payment signature. Payment verification failed.' });
      return;
    }

    // Signature verified!
    const targetPlanKey = (planId || 'pro').toLowerCase() as 'pro' | 'wealth';
    const updatedPlanName = targetPlanKey === 'wealth' ? 'Wealth' : 'Pro';
    const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const amountInRupees = PRICING_PAISE[targetPlanKey][cycle] / 100;

    // 1. Upgrade user tier in database
    const updatedUser = await db.updateUser(userEmail, {
      currentPlan: updatedPlanName,
    });

    // 2. Persist transaction record
    const paymentRecord: PaymentDocument = {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(-4)}`,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      userEmail,
      planId: targetPlanKey,
      billingCycle: cycle,
      amount: amountInRupees,
      currency: 'INR',
      status: 'paid',
      receipt: `RCPT-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    await db.recordPayment(paymentRecord);

    console.log(`🎉 [Razorpay Payment Success] ${userEmail} upgraded to ${updatedPlanName} (Payment ID: ${razorpay_payment_id})`);

    res.json({
      success: true,
      message: `Congratulations! Your subscription has been activated and upgraded to ${updatedPlanName}.`,
      plan: updatedPlanName,
      payment: paymentRecord,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error('[Razorpay Payment Verification Error]:', err);
    res.status(500).json({
      error: err.message || 'Payment signature verification encountered an internal error.',
    });
  }
});

/**
 * GET /api/payment/history
 * Returns payment history for the authenticated user.
 */
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userEmail = req.user?.email;
    const history = await db.getPayments(userEmail);
    res.json({ payments: history });
  } catch (err: any) {
    console.error('[Razorpay History Fetch Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve payment history.' });
  }
});

export default router;
