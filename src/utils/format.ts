/**
 * FinSight Currency & Privacy Shield / Stealth Mode Utility
 * Standardizes Indian Rupee formatting (₹xx,xxx) across the entire application.
 * When stealthMode is enabled, automatically masks financial balances as '₹••••••' or '-₹••••••'.
 */

export interface FormatOptions {
  showDecimals?: boolean;
  alwaysSign?: boolean;
  maskPlaceholder?: string;
}

export function formatCurrency(
  amount: number,
  stealthMode: boolean = false,
  options?: FormatOptions
): string {
  if (stealthMode) {
    const mask = options?.maskPlaceholder || '₹••••••';
    return amount < 0 ? `-${mask}` : mask;
  }

  const isNeg = amount < 0;
  const absVal = Math.abs(amount);
  const sign = isNeg ? '-' : options?.alwaysSign ? '+' : '';

  const hasFractions = absVal % 1 !== 0;
  const minimumFractionDigits = options?.showDecimals !== undefined
    ? (options.showDecimals ? 2 : 0)
    : (hasFractions ? 2 : 0);
  const maximumFractionDigits = 2;

  return `${sign}₹${absVal.toLocaleString('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
}

export function getErrorMessage(err: unknown, fallback = 'An error occurred.'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message) {
    return err.message;
  }
  return fallback;
}

