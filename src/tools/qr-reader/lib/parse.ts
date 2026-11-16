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
  | 'product'
  | 'isbn'
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
  /** Symbology it was read from, e.g. `QRCode` or `EAN13`, when known. */
  format?: string;
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
// Barcodes
// ---------------------------------------------------------------------------

/** Retail codes: what is printed on a product, a book or a shelf label. */
const RETAIL = /^(EAN|UPC|ISBN)/i;

/** The GS1 check digit, the same for EAN-8, EAN-13, UPC-A and GTIN-14. */
export function gtinIsValid(code: string): boolean {
  if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * Takes a decoded symbol and describes it. QR, Data Matrix, Aztec and PDF417
 * carry the same kinds of payload, so they go through `parsePayload`; retail
 * barcodes only carry a number and get a product view instead.
 */
export function parseScan(text: string, format = ''): ParsedPayload {
  const raw = text.trim();
  if (RETAIL.test(format) && /^\d+$/.test(raw)) {
    const isBook = raw.length === 13 && /^97[89]/.test(raw);
    const fields: PayloadField[] = [
      { key: isBook ? 'fieldIsbn' : 'fieldGtin', value: raw, mono: true },
      { key: 'fieldFormat', value: prettyFormat(format) },
    ];
    if (!gtinIsValid(raw)) fields.push({ key: 'fieldCheck', value: 'invalid' });
    return { kind: isBook ? 'isbn' : 'product', raw, fields, warnings: [], format };
  }
  const payload = parsePayload(raw);
  payload.format = format || undefined;
  return payload;
}

const FORMAT_NAMES: Record<string, string> = {
  QRCode: 'QR Code',
  MicroQRCode: 'Micro QR',
  RMQRCode: 'rMQR',
  DataMatrix: 'Data Matrix',
  Aztec: 'Aztec',
  PDF417: 'PDF417',
  MaxiCode: 'MaxiCode',
  EAN13: 'EAN-13',
  EAN8: 'EAN-8',
  UPCA: 'UPC-A',
  UPCE: 'UPC-E',
  Code128: 'Code 128',
  Code39: 'Code 39',
  Code93: 'Code 93',
  Codabar: 'Codabar',
  ITF: 'ITF',
  DataBar: 'GS1 DataBar',
  DataBarExpanded: 'GS1 DataBar Exp.',
  DataBarLimited: 'GS1 DataBar Ltd.',
  DXFilmEdge: 'DX Film Edge',
};

/** `EAN13` → `EAN-13`; anything unknown is shown as it came. */
export function prettyFormat(format: string): string {
  const key = format.replace(/[\s-]/g, '');
  return FORMAT_NAMES[key] || format;
}

/** QR-like symbols can hold structured payloads; linear ones only hold a string. */
export function isMatrixFormat(format = ''): boolean {
  return /qr|matrix|aztec|pdf417|maxi/i.test(format) || !format;
}
