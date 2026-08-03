export type RecordMode = 'screen' | 'camera' | 'both';

export type AudioSource = 'none' | 'mic' | 'system' | 'both';

export type ResolutionMode = 'native' | '1440p' | '1080p' | '720p';

export type FpsMode = 60 | 30 | 24 | 15;

/** Drives the encoder bitrate. Nothing else in the pipeline changes. */
export type QualityMode = 'eco' | 'balanced' | 'high' | 'max';

export type ContainerMode = 'mp4' | 'webm';

/** Which surface the user picked in the browser's share dialog. */
export type SurfaceKind = 'monitor' | 'window' | 'browser' | 'unknown';

export type RecordingStatus =
  | 'idle'
  | 'arming'
  | 'armed'
  | 'countdown'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'done'
  | 'error';

export type OverlayShape = 'circle' | 'rounded';

/**
 * Webcam bubble placement, in canvas-relative units so it survives a
 * resolution change. Read fresh on every composited frame, which is what makes
 * it editable while the recording is running.
 */
export interface OverlayState {
  /** 0 = flush left, 1 = flush right. */
  x: number;
  /** 0 = flush top, 1 = flush bottom. */
  y: number;
  /** Fraction of the shorter canvas side. */
  size: number;
  shape: OverlayShape;
  mirror: boolean;
  ring: boolean;
}

export interface RecordingResult {
  url: string;
  blob: Blob;
  mime: string;
  ext: string;
  bytes: number;
  /** Seconds of wall-clock recording, pauses excluded. */
  duration: number;
  width: number;
  height: number;
}

export interface DeviceOption {
  deviceId: string;
  label: string;
}
