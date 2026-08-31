// ============================================================================
// The diff engine.
// ----------------------------------------------------------------------------
// The previous implementation built a full (n+1)×(m+1) LCS matrix. Comparing
// two 5 000-line files allocated 25 million numbers — roughly 200 MB — and two
// 20 000-line files simply killed the tab. This is Myers' O(ND) algorithm with
// the linear-space divide-and-conquer refinement (Myers 1986, §4b): memory is
// O(n+m) no matter how different the sides are, and the common case (two
// versions of the same file) costs O(n·D) with a very small D.
//
// It returns the edit *script* — ranges over the token arrays — instead of a
// flattened list of coloured lines. That intermediate form is what lets the UI
// build the side-by-side alignment, the collapsed context, the unified patch
// and the word-level highlights from a single computation.
// ============================================================================

import type {
  Anchor,
  ChangeKind,
  CompareOptions,
  DiffStats,
  Granularity,
  LineDiff,
  Op,
  ProseDiff,
  Row,
  Segment,
  UnifiedRow,
} from '../types';

// ---------------------------------------------------------------------------
// Normalisation: the comparison key, not the displayed text
// ---------------------------------------------------------------------------

/**
 * The string the algorithm compares. The original line is always what gets
 * rendered — "ignore whitespace" must not silently rewrite the user's file.
 */
export function comparisonKey(line: string, options: CompareOptions): string {
  let key = line;
  if (options.whitespace === 'trailing') key = key.replace(/[ \t]+$/, '');
  else if (options.whitespace === 'all') key = key.replace(/\s+/g, '');
  if (options.ignoreCase) key = key.toLowerCase();
  return key;
}

/** Splits on any of the three line endings without leaving \r stuck on the end. */
export function splitLines(text: string): string[] {
  if (text === '') return [''];
  return text.split(/\r\n|\r|\n/);
}

// ---------------------------------------------------------------------------
// Interning: strings become integers so the inner loop compares numbers
// ---------------------------------------------------------------------------

export function internAll(a: string[], b: string[]): { a: Int32Array; b: Int32Array } {
  const table = new Map<string, number>();
  const encode = (values: string[]) => {
    const out = new Int32Array(values.length);
    for (let i = 0; i < values.length; i++) {
      const seen = table.get(values[i]);
      if (seen === undefined) {
        const id = table.size;
        table.set(values[i], id);
        out[i] = id;
      } else {
        out[i] = seen;
      }
    }
    return out;
  };
  return { a: encode(a), b: encode(b) };
}

// ---------------------------------------------------------------------------
// Myers, linear space
// ---------------------------------------------------------------------------

/**
 * Work budget. Myers is O((n+m)·D); on two files that share nothing, D grows to
 * n+m and the cost becomes quadratic. Rather than freeze the tab we stop and
 * report the region as a wholesale replace, which is what it is anyway.
 */
const STEP_BUDGET = 30_000_000;

interface Match {
  a: number;
  b: number;
}

class Myers {
  private readonly a: Int32Array;
  private readonly b: Int32Array;
  private readonly vf: Int32Array;
  private readonly vb: Int32Array;
  private readonly off: number;
  private readonly matches: Match[] = [];
  private steps = 0;
  truncated = false;

  constructor(a: Int32Array, b: Int32Array) {
    this.a = a;
    this.b = b;
    const span = a.length + b.length + 3;
    this.off = span;
    this.vf = new Int32Array(span * 2 + 1);
    this.vb = new Int32Array(span * 2 + 1);
  }

  /**
   * Positions where the two sides line up, in increasing order.
   *
   * The divide-and-conquer runs on an explicit stack rather than the call
   * stack: on adversarial input the recursion depth follows D, and a real
   * 200 000-line comparison would hit "Maximum call stack size exceeded"
   * instead of producing a diff. Tasks are pushed in reverse so the matches
   * come out already sorted and no final sort pass is needed.
   */
  run(a0: number, a1: number, b0: number, b1: number): Match[] {
    type Task =
      | { kind: 'region'; a0: number; a1: number; b0: number; b1: number }
      | { kind: 'emit'; matches: Match[] };

    const stack: Task[] = [{ kind: 'region', a0, a1, b0, b1 }];
    const out = this.matches;

    while (stack.length > 0) {
      const task = stack.pop()!;
      if (task.kind === 'emit') {
        for (const match of task.matches) out.push(match);
        continue;
      }

      let s0 = task.a0;
      let s1 = task.a1;
      let t0 = task.b0;
      let t1 = task.b1;

      const head: Match[] = [];
      const tail: Match[] = [];

      while (s0 < s1 && t0 < t1 && this.a[s0] === this.b[t0]) {
        head.push({ a: s0, b: t0 });
        s0++;
        t0++;
      }
      while (s0 < s1 && t0 < t1 && this.a[s1 - 1] === this.b[t1 - 1]) {
        s1--;
        t1--;
        tail.push({ a: s1, b: t1 });
      }
      tail.reverse();

      const split =
        s0 < s1 && t0 < t1 && !this.truncated ? this.middleSnake(s0, s1, t0, t1) : null;

      // No split means either a pure insert/delete region (nothing left to
      // match) or the work budget ran out — in which case the region is
      // honestly reported as fully rewritten instead of hanging the tab.
      if (!split) {
        if (s0 < s1 && t0 < t1) this.truncated = true;
        for (const match of head) out.push(match);
        stack.push({ kind: 'emit', matches: tail });
        continue;
      }

      const [sa, sb] = split;
      if ((sa === s0 && sb === t0) || (sa === s1 && sb === t1)) {
        // Would recurse on the same region forever. Unreachable after the
        // trimming above, but a guard costs nothing and a hang costs the tab.
        for (const match of head) out.push(match);
        stack.push({ kind: 'emit', matches: tail });
        continue;
      }

      // LIFO, so push the pieces back to front: head, left, right, tail.
      stack.push({ kind: 'emit', matches: tail });
      stack.push({ kind: 'region', a0: sa, a1: s1, b0: sb, b1: t1 });
      stack.push({ kind: 'region', a0: s0, a1: sa, b0: t0, b1: sb });
      for (const match of head) out.push(match);
    }

    return out;
  }

  /**
   * The middle snake of Myers §4b: run the forward and backward D-paths in
   * lockstep and return the first point where they overlap. That point lies on
   * a minimal edit path, so splitting there and solving both halves gives a
   * minimal script overall.
   */
  private middleSnake(a0: number, a1: number, b0: number, b1: number): [number, number] | null {
    const { a, b, vf, vb, off } = this;
    const n = a1 - a0;
    const m = b1 - b0;
    const delta = n - m;
    const odd = (delta & 1) !== 0;
    const dMax = Math.ceil((n + m) / 2);

    vf[off + 1] = 0;
    vb[off + 1] = 0;

    for (let d = 0; d <= dMax; d++) {
      this.steps += d * 2;
      if (this.steps > STEP_BUDGET) return null;

      for (let k = -d; k <= d; k += 2) {
        let x =
          k === -d || (k !== d && vf[off + k - 1] < vf[off + k + 1])
            ? vf[off + k + 1]
            : vf[off + k - 1] + 1;
        let y = x - k;
        while (x < n && y < m && a[a0 + x] === b[b0 + y]) {
          x++;
          y++;
        }
        vf[off + k] = x;

        // The backward search is one level behind, so this only lines up when
        // delta is odd.
        if (odd && k - delta >= -(d - 1) && k - delta <= d - 1) {
          if (x + vb[off + delta - k] >= n) return [a0 + x, b0 + y];
        }
      }

      for (let k = -d; k <= d; k += 2) {
        let x =
          k === -d || (k !== d && vb[off + k - 1] < vb[off + k + 1])
            ? vb[off + k + 1]
            : vb[off + k - 1] + 1;
        let y = x - k;
        while (x < n && y < m && a[a1 - 1 - x] === b[b1 - 1 - y]) {
          x++;
          y++;
        }
        vb[off + k] = x;

        if (!odd) {
          const kf = delta - k;
          if (kf >= -d && kf <= d && vf[off + kf] + x >= n) return [a1 - x, b1 - y];
        }
      }
    }

    return null;
  }
}

/** Turns the match list into the equal / delete / insert runs the UI reads. */
function opsFromMatches(matches: Match[], n: number, m: number): Op[] {
  const ops: Op[] = [];
  let ai = 0;
  let bi = 0;

  const gap = (toA: number, toB: number) => {
    if (toA > ai) ops.push({ kind: 'delete', aStart: ai, aEnd: toA, bStart: bi, bEnd: bi });
    if (toB > bi) ops.push({ kind: 'insert', aStart: toA, aEnd: toA, bStart: bi, bEnd: toB });
    ai = toA;
    bi = toB;
  };

  for (let i = 0; i < matches.length; ) {
    const start = matches[i];
    gap(start.a, start.b);
    let run = 1;
    while (
      i + run < matches.length &&
      matches[i + run].a === start.a + run &&
      matches[i + run].b === start.b + run
    ) {
      run++;
    }
    ops.push({
      kind: 'equal',
      aStart: start.a,
      aEnd: start.a + run,
      bStart: start.b,
      bEnd: start.b + run,
    });
    ai = start.a + run;
    bi = start.b + run;
    i += run;
  }

  gap(n, m);
  return ops;
}

/** The whole edit script for two already-interned sequences. */
export function diffIds(a: Int32Array, b: Int32Array): { ops: Op[]; truncated: boolean } {
  if (a.length === 0 && b.length === 0) return { ops: [], truncated: false };
  const engine = new Myers(a, b);
  const matches = engine.run(0, a.length, 0, b.length);
  return { ops: opsFromMatches(matches, a.length, b.length), truncated: engine.truncated };
}

// ---------------------------------------------------------------------------
// Tokenisation for the word / character views
// ---------------------------------------------------------------------------

/**
 * Words, runs of whitespace and single punctuation marks, each kept as its own
 * token. Keeping whitespace as tokens is what makes the rebuilt text identical
 * to the input instead of "close enough".
 */
const WORD_RE = /[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu;

export function tokenizeWords(text: string): string[] {
  return text.match(WORD_RE) ?? [];
}

/** Code points, not UTF-16 units: emoji and CJK stay in one piece. */
export function tokenizeChars(text: string): string[] {
  return Array.from(text);
}

function tokenKey(token: string, options: CompareOptions): string {
  let key = token;
  if (options.whitespace === 'all' && /^\s+$/.test(key)) return ' ws';
  if (options.whitespace === 'trailing' && /^[ \t]+$/.test(key)) key = ' ';
  if (options.ignoreCase) key = key.toLowerCase();
  return key;
}

/** Merges neighbouring segments of the same kind so the DOM stays small. */
function packSegments(raw: Segment[]): Segment[] {
  const out: Segment[] = [];
  for (const segment of raw) {
    if (segment.text === '') continue;
    const last = out[out.length - 1];
    if (last && last.kind === segment.kind) last.text += segment.text;
    else out.push({ kind: segment.kind, text: segment.text });
  }
  return out;
}

const isBlankToken = (token: string) => token.trim() === '';

function segmentsFromOps(ops: Op[], aTokens: string[], bTokens: string[]): {
  a: Segment[];
  b: Segment[];
  merged: Segment[];
  /** Shared tokens that are not pure whitespace. */
  common: number;
} {
  const a: Segment[] = [];
  const b: Segment[] = [];
  const merged: Segment[] = [];
  let common = 0;

  for (const op of ops) {
    if (op.kind === 'equal') {
      const text = aTokens.slice(op.aStart, op.aEnd).join('');
      // Whitespace runs are tokens too, and counting them would make any two
      // lines look related: a comment and a function signature share nothing
      // but their spaces, yet that alone cleared the 28% pairing threshold and
      // got them highlighted word by word against each other.
      for (let i = op.aStart; i < op.aEnd; i++) if (!isBlankToken(aTokens[i])) common++;
      a.push({ kind: 'equal', text });
      b.push({ kind: 'equal', text });
      merged.push({ kind: 'equal', text });
    } else if (op.kind === 'delete') {
      const text = aTokens.slice(op.aStart, op.aEnd).join('');
      a.push({ kind: 'delete', text });
      merged.push({ kind: 'delete', text });
    } else {
      const text = bTokens.slice(op.bStart, op.bEnd).join('');
      b.push({ kind: 'insert', text });
      merged.push({ kind: 'insert', text });
    }
  }

  return { a: packSegments(a), b: packSegments(b), merged: packSegments(merged), common };
}

/** Word- or character-level diff of two strings. */
export function diffStrings(
  before: string,
  after: string,
  options: CompareOptions,
  granularity: Exclude<Granularity, 'line'> = 'word'
): { a: Segment[]; b: Segment[]; merged: Segment[]; similarity: number } {
  const aTokens = granularity === 'char' ? tokenizeChars(before) : tokenizeWords(before);
  const bTokens = granularity === 'char' ? tokenizeChars(after) : tokenizeWords(after);
  const interned = internAll(
    aTokens.map(token => tokenKey(token, options)),
    bTokens.map(token => tokenKey(token, options))
  );
  const { ops } = diffIds(interned.a, interned.b);
  const result = segmentsFromOps(ops, aTokens, bTokens);
  let total = 0;
  for (const token of aTokens) if (!isBlankToken(token)) total++;
  for (const token of bTokens) if (!isBlankToken(token)) total++;
  return {
    a: result.a,
    b: result.b,
    merged: result.merged,
    similarity: total === 0 ? 1 : (2 * result.common) / total,
  };
}

// ---------------------------------------------------------------------------
// Line diff → rows
// ---------------------------------------------------------------------------

/**
 * Below this, two paired lines are treated as unrelated and shown as a plain
 * removal plus a plain addition. Highlighting every third character of two
 * lines that have nothing to do with each other is worse than not highlighting.
 */
const PAIR_THRESHOLD = 0.28;

/** Word highlighting is skipped past this much text, to keep a big diff snappy. */
const SEGMENT_BUDGET = 400_000;

/** Above this many removed × added lines in one block, pair by position. */
const PAIRING_LIMIT = 40_000;

/**
 * Cheap similarity from a bag of tokens: no edit script, no allocation per
 * comparison beyond the counts. Used only to decide which removed line belongs
 * with which added line; the chosen pairs are then diffed properly.
 */
function tokenBag(line: string, options: CompareOptions): Map<string, number> {
  const bag = new Map<string, number>();
  for (const token of tokenizeWords(line)) {
    if (token.trim() === '') continue;
    const key = tokenKey(token, options);
    bag.set(key, (bag.get(key) ?? 0) + 1);
  }
  return bag;
}

function bagSize(bag: Map<string, number>): number {
  let size = 0;
  for (const count of bag.values()) size += count;
  return size;
}

function bagSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  const total = bagSize(a) + bagSize(b);
  if (total === 0) return 1;
  let shared = 0;
  // Walk the smaller bag: the cost is the number of distinct tokens, not the
  // length of the lines.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [token, count] of small) {
    const other = large.get(token);
    if (other) shared += Math.min(count, other);
  }
  return (2 * shared) / total;
}

/**
 * Which removed line goes with which added line inside one block.
 *
 * Pairing them by position — the obvious approach, and what the previous
 * version did — breaks the moment a line is inserted at the top of the block:
 * a new comment then gets compared against the function signature below it, and
 * every following pair is off by one. This is an order-preserving best match:
 * an LCS-shaped walk over the similarity scores, so lines pair with the line
 * they actually came from and anything left over stays a plain add or delete.
 *
 * Returns, for each removed line, the index of its added line or -1.
 */
function pairLines(
  removed: string[],
  added: string[],
  options: CompareOptions
): Int32Array {
  const p = removed.length;
  const q = added.length;
  const match = new Int32Array(p).fill(-1);
  if (p === 0 || q === 0) return match;

  if (p * q > PAIRING_LIMIT) {
    // Enormous block: fall back to position, which costs nothing.
    for (let i = 0; i < Math.min(p, q); i++) match[i] = i;
    return match;
  }

  const bagsA = removed.map(line => tokenBag(line, options));
  const bagsB = added.map(line => tokenBag(line, options));

  // score[i][j] over the first i removed and first j added lines.
  //
  // Float64, not Float32: the backtrack recognises the winning move by
  // recomputing it and comparing for equality. A Float32Array would round on
  // the way in, the recomputed double would not match, and perfectly good
  // pairs were being dropped — `if (!user) {` failed to pair with
  // `if (!user.name) {` despite scoring 0.86.
  const width = q + 1;
  const score = new Float64Array((p + 1) * width);
  const sim = new Float64Array(p * q);

  for (let i = 1; i <= p; i++) {
    for (let j = 1; j <= q; j++) {
      const value = bagSimilarity(bagsA[i - 1], bagsB[j - 1]);
      sim[(i - 1) * q + (j - 1)] = value;
      const skipA = score[(i - 1) * width + j];
      const skipB = score[i * width + (j - 1)];
      const take = value >= PAIR_THRESHOLD ? score[(i - 1) * width + (j - 1)] + value : -1;
      score[i * width + j] = Math.max(skipA, skipB, take);
    }
  }

  let i = p;
  let j = q;
  while (i > 0 && j > 0) {
    const value = sim[(i - 1) * q + (j - 1)];
    const take = value >= PAIR_THRESHOLD ? score[(i - 1) * width + (j - 1)] + value : -1;
    if (take >= 0 && score[i * width + j] === take) {
      match[i - 1] = j - 1;
      i--;
      j--;
    } else if (score[(i - 1) * width + j] >= score[i * width + (j - 1)]) {
      i--;
    } else {
      j--;
    }
  }

  return match;
}

interface Region {
  a0: number;
  a1: number;
  b0: number;
  b1: number;
}

/** Splits the two files at the user's forced alignment points. */
function regionsFromAnchors(anchors: Anchor[], n: number, m: number): Region[] {
  const sorted = [...anchors]
    .filter(anchor => anchor.a >= 0 && anchor.a < n && anchor.b >= 0 && anchor.b < m)
    .sort((x, y) => x.a - y.a || x.b - y.b);

  const regions: Region[] = [];
  let a = 0;
  let b = 0;
  for (const anchor of sorted) {
    // An anchor that would move backwards on either side is contradictory.
    if (anchor.a < a || anchor.b < b) continue;
    regions.push({ a0: a, a1: anchor.a, b0: b, b1: anchor.b });
    // The anchored pair itself is forced equal-by-position, so it becomes its
    // own one-line region and the algorithm never gets to break it apart.
    regions.push({ a0: anchor.a, a1: anchor.a + 1, b0: anchor.b, b1: anchor.b + 1 });
    a = anchor.a + 1;
    b = anchor.b + 1;
  }
  regions.push({ a0: a, a1: n, b0: b, b1: m });
  return regions.filter(region => region.a1 > region.a0 || region.b1 > region.b0);
}

export function diffLines(
  textA: string,
  textB: string,
  options: CompareOptions,
  anchors: Anchor[] = []
): LineDiff {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const linesA = splitLines(textA);
  const linesB = splitLines(textB);

  // Blank lines are dropped from the comparison but kept in the render, so the
  // index maps translate between "line the engine saw" and "line on screen".
  const keepA: number[] = [];
  const keepB: number[] = [];
  const keysA: string[] = [];
  const keysB: string[] = [];
  const blank = (line: string) => line.trim() === '';

  for (let i = 0; i < linesA.length; i++) {
    if (options.ignoreBlankLines && blank(linesA[i])) continue;
    keepA.push(i);
    keysA.push(comparisonKey(linesA[i], options));
  }
  for (let i = 0; i < linesB.length; i++) {
    if (options.ignoreBlankLines && blank(linesB[i])) continue;
    keepB.push(i);
    keysB.push(comparisonKey(linesB[i], options));
  }

  const interned = internAll(keysA, keysB);
  let truncated = false;
  const ops: Op[] = [];

  const regions = anchors.length
    ? regionsFromAnchors(
        // Anchors are given in on-screen line numbers; move them into the
        // filtered coordinate space the engine works in.
        anchors
          .map(anchor => ({ a: keepA.indexOf(anchor.a), b: keepB.indexOf(anchor.b) }))
          .filter(anchor => anchor.a >= 0 && anchor.b >= 0),
        keysA.length,
        keysB.length
      )
    : [{ a0: 0, a1: keysA.length, b0: 0, b1: keysB.length }];

  for (const region of regions) {
    const sub = diffIds(
      interned.a.subarray(region.a0, region.a1),
      interned.b.subarray(region.b0, region.b1)
    );
    truncated = truncated || sub.truncated;
    for (const op of sub.ops) {
      ops.push({
        kind: op.kind,
        aStart: op.aStart + region.a0,
        aEnd: op.aEnd + region.a0,
        bStart: op.bStart + region.b0,
        bEnd: op.bEnd + region.b0,
      });
    }
  }

  // ---- rows -------------------------------------------------------------
  const rows: Row[] = [];
  const unified: UnifiedRow[] = [];
  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;
  let hunkCount = 0;
  let segmentBudget = SEGMENT_BUDGET;

  /** Original (on-screen) index for a filtered index. */
  const srcA = (i: number) => keepA[i];
  const srcB = (i: number) => keepB[i];

  /** Blank lines skipped by the filter still have to appear somewhere. */
  const emitSkippedA = (from: number, to: number) => {
    for (let i = from; i < to; i++) {
      rows.push({
        type: 'equal',
        aNum: i + 1,
        bNum: null,
        aText: linesA[i],
        bText: null,
        aSegs: null,
        bSegs: null,
        hunk: -1,
      });
      unified.push({ type: 'equal', aNum: i + 1, bNum: null, text: linesA[i], segs: null, hunk: -1 });
    }
  };

  let cursorA = 0;
  let cursorB = 0;
  let i = 0;

  while (i < ops.length) {
    const op = ops[i];

    if (op.kind === 'equal') {
      for (let k = 0; k < op.aEnd - op.aStart; k++) {
        const ia = srcA(op.aStart + k);
        const ib = srcB(op.bStart + k);
        emitSkippedA(cursorA, ia);
        cursorA = ia + 1;
        cursorB = ib + 1;
        rows.push({
          type: 'equal',
          aNum: ia + 1,
          bNum: ib + 1,
          aText: linesA[ia],
          bText: linesB[ib],
          aSegs: null,
          bSegs: null,
          hunk: -1,
        });
        unified.push({ type: 'equal', aNum: ia + 1, bNum: ib + 1, text: linesA[ia], segs: null, hunk: -1 });
        unchanged++;
      }
      i++;
      continue;
    }

    // Everything up to the next equal run is one hunk.
    const dels: number[] = [];
    const ins: number[] = [];
    while (i < ops.length && ops[i].kind !== 'equal') {
      const current = ops[i];
      if (current.kind === 'delete') {
        for (let k = current.aStart; k < current.aEnd; k++) dels.push(k);
      } else {
        for (let k = current.bStart; k < current.bEnd; k++) ins.push(k);
      }
      i++;
    }

    const hunk = hunkCount++;
    const match = pairLines(
      dels.map(index => linesA[srcA(index)]),
      ins.map(index => linesB[srcB(index)]),
      options
    );

    const emitDelete = (index: number) => {
      const ia = srcA(dels[index]);
      emitSkippedA(cursorA, ia);
      cursorA = ia + 1;
      rows.push({
        type: 'delete',
        aNum: ia + 1,
        bNum: null,
        aText: linesA[ia],
        bText: null,
        aSegs: null,
        bSegs: null,
        hunk,
      });
      unified.push({ type: 'delete', aNum: ia + 1, bNum: null, text: linesA[ia], segs: null, hunk });
      removed++;
    };

    const emitInsert = (index: number) => {
      const ib = srcB(ins[index]);
      cursorB = ib + 1;
      rows.push({
        type: 'insert',
        aNum: null,
        bNum: ib + 1,
        aText: null,
        bText: linesB[ib],
        aSegs: null,
        bSegs: null,
        hunk,
      });
      unified.push({ type: 'insert', aNum: null, bNum: ib + 1, text: linesB[ib], segs: null, hunk });
      added++;
    };

    const emitPair = (di: number, ii: number) => {
      const ia = srcA(dels[di]);
      const ib = srcB(ins[ii]);
      emitSkippedA(cursorA, ia);
      cursorA = ia + 1;
      cursorB = ib + 1;

      const aText = linesA[ia];
      const bText = linesB[ib];
      let aSegs: Segment[] | null = null;
      let bSegs: Segment[] | null = null;

      // The pairing already established these two belong together; the word
      // diff here is only about showing which parts moved.
      if (segmentBudget > 0) {
        segmentBudget -= aText.length + bText.length;
        const word = diffStrings(aText, bText, options, 'word');
        aSegs = word.a;
        bSegs = word.b;
      }

      rows.push({ type: 'replace', aNum: ia + 1, bNum: ib + 1, aText, bText, aSegs, bSegs, hunk });
      unified.push({ type: 'delete', aNum: ia + 1, bNum: null, text: aText, segs: aSegs, hunk });
      unified.push({ type: 'insert', aNum: null, bNum: ib + 1, text: bText, segs: bSegs, hunk });
      modified++;
    };

    // Walk both sides together so unmatched lines keep their place in the
    // block instead of all the removals bunching up above all the additions.
    let di = 0;
    let ii = 0;
    while (di < dels.length || ii < ins.length) {
      if (di >= dels.length) {
        emitInsert(ii++);
      } else if (ii >= ins.length) {
        emitDelete(di++);
      } else if (match[di] === ii) {
        emitPair(di, ii);
        di++;
        ii++;
      } else if (match[di] === -1) {
        emitDelete(di++);
      } else if (match[di] > ii) {
        // This added line has no partner: it belongs before the next pair.
        emitInsert(ii++);
      } else {
        emitDelete(di++);
      }
    }
  }

  emitSkippedA(cursorA, linesA.length);
  void cursorB;

  const commonTokens = unchanged * 2;
  const totalTokens = keysA.length + keysB.length;
  const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const stats: DiffStats = {
    added,
    removed,
    modified,
    unchanged,
    hunks: hunkCount,
    similarity: totalTokens === 0 ? 1 : commonTokens / totalTokens,
    linesA: linesA.length,
    linesB: linesB.length,
    bytesA: textA.length,
    bytesB: textB.length,
    ms: ended - started,
    truncated,
  };

  return { kind: 'line', rows, unified, stats };
}

// ---------------------------------------------------------------------------
// Prose diff (word / character over the whole document)
// ---------------------------------------------------------------------------

export function diffProse(textA: string, textB: string, options: CompareOptions): ProseDiff {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const granularity = options.granularity === 'char' ? 'char' : 'word';
  const result = diffStrings(textA, textB, options, granularity);

  let added = 0;
  let removed = 0;
  let unchanged = 0;
  for (const segment of result.merged) {
    const size = granularity === 'char' ? segment.text.length : tokenizeWords(segment.text).length;
    if (segment.kind === 'insert') added += size;
    else if (segment.kind === 'delete') removed += size;
    else unchanged += size;
  }

  const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return {
    kind: 'prose',
    segments: result.merged,
    stats: {
      added,
      removed,
      modified: 0,
      unchanged,
      hunks: result.merged.filter(segment => segment.kind !== 'equal').length,
      similarity: result.similarity,
      linesA: splitLines(textA).length,
      linesB: splitLines(textB).length,
      bytesA: textA.length,
      bytesB: textB.length,
      ms: ended - started,
      truncated: false,
    },
  };
}

// ---------------------------------------------------------------------------

export function runDiff(
  textA: string,
  textB: string,
  options: CompareOptions,
  anchors: Anchor[] = []
): LineDiff | ProseDiff {
  return options.granularity === 'line'
    ? diffLines(textA, textB, options, anchors)
    : diffProse(textA, textB, options);
}

export type { ChangeKind };
