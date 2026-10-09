// ═══════════════════════════════════════════════
// Vercel Serverless: Create Setu AA Consent
// POST /api/setu/create-consent
// ═══════════════════════════════════════════════

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SETU_BASE_URL = process.env.SETU_BASE_URL || 'https://aa-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;
const SETU_REDIRECT_URL = process.env.SETU_REDIRECT_URL || 'http://localhost:5173/transactions?setu_consent=callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate credentials are configured
  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET || !SETU_PRODUCT_INSTANCE_ID) {
    return res.status(500).json({
      error: 'Setu API credentials not configured. Please set SETU_CLIENT_ID, SETU_CLIENT_SECRET, and SETU_PRODUCT_INSTANCE_ID in environment variables.',
    });
  }

  const { mobileNumber } = req.body || {};
  if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
    return res.status(400).json({ error: 'Valid 10-digit Indian mobile number required.' });
  }

  try {
    // Build the consent object per Setu AA spec
    const now = new Date();
    const consentExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now
    const dataFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago

    const consentBody = {
      consentDuration: {
        unit: 'MONTH',
        value: '4',
      },
      consentMode: 'STORE',
      fetchType: 'ONETIME',
      consentTypes: ['TRANSACTIONS', 'PROFILE', 'SUMMARY'],
      fiTypes: ['DEPOSIT'],
      DataConsumer: {
        id: SETU_PRODUCT_INSTANCE_ID,
      },
      Customer: {
        id: `${mobileNumber}@onemoney`,
      },
      Purpose: {
        code: '101',
        refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
        text: 'Personal Finance Management',
        Category: {
          type: 'string',
        },
      },
      FIDataRange: {
        from: dataFrom.toISOString(),
        to: now.toISOString(),
      },
      DataLife: {
        unit: 'MONTH',
        value: '2',
      },
      Frequency: {
        unit: 'MONTH',
        value: '1',
      },
      redirectUrl: SETU_REDIRECT_URL,
    };

    const response = await fetch(`${SETU_BASE_URL}/consents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': SETU_CLIENT_ID,
        'x-client-secret': SETU_CLIENT_SECRET,
        'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
      },
      body: JSON.stringify(consentBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Setu] Consent creation failed:', response.status, errorText);
      return res.status(response.status).json({
        error: `Setu API error: ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      consentId: data.id,
      redirectUrl: data.url,
      status: data.status || 'PENDING',
    });
  } catch (err: any) {
    console.error('[Setu] Consent creation error:', err);
    return res.status(500).json({
      error: 'Failed to create consent request. Please try again.',
    });
  }
}
