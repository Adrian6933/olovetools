// ============================================================================
// XML ⇄ JSON — shared types.
// ----------------------------------------------------------------------------
// The tool works on its own AST instead of on a DOM. Three reasons:
//   1. DOMParser reports failures as a localised sentence inside a
//      <parsererror> element, with no line and no column, and the wording
//      differs per browser. The AST parser reports { line, col, offset }.
//   2. A DOM round trip silently drops what the previous version dropped:
//      comments, CDATA boundaries, processing instructions and the *order* of
//      mixed content.
//   3. Keeping the tree around means the JSON conventions (attribute prefix,
//      array policy, type coercion...) are a projection of the AST, so
//      changing an option re-projects instead of re-parsing.
// ============================================================================

export type Direction = 'xml-to-json' | 'json-to-xml';

export interface Pos {
  /** 1-based. */
  line: number;
  /** 1-based. */
  col: number;
  /** 0-based index into the source string. */
  offset: number;
}

export type IssueLevel = 'error' | 'warning';

export type IssueCode =
  | 'unclosed-tag'
  | 'mismatched-tag'
  | 'stray-close'
  | 'no-root'
  | 'multiple-roots'
  | 'bad-name'
  | 'unquoted-attr'
  | 'duplicate-attr'
  | 'unknown-entity'
  | 'bad-char-ref'
  | 'unterminated-comment'
  | 'unterminated-cdata'
  | 'unterminated-pi'
  | 'unterminated-tag'
  | 'double-hyphen-comment'
  | 'text-before-root'
  | 'bad-declaration'
  | 'undeclared-prefix'
  | 'json-syntax'
  | 'json-root'
  | 'json-empty'
  | 'bad-key';

export interface ParseIssue {
  level: IssueLevel;
  /** Stable code so the message can be translated in the UI. */
  code: IssueCode;
  pos: Pos;
  /** Length of the offending run, for the editor highlight. */
  length: number;
  /** Tag / entity / attribute the issue is about, when there is one. */
  detail?: string;
}

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export interface XmlAttr {
  /** Qualified name as written (`xlink:href`). */
  name: string;
  /** Empty string when the attribute has no prefix. */
  prefix: string;
  local: string;
  /** Already entity-decoded. */
  value: string;
  pos: Pos;
}

export interface XmlElement {
  kind: 'element';
  name: string;
  prefix: string;
  local: string;
  attrs: XmlAttr[];
  children: XmlNode[];
  /** Written as `<a/>` rather than `<a></a>`. */
  selfClosing: boolean;
  pos: Pos;
}

export interface XmlText {
  kind: 'text';
  /** Entity-decoded. */
  value: string;
  /** True when the run is only whitespace (formatting, not content). */
  blank: boolean;
  pos: Pos;
}

export interface XmlCData {
  kind: 'cdata';
  value: string;
  pos: Pos;
}

export interface XmlComment {
  kind: 'comment';
  value: string;
  pos: Pos;
}

export interface XmlPI {
  kind: 'pi';
  target: string;
  value: string;
  pos: Pos;
}

export interface XmlDoctype {
  kind: 'doctype';
  value: string;
  pos: Pos;
}

export type XmlNode = XmlElement | XmlText | XmlCData | XmlComment | XmlPI | XmlDoctype;

export interface XmlDeclaration {
  version: string;
  encoding: string;
  standalone: string;
}

export interface XmlDocument {
  declaration: XmlDeclaration | null;
  /** Every top-level node in document order, the root element included. */
  top: XmlNode[];
  root: XmlElement | null;
  issues: ParseIssue[];
  /** Entities declared in the DOCTYPE internal subset. */
  entities: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Conversion options
// ---------------------------------------------------------------------------

/**
 * How child elements are represented.
 *  smart   — array only when a tag actually repeats (matches the document).
 *  always  — every child element is an array, so the shape never changes
 *            depending on how many rows the source happened to have.
 *  ordered — the preserveOrder form: an array of single-key objects. Verbose,
 *            but the only one that survives mixed content and comments intact,
 *            which is why the round-trip check can reach 100 with it.
 */
export type ArrayPolicy = 'smart' | 'always' | 'ordered';
/** What to do with namespace prefixes on the way into JSON. */
export type NamespaceMode = 'keep' | 'strip' | 'expand';
/** What an element with no children and no text becomes. */
export type EmptyPolicy = 'empty-string' | 'null' | 'object';

export interface ToJsonOptions {
  /** Prefix for attribute keys. Empty string merges them with child keys. */
  attrPrefix: string;
  /** Key holding the text of an element that also has attributes or children. */
  textKey: string;
  arrays: ArrayPolicy;
  /** Tags always emitted as arrays, whatever `arrays` says. */
  forceArray: string[];
  namespaces: NamespaceMode;
  /** Parse `42`, `true`, `null` into real JSON types instead of strings. */
  coerce: boolean;
  /** Drop whitespace-only text runs between elements. */
  trim: boolean;
  keepComments: boolean;
  /** Keep CDATA sections distinguishable instead of merging them into text. */
  keepCdata: boolean;
  keepDeclaration: boolean;
  empty: EmptyPolicy;
  indent: number;
  minify: boolean;
}

export interface ToXmlOptions {
  attrPrefix: string;
  textKey: string;
  /** Wrapper element when the JSON has no single root key. */
  rootName: string;
  /** Element name for the items of an array whose key cannot be reused. */
  itemName: string;
  declaration: boolean;
  /** `<a/>` instead of `<a></a>` for empty elements. */
  selfClose: boolean;
  indent: number;
  minify: boolean;
  /** null becomes `<a xsi:nil="true"/>` with the namespace actually declared. */
  nilAttribute: boolean;
}

export const DEFAULT_TO_JSON: ToJsonOptions = {
  attrPrefix: '@',
  textKey: '#text',
  arrays: 'smart',
  forceArray: [],
  namespaces: 'keep',
  coerce: false,
  trim: true,
  keepComments: false,
  keepCdata: false,
  keepDeclaration: false,
  empty: 'empty-string',
  indent: 2,
  minify: false,
};

export const DEFAULT_TO_XML: ToXmlOptions = {
  attrPrefix: '@',
  textKey: '#text',
  rootName: 'root',
  itemName: 'item',
  declaration: true,
  selfClose: true,
  indent: 2,
  minify: false,
  nilAttribute: false,
};

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface DocStats {
  elements: number;
  attributes: number;
  textNodes: number;
  depth: number;
  inputBytes: number;
  outputBytes: number;
  /** Milliseconds spent parsing + serialising. */
  ms: number;
  /** True when the work ran in the worker rather than on the main thread. */
  offThread: boolean;
}

export const EMPTY_STATS: DocStats = {
  elements: 0,
  attributes: 0,
  textNodes: 0,
  depth: 0,
  inputBytes: 0,
  outputBytes: 0,
  ms: 0,
  offThread: false,
};

export interface RoundTripLoss {
  code: 'comments' | 'cdata' | 'pi' | 'text' | 'attributes' | 'elements' | 'declaration';
  before: number;
  after: number;
}

/**
 * Result of converting the output back into the input format and comparing.
 * Not decoration: it is the only honest answer to "did this conversion lose
 * anything?", and the previous version lost mixed content, CDATA and comments
 * without ever saying so.
 */
export interface RoundTrip {
  /** 0..100. 100 means every counted feature survives the trip. */
  score: number;
  losses: RoundTripLoss[];
  ms: number;
}

export interface ConversionResult {
  ok: boolean;
  output: string;
  issues: ParseIssue[];
  stats: DocStats;
  roundTrip: RoundTrip | null;
}

export const EMPTY_RESULT: ConversionResult = {
  ok: true,
  output: '',
  issues: [],
  stats: EMPTY_STATS,
  roundTrip: null,
};
