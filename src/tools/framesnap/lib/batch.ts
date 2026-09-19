// ============================================================================
// Batch extraction and scene detection.
// ----------------------------------------------------------------------------
// Both walk the video the same way — seek, wait for the frame to be presented,
// then look at it — which is only correct because `seekExact` exists. The old
// tool could not have done either: without awaiting the seek, a loop of
// `currentTime = t` would have grabbed whatever frame happened to be on screen.
//
// Both are cancellable, and neither starts on its own.
// ============================================================================

import type {
  BatchOptions,
  BatchProgress,
  CaptureOptions,
  CapturedFrame,
  SceneCandidate,
  SceneOptions,
  SceneScan,
} from '../types';
import { grabFrame } from './capture';
import { seekExact } from './video';

/** The list of timestamps a batch run will visit. */
export function batchTimes(options: BatchOptions, duration: number, fps: number | null): number[] {
  const from = Math.max(0, Math.min(options.from, duration));
  const to = options.to > 0 ? Math.min(options.to, duration) : duration;
  if (to <= from) return [];

  const times: number[] = [];
  if (options.mode === 'count') {
    const count = Math.max(1, Math.min(500, Math.round(options.count)));
    if (count === 1) return [from];
    const span = to - from;
    for (let i = 0; i < count; i += 1) times.push(from + (span * i) / (count - 1));
    return times;
  }

  const stride =
    options.mode === 'every-frame' ? 1 / (fps || 30) : Math.max(0.02, options.interval);
  // A hard ceiling: "every frame" on a 10-minute clip is 18 000 PNGs, which is
  // not a feature, it is a way to lose the tab.
  const limit = 500;
  for (let t = from; t <= to + 1e-6 && times.length < limit; t += stride) times.push(t);
  return times;
}

export interface BatchRun {
  frames: CapturedFrame[];
  cancelled: boolean;
}

export async function runBatch(
  video: HTMLVideoElement,
  times: number[],
  capture: CaptureOptions,
  fps: number | null,
  onProgress: (progress: BatchProgress) => void,
  shouldStop: () => boolean
): Promise<BatchRun> {
  const frames: CapturedFrame[] = [];
  const wasPaused = video.paused;
  video.pause();

  for (let i = 0; i < times.length; i += 1) {
    if (shouldStop()) {
      onProgress({ done: i, total: times.length, at: times[i], running: false });
      return { frames, cancelled: true };
    }
    onProgress({ done: i, total: times.length, at: times[i], running: true });
    await seekExact(video, times[i]);
    const frame = await grabFrame(video, capture, fps, 'batch');
    if (frame) frames.push(frame);
  }

  onProgress({ done: times.length, total: times.length, at: video.currentTime, running: false });
  if (!wasPaused) void video.play();
  return { frames, cancelled: false };
}

// ---------------------------------------------------------------------------
// Scene detection
// ---------------------------------------------------------------------------

const SAMPLE_WIDTH = 64;

/**
 * Mean absolute luma difference between consecutive samples, on a 64px-wide
 * downscale. Crude on purpose: it is fast enough to scan a whole clip without
 * a worker, and the number it produces is shown to the user rather than hidden
 * behind a "smart" label, so the threshold can be argued with.
 */
export async function scanScenes(
  video: HTMLVideoElement,
  options: SceneOptions,
  onProgress: (done: number, total: number) => void,
  shouldStop: () => boolean
): Promise<SceneScan> {
  const started = performance.now();
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const step = Math.max(0.05, options.step);
  const total = Math.max(1, Math.floor(duration / step));

  const height = Math.max(1, Math.round((SAMPLE_WIDTH * video.videoHeight) / (video.videoWidth || 1)));
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { candidates: [], samples: [], ms: 0 };

  const wasPaused = video.paused;
  video.pause();

  const samples: SceneCandidate[] = [];
  const candidates: SceneCandidate[] = [];
  let previous: Uint8ClampedArray | null = null;
  let index = 0;

  for (let t = 0; t < duration && index < total + 2; t += step, index += 1) {
    if (shouldStop()) break;
    onProgress(index, total);
    await seekExact(video, t);
    context.drawImage(video, 0, 0, SAMPLE_WIDTH, height);
    const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, height);

    if (previous) {
      let sum = 0;
      for (let p = 0; p < data.length; p += 4) {
        // Rec. 601 luma, integer-ish: the exact coefficients do not matter for
        // a difference score, but a luma comparison beats comparing channels.
        const a = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
        const b = (previous[p] * 299 + previous[p + 1] * 587 + previous[p + 2] * 114) / 1000;
        sum += Math.abs(a - b);
      }
      const score = sum / (data.length / 4) / 255;
      samples.push({ time: t, score });
      if (score >= options.threshold) candidates.push({ time: t, score });
    }
    previous = data;
  }

  if (!wasPaused) void video.play();
  return { candidates, samples, ms: Math.round(performance.now() - started) };
}
