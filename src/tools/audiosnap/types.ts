// ============================================================================
// AudioSnap — shared types
// ============================================================================

/** How the render should lay out channels, independently of the source. */
export type ChannelMode = 'source' | 'mono' | 'stereo';

/** Container/codec picked for the export. */
export type ExportFormat = 'wav16' | 'wav24' | 'wav32' | 'compressed';

/**
 * The whole edit, as plain numbers.
 *
 * Nothing here touches samples: the decoded `AudioBuffer` is never mutated, so
 * undo/redo only has to remember this object (a few dozen bytes) instead of a
 * copy of the audio. That is what makes the history cheap enough to keep 100
 * steps around.
 */
export interface EditState {
  /** Selection start, in seconds of the source buffer. */
  inSec: number;
  /** Selection end, in seconds of the source buffer. */
  outSec: number;
  /** Manual trim, in dB. Applied before the normaliser. */
  gainDb: number;
  /** Lift the loudest peak of the selection to `normalizeTargetDb`. */
  normalize: boolean;
  /** Ceiling for the normaliser, in dBFS (0 = full scale). */
  normalizeTargetDb: number;
  fadeInSec: number;
  fadeOutSec: number;
  /** Playback rate of the render. 1 = untouched. */
  speed: number;
  channelMode: ChannelMode;
  /** Render sample rate in Hz. 0 means "keep the source rate". */
  sampleRate: number;
  /** Removes DC offset before anything else. */
  removeDc: boolean;
}

/** Microphone constraints the user actually gets to choose. */
export interface CaptureSettings {
  deviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  /** 1 = mono, 2 = stereo (a hint; the browser may ignore it). */
  channelCount: number;
  /** `audioBitsPerSecond` handed to MediaRecorder. */
  bitrate: number;
}

/**
 * Min/max envelope of the whole file, bucketed at a fixed resolution.
 *
 * Drawing straight from `getChannelData()` on every repaint means walking
 * millions of samples per frame while dragging; walking this instead keeps a
 * zoom/pan interaction at a constant few thousand reads no matter how long the
 * recording is. One bucket per 256 samples costs ~900 KB for ten minutes.
 */
export interface PeakMip {
  min: Float32Array;
  max: Float32Array;
  /** Per-bucket RMS, used for the quieter inner band of the waveform. */
  rms: Float32Array;
  samplesPerBucket: number;
  buckets: number;
  sampleRate: number;
  duration: number;
}

/** What a decoded source knows about itself. */
export interface SourceInfo {
  name: string;
  /** 'mic' when it came from the recorder, otherwise the file's MIME type. */
  origin: string;
  sizeBytes: number;
  sampleRate: number;
  channels: number;
  duration: number;
  /** True when the decoder had to resample (the file's rate could not be kept). */
  resampled: boolean;
}

/** Loudness figures for a range, shown before and after processing. */
export interface LevelStats {
  /** Highest absolute sample, in dBFS. */
  peakDb: number;
  /** Root-mean-square of the range, in dBFS. */
  rmsDb: number;
  /** True when at least one sample sits at digital full scale. */
  clipping: boolean;
}

/** A finished export, kept for the session list. */
export interface ExportItem {
  id: string;
  name: string;
  url: string;
  blob: Blob;
  sizeBytes: number;
  durationSec: number;
  format: string;
  at: number;
}
