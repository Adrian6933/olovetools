// ============================================================================
// Preview themes
// ----------------------------------------------------------------------------
// One stylesheet, driven by custom properties, shared by three destinations:
// the on-screen preview, the exported .html file and the print sheet. The old
// version had a separate hand-written block per theme using Tailwind's slash
// syntax (`background: #ff0055/10`) inside plain CSS, which the parser drops on
// the floor — five declarations in cyberpunk and retro were simply never
// applied. Custom properties keep every theme to a list of colours that a
// browser can actually parse.
// ============================================================================

import type { ThemeId } from '../types';

export interface ThemeMeta {
  id: ThemeId;
  labelKey: string;
  fallback: string;
  /** Swatch shown in the picker: [page, ink, accent]. */
  swatch: [string, string, string];
  /** Prism needs to know whether it is painting on a dark or a light page. */
  dark: boolean;
}

export const THEMES: ThemeMeta[] = [
  { id: 'slate', labelKey: 'style_default', fallback: 'Default Slate', swatch: ['#0b1020', '#cbd5e1', '#a78bfa'], dark: true },
  { id: 'github', labelKey: 'style_github', fallback: 'GitHub Light', swatch: ['#ffffff', '#1f2328', '#0969da'], dark: false },
  { id: 'journal', labelKey: 'style_clean', fallback: 'Clean Journal', swatch: ['#fcfbf9', '#2d3748', '#8b5cf6'], dark: false },
  { id: 'retro', labelKey: 'style_retro', fallback: 'Retro Typewriter', swatch: ['#f5f2eb', '#3b3a36', '#b91c1c'], dark: false },
  { id: 'cyberpunk', labelKey: 'style_cyberpunk', fallback: 'Cyberpunk Neon', swatch: ['#05050d', '#00ffcc', '#ff0055'], dark: true },
];

export const themeMeta = (id: ThemeId): ThemeMeta => THEMES.find(theme => theme.id === id) || THEMES[0];

// ---------------------------------------------------------------------------
// Per-theme variables
// ---------------------------------------------------------------------------

const VARIABLES: Record<ThemeId, string> = {
  slate: `
    --md-page: transparent;
    --md-ink: #cbd5e1;
    --md-strong: #ffffff;
    --md-muted: #94a3b8;
    --md-accent: #a78bfa;
    --md-rule: rgba(255, 255, 255, 0.10);
    --md-surface: rgba(255, 255, 255, 0.04);
    --md-code-ink: #c4b5fd;
    --md-code-bg: rgba(139, 92, 246, 0.10);
    --md-pre-bg: #0a0713;
    --md-pre-ink: #e2e8f0;
    --md-quote-bg: rgba(139, 92, 246, 0.08);
    --md-mark-bg: rgba(250, 204, 21, 0.28);
    --md-mark-ink: #fef9c3;
    --md-body-font: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif;
    --md-head-font: 'Outfit', ui-sans-serif, system-ui, sans-serif;
    --md-mono-font: ui-monospace, SFMono-Regular, 'JetBrains Mono', Menlo, monospace;
    --md-pad: 0rem;
    --md-radius: 0rem;
    --md-shadow: none;
    --md-border: none;
  `,
  github: `
    --md-page: #ffffff;
    --md-ink: #1f2328;
    --md-strong: #010409;
    --md-muted: #59636e;
    --md-accent: #0969da;
    --md-rule: #d1d9e0;
    --md-surface: #f6f8fa;
    --md-code-ink: #1f2328;
    --md-code-bg: rgba(129, 139, 152, 0.16);
    --md-pre-bg: #f6f8fa;
    --md-pre-ink: #1f2328;
    --md-quote-bg: transparent;
    --md-mark-bg: #fff8c5;
    --md-mark-ink: #1f2328;
    --md-body-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    --md-head-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    --md-mono-font: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
    --md-pad: 2rem;
    --md-radius: 0.75rem;
    --md-shadow: none;
    --md-border: 1px solid #d1d9e0;
  `,
  journal: `
    --md-page: #fcfbf9;
    --md-ink: #2d3748;
    --md-strong: #1a202c;
    --md-muted: #718096;
    --md-accent: #7c3aed;
    --md-rule: #e2e8f0;
    --md-surface: #f7f6f3;
    --md-code-ink: #a21caf;
    --md-code-bg: #f4f1ee;
    --md-pre-bg: #f7f6f3;
    --md-pre-ink: #1a202c;
    --md-quote-bg: #faf5ff;
    --md-mark-bg: #fef3c7;
    --md-mark-ink: #78350f;
    --md-body-font: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
    --md-head-font: Georgia, 'Iowan Old Style', serif;
    --md-mono-font: 'SF Mono', ui-monospace, Menlo, monospace;
    --md-pad: 2.5rem;
    --md-radius: 1rem;
    --md-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
    --md-border: none;
  `,
  retro: `
    --md-page: #f5f2eb;
    --md-ink: #3b3a36;
    --md-strong: #1c1b18;
    --md-muted: #78716c;
    --md-accent: #b91c1c;
    --md-rule: #b5b2a9;
    --md-surface: #ebe7dd;
    --md-code-ink: #b91c1c;
    --md-code-bg: #ebe7dd;
    --md-pre-bg: #ebe7dd;
    --md-pre-ink: #2b2a27;
    --md-quote-bg: rgba(231, 229, 228, 0.55);
    --md-mark-bg: #e7d9a8;
    --md-mark-ink: #3b3a36;
    --md-body-font: 'Courier New', Courier, monospace;
    --md-head-font: 'Courier New', Courier, monospace;
    --md-mono-font: 'Courier New', Courier, monospace;
    --md-pad: 2.5rem;
    --md-radius: 1rem;
    --md-shadow: inset 0 0 40px rgba(0, 0, 0, 0.05);
    --md-border: none;
  `,
  cyberpunk: `
    --md-page: #05050d;
    --md-ink: #00ffcc;
    --md-strong: #7dffe6;
    --md-muted: #0d9488;
    --md-accent: #ff0055;
    --md-rule: rgba(255, 0, 85, 0.45);
    --md-surface: rgba(255, 0, 85, 0.08);
    --md-code-ink: #ff4d85;
    --md-code-bg: rgba(255, 0, 85, 0.12);
    --md-pre-bg: #090915;
    --md-pre-ink: #00ffcc;
    --md-quote-bg: rgba(255, 0, 85, 0.10);
    --md-mark-bg: rgba(255, 0, 85, 0.35);
    --md-mark-ink: #ffe4ec;
    --md-body-font: 'Courier New', Courier, monospace;
    --md-head-font: 'Courier New', Courier, monospace;
    --md-mono-font: 'Courier New', Courier, monospace;
    --md-pad: 2.5rem;
    --md-radius: 1rem;
    --md-shadow: 0 0 24px rgba(255, 0, 85, 0.18);
    --md-border: 1px solid #ff0055;
  `,
};

// ---------------------------------------------------------------------------
// The document stylesheet, identical everywhere the document is shown
// ---------------------------------------------------------------------------

const BASE = `
.md-body {
  background: var(--md-page);
  color: var(--md-ink);
  font-family: var(--md-body-font);
  font-size: 15px;
  line-height: 1.75;
  padding: var(--md-pad);
  border-radius: var(--md-radius);
  box-shadow: var(--md-shadow);
  border: var(--md-border);
  overflow-wrap: break-word;
  word-break: break-word;
}
.md-body > *:first-child { margin-top: 0; }
.md-body > *:last-child { margin-bottom: 0; }

.md-body h1, .md-body h2, .md-body h3,
.md-body h4, .md-body h5, .md-body h6 {
  color: var(--md-strong);
  font-family: var(--md-head-font);
  font-weight: 800;
  line-height: 1.25;
  margin: 1.8em 0 0.6em;
  scroll-margin-top: 6rem;
}
.md-body h1 { font-size: 1.9em; letter-spacing: -0.02em; }
.md-body h2 { font-size: 1.5em; border-bottom: 1px solid var(--md-rule); padding-bottom: 0.3em; }
.md-body h3 { font-size: 1.22em; }
.md-body h4 { font-size: 1.05em; }
.md-body h5 { font-size: 0.95em; }
.md-body h6 { font-size: 0.85em; color: var(--md-muted); text-transform: uppercase; letter-spacing: 0.08em; }

.md-body p { margin: 0 0 1.1em; }
.md-body strong { color: var(--md-strong); font-weight: 700; }
.md-body em { font-style: italic; }
.md-body del { opacity: 0.6; }
.md-body mark { background: var(--md-mark-bg); color: var(--md-mark-ink); padding: 0.1em 0.25em; border-radius: 0.25em; }
.md-body small { color: var(--md-muted); }

.md-body a { color: var(--md-accent); text-decoration: underline; text-underline-offset: 0.2em; font-weight: 600; }
.md-body a:hover { opacity: 0.8; }
.md-body .md-broken-link { color: var(--md-muted); text-decoration: line-through wavy; cursor: not-allowed; }

.md-body ul, .md-body ol { margin: 0 0 1.1em; padding-left: 1.6em; }
.md-body li { margin: 0.3em 0; }
.md-body li > ul, .md-body li > ol { margin-bottom: 0.2em; }
.md-body ul.md-tasklist, .md-body ol.md-tasklist { list-style: none; padding-left: 0.2em; }
.md-body li.md-task { display: flex; align-items: flex-start; gap: 0.55em; }
.md-body li.md-task > input { margin-top: 0.42em; accent-color: var(--md-accent); flex: none; }

.md-body blockquote {
  margin: 0 0 1.2em;
  padding: 0.8em 1.1em;
  border-left: 4px solid var(--md-accent);
  background: var(--md-quote-bg);
  border-radius: 0 0.6em 0.6em 0;
  color: var(--md-muted);
  font-style: italic;
}
.md-body blockquote > *:last-child { margin-bottom: 0; }

.md-body code {
  font-family: var(--md-mono-font);
  font-size: 0.87em;
  background: var(--md-code-bg);
  color: var(--md-code-ink);
  padding: 0.15em 0.4em;
  border-radius: 0.35em;
}
.md-body pre {
  position: relative;
  margin: 0 0 1.3em;
  padding: 1.1em 1.2em;
  background: var(--md-pre-bg);
  color: var(--md-pre-ink);
  border: 1px solid var(--md-rule);
  border-radius: 0.75em;
  overflow-x: auto;
  line-height: 1.55;
}
.md-body pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: 0.85em;
  border-radius: 0;
}
.md-body pre[data-lang]::before {
  content: attr(data-lang);
  position: absolute;
  top: 0.55em;
  right: 0.8em;
  font-family: var(--md-mono-font);
  font-size: 0.62em;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--md-muted);
  pointer-events: none;
}

.md-body .md-table-scroll { overflow-x: auto; margin: 0 0 1.3em; }
.md-body table { width: 100%; border-collapse: collapse; font-size: 0.94em; }
.md-body th, .md-body td { border: 1px solid var(--md-rule); padding: 0.55em 0.85em; }
.md-body th { background: var(--md-surface); color: var(--md-strong); font-weight: 700; text-align: left; }
.md-body tbody tr:nth-child(even) td { background: var(--md-surface); }

.md-body hr { border: none; border-top: 1px solid var(--md-rule); margin: 2em 0; }
.md-body img { max-width: 100%; height: auto; border-radius: 0.6em; margin: 0.4em 0; }

.md-body .md-anchor {
  margin-left: 0.4em;
  opacity: 0;
  text-decoration: none;
  font-weight: 400;
  color: var(--md-muted);
}
.md-body h1:hover .md-anchor, .md-body h2:hover .md-anchor, .md-body h3:hover .md-anchor,
.md-body h4:hover .md-anchor, .md-body h5:hover .md-anchor, .md-body h6:hover .md-anchor { opacity: 1; }

.md-body .md-fnref { font-size: 0.72em; vertical-align: super; line-height: 0; }
.md-body .md-fnref a { text-decoration: none; padding: 0 0.15em; }
.md-body .md-footnotes { margin-top: 2.5em; font-size: 0.9em; color: var(--md-muted); }
.md-body .md-footnotes li > p { display: inline; }
.md-body .md-fnback { margin-left: 0.4em; text-decoration: none; }
`;

// ---------------------------------------------------------------------------
// Prism token colours, one dark set and one light set
// ---------------------------------------------------------------------------

const SYNTAX_DARK = `
.md-body pre .token.comment, .md-body pre .token.prolog, .md-body pre .token.doctype, .md-body pre .token.cdata { color: #64748b; font-style: italic; }
.md-body pre .token.punctuation { color: #94a3b8; }
.md-body pre .token.property, .md-body pre .token.tag, .md-body pre .token.constant,
.md-body pre .token.symbol, .md-body pre .token.deleted { color: #f472b6; }
.md-body pre .token.boolean, .md-body pre .token.number { color: #fbbf24; }
.md-body pre .token.selector, .md-body pre .token.attr-name, .md-body pre .token.string,
.md-body pre .token.char, .md-body pre .token.builtin, .md-body pre .token.inserted { color: #86efac; }
.md-body pre .token.operator, .md-body pre .token.entity, .md-body pre .token.url,
.md-body pre .token.variable { color: #7dd3fc; }
.md-body pre .token.atrule, .md-body pre .token.attr-value, .md-body pre .token.function,
.md-body pre .token.class-name { color: #c4b5fd; }
.md-body pre .token.keyword { color: #f472b6; font-weight: 600; }
.md-body pre .token.regex, .md-body pre .token.important { color: #fdba74; }
`;

const SYNTAX_LIGHT = `
.md-body pre .token.comment, .md-body pre .token.prolog, .md-body pre .token.doctype, .md-body pre .token.cdata { color: #6a737d; font-style: italic; }
.md-body pre .token.punctuation { color: #57606a; }
.md-body pre .token.property, .md-body pre .token.tag, .md-body pre .token.constant,
.md-body pre .token.symbol, .md-body pre .token.deleted { color: #cf222e; }
.md-body pre .token.boolean, .md-body pre .token.number { color: #0550ae; }
.md-body pre .token.selector, .md-body pre .token.attr-name, .md-body pre .token.string,
.md-body pre .token.char, .md-body pre .token.builtin, .md-body pre .token.inserted { color: #0a7b3e; }
.md-body pre .token.operator, .md-body pre .token.entity, .md-body pre .token.url,
.md-body pre .token.variable { color: #0550ae; }
.md-body pre .token.atrule, .md-body pre .token.attr-value, .md-body pre .token.function,
.md-body pre .token.class-name { color: #8250df; }
.md-body pre .token.keyword { color: #cf222e; font-weight: 600; }
.md-body pre .token.regex, .md-body pre .token.important { color: #953800; }
`;

/**
 * The complete stylesheet for one theme. `scope` lets the preview keep every
 * theme's variables under its own class while an export writes them on `:root`.
 */
export function themeCss(id: ThemeId, scope = '.md-body'): string {
  const meta = themeMeta(id);
  return `${scope} {${VARIABLES[id]}}\n${BASE}\n${meta.dark ? SYNTAX_DARK : SYNTAX_LIGHT}`;
}

/** Every theme at once, each behind `.md-theme-<id>`, for the live preview. */
export function allThemesCss(): string {
  const variables = THEMES.map(theme => `.md-theme-${theme.id} {${VARIABLES[theme.id]}}`).join('\n');
  const syntax = THEMES.map(theme =>
    (theme.dark ? SYNTAX_DARK : SYNTAX_LIGHT).replace(/\.md-body /g, `.md-theme-${theme.id}.md-body `)
  ).join('\n');
  return `${variables}\n${BASE}\n${syntax}`;
}

/**
 * Print rules. `window.print()` on its own used to send the whole page — header,
 * ad slots, toolbar and footer — to the printer, because the `no-print` classes
 * the component was using had no stylesheet backing them anywhere in the repo.
 *
 * The document to print is copied into a `.md-print-root` appended directly to
 * `<body>`, so "everything except this one element" is a rule the browser can
 * apply without knowing anything about the tool's layout.
 */
export const PRINT_CSS = `
.md-print-root { display: none; }
@media print {
  body > *:not(.md-print-root) { display: none !important; }
  .md-print-root {
    position: static !important;
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
    background: #ffffff !important;
    box-shadow: none !important;
  }
  .md-print-root .md-body {
    background: #ffffff !important;
    color: #111827 !important;
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    font-size: 11.5pt;
  }
  .md-print-root .md-body h1, .md-print-root .md-body h2,
  .md-print-root .md-body h3, .md-print-root .md-body h4 {
    color: #000000 !important;
    break-after: avoid;
  }
  .md-print-root .md-body pre, .md-print-root .md-body blockquote,
  .md-print-root .md-body table, .md-print-root .md-body img { break-inside: avoid; }
  .md-print-root .md-body pre {
    background: #f6f8fa !important;
    color: #1f2328 !important;
    border: 1px solid #d1d9e0 !important;
  }
  .md-print-root .md-body pre code, .md-print-root .md-body pre .token { color: #1f2328 !important; }
  .md-print-root .md-body code { background: #f0f1f3 !important; color: #1f2328 !important; }
  .md-print-root .md-body a { color: #0550ae !important; }
  .md-print-root .md-body th { background: #f6f8fa !important; color: #000000 !important; }
  .md-print-root .md-body th, .md-print-root .md-body td { border: 1px solid #d1d9e0 !important; }
  .md-print-root .md-anchor { display: none !important; }
  @page { margin: 18mm 16mm; }
}
`;
