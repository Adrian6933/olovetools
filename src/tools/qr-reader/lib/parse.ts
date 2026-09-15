// ============================================================================
// QR payload parsing and safety review
// ----------------------------------------------------------------------------
// The point of this tool is that it tells you what a code contains instead of
// obeying it. Nothing here navigates, fetches or resolves anything; it only
// takes the decoded string apart and describes it.
// ============================================================================

export type PayloadKind =
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'mecard'
  | 'email'
  | 'sms'
  | 'tel'
  | 'geo'
  | 'event'
  | 'text';

export interface PayloadField {
  /** Translation key suffix, e.g. `fieldSsid`. */
  key: string;
  value: string;
  /** Rendered with a monospace font and a copy button of its own. */
  mono?: boolean;
  secret?: boolean;
}

export type WarningKind =
  | 'insecure'
  | 'punycode'
  | 'mixedScript'
  | 'shortener'
  | 'ipHost'
  | 'credentials'
  | 'longUrl'
  | 'openWifi'
  | 'executable';

export interface ParsedPayload {
  kind: PayloadKind;
  raw: string;
  fields: PayloadField[];
  /** Only set for `url`: the destination, never followed automatically. */
  href?: string;
  host?: string;
  warnings: WarningKind[];
}

// ---------------------------------------------------------------------------
// URL safety
// ---------------------------------------------------------------------------

/**
 * Link shorteners hide the real destination behind a redirect, which is exactly
 * what a malicious QR sticker relies on. We flag them rather than resolving
 * them: resolving would mean contacting the server on the user's behalf.
 */
const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
  'adf.ly', 'bl.ink', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy',
  't.ly', 'tiny.cc', 'lnkd.in', 's.id', 'v.gd', 'shorte.st',
]);

/** Extensions that a browser will hand straight to the operating system. */
const EXECUTABLE = /\.(exe|msi|apk|dmg|bat|cmd|scr|jar|ps1|vbs|com|pkg|deb|rpm)(\?|#|$)/i;

const IP_HOST = /^(\d{1,3}\.){3}\d{1,3}$|^\[[0-9a-f:]+\]$/i;

/**
 * Mixing scripts inside one label is the homograph trick: `аpple.com` with a
 * Cyrillic а renders identically to the real thing.
 */
function hasMixedScript(host: string): boolean {
  return host
    .split('.')
    .some(label => {
      if (!label) return false;
      const latin = /[a-z]/i.test(label);
      const cyrillic = /[Ѐ-ӿ]/.test(label);
      const greek = /[Ͱ-Ͽ]/.test(label);
      return (latin && cyrillic) || (latin && greek) || (cyrillic && greek);
    });
}

export function reviewUrl(raw: string): { href: string; host: string; warnings: WarningKind[] } | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const warnings: WarningKind[] = [];
  const host = parsed.hostname;

  if (parsed.protocol === 'http:') warnings.push('insecure');
  // `xn--` is a punycode label: it may be a legitimate accented domain, but it
  // is also how a lookalike domain gets encoded, so it is worth surfacing.
  if (host.includes('xn--')) warnings.push('punycode');
  // The URL parser has already punycoded the host by this point, so the mixed
  // alphabet is only visible in the string the code actually contained. A
  // wholly Cyrillic domain is normal in Russia; one Cyrillic letter dropped
  // into a Latin word is the impersonation trick.
  const rawHost = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^/?#:]+)/i.exec(raw)?.[1] || host;
  if (hasMixedScript(rawHost)) warnings.push('mixedScript');
  if (SHORTENERS.has(host.replace(/^www\./, ''))) warnings.push('shortener');
  if (IP_HOST.test(host)) warnings.push('ipHost');
  if (parsed.username || parsed.password) warnings.push('credentials');
  if (raw.length > 300) warnings.push('longUrl');
  if (EXECUTABLE.test(parsed.pathname)) warnings.push('executable');

  return { href: parsed.href, host, warnings };
}

// ---------------------------------------------------------------------------
// Structured payloads
// ---------------------------------------------------------------------------

/** Splits on unescaped separators, then unescapes, per the WIFI/MECARD schemes. */
function splitEscaped(input: string, separator: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '\\' && i + 1 < input.length) {
      current += input[++i];
    } else if (char === separator) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

/** Same split, but retains escapes so fields with escaped commas can be parsed. */
function splitEscapedRetaining(input: string, separator: string): string[] {
  const parts: string[] = [];
  let current = '';
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '\\' && i + 1 < input.length) {
      current += char + input[++i];
    } else if (char === separator) {
      parts.push(current);
      current = '';
    } else current += char;
  }
  parts.push(current);
  return parts;
}

function parseWifi(raw: string): ParsedPayload {
  const body = raw.slice(5);
  const values: Record<string, string> = {};
  for (const chunk of splitEscaped(body, ';')) {
    const at = chunk.indexOf(':');
    if (at > 0) values[chunk.slice(0, at).toUpperCase()] = chunk.slice(at + 1);
  }

  const security = values.T || 'nopass';
  const fields: PayloadField[] = [
    { key: 'fieldSsid', value: values.S || '' },
    { key: 'fieldSecurity', value: security === 'nopass' ? 'Open' : security },
  ];
  if (values.P) fields.push({ key: 'fieldPassword', value: values.P, mono: true, secret: true });
  if (values.H === 'true') fields.push({ key: 'fieldHidden', value: 'yes' });

  return {
    kind: 'wifi',
    raw,
    fields,
    warnings: security === 'nopass' ? ['openWifi'] : [],
  };
}

const VCARD_LABELS: Record<string, string> = {
  FN: 'fieldName',
  N: 'fieldName',
  ORG: 'fieldOrganization',
  TITLE: 'fieldJobTitle',
  TEL: 'fieldPhone',
  EMAIL: 'fieldEmail',
  URL: 'fieldWebsite',
  ADR: 'fieldAddress',
  NOTE: 'fieldNote',
  BDAY: 'fieldBirthday',
};

function unescapeVCard(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\([;,\\])/g, '$1');
}

function parseVCard(raw: string): ParsedPayload {
  // Unfold the continuation lines the vCard spec allows before reading properties.
  const unfolded = raw.replace(/\r?\n[ \t]/g, '');
  const properties: { name: string; value: string }[] = [];

  for (const line of unfolded.split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at < 0) continue;
    const name = line.slice(0, at).split(';')[0].toUpperCase();
    const value = unescapeVCard(line.slice(at + 1)).trim();
    if (!value || !VCARD_LABELS[name]) continue;
    properties.push({ name, value: name === 'N' || name === 'ADR' ? value.split(';').filter(Boolean).join(' ') : value });
  }

  // FN is the display name and N is its structured form. Emitting both would
  // show the same person twice, under the same label, in a different order.
  const hasFormattedName = properties.some(p => p.name === 'FN');
  const fields: PayloadField[] = properties
    .filter(p => !(p.name === 'N' && hasFormattedName))
    .map(p => ({ key: VCARD_LABELS[p.name], value: p.value }));

  return { kind: 'vcard', raw, fields, warnings: [] };
}

const MECARD_LABELS: Record<string, string> = {
  N: 'fieldName',
  ORG: 'fieldOrganization',
  TEL: 'fieldPhone',
  EMAIL: 'fieldEmail',
  URL: 'fieldWebsite',
  ADR: 'fieldAddress',
  NOTE: 'fieldNote',
  BDAY: 'fieldBirthday',
};

function parseMeCard(raw: string): ParsedPayload {
  const body = raw.slice(7).replace(/;;\s*$/, '');
  const fields: PayloadField[] = [];
  for (const chunk of splitEscapedRetaining(body, ';')) {
    const at = chunk.indexOf(':');
    if (at < 0) continue;
    const name = chunk.slice(0, at).toUpperCase();
    const rawValue = chunk.slice(at + 1).trim();
    const value = rawValue.replace(/\\([,;:])/g, '$1').trim();
    if (!value || !MECARD_LABELS[name]) continue;
    if (name === 'N') {
      let separator = -1;
      for (let i = 0; i < rawValue.length; i += 1) {
        if (rawValue[i] === '\\') i += 1;
        else if (rawValue[i] === ',') { separator = i; break; }
      }
      const family = (separator < 0 ? rawValue : rawValue.slice(0, separator)).replace(/\\([,;:])/g, '$1').trim();
      const given = (separator < 0 ? '' : rawValue.slice(separator + 1)).replace(/\\([,;:])/g, '$1').trim();
      fields.push({ key: MECARD_LABELS[name], value: [given, family].filter(Boolean).join(' ') });
    } else fields.push({ key: MECARD_LABELS[name], value });
  }
  return { kind: 'mecard', raw, fields, warnings: [] };
}

function parseMailto(raw: string): ParsedPayload {
  const fields: PayloadField[] = [];
  try {
    const parsed = new URL(raw);
    const to = decodeURIComponent(parsed.pathname);
    if (to) fields.push({ key: 'fieldEmail', value: to });
    const subject = parsed.searchParams.get('subject');
    const body = parsed.searchParams.get('body');
    if (subject) fields.push({ key: 'fieldSubject', value: subject });
    if (body) fields.push({ key: 'fieldBody', value: body });
  } catch {
    fields.push({ key: 'fieldEmail', value: raw.slice(7) });
  }
  return { kind: 'email', raw, fields, warnings: [] };
}

function parseSms(raw: string): ParsedPayload {
  // Both `SMSTO:number:body` and `sms:number?body=` are in the wild.
  const fields: PayloadField[] = [];
  if (/^smsto:/i.test(raw)) {
    const rest = raw.slice(6);
    const at = rest.indexOf(':');
    fields.push({ key: 'fieldPhone', value: at < 0 ? rest : rest.slice(0, at), mono: true });
    if (at >= 0 && rest.slice(at + 1)) fields.push({ key: 'fieldMessage', value: rest.slice(at + 1) });
  } else {
    const rest = raw.slice(4);
    const [number, query] = rest.split('?');
    fields.push({ key: 'fieldPhone', value: number, mono: true });
    const body = new URLSearchParams(query || '').get('body');
    if (body) fields.push({ key: 'fieldMessage', value: body });
  }
  return { kind: 'sms', raw, fields, warnings: [] };
}

function parseGeo(raw: string): ParsedPayload {
  const [coords] = raw.slice(4).split('?');
  const [lat = '', lon = ''] = coords.split(',');
  return {
    kind: 'geo',
    raw,
    fields: [
      { key: 'fieldLatitude', value: lat, mono: true },
      { key: 'fieldLongitude', value: lon, mono: true },
    ],
    warnings: [],
  };
}

function parseEvent(raw: string): ParsedPayload {
  const labels: Record<string, string> = {
    SUMMARY: 'fieldSummary',
    DTSTART: 'fieldStart',
    DTEND: 'fieldEnd',
    LOCATION: 'fieldLocation',
    DESCRIPTION: 'fieldNote',
  };
  const fields: PayloadField[] = [];
  for (const line of raw.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)) {
    const at = line.indexOf(':');
    if (at < 0) continue;
    const name = line.slice(0, at).split(';')[0].toUpperCase();
    const value = unescapeVCard(line.slice(at + 1)).trim();
    if (value && labels[name]) fields.push({ key: labels[name], value });
  }
  return { kind: 'event', raw, fields, warnings: [] };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function parsePayload(raw: string): ParsedPayload {
  const trimmed = raw.trim();

  if (/^wifi:/i.test(trimmed)) return parseWifi(trimmed);
  if (/^begin:vcard/i.test(trimmed)) return parseVCard(trimmed);
  if (/^mecard:/i.test(trimmed)) return parseMeCard(trimmed);
  if (/^mailto:/i.test(trimmed)) return parseMailto(trimmed);
  if (/^(smsto:|sms:)/i.test(trimmed)) return parseSms(trimmed);
  if (/^geo:/i.test(trimmed)) return parseGeo(trimmed);
  if (/^begin:vevent/i.test(trimmed) || /^begin:vcalendar/i.test(trimmed)) return parseEvent(trimmed);

  if (/^tel:/i.test(trimmed)) {
    return {
      kind: 'tel',
      raw: trimmed,
      fields: [{ key: 'fieldPhone', value: trimmed.slice(4), mono: true }],
      warnings: [],
    };
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(https?|ftp):/i.test(trimmed)) {
    const review = reviewUrl(trimmed);
    if (review) {
      return {
        kind: 'url',
        raw: trimmed,
        href: review.href,
        host: review.host,
        fields: [{ key: 'fieldHost', value: review.host }],
        warnings: review.warnings,
      };
    }
  }

  // A bare `example.com/page` is by far the most common "text" in the wild.
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(trimmed) && !trimmed.includes(' ')) {
    const review = reviewUrl(`https://${trimmed}`);
    if (review) {
      return {
        kind: 'url',
        raw: trimmed,
        href: review.href,
        host: review.host,
        fields: [{ key: 'fieldHost', value: review.host }],
        // The code did not actually say https, so do not imply that it did.
        warnings: review.warnings.filter(w => w !== 'insecure'),
      };
    }
  }

  return { kind: 'text', raw: trimmed, fields: [], warnings: [] };
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

export interface DecodeResult {
  data: string;
  /** Corner coordinates in image space, for drawing the found box. */
  corners?: { x: number; y: number }[];
}

let jsQRPromise: Promise<typeof import('jsqr').default> | null = null;

function loadDecoder() {
  if (!jsQRPromise) jsQRPromise = import('jsqr').then(m => m.default);
  return jsQRPromise;
}

/**
 * Byte mode carries no charset. jsQR always reads it as UTF-8 and, when the
 * bytes are not valid UTF-8, silently appends nothing — so a code holding
 * ISO-8859-1 (which the QR spec names as the default, and which several
 * generators still emit) decodes to an empty string. Falling back to Latin-1
 * on the raw bytes recovers those instead of showing the user nothing.
 */
function decodeText(found: any): string {
  const text: string = found.data || '';
  if (text) return text;
  const bytes = found.binaryData;
  if (!Array.isArray(bytes) || bytes.length === 0) return text;
  return new TextDecoder('iso-8859-1').decode(new Uint8Array(bytes));
}

export async function decodeImageData(image: ImageData): Promise<DecodeResult | null> {
  const jsQR = await loadDecoder();
  const found = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
  if (!found) return null;
  const loc = found.location;
  return {
    data: decodeText(found),
    corners: loc
      ? [loc.topLeftCorner, loc.topRightCorner, loc.bottomRightCorner, loc.bottomLeftCorner]
      : undefined,
  };
}

/**
 * Photos of codes fail far more often than screenshots: the code is small in
 * frame, slightly rotated and low contrast. Retrying on progressively larger
 * upscales of the centre recovers a lot of those without asking the user to
 * crop anything.
 */
export async function decodeBitmap(bitmap: ImageBitmap): Promise<DecodeResult | null> {
  const attempts: { scale: number; crop: number }[] = [
    { scale: 1, crop: 1 },
    { scale: 2, crop: 1 },
    { scale: 2, crop: 0.6 },
    { scale: 3, crop: 0.4 },
  ];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  for (const attempt of attempts) {
    const sw = bitmap.width * attempt.crop;
    const sh = bitmap.height * attempt.crop;
    const sx = (bitmap.width - sw) / 2;
    const sy = (bitmap.height - sh) / 2;
    // 2000px is plenty for a QR and keeps a 12 MP phone photo from allocating
    // a 100 MB ImageData.
    const target = Math.min(2000, Math.max(sw, sh) * attempt.scale);
    const ratio = target / Math.max(sw, sh);

    canvas.width = Math.max(1, Math.round(sw * ratio));
    canvas.height = Math.max(1, Math.round(sh * ratio));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const result = await decodeImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (result) return result;
  }
  return null;
}

export async function decodeFile(file: File): Promise<DecodeResult | null> {
  const bitmap = await createImageBitmap(file);
  try {
    return await decodeBitmap(bitmap);
  } finally {
    bitmap.close?.();
  }
}
