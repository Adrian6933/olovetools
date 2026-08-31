// ============================================================================
// Clipboard, downloads and file intake.
// ----------------------------------------------------------------------------
// The old tool had none of this: no file input, no drag and drop, no download,
// and a bare `navigator.clipboard.writeText()` whose rejection was swallowed
// while the button still said "Copied".
// ============================================================================

/** Anything larger is refused up front instead of freezing the tab. */
export const MAX_BYTES = 32 * 1024 * 1024;

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Insecure origin or a denied permission: fall back to the old command.
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

export function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Safe to revoke straight away: the browser already holds its own reference
  // by the time click() returns. Not revoking pinned every export in memory.
  URL.revokeObjectURL(url);
}

export type ReadError = 'too-large' | 'read-failed';

/**
 * Reads a text file. UTF-16 is detected from the BOM because `readAsText`
 * defaults to UTF-8 and would otherwise hand back a string full of NULs —
 * which is exactly what happens with XML exported from Windows tooling.
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_BYTES) {
      reject(new Error('too-large' satisfies ReadError));
      return;
    }
    const head = file.slice(0, 4);
    const headReader = new FileReader();
    headReader.onerror = () => reject(new Error('read-failed' satisfies ReadError));
    headReader.onload = () => {
      const bytes = new Uint8Array(headReader.result as ArrayBuffer);
      let encoding = 'utf-8';
      if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = 'utf-16le';
      else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = 'utf-16be';

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('read-failed' satisfies ReadError));
      reader.onload = () => resolve(String(reader.result ?? '').replace(/^﻿/, ''));
      reader.readAsText(file, encoding);
    };
    headReader.readAsArrayBuffer(head);
  });
}

export const XML_EXTENSIONS = [
  '.xml',
  '.xsd',
  '.xsl',
  '.xslt',
  '.svg',
  '.rss',
  '.atom',
  '.plist',
  '.pom',
  '.config',
  '.resx',
  '.kml',
  '.gpx',
  '.opml',
  '.wsdl',
  '.sitemap',
] as const;

export const JSON_EXTENSIONS = ['.json', '.jsonc', '.geojson', '.webmanifest', '.map'] as const;

export const ACCEPT_ATTRIBUTE = [
  ...XML_EXTENSIONS,
  ...JSON_EXTENSIONS,
  '.txt',
  'text/xml',
  'application/xml',
  'application/json',
  'text/plain',
].join(',');

export function extensionOf(name: string): string {
  const at = name.lastIndexOf('.');
  return at === -1 ? '' : name.slice(at).toLowerCase();
}

/**
 * Guesses which side of the tool a dropped file belongs on. The extension wins
 * when it is one we know; otherwise the first non-blank character decides,
 * which handles files named `.txt` or with no extension at all.
 */
export function detectDirection(name: string, text: string): 'xml-to-json' | 'json-to-xml' {
  const ext = extensionOf(name);
  if ((JSON_EXTENSIONS as readonly string[]).includes(ext)) return 'json-to-xml';
  if ((XML_EXTENSIONS as readonly string[]).includes(ext)) return 'xml-to-json';
  const head = text.replace(/^﻿/, '').trimStart()[0];
  return head === '{' || head === '[' ? 'json-to-xml' : 'xml-to-json';
}
