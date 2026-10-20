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
import type { WatermarkConfig } from './types';
import { drawWatermarkOnCanvas, ensureWatermarkFont } from './watermarkService';

export interface MergeItem {
  blob: Blob;
  channelName: string;
  /**
   * Vídeo o imagen que pone la persona (una intro, un "suscríbete"...): no es
   * de ningún streamer, así que no lleva su marca de agua.
   */
  propio?: boolean;
  /** Si es una imagen: cuántos segundos se queda en pantalla. */
  imagenSegundos?: number;
  /** Recorte, en segundos del vídeo original (sin nada: entero). */
  inicio?: number;
  fin?: number;
  /** 0-1 (1 = como viene). */
  volumen?: number;
  /** 0.5 = a cámara lenta, 2 = al doble. El tono de la voz se conserva. */
  velocidad?: number;
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

/**
 * La duración de un vídeo, también cuando la cabecera no la trae. Los WebM
 * grabados en el navegador (y algunos de OBS) dicen Infinity hasta que se
 * salta al final: entonces el navegador recorre el archivo y la calcula.
 */
export const duracionDe = (v: HTMLVideoElement) =>
  new Promise<number>((resolve) => {
    let hecho = false;
    const fin = (d: number) => { if (!hecho) { hecho = true; resolve(d); } };
    const mirar = () => {
      if (isFinite(v.duration) && v.duration > 0) return fin(v.duration);
      v.ondurationchange = () => { if (isFinite(v.duration) && v.duration > 0) fin(v.duration); };
      v.currentTime = 1e101;
    };
    if (v.readyState >= 1) mirar(); else v.addEventListener('loadedmetadata', mirar, { once: true });
    v.addEventListener('error', () => fin(0), { once: true });
    setTimeout(() => fin(0), 8000);
  });

const leerDuracion = (url: string) => {
  const v = document.createElement('video');
  v.preload = 'metadata';
  v.muted = true;
  v.src = url;
  return duracionDe(v);
};

export const mergeClipsToVideo = async (
  items: MergeItem[],
  opts: MergeOptions,
  onProgress?: (p: MergeProgress) => void,
  signal?: AbortSignal,
): Promise<Blob> => {
  if (items.length === 0) throw new Error('Nothing to merge');
  if (opts.watermark) await ensureWatermarkFont(opts.watermark);

  const urls = items.map(i => URL.createObjectURL(i.blob));
  // Lo que dura cada tramo EN EL VÍDEO FINAL: recortado y a su velocidad.
  const duraciones = await Promise.all(urls.map(async (u, i) => {
    const it = items[i];
    if (it.imagenSegundos !== undefined) return it.imagenSegundos;
    const vel = it.velocidad || 1;
    const fin = it.fin ?? await leerDuracion(u);
    return Math.max(0, fin - (it.inicio || 0)) / vel;
  }));
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

  /** Encaja el fotograma (o la imagen) dentro del lienzo 16:9 sin deformarlo. */
  const dibujarEncajado = (v: CanvasImageSource, vw0: number, vh0: number) => {
    const vw = vw0 || width;
    const vh = vh0 || height;
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
    // Mientras se carga y se busca el punto de cada pieza no se graba: antes
    // esa espera salía como ~0,7 s de imagen congelada al principio y entre
    // cortes, y el vídeo duraba más de lo recortado.
    const grabar = () => { if (recorder.state === 'paused') recorder.resume(); };
    const esperar = () => { if (recorder.state === 'recording') recorder.pause(); };
    esperar();
    let acumulado = 0;

    for (let i = 0; i < items.length; i += 1) {
      if (cancelado) break;

      // ---- una imagen: se queda quieta los segundos pedidos, en silencio ----
      const segs = items[i].imagenSegundos;
      if (segs !== undefined) {
        const img = await createImageBitmap(items[i].blob);
        dibujarEncajado(img, img.width, img.height);
        if (opts.fade && segs > FUNDIDO * 2) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }
        if (pistaManual) pistaManual.requestFrame();
        grabar();
        const inicio = performance.now();
        await new Promise<void>((resolve) => {
          const id = setInterval(() => {
            const t = (performance.now() - inicio) / 1000;
            if (cancelado || t >= segs) { clearInterval(id); resolve(); return; }
            dibujarEncajado(img, img.width, img.height);
            if (opts.fade && segs > FUNDIDO * 2) {
              const a = t < FUNDIDO ? 1 - t / FUNDIDO : t > segs - FUNDIDO ? 1 - (segs - t) / FUNDIDO : 0;
              if (a > 0) {
                ctx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`;
                ctx.fillRect(0, 0, width, height);
              }
            }
            if (pistaManual) pistaManual.requestFrame();
            onProgress?.({
              index: i + 1,
              total: items.length,
              elapsed: acumulado + t,
              duration: total,
              pct: Math.min(100, Math.round(((acumulado + t) / total) * 100)),
            });
          }, 1000 / 30);
        });
        esperar();
        img.close();
        acumulado += segs;
        continue;
      }

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
      const it = items[i];
      const vel = it.velocidad || 1;
      const volumen = it.volumen ?? 1;
      const desde = it.inicio || 0;
      ganancia.gain.value = volumen;
      // Lo medido antes manda: un WebM sin cabecera dice Infinity aquí.
      const dur = duraciones[i] || (isFinite(v.duration) ? (v.duration - desde) / vel : 0);
      /** Hasta dónde se reproduce, en segundos del original. */
      const hasta = it.fin ?? (desde + dur * vel);
      let ultimoT = 0;

      if (desde > 0) {
        await new Promise<void>((resolve) => {
          v.onseeked = () => resolve();
          v.currentTime = desde;
        });
      }
      v.playbackRate = vel;
      // El primer fotograma de la pieza ya en el lienzo antes de volver a grabar.
      dibujarEncajado(v, v.videoWidth, v.videoHeight);
      // Con fundidos la pieza empieza en negro: sin esto asomaba un fotograma.
      if (opts.fade && dur > FUNDIDO * 2) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); }
      if (pistaManual) pistaManual.requestFrame();
      grabar();
      await v.play();
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          if (cancelado || v.ended || (hasta > 0 && v.currentTime >= hasta - 0.02)) {
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
          // Tiempo dentro del tramo final, no del vídeo original.
          const t = Math.max(0, (v.currentTime - desde) / vel);
          ultimoT = t;
          dibujarEncajado(v, v.videoWidth, v.videoHeight);
          if (opts.watermark && !it.propio) {
            drawWatermarkOnCanvas(ctx, opts.watermark, items[i].channelName, width, height, t, dur);
          }
          if (opts.fade && dur > FUNDIDO * 2) {
            // Velo negro y bajada de volumen a la vez en cada corte.
            const a = t < FUNDIDO ? 1 - t / FUNDIDO : t > dur - FUNDIDO ? 1 - (dur - t) / FUNDIDO : 0;
            if (a > 0) {
              ctx.fillStyle = `rgba(0,0,0,${Math.min(1, a)})`;
              ctx.fillRect(0, 0, width, height);
            }
            ganancia.gain.value = volumen * (1 - Math.min(1, a));
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
      esperar();
      try { v.pause(); } catch { /* */ }
      fuente.disconnect();
      v.removeAttribute('src');
      v.load();
      acumulado += dur || ultimoT;
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
