/**
 * Safe JSON Parameter Helper
 * Ensures objects/arrays/strings passed to Postgres JSON/JSONB columns
 * are always valid JSON strings, eliminating "invalid input syntax for type json" errors.
 */

export function safeJsonParam(val, fallback = {}) {
  if (val === null || val === undefined) {
    return JSON.stringify(fallback);
  }
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t || t === '[object Object]') {
      return JSON.stringify(fallback);
    }
    try {
      JSON.parse(t);
      return t; // Already valid JSON string
    } catch {
      return JSON.stringify(val);
    }
  }
  try {
    return JSON.stringify(val);
  } catch {
    return JSON.stringify(fallback);
  }
}
