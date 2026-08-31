// ============================================================================
// Shared shapes for the SVG optimizer.
// ============================================================================

export type PluginGroup = 'cleanup' | 'styles' | 'geometry' | 'structure' | 'output';

/**
 * How much a plugin can change what the file *looks like*.
 *  - safe:    output renders identically. Metadata, comments, dead defs.
 *  - careful: rewrites geometry or styles. Identical in practice, but it is
 *             touching the drawing, so a bad input can surface a difference.
 *  - risky:   changes behaviour on purpose (scaling, ids, accessibility).
 *             Never on by default; the UI explains what breaks.
 */
export type PluginRisk = 'safe' | 'careful' | 'risky';

export interface PluginSpec {
  /** svgo's own plugin id. Deliberately not translated: it is the name you
   *  search for in svgo's docs, and renaming it per locale would hide that. */
  id: string;
  group: PluginGroup;
  risk: PluginRisk;
  /** Fixed params this tool always passes (e.g. precision is wired separately). */
  params?: Record<string, unknown>;
}

export type ProfileId = 'safe' | 'balanced' | 'max' | 'manual';

export interface OptimizerSettings {
  /** Plugin id -> on. Missing entries count as off. */
  enabled: Record<string, boolean>;
  /** Decimals kept for coordinates and path data. */
  floatPrecision: number;
  /** Decimals kept inside transform() lists. */
  transformPrecision: number;
  /** Run the whole chain until the output stops shrinking. */
  multipass: boolean;
  /** Indented, readable output instead of one long line. */
  prettify: boolean;
}

/**
 * Inventory taken straight off svgo's AST, before and after the run. This is
 * the intermediate data the UI reports on and the warnings key off — it is not
 * re-derived by parsing the output string a second time.
 */
export interface SvgStats {
  elements: number;
  paths: number;
  groups: number;
  ids: number;
  /** Distinct colour literals seen in attributes and inline styles. */
  colors: number;
  /** Total characters of `d` attributes: where the bytes usually live. */
  pathChars: number;
  hasScript: boolean;
  hasEventHandlers: boolean;
  hasRaster: boolean;
  /** References something off-origin: makes "100% local" untrue at render time. */
  hasExternalRef: boolean;
  hasText: boolean;
  hasViewBox: boolean;
  hasDimensions: boolean;
}

export interface OptimizeOk {
  ok: true;
  id: number;
  output: string;
  inputBytes: number;
  outputBytes: number;
  /** Gzipped sizes: the number that decides real transfer cost. */
  inputGzip: number;
  outputGzip: number;
  before: SvgStats;
  after: SvgStats;
  /** Human-readable list of what the tolerant pre-parse had to fix. */
  repairs: RepairNote[];
  ms: number;
}

export interface OptimizeFail {
  ok: false;
  id: number;
  /** Message key the UI can translate, plus the raw parser detail. */
  reason: 'parse' | 'not-svg' | 'empty' | 'crash';
  detail: string;
  line?: number;
  column?: number;
  repairs: RepairNote[];
}

export type OptimizeResult = OptimizeOk | OptimizeFail;

/**
 * Type guards rather than inline `result && !result.ok` checks.
 *
 * This project compiles without `strictNullChecks`, and without it a union
 * discriminated by a boolean does not narrow through a truthiness test — the
 * compiler keeps both arms and every field access on the result fails. An
 * explicit predicate narrows regardless.
 */
export function isFailure(result: OptimizeResult | null): result is OptimizeFail {
  return !!result && result.ok === false;
}

export function isSuccess(result: OptimizeResult | null): result is OptimizeOk {
  return !!result && result.ok === true;
}

export type RepairKind =
  | 'bom'
  | 'namespace'
  | 'ampersand'
  | 'doctype-subset'
  | 'trailing-junk';

export interface RepairNote {
  kind: RepairKind;
  /** e.g. the prefix that was undeclared. Shown verbatim next to the label. */
  detail: string;
}

export interface OptimizeRequest {
  id: number;
  source: string;
  settings: OptimizerSettings;
}
