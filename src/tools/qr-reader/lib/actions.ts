// ============================================================================
// What can be done with a decoded payload
// ----------------------------------------------------------------------------
// Everything here only builds strings, files or links. Opening any of them is
// always a deliberate tap by the person; nothing navigates on its own.
// ============================================================================

import type { ParsedPayload } from './parse';

const VCARD_PROPERTIES: Record<string, string> = {
  fieldOrganization: 'ORG',
  fieldJobTitle: 'TITLE',
  fieldPhone: 'TEL',
  fieldEmail: 'EMAIL',
  fieldWebsite: 'URL',
  fieldAddress: 'ADR',
  fieldNote: 'NOTE',
  fieldBirthday: 'BDAY',
};

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

function meCardName(raw: string, fallback: string): { family: string; given: string; formatted: string } {
  const match = raw.match(/(?:^MECARD:|;)N:((?:\\.|[^;])*)/i);
  const value = match?.[1] || fallback;
  let separator = -1;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\\') {
      index += 1;
    } else if (value[index] === ',') {
      separator = index;
      break;
    }
  }
  const unescape = (part: string) => part.replace(/\\([,;:])/g, '$1').trim();
  const family = unescape(separator < 0 ? value : value.slice(0, separator));
  const given = unescape(separator < 0 ? '' : value.slice(separator + 1));
  return { family, given, formatted: [given, family].filter(Boolean).join(' ') || fallback || 'Unknown' };
}

/** vCards are saved as they came; MeCards are converted to vCard 3.0. */
export function contactAsVCard(payload: ParsedPayload): string {
  if (payload.kind === 'vcard') return payload.raw;

  const displayName = payload.fields.find(field => field.key === 'fieldName')?.value || '';
  const name = meCardName(payload.raw, displayName);
  // VERSION, N and FN are required in vCard 3.0. MeCard encodes its name as
  // family,given, so preserve that structure instead of emitting only FN.
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(name.family)};${escapeVCardValue(name.given)};;;`,
    `FN:${escapeVCardValue(name.formatted)}`,
  ];
  for (const field of payload.fields) {
    const property = VCARD_PROPERTIES[field.key];
    if (!property || !field.value) continue;
    // MeCard gives ADR as a single value. Put it in the street component of
    // vCard's structured address instead of turning its separators into text.
    if (property === 'ADR') lines.push(`ADR:;;${escapeVCardValue(field.value)};;;;`);
    else lines.push(`${property}:${escapeVCardValue(field.value)}`);
  }
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

/** A bare VEVENT is wrapped in a VCALENDAR so calendar apps accept the file. */
export function eventAsIcs(payload: ParsedPayload): string {
  const raw = payload.raw.replace(/\r?\n/g, '\r\n');
  if (/^begin:vcalendar/i.test(payload.raw.trim())) return raw;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//oLoveTools//QR Reader//EN', raw, 'END:VCALENDAR'].join('\r\n');
}

export function field(payload: ParsedPayload, key: string): string {
  return payload.fields.find(f => f.key === key)?.value || '';
}

export function mapsUrl(payload: ParsedPayload): string | null {
  const lat = parseFloat(field(payload, 'fieldLatitude'));
  const lon = parseFloat(field(payload, 'fieldLongitude'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

export function telHref(payload: ParsedPayload): string | null {
  const phone = field(payload, 'fieldPhone').replace(/[^\d+*#]/g, '');
  return phone ? `tel:${phone}` : null;
}

export function smsHref(payload: ParsedPayload): string | null {
  const phone = field(payload, 'fieldPhone').replace(/[^\d+]/g, '');
  if (!phone) return null;
  const body = field(payload, 'fieldMessage');
  return body ? `sms:${phone}?body=${encodeURIComponent(body)}` : `sms:${phone}`;
}

export function mailHref(payload: ParsedPayload): string | null {
  const to = field(payload, 'fieldEmail');
  if (!to) return null;
  const params = new URLSearchParams();
  const subject = field(payload, 'fieldSubject');
  const body = field(payload, 'fieldBody');
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const q = params.toString().replace(/\+/g, '%20');
  return `mailto:${to}${q ? `?${q}` : ''}`;
}

export function webSearchUrl(text: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
}

export function productLinks(code: string): { label: string; href: string }[] {
  return [
    { label: 'Google', href: webSearchUrl(code) },
    { label: 'Open Food Facts', href: `https://world.openfoodfacts.org/product/${code}` },
  ];
}

export function bookLinks(isbn: string): { label: string; href: string }[] {
  return [
    { label: 'Google Books', href: `https://www.google.com/search?tbm=bks&q=isbn:${isbn}` },
    { label: 'Open Library', href: `https://openlibrary.org/isbn/${isbn}` },
  ];
}

export function downloadText(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

export const canShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

export async function shareText(text: string): Promise<void> {
  try {
    await navigator.share({ text });
  } catch {
    /* cancelled */
  }
}
