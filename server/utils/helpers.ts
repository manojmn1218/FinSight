/**
 * Shared server helpers for safe error extraction, Express 5 param coercion,
 * and consistent Mongoose toJSON serialization.
 */

export function getErrorMessage(err: unknown, fallback = 'Unknown error'): string {
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === 'string') return err || fallback;
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message || fallback;
  }
  return fallback;
}

export function getParamString(val: string | string[] | undefined): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0] ?? '';
  return '';
}

export function mongooseJsonTransform(
  _doc: unknown,
  ret: Record<string, unknown>
): Record<string, unknown> {
  if (ret._id !== undefined && ret._id !== null) {
    ret.id = String(ret._id);
  }
  delete ret._id;
  delete ret.__v;
  return ret;
}
