// ============================================================================
// Checksum verification.
// ----------------------------------------------------------------------------
// Everything the user pastes — a bare hash, a Base64 digest, a whole
// SHA256SUMS file, BSD-style `SHA256 (file) = ...` output — is reduced to
// lowercase hex before comparing. Comparing the printed forms directly is what
// made the old version report a match for two Base64 digests that differed only
// in case (Base64 is case-sensitive; hex is not).
// ============================================================================

import { ALGORITHMS, type AlgoId } from './algorithms';
import { hexToBytes } from './format';

export interface ExpectedEntry {
  /** Lowercase hex, whatever the input notation was. */
  hex: string;
  /** File name when the line came from a SUMS-style listing. */
  name?: string;
  /** The line exactly as pasted, for showing it back. */
  raw: string;
  /** Algorithms whose digest length matches this hash. */
  candidates: AlgoId[];
}

const HEX_RE = /^[0-9a-f]+$/i;
const BASE64_RE = /^[A-Za-z0-9+/_-]+={0,2}$/;

function base64ToHex(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  try {
    const binary = atob(padded);
    let hex = '';
    for (let i = 0; i < binary.length; i++) hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
    return hex;
  } catch {
    return '';
  }
}

/** Turns one token into lowercase hex, or '' when it is not a digest at all. */
export function toHex(token: string): string {
  const value = token.trim().replace(/\s+/g, '');
  if (!value) return '';
  if (HEX_RE.test(value) && value.length % 2 === 0) return value.toLowerCase();
  if (BASE64_RE.test(value)) return base64ToHex(value);
  return '';
}

export function candidatesFor(hex: string): AlgoId[] {
  const bytes = hex.length / 2;
  return ALGORITHMS.filter(a => a.bytes === bytes).map(a => a.id);
}

/**
 * Parses whatever was pasted into the verification box. Recognises:
 *   d41d8cd9…                          bare hash
 *   d41d8cd9…  ubuntu.iso              GNU coreutils (two spaces or ` *`)
 *   SHA256 (ubuntu.iso) = d41d8cd9…    BSD / macOS shasum -a 256 --tag
 *   sha256:d41d8cd9…                   OCI / docker digest notation
 */
export function parseExpected(input: string): ExpectedEntry[] {
  const entries: ExpectedEntry[] = [];
  const seen = new Set<string>();

  for (const line of input.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.startsWith('#')) continue;

    let hexToken = '';
    let name: string | undefined;

    const bsd = raw.match(/^\w[\w-]*\s*\(([^)]+)\)\s*=\s*(\S+)$/);
    if (bsd) {
      name = bsd[1];
      hexToken = bsd[2];
    } else {
      const parts = raw.split(/\s+/);
      const first = parts[0].replace(/^[a-z0-9]+:/i, '');
      hexToken = first;
      if (parts.length > 1) name = parts.slice(1).join(' ').replace(/^\*/, '');
    }

    const hex = toHex(hexToken);
    if (!hex || hex.length < 8) continue;

    const key = `${hex}|${name || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({ hex, name, raw, candidates: candidatesFor(hex) });
  }

  return entries;
}

export type MatchState = 'match' | 'mismatch' | 'unknown';

export interface MatchReport {
  state: MatchState;
  /** Algorithm whose digest equals the expected value. */
  algo?: AlgoId;
  /** The entry that was compared against. */
  entry?: ExpectedEntry;
  /** Expected value has a length no selected algorithm produces. */
  lengthUnsupported?: boolean;
}

/**
 * Compares one file's computed digests against the pasted expectations.
 * A SUMS listing is matched by file name first, and only falls back to
 * "any line" when the listing carries no names at all.
 */
export function matchFile(
  fileName: string,
  digests: Partial<Record<AlgoId, string>>,
  expected: ExpectedEntry[]
): MatchReport {
  if (expected.length === 0) return { state: 'unknown' };

  const named = expected.filter(e => e.name);
  let pool = expected;
  if (named.length) {
    const forThisFile = named.filter(e => sameName(e.name, fileName));
    // A listing that names files but never names this one says nothing about
    // it; only the entries with no name at all still apply.
    pool = forThisFile.length ? forThisFile : expected.filter(e => !e.name);
  }

  if (pool.length === 0) return { state: 'unknown' };

  for (const entry of pool) {
    for (const [algo, hex] of Object.entries(digests) as [AlgoId, string][]) {
      if (hex && hex === entry.hex) return { state: 'match', algo, entry };
    }
  }

  // Nothing matched: say whether that is a real mismatch or simply a digest
  // length none of the ticked algorithms produce.
  const anyComparable = pool.some(entry =>
    entry.candidates.some(candidate => digests[candidate])
  );
  return anyComparable
    ? { state: 'mismatch', entry: pool[0] }
    : { state: 'unknown', entry: pool[0], lengthUnsupported: true };
}

function sameName(a: string, b: string): boolean {
  const base = (value: string) => value.split(/[\\/]/).pop().trim().toLowerCase();
  return base(a) === base(b);
}

/** Both sides of the standalone hash comparison, reduced to hex. */
export function compareHashes(a: string, b: string): { equal: boolean; hexA: string; hexB: string } {
  const hexA = toHex(a);
  const hexB = toHex(b);
  return { equal: !!hexA && hexA === hexB, hexA, hexB };
}

/** Builds a coreutils-compatible SUMS file for the computed results. */
export function buildSumsFile(
  rows: { name: string; hex: string }[],
  algo: AlgoId
): string {
  const header = `# ${algo.toUpperCase()} checksums generated with oLoveTools HashBolt\n`;
  return header + rows.map(row => `${row.hex}  ${row.name}`).join('\n') + '\n';
}

/** Rough sanity check used to colour the input while typing. */
export function looksLikeDigest(value: string): boolean {
  const hex = toHex(value);
  return hex.length >= 8 && candidatesFor(hex).length > 0;
}

export { hexToBytes };
