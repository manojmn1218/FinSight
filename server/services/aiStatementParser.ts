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
      /\b(neft|imps|rtgs|fund transfer|to self|own account transfer|transfer to|sent to|p2p|family transfer|friend)\b/i,
      /\b(upi\/(?:dr|cr)\/.*?(?:to|sent|transfer))\b/i,
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

    // Prepare text sample (cap at ~250 lines to keep context crisp and fast)
    const textSnippet = lines
      .filter(l => l.trim().length > 3)
      .slice(0, 250)
      .join('\n');

    const systemPrompt = `You are an expert AI financial statement extractor and transaction classifier for FinSight.
Your job is to read raw text lines from a bank statement PDF and extract structured financial transactions.

CRITICAL INSTRUCTIONS:
1. Extract ALL valid debit and credit financial transactions from the text lines.
2. For each transaction, classify into EXACTLY ONE of these 12 categories:
   - "Food & Dining" (restaurants, cafes, Swiggy, Zomato, groceries, Zepto, Blinkit, food, bakeries)
   - "Shopping" (Amazon, Flipkart, clothes, electronics, retail stores, retail purchases)
   - "Transport" (Uber, Ola, Rapido, Metro, fuel, petrol, flight, IRCTC, train, toll)
   - "Utilities" (electricity, water, broadband, gas, mobile recharge, Jio, Airtel, DTH)
   - "Rent" (house rent, flat rent, society maintenance)
   - "Subscriptions" (Netflix, Spotify, Prime, YouTube, ChatGPT, Apple, iCloud, SaaS)
   - "Health" (hospitals, clinics, pharmacy, medicine, Apollo, 1mg, diagnostic tests)
   - "Education" (school, college, courses, Udemy, Coursera, books, tuition)
   - "Transfer" (peer-to-peer UPI transfer, NEFT, IMPS to person)
   - "ATM" (cash withdrawal at ATM)
   - "Salary" (salary credit, wages, payroll, client invoice payment)
   - "Other" (bank charges, penalties, taxes, cashback, interest, uncategorized)

3. Format:
   - "date": string in "YYYY-MM-DD" format. If year is missing or two-digits, deduce correctly.
   - "rawDescription": the original raw text line from the statement.
   - "cleanMerchant": clean, human-readable merchant name (e.g. "Swiggy Food Delivery", "Amazon India", "HDFC Salary Credit", "Uber Ride").
   - "amount": number. MUST BE NEGATIVE for debits/expenses (e.g. -450.00) and POSITIVE for credits/income (e.g. 85000.00).
   - "category": exactly one of the 12 listed category strings.
   - "isRecurring": boolean (true for subscriptions, rent, insurance, monthly utility bills).
   - "confidence": number between 0.0 and 1.0 representing classification confidence.

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
      "confidence": 0.95
    }
  ],
  "bankDetected": "HDFC Bank / SBI / ICICI / etc",
  "period": "March 2026"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `\n--- STATEMENT TEXT LINES ---\n${textSnippet}\n--- END STATEMENT TEXT ---` },
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

    const rawList = Array.isArray(parsedData.transactions) ? parsedData.transactions : [];

    const validatedTransactions: ParsedAiTransaction[] = rawList.map((item: any) => {
      // Validate category
      let cat: FinCategory = 'Other';
      if (FIN_CATEGORIES.includes(item.category)) {
        cat = item.category as FinCategory;
      } else {
        cat = matchHeuristicCategory(item.cleanMerchant || item.rawDescription || '').category;
      }

      return {
        id: 'tx_ai_' + Math.random().toString(36).substring(2, 9),
        date: item.date || new Date().toISOString().slice(0, 10),
        rawDescription: String(item.rawDescription || item.cleanMerchant || 'Transaction').slice(0, 150),
        cleanMerchant: String(item.cleanMerchant || cleanMerchantName(item.rawDescription || 'Transaction')).slice(0, 40),
        amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || -10,
        category: cat,
        isRecurring: Boolean(item.isRecurring),
        confidence: typeof item.confidence === 'number' ? Math.min(Math.max(item.confidence, 0.5), 1.0) : 0.95,
      };
    });

    if (validatedTransactions.length > 0) {
      console.log(`[AI Statement Parser] Gemini Flash successfully classified ${validatedTransactions.length} transactions.`);
      return buildParseResult('gemini', 'gemini-2.5-flash', validatedTransactions, parsedData.bankDetected, parsedData.period);
    }

    console.warn('[AI Statement Parser] Gemini returned 0 transactions, switching to fallback.');
    const fallbackTxns = parseFallbackTransactions(lines);
    return buildParseResult('heuristic_fallback', 'smart-nlp-engine', fallbackTxns);
  } catch (geminiError: any) {
    console.error('[AI Statement Parser] Gemini API call error:', geminiError?.message || geminiError);
    console.log('[AI Statement Parser] Engaging resilient Smart Fallback Engine...');
    const fallbackTxns = parseFallbackTransactions(lines);
    return buildParseResult('heuristic_fallback', 'smart-nlp-engine', fallbackTxns);
  }
}

function buildParseResult(
  provider: 'gemini' | 'heuristic_fallback',
  model: string,
  transactions: ParsedAiTransaction[],
  bankDetected?: string,
  period?: string
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

  return {
    provider,
    model,
    summary: {
      totalTransactions: transactions.length,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      period,
      bankDetected,
      categoriesFound,
    },
    transactions,
  };
}
