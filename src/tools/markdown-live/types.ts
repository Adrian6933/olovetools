// ============================================================================
// MarkdownLive — shared types
// ----------------------------------------------------------------------------
// The tool parses to an AST instead of string-replacing its way to HTML. That
// intermediate tree is what makes the rest possible: the same document renders
// to the styled preview, to a clean standalone HTML file, to a print sheet and
// to a table of contents, without any of them having to re-guess the markup.
// ============================================================================

export type Align = 'left' | 'center' | 'right';

// ---------------------------------------------------------------------------
// Inline nodes
// ---------------------------------------------------------------------------
export type Inline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] }
  | { type: 'del'; children: Inline[] }
  | { type: 'mark'; children: Inline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; title: string; children: Inline[] }
  | { type: 'image'; src: string; alt: string; title: string }
  | { type: 'break' }
  | { type: 'footnoteRef'; id: string; index: number };

// ---------------------------------------------------------------------------
// Block nodes
// ---------------------------------------------------------------------------
export interface ListItem {
  /** `null` for a plain bullet, boolean for a `- [ ]` / `- [x]` task. */
  checked: boolean | null;
  children: Block[];
}

export interface FootnoteDef {
  id: string;
  index: number;
  children: Block[];
}

export type Block =
  | { type: 'heading'; depth: number; slug: string; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'code'; lang: string; value: string }
  | { type: 'blockquote'; children: Block[] }
  | { type: 'list'; ordered: boolean; start: number; tight: boolean; items: ListItem[] }
  | { type: 'table'; align: Align[]; header: Inline[][]; rows: Inline[][][] }
  | { type: 'hr' }
  | { type: 'footnotes'; items: FootnoteDef[] };

export interface TocEntry {
  depth: number;
  text: string;
  slug: string;
}

export interface DocStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  lines: number;
  /** Minutes, rounded up, at 220 wpm. */
  readingMinutes: number;
  headings: number;
  links: number;
  images: number;
  codeBlocks: number;
  tables: number;
  tasks: { done: number; total: number };
}

export interface ParsedDoc {
  blocks: Block[];
  toc: TocEntry[];
  stats: DocStats;
  /** YAML front matter, kept verbatim and shown as a chip, never rendered. */
  frontMatter: string;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
export interface RenderOptions {
  /** Drop every class attribute — for "copy clean HTML". */
  bare?: boolean;
  /** Anchor links next to headings. Off for exports that are not web pages. */
  anchors?: boolean;
  /** aria-label del ancla "#" de cada titulo, ya traducido. */
  anchorLabel?: string;
  /** Syntax highlighter. Returns HTML, or null to leave the code as text. */
  highlight?: (code: string, lang: string) => string | null;
}

// ---------------------------------------------------------------------------
// Worker protocol
// ---------------------------------------------------------------------------
export interface WorkerRequest {
  id: number;
  text: string;
  anchorLabel?: string;
}

export interface WorkerResponse {
  id: number;
  html: string;
  toc: TocEntry[];
  stats: DocStats;
  frontMatter: string;
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
export interface TextPatch {
  at: number;
  removed: string;
  inserted: string;
}

export type ThemeId = 'slate' | 'journal' | 'retro' | 'cyberpunk' | 'github';

/** Which panes are on screen. On phones only one fits at a time. */
export type PaneMode = 'split' | 'editor' | 'preview';

/** What the right-hand pane is showing. */
export type PreviewMode = 'preview' | 'html' | 'toc';

/** A document waiting for the user to say what to do with it. */
export interface StagedDoc {
  name: string;
  size: number;
  body: string;
  /** Slug of the tool that handed it over, when it came from the suite. */
  from: string | null;
}
