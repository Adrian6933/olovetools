// ============================================================================
// JSONFlow — shared types
// ----------------------------------------------------------------------------
// The tool is built around a real AST instead of `JSON.parse`'s flattened
// result. Keeping source offsets on every node is what lets the editor jump to
// a value, the tree stay virtualised, and 64-bit integers survive a round trip.
// ============================================================================

export type JsonKind = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface JsonNode {
  kind: JsonKind;
  /** Property name in the parent object, or the index inside the parent array. */
  key: string | null;
  /** Primitive payload. Containers carry `children` instead. */
  value?: string | number | boolean | null;
  /**
   * Source text of a number, kept verbatim. `JSON.parse` turns
   * 7203584821901201408 into 7203584821901201000; re-emitting `raw` keeps it.
   */
  raw?: string;
  children?: JsonNode[];
  /** Offset of the value in the source text. */
  start: number;
  end: number;
  /** Offset of the key token, for jump-to-key. */
  keyStart?: number;
}

export type IssueCode =
  | 'syntax'
  | 'duplicate-key'
  | 'precision'
  | 'depth'
  | 'trailing-comma'
  | 'comment'
  | 'single-quote'
  | 'unquoted-key'
  | 'python-literal'
  | 'non-finite'
  | 'bom'
  | 'empty';

export interface ParseIssue {
  severity: 'error' | 'warning';
  code: IssueCode;
  message: string;
  offset: number;
  line: number;
  column: number;
}

export interface ParseResult {
  ok: boolean;
  root: JsonNode | null;
  issues: ParseIssue[];
  /** Which tolerances the parser had to apply, deduplicated. */
  repairs: IssueCode[];
  /** Wall-clock milliseconds the parse took — shown in the stats strip. */
  ms: number;
}

export interface ParseOptions {
  /** Accepts comments, trailing commas, single quotes, unquoted keys, NaN… */
  tolerant?: boolean;
  maxDepth?: number;
}

export interface DocStats {
  bytes: number;
  lines: number;
  nodes: number;
  depth: number;
  keys: number;
  /** Node count per JSON type. */
  types: Record<JsonKind, number>;
  /** Longest arrays, biggest first. */
  largestArrays: { path: string; length: number }[];
  uniqueKeys: number;
}

export type OutputTab = 'tree' | 'code' | 'table' | 'convert' | 'schema' | 'diff';

export type ConvertFormat = 'xml' | 'yaml' | 'csv' | 'tsv' | 'jsonl' | 'query';

export type SchemaFormat = 'json-schema' | 'typescript' | 'go';

export type IndentMode = 2 | 4 | -1;

export interface TableModel {
  columns: string[];
  rows: Record<string, unknown>[];
  /** True when the document was not an array of objects and got wrapped. */
  wrapped: boolean;
}

/** One entry of the patch-based undo history (see lib/history.ts). */
export interface TextPatch {
  at: number;
  removed: string;
  inserted: string;
}
