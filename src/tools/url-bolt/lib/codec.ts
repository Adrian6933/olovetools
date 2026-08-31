// ============================================================================
// Percent-encoding engine
// ----------------------------------------------------------------------------
// `encodeURIComponent` / `encodeURI` are the only two escapes JavaScript ships,
// and neither matches what a spec actually asks for:
//
//   * encodeURIComponent leaves `!'()*` alone — RFC 3986 lists them as
//     sub-delims that must be escaped inside a component.
//   * Neither produces `application/x-www-form-urlencoded` (space as `+`),
//     which is what every HTML form and most backends emit.
//   * Both throw URIError on a lone surrogate instead of doing something useful.
//   * decodeURIComponent throws on a truncated `%E0%A4%A` and gives you no clue
//     where the input went wrong.
//
// So we encode at the byte level ourselves: TextEncoder gives correct UTF-8 for
// astral pairs and substitutes U+FFFD for lone surrogates instead of throwing,
// and a per-profile lookup table decides which bytes survive as literals.
// ============================================================================

export type EncodeProfile = 'component' | 'uri' | 'strict' | 'form' | 'path' | 'query' | 'fragment' | 'rfc5987';

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Characters left as literals by each profile. Everything else becomes %XX of
 * its UTF-8 bytes.
 */
const SAFE_CHARS: Record<EncodeProfile, string> = {
  /** What encodeURIComponent does, kept for comparison and for legacy output. */
  component: ALPHANUM + "-_.!~*'()",
  /** What encodeURI does: preserves the characters that build URL syntax. */
  uri: ALPHANUM + "-_.!~*'();/?:@&=+$,#",
  /** RFC 3986 §2.3 unreserved set, and nothing else. */
  strict: ALPHANUM + '-._~',
  /** WHATWG urlencoded serializer; space is handled separately as `+`. */
  form: ALPHANUM + '*-._',
  /** RFC 3986 pchar, minus `/` so a value cannot forge a new path segment. */
  path: ALPHANUM + "-._~!$&'()*+,;=:@",
  /** pchar + `/?`, minus the separators that would end or split the query. */
  query: ALPHANUM + "-._~!$'()*,:@/?",
  /** RFC 3986 fragment: pchar + `/?`. */
  fragment: ALPHANUM + "-._~!$&'()*+,;=:@/?",
  /** RFC 5987 attr-char, for Content-Disposition style headers. */
  rfc5987: ALPHANUM + "!#$&+-.^_`|~",
};

/** One 128-slot lookup table per profile, built once. */
const SAFE_TABLES: Record<string, Uint8Array> = {};

function safeTable(profile: EncodeProfile): Uint8Array {
  let table = SAFE_TABLES[profile];
  if (!table) {
    table = new Uint8Array(128);
    for (const char of SAFE_CHARS[profile]) table[char.charCodeAt(0)] = 1;
    SAFE_TABLES[profile] = table;
  }
  return table;
}

const HEX = '0123456789ABCDEF';

export interface EncodeOptions {
  profile: EncodeProfile;
  /** Encode space as `+` instead of `%20`. Implied by the `form` profile. */
  plusForSpace?: boolean;
  /** Emit `%2f` instead of `%2F`. Some legacy signing schemes require it. */
  lowercaseHex?: boolean;
}

export interface EncodeResult {
  value: string;
  /** How many characters of the input needed escaping. */
  escaped: number;
  /** Byte length of the UTF-8 input, for the overhead metric. */
  inputBytes: number;
  /** True when the input carried a lone surrogate that had to be replaced. */
  lostSurrogate: boolean;
}

/**
 * Percent-encodes `input` under the given profile.
 *
 * Unlike the built-ins this never throws: a lone surrogate is reported through
 * `lostSurrogate` rather than aborting the whole operation.
 */
export function encode(input: string, options: EncodeOptions): EncodeResult {
  const { profile, plusForSpace, lowercaseHex } = options;
  const table = safeTable(profile);
  const usePlus = plusForSpace ?? profile === 'form';
  const bytes = new TextEncoder().encode(input);

  // TextEncoder maps every lone surrogate to U+FFFD (EF BF BD). The input only
  // legitimately contains that sequence if the user typed U+FFFD themselves.
  const lostSurrogate = /[\uD800-\uDFFF]/.test(input.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, ''));

  let out = '';
  let escaped = 0;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0x20 && usePlus) {
      out += '+';
      escaped++;
    } else if (byte < 128 && table[byte]) {
      out += String.fromCharCode(byte);
    } else {
      const hi = HEX[byte >> 4];
      const lo = HEX[byte & 15];
      out += '%' + (lowercaseHex ? (hi + lo).toLowerCase() : hi + lo);
      escaped++;
    }
  }

  return { value: out, escaped, inputBytes: bytes.length, lostSurrogate };
}

export interface DecodeIssue {
  /** Character offset in the input where the problem starts. */
  index: number;
  kind: 'truncated' | 'bad-hex' | 'bad-utf8';
  /** The offending snippet, for the error message. */
  snippet: string;
}

export interface DecodeResult {
  value: string;
  issues: DecodeIssue[];
  /** How many `%XX` sequences were actually consumed. */
  decoded: number;
}

export interface DecodeOptions {
  /** Treat `+` as an encoded space (correct for query strings and forms). */
  plusAsSpace?: boolean;
  /**
   * Strict stops at the first malformed sequence; lenient keeps the offending
   * `%` as a literal and carries on. Lenient is the useful default: a URL
   * pasted out of a log is usually 99% recoverable, and returning an empty
   * string for it (what decodeURIComponent forces you to do) helps nobody.
   */
  strict?: boolean;
}

const HEX_RE = /^[0-9a-fA-F]{2}$/;

/**
 * Percent-decodes `input`, collecting problems instead of throwing.
 *
 * Bytes are gathered into runs so that a multi-byte UTF-8 character split
 * across several `%XX` groups decodes as one character.
 */
export function decode(input: string, options: DecodeOptions = {}): DecodeResult {
  const { plusAsSpace = false, strict = false } = options;
  const issues: DecodeIssue[] = [];
  const decoder = new TextDecoder('utf-8', { fatal: false });

  let out = '';
  let decodedCount = 0;
  let pending: number[] = [];
  let pendingStart = 0;

  const flush = () => {
    if (!pending.length) return;
    const text = decoder.decode(new Uint8Array(pending));
    if (text.includes('�')) {
      issues.push({ index: pendingStart, kind: 'bad-utf8', snippet: input.slice(pendingStart, pendingStart + 9) });
    }
    out += text;
    pending = [];
  };

  for (let i = 0; i < input.length; ) {
    const char = input[i];
    if (char === '%') {
      const hex = input.slice(i + 1, i + 3);
      if (hex.length < 2) {
        issues.push({ index: i, kind: 'truncated', snippet: input.slice(i) });
        if (strict) break;
        flush();
        out += char;
        i++;
        continue;
      }
      if (!HEX_RE.test(hex)) {
        issues.push({ index: i, kind: 'bad-hex', snippet: input.slice(i, i + 3) });
        if (strict) break;
        flush();
        out += char;
        i++;
        continue;
      }
      if (!pending.length) pendingStart = i;
      pending.push(parseInt(hex, 16));
      decodedCount++;
      i += 3;
      continue;
    }
    flush();
    out += plusAsSpace && char === '+' ? ' ' : char;
    i++;
  }
  flush();

  return { value: out, issues, decoded: decodedCount };
}

export interface IterativeDecodeResult extends DecodeResult {
  /** How many full decode passes changed the string. 2+ means double-encoded. */
  rounds: number;
}

/**
 * Decodes repeatedly until the string stops changing.
 *
 * Double and triple encoding is the normal state of affairs in redirect chains
 * (`?next=https%253A%252F%252F...`), and decoding it by hand one pass at a time
 * is exactly the chore this tool exists to remove.
 */
export function decodeDeep(input: string, options: DecodeOptions = {}, maxRounds = 5): IterativeDecodeResult {
  let current = input;
  let rounds = 0;
  let last: DecodeResult = { value: input, issues: [], decoded: 0 };

  for (let i = 0; i < maxRounds; i++) {
    const step = decode(current, options);
    if (step.value === current) break;
    current = step.value;
    last = step;
    rounds++;
    // A pass that decoded nothing but still changed the string can only have
    // been the `+` substitution; there is nothing left to unwrap.
    if (!step.decoded) break;
  }

  return { value: current, issues: last.issues, decoded: last.decoded, rounds };
}

/**
 * Encodes then decodes again and reports whether the original survived.
 *
 * Cheap, and the only honest way to tell a user that the escape they are about
 * to paste into a signing routine is reversible.
 */
export function roundTrips(input: string, options: EncodeOptions): boolean {
  const encoded = encode(input, options);
  const back = decode(encoded.value, { plusAsSpace: options.plusForSpace ?? options.profile === 'form' });
  return back.value === input && back.issues.length === 0;
}
