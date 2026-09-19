// ============================================================================
// CropSnap geometry and export
// ----------------------------------------------------------------------------
// Cropper.js v2 works in "canvas units": the coordinate space of the
// <cropper-canvas> element, which has nothing to do with the pixels of the
// source image. Everything here exists to keep the two straight, because
// confusing them is what silently exports a 12 MP photo as a 100 px thumbnail.
// ============================================================================

import type { AspectRatioPreset, OutputFormat, SizePreset } from '../types';
import { loadImage } from '../../../lib/loadImage';

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

/**
 * Cropper.js v2 has exactly one configuration surface: the template. The
 * library's own default leaves `zoomable`, `keyboard` and `outlined` off the
 * selection, so the arrow keys do nothing and the selection has no outline.
 * `skewable` is deliberately dropped — skewing an image you are cropping is
 * never wanted.
 *
 * `zoomable` is also left off `<cropper-image>` on purpose: its built-in wheel
 * handler does not anchor on the pointer (measured: the point under the cursor
 * drifts ~34 px per notch). The component installs its own wheel listener and
 * calls `$zoom` with the cursor as the origin instead.
 */
export const CROPPER_TEMPLATE = `
<cropper-canvas background style="width:100%;height:100%">
  <cropper-image rotatable scalable translatable></cropper-image>
  <cropper-shade hidden></cropper-shade>
  <cropper-handle action="select" plain></cropper-handle>
  <cropper-selection initial-coverage="0.85" movable resizable zoomable keyboard outlined>
    <cropper-grid role="grid" bordered covered></cropper-grid>
    <cropper-crosshair centered></cropper-crosshair>
    <cropper-handle action="move" theme-color="rgba(255,255,255,0.25)"></cropper-handle>
    <cropper-handle action="n-resize"></cropper-handle>
    <cropper-handle action="e-resize"></cropper-handle>
    <cropper-handle action="s-resize"></cropper-handle>
    <cropper-handle action="w-resize"></cropper-handle>
    <cropper-handle action="ne-resize"></cropper-handle>
    <cropper-handle action="nw-resize"></cropper-handle>
    <cropper-handle action="se-resize"></cropper-handle>
    <cropper-handle action="sw-resize"></cropper-handle>
  </cropper-selection>
</cropper-canvas>
`.trim();

// ---------------------------------------------------------------------------
// Canvas units <-> source pixels
// ---------------------------------------------------------------------------

/**
 * How many canvas units one source pixel occupies right now.
 *
 * `cropper-image.offsetWidth` reports the image's *natural* width, and the
 * on-screen size comes from its transform matrix, so the scale has to be read
 * from the matrix. Taking the length of the first column keeps it correct while
 * the image is rotated, where `a` alone is `cos(angle) * scale`.
 */
export function readImageScale(cropperImage: any): number {
  try {
    const [a, b] = cropperImage.$getTransform();
    const scale = Math.sqrt(a * a + b * b);
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  } catch {
    return 1;
  }
}

/** Rotation encoded in a transform matrix, in degrees, normalised to −180…180. */
export function matrixAngle(matrix: number[]): number {
  const deg = (Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI;
  return Math.round(deg * 10) / 10;
}

/** Selection size in real source pixels — what the export must be rendered at. */
export function selectionToSourcePixels(
  selection: { width: number; height: number },
  imageScale: number
): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(selection.width / imageScale)),
    height: Math.max(1, Math.round(selection.height / imageScale)),
  };
}

// ---------------------------------------------------------------------------
// Aspect ratios
// ---------------------------------------------------------------------------

const RATIOS: Record<AspectRatioPreset, number> = {
  free: NaN,
  original: NaN,
  '1:1': 1,
  '4:5': 4 / 5,
  '3:2': 3 / 2,
  '2:3': 2 / 3,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
  '21:9': 21 / 9,
};

/** `0` is Cropper's "unconstrained" value; `original` needs the source ratio. */
export function ratioFor(preset: AspectRatioPreset, source?: { width: number; height: number }): number {
  if (preset === 'free') return 0;
  if (preset === 'original') return source && source.height ? source.width / source.height : 0;
  return RATIOS[preset] ?? 0;
}

export const ASPECT_PRESETS: AspectRatioPreset[] = [
  'free',
  'original',
  '1:1',
  '4:5',
  '3:2',
  '2:3',
  '4:3',
  '3:4',
  '16:9',
  '9:16',
  '21:9',
];

/**
 * Named destinations, because "1:1" does not tell you an Instagram post wants
 * 1080 px. Picking one sets both the ratio and the exact export size.
 */
export const SIZE_PRESETS: SizePreset[] = [
  { id: 'ig-post', key: 'presetIgPost', fallback: 'Instagram post', width: 1080, height: 1080 },
  { id: 'ig-portrait', key: 'presetIgPortrait', fallback: 'Instagram portrait', width: 1080, height: 1350 },
  { id: 'ig-story', key: 'presetIgStory', fallback: 'Story / Reel / TikTok', width: 1080, height: 1920 },
  { id: 'yt-thumb', key: 'presetYtThumb', fallback: 'YouTube thumbnail', width: 1280, height: 720 },
  { id: 'og', key: 'presetOg', fallback: 'Link preview (OG)', width: 1200, height: 630 },
  { id: 'x-header', key: 'presetXHeader', fallback: 'X / Twitter header', width: 1500, height: 500 },
  { id: 'li-banner', key: 'presetLiBanner', fallback: 'LinkedIn banner', width: 1584, height: 396 },
  { id: 'avatar', key: 'presetAvatar', fallback: 'Avatar', width: 512, height: 512 },
  { id: 'fhd', key: 'presetFhd', fallback: 'Full HD wallpaper', width: 1920, height: 1080 },
  { id: 'a4-300', key: 'presetA4', fallback: 'A4 at 300 dpi', width: 2480, height: 3508 },
];

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportOptions {
  selection: any;
  /** Output size in pixels. Pass the source-pixel size for a 1:1 crop. */
  width: number;
  height: number;
  format: OutputFormat;
  /** 0–1. Ignored for PNG. */
  quality: number;
  /**
   * Painted before the image. JPEG has no alpha, so without this a transparent
   * PNG exports with a black background instead of the colour you expect.
   */
  background?: string;
}

export interface ExportedCrop {
  blob: Blob;
  width: number;
  height: number;
}

export async function exportCrop(options: ExportOptions): Promise<ExportedCrop> {
  const needsMatte = options.format === 'image/jpeg';
  const canvas: HTMLCanvasElement = await options.selection.$toCanvas({
    width: options.width,
    height: options.height,
    beforeDraw: (ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) => {
      if (!needsMatte) return;
      ctx.fillStyle = options.background || '#ffffff';
      ctx.fillRect(0, 0, cvs.width, cvs.height);
    },
  });

  const blob = await new Promise<Blob | null>(resolve =>
    // toBlob instead of toDataURL: a 2480×3508 export as base64 is a ~25 MB
    // string held in memory for no reason.
    canvas.toBlob(resolve, options.format, options.format === 'image/png' ? undefined : options.quality)
  );
  if (!blob) throw new Error('The browser could not encode the crop.');
  return { blob, width: canvas.width, height: canvas.height };
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/** Everything a browser can decode, plus the Apple formats we convert first. */
export const ACCEPTED_INPUT =
  'image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,image/svg+xml,image/tiff,.heic,.heif';

export function isHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type);
}

/** Formats that can carry transparency, so a JPEG export needs a matte colour. */
export function mayHaveAlpha(file: File): boolean {
  return /\.(png|webp|gif|avif|svg)$/i.test(file.name) || /image\/(png|webp|gif|avif|svg)/i.test(file.type);
}

export async function readImageSize(url: string): Promise<{ width: number; height: number }> {
  const image = await loadImage(url);
  return { width: image.naturalWidth, height: image.naturalHeight };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

export function extensionFor(format: OutputFormat): string {
  return format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
}

/** Greatest common divisor, for showing a crop as "16:9" instead of "1920:1080". */
export function simplifyRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  if (!width || !height) return '—';
  const d = gcd(Math.round(width), Math.round(height));
  const w = Math.round(width) / d;
  const h = Math.round(height) / d;
  // Anything past a two-digit side is noise; show the decimal instead.
  return w > 99 || h > 99 ? `${(width / height).toFixed(2)}:1` : `${w}:${h}`;
}
