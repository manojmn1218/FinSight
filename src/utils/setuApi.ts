// ═══════════════════════════════════════════════
// Setu AA Frontend API Client
// ═══════════════════════════════════════════════
//
// Calls the Vercel serverless API routes (NOT Setu directly).
// In dev mode with no backend, falls back to mock data.

import type { Transaction } from './types';
import { transformSetuData, extractAccountInfo } from './setuTransformer';
import { getMockConsentResponse, getMockConsentStatus, getMockFIData } from './setuMockData';

// Check if we're in mock/dev mode
const IS_MOCK = import.meta.env.DEV || import.meta.env.VITE_SETU_MOCK === 'true';

export interface ConsentResult {
  consentId: string;
  redirectUrl: string;
  status: string;
}

export interface ConsentStatusResult {
  consentId: string;
  status: string;
}

export interface BankDataResult {
  transactions: Transaction[];
  accountInfo: {
    maskedAccNumber: string;
    accountType: string;
    holderName: string;
    balance: number;
    branch: string;
    ifsc: string;
    currency: string;
    status: string;
  } | null;
}

/**
 * Create a consent request via the backend.
 * User will be redirected to Setu's consent approval screens.
 */
export async function createConsent(mobileNumber: string): Promise<ConsentResult> {
  if (IS_MOCK) {
    // Simulate a short delay
    await delay(1200);
    const mock = getMockConsentResponse();
    return {
      consentId: mock.consentId,
      redirectUrl: mock.redirectUrl,
      status: mock.status,
    };
  }

  const res = await fetch('/api/setu/create-consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobileNumber }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to create consent' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}

/**
 * Check the status of a consent request.
 * Returns PENDING, APPROVED, REJECTED, REVOKED, EXPIRED, or FAILED.
 */
export async function checkConsentStatus(consentId: string): Promise<ConsentStatusResult> {
  if (IS_MOCK) {
    await delay(500);
    return getMockConsentStatus(consentId);
  }

  const res = await fetch(`/api/setu/consent-status?consentId=${encodeURIComponent(consentId)}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to check consent status' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch bank transaction data after consent is approved.
 * Returns transformed Transaction[] ready for FinSight.
 */
export async function fetchBankData(consentId: string): Promise<BankDataResult> {
  if (IS_MOCK) {
    // Simulate data fetching delay
    await delay(2000);
    const mockData = getMockFIData();
    const transactions = transformSetuData(mockData);
    const accountInfo = extractAccountInfo(mockData);
    return { transactions, accountInfo };
  }

  const res = await fetch('/api/setu/fetch-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consentId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch bank data' }));
    throw new Error(err.error || `Server error: ${res.status}`);
  }

  const data = await res.json();

  // If the backend already transformed the data, use it directly.
  // Otherwise, transform on the client side.
  if (data.transactions) {
    return data;
  }

  // Raw Setu data — transform it
  const transactions = transformSetuData(data.fiData);
  const accountInfo = data.fiData ? extractAccountInfo(
    Array.isArray(data.fiData) ? data.fiData[0] : data.fiData
  ) : null;
  return { transactions, accountInfo };
}

/**
 * Poll consent status until it's no longer PENDING.
 * Returns the final status.
 */
export async function pollConsentStatus(
  consentId: string,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
    onPoll?: (status: string) => void;
  }
): Promise<ConsentStatusResult> {
  const interval = options?.intervalMs ?? 3000;
  const timeout = options?.timeoutMs ?? 300000; // 5 minutes default
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await checkConsentStatus(consentId);
    options?.onPoll?.(result.status);

    if (result.status !== 'PENDING') {
      return result;
    }

    await delay(interval);
  }

  return { consentId, status: 'EXPIRED' };
}

// --- Helpers ---
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
