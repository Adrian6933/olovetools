import type { BgPattern, Board, Shape, Surface } from '../types';
import { bitmapToDataUrl, registerBitmap } from './images';

// ============================================================================
// Autosave.
// ----------------------------------------------------------------------------
// The old board lived and died with the tab: close it and the drawing was gone,
// which the FAQ cheerfully admitted. Vector shapes are tiny, so the whole
// document fits in localStorage. Nothing is restored behind the user's back —
// DrawSnap.tsx offers it and the user decides.
// ============================================================================

const KEY = 'drawsnap:doc:v1';
/** localStorage dies around 5 MB; stay well under it. */
const MAX_BYTES = 3_500_000;

export interface SavedDoc {
  v: 1;
  at: number;
  board: Board;
  surface: Surface;
  pattern: BgPattern;
  shapes: Shape[];
  /** key → data URI for the image shapes referenced above. */
  images: Record<string, string>;
}

export function saveDoc(doc: Omit<SavedDoc, 'v' | 'at' | 'images'>): boolean {
  try {
    if (!doc.shapes.length) {
      localStorage.removeItem(KEY);
      return true;
    }

    const images: Record<string, string> = {};
    for (const shape of doc.shapes) {
      if (shape.type !== 'image' || images[shape.src]) continue;
      const url = bitmapToDataUrl(shape.src);
      if (url) images[shape.src] = url;
    }

    const payload = JSON.stringify({ v: 1, at: Date.now(), ...doc, images } satisfies SavedDoc);
    if (payload.length > MAX_BYTES) {
      // Too big with the bitmaps: keep the vectors, drop the photos rather than
      // losing the whole board.
      const slim = JSON.stringify({
        v: 1,
        at: Date.now(),
        ...doc,
        shapes: doc.shapes.filter(s => s.type !== 'image'),
        images: {},
      } satisfies SavedDoc);
      if (slim.length > MAX_BYTES) return false;
      localStorage.setItem(KEY, slim);
      return true;
    }

    localStorage.setItem(KEY, payload);
    return true;
  } catch {
    // Private mode, quota exceeded, storage disabled — never fatal.
    return false;
  }
}

export function peekDoc(): SavedDoc | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDoc;
    if (parsed?.v !== 1 || !Array.isArray(parsed.shapes) || !parsed.shapes.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDoc() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}

/** Re-registers the saved bitmaps so image shapes render after a restore. */
export async function rehydrateImages(images: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(images || {}).map(
      ([key, src]) =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.onload = () => {
            registerBitmap(key, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        })
    )
  );
}
