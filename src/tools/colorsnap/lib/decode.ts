// ============================================================================
// File intake
// ----------------------------------------------------------------------------
// The old input accepted png/jpeg/webp/gif/bmp and handed the blob straight to
// an <img>. Two consequences: the HEIC every recent iPhone shoots passed the
// `type.startsWith('image/')` check and then failed to decode, surfacing as
// "Failed to load image"; and anything that was not an image was dropped with
// no message at all.
//
// heic2any and utif are already dependencies of this project (exif-clear and
// formatflow use them), so HEIC and TIFF cost nothing extra here.
// ============================================================================

export type IntakeError = 'size' | 'format' | 'heic' | 'tiff' | 'decode';

/** 80 MB. A 48 MP HEIC lands around 12 MB; a big TIFF is the realistic ceiling
 *  and past this a phone tab starts dropping the buffer. */
export const MAX_BYTES = 80 * 1024 * 1024;

/** Every extension listed here really does decode. Keep this and the on-screen
 *  format list in sync — the previous copy advertised four formats and accepted
 *  five, while silently failing on the one people actually drag in. */
export const ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif,image/heic,image/heif,image/tiff,image/svg+xml,' +
  '.png,.jpg,.jpeg,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff,.svg';

export interface DecodedImage {
  bitmap: ImageBitmap;
  name: string;
  width: number;
  height: number;
  bytes: number;
  /** Set when the file had to be transcoded to be readable (HEIC, TIFF). */
  converted: boolean;
  /** Object URL for on-screen display. The caller owns it and must revoke it. */
  url: string;
}

export interface DecodeResult {
  value: DecodedImage | null;
  error: IntakeError | null;
}

const failed = (error: IntakeError): DecodeResult => ({ value: null, error });

function isHeic(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function isTiff(file: File): boolean {
  return /tiff?/i.test(file.type) || /\.tiff?$/i.test(file.name);
}

/** An SVG has no pixels until something rasterises it, and `createImageBitmap`
 *  refuses SVG blobs in Firefox. Route it through an <img> at a fixed size. */
async function rasteriseSvg(url: string): Promise<ImageBitmap | null> {
  const img = new Image();
  img.decoding = 'async';
  const ok = await new Promise<boolean>(resolve => {
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
  if (!ok) return null;

  const w = img.naturalWidth || 1024;
  const h = img.naturalHeight || 1024;
  const scale = Math.min(1400 / w, 1400 / h, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return createImageBitmap(canvas);
}

async function tiffToBlob(file: File): Promise<Blob | null> {
  try {
    const UTIF: any = (await import('utif')).default || (await import('utif'));
    const buffer = await file.arrayBuffer();
    const ifds = UTIF.decode(buffer);
    if (!ifds.length) return null;
    UTIF.decodeImage(buffer, ifds[0], ifds);
    const rgba = UTIF.toRGBA8(ifds[0]);
    const width = ifds[0].width;
    const height = ifds[0].height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
    return await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  }
}

/**
 * Decodes a dropped file into an ImageBitmap the worker can read.
 *
 * `imageOrientation: 'from-image'` matters even here, where only colours are
 * counted: a rotated JPEG shown upright but sampled sideways makes the
 * eyedropper land on the wrong pixel.
 */
export async function decodeFile(file: File): Promise<DecodeResult> {
  if (file.size > MAX_BYTES) return failed('size');

  let working: Blob = file;
  let converted = false;

  if (isHeic(file)) {
    try {
      const heic2any = (await import('heic2any')).default;
      const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
      working = Array.isArray(out) ? out[0] : (out as Blob);
      converted = true;
    } catch {
      return failed('heic');
    }
  } else if (isTiff(file)) {
    const png = await tiffToBlob(file);
    if (!png) return failed('tiff');
    working = png;
    converted = true;
  } else if (!file.type.startsWith('image/') && !/\.(png|jpe?g|webp|gif|bmp|avif|svg)$/i.test(file.name)) {
    return failed('format');
  }

  const url = URL.createObjectURL(working);
  let bitmap: ImageBitmap | null = null;

  try {
    if (working.type === 'image/svg+xml') {
      bitmap = await rasteriseSvg(url);
    } else {
      bitmap = await createImageBitmap(working, { imageOrientation: 'from-image' });
    }
  } catch {
    bitmap = null;
  }

  if (!bitmap) {
    URL.revokeObjectURL(url);
    return failed('decode');
  }

  return {
    value: {
      bitmap,
      name: file.name,
      width: bitmap.width,
      height: bitmap.height,
      bytes: file.size,
      converted,
      url,
    },
    error: null,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
