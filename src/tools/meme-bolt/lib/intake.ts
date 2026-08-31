// ============================================================================
// File intake
// ----------------------------------------------------------------------------
// The old input was `accept="image/*"` and `new Image()`, which meant:
//   · the HEIC every recent iPhone shoots was accepted and then failed to
//     decode, with no message,
//   · photos came in sideways, because `<img>` honours EXIF orientation but the
//     natural size it reports does not always match what gets drawn,
//   · a 90 MP panorama was loaded whole and the tab died.
// ============================================================================

export type IntakeError = 'size' | 'decode' | 'heic' | 'type';

/** 40 MB. Past that a phone tab starts swapping just to hold the decoded RGBA. */
export const MAX_BYTES = 40 * 1024 * 1024;

/** Longest side we keep. 4096 is already 4x a 1080p meme. */
export const MAX_EDGE = 4096;

export const ACCEPT =
  'image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp,image/heic,image/heif,' +
  '.png,.jpg,.jpeg,.webp,.gif,.avif,.bmp,.heic,.heif';

export interface LoadedImage {
  image: CanvasImageSource;
  width: number;
  height: number;
  name: string;
  /** True when the HEIC had to be transcoded, so the pixels are not the originals. */
  converted: boolean;
  /** True when the picture was larger than MAX_EDGE and was scaled down. */
  downscaled: boolean;
}

export interface IntakeResult {
  value: LoadedImage | null;
  error: IntakeError | null;
}

const isHeic = (file: File) => /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);

function looksLikeImage(file: File): boolean {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif|bmp|hei[cf])$/i.test(file.name);
}

/** `<img>` fallback for browsers without `createImageBitmap` options support. */
function decodeWithImg(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('decode'));
    };
    img.src = url;
  });
}

/** Scales an oversized decode down once, so every later draw is cheap. */
function downscale(source: CanvasImageSource, width: number, height: number) {
  const factor = MAX_EDGE / Math.max(width, height);
  const w = Math.round(width * factor);
  const h = Math.round(height * factor);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { image: source, width, height };
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, w, h);
  (source as ImageBitmap).close?.();
  return { image: canvas as unknown as CanvasImageSource, width: w, height: h };
}

export async function loadImageFile(file: File): Promise<IntakeResult> {
  if (!looksLikeImage(file)) return { value: null, error: 'type' };
  if (file.size > MAX_BYTES) return { value: null, error: 'size' };

  let blob: Blob = file;
  let name = file.name;
  let converted = false;

  if (isHeic(file)) {
    try {
      const heic2any = (await import('heic2any')).default as any;
      const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 });
      blob = Array.isArray(out) ? out[0] : (out as Blob);
      name = name.replace(/\.hei[cf]$/i, '.jpg');
      converted = true;
    } catch {
      return { value: null, error: 'heic' };
    }
  }

  let source: CanvasImageSource;
  let width: number;
  let height: number;

  try {
    // `imageOrientation: 'from-image'` is what keeps phone photos upright.
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
  } catch {
    try {
      const img = await decodeWithImg(blob);
      source = img;
      width = img.naturalWidth;
      height = img.naturalHeight;
    } catch {
      return { value: null, error: 'decode' };
    }
  }

  if (!width || !height) return { value: null, error: 'decode' };

  let downscaled = false;
  if (Math.max(width, height) > MAX_EDGE) {
    const scaled = downscale(source, width, height);
    source = scaled.image;
    width = scaled.width;
    height = scaled.height;
    downscaled = true;
  }

  return { value: { image: source, width, height, name, converted, downscaled }, error: null };
}

/** Pulls the first image off a paste or drop, ignoring the text flavours. */
export function firstImageFile(list: FileList | DataTransferItemList | null): File | null {
  if (!list) return null;
  const items = Array.from(list as any) as any[];
  for (const item of items) {
    const file = typeof item.getAsFile === 'function' ? item.getAsFile() : (item as File);
    if (file && looksLikeImage(file)) return file;
  }
  return null;
}
