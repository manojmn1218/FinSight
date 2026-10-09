// ═══════════════════════════════════════════════
// Vercel Serverless: Setu AA Webhook Handler
// POST /api/setu/webhook
// ═══════════════════════════════════════════════
//
// Receives notification callbacks from Setu when:
// - User approves/rejects consent
// - FIP data is ready for fetching
//
// In a production app, you could store these in a database
// and trigger push notifications to the user.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const event = req.body;

  if (!event) {
    return res.status(400).json({ error: 'Empty webhook payload' });
  }

  // Log the event for debugging
  console.log('[Setu Webhook] Received notification:', JSON.stringify(event, null, 2));

  // Determine event type
  const eventType = event.type || event.eventType || 'UNKNOWN';
  const consentId = event.consentId || event.data?.consentId;
  const sessionId = event.sessionId || event.data?.sessionId;
  const status = event.status || event.data?.status;

  console.log(`[Setu Webhook] Event: ${eventType}, ConsentId: ${consentId}, SessionId: ${sessionId}, Status: ${status}`);

  // Handle specific events
  switch (eventType) {
    case 'CONSENT_STATUS_UPDATE':
      console.log(`[Setu Webhook] Consent ${consentId} status changed to: ${status}`);
      // In production: Update database, send push notification
      break;

    case 'FI_DATA_READY':
      console.log(`[Setu Webhook] Data ready for session ${sessionId}`);
      // In production: Trigger data fetch, notify user
      break;

    case 'SESSION_STATUS_UPDATE':
      console.log(`[Setu Webhook] Session ${sessionId} status changed to: ${status}`);
      break;

    default:
      console.log(`[Setu Webhook] Unhandled event type: ${eventType}`);
  }

  // Always respond 200 to acknowledge receipt
  return res.status(200).json({ success: true, received: eventType });
}
