// ============================================================================
// Punycode (RFC 3492) decoding, plus the homograph check it enables
// ----------------------------------------------------------------------------
// `new URL()` silently converts an international hostname to its ASCII form:
//   new URL('https://bücher.example').hostname  →  'xn--bcher-kva.example'
// The platform gives you no way back, so a URL inspector that only prints
// `url.hostname` shows the user a string they cannot read — and, worse, hides
// the one attack this field actually has: a domain spelled with Cyrillic or
// Greek lookalikes that renders identically to a brand they trust.
//
// The decoder below is the reference algorithm from RFC 3492 §6.2. It is 60
// lines and has no dependencies, which is the whole reason not to skip it.
// ============================================================================

const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const DELIMITER = '-';

/** Maps a basic code point to its digit value, or BASE when it is not a digit. */
function basicToDigit(code: number): number {
  if (code >= 0x30 && code <= 0x39) return code - 0x30 + 26; // 0-9 → 26..35
  if (code >= 0x41 && code <= 0x5a) return code - 0x41; // A-Z → 0..25
  if (code >= 0x61 && code <= 0x7a) return code - 0x61; // a-z → 0..25
  return BASE;
}

function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
    d = Math.floor(d / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * d) / (d + SKEW));
}

/** Decodes one `xn--` label. Returns null when the label is not valid punycode. */
export function decodeLabel(label: string): string | null {
  const input = label.toLowerCase().startsWith('xn--') ? label.slice(4) : null;
  if (input === null) return null;

  const output: number[] = [];
  const lastDelim = input.lastIndexOf(DELIMITER);

  // Everything before the final delimiter is already plain ASCII.
  if (lastDelim > 0) {
    for (let i = 0; i < lastDelim; i++) output.push(input.charCodeAt(i));
  }

  let n = INITIAL_N;
  let bias = INITIAL_BIAS;
  let i = 0;

  for (let index = lastDelim > 0 ? lastDelim + 1 : 0; index < input.length; ) {
    const oldI = i;
    for (let w = 1, k = BASE; ; k += BASE) {
      if (index >= input.length) return null;
      const digit = basicToDigit(input.charCodeAt(index++));
      if (digit >= BASE) return null;
      if (digit > Math.floor((0x7fffffff - i) / w)) return null;
      i += digit * w;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      if (w > Math.floor(0x7fffffff / (BASE - t))) return null;
      w *= BASE - t;
    }

    const outLength = output.length + 1;
    bias = adaptBias(i - oldI, outLength, oldI === 0);
    if (Math.floor(i / outLength) > 0x7fffffff - n) return null;
    n += Math.floor(i / outLength);
    i %= outLength;
    output.splice(i++, 0, n);
  }

  try {
    return String.fromCodePoint(...output);
  } catch {
    return null;
  }
}

/**
 * Rebuilds a readable hostname from its ASCII form. Labels that are not
 * punycode are passed through untouched.
 */
export function toUnicodeHost(host: string): string {
  if (!/(^|\.)xn--/i.test(host)) return host;
  return host
    .split('.')
    .map(label => decodeLabel(label) ?? label)
    .join('.');
}

/** True when the host carries at least one `xn--` label. */
export function isIdn(host: string): boolean {
  return /(^|\.)xn--/i.test(host);
}

// ---------------------------------------------------------------------------
// Homograph detection
// ---------------------------------------------------------------------------

const SCRIPTS: { name: string; test: RegExp }[] = [
  { name: 'Latin', test: /\p{Script=Latin}/u },
  { name: 'Cyrillic', test: /\p{Script=Cyrillic}/u },
  { name: 'Greek', test: /\p{Script=Greek}/u },
  { name: 'Han', test: /\p{Script=Han}/u },
  { name: 'Arabic', test: /\p{Script=Arabic}/u },
  { name: 'Hebrew', test: /\p{Script=Hebrew}/u },
  { name: 'Hiragana', test: /\p{Script=Hiragana}/u },
  { name: 'Katakana', test: /\p{Script=Katakana}/u },
  { name: 'Hangul', test: /\p{Script=Hangul}/u },
  { name: 'Cherokee', test: /\p{Script=Cherokee}/u },
];

/** Lists the writing systems present in a decoded hostname. */
export function scriptsIn(unicodeHost: string): string[] {
  const found: string[] = [];
  for (const script of SCRIPTS) {
    if (script.test.test(unicodeHost)) found.push(script.name);
  }
  return found;
}

/**
 * A single label mixing Latin with another script is the classic spoof
 * (`аpple.com` with a Cyrillic а). Mixing across *different* labels is normal
 * in the real world, so we check label by label.
 */
export function hasMixedScriptLabel(unicodeHost: string): boolean {
  return unicodeHost.split('.').some(label => scriptsIn(label).length > 1);
}
