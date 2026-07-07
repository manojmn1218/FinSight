// ═══════════════════════════════════════════════
// PDF Transaction Parser & Categorizer
// ═══════════════════════════════════════════════

import type { Transaction, Category } from './types';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// --- Categorization keyword map ---
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  'Food & Dining': [
    'swiggy', 'zomato', 'restaurant', 'cafe', 'dominos', 'pizza', 'starbucks',
    'mcdonalds', 'kfc', 'burger', 'food', 'dining', 'bakery', 'biryani',
    'chai', 'tea', 'coffee', 'canteen', 'mess', 'hotel', 'dhaba', 'eat',
    'dine', 'subway', 'haldiram', 'barbeque',
  ],
  'Shopping': [
    'amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'market', 'shop',
    'store', 'retail', 'fashion', 'clothing', 'apparel', 'nykaa',
    'meesho', 'snapdeal', 'bigbasket', 'dmart', 'reliance', 'croma',
    'electronics', 'mobile', 'purchase',
  ],
  'Transport': [
    'uber', 'ola', 'rapido', 'metro', 'petrol', 'fuel', 'irctc', 'railway',
    'indian rail', 'bus', 'cab', 'taxi', 'auto', 'rickshaw', 'toll',
    'parking', 'diesel', 'bharat petroleum', 'hp petrol', 'iocl', 'makemytrip',
    'goibibo', 'indigo', 'spicejet', 'vistara', 'air india', 'flight',
  ],
  'Utilities': [
    'electricity', 'water', 'gas', 'broadband', 'jio', 'airtel', 'vi ',
    'vodafone', 'idea', 'bsnl', 'wifi', 'internet', 'mobile recharge',
    'recharge', 'bill payment', 'dth', 'tata sky', 'dish tv', 'postpaid',
    'prepaid', 'piped gas', 'torrent power', 'adani',
  ],
  'Rent': [
    'rent', 'house rent', 'landlord', 'pg ', 'hostel', 'accommodation',
    'flat rent', 'room rent', 'lease', 'tenancy',
  ],
  'Subscriptions': [
    'netflix', 'spotify', 'youtube', 'prime', 'hotstar', 'disney',
    'apple music', 'audible', 'linkedin premium', 'github', 'notion',
    'figma', 'canva', 'adobe', 'microsoft 365', 'google one', 'icloud',
    'subscription', 'membership', 'recurring', 'annual plan',
  ],
  'Health': [
    'hospital', 'pharmacy', 'apollo', 'medplus', 'doctor', 'clinic',
    'medical', 'health', 'diagnostic', 'lab test', 'pathology',
    'dentist', 'physio', 'gym', 'fitness', 'yoga', 'wellness',
    'insurance premium', 'mediclaim', 'pharma', '1mg', 'netmeds',
  ],
  'Education': [
    'school', 'college', 'university', 'udemy', 'coursera', 'unacademy',
    'byju', 'tuition', 'books', 'stationery', 'education', 'course',
    'training', 'exam', 'fees', 'scholarship', 'edx', 'skillshare',
  ],
  'Transfer': [
    'neft', 'imps', 'upi', 'rtgs', 'transfer', 'fund transfer',
    'self transfer', 'to savings', 'to current', 'net banking',
    'mobile banking', 'bank transfer',
  ],
  'ATM': [
    'atm', 'cash withdrawal', 'cash deposit', 'cash',
    'self withdrawal', 'atm withdrawal',
  ],
  'Salary': [
    'salary', 'payroll', 'stipend', 'wages', 'income', 'credited',
    'monthly pay', 'bonus', 'incentive', 'commission', 'freelance',
    'reimbursement', 'refund',
  ],
  'Other': [],
};

/**
 * Categorize a transaction description using keyword matching
 */
export function categorizeTransaction(description: string): Category {
  const lower = description.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'Other') continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return category as Category;
      }
    }
  }
  return 'Other';
}

/**
 * Generate a unique ID
 */
function uid(): string {
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// --- Date parsing ---
const DATE_PATTERNS = [
  /(\d{2})[\/\-](\d{2})[\/\-](\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{4})[\/\-](\d{2})[\/\-](\d{2})/,  // YYYY/MM/DD or YYYY-MM-DD
  /(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i, // DD Mon YYYY
  /(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2})/i, // DD Mon YY
];

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function parseDate(text: string): string | null {
  // DD/MM/YYYY or DD-MM-YYYY
  let m = text.match(DATE_PATTERNS[0]);
  if (m) {
    const [, day, month, year] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // YYYY/MM/DD
  m = text.match(DATE_PATTERNS[1]);
  if (m) {
    const [, year, month, day] = m;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // DD Mon YYYY
  m = text.match(DATE_PATTERNS[2]);
  if (m) {
    const [, day, monthStr, year] = m;
    const month = MONTH_MAP[monthStr.toLowerCase()];
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  // DD Mon YY
  m = text.match(DATE_PATTERNS[3]);
  if (m) {
    const [, day, monthStr, yearShort] = m;
    const month = MONTH_MAP[monthStr.toLowerCase()];
    const year = parseInt(yearShort) > 50 ? `19${yearShort}` : `20${yearShort}`;
    if (month) return `${year}-${month}-${day.padStart(2, '0')}`;
  }

  return null;
}

// --- Amount parsing ---
const AMOUNT_REGEX = /[\d,]+\.\d{2}/g;

function parseAmounts(text: string): number[] {
  const matches = text.match(AMOUNT_REGEX);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(/,/g, '')));
}

/**
 * Determine if a line is a debit (expense) based on keywords
 */
function isDebit(text: string): boolean {
  const lower = text.toLowerCase();
  const debitKeywords = ['dr', 'debit', 'paid', 'purchase', 'withdrawal', 'payment', 'transfer to', 'neft-', 'upi-', 'pos '];
  return debitKeywords.some(kw => lower.includes(kw));
}

function isCredit(text: string): boolean {
  const lower = text.toLowerCase();
  const creditKeywords = ['cr', 'credit', 'received', 'salary', 'deposit', 'refund', 'interest', 'credited', 'transfer from', 'cashback'];
  return creditKeywords.some(kw => lower.includes(kw));
}

/**
 * Extract transactions from raw text lines
 */
export function extractTransactions(lines: string[]): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Merge multi-line entries: if a line has a date, start a new entry; otherwise append to previous
  const mergedLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;

    const hasDate = DATE_PATTERNS.some(p => p.test(trimmed));
    if (hasDate) {
      mergedLines.push(trimmed);
    } else if (mergedLines.length > 0) {
      mergedLines[mergedLines.length - 1] += ' ' + trimmed;
    }
  }

  for (const line of mergedLines) {
    const date = parseDate(line);
    if (!date) continue;

    const amounts = parseAmounts(line);
    if (amounts.length === 0) continue;

    // Build description: remove dates and amounts from the line
    let desc = line;
    // Remove date patterns
    DATE_PATTERNS.forEach(p => { desc = desc.replace(p, ''); });
    // Remove amounts
    amounts.forEach(a => {
      desc = desc.replace(a.toFixed(2), '');
      desc = desc.replace(a.toLocaleString('en-IN', { minimumFractionDigits: 2 }), '');
    });
    // Clean up
    desc = desc.replace(/[,\s]+/g, ' ').replace(/^\s+|\s+$/g, '').replace(/\s{2,}/g, ' ');
    // Remove trailing/leading special chars
    desc = desc.replace(/^[\s\-\/\|]+|[\s\-\/\|]+$/g, '').trim();

    if (desc.length < 2) desc = 'Transaction';

    // Determine amount and type
    let amount: number;
    if (amounts.length >= 2) {
      // Typically: debit amount, credit amount, balance — or debit, balance
      // Use the first non-balance amount
      amount = amounts[0];
    } else {
      amount = amounts[0];
    }

    // Determine sign
    const credit = isCredit(line);
    const debit = isDebit(line);
    if (debit && !credit) {
      amount = -Math.abs(amount);
    } else if (credit && !debit) {
      amount = Math.abs(amount);
    } else {
      // Heuristic: if there are multiple amounts, the smaller one is likely the transaction
      amount = -Math.abs(amount); // default to debit
    }

    const category = categorizeTransaction(desc);

    // Get balance if available (usually the last amount)
    const balance = amounts.length >= 2 ? amounts[amounts.length - 1] : undefined;

    transactions.push({
      id: uid(),
      date,
      description: desc.slice(0, 120), // cap length
      amount,
      category,
      isRecurring: false,
      balance,
    });
  }

  return transactions;
}

/**
 * Custom error thrown when a PDF requires a password to open
 */
export class PasswordRequiredError extends Error {
  constructor() {
    super('This PDF is password-protected. Please enter the password.');
    this.name = 'PasswordRequiredError';
  }
}

/**
 * Parse a PDF file and extract text lines using pdf.js
 */
export async function parsePdfFile(file: File, password?: string): Promise<string[]> {
  // Dynamic import to lazy-load pdf.js
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source using Vite-resolved URL
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

  const arrayBuffer = await file.arrayBuffer();

  // Build document options
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    password: password || undefined,
  });

  let pdf;
  try {
    pdf = await loadingTask.promise;
  } catch (err: any) {
    // pdf.js throws PasswordException when password is needed
    if (
      err?.name === 'PasswordException' ||
      err?.message?.includes('password') ||
      err?.message?.includes('Password')
    ) {
      throw new PasswordRequiredError();
    }
    throw err;
  }

  const allLines: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items by their y-position to reconstruct lines
    const items = content.items as Array<{ str: string; transform: number[] }>;
    const lineMap = new Map<number, string[]>();

    for (const item of items) {
      // y-position is in transform[5], round to group items on same line
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push(item.str);
    }

    // Sort by y descending (PDF coordinates: bottom=0, top=max)
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const lineText = lineMap.get(y)!.join(' ').trim();
      if (lineText) allLines.push(lineText);
    }
  }

  return allLines;
}

/**
 * Full pipeline: File → Transactions
 */
export async function parseStatementPdf(file: File, password?: string): Promise<Transaction[]> {
  const lines = await parsePdfFile(file, password);
  return extractTransactions(lines);
}

/**
 * Detect recurring payments from a set of transactions
 */
export function detectRecurring(transactions: Transaction[]): Transaction[] {
  // Group by similar descriptions
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    // Normalize description for grouping
    const key = tx.description.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const recurringIds = new Set<string>();

  for (const [, txns] of groups) {
    if (txns.length >= 2) {
      // Check if amounts are similar (within 10%)
      const amounts = txns.map(t => Math.abs(t.amount));
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const allSimilar = amounts.every(a => Math.abs(a - avg) / avg < 0.15);

      if (allSimilar) {
        txns.forEach(t => recurringIds.add(t.id));
      }
    }
  }

  return transactions.filter(t => recurringIds.has(t.id));
}

/**
 * Compute month-by-month summaries from transactions
 */
export function computeMonthSummaries(transactions: Transaction[]): Array<{
  month: string;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  categoryBreakdown: Record<string, number>;
}> {
  const monthMap = new Map<string, { income: number; expenses: number; cats: Record<string, number> }>();

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7); // YYYY-MM
    if (!monthMap.has(month)) monthMap.set(month, { income: 0, expenses: 0, cats: {} });
    const m = monthMap.get(month)!;

    if (tx.amount >= 0) {
      m.income += tx.amount;
    } else {
      m.expenses += Math.abs(tx.amount);
      m.cats[tx.category] = (m.cats[tx.category] || 0) + Math.abs(tx.amount);
    }
  }

  const months = [...monthMap.keys()].sort();
  return months.map(month => {
    const d = monthMap.get(month)!;
    const date = new Date(month + '-01');
    return {
      month,
      label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      totalIncome: Math.round(d.income),
      totalExpenses: Math.round(d.expenses),
      netSavings: Math.round(d.income - d.expenses),
      categoryBreakdown: d.cats,
    };
  });
}

/**
 * Grouped recurring payment info for alerts
 */
export interface RecurringGroup {
  description: string;
  category: Category;
  avgAmount: number;
  occurrences: number;
  frequency: 'monthly' | 'weekly' | 'irregular';
  estimatedAnnualCost: number;
  lastDate: string;
  isHighCost: boolean;
}

/**
 * Detect recurring payments grouped by description with frequency and annual cost
 */
export function detectRecurringGrouped(transactions: Transaction[]): RecurringGroup[] {
  const expenses = transactions.filter(t => t.amount < 0);

  // Group by normalized description
  const groups = new Map<string, Transaction[]>();
  for (const tx of expenses) {
    const key = tx.description.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const results: RecurringGroup[] = [];

  for (const [, txns] of groups) {
    if (txns.length < 2) continue;

    // Check if amounts are similar (within 15%)
    const amounts = txns.map(t => Math.abs(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const allSimilar = amounts.every(a => Math.abs(a - avg) / avg < 0.15);

    if (!allSimilar) continue;

    // Determine frequency from date gaps
    const dates = txns.map(t => new Date(t.date).getTime()).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push(Math.round((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)));
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 30;

    let frequency: 'monthly' | 'weekly' | 'irregular' = 'irregular';
    if (avgGap >= 25 && avgGap <= 35) frequency = 'monthly';
    else if (avgGap >= 5 && avgGap <= 10) frequency = 'weekly';

    const annualMultiplier = frequency === 'monthly' ? 12 : frequency === 'weekly' ? 52 : Math.round(365 / Math.max(avgGap, 1));
    const estimatedAnnualCost = Math.round(avg * annualMultiplier);

    // High cost = annual > ₹12,000 or avg > ₹2,000/occurrence
    const isHighCost = estimatedAnnualCost > 12000 || avg > 2000;

    const sortedByDate = [...txns].sort((a, b) => b.date.localeCompare(a.date));

    results.push({
      description: sortedByDate[0].description,
      category: sortedByDate[0].category,
      avgAmount: Math.round(avg),
      occurrences: txns.length,
      frequency,
      estimatedAnnualCost,
      lastDate: sortedByDate[0].date,
      isHighCost,
    });
  }

  return results.sort((a, b) => b.estimatedAnnualCost - a.estimatedAnnualCost);
}

