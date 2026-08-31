// ============================================================================
// FrameSnap — shared types.
// ----------------------------------------------------------------------------
// The old tool had one idea of a "frame": a timestamp the user had seeked to,
// multiplied by an fps number the user had typed. Nothing here trusts either.
// A frame is what `requestVideoFrameCallback` says was actually presented.
// ============================================================================

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

/** What the video itself told us, as opposed to what anyone assumed. */
export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  /** Measured from presented frames. Null until enough samples arrive. */
  fps: number | null;
  /** How the fps was arrived at, so the UI never claims more than it knows. */
  fpsSource: 'measured' | 'manual' | 'unknown';
  /** True when the browser exposes requestVideoFrameCallback. */
  exact: boolean;
}

export interface CapturedFrame {
  id: string;
  /** Object URL of the full-size blob. Revoked when the frame is dropped. */
  url: string;
  blob: Blob;
  /** Small data URL kept for the strip, so the gallery is not 50 full images. */
  thumb: string;
  /** Presentation time in seconds, as reported by the video. */
  time: number;
  /** Index derived from the measured fps; -1 when the fps is unknown. */
  index: number;
  width: number;
  height: number;
  bytes: number;
  ext: string;
  /** Set when the frame came out of a batch run or scene detection. */
  origin: 'manual' | 'batch' | 'scene';
  /** Scene-change score, for frames proposed by the detector. */
  score?: number;
}

// ---------------------------------------------------------------------------
// Capture settings
// ---------------------------------------------------------------------------

export interface CaptureOptions {
  format: ImageFormat;
  /** 1..100, ignored for PNG. */
  quality: number;
  /** 1 = native resolution; 0.5 = half width and height. */
  scale: number;
}

export const DEFAULT_CAPTURE: CaptureOptions = {
  format: 'image/png',
  quality: 92,
  scale: 1,
};

// ---------------------------------------------------------------------------
// Batch extraction
// ---------------------------------------------------------------------------

export type BatchMode = 'interval' | 'count' | 'every-frame';

export interface BatchOptions {
  mode: BatchMode;
  /** Seconds between captures, for `interval`. */
  interval: number;
  /** How many evenly spaced frames, for `count`. */
  count: number;
  /** Range in seconds. `to` of 0 means "to the end". */
  from: number;
  to: number;
}

export const DEFAULT_BATCH: BatchOptions = {
  mode: 'interval',
  interval: 1,
  count: 12,
  from: 0,
  to: 0,
};

export interface BatchProgress {
  done: number;
  total: number;
  /** Seconds of video position currently being grabbed. */
  at: number;
  running: boolean;
}

// ---------------------------------------------------------------------------
// Scene detection
// ---------------------------------------------------------------------------

export interface SceneCandidate {
  time: number;
  /** 0..1 mean absolute difference against the previous sample. */
  score: number;
}

export interface SceneOptions {
  /** Seconds between samples while scanning. Smaller is slower and finer. */
  step: number;
  /** 0..1. A sample above this counts as a cut. */
  threshold: number;
}

export const DEFAULT_SCENES: SceneOptions = {
  step: 0.5,
  threshold: 0.18,
};

export interface SceneScan {
  candidates: SceneCandidate[];
  /** Every sample, for the little difference graph. */
  samples: SceneCandidate[];
  ms: number;
}
