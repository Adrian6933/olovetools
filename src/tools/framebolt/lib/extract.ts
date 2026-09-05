// ============================================================================
// Los dos motores de extracción, y los filtros que deciden qué se guarda.
// ----------------------------------------------------------------------------
// Motor de REPRODUCCIÓN, para "todos los fotogramas" y "1 de cada N": el vídeo
// se reproduce en silencio y rVFC avisa de cada fotograma que se presenta. Es
// la única forma honesta de decir "todos": no se supone dónde está cada
// fotograma, se coge el que el decodificador acaba de sacar. Entre uno y otro
// se pausa, que es la contrapresión: mientras se codifica y se escribe en el
// ZIP el vídeo no avanza, así que no se pierde ninguno por ir el disco más
// lento que la reproducción.
//
// Motor de SALTO, para "cada N segundos" y "N repartidos": ahí no interesan
// todos los fotogramas sino unos instantes concretos, y saltar a cada uno es
// muchísimo más rápido que atravesar el vídeo entero.
//
// Ninguno de los dos guarda un fotograma más de lo que tarda en escribirlo.
// ============================================================================

import type {
  FilterOptions,
  ImageFormat,
  OutputOptions,
  PickOptions,
  RunProgress,
  RunResult,
  VideoInfo,
} from '../types';
import { FORMAT_EXT } from '../types';
import { ZipStreamWriter } from './zipstream';
import type { ZipSink } from './sink';
import { baseNameOf, hasRvfc, nextPresentedFrame, seekExact, timecodeSlug } from './video';

export type Engine = 'playback' | 'seek';

export function engineFor(pick: PickOptions, info: VideoInfo | null): Engine {
  if (pick.mode === 'interval' || pick.mode === 'count') return 'seek';
  // Sin rVFC no hay forma de saber qué fotograma se está presentando, así que
  // "todos" pasa a ser "uno cada 1/fps" a base de saltos, y la interfaz lo dice.
  return info && !info.exact ? 'seek' : 'playback';
}

export function rangeOf(pick: PickOptions, duration: number): { from: number; to: number } {
  const from = Math.max(0, Math.min(pick.from, duration));
  const to = pick.to > 0 ? Math.min(pick.to, duration) : duration;
  return { from, to: Math.max(from, to) };
}

/** Cuántos fotogramas van a salir. -1 cuando no se puede saber (fps sin medir). */
export function estimateFrames(pick: PickOptions, info: VideoInfo | null): number {
  if (!info) return -1;
  const { from, to } = rangeOf(pick, info.duration);
  const span = Math.max(0, to - from);
  if (span <= 0) return 0;

  if (pick.mode === 'count') return Math.max(1, Math.round(pick.count));
  if (pick.mode === 'interval') return Math.floor(span / Math.max(0.01, pick.interval)) + 1;
  if (!info.fps) return -1;
  const total = Math.round(span * info.fps);
  return pick.mode === 'every-n' ? Math.ceil(total / Math.max(1, Math.round(pick.everyN))) : total;
}

/** Los instantes que visita el motor de salto. */
export function seekTimes(pick: PickOptions, info: VideoInfo): number[] {
  const { from, to } = rangeOf(pick, info.duration);
  const span = to - from;
  if (span <= 0) return [from];

  if (pick.mode === 'count') {
    const count = Math.max(1, Math.round(pick.count));
    if (count === 1) return [from];
    return Array.from({ length: count }, (_, i) => from + (span * i) / (count - 1));
  }

  const stride =
    pick.mode === 'interval'
      ? Math.max(0.01, pick.interval)
      : (Math.max(1, Math.round(pick.everyN)) || 1) / (info.fps || 30);

  const times: number[] = [];
  for (let t = from; t <= to + 1e-6; t += stride) times.push(t);
  return times;
}

// ---------------------------------------------------------------------------
// Dibujo y codificación
// ---------------------------------------------------------------------------

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;
type AnyCtx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas === 'function') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToBytes(canvas: AnyCanvas, format: ImageFormat, quality: number): Promise<Uint8Array> {
  const q = format === 'image/png' ? undefined : Math.min(1, Math.max(0.01, quality / 100));
  let blob: Blob | null;
  if (typeof OffscreenCanvas === 'function' && canvas instanceof OffscreenCanvas) {
    blob = await canvas.convertToBlob({ type: format, quality: q });
  } else {
    blob = await new Promise<Blob | null>(resolve =>
      (canvas as HTMLCanvasElement).toBlob(resolve, format, q)
    );
  }
  if (!blob) throw new Error('encode');
  return new Uint8Array(await blob.arrayBuffer());
}

/** Ancho y alto de salida respetando el límite de ancho, siempre pares. */
export function outputSize(info: VideoInfo, maxWidth: number): { width: number; height: number } {
  const width = info.width || 640;
  const height = info.height || 360;
  if (!maxWidth || maxWidth >= width) return { width, height };
  const scaled = Math.max(2, Math.round(maxWidth));
  return { width: scaled, height: Math.max(2, Math.round((height * scaled) / width)) };
}

// ---------------------------------------------------------------------------
// Filtros
// ---------------------------------------------------------------------------

const SIG_W = 32;
const SIG_H = 18;

/**
 * Firma en gris de 32x18. Sirve para dos cosas: comparar con el fotograma
 * anterior (repetidos) y mirar el brillo medio (negros y blancos). Se saca de
 * una copia diminuta porque hacerlo sobre la imagen completa costaría más que
 * codificarla.
 */
class FrameSignature {
  private readonly canvas = makeCanvas(SIG_W, SIG_H);
  private readonly ctx = this.canvas.getContext('2d', { willReadFrequently: true }) as AnyCtx;
  private previous: Uint8Array | null = null;

  /** Devuelve el brillo medio (0..1) y la diferencia con el anterior (0..1). */
  measure(source: CanvasImageSource): { luma: number; diff: number } {
    this.ctx.drawImage(source as any, 0, 0, SIG_W, SIG_H);
    const { data } = this.ctx.getImageData(0, 0, SIG_W, SIG_H);
    const current = new Uint8Array(SIG_W * SIG_H);
    let sum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      const grey = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
      current[p] = grey;
      sum += grey;
    }
    const luma = sum / current.length / 255;

    let diff = 1;
    if (this.previous) {
      let acc = 0;
      for (let i = 0; i < current.length; i += 1) acc += Math.abs(current[i] - this.previous[i]);
      diff = acc / current.length / 255;
    }
    return { luma, diff };
  }

  /** Sólo se recuerda lo que SE GUARDA: si no, una deriva lenta se cuela entera. */
  commit(source: CanvasImageSource) {
    this.ctx.drawImage(source as any, 0, 0, SIG_W, SIG_H);
    const { data } = this.ctx.getImageData(0, 0, SIG_W, SIG_H);
    const kept = new Uint8Array(SIG_W * SIG_H);
    for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
      kept[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    }
    this.previous = kept;
  }
}

// ---------------------------------------------------------------------------
// La pasada
// ---------------------------------------------------------------------------

export interface RunOptions {
  video: HTMLVideoElement;
  info: VideoInfo;
  pick: PickOptions;
  output: OutputOptions;
  filters: FilterOptions;
  sink: ZipSink;
  filename: string;
  onProgress: (progress: RunProgress) => void;
  shouldStop: () => boolean;
}

function nameFor(pattern: string, base: string, index: number, time: number, ext: string): string {
  const n = String(index).padStart(6, '0');
  const body = (pattern || '{name}_{n}_{t}')
    .replace(/\{name\}/g, base)
    .replace(/\{n\}/g, n)
    .replace(/\{t\}/g, timecodeSlug(time));
  return `${body}.${ext}`;
}

export async function runExtraction(options: RunOptions): Promise<RunResult> {
  const { video, info, pick, output, filters, sink, onProgress, shouldStop } = options;

  const { width, height } = outputSize(info, output.maxWidth);
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d') as AnyCtx;
  // El escalado se hace una sola vez por fotograma y a calidad alta: es el
  // mismo coste que el bajo y la diferencia se nota al reducir mucho.
  (ctx as any).imageSmoothingEnabled = true;
  (ctx as any).imageSmoothingQuality = 'high';

  const signature = filters.skipDuplicates || filters.skipBlank ? new FrameSignature() : null;
  const zip = new ZipStreamWriter(chunk => sink.write(chunk));
  const base = baseNameOf(info.name);
  const ext = FORMAT_EXT[output.format];
  const { from, to } = rangeOf(pick, info.duration);
  const total = estimateFrames(pick, info);

  const progress: RunProgress = {
    seen: 0,
    written: 0,
    skipped: 0,
    bytes: 0,
    at: from,
    total,
    startedAt: Date.now(),
    waiting: false,
  };

  let cancelled = false;
  let partial = false;
  let error: string | undefined;

  /**
   * Un vídeo en una pestaña de fondo no presenta fotogramas: el compositor no
   * dibuja nada, así que rVFC no se dispara y `currentTime` ni se mueve. Antes
   * esto se leía como "se acabó el vídeo" y la pasada terminaba en silencio con
   * un ZIP a medias que parecía completo. Ahora se espera.
   */
  const waitForForeground = async (): Promise<void> => {
    if (typeof document === 'undefined' || !document.hidden) return;
    video.pause();
    progress.waiting = true;
    onProgress({ ...progress });
    await new Promise<void>(resolve => {
      const timer = setInterval(() => {
        if (!document.hidden || shouldStop()) {
          clearInterval(timer);
          document.removeEventListener('visibilitychange', check);
          resolve();
        }
      }, 400);
      const check = () => {
        if (!document.hidden) {
          clearInterval(timer);
          document.removeEventListener('visibilitychange', check);
          resolve();
        }
      };
      document.addEventListener('visibilitychange', check);
    });
    progress.waiting = false;
    onProgress({ ...progress });
  };

  /** Mira un fotograma ya situado y lo guarda si pasa los filtros. */
  const consume = async (time: number): Promise<void> => {
    progress.seen += 1;
    progress.at = time;

    ctx.drawImage(video, 0, 0, width, height);

    if (signature) {
      const { luma, diff } = signature.measure(canvas as CanvasImageSource);
      const blank = filters.skipBlank && (luma < 0.02 || luma > 0.98);
      const repeated = filters.skipDuplicates && progress.written > 0 && diff < filters.duplicateThreshold;
      if (blank || repeated) {
        progress.skipped += 1;
        return;
      }
      signature.commit(canvas as CanvasImageSource);
    }

    const bytes = await canvasToBytes(canvas, output.format, output.quality);
    await zip.add(nameFor(output.pattern, base, progress.written + 1, time, ext), bytes);
    progress.written += 1;
    progress.bytes = zip.written;
  };

  try {
    const engine = engineFor(pick, info);

    if (engine === 'seek') {
      const times = seekTimes(pick, info);
      progress.total = times.length;
      for (const time of times) {
        if (shouldStop()) {
          cancelled = true;
          break;
        }
        const landed = await seekExact(video, time);
        await consume(landed);
        onProgress({ ...progress });
      }
    } else {
      await seekExact(video, from);
      const keepEvery = pick.mode === 'every-n' ? Math.max(1, Math.round(pick.everyN)) : 1;
      let presented = 0;
      let lastTime = -1;

      // El primer fotograma del rango ya está en pantalla tras el salto, y
      // reproduciendo no se vuelve a presentar: se coge aquí o se pierde.
      await consume(video.currentTime);
      lastTime = video.currentTime;
      presented = 1;
      onProgress({ ...progress });

      video.muted = true;
      // Dos plantones seguidos con la pestaña delante ya no son "se acabó el
      // vídeo", son un atasco: se corta y se avisa, en vez de dar por buena una
      // extracción que se ha dejado la mitad.
      let stalls = 0;
      while (!shouldStop() && video.currentTime < to - 1e-4 && !video.ended) {
        await waitForForeground();
        if (shouldStop()) break;
        try {
          await video.play();
        } catch {
          error = 'playback';
          break;
        }
        const meta = await nextPresentedFrame(video, 4000);
        video.pause();
        if (!meta) {
          if (typeof document !== 'undefined' && document.hidden) continue;
          stalls += 1;
          if (stalls >= 2) {
            partial = true;
            error = 'stalled';
            break;
          }
          continue;
        }
        stalls = 0;

        const time = meta.mediaTime;
        // Al reanudar, el compositor puede volver a presentar el mismo
        // fotograma. Sin este descarte saldría duplicado en el ZIP.
        if (time <= lastTime + 1e-6) continue;
        lastTime = time;
        if (time > to + 1e-6) break;

        presented += 1;
        if ((presented - 1) % keepEvery === 0) {
          await consume(time);
        } else {
          progress.seen += 1;
          progress.at = time;
        }
        onProgress({ ...progress });
      }
      video.pause();
      if (shouldStop()) cancelled = true;
    }

    if (cancelled) {
      await sink.abort();
      return { progress, cancelled: true, blob: null, filename: options.filename };
    }

    await zip.finish();
    progress.bytes = zip.written;
    const blob = await sink.close();
    onProgress({ ...progress });
    return { progress, cancelled: false, blob, filename: options.filename, partial, error };
  } catch (err) {
    await sink.abort();
    return {
      progress,
      cancelled: false,
      blob: null,
      filename: options.filename,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export { hasRvfc };
