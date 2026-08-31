// ============================================================================
// The algorithm catalogue.
// ----------------------------------------------------------------------------
// Kept free of any hash-wasm import on purpose: this module is pulled into the
// main bundle (the picker needs the labels and digest sizes), while the ~250 KB
// of embedded WebAssembly only ever loads inside the worker.
// ============================================================================

export type AlgoId =
  | 'md5'
  | 'sha1'
  | 'sha256'
  | 'sha384'
  | 'sha512'
  | 'sha3-256'
  | 'sha3-512'
  | 'blake2b-256'
  | 'blake3'
  | 'ripemd160'
  | 'crc32'
  | 'xxhash64';

export type AlgoGroup = 'checksum' | 'sha2' | 'modern';

export interface AlgoSpec {
  id: AlgoId;
  label: string;
  /** Digest length in bytes — also how a pasted hash gets identified. */
  bytes: number;
  group: AlgoGroup;
  /** Practical collisions exist: fine for corruption, useless against tampering. */
  broken?: boolean;
  /** Not a cryptographic hash at all — only detects accidental corruption. */
  nonCrypto?: boolean;
  /** hash-wasm can wrap it in HMAC. CRC/xxHash/BLAKE3 cannot. */
  hmac: boolean;
}

export const ALGORITHMS: AlgoSpec[] = [
  { id: 'md5', label: 'MD5', bytes: 16, group: 'checksum', broken: true, hmac: true },
  { id: 'sha1', label: 'SHA-1', bytes: 20, group: 'checksum', broken: true, hmac: true },
  { id: 'crc32', label: 'CRC-32', bytes: 4, group: 'checksum', nonCrypto: true, hmac: false },
  { id: 'xxhash64', label: 'xxHash64', bytes: 8, group: 'checksum', nonCrypto: true, hmac: false },

  { id: 'sha256', label: 'SHA-256', bytes: 32, group: 'sha2', hmac: true },
  { id: 'sha384', label: 'SHA-384', bytes: 48, group: 'sha2', hmac: true },
  { id: 'sha512', label: 'SHA-512', bytes: 64, group: 'sha2', hmac: true },

  { id: 'sha3-256', label: 'SHA3-256', bytes: 32, group: 'modern', hmac: true },
  { id: 'sha3-512', label: 'SHA3-512', bytes: 64, group: 'modern', hmac: true },
  { id: 'blake2b-256', label: 'BLAKE2b-256', bytes: 32, group: 'modern', hmac: false },
  { id: 'blake3', label: 'BLAKE3', bytes: 32, group: 'modern', hmac: false },
  { id: 'ripemd160', label: 'RIPEMD-160', bytes: 20, group: 'checksum', hmac: true },
];

export const ALGO_BY_ID: Record<AlgoId, AlgoSpec> = ALGORITHMS.reduce((acc, spec) => {
  acc[spec.id] = spec;
  return acc;
}, {} as Record<AlgoId, AlgoSpec>);

/** Sorted so the picker always renders the same order regardless of click order. */
export function sortAlgos(ids: AlgoId[]): AlgoId[] {
  const order = ALGORITHMS.map(a => a.id);
  return [...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export const DEFAULT_ALGOS: AlgoId[] = ['sha256'];
