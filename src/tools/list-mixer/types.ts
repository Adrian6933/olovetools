// ============================================================================
// List Mixer — shared types
// ----------------------------------------------------------------------------
// The tool never mutates the output text. The document is `{ source, pipeline }`
// and the output is derived: `output = format(pipeline(parse(source)))`. Every
// step below is a plain descriptor of a few dozen bytes, which is what makes
// undo/redo, reordering and "disable this step" free in memory.
// ============================================================================

/** How the raw text is cut into items. */
export type SplitMode = 'lines' | 'comma' | 'semicolon' | 'tab' | 'spaces' | 'custom' | 'regex';

/** How the items are glued back together. */
export type JoinMode = 'newline' | 'comma' | 'commaSpace' | 'semicolon' | 'tab' | 'space' | 'custom';

export interface InputFormat {
  split: SplitMode;
  /** Literal separator for `custom`, source of a RegExp for `regex`. */
  custom: string;
}

export interface OutputFormat {
  join: JoinMode;
  custom: string;
  /** Wrapped around every item (quotes, brackets, `<li>`…). */
  itemPrefix: string;
  itemSuffix: string;
  /** Wrapped around the whole list (`[`…`]`, `IN (`…`)`). */
  listPrefix: string;
  listSuffix: string;
}

/** Ready-made output shapes. `custom` means the user touched the fields. */
export type PresetId = 'plain' | 'csv' | 'quoted' | 'json' | 'sql' | 'js' | 'markdown' | 'html' | 'custom';

export type SortKind = 'text' | 'length' | 'numeric';
export type CaseMode = 'upper' | 'lower' | 'title' | 'sentence';
export type SetMode = 'union' | 'intersect' | 'diff' | 'symdiff' | 'append' | 'prepend' | 'interleave';

/** Op id, used as the union discriminant and as the dictionary key suffix. */
export type OpId =
  | 'sort'
  | 'reverse'
  | 'shuffle'
  | 'dedupe'
  | 'onlyDupes'
  | 'removeEmpty'
  | 'trim'
  | 'collapse'
  | 'case'
  | 'dedupeWords'
  | 'filter'
  | 'length'
  | 'slice'
  | 'sample'
  | 'replace'
  | 'affix'
  | 'number'
  | 'unnumber'
  | 'set';

interface StepBase {
  /** Stable across reorders, so React keys and the history agree. */
  id: string;
  enabled: boolean;
}

/**
 * Discriminated by the `op` string. A string discriminant on purpose: this
 * project builds without `strictNullChecks`, where boolean discriminants do
 * not narrow.
 */
export type Step =
  | (StepBase & { op: 'sort'; kind: SortKind; desc: boolean; ignoreCase: boolean })
  | (StepBase & { op: 'reverse' })
  | (StepBase & { op: 'shuffle'; seed: string })
  | (StepBase & { op: 'dedupe'; ignoreCase: boolean; trimmed: boolean; keepLast: boolean })
  | (StepBase & { op: 'onlyDupes'; ignoreCase: boolean; trimmed: boolean })
  | (StepBase & { op: 'removeEmpty' })
  | (StepBase & { op: 'trim' })
  | (StepBase & { op: 'collapse' })
  | (StepBase & { op: 'case'; mode: CaseMode })
  | (StepBase & { op: 'dedupeWords'; ignoreCase: boolean })
  | (StepBase & { op: 'filter'; remove: boolean; pattern: string; regex: boolean; ignoreCase: boolean })
  | (StepBase & { op: 'length'; max: boolean; value: number })
  | (StepBase & { op: 'slice'; from: number; to: number })
  | (StepBase & { op: 'sample'; count: number; seed: string })
  | (StepBase & { op: 'replace'; find: string; replace: string; regex: boolean; ignoreCase: boolean })
  | (StepBase & { op: 'affix'; prefix: string; suffix: string })
  | (StepBase & { op: 'number'; start: number; pad: number; separator: string })
  | (StepBase & { op: 'unnumber' })
  | (StepBase & { op: 'set'; mode: SetMode; ignoreCase: boolean; trimmed: boolean });

/** What one step did, shown next to it so the effect is measurable. */
export interface StepStat {
  id: string;
  itemsIn: number;
  itemsOut: number;
  /** Items whose text changed (0 for pure reorder/filter steps). */
  edited: number;
  /** Milliseconds, only meaningful on the big lists that justify the worker. */
  ms: number;
  /** Set when the step could not run (a broken user regex, mostly). */
  error: string;
}

export interface RunResult {
  items: string[];
  stats: StepStat[];
  itemsIn: number;
  ms: number;
}

/** Message the worker receives. Everything is structured-clone friendly. */
export interface RunRequest {
  token: number;
  source: string;
  listB: string;
  input: InputFormat;
  pipeline: Step[];
  locale: string;
}

export interface RunResponse {
  token: number;
  result: RunResult;
}

/** One entry of the undo stack. Both variants are tiny. */
export type TextPatch = { at: number; removed: string; inserted: string };
