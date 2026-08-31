// ============================================================================
// CompressSnap types
// ----------------------------------------------------------------------------
// The settings object grew two things the old one could not express: a byte
// budget ("get this under 200 KB", which needs a search rather than a single
// encode) and a colour count for PNG, which is the only knob that actually
// makes a PNG smaller without resizing it.
// ============================================================================

export type OutputFormat = 'original' | 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export type ResizeMode = 'none' | 'scale' | 'dimensions' | 'longEdge';

export interface CompressSettings {
  /** 1-100. Ignored by PNG, which has no lossy quality knob at all. */
  quality: number;
  format: OutputFormat;
  /** Percentage of the original, for `resizeMode: 'scale'`. */
  scale: number;
  resizeMode: ResizeMode;
  width: number;
  height: number;
  /** Cap for the longest side, the way every CMS states its limit. */
  longEdge: number;
  maintainAspectRatio: boolean;
  /**
   * Byte budget. When set, quality is searched for rather than used: the
   * encoder bisects until it lands under the budget.
   */
  targetBytes: number | null;
  /**
   * PNG palette size, 2-256, or 0 for full colour. This is what makes a PNG
   * smaller; the quality slider does nothing to one.
   */
  pngColors: number;
  /** Floyd-Steinberg on the quantised output. Costs a little size, hides banding. */
  dither: boolean;
  /** Measure SSIM against the original. Costs one extra decode. */
  measureQuality: boolean;
}

export const DEFAULT_SETTINGS: CompressSettings = {
  quality: 80,
  format: 'original',
  scale: 100,
  resizeMode: 'none',
  width: 1920,
  height: 1080,
  longEdge: 1920,
  maintainAspectRatio: true,
  targetBytes: null,
  pngColors: 0,
  dither: true,
  measureQuality: true,
};

export type ItemStatus = 'queued' | 'decoding' | 'working' | 'done' | 'error' | 'skipped';

export interface CompressResult {
  blob: Blob;
  url: string;
  bytes: number;
  width: number;
  height: number;
  /** The mime actually written, which may differ from the request. */
  mime: string;
  /** The quality the search settled on, when a byte budget was set. */
  quality: number;
  /** 0-1 structural similarity against the source, or null when not measured. */
  ssim: number | null;
  /** Encode wall time in milliseconds. */
  ms: number;
  /** How many encodes the byte-budget search needed. */
  attempts: number;
}

export interface CompressItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalUrl: string;
  /** Natural size, known only after the decode. */
  width: number | null;
  height: number | null;
  /** Mime we decoded it as, after any HEIC/TIFF conversion. */
  sourceMime: string;
  status: ItemStatus;
  result: CompressResult | null;
  error: string | null;
  /** Per-item override; falls back to the global settings when absent. */
  settings: CompressSettings | null;
  /** The settings the current result was produced with. */
  appliedSettings: CompressSettings | null;
  /** Slug of the tool that handed this file over, when it came from one. */
  from: string;
}

export interface EncodeRequest {
  bitmap: ImageBitmap;
  settings: CompressSettings;
  sourceMime: string;
  originalBytes: number;
}

export interface EncodeResponse {
  blob: Blob;
  width: number;
  height: number;
  mime: string;
  quality: number;
  ssim: number | null;
  ms: number;
  attempts: number;
}
