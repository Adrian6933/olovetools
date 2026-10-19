// ============================================================================
// Unir varios clips en un solo vídeo
// ----------------------------------------------------------------------------
// Pegar los MP4 sin recodificar no vale: cada clip trae su propia resolución y
// sus parámetros de H.264, y un contenedor con dos configuraciones distintas no
// lo reproduce casi nadie. Así que se hace como la marca de agua: se reproducen
// uno detrás de otro sobre un mismo canvas y un único MediaRecorder graba el
// conjunto. Cuesta lo que dura la suma de los clips, y la interfaz lo avisa.
//
// Mismas reglas que processVideoWithWatermark, aprendidas allí a golpes:
//   - El dibujo lo mueve setInterval, nunca rAF (en segundo plano rAF da 0 fps).
//   - captureStream(0) + requestFrame cuando existe.
//   - El audio va por un único AudioContext hacia el grabador; cada clip se
//     engancha a él con su propio createMediaElementSource.
// ============================================================================
import type { WatermarkConfig } from '../types';
import { drawWatermarkOnCanvas, ensureWatermarkFont } from './watermarkService';

export interface MergeItem {
  blob: Blob;
  channelName: string;
}

export interface MergeOptions {
  /** Con marca, cada tramo lleva el nombre de su propio streamer. */
  watermark?: WatermarkConfig | null;
  /** Fundido a negro de entrada y salida en cada corte. */
  fade?: boolean;
  /** Alto de salida; el ancho sale de 16:9. */
  height?: number;
}

export interface MergeProgress {
  /** Índice del clip que suena ahora, desde 1. */
  index: number;
  total: number;
  /** Segundos grabados y totales del vídeo final. */
  elapsed: number;
  duration: number;
  pct: number;
}

const FUNDIDO = 0.35;

const leerDuracion = (url: string) =>
  new Promise<number>((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => resolve(isFinite(v.duration) ? v.duration : 0);
    v.onerror = () => resolve(0);
    v.src = url;
  });

export const mergeClipsToVideo = async (
  items: MergeItem[],
  opts: MergeOptions,
  onProgress?: (p: MergeProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> => {
  if (items.length === 0) throw new Error('Nothing to merge');
  if (opts.watermark) await ensureWatermarkFont(opts.watermark);

  const urls = items.map(i => URL.createObjectURL(i.blob));
  const duraciones = await Promise.all(urls.map(leerDuracion));
  const total = duraciones.reduce((a, b) => a + b, 0) || 1;

  const height = opts.height || 1080;
  const width = Math.round((height * 16) / 9);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  let stream: MediaStream;
  let pistaManual: any = null;
  try {
    stream = canvas.captureStream(0);
    const [pista] = stream.getVideoTracks();
    if (pista && typeof (pista as any).requestFrame === 'function') pistaManual = pista;
    else stream = canvas.captureStream(60);
  } catch {
    stream = canvas.captureStream(60);
  }

  const audioCtx: AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const destino = audioCtx.createMediaStreamDestination();
  destino.stream.getAudioTracks().forEach(t => stream.addTrack(t));
  // Creado tras varias esperas de red, el contexto puede nacer suspendido y
  // entonces el vídeo sale mudo.
  await audioCtx.resume().catch(() => { /* sin audio, pero sigue */ });

  let mimeType = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

  const recorder = new MediaRecorder(stream, {
    mimeType: mimeType || undefined,
    // Medido: a 12 Mbps fijos 32 s de 1080p pesaban 103 MB. Escalado con el
    // alto sigue viéndose limpio y el archivo se puede subir a cualquier lado.
    videoBitsPerSecond: height >= 1080 ? 8_000_000 : height >= 720 ? 5_000_000 : 2_000_000,
    audioBitsPerSecond: 192_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data); };
  const parado = new Promise<void>(resolve => { recorder.onstop = () => resolve(); });

  let cancelado = false;
  let pausadoFuera = false;
  let actual: HTMLVideoElement | null = null;
  const alCancelar = () => { cancelado = true; try { actual?.pause(); } catch { /* */ } };
  signal?.addEventListener('abort', alCancelar);

  const limpiar = () => {
    signal?.removeEventListener('abort', alCancelar);
    urls.forEach(u => URL.revokeObjectURL(u));
    audioCtx.close().catch(() => { /* ya cerrado */ });
  };

  /** Encaja el fotograma dentro del lienzo 16:9 sin deformarlo. */
  const dibujarEncajado = (v: HTMLVideoElement) => {
    const vw = v.videoWidth || width;
    const vh = v.videoHeight || height;
    const k = Math.min(width / vw, height / vh);
    const dw = vw * k;
    const dh = vh * k;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(v, (width - dw) / 2, (height - dh) / 2, dw, dh);
  };

  try {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    recorder.start(250);
    let acumulado = 0;

    for (let i = 0; i < items.length; i += 1) {
      if (cancelado) break;
      const v = document.createElement('video');
      actual = v;
      v.src = urls[i];
      v.playsInline = true;
      v.preload = 'auto';
      await new Promise<void>((resolve, reject) => {
        v.onloadeddata = () => resolve();
        v.onerror = () => reject(new Error('Could not load a clip'));
      });
      const fuente = audioCtx.createMediaElementSource(v);
      const ganancia = audioCtx.createGain();
      fuente.connect(ganancia).connect(destino);
      const dur = v.duration || duraciones[i] || 0;

      await v.play();
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          if (cancelado || v.ended || (dur > 0 && v.currentTime >= dur - 0.02)) {
            clearInterval(id);
            resolve();
            return;
          }
          if (v.paused) {
            // El navegador lo ha parado por ahorro de energía: se dice, no se
            // entrega un vídeo cortado que parece bueno.
            pausadoFuera = true;
            cancelado = true;
            clearInterval(id);
            resolve();
            return;
          }
          const t = v.currentTime;
          dibujarEncajado(v);
          if (opts.watermark) {
            drawWatermarkOnCanvas(ctx, opts.watermark, items[i].channelName, width, height, t, dur);
          }
          if (opts.fade && dur > FUNDIDO * 2) {
            // Velo negro y bajada de volumen a la vez en cada corte.
            const a = t < FUNDIDO ? 1 - t / FUNDIDO : t > dur - FUNDIDO ? 1 - (dur - t) / FUNDIDO : 0;
            if (a > 0) {
              ctx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`;
              ctx.fillRect(0, 0, width, height);
            }
            ganancia.gain.value = 1 - Math.min(1, a);
          }
          if (pistaManual) pistaManual.requestFrame();
          onProgress?.({
            index: i + 1,
            total: items.length,
            elapsed: acumulado + t,
            duration: total,
            pct: Math.min(100, Math.round(((acumulado + t) / total) * 100)),
          });
        }, 1000 / 60);
      });
      try { v.pause(); } catch { /* */ }
      fuente.disconnect();
      v.removeAttribute('src');
      v.load();
      acumulado += dur;
    }
  } finally {
    if (recorder.state !== 'inactive') recorder.stop();
    await parado;
    limpiar();
  }

  if (pausadoFuera) throw new Error('BACKGROUND_PAUSE');
  if (cancelado) throw new DOMException('Cancelled', 'AbortError');
  return new Blob(chunks, { type: recorder.mimeType || 'video/mp4' });
};
