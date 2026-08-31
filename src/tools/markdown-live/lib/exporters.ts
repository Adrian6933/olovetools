// ============================================================================
// Getting the document out
// ----------------------------------------------------------------------------
// Every export re-parses on the spot instead of reusing the preview's HTML. It
// costs a couple of milliseconds on a click and it buys three different outputs
// from one source of truth: a standalone page carrying the theme you actually
// picked, a bare fragment fit for a CMS, and a print sheet with none of the
// page's furniture on it.
//
// Object URLs are revoked. The previous version created one per download and
// released none of them.
// ============================================================================

import { parse } from './parser';
import { render } from './render';
import { highlight } from './highlight';
import { PRINT_CSS, themeCss, themeMeta } from './themes';
import type { ThemeId } from '../types';

export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // A microtask is too early for Firefox; a frame is enough for every browser.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** `My Notes.md` from `# My Notes`, falling back to a stable default. */
export function documentName(markdown: string, fallback = 'document'): string {
  const heading = /^\s{0,3}#{1,6}\s+(.+)$/m.exec(markdown);
  const raw = heading ? heading[1] : '';
  const cleaned = raw
    .replace(/[*_`~[\]()]/g, '')
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .slice(0, 60)
    .trim();
  return cleaned || fallback;
}

export function renderBody(markdown: string, options: { bare?: boolean; anchors?: boolean } = {}): string {
  const doc = parse(markdown);
  return render(doc.blocks, { ...options, highlight });
}

// ---------------------------------------------------------------------------
// Standalone HTML
// ---------------------------------------------------------------------------

export function buildHtmlFile(markdown: string, theme: ThemeId, lang: string): string {
  const doc = parse(markdown);
  const body = render(doc.blocks, { anchors: true, highlight });
  const title = documentName(markdown, 'Document');
  const meta = themeMeta(theme);

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title.replace(/[<>&]/g, '')}</title>
<style>
:root { color-scheme: ${meta.dark ? 'dark' : 'light'}; }
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 2.5rem 1.25rem 4rem;
  background: ${meta.swatch[0]};
  display: flex;
  justify-content: center;
}
.md-wrap { width: 100%; max-width: 48rem; }
${themeCss(theme)}
</style>
</head>
<body>
<main class="md-wrap"><article class="md-body">
${body}
</article></main>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Print / PDF
// ---------------------------------------------------------------------------

let printSheet: HTMLStyleElement | null = null;

/**
 * Prints only the document. The old button called `window.print()` and relied
 * on `no-print` classes that existed in no stylesheet in the repo, so it sent
 * the header, the ad slots, the toolbar and the footer to the printer.
 */
export function printDocument(markdown: string, theme: ThemeId): void {
  if (!printSheet) {
    printSheet = document.createElement('style');
    printSheet.setAttribute('data-markdown-live-print', '');
    document.head.appendChild(printSheet);
  }
  printSheet.textContent = `${themeCss(theme, '.md-print-root .md-body')}\n${PRINT_CSS}`;

  const holder = document.createElement('div');
  holder.className = 'md-print-root';
  const article = document.createElement('article');
  article.className = 'md-body';
  article.innerHTML = renderBody(markdown, { anchors: false });
  holder.appendChild(article);
  document.body.appendChild(holder);

  const cleanup = () => {
    holder.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  try {
    window.print();
  } finally {
    // Chrome fires `afterprint`; Safari sometimes does not, so there is a floor.
    setTimeout(cleanup, 60000);
  }
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Denied permission or an insecure origin: the textarea trick still works.
    try {
      const helper = document.createElement('textarea');
      helper.value = value;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const ok = document.execCommand('copy');
      helper.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Rich text, so pasting into a mail client or a doc keeps the headings and the
 * bold rather than dropping a wall of angle brackets.
 */
export async function copyRich(markdown: string, theme: ThemeId): Promise<boolean> {
  const html = `<div class="md-body">${renderBody(markdown, { anchors: false })}</div>`;
  const plain = markdown;
  try {
    const ClipboardItemCtor = (window as any).ClipboardItem;
    if (!ClipboardItemCtor || !navigator.clipboard?.write) throw new Error('unsupported');
    await navigator.clipboard.write([
      new ClipboardItemCtor({
        'text/html': new Blob([`<style>${themeCss(theme)}</style>${html}`], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      }),
    ]);
    return true;
  } catch {
    return copyText(html);
  }
}
