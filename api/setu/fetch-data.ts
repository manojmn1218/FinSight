// ═══════════════════════════════════════════════
// Vercel Serverless: Fetch FI Data from Setu AA
// POST /api/setu/fetch-data
// ═══════════════════════════════════════════════

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SETU_BASE_URL = process.env.SETU_BASE_URL || 'https://aa-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;

const HEADERS = {
  'Content-Type': 'application/json',
  'x-client-id': SETU_CLIENT_ID || '',
  'x-client-secret': SETU_CLIENT_SECRET || '',
  'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID || '',
};

/**
 * Wait for a specified duration
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET || !SETU_PRODUCT_INSTANCE_ID) {
    return res.status(500).json({ error: 'Setu API credentials not configured.' });
  }

  const { consentId } = req.body || {};
  if (!consentId) {
    return res.status(400).json({ error: 'consentId is required.' });
  }

  try {
    // Step 1: Create a data session
    const now = new Date();
    const dataFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago

    const sessionBody = {
      consentId,
      DataRange: {
        from: dataFrom.toISOString(),
        to: now.toISOString(),
      },
      format: 'json',
    };

    const sessionRes = await fetch(`${SETU_BASE_URL}/sessions`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(sessionBody),
    });

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      console.error('[Setu] Session creation failed:', sessionRes.status, errorText);
      return res.status(sessionRes.status).json({
        error: `Failed to create data session: ${sessionRes.statusText}`,
      });
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.id;

    if (!sessionId) {
      return res.status(500).json({ error: 'No session ID received from Setu.' });
    }

    // Step 2: Poll for data readiness (max 30s with 3s intervals)
    let fiData = null;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await delay(3000);

      const fetchRes = await fetch(`${SETU_BASE_URL}/sessions/${sessionId}`, {
        method: 'GET',
        headers: HEADERS,
      });

      if (!fetchRes.ok) {
        console.warn(`[Setu] Data fetch attempt ${attempt + 1} failed:`, fetchRes.status);
        continue;
      }

      const fetchData = await fetchRes.json();
      const status = fetchData.status;

      if (status === 'COMPLETED' || status === 'PARTIAL' || status === 'READY' || status === 'DELIVERED') {
        // Data is available
        fiData = fetchData;
        break;
      }

      if (status === 'FAILED' || status === 'EXPIRED' || status === 'REJECTED') {
        return res.status(400).json({
          error: `Data fetch ${status.toLowerCase()}. The bank may not have responded in time.`,
        });
      }

      // Status is still PENDING — continue polling
    }

    if (!fiData) {
      return res.status(408).json({
        error: 'Data fetch timed out. The bank did not respond in time. Please try again.',
      });
    }

    // Return the raw FI data — the frontend will transform it
    return res.status(200).json({
      fiData: fiData.fips || fiData.Payload || fiData,
      sessionId,
      status: fiData.status,
    });
  } catch (err: unknown) {
    console.error('[Setu] Data fetch error:', err);
    return res.status(500).json({
      error: 'Failed to fetch bank data. Please try again.',
    });
  }
}
