import { Router, Request, Response } from 'express';

const router = Router();

const SETU_BASE_URL = process.env.SETU_BASE_URL || 'https://aa-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;
const SETU_REDIRECT_URL = process.env.SETU_REDIRECT_URL || 'http://localhost:5173/transactions?setu_consent=callback';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// POST /api/setu/create-consent
router.post('/create-consent', async (req: Request, res: Response) => {
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
    const now = new Date();
    const dataFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const consentBody = {
      consentDuration: { unit: 'MONTH', value: '4' },
      consentMode: 'STORE',
      fetchType: 'ONETIME',
      consentTypes: ['TRANSACTIONS', 'PROFILE', 'SUMMARY'],
      fiTypes: ['DEPOSIT'],
      DataConsumer: { id: SETU_PRODUCT_INSTANCE_ID },
      Customer: { id: `${mobileNumber}@onemoney` },
      Purpose: {
        code: '101',
        refUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
        text: 'Personal Finance Management',
        Category: { type: 'string' },
      },
      FIDataRange: { from: dataFrom.toISOString(), to: now.toISOString() },
      DataLife: { unit: 'MONTH', value: '1' },
      Frequency: { unit: 'MONTH', value: '1' },
      DataFilter: [],
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
      url: data.url,
      status: data.status || 'PENDING',
    });
  } catch (err: any) {
    console.error('[Setu] Consent creation exception:', err);
    return res.status(500).json({ error: 'Failed to create consent request.' });
  }
});

// GET /api/setu/consent-status
router.get('/consent-status', async (req: Request, res: Response) => {
  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET || !SETU_PRODUCT_INSTANCE_ID) {
    return res.status(500).json({ error: 'Setu API credentials not configured.' });
  }

  const consentId = (req.query.consentId as string) || (req.params.consentId as string);
  if (!consentId) {
    return res.status(400).json({ error: 'consentId parameter required.' });
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
      return res.status(response.status).json({ error: `Setu API error: ${response.statusText}`, details: errorText });
    }

    const data = await response.json();
    return res.status(200).json({
      consentId: data.id || consentId,
      status: data.status || 'PENDING',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to check consent status.' });
  }
});

// POST /api/setu/fetch-data
router.post('/fetch-data', async (req: Request, res: Response) => {
  if (!SETU_CLIENT_ID || !SETU_CLIENT_SECRET || !SETU_PRODUCT_INSTANCE_ID) {
    return res.status(500).json({ error: 'Setu API credentials not configured.' });
  }

  const { consentId } = req.body || {};
  if (!consentId) {
    return res.status(400).json({ error: 'consentId is required.' });
  }

  try {
    const now = new Date();
    const dataFrom = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    const headers = {
      'Content-Type': 'application/json',
      'x-client-id': SETU_CLIENT_ID,
      'x-client-secret': SETU_CLIENT_SECRET,
      'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
    };

    const sessionRes = await fetch(`${SETU_BASE_URL}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        consentId,
        DataRange: { from: dataFrom.toISOString(), to: now.toISOString() },
        format: 'json',
      }),
    });

    if (!sessionRes.ok) {
      const errorText = await sessionRes.text();
      return res.status(sessionRes.status).json({ error: `Failed to create data session: ${sessionRes.statusText}`, details: errorText });
    }

    const sessionData = await sessionRes.json();
    const sessionId = sessionData.id;

    if (!sessionId) {
      return res.status(500).json({ error: 'No session ID received from Setu.' });
    }

    let fiData = null;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await delay(3000);
      const fetchRes = await fetch(`${SETU_BASE_URL}/sessions/${sessionId}`, { method: 'GET', headers });
      if (!fetchRes.ok) continue;

      const fetchData = await fetchRes.json();
      const status = fetchData.status;
      if (status === 'COMPLETED' || status === 'PARTIAL' || status === 'READY' || status === 'DELIVERED') {
        fiData = fetchData;
        break;
      }
      if (status === 'FAILED') {
        return res.status(502).json({ error: 'Setu data fetch failed on provider end.' });
      }
    }

    if (!fiData) {
      return res.status(504).json({ error: 'FI data fetch timed out. Please try again later.' });
    }

    return res.status(200).json({
      sessionId,
      status: fiData.status || 'COMPLETED',
      data: fiData.Payload || fiData.payload || fiData,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch financial data.' });
  }
});

// POST /api/setu/webhook
router.post('/webhook', (req: Request, res: Response) => {
  const event = req.body;
  console.log('[Setu Webhook] Received:', event);
  return res.status(200).json({ success: true, received: event?.type || 'UNKNOWN' });
});

export default router;
