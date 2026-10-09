// ═══════════════════════════════════════════════
// Alpha Vantage Stock API Service
// ═══════════════════════════════════════════════

const BASE_URL = '/api/alphavantage/query';

export interface StockQuote {
  symbol: string;
  open: number;
  high: number;
  low: number;
  price: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  change: number;
  changePercent: number;
}

interface AlphaVantageGlobalQuote {
  'Global Quote'?: {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
  Information?: string;
  Note?: string;
  'Error Message'?: string;
}

// ─── API Key Management ───
const STORAGE_KEY = 'fs_alpha_vantage_key';

export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY) || '';
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}

// ─── Fetch a single stock quote ───
export async function fetchStockQuote(symbol: string): Promise<StockQuote | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`;
  
  let data: unknown;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    throw new Error('Network error or Alpha Vantage server unreachable.', { cause: err });
  }

  const alphaData = data as AlphaVantageGlobalQuote;
  
  if (alphaData.Information || alphaData.Note) {
    throw new Error(alphaData.Information || alphaData.Note);
  }
  if (alphaData['Error Message']) {
    console.warn(`Alpha Vantage Error for ${symbol}: ${alphaData['Error Message']}`);
    return null; // Skip this symbol if invalid
  }

  const q = alphaData['Global Quote'];
  if (!q || !q['05. price']) return null;
  


  return {
    symbol: q['01. symbol'] || symbol,
    open: parseFloat(q['02. open']) || 0,
    high: parseFloat(q['03. high']) || 0,
    low: parseFloat(q['04. low']) || 0,
    price: parseFloat(q['05. price']) || 0,
    volume: parseInt(q['06. volume']) || 0,
    latestTradingDay: q['07. latest trading day'] || '',
    previousClose: parseFloat(q['08. previous close']) || 0,
    change: parseFloat(q['09. change']) || 0,
    changePercent: parseFloat((q['10. change percent'] || '0').replace('%', '')) || 0,
  };
}

// ─── Fetch multiple stock quotes (sequential to stay within rate limits) ───
export async function fetchMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  
  for (const symbol of symbols) {
    const quote = await fetchStockQuote(symbol);
    if (quote) {
      results.set(symbol, quote);
    }
    // Alpha Vantage free tier: max 5 calls/min, 25/day
    // Add a small delay between calls to avoid rate limiting
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }

  return results;
}

// ─── Cache layer (localStorage) to avoid burning API calls ───
const CACHE_KEY = 'fs_stock_cache_v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

interface CachedQuotes {
  timestamp: number;
  quotes: Record<string, StockQuote>;
}

export function getCachedQuotes(): Map<string, StockQuote> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedQuotes = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return new Map(Object.entries(cached.quotes));
  } catch {
    return null;
  }
}

export function setCachedQuotes(quotes: Map<string, StockQuote>): void {
  try {
    const obj: CachedQuotes = {
      timestamp: Date.now(),
      quotes: Object.fromEntries(quotes),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to cache stock quotes:', e);
  }
}

// ─── Smart fetch: try cache first, then API ───
export async function fetchQuotesWithCache(symbols: string[]): Promise<Map<string, StockQuote>> {
  const cached = getCachedQuotes();
  if (cached && cached.size > 0) {
    // Check if all requested symbols are in cache
    const allCached = symbols.every(s => cached.has(s));
    if (allCached) return cached;
  }

  const fresh = await fetchMultipleQuotes(symbols);
  if (fresh.size > 0) {
    // Merge with existing cache
    const merged = new Map(cached || []);
    fresh.forEach((v, k) => merged.set(k, v));
    setCachedQuotes(merged);
    return merged;
  }

  return cached || new Map();
}
