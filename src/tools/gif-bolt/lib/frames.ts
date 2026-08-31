// ============================================================================
// Getting pixels in
// ----------------------------------------------------------------------------
// Video decoding, still decoding, and the one canvas everything is rasterised
// through on its way to the encoder.
// ============================================================================

import type { FitMode, Frame } from '../types';

// ---------------------------------------------------------------------------
// Accepted input
// ---------------------------------------------------------------------------

/**
 * `video/*` first so a container the browser knows but we did not list (a .3gp,
 * an .m2ts) is still offered, with the extensions after it for the formats
 * Windows and macOS report with an empty MIME type.
 */
export const ACCEPTED_VIDEO = 'video/*,.mp4,.m4v,.webm,.mov,.ogv,.mkv,.avi';

/** Everything a browser decodes, plus the Apple formats converted on the way in. */
export const ACCEPTED_IMAGE =
  'image/png,image/jpeg,image/webp,image/avif,image/gif,image/bmp,image/svg+xml,.heic,.heif';

export function isHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || /\.(mp4|m4v|webm|mov|ogv|mkv|avi|3gp)$/i.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || isHeic(file);
}

// ---------------------------------------------------------------------------
// Stills
// ---------------------------------------------------------------------------

/** Decodes one still, converting the iPhone formats Safari alone can read. */
export async function decodeImageFile(file: File): Promise<ImageBitmap> {
  let usable: Blob = file;
  if (isHeic(file)) {
    const heic2any = (await import('heic2any')).default;
    usable = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 })) as Blob;
  }
  return createImageBitmap(usable);
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export interface VideoHandle {
  video: HTMLVideoElement;
  url: string;
  duration: number;
  width: number;
  height: number;
  release: () => void;
}

/**
 * Loads a video far enough to read its real dimensions and to seek in it.
 *
 * Waiting for `loadeddata` rather than `loadedmetadata` is the difference
 * between a first seek that fires and one that never resolves: with metadata
 * alone there is no decoded frame to seek relative to.
 */
export function openVideo(file: File): Promise<VideoHandle> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const timeout = window.setTimeout(() => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error('unsupported'));
    }, 30_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('error', onError);
    };

    const onReady = () => {
      cleanup();
      if (!video.videoWidth || !video.videoHeight || !isFinite(video.duration)) {
        URL.revokeObjectURL(url);
        reject(new Error('unsupported'));
        return;
      }
      resolve({
        video,
        url,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        release: () => {
          video.pause();
          video.removeAttribute('src');
          video.load();
          URL.revokeObjectURL(url);
        },
      });
    };

    const onError = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(new Error('unsupported'));
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('error', onError);
    video.src = url;
  });
}

/**
 * Seeks and waits for the frame to actually be presented.
 *
 * The timeout is the whole point: a container the browser half-supports will
 * accept `currentTime =` and then never fire `seeked`, and the old version of
 * this tool hung there forever with a spinner and no way out.
 */
function seekTo(video: HTMLVideoElement, time: number, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (Math.abs(video.currentTime - time) < 1e-3 && video.readyState >= 2) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('seek-timeout'));
    }, timeoutMs);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('seek-failed'));
    };

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = time;
  });
}

export interface ExtractOptions {
  start: number;
  end: number;
  fps: number;
  /** Working resolution. Never upscaled past the source. */
  width: number;
  height: number;
  /** Source-pixel crop applied before the resize, or null for the whole frame. */
  crop: { x: number; y: number; width: number; height: number } | null;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Pulls frames out of a video by seeking to each timestamp.
 *
 * `createImageBitmap` does the downscale rather than `drawImage`, because its
 * `resizeQuality: 'high'` runs a real filter instead of the browser's default
 * bilinear step — on a 1080p clip going to 480px that is the difference between
 * legible text and mush, and it costs nothing.
 */
export async function extractVideoFrames(video: HTMLVideoElement, options: ExtractOptions): Promise<Frame[]> {
  const { start, end, fps, width, height, crop } = options;
  const span = Math.max(0, end - start);
  const total = Math.max(1, Math.round(span * fps));
  const step = span / total;

  const frames: Frame[] = [];

  try {
    for (let i = 0; i < total; i++) {
      if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      // Half a step in: sampling exactly on the boundary lands on the frame
      // that is about to be replaced and duplicates it at low frame rates.
      const time = Math.min(end - 1e-3, start + i * step + step / 2);
      await seekTo(video, time);

      const bitmap = crop
        ? await createImageBitmap(video, crop.x, crop.y, crop.width, crop.height, {
            resizeWidth: width,
            resizeHeight: height,
            resizeQuality: 'high',
          })
        : await createImageBitmap(video, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' });

      frames.push({
        id: `f${i}-${Math.random().toString(36).slice(2, 8)}`,
        bitmap,
        time,
        delayMs: null,
        label: formatTimecode(time),
      });

      options.onProgress?.(i + 1, total);
    }
  } catch (error) {
    for (const frame of frames) frame.bitmap.close();
    throw error;
  }

  return frames;
}

/** One frame at the video's current position, for the manual capture path. */
export async function captureCurrentFrame(
  video: HTMLVideoElement,
  width: number,
  height: number,
  crop: { x: number; y: number; width: number; height: number } | null
): Promise<Frame> {
  const bitmap = crop
    ? await createImageBitmap(video, crop.x, crop.y, crop.width, crop.height, {
        resizeWidth: width,
        resizeHeight: height,
        resizeQuality: 'high',
      })
    : await createImageBitmap(video, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' });

  return {
    id: `c${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bitmap,
    time: video.currentTime,
    delayMs: null,
    label: formatTimecode(video.currentTime),
  };
}

// ---------------------------------------------------------------------------
// Rasterising
// ---------------------------------------------------------------------------

let scratch: HTMLCanvasElement | null = null;
let scratchContext: CanvasRenderingContext2D | null = null;

function getScratch(width: number, height: number): CanvasRenderingContext2D {
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width;
    scratch.height = height;
    scratchContext = null;
  }
  if (!scratchContext) {
    scratchContext = scratch.getContext('2d', { willReadFrequently: true });
  }
  if (!scratchContext) throw new Error('This browser refused to give us a 2D canvas.');
  return scratchContext;
}

/** Where a bitmap lands inside the output box under a given fit mode. */
export function fitRect(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
  fit: FitMode
): { x: number; y: number; width: number; height: number } {
  if (fit === 'stretch') return { x: 0, y: 0, width: boxWidth, height: boxHeight };
  const scale =
    fit === 'cover'
      ? Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight)
      : Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return { x: (boxWidth - width) / 2, y: (boxHeight - height) / 2, width, height };
}

export interface RasterOptions {
  width: number;
  height: number;
  fit: FitMode;
  /** CSS colour behind the frame, or null to leave the gaps transparent. */
  background: string | null;
}

export function drawFrame(context: CanvasRenderingContext2D, bitmap: ImageBitmap, options: RasterOptions): void {
  const { width, height, fit, background } = options;
  context.clearRect(0, 0, width, height);
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  const rect = fitRect(bitmap.width, bitmap.height, width, height, fit);
  context.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height);
}

/** RGBA for the encoder. The buffer is fresh each call, so it can be transferred. */
export function frameToRgba(bitmap: ImageBitmap, options: RasterOptions): Uint8Array {
  const context = getScratch(options.width, options.height);
  drawFrame(context, bitmap, options);
  const data = context.getImageData(0, 0, options.width, options.height).data;
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function formatTimecode(seconds: number): string {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  const centis = Math.round((seconds - whole) * 100);
  return `${minutes}:${String(rest).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 2 ? 1 : 0)} ${units[i]}`;
}

/**
 * Frame rates GIF can actually hit. Delays are stored in hundredths of a
 * second, so anything that is not 100/n drifts — and browsers clamp anything
 * under 2 cs up to 10, which is why the list stops at 50.
 */
export const GIF_FPS_STEPS = [2, 4, 5, 6.25, 8, 10, 12.5, 16.67, 20, 25, 33.33, 50] as const;

export function snapFps(fps: number): number {
  return GIF_FPS_STEPS.reduce((best, step) => (Math.abs(step - fps) < Math.abs(best - fps) ? step : best), GIF_FPS_STEPS[0]);
}
