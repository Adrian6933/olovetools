// ============================================================================
// Randomness for shuffle and "pick N".
// ----------------------------------------------------------------------------
// The most common real use of a list shuffler is drawing a winner, so this is
// not a place for `Math.random()`:
//
//   * no seed  → `crypto.getRandomValues`, a CSPRNG. Nobody can predict or
//     reproduce the draw, which is what "fair" means for a giveaway.
//   * a seed   → mulberry32 over a hash of the seed. Fully reproducible, so the
//     draw can be replayed and audited by anyone who knows the seed (announce
//     the seed beforehand, run the draw in public afterwards).
//
// Both paths use rejection sampling for the bounded integer. `random() * n`
// rounded down is very slightly biased towards low indices; over a 32-bit
// range that bias is invisible in practice but it is free to avoid.
// ============================================================================

export interface Rng {
  /** Uniform integer in [0, bound). */
  int(bound: number): number;
  /** True when the sequence can be replayed from the seed. */
  reproducible: boolean;
}

const cryptoSource = (): ((out: Uint32Array) => void) | null => {
  const c = typeof globalThis === 'undefined' ? null : (globalThis as any).crypto;
  if (c && typeof c.getRandomValues === 'function') return out => c.getRandomValues(out);
  return null;
};

/** FNV-1a: a seed string becomes a 32-bit state. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(state: number): () => number {
  let a = state;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function boundedFrom(next: () => number): (bound: number) => number {
  return bound => {
    if (bound <= 1) return 0;
    // Rejection sampling on the 2^32 grid keeps every index equally likely.
    const limit = Math.floor(4294967296 / bound) * bound;
    for (let tries = 0; tries < 64; tries++) {
      const draw = Math.floor(next() * 4294967296);
      if (draw < limit) return draw % bound;
    }
    return Math.floor(next() * bound) % bound;
  };
}

export function makeRng(seed: string): Rng {
  const trimmed = (seed || '').trim();

  if (trimmed) {
    const int = boundedFrom(mulberry32(hashSeed(trimmed)));
    return { int, reproducible: true };
  }

  const fill = cryptoSource();
  if (!fill) {
    // No WebCrypto at all (ancient/hardened environment): still shuffle.
    const int = boundedFrom(() => Math.random());
    return { int, reproducible: false };
  }

  // Pull 256 words at a time instead of one syscall per swap.
  const buffer = new Uint32Array(256);
  let cursor = buffer.length;
  const nextWord = () => {
    if (cursor >= buffer.length) {
      fill(buffer);
      cursor = 0;
    }
    return buffer[cursor++];
  };
  const int = (bound: number) => {
    if (bound <= 1) return 0;
    const limit = Math.floor(4294967296 / bound) * bound;
    for (let tries = 0; tries < 64; tries++) {
      const draw = nextWord();
      if (draw < limit) return draw % bound;
    }
    return nextWord() % bound;
  };
  return { int, reproducible: false };
}

/** Fisher-Yates, in place on a copy the caller already owns. */
export function shuffleInPlace(items: string[], rng: Rng): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    const swap = items[i];
    items[i] = items[j];
    items[j] = swap;
  }
}
