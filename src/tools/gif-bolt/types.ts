export type SourceKind = 'video' | 'images';

/** How a frame is fitted into the output box when the shapes disagree. */
export type FitMode = 'cover' | 'contain' | 'stretch';

/**
 * One frame of the animation, held as an ImageBitmap at the working resolution
 * picked before extraction. The bitmap is the intermediate the whole editor
 * works on: reordering, deleting and retiming never touch pixels, and the
 * encoder rasterises from here at export time.
 */
export interface Frame {
  id: string;
  bitmap: ImageBitmap;
  /** Source timestamp in seconds for video frames, 0 for stills. */
  time: number;
  /** Per-frame delay in ms, or null to follow the global frame rate. */
  delayMs: number | null;
  /** Shown in the filmstrip: a timecode or a file name. */
  label: string;
}

/** A snapshot small enough to keep dozens of, because it holds no pixels. */
export interface EditSnapshot {
  order: string[];
  delays: Record<string, number | null>;
  label: string;
}

export interface ResultMeta {
  url: string;
  blob: Blob;
  bytes: number;
  width: number;
  height: number;
  frames: number;
  colors: number;
  /** Share of pixels inherited from the previous frame, 0–1. */
  reuse: number;
  ms: number;
  fps: number;
}

export interface HistoryEntry {
  id: string;
  url: string;
  blob: Blob;
  name: string;
  bytes: number;
  frames: number;
  createdAt: number;
}
