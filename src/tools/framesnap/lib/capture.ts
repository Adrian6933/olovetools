// ============================================================================
// Drawing and encoding a frame.
// ----------------------------------------------------------------------------
// Two things the old version did not do: it never waited for the seek before
// drawing, and it kept every capture as a full-resolution blob with a full
// resolution <img> in the gallery. A dozen 4K PNGs is half a gigabyte of live
// objects, so a small thumbnail is generated once and the strip shows that.
// ============================================================================

import type { CaptureOptions, CapturedFrame } from '../types';
import { frameIndexAt } from './video';

const THUMB_WIDTH = 192;

let counter = 0;
const nextId = () => `f${(counter += 1)}-${Date.now().toString(36)}`;

export function extensionOf(format: CaptureOptions['format']): string {
  return format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
}

function encode(canvas: HTMLCanvasElement, options: CaptureOptions): Promise<Blob | null> {
  return new Promise(resolve => {
    canvas.toBlob(
      blob => resolve(blob),
      options.format,
      options.format === 'image/png' ? undefined : options.quality / 100
    );
  });
}

/** Draws the video as it is right now. The caller is responsible for seeking. */
export async function grabFrame(
  video: HTMLVideoElement,
  options: CaptureOptions,
  fps: number | null,
  origin: CapturedFrame['origin'],
  score?: number
): Promise<CapturedFrame | null> {
  if (!video.videoWidth) return null;

  const width = Math.max(1, Math.round(video.videoWidth * options.scale));
  const height = Math.max(1, Math.round(video.videoHeight * options.scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0, width, height);

  const blob = await encode(canvas, options);
  if (!blob) return null;

  // The thumbnail is a data URL on purpose: an object URL per thumbnail is one
  // more thing to revoke, and at 192px wide the string is a few KB.
  const thumbCanvas = document.createElement('canvas');
  const ratio = THUMB_WIDTH / width;
  thumbCanvas.width = Math.min(width, THUMB_WIDTH);
  thumbCanvas.height = Math.max(1, Math.round(height * Math.min(1, ratio)));
  thumbCanvas.getContext('2d')?.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

  const time = video.currentTime;
  return {
    id: nextId(),
    url: URL.createObjectURL(blob),
    blob,
    thumb: thumbCanvas.toDataURL('image/jpeg', 0.72),
    time,
    index: frameIndexAt(time, fps),
    width,
    height,
    bytes: blob.size,
    ext: extensionOf(options.format),
    origin,
    score,
  };
}

/** `clip_f00123_00-04-11.png` — sortable, and it says where it came from. */
export function frameFilename(base: string, frame: CapturedFrame, fps: number | null): string {
  const stamp =
    frame.index >= 0 && fps
      ? `f${String(frame.index).padStart(5, '0')}`
      : `t${frame.time.toFixed(3).replace('.', '_')}`;
  return `${base}_${stamp}.${frame.ext}`;
}

export function totalBytes(frames: CapturedFrame[]): number {
  return frames.reduce((sum, frame) => sum + frame.bytes, 0);
}

export function releaseFrames(frames: CapturedFrame[]) {
  for (const frame of frames) URL.revokeObjectURL(frame.url);
}
