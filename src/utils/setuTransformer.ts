// ═══════════════════════════════════════════════
// Setu FI Data → FinSight Transaction Transformer
// ═══════════════════════════════════════════════

import type { Transaction, SetuFIData, SetuFITransaction } from './types';
import { categorizeTransaction } from './transactionParser';

/**
 * Generate a unique transaction ID
 */
function uid(): string {
  return 'setu_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

/**
 * Parse Setu's timestamp format into ISO date (YYYY-MM-DD)
 * Setu uses: "2024-01-15T10:30:00+05:30" or "2024-01-15"
 */
function parseSetuDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // Fallback: try extracting date portion
      const match = timestamp.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}-${match[3]}`;
      return new Date().toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Transform a single Setu FI transaction into a FinSight Transaction
 */
function transformTransaction(setuTxn: SetuFITransaction): Transaction {
  const date = parseSetuDate(setuTxn.transactionTimestamp || setuTxn.valueDate);
  const description = (setuTxn.narration || setuTxn.reference || 'Transaction').trim();
  
  // Amount: negative for DEBIT, positive for CREDIT
  const rawAmount = typeof setuTxn.amount === 'string' 
    ? parseFloat(setuTxn.amount) 
    : setuTxn.amount;
  const amount = setuTxn.type === 'DEBIT' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  
  // Parse balance
  const balance = setuTxn.currentBalance 
    ? parseFloat(String(setuTxn.currentBalance).replace(/,/g, ''))
    : undefined;

  // Categorize using the same keyword engine as PDF parser
  const category = categorizeTransaction(description);

  return {
    id: uid(),
    date,
    description: description.slice(0, 120),
    amount,
    category,
    isRecurring: false,
    balance: isNaN(balance as number) ? undefined : balance,
    source: 'setu',
  };
}

/**
 * Transform full Setu FI DEPOSIT response into FinSight Transaction[]
 * Handles both single account and multi-account responses
 */
export function transformSetuData(fiData: SetuFIData | SetuFIData[]): Transaction[] {
  const accounts = Array.isArray(fiData) ? fiData : [fiData];
  const allTransactions: Transaction[] = [];

  for (const fi of accounts) {
    try {
      const txns = fi?.account?.transactions?.transaction;
      if (!txns || !Array.isArray(txns)) continue;

      for (const setuTxn of txns) {
        try {
          allTransactions.push(transformTransaction(setuTxn));
        } catch (err) {
          console.warn('[SetuTransformer] Skipping malformed transaction:', err);
        }
      }
    } catch (err) {
      console.warn('[SetuTransformer] Skipping malformed account data:', err);
    }
  }

  // Sort by date descending (most recent first)
  allTransactions.sort((a, b) => b.date.localeCompare(a.date));
  return allTransactions;
}

/**
 * Extract account summary info from Setu FI data
 */
export function extractAccountInfo(fiData: SetuFIData) {
  const account = fiData?.account;
  if (!account) return null;

  const holder = account.profile?.holders?.holder?.[0];
  const summary = account.summary;

  return {
    maskedAccNumber: account.maskedAccNumber || 'XXXX',
    accountType: summary?.type || account.type || 'SAVINGS',
    holderName: holder?.name || 'Account Holder',
    balance: summary?.currentBalance ? parseFloat(summary.currentBalance) : 0,
    branch: summary?.branch || '',
    ifsc: summary?.ifscCode || '',
    currency: summary?.currency || 'INR',
    status: summary?.status || 'ACTIVE',
  };
}
