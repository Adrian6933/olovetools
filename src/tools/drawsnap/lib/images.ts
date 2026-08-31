// ============================================================================
// Bitmap registry.
// ----------------------------------------------------------------------------
// ImageShape only carries a key; the decoded bitmap lives here. Keeping DOM
// objects out of React state is what lets the undo history be a plain array of
// shape references instead of a deep clone of every pixel.
// ============================================================================

const bitmaps = new Map<string, HTMLImageElement>();
const objectUrls = new Map<string, string>();

export function registerBitmap(key: string, img: HTMLImageElement, objectUrl?: string) {
  bitmaps.set(key, img);
  if (objectUrl) objectUrls.set(key, objectUrl);
}

export function getBitmap(key: string): HTMLImageElement | undefined {
  return bitmaps.get(key);
}

/** Frees every object URL this session created. Called on unmount and on reset. */
export function releaseBitmaps(keys?: string[]) {
  const list = keys ?? Array.from(objectUrls.keys());
  for (const key of list) {
    const url = objectUrls.get(key);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(key);
    bitmaps.delete(key);
    dataUrlCache.delete(key);
  }
}

/** iPhone photos arrive as HEIC, which no browser can draw to a canvas. */
async function normalise(file: File): Promise<File | null> {
  const isHeic = /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
  if (!isHeic) return file.type.startsWith('image/') || /\.(svg|avif)$/i.test(file.name) ? file : null;
  try {
    const heic2any = (await import('heic2any')).default as any;
    const converted = (await heic2any({ blob: file, toType: 'image/png' })) as Blob;
    return new File([converted], file.name.replace(/\.hei[cf]$/i, '.png'), { type: 'image/png' });
  } catch {
    return null;
  }
}

export interface LoadedImage {
  key: string;
  img: HTMLImageElement;
  url: string;
  name: string;
  width: number;
  height: number;
}

/**
 * Decodes a file into a registered bitmap. Rejects with a readable reason
 * instead of leaving a broken shape on the board.
 */
export async function loadImageFile(file: File): Promise<LoadedImage | null> {
  const normalised = await normalise(file);
  if (!normalised) return null;

  const url = URL.createObjectURL(normalised);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode'));
      img.src = url;
    });
    const key = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    registerBitmap(key, img, url);
    return {
      key,
      img,
      url,
      name: normalised.name,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

/**
 * Re-encodes a bitmap as a data URI so the SVG export is self-contained.
 * Memoised: the autosave runs after every change, and re-encoding a 12 MP
 * photo on each keystroke was pure waste — the pixels never change.
 */
const dataUrlCache = new Map<string, string>();

export function bitmapToDataUrl(key: string): string | null {
  const cached = dataUrlCache.get(key);
  if (cached) return cached;

  const img = getBitmap(key);
  if (!img) return null;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  try {
    const url = canvas.toDataURL('image/png');
    dataUrlCache.set(key, url);
    return url;
  } catch {
    return null;
  }
}
