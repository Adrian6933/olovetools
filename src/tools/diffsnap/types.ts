// ============================================================================
// Shared shapes for the diff engine and the views built on top of it.
// ============================================================================

/** What the two sides are compared as. */
export type Granularity = 'line' | 'word' | 'char';

/** How much whitespace difference counts as a difference. */
export type WhitespaceMode = 'none' | 'trailing' | 'all';

export interface CompareOptions {
  whitespace: WhitespaceMode;
  ignoreCase: boolean;
  /** Blank lines are dropped before comparing (they still render). */
  ignoreBlankLines: boolean;
  granularity: Granularity;
}

export const DEFAULT_OPTIONS: CompareOptions = {
  whitespace: 'none',
  ignoreCase: false,
  ignoreBlankLines: false,
  granularity: 'line',
};

export type ChangeKind = 'equal' | 'insert' | 'delete';

/**
 * One run of the edit script, as index ranges over the two token arrays. This
 * is the intermediate representation everything else is derived from: the
 * side-by-side alignment, the unified patch, the collapsed context and the
 * word-level highlights all read the same ops instead of re-diffing.
 */
export interface Op {
  kind: ChangeKind;
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
}

/** A stretch of text tagged with what happened to it. */
export interface Segment {
  kind: ChangeKind;
  text: string;
}

export type RowType = 'equal' | 'replace' | 'delete' | 'insert';

/** One line of the side-by-side view. */
export interface Row {
  type: RowType;
  /** 1-based line numbers, or null for the blank filler side. */
  aNum: number | null;
  bNum: number | null;
  aText: string | null;
  bText: string | null;
  /** Word-level breakdown of a replaced pair. Null when it would be noise. */
  aSegs: Segment[] | null;
  bSegs: Segment[] | null;
  /** Index of the hunk this row belongs to, or -1 for untouched context. */
  hunk: number;
}

/** One line of the unified view (classic patch order: removals, then additions). */
export interface UnifiedRow {
  type: Exclude<RowType, 'replace'>;
  aNum: number | null;
  bNum: number | null;
  text: string;
  segs: Segment[] | null;
  hunk: number;
}

export interface DiffStats {
  /** Lines only present in B. */
  added: number;
  /** Lines only present in A. */
  removed: number;
  /** Lines paired inside a hunk (a rewrite, not a pure add or delete). */
  modified: number;
  unchanged: number;
  hunks: number;
  /** 0..1, over the compared tokens. */
  similarity: number;
  linesA: number;
  linesB: number;
  bytesA: number;
  bytesB: number;
  ms: number;
  /**
   * True when a region was too expensive to align exactly and was emitted as a
   * wholesale replace. Surfaced in the UI instead of quietly lying.
   */
  truncated: boolean;
}

export interface LineDiff {
  kind: 'line';
  rows: Row[];
  unified: UnifiedRow[];
  stats: DiffStats;
}

export interface ProseDiff {
  kind: 'prose';
  segments: Segment[];
  stats: DiffStats;
}

export type DiffResult = LineDiff | ProseDiff;

/** A forced alignment point: A line `a` is the same thing as B line `b`. */
export interface Anchor {
  /** 0-based line index in A. */
  a: number;
  /** 0-based line index in B. */
  b: number;
}

/** Undo/redo step: the smallest replacement that turns one text into the other. */
export interface TextPatch {
  at: number;
  removed: string;
  inserted: string;
}
