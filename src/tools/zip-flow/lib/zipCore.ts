// ============================================================================
// ZipFlow — the actual ZIP work
// ----------------------------------------------------------------------------
// Deliberately free of React and of any worker plumbing so the exact same code
// runs inside `zip.worker.ts` and, when a Worker cannot be created (hardened
// browsers, blocked module workers), inline on the main thread.
// ============================================================================

import JSZip from 'jszip';
import { decodeFileName } from './cp437';
import { optionsFor } from './presets';
import type { EntryMeta, PackFile, Preset, ZipErrorCode } from '../types';

export type ProgressFn = (percent: number, current: string | null) => void;

function jszipOptions(path: string, method: PackFile['method'], preset: Preset) {
  const opts = optionsFor(path, method, preset);
  return {
    compression: opts.compression,
    compressionOptions: opts.compression === 'DEFLATE' ? { level: opts.level } : null,
  };
}

/**
 * Packs the queue into a single Blob. `onProgress` is fed by JSZip's own
 * update callback, so the bar tracks real bytes rather than a file count.
 */
export async function createArchive(
  files: PackFile[],
  preset: Preset,
  comment: string,
  onProgress?: ProgressFn
): Promise<Blob> {
  const zip = new JSZip();
  for (const f of files) {
    zip.file(f.path, f.blob, {
      ...jszipOptions(f.path, f.method, preset),
      date: f.blob instanceof File ? new Date(f.blob.lastModified) : undefined,
    });
  }
  return zip.generateAsync(
    {
      type: 'blob',
      // `streamFiles` writes each entry's sizes in a trailing descriptor
      // instead of buffering the entry twice — noticeably lighter on memory.
      streamFiles: true,
      comment: comment || undefined,
      platform: 'UNIX',
    },
    onProgress ? meta => onProgress(meta.percent, meta.currentFile) : undefined
  );
}

/** Maps a thrown error to something the UI can say honestly. */
export function classifyError(err: unknown): { code: ZipErrorCode; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  if (/encrypted/i.test(message)) return { code: 'encrypted', message };
  if (/corrupted|invalid|not a zip|end of central|signature|can't find/i.test(message))
    return { code: 'corrupt', message };
  if (/allocation|out of memory|maximum call stack|too large|invalid string length/i.test(message))
    return { code: 'memory', message };
  return { code: 'unknown', message };
}

/**
 * Holds one opened archive so that listing, previewing and extracting don't
 * re-parse the file every time.
 */
export class ZipSession {
  private zip: JSZip | null = null;

  async open(file: Blob, checkCrc: boolean): Promise<EntryMeta[]> {
    const zip = await JSZip.loadAsync(file, { checkCRC32: checkCrc, decodeFileName });
    this.zip = zip;

    const entries: EntryMeta[] = [];
    for (const path of Object.keys(zip.files)) {
      const obj = zip.files[path];
      // `_data` is the CompressedObject JSZip builds straight from the central
      // directory: sizes and CRC without decompressing a byte. The public API
      // only ever hands back already-flattened content.
      const raw = (
        obj as unknown as {
          _data?: { uncompressedSize?: number; compressedSize?: number; crc32?: number };
        }
      )._data;
      entries.push({
        path,
        dir: obj.dir,
        size: raw?.uncompressedSize ?? 0,
        packed: raw?.compressedSize ?? 0,
        crc32: typeof raw?.crc32 === 'number' ? raw.crc32 : null,
        date: obj.date ? obj.date.getTime() : 0,
      });
    }
    return entries;
  }

  /** Extracts one entry — used by the preview, the row download and the folder export. */
  async read(path: string, onProgress?: ProgressFn): Promise<Blob> {
    const obj = this.zip?.files[path];
    if (!obj) throw new Error('Entry not found: ' + path);
    return obj.async('blob', onProgress ? meta => onProgress(meta.percent, path) : undefined);
  }

  /**
   * Builds a new archive out of a subset of entries. The caller picks the
   * preset: `store` keeps it instant, which is what you want when the source
   * was already compressed.
   */
  async repack(paths: string[], preset: Preset, onProgress?: ProgressFn): Promise<Blob> {
    if (!this.zip) throw new Error('No archive open');
    const out = new JSZip();
    for (const path of paths) {
      const obj = this.zip.files[path];
      if (!obj || obj.dir) continue;
      out.file(path, await obj.async('uint8array'), {
        ...jszipOptions(path, 'auto', preset),
        date: obj.date,
      });
    }
    return out.generateAsync(
      { type: 'blob', streamFiles: true },
      onProgress ? meta => onProgress(meta.percent, meta.currentFile) : undefined
    );
  }

  close(): void {
    this.zip = null;
  }
}
