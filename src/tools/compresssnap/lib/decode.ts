// ============================================================================
// Decoding
// ----------------------------------------------------------------------------
// The old build accepted JPEG, PNG and WebP and nothing else, which meant the
// photos most people actually have — the ones straight off an iPhone — were
// rejected by the file picker. `heic2any` and `utif` were already dependencies
// of this project, used by other tools, so that support was paid for and
// unused.
//
// Both are loaded with a dynamic `import()` and both run HERE, on the main
// thread, not inside the worker: an `import()` inside a worker breaks the IIFE
// worker build, and importing them statically would drag a megabyte of decoder
// into the eager chunk for the 95% of visitors who upload a JPEG. The worker
// receives an already-decoded ImageBitmap and never knows the difference.
// ============================================================================

export interface DecodedSource {
  bitmap: ImageBitmap;
  /** What we managed to read it as, after any conversion. */
  mime: string;
  /** True when the file needed a converter rather than the browser's decoder. */
  converted: boolean;
}

const HEIC_EXT = /\.(heic|heif)$/i;
const TIFF_EXT = /\.(tiff?)$/i;

/** Sniffs the container, because iOS often hands over a blank `file.type`. */
async function looksLikeHeic(file: File): Promise<boolean> {
  if (/^image\/hei[cf]/i.test(file.type)) return true;
  if (HEIC_EXT.test(file.name)) return true;
  // ISO-BMFF brand box: bytes 4-8 are "ftyp", 8-12 the brand.
  try {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const tag = String.fromCharCode(...head.slice(4, 8));
    const brand = String.fromCharCode(...head.slice(8, 12));
    return tag === 'ftyp' && /^(heic|heix|hevc|mif1|msf1|heim|hevm)/i.test(brand);
  } catch {
    return false;
  }
}

function looksLikeTiff(file: File): boolean {
  return /^image\/tiff/i.test(file.type) || TIFF_EXT.test(file.name);
}

async function decodeHeic(file: File): Promise<DecodedSource> {
  const heic2any = (await import('heic2any')).default as (options: {
    blob: Blob; toType?: string; quality?: number;
  }) => Promise<Blob | Blob[]>;
  // Quality 0.94 for the intermediate: this is not the output, it is the
  // source the real encode will work from, so throwing detail away here would
  // be paid for twice.
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return { bitmap: await createImageBitmap(blob), mime: 'image/jpeg', converted: true };
}

async function decodeTiff(file: File): Promise<DecodedSource> {
  const UTIF = (await import('utif')).default as any;
  const buffer = await file.arrayBuffer();
  const pages = UTIF.decode(buffer);
  if (!pages || pages.length === 0) throw new Error('tiff-empty');
  UTIF.decodeImage(buffer, pages[0]);
  const rgba = UTIF.toRGBA8(pages[0]);
  const width = pages[0].width;
  const height = pages[0].height;
  const image = new ImageData(new Uint8ClampedArray(rgba), width, height);
  return { bitmap: await createImageBitmap(image), mime: 'image/png', converted: true };
}

/**
 * SVG has no intrinsic pixel size, so `createImageBitmap` refuses it in most
 * engines. Rasterising through an <img> at its own reported size is the only
 * route, and it is deliberately capped: a 20-line SVG can declare itself
 * 30000px wide.
 */
const SVG_FALLBACK = 1024;
const SVG_MAX = 4096;

async function decodeSvg(file: File): Promise<DecodedSource> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('svg-decode-failed'));
      element.src = url;
    });
    const width = Math.min(SVG_MAX, img.naturalWidth || SVG_FALLBACK);
    const height = Math.min(SVG_MAX, img.naturalHeight || SVG_FALLBACK);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-2d-unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    const bitmap = await createImageBitmap(canvas);
    return { bitmap, mime: 'image/png', converted: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * `imageOrientation: 'from-image'` is the reason this uses createImageBitmap
 * rather than an <img>: a photo shot in portrait carries its rotation in EXIF,
 * and a canvas draw of the raw pixels lays it on its side. Asking the decoder
 * to apply the tag is the only way to get it upright, and it is also why the
 * EXIF block itself can then be dropped without losing anything visible.
 */
export async function decodeFile(file: File): Promise<DecodedSource> {
  if (await looksLikeHeic(file)) return decodeHeic(file);
  if (looksLikeTiff(file)) return decodeTiff(file);
  if (/^image\/svg/i.test(file.type) || /\.svg$/i.test(file.name)) return decodeSvg(file);

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { bitmap, mime: file.type || 'image/jpeg', converted: false };
  } catch {
    // Older Safari rejects the options bag rather than ignoring it.
    const bitmap = await createImageBitmap(file);
    return { bitmap, mime: file.type || 'image/jpeg', converted: false };
  }
}

/** Everything the picker should offer, including what needs a converter. */
export const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/tiff,image/heic,image/heif,image/svg+xml,.heic,.heif,.tif,.tiff,.avif';

/** True for anything we have a route to decode. */
export function isSupportedImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  // iOS hands over HEIC with an empty type often enough that the extension has
  // to count as evidence on its own.
  return HEIC_EXT.test(file.name) || TIFF_EXT.test(file.name) || /\.avif$/i.test(file.name);
}
