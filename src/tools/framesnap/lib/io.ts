// ============================================================================
// Files in, files out.
// ----------------------------------------------------------------------------
// The intake check used to be `file.type.startsWith('video/')` and a silent
// return. On Windows a .mkv or .mov often arrives with an empty MIME type, so
// the tool did nothing at all and said nothing about it.
// ============================================================================

const VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.webm', '.mov', '.mkv', '.avi', '.ogv', '.ogg', '.3gp', '.mpg', '.mpeg'];

export const ACCEPT_ATTRIBUTE = `video/*,${VIDEO_EXTENSIONS.join(',')}`;

export type IntakeVerdict = 'ok' | 'not-video' | 'maybe-unsupported';

/**
 * Decides whether to even try. The extension is trusted over the MIME type
 * because the MIME type is the part that goes missing; the browser gets the
 * final say when it fails to load, which is reported separately.
 */
export function classifyVideo(file: File): IntakeVerdict {
  const name = file.name.toLowerCase();
  const known = VIDEO_EXTENSIONS.some(ext => name.endsWith(ext));
  if (file.type.startsWith('video/')) return 'ok';
  if (known) return 'maybe-unsupported';
  if (file.type.startsWith('image/') || file.type.startsWith('audio/')) return 'not-video';
  return known ? 'maybe-unsupported' : 'not-video';
}

export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    // Only PNG is universally accepted by the async clipboard; a JPEG capture
    // is re-wrapped rather than silently failing the way it used to.
    const png = blob.type === 'image/png' ? blob : await toPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return true;
  } catch {
    return false;
  }
}

async function toPng(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(out => (out ? resolve(out) : reject(new Error('encode'))), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Safe immediately: the browser has taken its own reference by now. Not
  // revoking is how a session ends up pinning every export in memory.
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/** Filesystem-safe stem taken from the source video's name. */
export function baseNameOf(fileName: string): string {
  return (fileName.replace(/\.[^.]+$/, '') || 'framesnap').replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60);
}
