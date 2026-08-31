// ============================================================================
// Getting text in and out.
// ----------------------------------------------------------------------------
// The old build had no way in at all — you could only type or paste — and two
// ways out, one of which opened a popup window that most browsers block by
// default. Both ends are rebuilt here:
//
//  * In: plain text, Markdown, subtitles, CSV, HTML — and .docx/.odt, which are
//    just zip files with an XML document inside, so JSZip (already a dependency
//    for the image tools) is enough to read them without a server.
//  * Out: TXT, Markdown report, CSV of the keyword table, JSON of the whole
//    analysis, and a print sheet rendered in a hidden iframe instead of a popup.
// ============================================================================

export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // navigator.clipboard throws on an insecure origin, and the original code
    // ignored the rejection, so the copy silently did nothing.
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadText(text: string, filename: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Safe to revoke immediately: click() already took its own reference. Left
  // pinned, the blob lives as long as the tab does.
  URL.revokeObjectURL(url);
}

/** Anything past this is refused rather than freezing the tab. */
export const MAX_FILE_BYTES = 16 * 1024 * 1024;

export type IntakeError = 'too-large' | 'unsupported' | 'read-failed' | 'empty';

const ZIP_DOC = /\.(docx|odt)$/i;

const XML_ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'",
};

function decodeXml(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos);|&#(\d+);|&#x([0-9a-f]+);/gi, (whole, dec, hex) => {
    if (dec) return String.fromCodePoint(Number(dec));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return XML_ENTITIES[whole.toLowerCase()] ?? whole;
  });
}

/** Turns the body XML of a .docx / .odt into plain text with its line breaks. */
function xmlToText(xml: string): string {
  return decodeXml(
    xml
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<text:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:br\b[^>]*\/>/g, '\n')
      .replace(/<text:line-break\b[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<\/text:(?:p|h)>/g, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Strips RTF control words, leaving the visible run of text. */
function rtfToText(raw: string): string {
  return raw
    .replace(/\\'([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u(-?\d+)\??/g, (_, code) => String.fromCharCode(Number(code) & 0xffff))
    .replace(/\\par[d]?\b/g, '\n')
    .replace(/\\line\b/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\{\\\*[^{}]*\}/g, '')
    .replace(/\\[a-z]+-?\d*\s?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function readDocument(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('too-large' satisfies IntakeError);

  if (ZIP_DOC.test(file.name)) {
    // Loaded on demand: nobody counting the words of a pasted tweet should pay
    // for a zip reader.
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const entry = zip.file('word/document.xml') || zip.file('content.xml');
    if (!entry) throw new Error('unsupported' satisfies IntakeError);
    return xmlToText(await entry.async('string'));
  }

  const raw = await file.text();
  if (/\.rtf$/i.test(file.name) || raw.startsWith('{\\rtf')) return rtfToText(raw);
  // A BOM left in place makes line 1 differ from every other line 1.
  return raw.replace(/^﻿/, '');
}

export const ACCEPTED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.rst', '.log', '.csv', '.tsv',
  '.docx', '.odt', '.rtf',
  '.html', '.htm', '.xml', '.json', '.yaml', '.yml',
  '.srt', '.vtt', '.tex', '.adoc', '.org',
] as const;

export const ACCEPT_ATTRIBUTE = `${ACCEPTED_EXTENSIONS.join(',')},text/plain`;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** "0s", "48s", "3m 12s", "1h 04m" — never "0.8m". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s';
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes < 60) return rest > 0 ? `${minutes}m ${String(rest).padStart(2, '0')}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
}

export function baseName(name: string): string {
  const at = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
  const file = at === -1 ? name : name.slice(at + 1);
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>]/g, ch => (ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;'));

/**
 * Prints through a hidden same-origin iframe. `window.open('', '_blank')` — the
 * old approach — is blocked by default in Firefox and by every popup blocker,
 * and when it was blocked the button did nothing at all with no message.
 */
export function printDocument(text: string, title: string, meta: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);

  const remove = () => {
    window.setTimeout(() => frame.remove(), 1000);
  };

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>` +
      '@page{margin:20mm}' +
      'body{font:14px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0}' +
      'header{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;border-bottom:2px solid #0d9488;padding-bottom:10px;margin-bottom:24px}' +
      'h1{font-size:20px;font-weight:800;color:#0d9488;margin:0}' +
      '.meta{font-size:11px;color:#666;text-align:right}' +
      'main{white-space:pre-wrap;word-wrap:break-word}' +
      'footer{margin-top:32px;border-top:1px solid #ddd;padding-top:8px;font-size:10px;color:#888;text-align:center}' +
      `</style></head><body><header><h1>${escapeHtml(title)}</h1><span class="meta">${escapeHtml(meta)}</span></header>` +
      `<main>${escapeHtml(text)}</main>` +
      '<footer>oLoveTools — WordFlow</footer></body></html>'
  );
  doc.close();

  const go = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } finally {
      remove();
    }
  };

  if (doc.readyState === 'complete') go();
  else frame.onload = go;
}
