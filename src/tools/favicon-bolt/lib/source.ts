// ============================================================================
// Source loading
// ----------------------------------------------------------------------------
// The old intake was `accept="image/*"` plus `new Image()` with no error path:
// an iPhone HEIC silently produced a blank icon and a corrupt file produced
// nothing at all. Every failure now has a reason the UI can show.
// ============================================================================

import type { SourceImage } from '../types';

export type LoadError = 'type' | 'size' | 'heic' | 'decode' | 'svgSize';

export const ACCEPTED = 'image/png,image/jpeg,image/webp,image/avif,image/svg+xml,image/gif,image/bmp,.heic,.heif';

/** 30 MB. Above this the trim scan and the master render start to hurt on mobile. */
export const MAX_BYTES = 30 * 1024 * 1024;

function isHeic(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

async function readText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

/**
 * An SVG without width/height draws as a 0x0 image in Firefox and as 300x150
 * in Chrome. Stamping the viewBox dimensions onto the root element makes it
 * decode to its real aspect ratio everywhere.
 */
function normaliseSvg(markup: string): { markup: string; ok: boolean } {
  const openTag = markup.match(/<svg[^>]*>/i)?.[0];
  if (!openTag) return { markup, ok: false };

  const hasSize = /\swidth\s*=/i.test(openTag) && /\sheight\s*=/i.test(openTag);
  if (hasSize) return { markup, ok: true };

  const viewBox = openTag.match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!viewBox) return { markup, ok: false };

  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || !parts[2] || !parts[3]) return { markup, ok: false };

  const patched = openTag.replace(/<svg/i, `<svg width="${parts[2]}" height="${parts[3]}"`);
  return { markup: markup.replace(openTag, patched), ok: true };
}

export async function loadSource(file: File): Promise<{ source: SourceImage } | { error: LoadError }> {
  if (file.size > MAX_BYTES) return { error: 'size' };

  let working: File = file;
  let svgText: string | null = null;

  if (isHeic(file)) {
    try {
      const heic2any = (await import('heic2any')).default as any;
      const converted = (await heic2any({ blob: file, toType: 'image/png' })) as Blob;
      working = new File([converted], file.name.replace(/\.hei[cf]$/i, '.png'), { type: 'image/png' });
    } catch {
      return { error: 'heic' };
    }
  } else if (/svg/i.test(file.type) || /\.svg$/i.test(file.name)) {
    const raw = await readText(file);
    const { markup, ok } = normaliseSvg(raw);
    if (!ok) return { error: 'svgSize' };
    svgText = markup;
    working = new File([markup], file.name, { type: 'image/svg+xml' });
  } else if (!file.type.startsWith('image/')) {
    return { error: 'type' };
  }

  const url = URL.createObjectURL(working);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('decode'));
      img.src = url;
    });
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) {
      URL.revokeObjectURL(url);
      return { error: 'decode' };
    }
    return { source: { img, url, name: working.name, width, height, svgText } };
  } catch {
    URL.revokeObjectURL(url);
    return { error: 'decode' };
  }
}
