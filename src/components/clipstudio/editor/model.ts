// ============================================================================
// Editor de clips: el modelo
// ----------------------------------------------------------------------------
// La línea de tiempo es una lista de piezas. Cada pieza apunta a un vídeo (un
// clip descargado o uno propio) o a una imagen, y guarda qué trozo se usa, a
// qué volumen y a qué velocidad. Cortar en dos no copia el vídeo: crea otra
// pieza que apunta al mismo original con otro tramo.
// ============================================================================
import type { ClipData } from '../types';
import type { MergeItem } from '../mergeService';

export type PiezaTipo = 'clip' | 'video' | 'imagen';

export interface Pieza {
  id: string;
  tipo: PiezaTipo;
  nombre: string;
  /** Canal del streamer, para su marca de agua. Vacío en lo propio. */
  canal: string;
  /** Clip del que sale (para quitarla si el clip se quita de la lista). */
  clipId?: string;
  /**
   * Vídeo o imagen propios: id del original. Al cortar o duplicar se copia,
   * así que todas las piezas del mismo archivo comparten una sola fuente.
   */
  fuente?: string;
  /** Miniatura para la línea de tiempo. */
  thumb: string;
  /** Duración del original (vídeo) o segundos en pantalla (imagen). */
  total: number;
  /** Tramo usado, en segundos del original. En imágenes: 0..total. */
  inicio: number;
  fin: number;
  volumen: number;
  silencio: boolean;
  velocidad: number;
}

/** Lo que dura la pieza en el vídeo final. */
export const durFinal = (p: Pieza) =>
  p.tipo === 'imagen' ? p.total : Math.max(0, p.fin - p.inicio) / (p.velocidad || 1);

export const nuevoId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const mmss = (seg: number, decimas = false) => {
  // Sin décimas se redondea: 6,99 s es "0:07", no "0:06".
  const s = decimas ? Math.max(0, seg) : Math.round(Math.max(0, seg));
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return decimas ? `${m}:${r.toFixed(1).padStart(4, '0')}` : `${m}:${String(Math.floor(r)).padStart(2, '0')}`;
};

export const piezaDeClip = (c: ClipData): Pieza => ({
  id: nuevoId(),
  tipo: 'clip',
  nombre: c.title,
  canal: c.broadcaster || 'Streamer',
  clipId: c.id,
  thumb: c.thumbnail,
  total: c.duration || 0,
  inicio: 0,
  fin: c.duration || 0,
  volumen: 1,
  silencio: false,
  velocidad: 1,
});

// ---- Fuentes: el vídeo de cada pieza, ya en memoria -------------------------
// Se descargan una vez y se reutilizan: cortar en dos, duplicar, volver a
// abrir el editor o exportar no vuelven a bajar nada.

export interface Fuente {
  blob: Blob;
  url: string;
}

const fuentes = new Map<string, Fuente>();
const enCurso = new Map<string, Promise<Fuente>>();
/** Tiras de fotogramas ya sacadas, por URL de la fuente. */
const tiras = new Map<string, string[]>();

/** La fuente de una pieza: por clip (clipId) o por pieza propia (id). */
export const claveFuente = (p: Pieza) => p.clipId ? `clip:${p.clipId}` : `propio:${p.fuente || p.id}`;

export const fuenteLista = (p: Pieza): Fuente | undefined => fuentes.get(claveFuente(p));

export const registrarFuente = (clave: string, blob: Blob): Fuente => {
  const previa = fuentes.get(clave);
  if (previa) return previa;
  const f = { blob, url: URL.createObjectURL(blob) };
  fuentes.set(clave, f);
  return f;
};

/**
 * Olvida todos los vídeos guardados (al empezar con otra lista de clips).
 * Cada clip está entero en memoria: sin soltarlos, cada búsqueda nueva iba
 * sumando RAM hasta cerrar la pestaña.
 */
export const soltarFuentes = () => {
  fuentes.forEach(f => URL.revokeObjectURL(f.url));
  fuentes.clear();
  tiras.clear();
  tirasEnCurso.clear();
};

export const obtenerFuente = (clave: string, descargar: () => Promise<Blob>): Promise<Fuente> => {
  const ya = fuentes.get(clave);
  if (ya) return Promise.resolve(ya);
  const pendiente = enCurso.get(clave);
  if (pendiente) return pendiente;
  const p = descargar()
    .then(blob => registrarFuente(clave, blob))
    .finally(() => enCurso.delete(clave));
  enCurso.set(clave, p);
  return p;
};

/** Para exportar: la pieza como tramo de mergeClipsToVideo. */
export const aMergeItem = (p: Pieza): MergeItem => {
  const f = fuenteLista(p);
  if (!f) throw new Error('Source not ready');
  if (p.tipo === 'imagen') {
    return { blob: f.blob, channelName: '', propio: true, imagenSegundos: p.total };
  }
  return {
    blob: f.blob,
    channelName: p.canal,
    propio: p.tipo !== 'clip',
    inicio: p.inicio,
    fin: p.fin,
    volumen: p.silencio ? 0 : p.volumen,
    velocidad: p.velocidad,
  };
};

// ---- Tira de fotogramas para recortar --------------------------------------

/** Tiras a medio sacar: pedir la misma otra vez espera a esta. */
const tirasEnCurso = new Map<string, Promise<string[]>>();
/** Una tira detrás de otra: cada una es un <video> decodificando el clip. */
let colaTiras: Promise<unknown> = Promise.resolve();

/**
 * N fotogramas repartidos por el vídeo, como miniaturas JPEG.
 *
 * La línea de tiempo la pide otra vez cada vez que cambian las piezas (y al
 * bajar cada clip cambian todas, porque se corrige su duración). Antes solo se
 * recordaba al terminar, así que mientras tanto cada petición abría OTRO
 * <video> con el clip entero a 1080p: con varios clips se juntaban decenas y
 * la RAM se disparaba. Ahora una petición por tira y de una en una.
 */
export const tiraDeFotogramas = (url: string, total: number, n = 10): Promise<string[]> => {
  const clave = `${url}#${n}`;
  const ya = tiras.get(clave);
  if (ya) return Promise.resolve(ya);
  const pendiente = tirasEnCurso.get(clave);
  if (pendiente) return pendiente;
  const p = colaTiras.then(() => sacarTira(url, total, n)).then(salida => {
    tiras.set(clave, salida);
    return salida;
  }).finally(() => tirasEnCurso.delete(clave));
  colaTiras = p.catch(() => undefined);
  tirasEnCurso.set(clave, p);
  return p;
};

const sacarTira = async (url: string, total: number, n: number): Promise<string[]> => {
  const v = document.createElement('video');
  v.muted = true;
  v.preload = 'auto';
  v.src = url;
  // Con tiempo límite: un salto que no llega dejaba el <video> vivo para siempre.
  const esperar = (prep: (listo: () => void, fallo: () => void) => void) => new Promise<void>((resolve, reject) => {
    const reloj = setTimeout(() => reject(new Error('timeout')), 8000);
    prep(() => { clearTimeout(reloj); resolve(); }, () => { clearTimeout(reloj); reject(new Error('unreadable')); });
  });
  try {
    await esperar((listo, fallo) => { v.onloadeddata = listo; v.onerror = fallo; });
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 54;
    const x = c.getContext('2d')!;
    const salida: string[] = [];
    for (let i = 0; i < n; i += 1) {
      const t = Math.min(Math.max(0, total - 0.05), ((i + 0.5) / n) * total);
      await esperar(listo => { v.onseeked = listo; v.currentTime = t; });
      x.fillStyle = '#000';
      x.fillRect(0, 0, 96, 54);
      const k = Math.min(96 / (v.videoWidth || 96), 54 / (v.videoHeight || 54));
      const w = (v.videoWidth || 96) * k;
      const h = (v.videoHeight || 54) * k;
      x.drawImage(v, (96 - w) / 2, (54 - h) / 2, w, h);
      salida.push(c.toDataURL('image/jpeg', 0.6));
    }
    return salida;
  } finally {
    v.onloadeddata = v.onerror = v.onseeked = null;
    v.removeAttribute('src');
    v.load();
  }
};
