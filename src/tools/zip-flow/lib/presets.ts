// ============================================================================
// Compression policy — deliberately free of JSZip so the UI can import it
// without dragging the library into the main bundle (the worker owns that).
// ============================================================================

import type { Method, PackFile, Preset, QueueItem } from '../types';

/**
 * Extensions whose bytes are already entropy-coded. Deflating them burns CPU
 * for a fraction of a percent — and occasionally makes the entry *bigger*.
 * "Smart" mode stores these verbatim and spends the effort on the rest.
 */
export const PRECOMPRESSED = new Set([
  // images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'heic', 'heif', 'jxl',
  // video / audio
  'mp4', 'm4v', 'mov', 'webm', 'mkv', 'avi', 'mp3', 'm4a', 'aac', 'ogg', 'oga',
  'opus', 'flac', 'wma',
  // archives and packages (a .docx is a ZIP with a different extension)
  'zip', 'gz', 'tgz', 'bz2', 'xz', '7z', 'rar', 'zst', 'jar', 'apk', 'crx',
  'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'epub',
  // fonts and other already-compressed containers
  'woff', 'woff2', 'pdf',
]);

export function extensionOf(path: string): string {
  const name = path.split('/').pop() || path;
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** DEFLATE level per preset; `store` and `smart` are decided per file. */
export const PRESET_LEVEL: Record<Preset, number> = {
  store: 0,
  fast: 1,
  balanced: 6,
  max: 9,
  smart: 9,
};

export interface EntryOptions {
  compression: 'STORE' | 'DEFLATE';
  level: number;
}

/**
 * Resolves the per-entry compression. Setting this per file instead of
 * globally is the whole point of "smart": a folder of photos packs in a
 * fraction of the time, at the same size.
 */
export function optionsFor(path: string, method: Method, preset: Preset): EntryOptions {
  const store =
    method === 'store' ||
    (method === 'auto' &&
      (preset === 'store' || (preset === 'smart' && PRECOMPRESSED.has(extensionOf(path)))));

  if (store) return { compression: 'STORE', level: 0 };
  const level = preset === 'store' ? 6 : PRESET_LEVEL[preset] || 6;
  return { compression: 'DEFLATE', level: Math.max(1, level) };
}

/** How many entries the current settings would store raw. */
export function countStored(files: Array<{ path: string; method: Method }>, preset: Preset): number {
  let n = 0;
  for (const f of files) if (optionsFor(f.path, f.method, preset).compression === 'STORE') n++;
  return n;
}

/** Queue → the plain shape the worker receives (File is structured-cloneable). */
export function toPackFiles(items: QueueItem[]): PackFile[] {
  return items.map(item => ({ path: item.path, blob: item.file, method: item.method }));
}
