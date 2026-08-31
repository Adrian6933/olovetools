// ============================================================================
// Encode orchestration
// ----------------------------------------------------------------------------
// Splits the animation across a pool of workers, merges their colour
// histograms into one global palette, then lets them compress their own frames
// in parallel before stitching the container together here.
//
// Two passes over the frames instead of one, but the first pass is only a
// histogram — and a global palette is the difference between an animation whose
// colours stay put and one that shimmers.
// ============================================================================

import {
  assembleGif,
  buildPalette,
  createHistogram,
  encodeChunk,
  mergeHistograms,
  type ChunkFrame,
  type EncodedFrame,
  type Histogram,
  type Palette,
} from './gif';

export interface GifEncodeOptions {
  width: number;
  height: number;
  /** Palette size, 2–256. One slot is taken back when transparency is needed. */
  colors: number;
  dither: boolean;
  /** 0–1: how much quantisation error is diffused onward. */
  ditherStrength: number;
  /** Inherit unchanged pixels from the previous frame. */
  diff: boolean;
  /** Per-channel slack for "unchanged", 0–32. */
  tolerance: number;
  /** Carry 1-bit transparency over from the source alpha channel. */
  keepAlpha: boolean;
  /** 0 = loop forever, otherwise the number of extra passes. */
  loop: number;
}

export interface GifStats {
  bytes: number;
  frames: number;
  /** Colours actually in the written table. */
  colors: number;
  /** Share of pixels inherited instead of re-encoded, 0–1. */
  reuse: number;
  ms: number;
  width: number;
  height: number;
  /** True frame rate after GIF's centisecond timing rounds the delays. */
  fps: number;
}

export interface GifResult {
  blob: Blob;
  stats: GifStats;
}

export interface SourceFrameData {
  /** RGBA, `width * height * 4`. Transferred to a worker and detached here. */
  rgba: Uint8Array;
  /** Delay in hundredths of a second. */
  delayCs: number;
}

export type EncodePhase = 'palette' | 'encode';

interface EncodeHooks {
  onProgress?: (ratio: number, phase: EncodePhase) => void;
  signal?: AbortSignal;
}

/** Pixels the palette pass looks at. More than this buys nothing measurable. */
const PALETTE_SAMPLE_TARGET = 400_000;

function poolSize(frameCount: number): number {
  if (frameCount < 8) return 1;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  return Math.max(1, Math.min(4, cores - 1, Math.floor(frameCount / 4)));
}

class WorkerChunk {
  readonly worker: Worker;
  constructor() {
    this.worker = new Worker(new URL('./encode.worker.ts', import.meta.url), { type: 'module' });
  }

  request<T>(message: unknown, transfer: Transferable[], resolveOn: string, onProgress?: () => void): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const onMessage = (event: MessageEvent<any>) => {
        if (event.data?.type === 'progress') {
          onProgress?.();
          return;
        }
        if (event.data?.type === resolveOn) {
          this.worker.removeEventListener('message', onMessage);
          this.worker.removeEventListener('error', onError);
          resolve(event.data as T);
        }
      };
      const onError = (event: ErrorEvent) => {
        this.worker.removeEventListener('message', onMessage);
        this.worker.removeEventListener('error', onError);
        reject(new Error(event.message || 'The encoder worker failed.'));
      };
      this.worker.addEventListener('message', onMessage);
      this.worker.addEventListener('error', onError);
      this.worker.postMessage(message, transfer);
    });
  }

  terminate(): void {
    this.worker.terminate();
  }
}

export async function encodeGif(
  frames: SourceFrameData[],
  options: GifEncodeOptions,
  hooks: EncodeHooks = {}
): Promise<GifResult> {
  if (!frames.length) throw new Error('There are no frames to encode.');

  const started = performance.now();
  const { width, height } = options;
  const pixelsPerFrame = width * height;
  const alphaThreshold = options.keepAlpha ? 128 : 0;

  // Alpha holes and inherited pixels both want the transparent index, but they
  // want opposite disposal methods, so only one of them can be on at a time.
  const diff = options.diff && !options.keepAlpha;
  const needsTransparent = diff || options.keepAlpha;

  const sampleStride = Math.max(1, Math.floor((pixelsPerFrame * frames.length) / PALETTE_SAMPLE_TARGET));

  const count = poolSize(frames.length);
  const perChunk = Math.ceil(frames.length / count);
  const ranges: { start: number; end: number }[] = [];
  for (let start = 0; start < frames.length; start += perChunk) {
    ranges.push({ start, end: Math.min(frames.length, start + perChunk) });
  }

  // Copied before the chunks are transferred away: chunk N's lead frame is the
  // last frame of chunk N-1, which is about to stop existing on this thread.
  const leads = ranges.map(range => (range.start === 0 ? null : new Uint8Array(frames[range.start - 1].rgba)));

  let done = 0;
  const total = frames.length;
  const tick = () => {
    done++;
    hooks.onProgress?.(done / total, 'encode');
  };

  const chunks: WorkerChunk[] = [];
  const abort = () => {
    for (const chunk of chunks) chunk.terminate();
  };
  hooks.signal?.addEventListener('abort', abort, { once: true });

  let histogram: Histogram;
  let palette: Palette;
  let encoded: ChunkFrame[];

  try {
    for (let i = 0; i < ranges.length; i++) chunks.push(new WorkerChunk());

    hooks.onProgress?.(0, 'palette');

    // --- Pass 1: histograms -------------------------------------------------
    const histograms = await Promise.all(
      ranges.map((range, i) => {
        const slice = frames.slice(range.start, range.end).map(frame => frame.rgba);
        const lead = leads[i];
        return chunks[i].request<{ counts: Uint32Array; sums: Float64Array; transparent: number }>(
          {
            cmd: 'load',
            frames: slice.map(frame => frame.buffer),
            lead: lead ? lead.buffer : null,
            width,
            height,
            alphaThreshold,
            sampleStride,
          },
          [...slice.map(frame => frame.buffer as ArrayBuffer), ...(lead ? [lead.buffer as ArrayBuffer] : [])],
          'histogram'
        );
      })
    );

    if (hooks.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    histogram = createHistogram();
    for (const partial of histograms) {
      mergeHistograms(histogram, {
        counts: partial.counts,
        sums: partial.sums,
        transparent: partial.transparent,
      });
    }

    const budget = Math.max(2, Math.min(needsTransparent ? 255 : 256, options.colors));
    palette = buildPalette(histogram, budget);
    const transparentIndex = needsTransparent ? palette.count : -1;

    hooks.onProgress?.(0, 'encode');

    // --- Pass 2: quantise + compress ---------------------------------------
    const parts = await Promise.all(
      ranges.map((_, i) =>
        chunks[i].request<{ frames: ChunkFrame[] }>(
          {
            cmd: 'encode',
            palette: { rgb: palette.rgb, count: palette.count },
            transparentIndex,
            diff,
            dither: options.dither,
            ditherStrength: options.ditherStrength,
            tolerance: options.tolerance,
            alphaThreshold,
          },
          [],
          'encoded',
          tick
        )
      )
    );

    encoded = parts.flatMap(part => part.frames);
  } catch (error) {
    if (hooks.signal?.aborted) {
      abort();
      throw error;
    }
    // Module workers are blocked outright in a few hardened setups. Falling
    // back keeps the tool working, just on one thread — but only if the failure
    // happened before any frame was transferred away, since a detached buffer
    // reads as zero-length and there is nothing left to encode.
    abort();
    const usable = frames.filter(frame => frame.rgba.byteLength > 0);
    if (usable.length !== frames.length) throw error;

    histogram = createHistogram();
    const { addFrameToHistogram } = await import('./gif');
    for (const frame of usable) addFrameToHistogram(histogram, frame.rgba, sampleStride, alphaThreshold);

    const budget = Math.max(2, Math.min(needsTransparent ? 255 : 256, options.colors));
    palette = buildPalette(histogram, budget);

    encoded = encodeChunk(
      usable.map(frame => frame.rgba),
      null,
      palette,
      {
        width,
        height,
        diff,
        dither: options.dither,
        ditherStrength: options.ditherStrength,
        tolerance: options.tolerance,
        alphaThreshold,
        transparentIndex: needsTransparent ? palette.count : -1,
      },
      tick
    );
  } finally {
    hooks.signal?.removeEventListener('abort', abort);
    for (const chunk of chunks) chunk.terminate();
  }

  const transparentIndex = needsTransparent ? palette.count : -1;
  const disposal: 1 | 2 = options.keepAlpha ? 2 : 1;

  const container: EncodedFrame[] = encoded.map((frame, i) => ({
    x: frame.x,
    y: frame.y,
    w: frame.w,
    h: frame.h,
    delayCs: frames[i].delayCs,
    transparentIndex: frame.usesTransparency ? transparentIndex : -1,
    disposal,
    data: frame.data,
  }));

  const bytes = assembleGif(width, height, palette, container, options.loop, transparentIndex);

  const reusedPixels = encoded.reduce((sum, frame) => sum + frame.reused, 0);
  const totalDelayCs = frames.reduce((sum, frame) => sum + frame.delayCs, 0);

  return {
    blob: new Blob([bytes as unknown as BlobPart], { type: 'image/gif' }),
    stats: {
      bytes: bytes.byteLength,
      frames: frames.length,
      colors: palette.count + (needsTransparent ? 1 : 0),
      reuse: reusedPixels / (pixelsPerFrame * frames.length),
      ms: Math.round(performance.now() - started),
      width,
      height,
      fps: totalDelayCs ? Math.round((frames.length / (totalDelayCs / 100)) * 10) / 10 : 0,
    },
  };
}
