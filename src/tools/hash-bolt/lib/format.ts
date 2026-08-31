// ============================================================================
// Digest formatting.
// ----------------------------------------------------------------------------
// The worker always hands back lowercase hex, and every other representation is
// derived from it here. That is the whole reason switching to Base64 or to
// uppercase no longer re-reads a 4 GB file from disk.
// ============================================================================

export type OutputFormat = 'hex' | 'base64' | 'base64url';

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[^0-9a-f]/gi, '');
  const bytes = new Uint8Array(clean.length >> 1);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function formatDigest(hex: string, format: OutputFormat, uppercase: boolean): string {
  if (format === 'hex') return uppercase ? hex.toUpperCase() : hex;
  const base64 = bytesToBase64(hexToBytes(hex));
  if (format === 'base64') return base64;
  // Base64URL: what JWT, WebAuthn and Subresource-Integrity-adjacent tooling use.
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Splits a digest into 8-character blocks — the way checksums are printed to be read aloud. */
export function groupDigest(value: string): string {
  return value.replace(/(.{8})/g, '$1 ').trim();
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value >= 100 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(ms < 10000 ? 2 : 1)} s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '—';
  return `${formatBytes(bytesPerSecond)}/s`;
}
