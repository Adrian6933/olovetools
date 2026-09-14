// ============================================================================
// Export pipeline.
//
// The SVG renderer is what you watch; the *canvas* renderer is what you export
// with. lottie-web ships both in the same bundle, so rasterising costs nothing
// extra to download: we spin up a second, off-screen canvas animation, step it
// frame by frame with `goToAndStop`, and read the pixels back.
//
// Every step is synchronous per frame, so it works in a background tab too —
// nothing here depends on requestAnimationFrame firing.
// ============================================================================

import JSZip from 'jszip';
import type { LottieJson } from '../types';

export interface RasterOptions {
  /** Output width in pixels. Height follows the document's aspect ratio. */
  width: number;
  /** Frames to render, inclusive. */
  from: number;
  to: number;
  /** Transparent when null. */
  background: string | null;
}

type LottieModule = any;

interface OffscreenAnim {
  anim: any;
  canvas: HTMLCanvasElement;
  host: HTMLDivElement;
  destroy: () => void;
}

/**
 * Builds an off-screen canvas animation sized to `width`.
 *
 * The host div is attached to the document (lottie measures its container) but
 * kept out of the flow and out of the accessibility tree.
 */
function createOffscreen(
  lottie: LottieModule,
  json: LottieJson,
  width: number,
  background: string | null
): OffscreenAnim {
  const docWidth = json.w || 512;
  const docHeight = json.h || 512;
  const height = Math.max(1, Math.round((width * docHeight) / docWidth));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable');

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;pointer-events:none;opacity:0;';
  host.style.width = `${canvas.width}px`;
  host.style.height = `${canvas.height}px`;
  host.appendChild(canvas);
  document.body.appendChild(host);

  const anim = lottie.loadAnimation({
    container: host,
    renderer: 'canvas',
    loop: false,
    autoplay: false,
    animationData: structuredClone(json),
    rendererSettings: {
      context,
      // We paint the backdrop ourselves when one was asked for, so lottie must
      // not wipe it; when exporting with transparency it has to clear.
      clearCanvas: background === null,
      preserveAspectRatio: 'xMidYMid meet',
    },
  });

  return {
    anim,
    canvas,
    host,
    destroy: () => {
      try {
        anim.destroy();
      } catch {
        /* already gone */
      }
      host.remove();
    },
  };
}

function paintBackground(canvas: HTMLCanvasElement, background: string | null): void {
  if (!background) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function clear(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  ctx?.clearRect(0, 0, canvas.width, canvas.height);
}

function toBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Canvas encoding failed'))), type);
  });
}

/** Renders a single frame to a PNG blob. */
export async function exportFramePng(
  lottie: LottieModule,
  json: LottieJson,
  frame: number,
  options: Pick<RasterOptions, 'width' | 'background'>
): Promise<Blob> {
  const off = createOffscreen(lottie, json, options.width, options.background);
  try {
    clear(off.canvas);
    off.anim.goToAndStop(frame, true);
    paintBackground(off.canvas, options.background);
    return await toBlob(off.canvas);
  } finally {
    off.destroy();
  }
}

/** Renders a frame range into a ZIP of numbered PNGs. */
export async function exportFrameSequenceZip(
  lottie: LottieModule,
  json: LottieJson,
  options: RasterOptions,
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  const off = createOffscreen(lottie, json, options.width, options.background);
  const zip = new JSZip();
  const total = Math.max(1, options.to - options.from + 1);
  const pad = String(options.to).length;

  try {
    let lastYield = performance.now();
    for (let i = 0; i < total; i++) {
      const frame = options.from + i;
      clear(off.canvas);
      off.anim.goToAndStop(frame, true);
      paintBackground(off.canvas, options.background);
      const blob = await toBlob(off.canvas);
      zip.file(`frame_${String(frame).padStart(pad, '0')}.png`, blob);
      onProgress?.(i + 1, total);
      // Yield on elapsed time rather than every N frames: a background tab
      // clamps setTimeout to about a second, so a fixed frame count would make
      // the export take a minute instead of a second for no benefit.
      if (performance.now() - lastYield > 80) {
        await new Promise(resolve => setTimeout(resolve, 0));
        lastYield = performance.now();
      }
    }
    return await zip.generateAsync({ type: 'blob' });
  } finally {
    off.destroy();
  }
}

/** True when the browser can record a canvas to WebM. */
export function canRecordWebm(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function' &&
    (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ||
      MediaRecorder.isTypeSupported('video/webm;codecs=vp8'))
  );
}

/**
 * Records a frame range to WebM.
 *
 * `captureStream(0)` gives a manually driven track: we render a frame, call
 * `requestFrame()`, and repeat. That makes the output frame-exact instead of
 * "whatever the compositor happened to sample", which is what you get from a
 * real-time capture of a playing animation.
 */
export async function exportWebm(
  lottie: LottieModule,
  json: LottieJson,
  options: RasterOptions & { fps: number },
  onProgress?: (done: number, total: number) => void
): Promise<Blob> {
  if (!canRecordWebm()) throw new Error('WebM recording is not supported in this browser');

  // WebM has no alpha in the VP8 profile MediaRecorder emits, so a transparent
  // export would come out black. Default to a solid backdrop instead of lying.
  const background = options.background ?? '#000000';
  const off = createOffscreen(lottie, json, options.width, background);
  const total = Math.max(1, options.to - options.from + 1);

  try {
    const stream = off.canvas.captureStream(0);
    const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm;codecs=vp8';

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    const finished = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      recorder.onerror = () => reject(new Error('Recording failed'));
    });

    recorder.start();
    const frameDelay = Math.max(1, Math.round(1000 / options.fps));

    for (let i = 0; i < total; i++) {
      clear(off.canvas);
      off.anim.goToAndStop(options.from + i, true);
      paintBackground(off.canvas, background);
      track.requestFrame();
      onProgress?.(i + 1, total);
      // MediaRecorder timestamps frames by wall clock, so the pacing here is
      // what sets the playback speed of the resulting file.
      await new Promise(resolve => setTimeout(resolve, frameDelay));
    }

    recorder.stop();
    return await finished;
  } finally {
    off.destroy();
  }
}

/** Serialises the currently rendered SVG. Zero cost — it is already in the DOM. */
export function exportCurrentSvg(container: HTMLElement | null, json: LottieJson): Blob | null {
  const svg = container?.querySelector('svg');
  if (!svg) return null;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!clone.getAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${json.w || 512} ${json.h || 512}`);
  }
  clone.removeAttribute('style');
  clone.setAttribute('width', String(json.w || 512));
  clone.setAttribute('height', String(json.h || 512));
  const markup = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  return new Blob([markup], { type: 'image/svg+xml' });
}

/** Packs a document into a dotLottie archive, the format lottiefiles.com uses. */
export async function exportDotLottie(json: LottieJson, name: string): Promise<Blob> {
  const zip = new JSZip();
  const id = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'animation';
  zip.file(
    'manifest.json',
    JSON.stringify({
      version: '1.0',
      generator: 'oLoveTools Lottie Viewer',
      animations: [{ id, speed: 1, loop: true, direction: 1, autoplay: true }],
    })
  );
  zip.folder('animations')?.file(`${id}.json`, JSON.stringify(json));
  return await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Hands a blob to the browser as a download.
 *
 * Keep the object URL alive briefly: Safari can still be resolving a large ZIP
 * or WebM after click() returns. The bounded timeout still releases memory.
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
