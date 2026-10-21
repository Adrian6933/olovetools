// ============================================================================
// Exportar sin grabar en tiempo real (WebCodecs, con mediabunny)
// ----------------------------------------------------------------------------
// La marca de agua, el vídeo unido y el editor grababan un canvas con
// MediaRecorder mientras el vídeo sonaba. Eso tiene tres pegas que se veían
// como "se ve peor que en Twitch":
//
//   - El ritmo depende de que la pestaña pinte: fotogramas repetidos y otros
//     perdidos (en 6 s de un clip a 60 fps salían 337 distintos de 360).
//   - Chrome graba H.264 en tiempo real y en su perfil más pobre (Baseline).
//   - Tarda lo que dura el vídeo y se para si la pestaña pasa a segundo plano.
//
// Aquí se DECODIFICA cada fotograma del clip, se pinta en el canvas (encajado,
// con la marca y los fundidos) y se CODIFICA con VideoEncoder a calidad
// constante: cada fotograma sale una vez, con su tiempo exacto, y va más
// rápido que el tiempo real. El audio se recorta y se mezcla con
// OfflineAudioContext.
//
// Lo que no cubre (el que llama vuelve a grabar en tiempo real):
//   - Velocidad distinta de 1x: el navegador conserva el tono de la voz al
//     acelerar un <video>, pero un AudioBuffer acelerado sale agudo.
//   - Navegadores sin VideoEncoder / sin H.264 o AAC/Opus para codificar.
// ============================================================================
import {
  ALL_FORMATS, AudioBufferSink, AudioBufferSource, BlobSource, BufferTarget, CanvasSink, CanvasSource, Input,
  Mp4OutputFormat, Output, Quality, canEncodeAudio, canEncodeVideo,
} from 'mediabunny';
import type { WatermarkConfig } from './types';
import { drawWatermarkOnCanvas, ensureWatermarkFont } from './watermarkService';
import { bitrateDeGrabacion, suavizar } from './recorder';
import { crearNitidez } from './nitidez';

export interface PiezaOffline {
  blob: Blob;
  channelName: string;
  /** Sin marca de agua (lo propio, que no es de ningún streamer). */
  propio?: boolean;
  /** Imagen fija estos segundos. */
  imagenSegundos?: number;
  inicio?: number;
  fin?: number;
  volumen?: number;
  velocidad?: number;
}

export interface OpcionesOffline {
  /** Tamaño de salida; sin él, el del primer vídeo (la marca de un solo clip). */
  width?: number;
  height?: number;
  /**
   * Alto de salida conservando la forma del primer vídeo (1440 para escalar).
   * Solo cuenta si no se da width/height.
   */
  alto?: number;
  watermark?: WatermarkConfig | null;
  fade?: boolean;
  /** Nitidez CAS de 0 (nada) a 1 (fuerte); ver nitidez.ts. */
  nitidez?: number;
}

export interface ProgresoOffline {
  index: number;
  total: number;
  elapsed: number;
  duration: number;
  pct: number;
}

const FUNDIDO = 0.35;
const FRECUENCIA = 48_000;

/** ¿Se puede hacer así, o hay que grabar en tiempo real? */
export const sePuedeSinTiempoReal = async (piezas: PiezaOffline[], width: number, height: number) => {
  if (typeof VideoEncoder === 'undefined' || typeof AudioEncoder === 'undefined' || typeof OfflineAudioContext === 'undefined') return false;
  if (piezas.some(p => p.imagenSegundos === undefined && (p.velocidad || 1) !== 1)) return false;
  try {
    const [video, aac, opus] = await Promise.all([
      canEncodeVideo('avc', { width, height }),
      canEncodeAudio('aac', { numberOfChannels: 2, sampleRate: FRECUENCIA }),
      canEncodeAudio('opus', { numberOfChannels: 2, sampleRate: FRECUENCIA }),
    ]);
    return video && (aac || opus);
  } catch {
    return false;
  }
};

const abortado = () => new DOMException('Cancelled', 'AbortError');

/**
 * Renderiza las piezas una detrás de otra en un MP4 (H.264 + AAC u Opus).
 * Lanza si algo no se puede leer: el que llama decide si grabar en tiempo real.
 */
export const exportarSinTiempoReal = async (
  piezas: PiezaOffline[],
  opts: OpcionesOffline,
  onProgress?: (p: ProgresoOffline) => void,
  signal?: AbortSignal,
): Promise<Blob> => {
  if (!piezas.length) throw new Error('Nothing to export');
  if (opts.watermark) await ensureWatermarkFont(opts.watermark);

  // ---- abrir cada pieza y saber cuánto dura y a cuántos fps va -------------
  const abiertas = await Promise.all(piezas.map(async p => {
    if (p.imagenSegundos !== undefined) {
      return { p, input: null as Input | null, video: null as any, audio: null as any, desde: 0, hasta: p.imagenSegundos, dur: p.imagenSegundos, fps: 0, bps: 0, area: 0 };
    }
    const input = new Input({ source: new BlobSource(p.blob), formats: ALL_FORMATS });
    const video = await input.getPrimaryVideoTrack();
    if (!video || !(await video.canDecode())) throw new Error('Video track not decodable');
    const audio = await input.getPrimaryAudioTrack();
    const total = await input.computeDuration();
    const desde = Math.max(0, p.inicio || 0);
    const hasta = Math.min(total, p.fin ?? total);
    let fps = 30;
    let bps = 0;
    try {
      const est = await video.computePacketStats(240);
      fps = est.averagePacketRate || 30;
      bps = est.averageBitrate || 0;
    } catch { /* 30 fps, bitrate desconocido */ }
    const area = (await video.getDisplayWidth()) * (await video.getDisplayHeight());
    return { p, input, video, audio: audio && (await audio.canDecode()) ? audio : null, desde, hasta, dur: Math.max(0, hasta - desde), fps, bps, area };
  }));
  // El vídeo final va al ritmo del clip más fluido, sin pasar de 60.
  const fps = Math.min(60, Math.max(24, Math.round(Math.max(30, ...abiertas.map(a => a.fps)))));
  const total = abiertas.reduce((s, a) => s + a.dur, 0) || 1;
  const primero = abiertas.find(a => a.video);
  // H.264 pide medidas pares.
  const par = (n: number) => Math.max(2, Math.round(n / 2) * 2);
  const anchoOriginal = primero ? await primero.video.getDisplayWidth() : 1920;
  const altoOriginal = primero ? await primero.video.getDisplayHeight() : 1080;
  const escala = !opts.width && !opts.height && opts.alto ? opts.alto / altoOriginal : 1;
  const width = par(opts.width ?? anchoOriginal * escala);
  const height = par(opts.height ?? altoOriginal * escala);

  // ---- salida ----------------------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas not available');
  suavizar(ctx);
  // Sin WebGL no hay nitidez, pero se exporta igual.
  const fuerza = Math.max(0, Math.min(1, opts.nitidez || 0));
  const filtro = fuerza > 0 ? crearNitidez(width, height) : null;
  /** Afila lo que hay en el lienzo (el fotograma), antes de la marca y los fundidos. */
  const afilar = () => { if (filtro) ctx.drawImage(filtro.aplicar(canvas, fuerza), 0, 0); };
  /** Encaja una imagen o fotograma en el lienzo, escalando con suavizado alto. */
  const encajar = (src: CanvasImageSource, w: number, h: number) => {
    const k = Math.min(width / w, height / h);
    ctx.drawImage(src, (width - w * k) / 2, (height - h * k) / 2, w * k, h * k);
  };

  /**
   * Bitrate de salida: el del clip original por píxel, escalado al tamaño de
   * salida y con margen (x1,5) para que recomprimir no se note; algo más si se
   * afila, porque la nitidez añade detalle fino que también cuesta bits.
   * Medido con un clip de Rust (7,5 Mbps, mucha hierba): x2,2 pesaba un 50 %
   * más sin diferencia visible (45 dB entre una y otra), y x1,5 pierde 0,35 dB
   * frente al cuantizador 20 ocupando la mitad. Sin dato del original, la
   * tabla de recorder.ts.
   */
  function bitrateDeSalida() {
    const conDato = abiertas.filter(a => a.bps > 0 && a.area > 0);
    if (!conDato.length) return bitrateDeGrabacion(height);
    const porPixel = Math.max(...conDato.map(a => a.bps / a.area));
    const objetivo = porPixel * width * height * 1.5 * (fuerza > 0 ? 1.25 : 1);
    return Math.round(Math.max(6_000_000, Math.min(45_000_000, objetivo)));
  }

  const aac = await canEncodeAudio('aac', { numberOfChannels: 2, sampleRate: FRECUENCIA }).catch(() => false);
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
  const fuenteVideo = new CanvasSource(canvas, {
    codec: 'avc',
    // Calidad constante (como el CRF de ffmpeg); si el codificador no la
    // admite, una tasa holgada para que recomprimir no se note.
    quality: new Quality({ bitrate: bitrateDeSalida() }),
    keyFrameInterval: 2,
  });
  const fuenteAudio = new AudioBufferSource({ codec: aac ? 'aac' : 'opus', quality: new Quality({ bitrate: 192_000 }) });
  output.addVideoTrack(fuenteVideo, { frameRate: fps });
  output.addAudioTrack(fuenteAudio);
  await output.start();

  const cancelar = async () => { try { await output.cancel(); } catch { /* ya cancelado */ } };
  const negro = () => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height); };
  /** Opacidad del velo negro del fundido en el segundo t de una pieza de d. */
  const velo = (t: number, d: number) => (!opts.fade || d <= FUNDIDO * 2 ? 0
    : t < FUNDIDO ? 1 - t / FUNDIDO : t > d - FUNDIDO ? 1 - (d - t) / FUNDIDO : 0);

  try {
    let acumulado = 0;
    for (let i = 0; i < abiertas.length; i += 1) {
      const a = abiertas[i];
      const { p, dur } = a;
      const fotogramas = Math.max(1, Math.round(dur * fps));
      const conMarca = !!opts.watermark && !p.propio;

      const pintarEncima = (t: number) => {
        if (conMarca) drawWatermarkOnCanvas(ctx, opts.watermark!, p.channelName, width, height, t, dur);
        const alfa = velo(t, dur);
        if (alfa > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, alfa)})`; ctx.fillRect(0, 0, width, height); }
      };
      const avisar = (t: number) => onProgress?.({
        index: i + 1, total: abiertas.length, elapsed: acumulado + t, duration: total,
        pct: Math.min(100, Math.round(((acumulado + t) / total) * 100)),
      });

      // ---- imagen ----
      if (!a.video) {
        const img = await createImageBitmap(p.blob);
        for (let f = 0; f < fotogramas; f += 1) {
          if (signal?.aborted) throw abortado();
          const t = f / fps;
          negro();
          encajar(img, img.width, img.height);
          afilar();
          pintarEncima(t);
          await fuenteVideo.add(acumulado + t, 1 / fps);
          if (f % 15 === 0) avisar(t);
        }
        img.close();
        await fuenteAudio.add(new AudioBuffer({ length: Math.max(1, Math.round(dur * FRECUENCIA)), numberOfChannels: 2, sampleRate: FRECUENCIA }));
        acumulado += dur;
        continue;
      }

      // ---- vídeo: el fotograma exacto de cada instante del resultado ----
      // A su tamaño: el escalado (p. ej. a 1440p) lo hace encajar() con
      // suavizado alto, que deja mejor base para la nitidez.
      const sink = new CanvasSink(a.video, { poolSize: 2 });
      const instantes = (function* () { for (let f = 0; f < fotogramas; f += 1) yield a.desde + f / fps; })();
      let f = 0;
      for await (const envuelto of sink.canvasesAtTimestamps(instantes)) {
        if (signal?.aborted) throw abortado();
        const t = f / fps;
        negro();
        if (envuelto) encajar(envuelto.canvas, envuelto.canvas.width, envuelto.canvas.height);
        afilar();
        pintarEncima(t);
        await fuenteVideo.add(acumulado + t, 1 / fps);
        if (f % 15 === 0) avisar(t);
        f += 1;
      }

      // ---- su audio: recortado, a su volumen y con los fundidos ----
      const largo = Math.max(1, Math.round(dur * FRECUENCIA));
      const mezcla = new OfflineAudioContext(2, largo, FRECUENCIA);
      const ganancia = mezcla.createGain();
      ganancia.connect(mezcla.destination);
      const vol = p.volumen ?? 1;
      if (opts.fade && dur > FUNDIDO * 2) {
        ganancia.gain.setValueAtTime(0, 0);
        ganancia.gain.linearRampToValueAtTime(vol, FUNDIDO);
        ganancia.gain.setValueAtTime(vol, dur - FUNDIDO);
        ganancia.gain.linearRampToValueAtTime(0, dur);
      } else {
        ganancia.gain.value = vol;
      }
      if (a.audio && vol > 0) {
        const sinkAudio = new AudioBufferSink(a.audio);
        for await (const trozo of sinkAudio.buffers(a.desde, a.hasta)) {
          if (signal?.aborted) throw abortado();
          const nodo = mezcla.createBufferSource();
          nodo.buffer = trozo.buffer;
          nodo.connect(ganancia);
          const cuando = trozo.timestamp - a.desde;
          if (cuando >= 0) nodo.start(cuando);
          else if (-cuando < trozo.duration) nodo.start(0, -cuando);
        }
      }
      await fuenteAudio.add(await mezcla.startRendering());
      acumulado += dur;
    }

    fuenteVideo.close();
    fuenteAudio.close();
    await output.finalize();
    const buffer = (output.target as BufferTarget).buffer;
    if (!buffer) throw new Error('Empty output');
    return new Blob([buffer], { type: 'video/mp4' });
  } catch (e) {
    await cancelar();
    throw e;
  } finally {
    filtro?.liberar();
    abiertas.forEach(a => { try { a.input?.dispose(); } catch { /* ya cerrado */ } });
  }
};
