// ============================================================================
// Control de fotograma, sobre requestVideoFrameCallback.
// ----------------------------------------------------------------------------
// rVFC se dispara una vez por cada fotograma que el compositor presenta de
// verdad, y entrega `mediaTime`: el instante real de ese fotograma. Con eso hay
// dos cosas que dejan de ser una suposición — los fps se MIDEN en vez de
// escribirse en una casilla, y un salto se puede ESPERAR hasta que el fotograma
// destino está en pantalla, así que una captura no puede dibujar el anterior.
//
// Donde no existe (Firefox a día de hoy) se cae al evento `seeked` y se avisa
// en la interfaz, porque ahí "todos los fotogramas" ya no se puede prometer.
// ============================================================================

import type { VideoInfo } from '../types';
import { resolveVideoDuration } from '../../../lib/videoDuration';

export interface FrameMeta {
  mediaTime: number;
  presentedFrames: number;
}

type VideoWithRvfc = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: FrameMeta) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export function hasRvfc(video: HTMLVideoElement | null): boolean {
  return typeof (video as VideoWithRvfc | null)?.requestVideoFrameCallback === 'function';
}

export function requestFrame(video: HTMLVideoElement, cb: (meta: FrameMeta) => void): number | null {
  const element = video as VideoWithRvfc;
  if (!element.requestVideoFrameCallback) return null;
  return element.requestVideoFrameCallback((_now, meta) => cb(meta));
}

export function cancelFrame(video: HTMLVideoElement, handle: number | null) {
  const element = video as VideoWithRvfc;
  if (handle !== null && element.cancelVideoFrameCallback) element.cancelVideoFrameCallback(handle);
}

/** Resuelve en el siguiente fotograma presentado, o en `seeked` si no hay rVFC. */
export function nextPresentedFrame(video: HTMLVideoElement, timeoutMs = 3000): Promise<FrameMeta | null> {
  const element = video as VideoWithRvfc;

  return new Promise(resolve => {
    let settled = false;
    let handle: number | undefined;

    const finish = (meta: FrameMeta | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      if (handle !== undefined && element.cancelVideoFrameCallback) element.cancelVideoFrameCallback(handle);
      resolve(meta);
    };

    // Un salto que cae en un fotograma ya presentado no vuelve a disparar rVFC,
    // así que `seeked` tiene que seguir armado aunque rVFC exista.
    const onSeeked = () => finish({ mediaTime: video.currentTime, presentedFrames: -1 });
    const timer = setTimeout(() => finish(null), timeoutMs);

    video.addEventListener('seeked', onSeeked, { once: true });
    if (element.requestVideoFrameCallback) {
      handle = element.requestVideoFrameCallback((_now, meta) => finish(meta));
    }
  });
}

/** Salta y no vuelve hasta que esa posición es la que está en pantalla. */
export async function seekExact(video: HTMLVideoElement, time: number): Promise<number> {
  const clamped = Math.max(0, Math.min(video.duration || 0, time));
  if (Math.abs(video.currentTime - clamped) < 1e-6) return video.currentTime;
  const waiter = nextPresentedFrame(video);
  video.currentTime = clamped;
  const meta = await waiter;
  return meta?.mediaTime ?? video.currentTime;
}

/**
 * Mide los fps reproduciendo en silencio un momento y mirando las marcas de
 * tiempo. No se saca del contenedor a posta: una grabación de tasa variable no
 * tiene un único fps "verdadero", y la mediana de lo observado es la respuesta
 * honesta para contar fotogramas.
 */
export async function measureFps(video: HTMLVideoElement, samples = 16): Promise<number | null> {
  const element = video as VideoWithRvfc;
  if (!element.requestVideoFrameCallback) return null;

  const times: number[] = [];
  const wasMuted = video.muted;
  const startedAt = video.currentTime;

  video.muted = true;
  try {
    await video.play();
  } catch {
    video.muted = wasMuted;
    return null;
  }

  await new Promise<void>(resolve => {
    let handle = 0;
    const tick = (_now: number, meta: FrameMeta) => {
      times.push(meta.mediaTime);
      if (times.length >= samples) {
        resolve();
        return;
      }
      handle = element.requestVideoFrameCallback!(tick);
    };
    handle = element.requestVideoFrameCallback!(tick);
    // Nunca colgarse en un vídeo que se atasca.
    setTimeout(() => {
      if (element.cancelVideoFrameCallback) element.cancelVideoFrameCallback(handle);
      resolve();
    }, 2000);
  });

  video.pause();
  video.currentTime = startedAt;
  video.muted = wasMuted;

  const deltas: number[] = [];
  for (let i = 1; i < times.length; i += 1) {
    const delta = times[i] - times[i - 1];
    if (delta > 0.0005 && delta < 1) deltas.push(delta);
  }
  if (deltas.length < 3) return null;

  deltas.sort((a, b) => a - b);
  const raw = 1 / deltas[Math.floor(deltas.length / 2)];

  // Se ajusta a las tasas que existen de verdad, pero sólo si está cerca: un
  // 23,976 real no puede redondearse a 24 y desviarse un fotograma cada 42 s.
  const COMMON = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 90, 120, 144, 240];
  const near = COMMON.find(candidate => Math.abs(candidate - raw) / candidate < 0.02);
  return near ?? Math.round(raw * 1000) / 1000;
}

/** Carga el fichero en el elemento y devuelve lo que el vídeo cuenta de sí mismo. */
export async function probeVideo(video: HTMLVideoElement, file: File, url: string): Promise<VideoInfo> {
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  await new Promise<void>((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const ko = () => {
      cleanup();
      reject(new Error('decode'));
    };
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', ok);
      video.removeEventListener('error', ko);
    };
    video.addEventListener('loadedmetadata', ok, { once: true });
    video.addEventListener('error', ko, { once: true });
  });

  // WebM de MediaRecorder: duración Infinity hasta que se busca el final.
  await resolveVideoDuration(video);
  // Un primer fotograma en pantalla antes de medir nada: si no, el primer
  // salto tiene que esperar además a que arranque la decodificación.
  await seekExact(video, 0);
  const fps = await measureFps(video);
  await seekExact(video, 0);

  return {
    name: file.name,
    width: video.videoWidth,
    height: video.videoHeight,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
    bytes: file.size,
    fps,
    exact: hasRvfc(video),
  };
}

export function formatTimecode(seconds: number, withMillis = true): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const pad = (n: number, size = 2) => String(Math.floor(n)).padStart(size, '0');
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = Math.floor(safe % 60);
  const base = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  return withMillis ? `${base}.${pad((safe % 1) * 1000, 3)}` : base;
}

/** El mismo código de tiempo pero apto para un nombre de fichero. */
export function timecodeSlug(seconds: number): string {
  return formatTimecode(seconds).replace(/:/g, '-');
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mm = Math.floor(seconds / 60);
  const ss = Math.round(seconds % 60);
  if (mm < 60) return `${mm}m ${ss}s`;
  return `${Math.floor(mm / 60)}h ${mm % 60}m`;
}

/** Nombre base del vídeo, apto para fichero. */
export function baseNameOf(fileName: string): string {
  return (fileName.replace(/\.[^.]+$/, '') || 'framebolt').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 48);
}
