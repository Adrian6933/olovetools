// ============================================================================
// Clipboard and file helpers.
// ----------------------------------------------------------------------------
// The originals here called `navigator.clipboard` bare (it throws on an
// insecure origin and the copy silently did nothing) and read files with no
// size ceiling at all, so an 80 MB log went straight into a <textarea>.
// ============================================================================

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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
  // Safe to revoke straight away: the browser took its own reference inside
  // click(). Leaving it pinned the blob for the life of the tab.
  URL.revokeObjectURL(url);
}

/** Anything past this goes into the parked state instead of into the editor. */
export const PARK_FILE_LIMIT = 512 * 1024;

/** Hard ceiling: above this a browser tab cannot hold the text at all. */
export const MAX_FILE_BYTES = 32 * 1024 * 1024;

export function readTextFile(file: File, limitBytes = MAX_FILE_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > limitBytes) {
      reject(new Error('too-large'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('read-failed'));
    // The BOM is stripped: left in place it makes line 1 differ from line 1.
    reader.onload = () => resolve(String(reader.result ?? '').replace(/^﻿/, ''));
    reader.readAsText(file);
  });
}

/**
 * Text-ish extensions worth advertising in the file picker. `text/*` alone
 * hides .ts, .vue, .go and half of what people actually compare.
 */
export const ACCEPTED_EXTENSIONS = [
  '.txt', '.md', '.markdown', '.log', '.csv', '.tsv',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro',
  '.json', '.jsonc', '.json5', '.jsonl', '.ndjson',
  '.html', '.htm', '.xml', '.svg', '.css', '.scss', '.sass', '.less',
  '.py', '.rb', '.php', '.go', '.rs', '.java', '.kt', '.swift',
  '.c', '.h', '.cpp', '.hpp', '.cs', '.sql',
  '.sh', '.bash', '.zsh', '.ps1', '.bat',
  '.yml', '.yaml', '.toml', '.ini', '.conf', '.env',
  '.diff', '.patch', '.srt', '.vtt',
] as const;

export const ACCEPT_ATTRIBUTE = `${ACCEPTED_EXTENSIONS.join(',')},text/plain`;

export function extensionOf(name: string): string {
  const at = name.lastIndexOf('.');
  return at === -1 ? '' : name.slice(at).toLowerCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatCount(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** Strips a directory path so downloads keep a sane name. */
export function baseName(name: string): string {
  const at = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\'));
  return at === -1 ? name : name.slice(at + 1);
}
