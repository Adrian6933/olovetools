export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

/** `free` means no constraint; the rest are width/height ratios. */
export type AspectRatioPreset =
  | 'free'
  | 'original'
  | '1:1'
  | '4:5'
  | '3:2'
  | '2:3'
  | '4:3'
  | '3:4'
  | '16:9'
  | '9:16'
  | '21:9';

/** A named destination with a concrete pixel target, not just a ratio. */
export interface SizePreset {
  id: string;
  /** Translation key, e.g. `presetIgPost`. */
  key: string;
  fallback: string;
  width: number;
  height: number;
}

export type Tab = 'crop' | 'transform' | 'output';

/**
 * The whole editor state worth undoing: the selection rect plus the image's
 * transform matrix. Storing the matrix rather than "rotate + flip" matters —
 * the matrix also carries the initial fit scale, so restoring it cannot leave
 * the image at 1:1 inside a 400 px canvas. Six numbers instead of a bitmap.
 */
export interface EditorSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  /** [a, b, c, d, e, f] straight from `CropperImage.$getTransform()`. */
  matrix: number[];
  flipX: boolean;
  flipY: boolean;
  aspect: AspectRatioPreset;
}

export interface CropResult {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  bytes: number;
  format: OutputFormat;
}

export interface SourceImage {
  file: File;
  url: string;
  width: number;
  height: number;
  /** True when the source can carry transparency, so JPEG needs a matte. */
  hasAlpha: boolean;
}

/** One queued image. The first one is what the editor is showing. */
export interface BatchItem extends SourceImage {
  id: string;
}

/**
 * A framing that can be replayed on any photo. The crop is a *fraction* of the
 * rotated image rather than a pixel rect, which is what makes "put this same
 * framing on the other 39 shots" mean something when they are not all the same
 * size. Unlike `EditorSnapshot` — which is tied to the on-screen canvas and
 * only good for undo — this survives switching to a different image.
 */
export interface ItemFrame {
  rel: { x: number; y: number; width: number; height: number };
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  aspect: AspectRatioPreset;
  /** The pinned export size, as typed. Empty means "whatever the crop is". */
  outWidth: string;
  outHeight: string;
  sizePresetId: string | null;
}

/** `cover` cuts to fill the frame; `contain` letterboxes and pads instead. */
export type FitMode = 'cover' | 'contain';

export type GridMode = 'thirds' | 'golden' | 'none';

export interface ExportSettings {
  format: OutputFormat;
  quality: number;
  background: string;
  fit: FitMode;
  dpi: number;
  /** Cap in kilobytes; 0 disables the search. */
  targetKb: number;
}
