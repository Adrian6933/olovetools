// ============================================================================
// Bajar (y marcar) muchos clips a la vez
// ----------------------------------------------------------------------------
// El ZIP con marca iba de uno en uno: bajar el clip 1, incrustarle la marca,
// bajar el 2... La red y el render se esperaban el uno al otro. Aquí van en
// cadena: mientras se marca un clip ya se están bajando los siguientes, y si el
// navegador exporta fotograma a fotograma (exportOffline.ts) se marcan varios a la
// vez. Con la grabación en tiempo real de reserva, uno: dos MediaRecorder a la
// vez se pelean por la tarjeta y salen con saltos.
// ============================================================================
import type { ClipData, Resolution, WatermarkConfig } from './types';
import { processVideoWithWatermark } from './watermarkService';
import type { Encaje, Formato } from './formato';

/** Descargas a la vez: más no acelera (el ancho de banda es el mismo) y satura los relés. */
export const DESCARGAS_A_LA_VEZ = 4;

/** La resolución que toca a un clip: la pedida si la tiene, si no la mejor. */
export const resolucionDe = (c: ClipData, quality: string): Resolution =>
  quality === 'max'
    ? c.resolutions[0]
    : c.resolutions.find(r => r.quality === `${quality}p`)
      || c.resolutions.find(r => r.quality.startsWith(quality))
      || c.resolutions[0];

/** Como mucho n tareas a la vez, en el orden en que se piden. */
export const semaforo = (n: number) => {
  let libres = n;
  const cola: Array<() => void> = [];
  return async <R>(fn: () => Promise<R>): Promise<R> => {
    if (libres > 0) libres -= 1;
    else await new Promise<void>(r => cola.push(r));
    try {
      return await fn();
    } finally {
      const siguiente = cola.shift();
      if (siguiente) siguiente();
      else libres += 1;
    }
  };
};

/** ¿Cuántos clips se pueden marcar a la vez en este navegador? */
const rendersALaVez = async (): Promise<number> => {
  try {
    const { sePuedeSinTiempoReal } = await import('./exportOffline');
    // Una pieza de prueba vacía: solo se mira si hay codificador.
    if (!(await sePuedeSinTiempoReal([{ blob: new Blob(), channelName: '' }], 1920, 1080))) return 1;
    // Medido con 4 clips de 8 s a 1080p60: 1 a la vez 29 s, 2 16 s, 3 14 s,
    // 4 12 s. Pasado 2 se gana poco y cada uno más es otro vídeo entero
    // decodificándose en memoria, así que 3 solo en equipos con margen.
    return (navigator.hardwareConcurrency || 4) >= 8 ? 3 : 2;
  } catch {
    return 1;
  }
};

export interface ProgresoLote {
  /** Clips terminados (bien o mal). */
  hechos: number;
  total: number;
  /** 0-100, sumando lo bajado y lo marcado de cada clip. */
  pct: number;
  /** Cuántos se están bajando y cuántos marcando ahora mismo. */
  bajando: number;
  marcando: number;
  fallos: number;
}

export interface ResultadoClip {
  clip: ClipData;
  res: Resolution;
  /**
   * Tal cual llega de la plataforma; null si no se pudo bajar. Con marca solo
   * se guarda si se pide (guardarOriginal): si no, serían dos copias de cada
   * clip en memoria para nada.
   */
  original: Blob | null;
  /** Con la marca si se pidió (si no, el original); null si falló. */
  final: Blob | null;
}

export interface OpcionesLote {
  quality: string;
  fetchMovieBlob: (url: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal) => Promise<Blob>;
  /** Sin marca ni formato, solo se bajan. */
  marca?: { config: WatermarkConfig; nitidez?: number; alto?: number } | null;
  /** Pasarlos a 16:9 o 9:16 (formato.ts); 'original' o nada, tal cual. */
  formato?: Formato;
  encaje?: Encaje;
  /** Nitidez y alto cuando se recodifica solo por el formato. */
  calidad?: { nitidez?: number; alto?: number };
  guardarOriginal?: boolean;
  signal?: AbortSignal;
  onProgress?: (p: ProgresoLote) => void;
}

/**
 * Baja todos los clips (y les pone la marca, si se pide) en paralelo.
 * Un clip que falla no para a los demás: sale con null y cuenta en `fallos`.
 * Devuelve en el mismo orden que `clips`.
 */
export const procesarClips = async (clips: ClipData[], o: OpcionesLote): Promise<ResultadoClip[]> => {
  const bajar = semaforo(DESCARGAS_A_LA_VEZ);
  const reformatear = !!o.formato && o.formato !== 'original';
  // Cambiar el formato sin marca solo se puede fotograma a fotograma; donde
  // no hay WebCodecs, salen tal cual en vez de no salir.
  const aLaVez = o.marca || reformatear ? await rendersALaVez() : 1;
  const procesar = !!o.marca || (reformatear && aLaVez > 1);
  const marcar = semaforo(aLaVez);
  // Con marca, bajar es una parte pequeña del trabajo de cada clip.
  const pesoBajada = procesar ? 0.25 : 1;
  const avance = clips.map(() => 0);
  let hechos = 0;
  let fallos = 0;
  let bajando = 0;
  let marcando = 0;
  let ultimo = 0;

  const avisar = (forzar = false) => {
    const ahora = Date.now();
    // Muchos clips a la vez avisan cientos de veces por segundo; React no
    // necesita repintar más de unas diez.
    if (!forzar && ahora - ultimo < 100) return;
    ultimo = ahora;
    const pct = Math.round((avance.reduce((s, x) => s + x, 0) / Math.max(1, clips.length)) * 100);
    o.onProgress?.({ hechos, total: clips.length, pct: Math.min(100, pct), bajando, marcando, fallos });
  };

  const uno = async (clip: ClipData, i: number): Promise<ResultadoClip> => {
    const res = resolucionDe(clip, o.quality);
    let original: Blob | null = null;
    let final: Blob | null = null;
    try {
      if (!res) throw new Error('No resolution');
      original = await bajar(async () => {
        if (o.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        bajando += 1;
        avisar(true);
        try {
          return await o.fetchMovieBlob(res.url, (l, t) => {
            avance[i] = (t > 0 ? Math.min(1, l / t) : 0) * pesoBajada;
            avisar();
          }, o.signal);
        } finally {
          bajando -= 1;
        }
      });
      avance[i] = pesoBajada;
      if (procesar) {
        const m = o.marca;
        final = await marcar(async () => {
          if (o.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
          marcando += 1;
          avisar(true);
          const progreso = (pct: number) => { avance[i] = pesoBajada + (1 - pesoBajada) * (pct / 100); avisar(); };
          try {
            if (m) {
              return await processVideoWithWatermark(
                original!,
                clip.broadcaster || 'Streamer',
                m.config,
                ({ pct }) => progreso(pct),
                o.signal,
                { nitidez: m.nitidez, alto: m.alto, formato: o.formato, encaje: o.encaje },
              );
            }
            const { exportarSinTiempoReal } = await import('./exportOffline');
            const alto = o.calidad?.alto;
            return await exportarSinTiempoReal(
              [{ blob: original!, channelName: clip.broadcaster || '' }],
              { formato: o.formato, encaje: o.encaje, nitidez: o.calidad?.nitidez, alto: alto && alto > 1080 ? alto : undefined },
              p => progreso(p.pct),
              o.signal,
            );
          } finally {
            marcando -= 1;
          }
        });
      } else {
        final = original;
      }
    } catch (e) {
      if (!o.signal?.aborted) {
        fallos += 1;
        console.error(`Clip ${clip.id} failed`, e);
      }
    }
    avance[i] = 1;
    hechos += 1;
    avisar(true);
    return { clip, res, original: procesar && !o.guardarOriginal ? null : original, final };
  };

  const resultados = await Promise.all(clips.map(uno));
  if (o.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  return resultados;
};

/** Suelta un blob como descarga del navegador. */
export const soltarDescarga = (blob: Blob, nombre: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Con retardo y generoso: son archivos grandes y Safari cancela la descarga
  // si la object URL desaparece antes de tiempo.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
