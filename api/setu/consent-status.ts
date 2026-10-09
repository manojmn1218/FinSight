// ═══════════════════════════════════════════════
// Vercel Serverless: Check Setu AA Consent Status
// GET /api/setu/consent-status?consentId=xxx
// ═══════════════════════════════════════════════

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SETU_BASE_URL = process.env.SETU_BASE_URL || 'https://aa-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET || !SETU_PRODUCT_INSTANCE_ID) {
    return res.status(500).json({ error: 'Setu API credentials not configured.' });
  }

  const consentId = req.query.consentId as string;
  if (!consentId) {
    return res.status(400).json({ error: 'consentId query parameter required.' });
  }

  try {
    const response = await fetch(`${SETU_BASE_URL}/consents/${consentId}`, {
      method: 'GET',
      headers: {
        'x-client-id': SETU_CLIENT_ID,
        'x-client-secret': SETU_CLIENT_SECRET,
        'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Setu] Consent status check failed:', response.status, errorText);
      return res.status(response.status).json({
        error: `Setu API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      consentId: data.id || consentId,
      status: data.status || 'PENDING',
    });
  } catch (err: any) {
    console.error('[Setu] Consent status error:', err);
    return res.status(500).json({
      error: 'Failed to check consent status. Please try again.',
    });
  }
}
