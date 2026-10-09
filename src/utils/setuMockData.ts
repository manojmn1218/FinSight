// ═══════════════════════════════════════════════
// Setu AA Mock Data — For Development & Testing
// ═══════════════════════════════════════════════
//
// Realistic mock data matching Setu's FI DEPOSIT schema.
// Used when SETU_CLIENT_ID is not configured or in dev mode.

import type { SetuFIData } from './types';

/**
 * Generate a mock consent response (simulates Setu POST /consents)
 */
export function getMockConsentResponse() {
  const consentId = 'mock_consent_' + Date.now().toString(36);
  return {
    consentId,
    status: 'PENDING' as const,
    redirectUrl: `${window.location.origin}/transactions?setu_consent=mock_approved&consentId=${consentId}`,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate a mock consent status (simulates Setu GET /consents/:id)
 */
export function getMockConsentStatus(consentId: string) {
  return {
    consentId,
    status: 'APPROVED' as const,
  };
}

// Helper to generate dates relative to today
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

let balanceTracker = 87450.25;
function txn(
  type: 'DEBIT' | 'CREDIT',
  amount: number,
  narration: string,
  mode: string,
  daysBack: number
): { type: 'DEBIT' | 'CREDIT'; mode: string; amount: number; currentBalance: string; transactionTimestamp: string; valueDate: string; txnId: string; narration: string; reference: string } {
  if (type === 'CREDIT') balanceTracker += amount;
  else balanceTracker -= amount;
  return {
    type,
    mode,
    amount,
    currentBalance: balanceTracker.toFixed(2),
    transactionTimestamp: daysAgo(daysBack),
    valueDate: daysAgo(daysBack),
    txnId: 'TXN' + Math.random().toString(36).slice(2, 10).toUpperCase(),
    narration,
    reference: 'REF' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
}

/**
 * Get realistic mock FI DEPOSIT data (simulates Setu data session response)
 */
export function getMockFIData(): SetuFIData {
  // Reset balance tracker
  balanceTracker = 87450.25;

  return {
    account: {
      linkedAccRef: 'mock-acc-ref-001',
      maskedAccNumber: 'XXXX XXXX 4523',
      type: 'SAVINGS',
      profile: {
        holders: {
          holder: [
            {
              name: 'Manoj Kumar',
              email: 'manoj@example.com',
              mobile: '9876543210',
              pan: 'ABCDE1234F',
            },
          ],
        },
      },
      summary: {
        currentBalance: '87450.25',
        currency: 'INR',
        branch: 'Hyderabad - Gachibowli',
        facility: 'OD',
        ifscCode: 'HDFC0001234',
        openingDate: '2022-03-15',
        status: 'ACTIVE',
        type: 'SAVINGS',
      },
      transactions: {
        transaction: [
          // --- Salary ---
          txn('CREDIT', 65000.00, 'NEFT-SALARY-TECHCORP INDIA PVT LTD-JUL 2026', 'NEFT', 2),
          txn('CREDIT', 65000.00, 'NEFT-SALARY-TECHCORP INDIA PVT LTD-JUN 2026', 'NEFT', 32),
          txn('CREDIT', 65000.00, 'NEFT-SALARY-TECHCORP INDIA PVT LTD-MAY 2026', 'NEFT', 62),

          // --- Rent ---
          txn('DEBIT', 15000.00, 'UPI-TRANSFER TO LANDLORD-HOUSE RENT JULY', 'UPI', 3),
          txn('DEBIT', 15000.00, 'UPI-TRANSFER TO LANDLORD-HOUSE RENT JUNE', 'UPI', 33),
          txn('DEBIT', 15000.00, 'UPI-TRANSFER TO LANDLORD-HOUSE RENT MAY', 'UPI', 63),

          // --- Food & Dining ---
          txn('DEBIT', 547.00, 'UPI-SWIGGY-ORDER#SW789456', 'UPI', 1),
          txn('DEBIT', 320.00, 'UPI-ZOMATO-ORDER#ZM456123', 'UPI', 4),
          txn('DEBIT', 1250.00, 'POS-BARBEQUE NATION-GACHIBOWLI', 'POS', 7),
          txn('DEBIT', 180.00, 'UPI-CHAI POINT-TEA AND SNACKS', 'UPI', 10),
          txn('DEBIT', 890.00, 'UPI-DOMINOS PIZZA-ORDER#DP123', 'UPI', 15),
          txn('DEBIT', 450.00, 'POS-STARBUCKS-HITECH CITY', 'POS', 20),

          // --- Shopping ---
          txn('DEBIT', 2999.00, 'AMAZON PAY-AMAZON.IN-ORDER#AMZ789', 'UPI', 5),
          txn('DEBIT', 1599.00, 'UPI-FLIPKART-ORDER#FK456', 'UPI', 12),
          txn('DEBIT', 799.00, 'UPI-MYNTRA-CLOTHING PURCHASE', 'UPI', 25),
          txn('DEBIT', 3500.00, 'POS-CROMA-ELECTRONICS STORE', 'POS', 40),

          // --- Transport ---
          txn('DEBIT', 250.00, 'UPI-UBER INDIA-TRIP#UB789', 'UPI', 1),
          txn('DEBIT', 180.00, 'UPI-OLA CABS-RIDE#OL456', 'UPI', 6),
          txn('DEBIT', 2500.00, 'UPI-BHARAT PETROLEUM-FUEL', 'UPI', 8),
          txn('DEBIT', 350.00, 'UPI-RAPIDO-AUTO RIDE', 'UPI', 14),
          txn('DEBIT', 1200.00, 'IRCTC-RAILWAY TICKET-PNR#123456', 'NEFT', 22),

          // --- Utilities ---
          txn('DEBIT', 1850.00, 'NACH-ELECTRICITY BILL-TSSPDCL', 'NACH', 5),
          txn('DEBIT', 599.00, 'UPI-JIO RECHARGE-PREPAID', 'UPI', 9),
          txn('DEBIT', 999.00, 'NACH-BROADBAND-ACT FIBERNET', 'NACH', 11),

          // --- Subscriptions ---
          txn('DEBIT', 649.00, 'NACH-NETFLIX INDIA-MONTHLY', 'NACH', 3),
          txn('DEBIT', 119.00, 'NACH-SPOTIFY INDIA-MONTHLY', 'NACH', 3),
          txn('DEBIT', 299.00, 'NACH-YOUTUBE PREMIUM-MONTHLY', 'NACH', 6),

          // --- Health ---
          txn('DEBIT', 1500.00, 'UPI-APOLLO PHARMACY-MEDICINES', 'UPI', 18),
          txn('DEBIT', 3000.00, 'UPI-CULT FIT-GYM MEMBERSHIP', 'UPI', 30),

          // --- Education ---
          txn('DEBIT', 4999.00, 'UPI-UDEMY-COURSE PURCHASE', 'UPI', 35),

          // --- ATM ---
          txn('DEBIT', 5000.00, 'ATM-CASH WITHDRAWAL-HDFC ATM GACHIBOWLI', 'ATM', 13),
          txn('DEBIT', 2000.00, 'ATM-CASH WITHDRAWAL-SBI ATM HITECH CITY', 'ATM', 28),

          // --- Transfers ---
          txn('DEBIT', 10000.00, 'IMPS-TRANSFER TO SAVINGS-FD ACCOUNT', 'IMPS', 4),
          txn('CREDIT', 5000.00, 'UPI-RECEIVED FROM-FRIEND-BIRTHDAY GIFT', 'UPI', 16),
          txn('CREDIT', 2500.00, 'NEFT-REFUND-AMAZON RETURN', 'NEFT', 21),
          txn('CREDIT', 150.00, 'UPI-CASHBACK-PHONEPE REWARD', 'UPI', 9),
        ],
      },
    },
  };
}
