// ============================================================================
// The identifier engine.
// ----------------------------------------------------------------------------
// Everything here works on RAW BYTES, not on formatted strings, and that is the
// whole design:
//
//  * A batch of 100 000 v4 UUIDs is one `Uint8Array` of 1.6 MB. The same batch
//    as JavaScript strings is ~10 MB (36 UTF-16 chars + object header each), so
//    the undo history stores bytes and re-derives the text on demand.
//  * Formatting (case, hyphens, braces, urn:, quotes) is a pure function of
//    those bytes, so changing the output style never regenerates anything.
//  * The inspector reads the same bytes back, which is what makes editing a
//    single nibble — the version, the variant, one timestamp byte — possible
//    without throwing the identifier away.
//
// No network, no CDN, no WebAssembly fetch: SHA-1 comes from Web Crypto and
// falls back to hash-wasm (wasm embedded as base64 in the bundle) on insecure
// origins where `crypto.subtle` simply does not exist.
// ============================================================================

export const KINDS = [
  'v4',
  'v7',
  'v1',
  'v6',
  'v3',
  'v5',
  'nil',
  'max',
  'ulid',
  'nanoid',
  'objectid',
] as const;

export type Kind = (typeof KINDS)[number];

/** Bytes per identifier. `nanoid` is the only text-native kind (0 = strings). */
export const WIDTH: Record<Kind, number> = {
  v1: 16,
  v3: 16,
  v4: 16,
  v5: 16,
  v6: 16,
  v7: 16,
  nil: 16,
  max: 16,
  ulid: 16,
  objectid: 12,
  nanoid: 0,
};

/** Kinds whose value is derived from a namespace + a name (RFC 4122 §4.3). */
export const NAMED_KINDS: Kind[] = ['v3', 'v5'];
/** Kinds that carry a readable timestamp in their leading bits. */
export const TIME_KINDS: Kind[] = ['v1', 'v6', 'v7', 'ulid', 'objectid'];
/** Kinds that are a single constant — a count makes no sense for them. */
export const CONSTANT_KINDS: Kind[] = ['nil', 'max'];

export const PRESET_NAMESPACES = {
  dns: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  url: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  oid: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  x500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
} as const;

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

/**
 * `crypto.getRandomValues` throws QuotaExceededError above 65 536 bytes — the
 * limit is in the spec, not in any particular browser — so a 100 000 UUID batch
 * (1.6 MB) has to be filled in 64 KB slices. Missing that is the classic reason
 * bulk generators cap themselves at a few hundred ids.
 */
const RANDOM_CHUNK = 65536;

export function fillRandom(target: Uint8Array): Uint8Array {
  for (let offset = 0; offset < target.length; offset += RANDOM_CHUNK) {
    crypto.getRandomValues(target.subarray(offset, Math.min(offset + RANDOM_CHUNK, target.length)));
  }
  return target;
}

export function randomBytes(length: number): Uint8Array {
  return fillRandom(new Uint8Array(length));
}

// ---------------------------------------------------------------------------
// Hex helpers (a 256-entry table beats `toString(16).padStart` by ~4x on a
// 100 000 item batch, and this runs once per rendered row)
// ---------------------------------------------------------------------------

const HEX: string[] = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function bytesToHex(bytes: Uint8Array, offset = 0, length = bytes.length - offset): string {
  let out = '';
  for (let i = 0; i < length; i++) out += HEX[bytes[offset + i]];
  return out;
}

export function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    const value = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(value)) return null;
    out[i] = value;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Time-based kinds
// ---------------------------------------------------------------------------

/** 100-ns intervals between 1582-10-15 (the UUID epoch) and 1970-01-01. */
const GREGORIAN_OFFSET_MS = 12219292800000;

// Per-run state. v1/v6 need a stable node + clock sequence for the whole run,
// and v7/ULID need a counter so ids minted inside the same millisecond still
// sort in creation order (this is the property people actually buy v7 for).
let sessionNode: Uint8Array | null = null;
let sessionClockSeq = 0;
let lastMillis = -1;
let subCounter = 0;
let lastHundredNanos = 0n;

function getNode(): Uint8Array {
  if (!sessionNode) {
    sessionNode = randomBytes(6);
    // RFC 4122 §4.5: a random node id must set the multicast bit so it can
    // never collide with a real, IEEE-assigned MAC address.
    sessionNode[0] |= 0x01;
    sessionClockSeq = randomBytes(2)[0] & 0x3f;
  }
  return sessionNode;
}

/** Monotonic 60-bit Gregorian timestamp, in 100-ns units. */
function nextHundredNanos(nowMs: number): bigint {
  let value = (BigInt(nowMs) + BigInt(GREGORIAN_OFFSET_MS)) * 10000n;
  if (value <= lastHundredNanos) value = lastHundredNanos + 1n;
  lastHundredNanos = value;
  return value;
}

function writeV1(bytes: Uint8Array, offset: number, nowMs: number): void {
  const node = getNode();
  const ts = nextHundredNanos(nowMs);
  const timeLow = Number(ts & 0xffffffffn);
  const timeMid = Number((ts >> 32n) & 0xffffn);
  const timeHigh = Number((ts >> 48n) & 0x0fffn);

  bytes[offset] = (timeLow >>> 24) & 0xff;
  bytes[offset + 1] = (timeLow >>> 16) & 0xff;
  bytes[offset + 2] = (timeLow >>> 8) & 0xff;
  bytes[offset + 3] = timeLow & 0xff;
  bytes[offset + 4] = (timeMid >>> 8) & 0xff;
  bytes[offset + 5] = timeMid & 0xff;
  bytes[offset + 6] = 0x10 | ((timeHigh >>> 8) & 0x0f);
  bytes[offset + 7] = timeHigh & 0xff;
  bytes[offset + 8] = 0x80 | sessionClockSeq;
  bytes[offset + 9] = randomBytes(1)[0];
  bytes.set(node, offset + 10);
}

function writeV6(bytes: Uint8Array, offset: number, nowMs: number): void {
  // v6 is v1 with the timestamp fields reordered most-significant-first, which
  // is the single change that makes it sort chronologically as raw bytes.
  const node = getNode();
  const ts = nextHundredNanos(nowMs);
  const timeHigh = Number((ts >> 28n) & 0xffffffffn);
  const timeMid = Number((ts >> 12n) & 0xffffn);
  const timeLow = Number(ts & 0x0fffn);

  bytes[offset] = (timeHigh >>> 24) & 0xff;
  bytes[offset + 1] = (timeHigh >>> 16) & 0xff;
  bytes[offset + 2] = (timeHigh >>> 8) & 0xff;
  bytes[offset + 3] = timeHigh & 0xff;
  bytes[offset + 4] = (timeMid >>> 8) & 0xff;
  bytes[offset + 5] = timeMid & 0xff;
  bytes[offset + 6] = 0x60 | ((timeLow >>> 8) & 0x0f);
  bytes[offset + 7] = timeLow & 0xff;
  bytes[offset + 8] = 0x80 | sessionClockSeq;
  bytes[offset + 9] = randomBytes(1)[0];
  bytes.set(node, offset + 10);
}

/** Advances the sub-millisecond counter used by v7 and ULID. */
function nextSubCounter(nowMs: number): { millis: number; counter: number } {
  if (nowMs > lastMillis) {
    lastMillis = nowMs;
    subCounter = randomBytes(2)[0] & 0x0f; // small random start, room to climb
  } else {
    subCounter += 1;
    // Check exhaustion even when our logical clock is ahead of wall time.
    // Large batches and clock rollback can cross this boundary repeatedly.
    if (subCounter > 0xfff) {
      lastMillis += 1;
      subCounter = 0;
    }
  }
  return { millis: lastMillis, counter: subCounter };
}

function writeV7(bytes: Uint8Array, offset: number, nowMs: number, random: Uint8Array, randomOffset: number): void {
  const { millis, counter } = nextSubCounter(nowMs);
  bytes[offset] = Math.floor(millis / 2 ** 40) & 0xff;
  bytes[offset + 1] = Math.floor(millis / 2 ** 32) & 0xff;
  bytes[offset + 2] = Math.floor(millis / 2 ** 24) & 0xff;
  bytes[offset + 3] = Math.floor(millis / 2 ** 16) & 0xff;
  bytes[offset + 4] = Math.floor(millis / 2 ** 8) & 0xff;
  bytes[offset + 5] = millis & 0xff;
  bytes[offset + 6] = 0x70 | ((counter >>> 8) & 0x0f);
  bytes[offset + 7] = counter & 0xff;
  for (let i = 8; i < 16; i++) bytes[offset + i] = random[randomOffset + i];
  bytes[offset + 8] = 0x80 | (bytes[offset + 8] & 0x3f);
}

// ---------------------------------------------------------------------------
// ULID / NanoID / ObjectId
// ---------------------------------------------------------------------------

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** 128 bits → 26 Crockford base32 characters (the ULID text form). */
export function encodeUlid(bytes: Uint8Array, offset = 0): string {
  let bits = 0;
  let value = 0;
  let out = '';
  // 128 bits do not divide into 5-bit groups, so the first character encodes
  // only the top 2 bits — hence the leading pad below.
  bits = 2;
  value = 0;
  for (let i = 0; i < 16; i++) {
    value = (value << 8) | bytes[offset + i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += CROCKFORD[(value >>> bits) & 0x1f];
      value &= (1 << bits) - 1;
    }
  }
  return out;
}

function writeUlid(bytes: Uint8Array, offset: number, nowMs: number, random: Uint8Array, randomOffset: number): void {
  const { millis, counter } = nextSubCounter(nowMs);
  bytes[offset] = Math.floor(millis / 2 ** 40) & 0xff;
  bytes[offset + 1] = Math.floor(millis / 2 ** 32) & 0xff;
  bytes[offset + 2] = Math.floor(millis / 2 ** 24) & 0xff;
  bytes[offset + 3] = Math.floor(millis / 2 ** 16) & 0xff;
  bytes[offset + 4] = Math.floor(millis / 2 ** 8) & 0xff;
  bytes[offset + 5] = millis & 0xff;
  for (let i = 6; i < 16; i++) bytes[offset + i] = random[randomOffset + i];
  // Keep the monotonic counter visible in the first two random bytes so ULIDs
  // minted in the same millisecond still sort in order.
  bytes[offset + 6] = (counter >>> 8) & 0xff;
  bytes[offset + 7] = counter & 0xff;
}

const NANO_ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

/**
 * NanoID's own trick: mask the random byte down to the alphabet size and reject
 * out-of-range draws. Plain `% 64` would bias the distribution; with a 64-char
 * alphabet the mask is exact, so no draw is ever wasted.
 */
export function generateNanoIds(count: number, size = 21): string[] {
  const out: string[] = new Array(count);
  const pool = randomBytes(count * size);
  let p = 0;
  for (let i = 0; i < count; i++) {
    let id = '';
    for (let j = 0; j < size; j++) id += NANO_ALPHABET[pool[p++] & 63];
    out[i] = id;
  }
  return out;
}

let objectIdCounter = -1;
const objectIdMachine = randomBytes(5);

function writeObjectId(bytes: Uint8Array, offset: number, nowMs: number): void {
  if (objectIdCounter < 0) objectIdCounter = randomBytes(3)[0];
  const seconds = Math.floor(nowMs / 1000);
  bytes[offset] = (seconds >>> 24) & 0xff;
  bytes[offset + 1] = (seconds >>> 16) & 0xff;
  bytes[offset + 2] = (seconds >>> 8) & 0xff;
  bytes[offset + 3] = seconds & 0xff;
  bytes.set(objectIdMachine, offset + 4);
  objectIdCounter = (objectIdCounter + 1) & 0xffffff;
  bytes[offset + 9] = (objectIdCounter >>> 16) & 0xff;
  bytes[offset + 10] = (objectIdCounter >>> 8) & 0xff;
  bytes[offset + 11] = objectIdCounter & 0xff;
}

// ---------------------------------------------------------------------------
// Name-based kinds (v3 = MD5, v5 = SHA-1)
// ---------------------------------------------------------------------------

export function parseUuidBytes(input: string): Uint8Array | null {
  const clean = input.trim().replace(/^urn:uuid:/i, '').replace(/[{}]/g, '').replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(clean)) return null;
  return hexToBytes(clean);
}

/**
 * Hashing is injected rather than imported here, and that is a build
 * constraint, not a style choice: hash-wasm can only reach the worker through
 * a static import (Vite bundles workers as IIFE, which cannot code-split, so a
 * dynamic `import()` inside the worker graph fails the build), while the main
 * thread must NOT pull the wasm payload into the island's eager chunk for the
 * 95% of visitors who only ever press "v4".
 */
export type Digest = (algo: 'md5' | 'sha1', data: Uint8Array) => Promise<Uint8Array>;

/** SHA-1 via Web Crypto. Rejects for MD5 (no browser implements it) and on
 *  insecure origins, where `crypto.subtle` does not exist at all. */
export const subtleDigest: Digest = async (algo, data) => {
  if (algo === 'sha1' && typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      return new Uint8Array(await crypto.subtle.digest('SHA-1', data as unknown as BufferSource));
    } catch {
      // Falls through to the caller's wasm fallback.
    }
  }
  throw new Error('NEED_WASM_DIGEST');
};

async function nameBased(
  version: 3 | 5,
  namespaceBytes: Uint8Array,
  name: string,
  digestFn: Digest
): Promise<Uint8Array> {
  const nameBytes = new TextEncoder().encode(name);
  const payload = new Uint8Array(16 + nameBytes.length);
  payload.set(namespaceBytes, 0);
  payload.set(nameBytes, 16);
  const digest = await digestFn(version === 3 ? 'md5' : 'sha1', payload);
  const out = digest.slice(0, 16);
  out[6] = (out[6] & 0x0f) | (version === 3 ? 0x30 : 0x50);
  out[8] = (out[8] & 0x3f) | 0x80;
  return out;
}

// ---------------------------------------------------------------------------
// Batch generation
// ---------------------------------------------------------------------------

export interface BatchRequest {
  kind: Kind;
  count: number;
  /** v3/v5 only: the namespace UUID, in any accepted text form. */
  namespace: string;
  /** v3/v5 only: one name per entry. Determines the count for named kinds. */
  names: string[];
}

export interface BatchResult {
  kind: Kind;
  /** Packed fixed-width identifiers, `WIDTH[kind]` bytes each. Null for nanoid. */
  bytes: Uint8Array | null;
  /** Text-native identifiers (nanoid). Null for every binary kind. */
  strings: string[] | null;
  count: number;
  /** Wall-clock generation time, milliseconds. */
  ms: number;
  /** Exact duplicate count inside the batch — the honest way to claim uniqueness. */
  duplicates: number;
}

export const MAX_COUNT = 100000;

function countDuplicates(bytes: Uint8Array, width: number, count: number): number {
  const seen = new Set<string>();
  let duplicates = 0;
  for (let i = 0; i < count; i++) {
    const key = bytesToHex(bytes, i * width, width);
    if (seen.has(key)) duplicates++;
    else seen.add(key);
  }
  return duplicates;
}

export async function generateBatch(
  request: BatchRequest,
  digest: Digest = subtleDigest
): Promise<BatchResult> {
  const started = performance.now();
  const kind = request.kind;
  const width = WIDTH[kind];

  if (kind === 'nanoid') {
    const count = Math.max(1, Math.min(MAX_COUNT, request.count));
    const strings = generateNanoIds(count);
    return {
      kind,
      bytes: null,
      strings,
      count,
      ms: performance.now() - started,
      duplicates: count - new Set(strings).size,
    };
  }

  if (kind === 'nil' || kind === 'max') {
    const bytes = new Uint8Array(16);
    if (kind === 'max') bytes.fill(0xff);
    return { kind, bytes, strings: null, count: 1, ms: performance.now() - started, duplicates: 0 };
  }

  if (kind === 'v3' || kind === 'v5') {
    const namespaceBytes = parseUuidBytes(request.namespace);
    if (!namespaceBytes) throw new Error('INVALID_NAMESPACE');
    const names = request.names.length ? request.names : [''];
    const bytes = new Uint8Array(names.length * 16);
    for (let i = 0; i < names.length; i++) {
      bytes.set(await nameBased(kind === 'v3' ? 3 : 5, namespaceBytes, names[i], digest), i * 16);
    }
    return {
      kind,
      bytes,
      strings: null,
      count: names.length,
      ms: performance.now() - started,
      duplicates: countDuplicates(bytes, 16, names.length),
    };
  }

  const count = Math.max(1, Math.min(MAX_COUNT, request.count));
  const bytes = new Uint8Array(count * width);

  if (kind === 'v4') {
    // One bulk fill for the whole batch, then stamp the version/variant nibbles.
    // ~10x faster than calling crypto.randomUUID() in a loop, and it is the
    // same entropy source.
    fillRandom(bytes);
    for (let i = 0; i < count; i++) {
      const o = i * 16;
      bytes[o + 6] = 0x40 | (bytes[o + 6] & 0x0f);
      bytes[o + 8] = 0x80 | (bytes[o + 8] & 0x3f);
    }
  } else if (kind === 'v7' || kind === 'ulid') {
    const random = randomBytes(count * 16);
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      if (kind === 'v7') writeV7(bytes, i * 16, now, random, i * 16);
      else writeUlid(bytes, i * 16, now, random, i * 16);
    }
  } else if (kind === 'v1' || kind === 'v6') {
    const now = Date.now();
    for (let i = 0; i < count; i++) {
      if (kind === 'v1') writeV1(bytes, i * 16, now);
      else writeV6(bytes, i * 16, now);
    }
  } else if (kind === 'objectid') {
    const now = Date.now();
    for (let i = 0; i < count; i++) writeObjectId(bytes, i * 12, now);
  }

  return {
    kind,
    bytes,
    strings: null,
    count,
    ms: performance.now() - started,
    duplicates: countDuplicates(bytes, width, count),
  };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export type Wrap = 'none' | 'braces' | 'urn' | 'single' | 'double';

export interface FormatOptions {
  uppercase: boolean;
  hyphens: boolean;
  wrap: Wrap;
  prefix: string;
  suffix: string;
}

export const DEFAULT_FORMAT: FormatOptions = {
  uppercase: false,
  hyphens: true,
  wrap: 'none',
  prefix: '',
  suffix: '',
};

function hyphenate(hex: string): string {
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/** Renders one identifier out of the packed buffer. */
export function formatOne(
  kind: Kind,
  bytes: Uint8Array | null,
  strings: string[] | null,
  index: number,
  options: FormatOptions
): string {
  let core: string;

  if (kind === 'nanoid') {
    core = strings ? strings[index] : '';
  } else if (!bytes) {
    core = '';
  } else if (kind === 'ulid') {
    core = encodeUlid(bytes, index * 16);
  } else if (kind === 'objectid') {
    core = bytesToHex(bytes, index * 12, 12);
  } else {
    const hex = bytesToHex(bytes, index * 16, 16);
    core = options.hyphens ? hyphenate(hex) : hex;
  }

  // Case only applies where a case actually exists in the encoding: ULID is
  // uppercase Crockford by definition and NanoID's alphabet is case-sensitive,
  // so forcing either would produce an identifier that no longer round-trips.
  if (kind !== 'ulid' && kind !== 'nanoid') {
    core = options.uppercase ? core.toUpperCase() : core.toLowerCase();
  }

  switch (options.wrap) {
    case 'braces':
      core = `{${core}}`;
      break;
    case 'urn':
      if (kind !== 'ulid' && kind !== 'nanoid' && kind !== 'objectid') core = `urn:uuid:${core}`;
      break;
    case 'single':
      core = `'${core}'`;
      break;
    case 'double':
      core = `"${core}"`;
      break;
  }

  return `${options.prefix}${core}${options.suffix}`;
}

export function formatAll(result: BatchResult, options: FormatOptions, limit = Infinity): string[] {
  const total = Math.min(result.count, limit);
  const out: string[] = new Array(total);
  for (let i = 0; i < total; i++) out[i] = formatOne(result.kind, result.bytes, result.strings, i, options);
  return out;
}

// ---------------------------------------------------------------------------
// Export shapes
// ---------------------------------------------------------------------------

export type ExportFormat = 'txt' | 'csv' | 'json' | 'sql';

export const EXPORT_EXTENSION: Record<ExportFormat, string> = {
  txt: 'txt',
  csv: 'csv',
  json: 'json',
  sql: 'sql',
};

export const EXPORT_MIME: Record<ExportFormat, string> = {
  txt: 'text/plain;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
  json: 'application/json;charset=utf-8',
  sql: 'text/plain;charset=utf-8',
};

export function serialize(result: BatchResult, options: FormatOptions, format: ExportFormat): string {
  // JSON and SQL quote their own strings. Letting the "wrap in quotes" option
  // through as well produced '''uuid''' in the INSERT — valid neither as SQL
  // nor as the value anyone wanted. Braces and urn: survive, since those are
  // part of the identifier's text form rather than of the file syntax.
  const quoted = options.wrap === 'single' || options.wrap === 'double';
  const effective: FormatOptions =
    quoted && (format === 'json' || format === 'sql') ? { ...options, wrap: 'none' } : options;
  const values = formatAll(result, effective);
  switch (format) {
    case 'json':
      return JSON.stringify(values, null, 2);
    case 'csv':
      return `index,${result.kind}\n${values.map((value, i) => `${i + 1},${value}`).join('\n')}`;
    case 'sql':
      return `INSERT INTO ids (id) VALUES\n${values
        .map(value => `  ('${value.replace(/'/g, "''")}')`)
        .join(',\n')};`;
    default:
      return values.join('\n');
  }
}

// ---------------------------------------------------------------------------
// Inspector: the 128 bits, read back
// ---------------------------------------------------------------------------

export type InspectKind = 'uuid' | 'ulid' | 'objectid' | 'nanoid' | 'unknown';

export interface Inspection {
  ok: boolean;
  detected: InspectKind;
  /** Canonical bytes when the input decodes to a binary identifier. */
  bytes: Uint8Array | null;
  version: number | null;
  variantLabel: string | null;
  versionLabel: string | null;
  /** Milliseconds since the Unix epoch, when the kind carries a timestamp. */
  timestampMs: number | null;
  /** Extra decoded fields, already labelled for display. */
  fields: { label: string; value: string }[];
  error: string | null;
}

const CROCKFORD_INDEX = new Map<string, number>();
CROCKFORD.split('').forEach((char, index) => CROCKFORD_INDEX.set(char, index));
// Crockford's alias set: these characters are ambiguous when handwritten, so
// the spec says to accept them as their look-alikes on decode.
CROCKFORD_INDEX.set('O', 0);
CROCKFORD_INDEX.set('I', 1);
CROCKFORD_INDEX.set('L', 1);

export function decodeUlid(text: string): Uint8Array | null {
  const upper = text.trim().toUpperCase();
  if (upper.length !== 26) return null;
  const out = new Uint8Array(16);
  let bits = 0;
  let value = 0;
  let index = 0;
  for (let i = 0; i < 26; i++) {
    const digit = CROCKFORD_INDEX.get(upper[i]);
    if (digit === undefined) return null;
    if (i === 0) {
      // 26 characters carry 130 bits for a 128-bit value, so the leading
      // character holds two padding bits and only three significant ones.
      value = digit & 0x07;
      bits = 3;
      continue;
    }
    value = (value << 5) | digit;
    bits += 5;
    while (bits >= 8) {
      bits -= 8;
      out[index++] = (value >>> bits) & 0xff;
      value &= (1 << bits) - 1;
    }
  }
  return index === 16 ? out : null;
}

function readUInt48(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 2 ** 40 +
    bytes[offset + 1] * 2 ** 32 +
    bytes[offset + 2] * 2 ** 24 +
    bytes[offset + 3] * 2 ** 16 +
    bytes[offset + 4] * 2 ** 8 +
    bytes[offset + 5]
  );
}

const VERSION_LABELS: Record<number, string> = {
  1: 'v1 · time + node',
  2: 'v2 · DCE security',
  3: 'v3 · name + MD5',
  4: 'v4 · random',
  5: 'v5 · name + SHA-1',
  6: 'v6 · reordered time',
  7: 'v7 · Unix time + random',
  8: 'v8 · custom',
};

function variantLabel(byte: number): string {
  if ((byte & 0x80) === 0x00) return 'NCS (legacy)';
  if ((byte & 0xc0) === 0x80) return 'RFC 4122 / 9562';
  if ((byte & 0xe0) === 0xc0) return 'Microsoft GUID';
  return 'Reserved';
}

/** Decodes the v1/v6 60-bit timestamp back into Unix milliseconds. */
export function uuidTimeToMs(bytes: Uint8Array, version: number): number | null {
  if (version === 1) {
    const high = BigInt(bytes[6] & 0x0f) * 256n + BigInt(bytes[7]);
    const mid = BigInt(bytes[4]) * 256n + BigInt(bytes[5]);
    const low = BigInt((bytes[0] << 24) >>> 0) + BigInt(bytes[1] << 16) + BigInt(bytes[2] << 8) + BigInt(bytes[3]);
    const ticks = (high << 48n) | (mid << 32n) | low;
    return Number(ticks / 10000n) - GREGORIAN_OFFSET_MS;
  }
  if (version === 6) {
    const high =
      BigInt(bytes[0]) * 16777216n + BigInt(bytes[1]) * 65536n + BigInt(bytes[2]) * 256n + BigInt(bytes[3]);
    const mid = BigInt(bytes[4]) * 256n + BigInt(bytes[5]);
    const low = BigInt(bytes[6] & 0x0f) * 256n + BigInt(bytes[7]);
    const ticks = (high << 28n) | (mid << 12n) | low;
    return Number(ticks / 10000n) - GREGORIAN_OFFSET_MS;
  }
  if (version === 7) return readUInt48(bytes, 0);
  return null;
}

export function inspect(input: string): Inspection {
  const text = input.trim();
  const empty: Inspection = {
    ok: false,
    detected: 'unknown',
    bytes: null,
    version: null,
    variantLabel: null,
    versionLabel: null,
    timestampMs: null,
    fields: [],
    error: null,
  };

  if (!text) return empty;

  const uuidBytes = parseUuidBytes(text);
  if (uuidBytes) {
    const version = (uuidBytes[6] & 0xf0) >> 4;
    const fields: { label: string; value: string }[] = [];
    const timestampMs = uuidTimeToMs(uuidBytes, version);

    if (version === 1 || version === 6) {
      fields.push({ label: 'clockSeq', value: String(((uuidBytes[8] & 0x3f) << 8) | uuidBytes[9]) });
      fields.push({ label: 'node', value: bytesToHex(uuidBytes, 10, 6).replace(/(..)(?=.)/g, '$1:') });
      fields.push({ label: 'nodeType', value: uuidBytes[10] & 0x01 ? 'random (multicast)' : 'MAC address' });
    }
    if (version === 7) {
      fields.push({ label: 'counter', value: String(((uuidBytes[6] & 0x0f) << 8) | uuidBytes[7]) });
      fields.push({ label: 'entropy', value: `${bytesToHex(uuidBytes, 8, 8)} (62 bits)` });
    }
    if (version === 4) fields.push({ label: 'entropy', value: '122 bits' });
    if (version === 3 || version === 5) {
      fields.push({ label: 'digest', value: version === 3 ? 'MD5 (truncated)' : 'SHA-1 (truncated)' });
    }

    const isNil = uuidBytes.every(b => b === 0x00);
    const isMax = uuidBytes.every(b => b === 0xff);

    return {
      ok: true,
      detected: 'uuid',
      bytes: uuidBytes,
      version: isNil || isMax ? null : version,
      versionLabel: isNil ? 'Nil UUID' : isMax ? 'Max UUID' : VERSION_LABELS[version] || `v${version} · unknown`,
      variantLabel: isNil || isMax ? '—' : variantLabel(uuidBytes[8]),
      timestampMs,
      fields,
      error: null,
    };
  }

  const ulidBytes = decodeUlid(text);
  if (ulidBytes) {
    return {
      ok: true,
      detected: 'ulid',
      bytes: ulidBytes,
      version: null,
      versionLabel: 'ULID · 48-bit time + 80-bit random',
      variantLabel: 'Crockford base32',
      timestampMs: readUInt48(ulidBytes, 0),
      fields: [{ label: 'entropy', value: `${bytesToHex(ulidBytes, 6, 10)} (80 bits)` }],
      error: null,
    };
  }

  if (/^[0-9a-fA-F]{24}$/.test(text)) {
    const bytes = hexToBytes(text)!;
    const seconds = ((bytes[0] << 24) >>> 0) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
    return {
      ok: true,
      detected: 'objectid',
      bytes,
      version: null,
      versionLabel: 'MongoDB ObjectId',
      variantLabel: '12 bytes',
      timestampMs: seconds * 1000,
      fields: [
        { label: 'machine', value: bytesToHex(bytes, 4, 5) },
        { label: 'counter', value: String((bytes[9] << 16) | (bytes[10] << 8) | bytes[11]) },
      ],
      error: null,
    };
  }

  if (/^[A-Za-z0-9_-]{16,32}$/.test(text)) {
    return {
      ok: true,
      detected: 'nanoid',
      bytes: null,
      version: null,
      versionLabel: `NanoID-shaped · ${text.length} characters`,
      variantLabel: 'URL-safe alphabet',
      timestampMs: null,
      fields: [{ label: 'entropy', value: `~${Math.round(text.length * 6)} bits` }],
      error: null,
    };
  }

  return { ...empty, error: 'UNRECOGNISED' };
}

/**
 * Rewrites the version and variant nibbles in place, leaving every other bit
 * untouched. This is what makes the craft panel non-destructive: the payload
 * the user pasted survives, only the two nibbles that classify it change.
 */
export function setVersion(bytes: Uint8Array, version: number): Uint8Array {
  const out = bytes.slice();
  out[6] = ((version & 0x0f) << 4) | (out[6] & 0x0f);
  return out;
}

export function setRfcVariant(bytes: Uint8Array): Uint8Array {
  const out = bytes.slice();
  out[8] = 0x80 | (out[8] & 0x3f);
  return out;
}

/** Overwrites the timestamp of a v7 identifier without touching its entropy. */
export function setV7Timestamp(bytes: Uint8Array, millis: number): Uint8Array {
  const out = bytes.slice();
  out[0] = Math.floor(millis / 2 ** 40) & 0xff;
  out[1] = Math.floor(millis / 2 ** 32) & 0xff;
  out[2] = Math.floor(millis / 2 ** 24) & 0xff;
  out[3] = Math.floor(millis / 2 ** 16) & 0xff;
  out[4] = Math.floor(millis / 2 ** 8) & 0xff;
  out[5] = millis & 0xff;
  return out;
}

/**
 * Pulls every identifier out of an arbitrary text blob (handoff intake).
 * Duplicates are kept: on an imported list "how many, and how many distinct"
 * is the interesting answer, and de-duplicating here would hide it.
 */
export function extractIdentifiers(text: string): string[] {
  const matches = text.match(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b|\b[0-9A-HJKMNP-TV-Z]{26}\b|\b[0-9a-fA-F]{24}\b/g
  );
  return matches ?? [];
}
