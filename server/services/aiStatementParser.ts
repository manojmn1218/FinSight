import { GoogleGenAI } from '@google/genai';

export const FIN_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transport',
  'Utilities',
  'Rent',
  'Subscriptions',
  'Health',
  'Education',
  'Transfer',
  'ATM',
  'Salary',
  'Other',
] as const;

export type FinCategory = (typeof FIN_CATEGORIES)[number];

export interface ParsedAiTransaction {
  id: string;
  date: string;              // YYYY-MM-DD
  rawDescription: string;
  cleanMerchant: string;
  amount: number;            // Negative for expense/debit, Positive for income/credit
  category: FinCategory;
  isRecurring: boolean;
  confidence: number;        // 0.0 to 1.0
  balance?: number;
}

export interface AiParseResult {
  provider: 'gemini' | 'heuristic_fallback';
  model: string;
  summary: {
    totalTransactions: number;
    totalDebits: number;
    totalCredits: number;
    period?: string;
    bankDetected?: string;
    closingBalance?: number;
    categoriesFound: Record<string, number>;
  };
  transactions: ParsedAiTransaction[];
}

// ═══════════════════════════════════════════════
// SMART HEURISTIC FALLBACK ENGINE
// ═══════════════════════════════════════════════

const FALLBACK_CATEGORY_PATTERNS: Array<{
  category: FinCategory;
  patterns: RegExp[];
}> = [
  {
    category: 'Food & Dining',
    patterns: [
      /\b(swiggy|zomato|ubereats|mcdonalds|kfc|dominos|pizza|starbucks|cafe coffee day|ccd|burger king|subway|haldiram|barbeque nation|behrouz|faasos|chaayos|chai point|dunkin|baskin|eatclub|eat fit|freshmenu|restaurant|bistro|bakery|canteen|dhaba|biryani|kitchen|eats|dining|hotel)\b/i,
      /\b(blinkit|zepto|instamart|bbnow|bigbasket|dunzo|dmart|nature basket|reliance fresh|more retail|grofers|supermarket|kirana|provisions)\b/i,
    ],
  },
  {
    category: 'Shopping',
    patterns: [
      /\b(amazon|flipkart|myntra|ajio|meesho|nykaa|tata cliq|croma|reliance digital|vijay sales|ikea|zara|h&m|uniqlo|decathlon|lenskart|snitch|westside|pantaloons|lifestyle|shoppers stop|marks & spencer|max fashion|retail|store|clothing|apparel|footwear|electronics)\b/i,
    ],
  },
  {
    category: 'Transport',
    patterns: [
      /\b(uber|ola|rapido|blusmart|namma yatri|metro|irctc|railway|indian rail|redbus|abhibus|makemytrip|goibibo|easemytrip|cleartrip|yatra)\b/i,
      /\b(petrol|diesel|fuel|cng|bharat petroleum|bpcl|hindustan petroleum|hpcl|indian oil|iocl|shell|nayara|fastag|toll|parking|auto|cab|taxi|flight|airline|indigo|spicejet|air india|vistara|akasa)\b/i,
    ],
  },
  {
    category: 'Utilities',
    patterns: [
      /\b(electricity|bescom|tneb|mseb|discom|torrent power|tata power|adani electricity|bses|cesc|dhbvn|uppcl|wbsetcl)\b/i,
      /\b(water bill|jal board|bwssb|mcgm water|piped gas|indraprastha gas|igl|mahanagar gas|mgl|gujarat gas|adani gas)\b/i,
      /\b(airtel|jio|vodafone|vi |bsnl|broadband|act fibernet|hathway|you broadband|wifi|dth|tata play|dish tv|sun direct|airtel digital|bill desk|recharge|postpaid|prepaid)\b/i,
    ],
  },
  {
    category: 'Rent',
    patterns: [
      /\b(rent|house rent|flat rent|room rent|maintenance|society maintenance|nobroker|nestaway|stanza living|zolo|pg rent|landlord|lease payment|tenancy)\b/i,
    ],
  },
  {
    category: 'Subscriptions',
    patterns: [
      /\b(netflix|spotify|youtube|disney|hotstar|amazon prime|apple music|itunes|audible|sonyliv|zee5|jiocinema|mx player)\b/i,
      /\b(chatgpt|openai|anthropic|claude|midjourney|github|figma|canva|adobe|notion|linkedin premium|google one|icloud|microsoft 365|office 365|cursor|replit|aws|digitalocean|heroku|vercel|cloudflare)\b/i,
      /\b(cult fit|cult\.fit|gym membership|gold gym|anytime fitness|subscription|membership|recurring billing)\b/i,
    ],
  },
  {
    category: 'Health',
    patterns: [
      /\b(apollo|pharmacy|chemist|medplus|netmeds|tata 1mg|1mg|pharmeasy|practo|hospital|clinic|diagnostic|dr\.? lal path|pathkind|metropolis|thyrocare|care hospital|manipal|fortis|max healthcare|narayana health|aiims)\b/i,
      /\b(medical|doctor|consultation|mediclaim|health insurance|star health|hdfc ergo health|care health|niva bupa|dentist|physio|pathology|lab test)\b/i,
    ],
  },
  {
    category: 'Education',
    patterns: [
      /\b(udemy|coursera|unacademy|byju|vedantu|physics wallah|upgrad|simplilearn|edx|skillshare|scaler|coding ninjas)\b/i,
      /\b(school|college|university|tuition|exam fee|coaching|books|stationery|library|admission fee|semester fee)\b/i,
    ],
  },
  {
    category: 'Transfer',
    patterns: [
      /\b(neft|imps|rtgs|fund transfer|acc tfr|a\/c tfr|account transfer|ac transfer|tfr|trfr|trf|to self|own account transfer|transfer to|transfer from|sent to|received from|p2p|peer to peer|family transfer|friend|bank transfer|internal transfer|direct transfer|wire transfer|ft\b|money sent|money received|dep tfr|wdl tfr)\b/i,
      /\b(transfer|fund tfr)\b/i,
    ],
  },
  {
    category: 'ATM',
    patterns: [
      /\b(atm|cash withdrawal|nfs atm|cash wdl|self withdrawal|atm-cash|card cash)\b/i,
    ],
  },
  {
    category: 'Salary',
    patterns: [
      /\b(salary|payroll|stipend|wages|salary credit|monthly pay|bonus|incentive|freelance payout|upwork|fiverr|direct credit - sal)\b/i,
    ],
  },
];

function cleanMerchantName(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return 'Bank Transaction';
  let cleaned = rawText.trim();

  // 1. Strip leading dates e.g. '05/10/2026 - - ', '05-10-2026 : '
  cleaned = cleaned.replace(/^\d{2,4}[-/]\d{1,2}[-/]\d{2,4}\s*[-:–\s]*/g, '').trim();

  // 1b. Strip banking transfer prefixes before checking UPI slashes
  cleaned = cleaned.replace(/^(?:BY|TO)?\s*TRANSFER[-_\s]*(?:INB|MB)?[\s\/:_-]*/gi, '').trim();

  // 2. Strip currency symbols & amounts
  cleaned = cleaned.replace(/\b(?:INR|RS\.?|USD|EUR)\b/gi, '');
  cleaned = cleaned.replace(/\b[\d,]+\.\d{2}\b/g, '');

  // 3. Strip trailing / inline DR / CR
  cleaned = cleaned.replace(/\b(?:DR|CR|DEBIT|CREDIT)\b/gi, '');

  // 4. Match Indian UPI format: UPI/DR/123456789012/MERCHANT/BANK/...
  const upiMatch = cleaned.match(/UPI[\/\-_](?:DR|CR)?[\/\-_]?(\d+)(?:[\/\-_]([^\/\-_]+))?(?:[\/\-_]([^\/\-_]+))?/i);
  if (upiMatch) {
    const ref = upiMatch[1];
    const partA = (upiMatch[2] || '').trim();
    const partB = (upiMatch[3] || '').trim();

    const gatewayIgnore = /^(PYTM|PAYTM|OKAXIS|OKHDFCBANK|OKSBI|OKICICI|YESB|HDFCBANK|SBI|ICICI|AXIS|AIRP|YES|PUNB|BARB|CNRB|DR|CR)$/i;

    let merchant = '';
    if (partA && !gatewayIgnore.test(partA) && !/^\d+$/.test(partA)) {
      merchant = partA;
    } else if (partB && !gatewayIgnore.test(partB) && !/^\d+$/.test(partB)) {
      merchant = partB;
    }

    if (merchant) {
      return merchant.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    } else {
      return 'UPI Transfer #' + ref.slice(-6);
    }
  }

  // 5. Handle general slash-separated: e.g. CMS/1234/AMAZON/
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/').map(p => p.trim()).filter(Boolean);
    const ignoreList = /^(UPI|NEFT|IMPS|RTGS|ACH|POS|ECOM|CMS|ATM|NFS|INB|MB|DR|CR|PYTM|PAYTM|OKAXIS|OKHDFCBANK|OKSBI|OKICICI|HDFC|ICICI|SBI|AXIS)$/i;
    const candidate = parts.find(p => {
      const stripped = p.replace(/^[-_\s]+|[-_\s]+$/g, '');
      return stripped.length >= 3 && !/^\d+$/.test(stripped) && !ignoreList.test(stripped);
    });

    if (candidate) {
      cleaned = candidate;
    }
  }

  // 6. Remove common banking prefixes
  cleaned = cleaned.replace(/^(?:[-_\s]*)(?:UPI|NEFT|IMPS|RTGS|ACH|POS|ECOM|CMS|ATM|NFS|INB|MB|TRANSFER TO|SENT TO|RECEIVED FROM)[\s\/:_-]+/gi, '');
  cleaned = cleaned.replace(/@[a-zA-Z0-9._-]+/g, ''); // remove handles
  cleaned = cleaned.replace(/[-_/:.*#|]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  // 7. Capitalize neatly
  if (cleaned.length >= 2) {
    cleaned = cleaned
      .split(' ')
      .filter(w => w.length > 0 && !/^\d+$/.test(w))
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // 8. Prevent bare collapses
  if (/^(Upi|Imps|Neft|Rtgs|Transfer|Transaction)$/i.test(cleaned)) {
    return 'Bank ' + cleaned + ' Transfer';
  }

  return cleaned.length >= 2 ? cleaned.slice(0, 45) : 'Bank Transaction';
}

function matchHeuristicCategory(text: string): { category: FinCategory; confidence: number } {
  for (const { category, patterns } of FALLBACK_CATEGORY_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { category, confidence: 0.88 };
      }
    }
  }
  return { category: 'Other', confidence: 0.5 };
}

/**
 * Detects and extracts closing/available balance from bank statement lines and transactions.
 * Looks for explicit closing balance keywords first, then falls back to the running balance of the latest transaction.
 */
export function extractClosingBalance(
  lines: string[],
  transactions?: Array<{ date: string; balance?: number }>
): number | undefined {
  // 1. Look for explicit closing balance keywords in statement text
  const balancePatterns = [
    /(?:closing|ending|ledger|clear|effective\s*available|available|book)\s*bal(?:ance)?\s*[:\-–]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+\.\d{2})/i,
    /bal(?:ance)?\s*as\s*on\s*[\d\/\.\-A-Za-z\s]{0,25}[:\-–]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+\.\d{2})/i,
    /(?:total\s*available\s*balance|avail\s*bal|net\s*balance)\s*[:\-–]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+\.\d{2})/i,
  ];

  for (const line of lines) {
    for (const pat of balancePatterns) {
      const match = line.match(pat);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val >= 0) {
          return Math.round(val * 100) / 100;
        }
      }
    }
  }

  // 2. Fall back to latest chronological transaction's balance
  if (transactions && transactions.length > 0) {
    const txnsWithBal = transactions.filter(t => typeof t.balance === 'number' && !isNaN(t.balance));
    if (txnsWithBal.length > 0) {
      const sortedByDate = [...txnsWithBal].sort((a, b) => b.date.localeCompare(a.date));
      const latestDate = sortedByDate[0].date;
      const latestDateTxns = txnsWithBal.filter(t => t.date === latestDate);

      const firstTxn = txnsWithBal[0];
      const lastTxn = txnsWithBal[txnsWithBal.length - 1];

      let pickedBalance: number | undefined;
      if (firstTxn.date === latestDate && lastTxn.date !== latestDate) {
        pickedBalance = firstTxn.balance;
      } else if (lastTxn.date === latestDate && firstTxn.date !== latestDate) {
        pickedBalance = lastTxn.balance;
      } else {
        pickedBalance = latestDateTxns[latestDateTxns.length - 1].balance ?? sortedByDate[0].balance;
      }

      if (typeof pickedBalance === 'number' && !isNaN(pickedBalance)) {
        return Math.round(pickedBalance * 100) / 100;
      }
    }
  }

  return undefined;
}

function parseFallbackTransactions(lines: string[]): ParsedAiTransaction[] {
  const transactions: ParsedAiTransaction[] = [];

  const datePatterns = [
    /(\d{2})[-/](\d{2})[-/](\d{4})/,
    /(\d{4})[-/](\d{2})[-/](\d{2})/,
    /(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i,
    /(\d{2})[-/](\d{2})[-/](\d{2})/,
  ];

  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  // Merge lines starting with dates
  const merged: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.length < 5) continue;
    const hasDate = datePatterns.some(p => p.test(line));
    if (hasDate) {
      merged.push(line);
    } else if (merged.length > 0) {
      merged[merged.length - 1] += ' ' + line;
    }
  }

  for (const line of merged) {
    // Extract date
    let dateStr: string | null = null;
    let m = line.match(datePatterns[0]);
    if (m) {
      dateStr = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    } else if ((m = line.match(datePatterns[1]))) {
      dateStr = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    } else if ((m = line.match(datePatterns[2]))) {
      const mo = monthMap[m[2].toLowerCase()] || '01';
      dateStr = `${m[3]}-${mo}-${m[1].padStart(2, '0')}`;
    } else if ((m = line.match(datePatterns[3]))) {
      const yr = parseInt(m[3]) > 50 ? `19${m[3]}` : `20${m[3]}`;
      dateStr = `${yr}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    }

    if (!dateStr) continue;

    // Extract amounts
    const amountMatches = line.match(/[\d,]+\.\d{2}/g);
    if (!amountMatches || amountMatches.length === 0) continue;

    const amounts = amountMatches.map(a => parseFloat(a.replace(/,/g, '')));
    let amount = amounts[0];

    // Debit or credit determination
    const lower = line.toLowerCase();
    const isCredit = /\b(cr|credit|received|salary|deposit|refund|interest|reimbursement|cashback)\b/i.test(lower);
    const isDebit = /\b(dr|debit|paid|purchase|withdrawal|payment|to\s|transfer to|neft-|pos)\b/i.test(lower);

    if (isCredit && !isDebit) {
      amount = Math.abs(amount);
    } else {
      amount = -Math.abs(amount);
    }

    const cleanMerchant = cleanMerchantName(line);
    const { category, confidence } = matchHeuristicCategory(line);

    const isRecurring = /\b(netflix|spotify|subscription|rent|prime|membership|sip|emi|bill)\b/i.test(line);

    transactions.push({
      id: 'tx_fb_' + Math.random().toString(36).substring(2, 9),
      date: dateStr,
      rawDescription: line.slice(0, 150),
      cleanMerchant,
      amount,
      category,
      isRecurring,
      confidence,
      balance: amounts.length >= 2 ? amounts[amounts.length - 1] : undefined,
    });
  }

  return transactions;
}

// ═══════════════════════════════════════════════
// GOOGLE GEMINI FLASH AI PARSER
// ═══════════════════════════════════════════════

export async function parseStatementWithAi(lines: string[]): Promise<AiParseResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key provided, fall back cleanly to smart heuristic engine
  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    console.log('[AI Statement Parser] GEMINI_API_KEY not configured. Using Smart Neural Fallback Engine.');
    const fallbackTxns = parseFallbackTransactions(lines);
    return buildParseResult('heuristic_fallback', 'smart-nlp-engine', fallbackTxns);
  }

  try {
    console.log('[AI Statement Parser] Initializing Google Gemini 2.5 Flash analysis...');
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const systemPrompt = `You are an expert AI financial statement extractor and transaction classifier for FinSight.
Your job is to read raw text lines from a bank statement PDF and extract structured financial transactions.

CRITICAL INSTRUCTIONS:
1. Extract ALL valid debit and credit financial transactions from the text lines.
2. For each transaction, classify into EXACTLY ONE of these 12 categories:
   - "Food & Dining": restaurants, cafes, Swiggy, Zomato, groceries, Zepto, Blinkit, bakeries, tea/chai stalls, sweets, dhabas, food outlets.
   - "Shopping": Amazon, Flipkart, Myntra, clothes, fashion, electronics, retail stores, supermarkets, marts, departmental stores, retail purchases.
   - "Transport": Uber, Ola, Rapido, Metro, petrol/diesel/fuel pumps (HPCL, BPCL, IOCL, Shell), flights, airlines, IRCTC, train, bus, Fastag, tolls, parking, auto.
   - "Utilities": mobile recharge (Jio, Airtel, Vi, BSNL), electricity bills, water, broadband, WiFi, piped gas, DTH, bill payments.
   - "Rent": house rent, flat rent, society maintenance, landlord, PG accommodation.
   - "Subscriptions": Netflix, Spotify, Amazon Prime, YouTube, ChatGPT, Apple, iCloud, Google One, SaaS, gym memberships.
   - "Health": hospitals, clinics, pharmacy, medical stores, Apollo, Netmeds, Tata 1mg, diagnostic tests, doctor fees.
   - "Education": school, college, university, courses, Udemy, Coursera, books, stationery, tuition fees.
   - "Transfer": ONLY personal money transfers between individuals (e.g. friend/family person by name, personal VPA) or bank account movements (NEFT, IMPS, RTGS, self-account transfer, TFR). DO NOT classify payments to shops, stores, food, restaurants, or merchants as Transfer even if paid via UPI!
   - "ATM": cash withdrawals at ATMs.
   - "Salary": salary credit, payroll, stipend, wages, direct deposit from employer/clients.
   - "Other": bank service charges, SMS fees, penalties, taxes, cashback, interest, uncategorized.

CRITICAL UPI & INDIAN BANKING RULE:
- In India, almost all payments are made using UPI. UPI is merely a payment method, NOT a category!
- When you see a UPI transaction like "UPI/DR/.../MERCHANT/BANK", inspect the merchant/recipient name.
- If it is paid to a merchant/store/food/service, classify it under its real category (Food & Dining, Shopping, Transport, etc.).
- ONLY classify as "Transfer" if it is a personal peer-to-peer transfer to an individual or a bank account transfer.

3. Format:
   - "date": string in "YYYY-MM-DD" format. If year is missing or two-digits, deduce correctly.
   - "rawDescription": the original raw text line from the statement.
   - "cleanMerchant": clean, human-readable merchant or recipient name (e.g. "Swiggy", "Mohan Sweets", "Amazon India", "HP Petrol Pump", "Rahul Sharma").
   - "amount": number. MUST BE NEGATIVE for debits/expenses (e.g. -450.00) and POSITIVE for credits/income (e.g. 85000.00).
   - "category": exactly one of the 12 listed category strings.
   - "balance": number representing running account balance after this transaction if present in the statement column (e.g. 4520.50).
   - "isRecurring": boolean (true for subscriptions, rent, insurance, monthly utility bills).
   - "confidence": number between 0.0 and 1.0 representing classification confidence.

FEW-SHOT TRAINING EXAMPLES (Follow these exact classification patterns):
- "05/10/2026 TO TRANSFER-UPI/DR/627868088499/MOHAN SWEETS/SBIN/0000 90.00 4520.50"
  -> cleanMerchant: "Mohan Sweets", amount: -90.00, category: "Food & Dining", balance: 4520.50, confidence: 0.98
- "04/10/2026 TO TRANSFER-UPI/DR/627750058855/ZEPTO/HDFC/Pay 180.00 4430.50"
  -> cleanMerchant: "Zepto", amount: -180.00, category: "Shopping", balance: 4430.50, confidence: 0.99
- "03/10/2026 TO TRANSFER-UPI/DR/627629800942/RAPIDO/YESB/Ride 60.00 4250.50"
  -> cleanMerchant: "Rapido", amount: -60.00, category: "Transport", balance: 4250.50, confidence: 0.98
- "02/10/2026 TO TRANSFER-UPI/DR/627516888683/HP PETROL PUMP/SBIN 500.00 3750.50"
  -> cleanMerchant: "HP Petrol Pump", amount: -500.00, category: "Transport", balance: 3750.50, confidence: 0.99
- "01/10/2026 BY TRANSFER-NEFT*TECH SOLUTIONS*SALARY SEPT 85000.00 88750.50"
  -> cleanMerchant: "Tech Solutions", amount: 85000.00, category: "Salary", balance: 88750.50, confidence: 1.0, isRecurring: true
- "01/10/2026 TO TRANSFER-UPI/DR/627404142936/RAHUL SHARMA/SBIN/Rent split 2000.00 86750.50"
  -> cleanMerchant: "Rahul Sharma", amount: -2000.00, category: "Transfer", balance: 86750.50, confidence: 0.92
- "28/09/2026 ATM WDL-NFS/123456/BANGALORE AIRPORT 5000.00 81750.50"
  -> cleanMerchant: "ATM Cash Withdrawal", amount: -5000.00, category: "ATM", balance: 81750.50, confidence: 0.99
- "25/09/2026 DEBIT-SMS CHRG QTR ENDING SEPT 2026 17.70 81732.80"
  -> cleanMerchant: "Bank SMS Charges", amount: -17.70, category: "Other", balance: 81732.80, confidence: 0.95

OUTPUT FORMAT: Return strictly valid JSON with this shape:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "rawDescription": "string",
      "cleanMerchant": "string",
      "amount": -120.50,
      "category": "Food & Dining",
      "isRecurring": false,
      "confidence": 0.95,
      "balance": 4520.50
    }
  ],
  "closingBalance": 4520.50,
  "bankDetected": "HDFC Bank / SBI / ICICI / etc",
  "period": "March 2026"
}`;

    const filteredLines = lines.filter(l => l.trim().length > 3);
    const CHUNK_SIZE = 400;
    const allValidatedTxns: ParsedAiTransaction[] = [];
    let bankDetected: string | undefined;
    let statementPeriod: string | undefined;
    let detectedClosingBal: number | undefined = extractClosingBalance(lines);

    for (let i = 0; i < filteredLines.length; i += CHUNK_SIZE) {
      const chunk = filteredLines.slice(i, i + CHUNK_SIZE).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              { text: `\n--- STATEMENT TEXT LINES (Batch ${Math.floor(i / CHUNK_SIZE) + 1}) ---\n${chunk}\n--- END STATEMENT TEXT ---` },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsedData = JSON.parse(responseText);

      if (parsedData.bankDetected) bankDetected = parsedData.bankDetected;
      if (parsedData.period) statementPeriod = parsedData.period;
      if (typeof parsedData.closingBalance === 'number' && !isNaN(parsedData.closingBalance)) {
        detectedClosingBal = parsedData.closingBalance;
      }

      const rawList = Array.isArray(parsedData.transactions) ? parsedData.transactions : [];

      for (const item of rawList) {
        let cat: FinCategory = 'Other';
        if (FIN_CATEGORIES.includes(item.category)) {
          cat = item.category as FinCategory;
        } else {
          cat = matchHeuristicCategory(item.cleanMerchant || item.rawDescription || '').category;
        }

        const rawBal = typeof item.balance === 'number'
          ? item.balance
          : typeof item.balance === 'string'
          ? parseFloat(item.balance.replace(/,/g, ''))
          : undefined;

        allValidatedTxns.push({
          id: 'tx_ai_' + Math.random().toString(36).substring(2, 9),
          date: item.date || new Date().toISOString().slice(0, 10),
          rawDescription: String(item.rawDescription || item.cleanMerchant || 'Transaction').slice(0, 150),
          cleanMerchant: String(item.cleanMerchant || cleanMerchantName(item.rawDescription || 'Transaction')).slice(0, 45),
          amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || -10,
          category: cat,
          isRecurring: Boolean(item.isRecurring),
          confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0.5), 1.0) : 0.95,
          balance: typeof rawBal === 'number' && !isNaN(rawBal) ? rawBal : undefined,
        });
      }
    }

    if (detectedClosingBal === undefined) {
      detectedClosingBal = extractClosingBalance(lines, allValidatedTxns);
    }

    if (allValidatedTxns.length > 0) {
      console.log(`[AI Statement Parser] Gemini Flash successfully classified ${allValidatedTxns.length} transactions across batches. Detected Closing Balance: ${detectedClosingBal}`);
      return buildParseResult('gemini', 'gemini-3.5-flash-lite', allValidatedTxns, bankDetected, statementPeriod, detectedClosingBal);
    }

    console.warn('[AI Statement Parser] Gemini returned 0 transactions, switching to fallback.');
    const fallbackTxns = parseFallbackTransactions(lines);
    const fallbackClosingBal = extractClosingBalance(lines, fallbackTxns);
    return buildParseResult('heuristic_fallback', 'smart-nlp-engine', fallbackTxns, undefined, undefined, fallbackClosingBal);
  } catch (geminiError: any) {
    console.error('[AI Statement Parser] Gemini API call error:', geminiError?.message || geminiError);
    console.log('[AI Statement Parser] Engaging resilient Smart Fallback Engine...');
    const fallbackTxns = parseFallbackTransactions(lines);
    const fallbackClosingBal = extractClosingBalance(lines, fallbackTxns);
    return buildParseResult('heuristic_fallback', 'smart-nlp-engine', fallbackTxns, undefined, undefined, fallbackClosingBal);
  }
}

export interface ReclassifyItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  rawDescription?: string;
  currentCategory?: string;
}

export interface ReclassifiedResult {
  provider: 'gemini' | 'smart-nlp-engine';
  model: string;
  items: Array<{
    id: string;
    category: FinCategory;
    cleanMerchant: string;
    confidence: number;
    isRecurring: boolean;
  }>;
}

export async function reclassifyTransactionsWithAi(
  items: ReclassifyItem[]
): Promise<ReclassifiedResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

  // If Gemini key is available, use Gemini Flash 2.5
  if (geminiApiKey && geminiApiKey !== 'your_gemini_api_key_here') {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const prompt = `You are FinSight's expert Indian financial transaction classifier and entity extraction AI.
Analyze each transaction below and return JSON with the structure:
{
  "classifications": [
    {
      "id": "item_id",
      "category": "one of: Food & Dining, Shopping, Transport, Utilities, Rent, Subscriptions, Health, Education, Transfer, ATM, Salary, Other",
      "cleanMerchant": "cleaned, human-readable merchant/recipient name",
      "confidence": 0.95,
      "isRecurring": false
    }
  ]
}

CRITICAL CATEGORIZATION RULES:
1. In India, UPI is merely a payment mechanism, NEVER a category!
   - DO NOT categorize a transaction as "Transfer" simply because it was paid via UPI, contains "UPI", or has a UPI reference.
2. "Transfer" is STRICTLY RESERVED for:
   - Inter-bank fund transfers: NEFT, IMPS, RTGS, TFR, self-account transfers, A/C transfers.
   - Significant money transfers sent to or received from personal contacts/friends/family (e.g. peer-to-peer transfers > ₹1,000, or credits from family/friends).
3. "Food & Dining":
   - Restaurants, cafes, bakeries, tea/coffee stalls, Chai, sweets (Mohan Sweets, Haldirams), dining, canteens, mess.
   - Food delivery apps (Swiggy, Zomato, EatClub).
   - Dairy/milk booths (Nandini, Amul, Mother Dairy).
   - Small daily debit expenditures (< ₹350) paid to local food stalls, eateries, or personal merchants for food/snacks.
4. "Shopping":
   - Quick commerce groceries (Blinkit, Zepto, Instamart, BigBasket, DMart).
   - E-commerce (Amazon, Flipkart, Myntra, Meesho, Ajio, Tata CLiQ).
   - Retail shops, supermarkets, clothing, footwear, electronics, hardware, department stores.
5. "Transport":
   - Cabs, autos, bike taxis (Rapido, Uber, Ola).
   - Metro, railways (IRCTC), buses, flights.
   - Fuel/petrol stations (HPCL, IOCL, BPCL, Shell), tolls (FASTag), parking fees.
6. "Utilities":
   - Mobile recharges & bills (Jio, Airtel, Vi, BSNL).
   - Electricity bills, water bills, gas cylinder, piped gas, broadband/WiFi, DTH.
7. "Rent":
   - House rent, apartment rent, society maintenance, PG rent, hostel.
8. "Subscriptions":
   - Netflix, Spotify, Prime, YouTube, ChatGPT, Apple, iCloud, Google One, gym memberships, recurring SaaS.
9. "Health":
   - Pharmacies, medical stores (Apollo, Netmeds, 1mg, MedPlus), hospitals, clinics, doctor fees, diagnostic tests.
10. "Education":
    - School/college/university fees, courses, books, Udemy, Coursera, exam registration.
11. "Salary":
    - Salary credit, payroll, stipend, wages from employer.
12. "ATM":
    - ATM cash withdrawals.
13. "Other":
    - Bank charges, SMS fees, penalties, taxes, cashback, interest, uncategorized.

HEURISTIC FOR TRANSACTIONS WITH BARE OR MISSING MERCHANT TEXT (e.g. "UPI", "UPI Transfer"):
- If debit amount is between ₹10 and ₹350: classify as "Food & Dining" (chai/snacks/daily meals).
- If debit amount is between ₹350 and ₹1,500: classify as "Shopping" (groceries/general retail).
- If debit or credit amount is >= ₹2,000 without retail merchant: classify as "Transfer".`;

      const BATCH_SIZE = 60;
      const results: ReclassifiedResult['items'] = [];

      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const userPrompt = `Classify this batch of financial transactions:\n${JSON.stringify(
          batch.map(b => ({
            id: b.id,
            date: b.date,
            amount: b.amount,
            description: b.description,
            rawText: b.rawDescription || b.description,
          })),
          null,
          2
        )}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }, { text: userPrompt }],
            },
          ],
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });

        const respText = response.text?.trim() || '{}';
        const parsed = JSON.parse(respText);
        const list = Array.isArray(parsed.classifications) ? parsed.classifications : [];

        for (const item of list) {
          let cat: FinCategory = 'Other';
          if (FIN_CATEGORIES.includes(item.category)) {
            cat = item.category as FinCategory;
          } else {
            cat = matchHeuristicCategory(item.cleanMerchant || '').category;
          }

          results.push({
            id: String(item.id),
            category: cat,
            cleanMerchant: String(item.cleanMerchant || '').slice(0, 45),
            confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0.5), 1.0) : 0.95,
            isRecurring: Boolean(item.isRecurring),
          });
        }
      }

      if (results.length > 0) {
        return {
          provider: 'gemini',
          model: 'gemini-3.5-flash-lite',
          items: results,
        };
      }
    } catch (err: any) {
      console.error('[AI Reclassify] Gemini call error:', err?.message || err);
    }
  }

  // Fallback if no Gemini key or error
  const fallbackResults: ReclassifiedResult['items'] = items.map(item => {
    const text = (item.rawDescription || item.description || '').trim();
    const { category, confidence } = matchHeuristicCategory(text);
    const clean = cleanMerchantName(text);
    const isRecurring = /\b(netflix|spotify|subscription|rent|prime|membership|sip|emi|bill)\b/i.test(text);

    return {
      id: item.id,
      category,
      cleanMerchant: clean,
      confidence,
      isRecurring,
    };
  });

  return {
    provider: 'smart-nlp-engine',
    model: 'smart-nlp-engine',
    items: fallbackResults,
  };
}

function buildParseResult(
  provider: 'gemini' | 'heuristic_fallback',
  model: string,
  transactions: ParsedAiTransaction[],
  bankDetected?: string,
  period?: string,
  closingBalance?: number
): AiParseResult {
  let totalDebits = 0;
  let totalCredits = 0;
  const categoriesFound: Record<string, number> = {};

  for (const t of transactions) {
    if (t.amount < 0) {
      totalDebits += Math.abs(t.amount);
    } else {
      totalCredits += t.amount;
    }
    categoriesFound[t.category] = (categoriesFound[t.category] || 0) + 1;
  }

  const finalClosingBal = typeof closingBalance === 'number' && !isNaN(closingBalance)
    ? closingBalance
    : extractClosingBalance([], transactions);

  return {
    provider,
    model,
    summary: {
      totalTransactions: transactions.length,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      period,
      bankDetected,
      closingBalance: finalClosingBal,
      categoriesFound,
    },
    transactions,
  };
}
