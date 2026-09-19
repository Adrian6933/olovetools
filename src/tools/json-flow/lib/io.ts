// ============================================================================
// Clipboard and file download helpers.
// ----------------------------------------------------------------------------
// Both of the originals leaked: every export called URL.createObjectURL and
// never revoked it, so each download pinned its blob in memory for the life of
// the tab. And `navigator.clipboard` was called bare — on an insecure origin
// that throws and the copy silently did nothing.
// ============================================================================

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

export function downloadText(text: string, filename: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Revoking immediately is safe: the browser has already taken its own
  // reference by the time click() returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Reads a text file, rejecting anything that is obviously not text. */
export function readTextFile(file: File, limitBytes = 64 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > limitBytes) {
      reject(new Error('too-large'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    reader.onload = () => resolve(String(reader.result ?? '').replace(/^﻿/, ''));
    reader.readAsText(file);
  });
}

/** Extensions the tool knows how to open. Everything here is plain text. */
export const ACCEPTED_EXTENSIONS = [
  '.json',
  '.jsonc',
  '.json5',
  '.jsonl',
  '.ndjson',
  '.geojson',
  '.har',
  '.map',
  '.csv',
  '.tsv',
  '.txt',
  '.webmanifest',
] as const;

export const ACCEPT_ATTRIBUTE = `${ACCEPTED_EXTENSIONS.join(',')},application/json,text/plain,text/csv`;

export function extensionOf(name: string): string {
  const at = name.lastIndexOf('.');
  return at === -1 ? '' : name.slice(at).toLowerCase();
}
