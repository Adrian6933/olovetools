// ============================================================================
// Formatting helpers.
// ============================================================================

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * Byte counts, up to petabytes. The old table stopped at MB, so anything past a
 * gigabyte rendered as "1.4 undefined".
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const exponent = Math.min(UNITS.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exponent);
  const decimals = exponent === 0 ? 0 : value < 10 ? 2 : 1;
  return `${value.toFixed(decimals)} ${UNITS[exponent]}`;
}

/** Thousands separators without pulling in Intl on the server pass. */
export function formatCount(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Fills `{0}`, `{1}`… in a dictionary string. */
export function fill(template: string, ...values: (string | number)[]): string {
  return values.reduce<string>((out, value, i) => out.replace(`{${i}}`, String(value)), template || '');
}

/** A hex dump line count cap so the inspector never renders a whole file. */
export const HEX_MAX_BYTES = 1024;

/** How much of a huge output we are willing to put in the DOM as text. */
export const PREVIEW_CHARS = 40_000;
