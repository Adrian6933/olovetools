// ============================================================================
// QRBolt payload building + readability checking
// ----------------------------------------------------------------------------
// The encoder itself is qr-code-styling; everything here is about feeding it
// correct data and proving afterwards that the result actually scans.
// ============================================================================

import type { EccLevel, EmailConfig, QrMode, SmsConfig, VCardConfig, WiFiConfig } from '../types';

// ---------------------------------------------------------------------------
// Payload builders
// ---------------------------------------------------------------------------

/** Escapes the four characters that are structural in the WIFI: scheme. */
const escapeWifi = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');

/** vCard folds on CRLF and treats `,` `;` `\` as separators. */
const escapeVCard = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

export function buildWifi(config: WiFiConfig): string {
  const pass = config.security === 'nopass' ? '' : `P:${escapeWifi(config.password || '')};`;
  return `WIFI:T:${config.security};S:${escapeWifi(config.ssid)};${pass};`;
}

export function buildEmail(config: EmailConfig): string {
  const params: string[] = [];
  if (config.subject) params.push(`subject=${encodeURIComponent(config.subject)}`);
  if (config.body) params.push(`body=${encodeURIComponent(config.body)}`);
  // An empty `?subject=&body=` tail is dead weight in the payload and confuses
  // some mail clients, so it is only added when there is something to add.
  return `mailto:${config.address}${params.length ? `?${params.join('&')}` : ''}`;
}

export function buildSms(config: SmsConfig): string {
  return config.message ? `SMSTO:${config.number}:${config.message}` : `SMSTO:${config.number}`;
}

export function buildTel(number: string): string {
  return `tel:${number.replace(/[^\d+*#]/g, '')}`;
}

export function buildGeo(lat: string, lon: string): string {
  return `geo:${lat.trim() || '0'},${lon.trim() || '0'}`;
}

export function buildVCard(c: VCardConfig): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(c.lastName)};${escapeVCard(c.firstName)};;;`,
    `FN:${escapeVCard(`${c.firstName} ${c.lastName}`.trim())}`,
  ];
  if (c.organization) lines.push(`ORG:${escapeVCard(c.organization)}`);
  if (c.jobTitle) lines.push(`TITLE:${escapeVCard(c.jobTitle)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(c.phone)}`);
  if (c.email) lines.push(`EMAIL:${escapeVCard(c.email)}`);
  if (c.website) lines.push(`URL:${escapeVCard(c.website)}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(c.address)};;;;`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Capacity
// ---------------------------------------------------------------------------

/**
 * Byte capacity of a version-40 code per recovery level. Going over this is
 * what makes qr-code-styling throw "code length overflow" — which used to take
 * the whole page down from inside a render effect.
 */
export const MAX_BYTES: Record<Exclude<EccLevel, 'auto'>, number> = {
  L: 2953,
  M: 2331,
  Q: 1663,
  H: 1273,
};

export function payloadBytes(data: string): number {
  return new TextEncoder().encode(data).length;
}

/**
 * A logo punches a hole straight through the pattern, and only the error
 * correction blocks can fill it back in. Anything above ~20% of the area really
 * needs H (30% recovery); without a logo, M keeps the modules chunky and easy
 * to scan from a distance.
 */
export function resolveEcc(level: EccLevel, hasLogo: boolean, logoSize: number): Exclude<EccLevel, 'auto'> {
  if (level !== 'auto') return level;
  if (!hasLogo) return 'M';
  return logoSize > 0.16 ? 'H' : 'Q';
}

/** Rough share of the pattern hidden by the logo, as a fraction of the whole. */
export function logoCoverage(logoSize: number): number {
  return logoSize * logoSize;
}

/** Recovery headroom of each level, used to warn before the code stops scanning. */
const RECOVERY: Record<Exclude<EccLevel, 'auto'>, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 };

export function logoFitsEcc(logoSize: number, ecc: Exclude<EccLevel, 'auto'>): boolean {
  // Leave a third of the budget for print damage, glare and camera noise.
  return logoCoverage(logoSize) <= RECOVERY[ecc] * 0.67;
}

// ---------------------------------------------------------------------------
// Contrast
// ---------------------------------------------------------------------------

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

/**
 * Scanners threshold the image, so what matters is the luminance gap. Below
 * about 3:1 phone cameras start failing in ordinary light.
 */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

/** True when the code is light-on-dark, which many older scanners refuse. */
export function isInverted(foreground: string, background: string): boolean {
  return relativeLuminance(foreground) > relativeLuminance(background);
}

// ---------------------------------------------------------------------------
// Read-back check
// ---------------------------------------------------------------------------

/**
 * Renders the produced PNG and runs a real decoder over it. This is the only
 * honest way to tell someone their QR works: the preview looking fine says
 * nothing about whether a camera can read it.
 */
export async function decodeBlob(blob: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  // A white bed matters: PNGs exported with a transparent background decode as
  // black-on-black otherwise, and the check would fail for the wrong reason.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const jsQR = (await import('jsqr')).default;
  const found: any = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
  if (!found) return null;

  // jsQR reads byte mode as UTF-8 and silently returns an empty string when the
  // bytes are not valid UTF-8 — which is what an accented payload written in
  // ISO-8859-1 produces. Without this fallback the readability check would fail
  // for the wrong reason on any code containing "ñ".
  const text: string = found.data || '';
  if (text) return text;
  if (!Array.isArray(found.binaryData) || found.binaryData.length === 0) return text;
  return new TextDecoder('iso-8859-1').decode(new Uint8Array(found.binaryData));
}
