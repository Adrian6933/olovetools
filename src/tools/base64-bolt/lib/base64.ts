// ============================================================================
// The Base64 engine.
// ----------------------------------------------------------------------------
// Everything here works on `Uint8Array`, never on an intermediate "binary
// string". That matters for three reasons:
//
//  1. Correctness. The old path was `btoa(unescape(encodeURIComponent(text)))`
//     and `decodeURIComponent(escape(atob(text)))`. `escape`/`unescape` are
//     Annex B leftovers, they throw on lone surrogates, and the decode form
//     throws URIError on any byte sequence that is not valid UTF-8 — which is
//     most binary data. The tool then blamed the *Base64* for being invalid
//     when the Base64 was perfect and only the text interpretation had failed.
//
//  2. Speed. `Uint8Array.prototype.toBase64` / `Uint8Array.fromBase64`
//     (ES2025: Chrome 133, Firefox 133, Safari 18.2) do the whole conversion
//     inside the engine, with native support for the URL-safe alphabet,
//     omitted padding, and a partial last chunk. When they are missing we fall
//     back to chunked `btoa`/`atob`, which is what the old code did for the
//     whole input.
//
//  3. Diagnosis. Having the bytes means we can say *where* the input broke —
//     which offset holds the invalid character, whether the length is a
//     multiple of 4, whether the trailing bits are canonical — instead of a
//     single "Invalid Base64 string".
//
// No function here throws for bad input: they return `{ value, error }`, since
// the project builds without strictNullChecks and a discriminated union on a
// boolean would not narrow.
// ============================================================================

export type Alphabet = 'base64' | 'base64url';

/** How the input text is turned into bytes before encoding. */
export type SourceCharset = 'utf-8' | 'latin1';

export interface EncodeOptions {
  alphabet: Alphabet;
  /** Keep the `=` tail. Off is legal and common in JWTs and URLs. */
  padding: boolean;
  /** Insert a line break every N characters. 0 disables wrapping. */
  wrap: number;
  /** Use CRLF for those breaks (what MIME/PEM actually specify). */
  crlf: boolean;
}

export const DEFAULT_ENCODE: EncodeOptions = {
  alphabet: 'base64',
  padding: true,
  wrap: 0,
  crlf: false,
};

// ---------------------------------------------------------------------------
// Native fast path
// ---------------------------------------------------------------------------

interface NativeToBase64 {
  (options?: { alphabet?: Alphabet; omitPadding?: boolean }): string;
}
interface NativeFromBase64 {
  (
    input: string,
    options?: { alphabet?: Alphabet | 'base64url'; lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial' }
  ): Uint8Array;
}

/** True when the engine can do the conversion itself. Read once, at module load. */
export const HAS_NATIVE_BASE64: boolean =
  typeof (Uint8Array.prototype as unknown as { toBase64?: NativeToBase64 }).toBase64 === 'function' &&
  typeof (Uint8Array as unknown as { fromBase64?: NativeFromBase64 }).fromBase64 === 'function';

const nativeTo = (bytes: Uint8Array, alphabet: Alphabet, omitPadding: boolean): string =>
  (bytes as unknown as { toBase64: NativeToBase64 }).toBase64({ alphabet, omitPadding });

const nativeFrom = (text: string, alphabet: Alphabet): Uint8Array =>
  (Uint8Array as unknown as { fromBase64: NativeFromBase64 }).fromBase64(text, {
    alphabet,
    lastChunkHandling: 'loose',
  });

// ---------------------------------------------------------------------------
// Fallback path
// ---------------------------------------------------------------------------

/**
 * 32 KB at a time. `String.fromCharCode(...bytes)` spreads the array into the
 * argument list, and a few hundred thousand arguments overflows the call stack
 * — which is why this is a loop over subarrays and not a one-liner.
 */
const CHUNK = 0x8000;

function fallbackTo(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(binary);
}

function fallbackFrom(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

function wrapLines(text: string, width: number, crlf: boolean): string {
  if (!width || width >= text.length) return text;
  const eol = crlf ? '\r\n' : '\n';
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += width) parts.push(text.slice(i, i + width));
  return parts.join(eol);
}

/** Bytes → Base64, honouring the alphabet, padding and wrapping options. */
export function encodeBytes(bytes: Uint8Array, options: EncodeOptions = DEFAULT_ENCODE): string {
  let out: string;
  if (HAS_NATIVE_BASE64) {
    out = nativeTo(bytes, options.alphabet, !options.padding);
  } else {
    out = fallbackTo(bytes);
    if (options.alphabet === 'base64url') out = out.replace(/\+/g, '-').replace(/\//g, '_');
    if (!options.padding) out = out.replace(/=+$/, '');
  }
  return wrapLines(out, options.wrap, options.crlf);
}

/**
 * Text → bytes. UTF-8 goes through TextEncoder (which replaces lone surrogates
 * with U+FFFD instead of throwing, and reports that it did). Latin-1 is there
 * because plenty of legacy payloads are byte-per-character and round-tripping
 * them through UTF-8 silently doubles every accented character.
 */
export function textToBytes(text: string, charset: SourceCharset): { bytes: Uint8Array; lostChars: number } {
  if (charset === 'latin1') {
    const bytes = new Uint8Array(text.length);
    let lost = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code > 0xff) {
        bytes[i] = 0x3f; // '?'
        lost++;
      } else {
        bytes[i] = code;
      }
    }
    return { bytes, lostChars: lost };
  }

  // A lone surrogate cannot be represented in UTF-8; TextEncoder emits U+FFFD.
  const lost = (text.match(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/g) || []).length;
  return { bytes: new TextEncoder().encode(text), lostChars: lost };
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

export type IssueKind =
  | 'invalid-char'
  | 'bad-length'
  | 'non-canonical'
  | 'mixed-alphabet'
  | 'whitespace-stripped'
  | 'padding-added'
  | 'data-url';

export interface Issue {
  kind: IssueKind;
  /** Offset in the original input, when the issue has one. */
  at?: number;
  /** The offending characters, or a count, depending on the kind. */
  detail?: string;
}

export interface DecodeResult {
  bytes: Uint8Array;
  /** Alphabet actually detected in the input. */
  alphabet: Alphabet;
  /** MIME type declared by a `data:` prefix, when there was one. */
  declaredMime: string;
  /** Non-fatal observations, in input order. */
  issues: Issue[];
}

const STANDARD = /^[A-Za-z0-9+/]$/;
const URLSAFE = /^[A-Za-z0-9\-_]$/;

/**
 * Base64 → bytes, plus everything we learned on the way.
 *
 * The parse is deliberately forgiving in the ways real payloads are broken —
 * wrapped at 76 columns, missing padding, URL-safe, still carrying its
 * `data:image/png;base64,` prefix — and precise about the ways it is genuinely
 * wrong, reporting offsets in the *original* string so the UI can point at them.
 */
export function decodeBase64(input: string): { value: DecodeResult; error: string } {
  const issues: Issue[] = [];
  let text = input;
  let declaredMime = '';

  // data: URL prefix ---------------------------------------------------------
  const dataUrl = /^\s*data:([^;,]*)((?:;[^;,]*)*),/i.exec(text);
  if (dataUrl) {
    declaredMime = dataUrl[1] || '';
    const isBase64 = /;\s*base64\s*$/i.test(dataUrl[2] || '');
    text = text.slice(dataUrl[0].length);
    issues.push({ kind: 'data-url', detail: declaredMime || 'text/plain' });
    if (!isBase64) {
      // A percent-encoded data URL is not Base64 at all.
      return {
        value: { bytes: new Uint8Array(0), alphabet: 'base64', declaredMime, issues },
        error: 'not-base64-data-url',
      };
    }
  }

  // Whitespace + alphabet scan ----------------------------------------------
  let clean = '';
  let stripped = 0;
  let sawStandard = false;
  let sawUrlSafe = false;
  /** How many `=` the input already carried, so we do not claim to have added them. */
  let padGiven = 0;
  const invalid: Issue[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n' || ch === '\r' || ch === '\t' || ch === ' ' || ch === '\f' || ch === '\v') {
      stripped++;
      continue;
    }
    if (ch === '=') {
      padGiven++;
      clean += ch;
      continue;
    }
    if (ch === '+' || ch === '/') sawStandard = true;
    else if (ch === '-' || ch === '_') sawUrlSafe = true;
    else if (!STANDARD.test(ch) && !URLSAFE.test(ch)) {
      if (invalid.length < 8) invalid.push({ kind: 'invalid-char', at: i, detail: describeChar(ch) });
      continue;
    }
    clean += ch;
  }

  if (stripped) issues.push({ kind: 'whitespace-stripped', detail: String(stripped) });
  if (sawStandard && sawUrlSafe) issues.push({ kind: 'mixed-alphabet' });

  if (invalid.length) {
    // The characters are dropped rather than aborting: a single stray quote
    // from a copy/paste should not cost the user the whole payload. But we say so.
    issues.push(...invalid);
  }

  const alphabet: Alphabet = sawUrlSafe && !sawStandard ? 'base64url' : 'base64';

  // Padding ------------------------------------------------------------------
  const body = clean.replace(/=+$/, '');
  const remainder = body.length % 4;
  if (remainder === 1) {
    // 1 leftover character carries 6 bits: not a whole byte, unrecoverable.
    return {
      value: { bytes: new Uint8Array(0), alphabet, declaredMime, issues },
      error: 'bad-length',
    };
  }

  let padded = body;
  if (remainder) {
    const needed = 4 - remainder;
    padded = body + '='.repeat(needed);
    // Only worth mentioning when the input really was missing it. A correctly
    // padded string also lands here (the `=` are stripped into `body` first),
    // and reporting that as "padding assumed" was simply untrue.
    if (padGiven < needed) issues.push({ kind: 'padding-added', detail: String(needed - padGiven) });
  }

  // Canonical trailing bits --------------------------------------------------
  // "QQ==" decodes to 0x41, but so does "QR==": the last 4 bits of 'R' are
  // discarded. Encoders never emit that, so its presence means the string was
  // hand-edited or truncated.
  if (remainder === 2 || body.length % 4 === 2) {
    const last = body[body.length - 1];
    if (last && indexIn(last) % 16 !== 0) issues.push({ kind: 'non-canonical', detail: last });
  } else if (remainder === 3 || body.length % 4 === 3) {
    const last = body[body.length - 1];
    if (last && indexIn(last) % 4 !== 0) issues.push({ kind: 'non-canonical', detail: last });
  }

  if (!padded) {
    return { value: { bytes: new Uint8Array(0), alphabet, declaredMime, issues }, error: '' };
  }

  // Decode -------------------------------------------------------------------
  try {
    let bytes: Uint8Array;
    if (HAS_NATIVE_BASE64) {
      // Native rejects the wrong alphabet outright, so normalise first when the
      // input mixed the two.
      const normalised = alphabet === 'base64' ? padded.replace(/-/g, '+').replace(/_/g, '/') : padded;
      bytes = nativeFrom(normalised, alphabet);
    } else {
      bytes = fallbackFrom(padded.replace(/-/g, '+').replace(/_/g, '/'));
    }
    return { value: { bytes, alphabet, declaredMime, issues }, error: '' };
  } catch {
    return { value: { bytes: new Uint8Array(0), alphabet, declaredMime, issues }, error: 'undecodable' };
  }
}

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function indexIn(ch: string): number {
  const i = ALPHA.indexOf(ch);
  if (i >= 0) return i;
  if (ch === '+' || ch === '-') return 62;
  if (ch === '/' || ch === '_') return 63;
  return 0;
}

/** A printable label for a byte that may well be a control character. */
function describeChar(ch: string): string {
  const code = ch.codePointAt(0) || 0;
  if (code < 0x20 || code === 0x7f) return `U+${code.toString(16).toUpperCase().padStart(4, '0')}`;
  return ch;
}

// ---------------------------------------------------------------------------
// Bytes → text
// ---------------------------------------------------------------------------

/**
 * Turns decoded bytes back into readable text, and is honest when it cannot.
 * `fatal: true` is the point: a silent U+FFFD everywhere is how the old tool
 * pretended a PNG was a string.
 */
export function bytesToText(
  bytes: Uint8Array,
  charset: SourceCharset
): { value: string; error: string } {
  if (charset === 'latin1') {
    let out = '';
    for (let i = 0; i < bytes.length; i += CHUNK) {
      out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
    }
    return { value: out, error: '' };
  }
  try {
    return { value: new TextDecoder('utf-8', { fatal: true }).decode(bytes), error: '' };
  } catch {
    return { value: '', error: 'not-utf8' };
  }
}

/** How much bigger the Base64 form is, as a percentage of the original. */
export function overheadPct(rawBytes: number, encodedChars: number): number {
  if (!rawBytes) return 0;
  return Math.round((encodedChars / rawBytes) * 100);
}

/** Exact encoded length for a byte count, before any wrapping. */
export function encodedLength(bytes: number, padding: boolean): number {
  if (padding) return Math.ceil(bytes / 3) * 4;
  const full = Math.floor(bytes / 3) * 4;
  const rest = bytes % 3;
  return full + (rest === 0 ? 0 : rest + 1);
}
