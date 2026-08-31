// ============================================================================
// Shared shapes for RegexFlow.
// ----------------------------------------------------------------------------
// The tool is built around one idea: never hand the UI a flattened result when
// the intermediate structure is what makes the feature possible. The pattern
// becomes an AST (not a token list), a run becomes a list of matches carrying
// every group offset (not a list of strings), and both keep the offsets that
// tie them back to the raw text the user typed.
// ============================================================================

export type LangId = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'hi' | 'ja' | 'zh';

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export type GroupKind =
  | 'capture'
  | 'named'
  | 'noncapture'
  | 'lookahead'
  | 'neg-lookahead'
  | 'lookbehind'
  | 'neg-lookbehind';

export type AnchorKind = 'start' | 'end' | 'word-boundary' | 'non-word-boundary';

export type EscapeKind =
  | 'digit'
  | 'non-digit'
  | 'word'
  | 'non-word'
  | 'space'
  | 'non-space'
  | 'tab'
  | 'newline'
  | 'return'
  | 'form-feed'
  | 'vertical-tab'
  | 'null'
  | 'hex'
  | 'unicode'
  | 'control'
  | 'literal';

/** One entry inside a `[...]` class: a single char, a range, or a shorthand. */
export interface ClassItem {
  /** `range` covers `a-z`; `escape` covers `\d`; `prop` covers `\p{L}`. */
  kind: 'char' | 'range' | 'escape' | 'prop';
  raw: string;
  from?: string;
  to?: string;
  escKind?: EscapeKind;
  propName?: string;
  negatedProp?: boolean;
}

interface NodeBase {
  /** Stable within one parse; used as a React key and for hover linking. */
  id: number;
  /** Offset of the node inside the raw pattern string. */
  start: number;
  end: number;
  raw: string;
}

export type AstNode =
  | (NodeBase & { kind: 'alternation'; alternatives: AstNode[] })
  | (NodeBase & { kind: 'sequence'; items: AstNode[] })
  | (NodeBase & { kind: 'group'; groupKind: GroupKind; name?: string; number?: number; body: AstNode })
  | (NodeBase & { kind: 'quantifier'; min: number; max: number | null; lazy: boolean; body: AstNode })
  | (NodeBase & { kind: 'class'; negated: boolean; items: ClassItem[] })
  | (NodeBase & { kind: 'escape'; escKind: EscapeKind; value: string })
  | (NodeBase & { kind: 'prop'; negated: boolean; propName: string })
  | (NodeBase & { kind: 'backref'; ref: number | string })
  | (NodeBase & { kind: 'anchor'; anchorKind: AnchorKind })
  | (NodeBase & { kind: 'dot' })
  | (NodeBase & { kind: 'literal'; value: string });

export interface ParseResult {
  root: AstNode;
  /** Capture groups in source order, 1-indexed by position in the array + 1. */
  captures: { number: number; name?: string; start: number; end: number }[];
  /** Soft parse errors: the pattern still renders, the note explains what broke. */
  problems: { start: number; end: number; code: string }[];
}

// ---------------------------------------------------------------------------
// Explanation tree
// ---------------------------------------------------------------------------

export type ExplainTone =
  | 'anchor'
  | 'quantifier'
  | 'group'
  | 'class'
  | 'escape'
  | 'literal'
  | 'alternation'
  | 'backref';

export interface ExplainNode {
  id: number;
  /** The exact slice of the pattern this line is about. */
  raw: string;
  start: number;
  end: number;
  tone: ExplainTone;
  text: string;
  children: ExplainNode[];
}

// ---------------------------------------------------------------------------
// Linting
// ---------------------------------------------------------------------------

export type LintSeverity = 'danger' | 'warning' | 'info';

export interface LintFinding {
  code: string;
  severity: LintSeverity;
  start: number;
  end: number;
  /** Substitutions for the localized message, e.g. `{char}`. */
  params?: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

export interface GroupHit {
  number: number;
  name?: string;
  value: string | undefined;
  /** -1 when the group did not participate or `d` was unavailable. */
  start: number;
  end: number;
}

export interface MatchHit {
  index: number;
  start: number;
  end: number;
  value: string;
  groups: GroupHit[];
}

export type RunMode = 'match' | 'replace' | 'split';

export interface RunRequest {
  id: number;
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
  mode: RunMode;
  /** Hard ceiling on matches collected, so a `.*` over 5 MB cannot allocate forever. */
  limit: number;
}

export interface RunResult {
  id: number;
  ok: boolean;
  /** Raw engine message; the UI localizes the common ones. */
  error?: string;
  matches: MatchHit[];
  /** True when `limit` was hit and the list is a prefix, not the whole truth. */
  truncated: boolean;
  total: number;
  replaced: string;
  parts: string[];
  /** Wall-clock milliseconds spent inside the engine. */
  ms: number;
}

export interface RunState extends Omit<RunResult, 'id'> {
  /** A run is in flight. */
  busy: boolean;
  /** The inputs moved on; what is on screen describes older inputs. */
  stale: boolean;
  /** The engine ran past the watchdog and was killed. */
  timedOut: boolean;
}
