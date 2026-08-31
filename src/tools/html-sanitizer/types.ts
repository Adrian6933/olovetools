// ============================================================================
// HTML Sanitizer — shared types
// ----------------------------------------------------------------------------
// The tool is built around one idea: sanitising is not a string→string
// function, it is a *decision log*. Every element and every attribute that
// DOMPurify throws away is recorded here with enough context that the user can
// look at it, disagree, and put it back — without re-pasting anything.
// ============================================================================

/** How an element that is not allowed should be dealt with. */
export type DropMode =
  /** Delete the element and everything inside it (`<script>`, `<style>`). */
  | 'drop'
  /** Delete the tag but keep its children in place (`<font>`, `<center>`). */
  | 'unwrap';

/** URL schemes the policy will let through in href/src/action-style attributes. */
export type UriScheme = 'http' | 'https' | 'mailto' | 'tel' | 'ftp' | 'data-image' | 'relative';

export interface Policy {
  /** Tags kept as-is. Everything else is judged by `unknownTags`. */
  allowedTags: string[];
  /** Attributes kept on allowed tags (lowercase, no namespace). */
  allowedAttrs: string[];
  /** What happens to a tag that is not on the allow list. */
  unknownTags: DropMode;
  /** Tags always deleted with their contents, even if they are on the allow list. */
  stripWithContents: string[];
  /** Schemes accepted inside URL-bearing attributes. */
  allowedSchemes: UriScheme[];
  /** Keep `data-*` attributes without listing each one. */
  allowDataAttrs: boolean;
  /** Keep `aria-*` and `role`. */
  allowAriaAttrs: boolean;
  /** Keep `<!-- comments -->`. */
  keepComments: boolean;
  /** Keep the `style="…"` attribute (its value is still scrubbed for urls). */
  keepInlineStyle: boolean;
  /** Keep `class="…"`. */
  keepClasses: boolean;
  /** Keep `id="…"` and `name="…"`. */
  keepIds: boolean;
  /** Keep `<svg>` and `<math>` subtrees. */
  allowSvgMath: boolean;
  /** Rewrite every surviving `<a href>` to add rel="noopener noreferrer". */
  hardenLinks: boolean;
  /** Force `target="_blank"` links to keep the rel hardening (implied by above). */
  stripTargets: boolean;
}

/** Why a node or attribute was taken out. Maps 1:1 to a translated string. */
export type RemovalReason =
  | 'tag-not-allowed'
  | 'tag-stripped'
  | 'event-handler'
  | 'attr-not-allowed'
  | 'bad-scheme'
  | 'comment'
  | 'inline-style'
  | 'class-attr'
  | 'id-attr';

export interface Removal {
  /** Stable key for React lists and for the "allow this back" toggle. */
  id: string;
  kind: 'element' | 'attribute' | 'comment';
  reason: RemovalReason;
  /** Lowercase tag name the removal happened on. */
  tag: string;
  /** Attribute name, for attribute removals. */
  attr?: string;
  /** Truncated attribute value or element text, for display. */
  sample: string;
  /** How many times this exact (tag, attr, reason) triple fired. */
  count: number;
  /** True when the removal is a security decision rather than a cosmetic one. */
  dangerous: boolean;
}

export interface SanitizeResult {
  html: string;
  removals: Removal[];
  /** Bytes in / bytes out, measured on the actual UTF-8 encoding. */
  bytesIn: number;
  bytesOut: number;
  elementsIn: number;
  elementsOut: number;
  /** Milliseconds the sanitise pass took. */
  durationMs: number;
  /** Set when the input could not be parsed at all. */
  error?: string;
}

export type PresetId = 'strict' | 'email' | 'content' | 'text' | 'custom';

export type OutputFormat = 'pretty' | 'minified' | 'raw';
