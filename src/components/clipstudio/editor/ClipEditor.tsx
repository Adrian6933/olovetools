// ============================================================================
// Editor de clips
// ----------------------------------------------------------------------------
// Pantalla completa con los clips ya cargados en la herramienta: recortar,
// cortar en dos, reordenar, duplicar, quitar, volumen, velocidad, meter vídeos
// o imágenes propios, ver el resultado seguido y exportarlo como un solo vídeo
// o como archivos sueltos en un ZIP. Todo en el navegador.
//
// Los clips se descargan al abrir (una vez: la caché vive en model.ts) para
// poder saltar a cualquier punto al instante y para exportar sin volver a
// bajarlos. La reproducción se vigila con setInterval y no con rAF, que en
// segundo plano se para (ver pestana-oculta-sin-fotogramas).
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Scissors, X, Play, Pause, SkipBack, SkipForward, ListVideo, Plus, Copy, Trash2, ChevronLeft, ChevronRight,
  Volume2, VolumeX, RotateCcw, Download, Loader2, Blend, Sparkles, Film, Package, AlertCircle,
  ChevronsLeft, ChevronsRight, ArrowLeftToLine, ArrowRightToLine, Crop, Undo2, Redo2,
  Clock, Gauge, Keyboard, ChevronDown, Image as ImageIcon, Wand2, Languages, Maximize, Move,
} from 'lucide-react';
import type { ClipData, WatermarkConfig } from '../types';
import { useBrand } from '../brand';
import { duracionDe, mergeClipsToVideo, soltarVideo } from '../mergeService';
import { loadStoredWatermarkConfig, nombreDeArchivo } from '../watermarkService';
import { zipEnBlob, type EntradaZip } from '../zipBlob';
import { prepararVideo } from './ownMedia';
import CalidadSelector from '../CalidadSelector';
import AvisoGrafica from '../AvisoGrafica';
import { FUERZA, guardarCalidad, leerCalidad, type CalidadExport } from '../nitidez';
import TrimBar from './TrimBar';
import Timeline from './Timeline';
import GaleriaAnimaciones from './GaleriaAnimaciones';
import { IDIOMAS_ANIM, PLANTILLAS, dibujarCapas, plantilla, type Capa, type IdiomaAnim, type PlantillaId } from './animaciones';
import { POS_MAX, POS_MIN } from '../watermarkService';
import {
  aMergeItem, claveFuente, durFinal, fuenteLista, mmss, nuevoId, obtenerFuente, piezaDeClip, registrarFuente,
  tiraDeFotogramas, type Pieza,
} from './model';

interface Props {
  clips: ClipData[];
  piezas: Pieza[];
  setPiezas: React.Dispatch<React.SetStateAction<Pieza[]>>;
  /** Clip con el que abrir seleccionado (botón "Editar" de una tarjeta). */
  enfoque?: string | null;
  quality: string;
  watermarkOn: boolean;
  watermarkConfig: WatermarkConfig | null;
  t: any;
  onClose: () => void;
  /**
   * Sin marca de agua (el editor suelto, con vídeos propios): no hay canal ni
   * plataforma que firmar, así que el interruptor no se enseña.
   */
  sinMarca?: boolean;
  /**
   * Animaciones encima del vídeo (suscríbete...). Viven en el padre, como las
   * piezas, para que cerrar el editor no las pierda; sin ellas, en el editor.
   */
  capas?: Capa[];
  setCapas?: React.Dispatch<React.SetStateAction<Capa[]>>;
}

const VELOCIDADES = [0.5, 0.75, 1, 1.5, 2];
/** Lo más corto que puede quedar un trozo al cortar o recortar. */
const MIN_TRAMO = 0.3;
const FOTOGRAMA = 1 / 30;
/** m:ss.cc — con centésimas, para que se note avanzar un fotograma. */
const reloj = (seg: number) => {
  const s = Math.max(0, seg);
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(2).padStart(5, '0')}`;
};

type Export =
  | { fase: 'preparando'; pct: number }
  | { fase: 'grabando'; pieza: number; total: number; pct: number; queda: number };

const ClipEditor: React.FC<Props> = ({ clips, piezas, setPiezas, enfoque, quality, watermarkOn, watermarkConfig, t, onClose, sinMarca = false, capas: capasPadre, setCapas: setCapasPadre }) => {
  const brand = useBrand();
  const tx = (k: string, fb: string) => (typeof t?.[k] === 'string' && t[k]) || fb;
  const [capasPropias, setCapasPropias] = useState<Capa[]>([]);
  const capas = capasPadre ?? capasPropias;
  const setCapas = setCapasPadre ?? setCapasPropias;

  // ---- piezas en sincronía con los clips de la herramienta ----------------
  useEffect(() => {
    setPiezas(prev => {
      const ids = new Set(clips.map(c => c.id));
      const quedan = prev.filter(p => !p.clipId || ids.has(p.clipId));
      const con = new Set(quedan.map(p => p.clipId).filter(Boolean));
      const nuevas = clips.filter(c => !con.has(c.id)).map(piezaDeClip);
      return nuevas.length || quedan.length !== prev.length ? [...quedan, ...nuevas] : prev;
    });
  }, [clips, setPiezas]);

  const [selId, setSelId] = useState<string | null>(null);
  useEffect(() => {
    if (selId && piezas.some(p => p.id === selId)) return;
    const inicial = (enfoque && piezas.find(p => p.clipId === enfoque)) || piezas[0];
    setSelId(inicial?.id ?? null);
  }, [piezas, enfoque, selId]);
  const sel = piezas.find(p => p.id === selId) || null;
  const selIdx = sel ? piezas.indexOf(sel) : -1;

  // ---- descarga de los clips (una vez) ------------------------------------
  const [cargas, setCargas] = useState<Record<string, { pct: number; error?: boolean }>>({});
  const [, forzar] = useState(0);
  const resUrl = useCallback((c: ClipData) => {
    const r = quality === 'max'
      ? c.resolutions[0]
      : c.resolutions.find(x => x.quality === `${quality}p`) || c.resolutions.find(x => x.quality.startsWith(quality)) || c.resolutions[0];
    return r.url;
  }, [quality]);

  useEffect(() => {
    let vivo = true;
    const pendientes = clips.filter(c => !fuenteLista({ clipId: c.id } as Pieza));
    let i = 0;
    const trabajar = async () => {
      while (vivo && i < pendientes.length) {
        const c = pendientes[i++];
        const clave = `clip:${c.id}`;
        try {
          const f = await obtenerFuente(clave, () => brand.fetchMovieBlob(resUrl(c), (l, tot) => {
            if (vivo) setCargas(prev => ({ ...prev, [clave]: { pct: tot > 0 ? Math.round((l / tot) * 100) : 0 } }));
          }));
          // La duración de verdad: la de la API va redondeada y recortar al
          // final con ella dejaba el último segundo fuera o pedía de más.
          const v = document.createElement('video');
          v.muted = true;
          v.preload = 'metadata';
          v.src = f.url;
          const real = await duracionDe(v);
          soltarVideo(v);
          if (vivo && real > 0) {
            setPiezas(prev => prev.map(p => p.clipId === c.id
              ? { ...p, total: real, fin: Math.abs(p.fin - p.total) < 0.01 || p.fin > real ? real : p.fin }
              : p));
          }
          if (vivo) setCargas(prev => ({ ...prev, [clave]: { pct: 100 } }));
        } catch {
          if (vivo) setCargas(prev => ({ ...prev, [clave]: { pct: 0, error: true } }));
        }
      }
    };
    // Tres a la vez, como el ZIP.
    Promise.all([trabajar(), trabajar(), trabajar()]).then(() => vivo && forzar(n => n + 1));
    return () => { vivo = false; };
  }, [clips, brand, resUrl, setPiezas]);

  const lista = (p: Pieza | null) => !!p && !!fuenteLista(p);
  const pendientesCarga = clips.filter(c => !fuenteLista({ clipId: c.id } as Pieza)).length;
  // Solo importa si la pieza elegida ya está: el progreso de las demás no
  // debe recargarla (antes el cursor volvía al inicio con cada avance).
  const selLista = lista(sel);

  // ---- tira de fotogramas de la pieza elegida ----------------------------
  const [frames, setFrames] = useState<string[]>([]);
  useEffect(() => {
    setFrames([]);
    if (!sel || sel.tipo === 'imagen') return;
    const f = fuenteLista(sel);
    if (!f || sel.total <= 0) return;
    let vivo = true;
    tiraDeFotogramas(f.url, sel.total).then(fr => { if (vivo) setFrames(fr); }).catch(() => {});
    return () => { vivo = false; };
  }, [sel?.id, sel?.total, selLista]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- reproductor --------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [todo, setTodo] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const imagenDesde = useRef(0);
  const selRef = useRef(sel);
  selRef.current = sel;

  /** Carga una pieza en el reproductor, en el punto pedido del original. */
  const cargar = useCallback((p: Pieza, en?: number) => {
    const v = videoRef.current;
    const destino = Math.max(p.inicio, Math.min(p.fin - 0.05, en ?? p.inicio));
    setTiempo(destino);
    if (p.tipo === 'imagen') { imagenDesde.current = performance.now() - destino * 1000; return; }
    const f = fuenteLista(p);
    if (!v || !f) return;
    if (v.dataset.src !== f.url) {
      v.src = f.url;
      v.dataset.src = f.url;
    }
    const aplicar = () => {
      v.currentTime = destino;
      v.playbackRate = p.velocidad;
      v.volume = p.volumen;
      v.muted = p.silencio;
    };
    if (v.readyState >= 1) aplicar(); else v.addEventListener('loadedmetadata', aplicar, { once: true });
  }, []);

  // Al elegir otra pieza (o al terminar de descargarse), se muestra.
  useEffect(() => {
    if (sel && selLista) cargar(sel);
  }, [sel?.id, selLista]); // eslint-disable-line react-hooks/exhaustive-deps

  // Volumen y velocidad se aplican al momento mientras suena.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !sel || sel.tipo === 'imagen') return;
    v.playbackRate = sel.velocidad;
    v.volume = sel.volumen;
    v.muted = sel.silencio;
  }, [sel?.velocidad, sel?.volumen, sel?.silencio]); // eslint-disable-line react-hooks/exhaustive-deps

  const parar = () => { videoRef.current?.pause(); setReproduciendo(false); setTodo(false); };

  const reproducir = (desdeTodo = false) => {
    const p = selRef.current;
    if (!p || !lista(p)) return;
    setTodo(desdeTodo);
    setReproduciendo(true);
    if (p.tipo === 'imagen') { imagenDesde.current = performance.now() - (tiempo - p.inicio) * 1000; return; }
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= p.fin - 0.06 || v.currentTime < p.inicio - 0.01) v.currentTime = p.inicio;
    v.play().catch(() => setReproduciendo(false));
  };

  const reproducirTodo = () => {
    const primera = piezas[0];
    if (!primera) return;
    setSelId(primera.id);
    cargar(primera);
    setTimeout(() => reproducir(true), 60);
  };

  // Vigilancia de la reproducción: avanzar el tiempo, cortar al final del
  // tramo y, en "todo", pasar a la pieza siguiente.
  useEffect(() => {
    if (!reproduciendo) return;
    const id = setInterval(() => {
      const p = selRef.current;
      if (!p) return;
      let ahora: number;
      if (p.tipo === 'imagen') {
        ahora = (performance.now() - imagenDesde.current) / 1000;
      } else {
        const v = videoRef.current;
        if (!v) return;
        ahora = v.currentTime;
      }
      setTiempo(ahora);
      if (ahora >= p.fin - 0.04) {
        const i = piezas.findIndex(x => x.id === p.id);
        const sig = piezas[i + 1];
        if (todo && sig && lista(sig)) {
          setSelId(sig.id);
          cargar(sig);
          if (sig.tipo !== 'imagen') setTimeout(() => videoRef.current?.play().catch(() => {}), 40);
          else videoRef.current?.pause();
        } else {
          videoRef.current?.pause();
          setReproduciendo(false);
          setTodo(false);
        }
      }
    }, 40);
    return () => clearInterval(id);
  }, [reproduciendo, todo, piezas, cargar]);

  const buscarEnPieza = (tOrig: number) => {
    if (!sel) return;
    const v = videoRef.current;
    const destino = Math.max(0, Math.min(sel.total, tOrig));
    setTiempo(destino);
    if (sel.tipo === 'imagen') { imagenDesde.current = performance.now() - destino * 1000; return; }
    if (v) v.currentTime = destino;
  };

  // Posición en el vídeo final y salto desde la línea de tiempo.
  const totalFinal = piezas.reduce((s, p) => s + durFinal(p), 0);
  const posicion = useMemo(() => {
    let acc = 0;
    for (const p of piezas) {
      if (p.id === sel?.id) return acc + Math.max(0, (tiempo - p.inicio) / (p.tipo === 'imagen' ? 1 : p.velocidad));
      acc += durFinal(p);
    }
    return 0;
  }, [piezas, sel?.id, tiempo]);

  /**
   * Lleva el cursor a un segundo del vídeo final. Justo en un corte manda la
   * pieza que EMPIEZA ahí (antes mandaba la que acababa, y se veía su último
   * fotograma). Con `id`, la pieza es esa y el tiempo se encaja en ella: al
   * pulsar una pieza cerca de su borde, el tiempo caía al otro lado del corte
   * y el reproductor cargaba la vecina con la pulsada elegida.
   */
  const saltarGlobal = (tg: number, id?: string) => {
    let acc = 0;
    for (let i = 0; i < piezas.length; i += 1) {
      const p = piezas[i];
      const d = durFinal(p);
      const ultima = i === piezas.length - 1;
      if (id ? p.id === id : tg < acc + d || ultima) {
        const local = Math.max(0, Math.min(d - 0.01, tg - acc));
        const tOrig = p.inicio + local * (p.tipo === 'imagen' ? 1 : p.velocidad);
        setSelId(p.id);
        cargar(p, tOrig);
        return;
      }
      acc += d;
    }
  };

  // ---- edición ------------------------------------------------------------
  // Deshacer: antes de cada edición se guarda la lista como estaba. Arrastrar
  // un tirador guarda una sola vez, al cogerlo, y no en cada movimiento.
  // Cada paso guarda piezas Y animaciones: deshacer vale para las dos.
  type Paso = { piezas: Pieza[]; capas: Capa[] };
  const historial = useRef<Paso[]>([]);
  const rehechos = useRef<Paso[]>([]);
  const [hayDeshacer, setHayDeshacer] = useState(false);
  const [hayRehacer, setHayRehacer] = useState(false);
  const piezasRef = useRef(piezas);
  piezasRef.current = piezas;
  const capasRef = useRef(capas);
  capasRef.current = capas;
  const ultimoGuardado = useRef(0);
  const guardar = useCallback((agrupar = false) => {
    const ahora = performance.now();
    const seguido = agrupar && ahora - ultimoGuardado.current < 700;
    ultimoGuardado.current = ahora;
    if (seguido) return;
    historial.current.push({ piezas: piezasRef.current, capas: capasRef.current });
    if (historial.current.length > 60) historial.current.shift();
    // Una edición nueva tira lo que se podía rehacer.
    rehechos.current = [];
    setHayRehacer(false);
    setHayDeshacer(true);
  }, []);
  const deshacer = () => {
    const previo = historial.current.pop();
    setHayDeshacer(historial.current.length > 0);
    if (!previo) return;
    rehechos.current.push({ piezas: piezasRef.current, capas: capasRef.current });
    setHayRehacer(true);
    parar();
    setPiezas(previo.piezas);
    setCapas(previo.capas);
  };
  const rehacer = () => {
    const siguiente = rehechos.current.pop();
    setHayRehacer(rehechos.current.length > 0);
    if (!siguiente) return;
    historial.current.push({ piezas: piezasRef.current, capas: capasRef.current });
    setHayDeshacer(true);
    parar();
    setPiezas(siguiente.piezas);
    setCapas(siguiente.capas);
  };
  /** Saltar al corte anterior o siguiente (↑ / ↓, como en CapCut). */
  const irACorte = (dir: -1 | 1) => {
    const cortes = [0];
    for (const x of piezas) cortes.push(cortes[cortes.length - 1] + durFinal(x));
    const destino = dir < 0
      ? [...cortes].reverse().find(c => c < posicion - 0.05)
      : cortes.find(c => c > posicion + 0.05);
    if (destino === undefined) return;
    parar();
    // Justo en un corte se elige la pieza que empieza ahí (saltarGlobal).
    saltarGlobal(Math.min(totalFinal - 0.01, destino));
  };
  const editar = (fn: (prev: Pieza[]) => Pieza[]) => { guardar(); setPiezas(fn); };

  const cambiarSinGuardar = (id: string, parche: Partial<Pieza>) =>
    setPiezas(prev => prev.map(p => (p.id === id ? { ...p, ...parche } : p)));
  const cambiar = (id: string, parche: Partial<Pieza>) => { guardar(); cambiarSinGuardar(id, parche); };
  /** Para deslizadores: varios cambios seguidos se deshacen de una vez. */
  const cambiarAgrupado = (id: string, parche: Partial<Pieza>) => { guardar(true); cambiarSinGuardar(id, parche); };

  const esVideo = !!sel && sel.tipo !== 'imagen';
  /** Copia de la pieza que apunta al mismo original (cortar, duplicar). */
  const hermana = (p: Pieza, parche: Partial<Pieza>): Pieza =>
    ({ ...p, ...parche, id: nuevoId(), fuente: p.fuente || (p.clipId ? undefined : p.id) });

  const puedeCortar = esVideo && tiempo > sel!.inicio + MIN_TRAMO && tiempo < sel!.fin - MIN_TRAMO;
  const cortar = () => {
    if (!sel || !puedeCortar) return;
    const a = { ...sel, fin: tiempo };
    const b = hermana(sel, { inicio: tiempo });
    editar(prev => prev.flatMap(p => (p.id === sel.id ? [a, b] : [p])));
    setSelId(b.id);
  };
  // "Quitar lo de antes / lo de después" del cursor: el recorte de toda la
  // vida (Q y W, como en Premiere).
  const puedeAntes = esVideo && tiempo > sel!.inicio + 0.01 && tiempo < sel!.fin - MIN_TRAMO;
  const puedeDespues = esVideo && tiempo < sel!.fin - 0.01 && tiempo > sel!.inicio + MIN_TRAMO;
  const quitarAntes = () => { if (sel && puedeAntes) cambiar(sel.id, { inicio: tiempo }); };
  const quitarDespues = () => { if (sel && puedeDespues) cambiar(sel.id, { fin: tiempo }); };

  // Tramo marcado con entrada (I) y salida (O): se quita o se deja solo él.
  const [marcas, setMarcas] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  useEffect(() => { setMarcas({ a: null, b: null }); }, [selId]);
  const dentro = (t: number) => (sel ? Math.max(sel.inicio, Math.min(sel.fin, t)) : t);
  const marcarEntrada = () => { if (esVideo) setMarcas(m => ({ ...m, a: dentro(tiempo) })); };
  const marcarSalida = () => { if (esVideo) setMarcas(m => ({ ...m, b: dentro(tiempo) })); };
  const tramo = marcas.a !== null && marcas.b !== null && Math.abs(marcas.b - marcas.a) >= 0.1
    ? { a: Math.min(marcas.a, marcas.b), b: Math.max(marcas.a, marcas.b) }
    : null;
  const quitarTramo = () => {
    if (!sel || !tramo) return;
    const izq = tramo.a - sel.inicio >= MIN_TRAMO ? { ...sel, fin: tramo.a } : null;
    const der = sel.fin - tramo.b >= MIN_TRAMO ? hermana(sel, { inicio: tramo.b }) : null;
    const quedan = [izq, der].filter(Boolean) as Pieza[];
    editar(prev => prev.flatMap(p => (p.id === sel.id ? quedan : [p])));
    setMarcas({ a: null, b: null });
    parar();
    if (der) setSelId(der.id);
    else if (izq) setSelId(izq.id);
    else { const vecina = piezas[selIdx + 1] || piezas[selIdx - 1]; setSelId(vecina?.id ?? null); }
  };
  const quedarseConTramo = () => {
    if (!sel || !tramo) return;
    cambiar(sel.id, { inicio: tramo.a, fin: tramo.b });
    setMarcas({ a: null, b: null });
    buscarEnPieza(tramo.a);
  };

  /** Mover el cursor a mano: fotograma a fotograma o de segundo en segundo. */
  const paso = (seg: number) => {
    if (!sel || sel.tipo === 'imagen') return;
    if (reproduciendo) parar();
    buscarEnPieza(tiempo + seg);
  };

  const duplicar = () => {
    if (!sel) return;
    const copia = hermana(sel, {});
    editar(prev => prev.flatMap(p => (p.id === sel.id ? [p, copia] : [p])));
    setSelId(copia.id);
  };
  const borrar = () => {
    if (!sel) return;
    const i = selIdx;
    editar(prev => prev.filter(p => p.id !== sel.id));
    const vecina = piezas[i + 1] || piezas[i - 1];
    setSelId(vecina?.id ?? null);
    parar();
  };
  const desplazar = (paso: -1 | 1) => {
    if (selIdx < 0) return;
    const j = selIdx + paso;
    if (j < 0 || j >= piezas.length) return;
    editar(prev => {
      const c = prev.slice();
      [c[selIdx], c[j]] = [c[j], c[selIdx]];
      return c;
    });
  };

  // ---- lo propio ----------------------------------------------------------
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorPropio, setErrorPropio] = useState<string | null>(null);
  const anadir = async (files: FileList | null) => {
    if (!files) return;
    setErrorPropio(null);
    for (const file of Array.from(files)) {
      const id = nuevoId();
      if (file.type.startsWith('image/')) {
        const f = registrarFuente(`propio:${id}`, file);
        const p: Pieza = { id, tipo: 'imagen', nombre: file.name, canal: '', thumb: f.url, total: 4, inicio: 0, fin: 4, volumen: 1, silencio: false, velocidad: 1 };
        setPiezas(prev => [...prev, p]);
        setSelId(id);
      } else {
        try {
          const { dur, thumb } = await prepararVideo(file);
          registrarFuente(`propio:${id}`, file);
          const p: Pieza = { id, tipo: 'video', nombre: file.name, canal: '', thumb, total: dur, inicio: 0, fin: dur, volumen: 1, silencio: false, velocidad: 1 };
          setPiezas(prev => [...prev, p]);
          setSelId(id);
        } catch {
          setErrorPropio(tx('mergeOwnBad', "This browser can't read {f}. Try an MP4 or WebM.").replace('{f}', file.name));
        }
      }
    }
  };

  // ---- animaciones (suscríbete...) ----------------------------------------
  const [capaSel, setCapaSel] = useState<string | null>(null);
  const capa = capas.find(c => c.id === capaSel) || null;
  const [galeria, setGaleria] = useState(false);
  // El idioma de la última que se puso: quien hace vídeos en un idioma los
  // hace todos en ese. Por defecto inglés, el más usado en YouTube.
  const [idiomaAnim, setIdiomaAnim] = useState<IdiomaAnim>('en');
  useEffect(() => {
    try {
      const v = localStorage.getItem('clipstudio_anim_lang') as IdiomaAnim | null;
      if (v && IDIOMAS_ANIM.some(i => i.id === v)) setIdiomaAnim(v);
    } catch { /* inglés */ }
  }, []);
  const elegirIdiomaAnim = (i: IdiomaAnim) => {
    setIdiomaAnim(i);
    try { localStorage.setItem('clipstudio_anim_lang', i); } catch { /* vale para esta visita */ }
  };
  const nombrePlantilla = (id: PlantillaId) => tx(`an_${id}`, ({
    suscribir: 'Subscribe button', combo: 'Like + subscribe + bell', banner: 'Subscribe banner', minimo: 'Mini subscribe',
    final: 'End screen', twitch: 'Twitch follow', campana: 'Notification bell', comentario: 'Leave a comment',
  } as Record<PlantillaId, string>)[id]);
  /** El canal para las que lo enseñan: el del primer clip que tenga. */
  const canalPorDefecto = piezas.find(p => p.canal)?.canal || '';

  const anadirCapa = (id: PlantillaId) => {
    const pl = plantilla(id);
    // La pantalla final, al final; las demás, donde está el cursor.
    const inicio = pl.pantalla ? Math.max(0, totalFinal - pl.dur) : Math.max(0, Math.min(posicion, Math.max(0, totalFinal - 0.5)));
    const nueva: Capa = { id: nuevoId(), plantilla: id, idioma: idiomaAnim, inicio: Math.round(inicio * 100) / 100, dur: pl.dur, x: pl.x, y: pl.y, escala: 1, canal: canalPorDefecto };
    guardar();
    setCapas(prev => [...prev, nueva]);
    setCapaSel(nueva.id);
    setGaleria(false);
  };
  const cambiarCapaSinGuardar = (id: string, parche: Partial<Capa>) => setCapas(prev => prev.map(c => (c.id === id ? { ...c, ...parche } : c)));
  const cambiarCapa = (id: string, parche: Partial<Capa>, agrupar = false) => { guardar(agrupar); cambiarCapaSinGuardar(id, parche); };
  const borrarCapa = (id: string) => { guardar(); setCapas(prev => prev.filter(c => c.id !== id)); setCapaSel(null); };
  const duplicarCapa = (c: Capa) => {
    const copia = { ...c, id: nuevoId(), inicio: Math.round((c.inicio + c.dur) * 100) / 100 };
    guardar();
    setCapas(prev => [...prev, copia]);
    setCapaSel(copia.id);
  };

  // Vista previa en el visor: el mismo dibujo que al exportar, en un canvas
  // encima del vídeo, repintado cada vez que se mueve el cursor.
  const lienzoCapas = useRef<HTMLCanvasElement>(null);
  const [tamVisor, setTamVisor] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const cv = lienzoCapas.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => setTamVisor({ w: cv.clientWidth, h: cv.clientHeight }));
    ro.observe(cv);
    setTamVisor({ w: cv.clientWidth, h: cv.clientHeight });
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const cv = lienzoCapas.current;
    if (!cv || !tamVisor.w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(tamVisor.w * dpr);
    const H = Math.round(tamVisor.h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    if (capas.length) dibujarCapas(ctx, capas, posicion, W, H);
  }, [capas, posicion, tamVisor]);

  // ---- arrastrar archivos del ordenador ------------------------------------
  // Soltar vídeos o imágenes en cualquier parte del editor los añade al final,
  // igual que el botón. El contador evita el parpadeo del aviso al pasar por
  // encima de los hijos (cada uno lanza su dragenter/dragleave).
  const [soltando, setSoltando] = useState(false);
  const entradas = useRef(0);
  const conArchivos = (e: React.DragEvent) => Array.from(e.dataTransfer?.types || []).includes('Files');
  const alEntrarArchivo = (e: React.DragEvent) => {
    if (!conArchivos(e)) return;
    e.preventDefault();
    entradas.current += 1;
    setSoltando(true);
  };
  const alSalirArchivo = (e: React.DragEvent) => {
    if (!conArchivos(e)) return;
    entradas.current = Math.max(0, entradas.current - 1);
    if (entradas.current === 0) setSoltando(false);
  };
  const alSoltarArchivo = (e: React.DragEvent) => {
    if (!conArchivos(e)) return;
    e.preventDefault();
    entradas.current = 0;
    setSoltando(false);
    const validos = Array.from(e.dataTransfer.files).filter(f => /^(video|image)\//.test(f.type) || /\.(mp4|webm|mov|m4v|mkv)$/i.test(f.name));
    if (!validos.length) return;
    const dt = new DataTransfer();
    validos.forEach(f => dt.items.add(f));
    anadir(dt.files);
  };

  // ---- exportar -----------------------------------------------------------
  const [modo, setModo] = useState<'uno' | 'separado'>('uno');
  // Exportar vive en un panel que se abre desde la barra de arriba, como en
  // CapCut; se cierra al pulsar fuera.
  const [exportAbierto, setExportAbierto] = useState(false);
  const cabeceraRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!exportAbierto) return;
    const fuera = (e: MouseEvent) => { if (!cabeceraRef.current?.contains(e.target as Node)) setExportAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [exportAbierto]);
  /** Pestaña del panel de la pieza. */
  const [pestana, setPestana] = useState<'recorte' | 'sonido' | 'velocidad'>('recorte');
  const [fundido, setFundido] = useState(true);
  const [conMarca, setConMarca] = useState(watermarkOn && !sinMarca);
  const [exp, setExp] = useState<Export | null>(null);
  const [errorExp, setErrorExp] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const [calidad, setCalidad] = useState<CalidadExport>(() => leerCalidad(brand.storagePrefix));
  const cambiarCalidad = (c: CalidadExport) => { setCalidad(c); guardarCalidad(brand.storagePrefix, c); };
  const alto = quality === '360' ? 360 : quality === '720' ? 720 : 1080;

  const descargar = (blob: Blob, nombre: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const exportar = async () => {
    if (!piezas.length || exp) return;
    parar();
    setErrorExp(null);
    setHecho(false);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      // Lo que aún se esté bajando, a esperarlo.
      setExp({ fase: 'preparando', pct: 0 });
      let listas = 0;
      for (const c of clips) {
        if (ctrl.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        if (piezas.some(p => p.clipId === c.id)) {
          await obtenerFuente(`clip:${c.id}`, () => brand.fetchMovieBlob(resUrl(c), () => {}, ctrl.signal));
        }
        listas += 1;
        setExp({ fase: 'preparando', pct: Math.round((listas / clips.length) * 100) });
      }
      const marca = conMarca ? (watermarkConfig ?? loadStoredWatermarkConfig(brand)) : null;
      const opts = { watermark: marca, fade: fundido, height: alto, nitidez: FUERZA[calidad.nitidez], capas };
      const items = piezas.map(aMergeItem);

      if (modo === 'uno') {
        const video = await mergeClipsToVideo(items, opts, pr => {
          setExp({ fase: 'grabando', pieza: pr.index, total: pr.total, pct: pr.pct, queda: Math.max(0, pr.duration - pr.elapsed) });
        }, ctrl.signal);
        descargar(video, `${brand.storagePrefix}_edit_${Date.now()}.${video.type.includes('webm') ? 'webm' : 'mp4'}`);
      } else {
        // Uno detrás de otro: grabar va a tiempo real y en paralelo se pisan.
        const entradas: EntradaZip[] = [];
        const durs = piezas.map(durFinal);
        const totalSeg = durs.reduce((a, b) => a + b, 0) || 1;
        let hechoSeg = 0;
        let desde = 0;
        for (let i = 0; i < items.length; i += 1) {
          // Cada archivo suelto lleva las animaciones que caen en su tramo,
          // contadas desde su propio principio.
          const suyas = capas
            .filter(c => c.inicio < desde + durs[i] && c.inicio + c.dur > desde)
            .map(c => ({ ...c, inicio: c.inicio - desde }));
          desde += durs[i];
          const video = await mergeClipsToVideo([items[i]], { ...opts, capas: suyas }, pr => {
            const seg = hechoSeg + pr.elapsed;
            setExp({ fase: 'grabando', pieza: i + 1, total: items.length, pct: Math.min(100, Math.round((seg / totalSeg) * 100)), queda: Math.max(0, totalSeg - seg) });
          }, ctrl.signal);
          hechoSeg += durs[i];
          const ext = video.type.includes('webm') ? 'webm' : 'mp4';
          entradas.push({ nombre: `${i + 1}_${nombreDeArchivo(piezas[i].nombre, piezas[i].canal, piezas[i].id)}.${ext}`, datos: video });
        }
        const contenido = await zipEnBlob(entradas, ctrl.signal);
        descargar(contenido, `${brand.storagePrefix}_edit_${items.length}parts_${Date.now()}.zip`);
      }
      setHecho(true);
    } catch (e: any) {
      if (e?.name !== 'AbortError' && e?.message !== 'AbortError') {
        setErrorExp(e?.message === 'BACKGROUND_PAUSE'
          ? tx('wm_export_paused', 'The browser paused the video to save power. Keep this tab visible and try again.')
          : tx('mergeError', 'Could not build the video. Try again, or with fewer clips.'));
      }
    } finally {
      abortRef.current = null;
      setExp(null);
    }
  };

  // ---- teclado ------------------------------------------------------------
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      const en = e.target as HTMLElement;
      if (exp || en?.closest('input, textarea, select, [role="slider"]')) return;
      if (e.key === 'Escape') { onClose(); return; }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); e.shiftKey ? rehacer() : deshacer(); return; }
      if (ctrl && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); rehacer(); return; }
      if (ctrl && (e.key === 'b' || e.key === 'B')) { e.preventDefault(); cortar(); return; }
      if (ctrl || e.altKey) return;
      if (e.code === 'Space') { e.preventDefault(); reproduciendo ? parar() : reproducir(false); }
      else if (e.key === 's' || e.key === 'S' || e.key === 'b' || e.key === 'B') cortar();
      else if (e.key === 'i' || e.key === 'I') marcarEntrada();
      else if (e.key === 'o' || e.key === 'O') marcarSalida();
      else if (e.key === 'q' || e.key === 'Q') quitarAntes();
      else if (e.key === 'w' || e.key === 'W') quitarDespues();
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); if (capaSel) borrarCapa(capaSel); else if (tramo) quitarTramo(); else borrar(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); irACorte(-1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); irACorte(1); }
      else if (e.key === 'Home') { e.preventDefault(); parar(); saltarGlobal(0); }
      else if (e.key === 'End') { e.preventDefault(); parar(); saltarGlobal(Math.max(0, totalFinal - 0.05)); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); paso(e.shiftKey ? -1 : -FOTOGRAMA); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); paso(e.shiftKey ? 1 : FOTOGRAMA); }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  });

  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, []);

  if (typeof document === 'undefined') return null;

  const carga = sel ? cargas[claveFuente(sel)] : undefined;
  const boton = 'h-9 px-3 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:border-white/25 hover:bg-white/[0.04] flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed';
  /** Botón de icono de las barras (transporte, cabecera de la pieza). */
  const icono = 'w-9 h-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-25 disabled:cursor-not-allowed';
  const herramienta = 'h-8 px-2.5 rounded-lg text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/[0.06] flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-25 disabled:cursor-not-allowed';
  const titulo = 'text-[10px] font-black uppercase tracking-widest text-gray-500';
  const pestanas = sel?.tipo === 'imagen'
    ? [{ id: 'recorte' as const, label: tx('mergeImageSecs', 'Seconds on screen'), icon: <Clock className="w-3.5 h-3.5" /> }]
    : [
      { id: 'recorte' as const, label: tx('ed_trim', 'Trim'), icon: <Scissors className="w-3.5 h-3.5" /> },
      { id: 'sonido' as const, label: tx('ed_audio', 'Sound'), icon: <Volume2 className="w-3.5 h-3.5" /> },
      { id: 'velocidad' as const, label: tx('ed_speed', 'Speed'), icon: <Gauge className="w-3.5 h-3.5" /> },
    ];
  const pestanaActiva = pestanas.some(p => p.id === pestana) ? pestana : 'recorte';

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] bg-[#07060a] text-white flex flex-col animate-fade-in"
      style={brand.cssVars}
      role="dialog"
      aria-modal="true"
      aria-label={tx('ed_title', 'Clip editor')}
      onDragEnter={alEntrarArchivo}
      onDragOver={e => { if (conArchivos(e)) e.preventDefault(); }}
      onDragLeave={alSalirArchivo}
      onDrop={alSoltarArchivo}
    >
      {galeria && (
        <GaleriaAnimaciones
          idioma={idiomaAnim}
          onIdioma={elegirIdiomaAnim}
          canal={canalPorDefecto}
          nombre={nombrePlantilla}
          onElegir={anadirCapa}
          onCerrar={() => setGaleria(false)}
          tx={tx}
          estilo={brand.cssVars}
        />
      )}
      {soltando && (
        <div className="absolute inset-3 z-[60] rounded-3xl border-2 border-dashed border-twitch bg-twitch/10 backdrop-blur-sm flex flex-col items-center justify-center gap-3 pointer-events-none">
          <span className="p-4 rounded-2xl bg-twitch text-[var(--color-accent-ink)] shadow-2xl shadow-twitch/40"><Plus className="w-8 h-8" /></span>
          <p className="text-lg font-black text-white">{tx('ed_drop', 'Drop to add it to the timeline')}</p>
          <p className="text-xs font-bold text-gray-300">{tx('ed_drop_hint', 'Videos and images')}</p>
        </div>
      )}

      {/* ---- barra de arriba: qué es, atajos y exportar (como en CapCut) ---- */}
      <header ref={cabeceraRef} className="relative h-14 shrink-0 flex items-center justify-between gap-3 px-3 md:px-4 border-b border-white/[0.06] bg-[#0e0d13]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-twitch text-[var(--color-accent-ink)] flex items-center justify-center shrink-0 shadow-lg shadow-twitch/25"><Scissors className="w-4 h-4" /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-black tracking-tight truncate">{tx('ed_title', 'Clip editor')}</h3>
            <p className="text-[11px] text-gray-500 truncate tabular-nums">
              {tx('ed_summary', '{n} pieces · {d}').replace('{n}', String(piezas.length)).replace('{d}', mmss(totalFinal))}
              {pendientesCarga > 0 && <span className="text-twitch"> · {tx('ed_loading', 'Loading clips…')} {clips.length - pendientesCarga}/{clips.length}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={icono + ' hidden md:flex !cursor-help'} title={tx('ed_keys3', 'Space play · Ctrl+B split · Q/W delete left/right · Del delete · ↑/↓ cuts · Ctrl+Z undo')}>
            <Keyboard className="w-4 h-4" />
          </span>
          <button
            type="button"
            onClick={() => setExportAbierto(v => !v)}
            aria-expanded={exportAbierto}
            className="relative h-9 pl-3.5 pr-3 rounded-xl bg-twitch hover:bg-twitch-dark text-[var(--color-accent-ink)] text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-twitch/25 overflow-hidden"
          >
            {exp && <span className="absolute inset-y-0 left-0 bg-black/20" style={{ width: `${exp.pct}%` }} />}
            <span className="relative flex items-center gap-2">
              {exp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exp ? `${exp.pct}%` : tx('ed_export', 'Export')}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportAbierto ? 'rotate-180' : ''}`} />
            </span>
          </button>
          <button type="button" onClick={onClose} aria-label={tx('wm_close', 'Close')} className={icono + ' hover:!bg-red-500/15 hover:!text-red-300'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ---- panel de exportar ---- */}
        {exportAbierto && (
          <div className="absolute right-3 top-[60px] z-50 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-white/10 bg-[#131218] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className={titulo}>{tx('ed_export', 'Export')}</span>
              <span className="text-[11px] font-mono font-bold text-gray-500 tabular-nums">{mmss(totalFinal)} · {alto}p</span>
            </div>
            {exp ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-twitch uppercase tracking-widest flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {exp.fase === 'preparando' ? tx('ed_preparing', 'Preparing') : `${tx('mergeRecording', 'Recording clip')} ${exp.pieza}/${exp.total}`}
                  </span>
                  <span className="text-gray-400 tabular-nums">{exp.pct}%{exp.fase === 'grabando' ? ` · ${mmss(exp.queda)}` : ''}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-twitch transition-[width] duration-300" style={{ width: `${Math.max(2, exp.pct)}%` }} /></div>
                <button type="button" onClick={() => abortRef.current?.abort()} className="w-full py-2 rounded-xl border border-white/10 text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer">{tx('cancel', 'Cancel')}</button>
              </div>
            ) : (
              <>
                <div className="flex p-1 rounded-xl bg-dark-950 border border-white/10 gap-1">
                  {([['uno', <Film key="f" className="w-3.5 h-3.5" />, tx('ed_one_video', 'One video')], ['separado', <Package key="p" className="w-3.5 h-3.5" />, tx('ed_separate', 'Separate (ZIP)')]] as const).map(([id, ic, txt]) => (
                    <button key={id} type="button" onClick={() => setModo(id)} aria-pressed={modo === id} className={`flex-1 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${modo === id ? 'bg-twitch text-[var(--color-accent-ink)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{ic}{txt}</button>
                  ))}
                </div>
                <CalidadSelector valor={calidad} onChange={cambiarCalidad} t={t} compacto />
                <AvisoGrafica tx={tx} />
                <div className="flex gap-2">
                  {[
                    { on: fundido, set: setFundido, icon: <Blend className="w-3.5 h-3.5" />, label: tx('ed_fades', 'Fades') },
                    ...(sinMarca ? [] : [{ on: conMarca, set: setConMarca, icon: <Sparkles className="w-3.5 h-3.5" />, label: tx('ed_watermark', 'Watermark') }]),
                  ].map((o, i) => (
                    <button key={i} type="button" role="switch" aria-checked={o.on} onClick={() => o.set(!o.on)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-bold cursor-pointer ${o.on ? 'border-twitch/50 bg-twitch/10 text-white' : 'border-white/10 text-gray-500 hover:text-white'}`}>
                      {o.icon}{o.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={exportar}
                  disabled={!piezas.length}
                  className="w-full h-11 rounded-xl bg-twitch hover:bg-twitch-dark text-[var(--color-accent-ink)] text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-twitch/25 disabled:opacity-40 active:scale-[0.98] transition-all"
                >
                  <Download className="w-4 h-4" />{tx('ed_export', 'Export')} · {mmss(totalFinal)}
                </button>
              </>
            )}
            {hecho && !exp && <p className="text-[11px] font-bold text-green-400">{tx('mergeDone', 'Done! The video is in your downloads.')}</p>}
            {errorExp && <p className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">{errorExp}</p>}
          </div>
        )}
      </header>

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden">
        <div className="lg:flex-1 lg:min-h-0 flex flex-col lg:flex-row">
          {/* ---- visor ---- */}
          <div className="shrink-0 lg:shrink lg:flex-1 min-w-0 flex flex-col bg-[#09080c]">
            <div className="relative w-full aspect-video max-h-[46vh] lg:max-h-none lg:aspect-auto lg:flex-1 lg:min-h-0 p-3 md:p-6">
              <div className="w-full h-full [container-type:size] flex items-center justify-center">
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]" style={{ width: 'min(100cqw, calc(100cqh * 16 / 9))' }}>
                  <video
                    ref={videoRef}
                    playsInline
                    className={`w-full h-full object-contain ${sel?.tipo === 'imagen' ? 'hidden' : ''}`}
                    onPause={() => { if (!todo) setReproduciendo(false); }}
                  />
                  {sel?.tipo === 'imagen' && fuenteLista(sel) && (
                    <img src={fuenteLista(sel)!.url} alt="" className="absolute inset-0 w-full h-full object-contain" />
                  )}
                  <canvas ref={lienzoCapas} className="absolute inset-0 w-full h-full pointer-events-none" />
                  {sel && !lista(sel) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs font-bold text-gray-400">
                      {carga?.error
                        ? <><AlertCircle className="w-6 h-6 text-red-400" />{tx('failedToLoad', 'Could not load the clip')}</>
                        : <><Loader2 className="w-6 h-6 animate-spin text-twitch" />{tx('ed_loading', 'Loading clips…')} {carga?.pct ?? 0}%</>}
                    </div>
                  )}
                  {!sel && (
                    <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-xs font-bold text-gray-400 hover:text-white cursor-pointer">
                      <span className="p-3 rounded-2xl bg-twitch/15 border border-twitch/30"><Plus className="w-6 h-6 text-twitch" /></span>
                      {tx('ed_empty', 'The timeline is empty. Add a video or an image.')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            {/* transporte: tiempo a la izquierda, reproducir en el centro */}
            <div className="h-14 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-5 border-t border-white/[0.06]">
              <span className="text-[11px] sm:text-xs font-mono font-bold tabular-nums whitespace-nowrap">
                <span className="text-white">{mmss(posicion, true)}</span>
                <span className="text-gray-600"> / {mmss(totalFinal, true)}</span>
              </span>
              <div className="flex items-center gap-1">
                <button type="button" className={icono} onClick={() => irACorte(-1)} disabled={!piezas.length} title={tx('ed_prev', 'Previous piece') + ' (↑)'} aria-label={tx('ed_prev', 'Previous piece')}><SkipBack className="w-4 h-4" /></button>
                <button
                  type="button"
                  onClick={() => (reproduciendo ? parar() : reproducir(false))}
                  disabled={!lista(sel)}
                  aria-label={reproduciendo ? 'Pause' : 'Play'}
                  title={tx('ed_play', 'Play') + ' (Space)'}
                  className="w-11 h-11 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center cursor-pointer disabled:opacity-30 shadow-lg mx-1 transition-colors"
                >
                  {reproduciendo ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <button type="button" className={icono} onClick={() => irACorte(1)} disabled={!piezas.length} title={tx('ed_next', 'Next piece') + ' (↓)'} aria-label={tx('ed_next', 'Next piece')}><SkipForward className="w-4 h-4" /></button>
              </div>
              <div className="flex justify-end">
                <button type="button" className={boton + ' !h-8 !border-transparent'} onClick={reproducirTodo} disabled={!piezas.length || pendientesCarga > 0}>
                  <ListVideo className="w-4 h-4 text-twitch" /><span className="hidden sm:inline">{tx('ed_play_all', 'Play everything')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ---- propiedades de la pieza, por pestañas ---- */}
          <aside className="lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#0e0d13] flex flex-col min-h-0">
            {capa ? (
              <>
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <span className="w-14 aspect-video rounded-lg flex items-center justify-center shrink-0 ring-1 ring-white/10" style={{ background: plantilla(capa.plantilla).color }}>
                    <Wand2 className="w-4 h-4 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-twitch">{tx('ed_anim_layer', 'Animation')} <span className="text-gray-500 font-mono normal-case tracking-normal">· {mmss(capa.inicio, true)} – {mmss(capa.inicio + capa.dur, true)}</span></p>
                    <p className="text-sm font-bold text-white truncate">{nombrePlantilla(capa.plantilla)}</p>
                  </div>
                  <div className="flex items-center shrink-0 -mr-1.5">
                    <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => duplicarCapa(capa)} title={tx('ed_duplicate', 'Duplicate')} aria-label={tx('ed_duplicate', 'Duplicate')}><Copy className="w-3.5 h-3.5" /></button>
                    <button type="button" className={icono + ' !w-8 !h-8 hover:!text-red-300 hover:!bg-red-500/10'} onClick={() => borrarCapa(capa.id)} title={tx('ed_delete', 'Remove')} aria-label={tx('ed_delete', 'Remove')}><Trash2 className="w-3.5 h-3.5" /></button>
                    <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => setCapaSel(null)} title={tx('wm_close', 'Close')} aria-label={tx('wm_close', 'Close')}><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
                  <div className="space-y-2">
                    <span className={titulo + ' flex items-center gap-1.5'}><Languages className="w-3.5 h-3.5 text-twitch" />{tx('ed_anim_lang', 'Text language')}</span>
                    <div className="grid grid-cols-5 gap-1">
                      {IDIOMAS_ANIM.map(i => (
                        <button key={i.id} type="button" onClick={() => { cambiarCapa(capa.id, { idioma: i.id }); elegirIdiomaAnim(i.id); }} aria-pressed={capa.idioma === i.id} title={i.nombre} className={`h-8 rounded-lg text-[11px] font-black uppercase cursor-pointer transition-colors ${capa.idioma === i.id ? 'bg-twitch text-[var(--color-accent-ink)]' : 'bg-white/[0.04] text-gray-400 hover:text-white'}`}>{i.id}</button>
                      ))}
                    </div>
                  </div>
                  {(capa.plantilla === 'banner' || capa.plantilla === 'final') && (
                    <label className="block space-y-2">
                      <span className={titulo}>{tx('ed_anim_channel', 'Channel name')}</span>
                      <input value={capa.canal} onChange={e => cambiarCapa(capa.id, { canal: e.target.value.slice(0, 40) }, true)} className="w-full h-10 rounded-xl bg-dark-950 border border-white/10 px-3 text-sm text-white outline-none focus:border-twitch" />
                    </label>
                  )}
                  <label className="block">
                    <span className="flex justify-between mb-2"><span className={titulo + ' flex items-center gap-1.5'}><Clock className="w-3.5 h-3.5 text-twitch" />{tx('ed_anim_dur', 'Duration')}</span><span className="text-xs font-mono font-bold text-twitch">{capa.dur.toFixed(1)}s</span></span>
                    <input type="range" min={1} max={15} step={0.1} value={capa.dur} onChange={e => cambiarCapa(capa.id, { dur: parseFloat(e.target.value) }, true)} className="w-full accent-twitch h-1.5 cursor-pointer" />
                  </label>
                  {!plantilla(capa.plantilla).pantalla && (
                    <>
                      <label className="block">
                        <span className="flex justify-between mb-2"><span className={titulo + ' flex items-center gap-1.5'}><Maximize className="w-3.5 h-3.5 text-twitch" />{tx('ed_anim_size', 'Size')}</span><span className="text-xs font-mono font-bold text-twitch">{Math.round(capa.escala * 100)}%</span></span>
                        <input type="range" min={40} max={200} value={Math.round(capa.escala * 100)} onChange={e => cambiarCapa(capa.id, { escala: parseInt(e.target.value, 10) / 100 }, true)} className="w-full accent-twitch h-1.5 cursor-pointer" />
                      </label>
                      <div className="space-y-2">
                        <span className={titulo + ' flex items-center gap-1.5'}><Move className="w-3.5 h-3.5 text-twitch" />{tx('ed_anim_pos', 'Position')}</span>
                        <div className="flex gap-3">
                          {/* Las nueve posiciones de siempre, como en la marca de agua */}
                          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-dark-950 border border-white/10 shrink-0">
                            {[3, 50, 97].flatMap(yy => [3, 50, 97].map(xx => (
                              <button key={`${xx}-${yy}`} type="button" onClick={() => cambiarCapa(capa.id, { x: xx, y: yy })} aria-label={`${xx}% · ${yy}%`} className={`w-8 h-6 rounded-md cursor-pointer transition-colors ${capa.x === xx && capa.y === yy ? 'bg-twitch' : 'bg-white/[0.06] hover:bg-white/15'}`} />
                            )))}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <input type="range" min={POS_MIN} max={POS_MAX} value={capa.x} onChange={e => cambiarCapa(capa.id, { x: parseInt(e.target.value, 10) }, true)} aria-label="X" className="w-full accent-twitch h-1.5 cursor-pointer" />
                            <input type="range" min={POS_MIN} max={POS_MAX} value={capa.y} onChange={e => cambiarCapa(capa.id, { y: parseInt(e.target.value, 10) }, true)} aria-label="Y" className="w-full accent-twitch h-1.5 cursor-pointer" />
                            <p className="text-[10px] font-mono text-gray-500">X {capa.x}% · Y {capa.y}%</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  <button type="button" className={boton + ' w-full justify-center'} onClick={() => { parar(); saltarGlobal(capa.inicio); }}>
                    <Play className="w-3.5 h-3.5 text-twitch" />{tx('ed_anim_goto', 'Go to its start')}
                  </button>
                </div>
              </>
            ) : sel ? (
              <>
                <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                  <span className="relative w-14 aspect-video rounded-lg overflow-hidden bg-black ring-1 ring-white/10 shrink-0">
                    {sel.thumb && <img src={sel.thumb} alt="" className="w-full h-full object-cover" />}
                    <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/75 text-[8px] font-black text-white tabular-nums">{selIdx + 1}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-twitch flex items-center gap-1">
                      {sel.tipo === 'imagen' ? <ImageIcon className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                      {tx('ed_piece', 'Piece {n}').replace('{n}', String(selIdx + 1))}
                      <span className="text-gray-500 font-mono normal-case tracking-normal">· {mmss(durFinal(sel), true)}</span>
                    </p>
                    <p className="text-sm font-bold text-white truncate">{sel.nombre}</p>
                  </div>
                  <div className="flex items-center shrink-0 -mr-1.5">
                    <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => desplazar(-1)} disabled={selIdx <= 0} title={tx('ed_move_left', 'Move earlier')} aria-label={tx('ed_move_left', 'Move earlier')}><ChevronLeft className="w-4 h-4" /></button>
                    <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => desplazar(1)} disabled={selIdx >= piezas.length - 1} title={tx('ed_move_right', 'Move later')} aria-label={tx('ed_move_right', 'Move later')}><ChevronRight className="w-4 h-4" /></button>
                    <button type="button" className={icono + ' !w-8 !h-8'} onClick={duplicar} title={tx('ed_duplicate', 'Duplicate')} aria-label={tx('ed_duplicate', 'Duplicate')}><Copy className="w-3.5 h-3.5" /></button>
                    <button type="button" className={icono + ' !w-8 !h-8 hover:!text-red-300 hover:!bg-red-500/10'} onClick={borrar} title={tx('ed_delete', 'Remove')} aria-label={tx('ed_delete', 'Remove')}><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                <div role="tablist" className="shrink-0 flex gap-1 px-3 pt-2 border-b border-white/[0.06]">
                  {pestanas.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      role="tab"
                      aria-selected={pestanaActiva === p.id}
                      onClick={() => setPestana(p.id)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 px-2 pb-2.5 pt-1.5 text-[11px] font-bold cursor-pointer transition-colors ${pestanaActiva === p.id ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <span className={pestanaActiva === p.id ? 'text-twitch' : ''}>{p.icon}</span>{p.label}
                      {pestanaActiva === p.id && <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-twitch" />}
                    </button>
                  ))}
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-4">
                  {sel.tipo === 'imagen' ? (
                    <label className="block">
                      <span className="flex justify-between text-xs font-bold text-gray-300 mb-2"><span>{tx('mergeImageSecs', 'Seconds on screen')}</span><span className="font-mono text-twitch">{sel.total}s</span></span>
                      <input type="range" min={1} max={30} value={sel.total} onChange={e => { const v = parseInt(e.target.value, 10); cambiarAgrupado(sel.id, { total: v, fin: v }); }} className="w-full accent-twitch h-1.5 cursor-pointer" />
                    </label>
                  ) : pestanaActiva === 'recorte' ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className={titulo}>{tx('ed_trim', 'Trim')}</span>
                        <span className="text-[10px] font-bold text-gray-500 tabular-nums">{tx('ed_kept', 'Kept: {d}').replace('{d}', mmss(sel.fin - sel.inicio, true))}</span>
                      </div>
                      <TrimBar
                        total={sel.total}
                        inicio={sel.inicio}
                        fin={sel.fin}
                        actual={tiempo}
                        frames={frames}
                        marcaA={marcas.a}
                        marcaB={marcas.b}
                        onStart={() => guardar()}
                        onChange={(a, b) => cambiarSinGuardar(sel.id, { inicio: a, fin: b })}
                        onSeek={buscarEnPieza}
                        etiquetaInicio={tx('ed_start', 'Start')}
                        etiquetaFin={tx('ed_end', 'End')}
                      />

                      {/* Dónde está el cursor, y moverlo con precisión */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-dark-950 border border-white/10">
                        <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => paso(-1)} disabled={!selLista} aria-label={tx('ed_back_1s', 'Back 1 second')} title={tx('ed_back_1s', 'Back 1 second') + ' (Shift+←)'}><ChevronsLeft className="w-4 h-4" /></button>
                        <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => paso(-FOTOGRAMA)} disabled={!selLista} aria-label={tx('ed_back_frame', 'Back 1 frame')} title={tx('ed_back_frame', 'Back 1 frame') + ' (←)'}><ChevronLeft className="w-4 h-4" /></button>
                        <span className="flex-1 text-center text-sm font-mono font-black text-white tabular-nums">{reloj(tiempo)}</span>
                        <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => paso(FOTOGRAMA)} disabled={!selLista} aria-label={tx('ed_fwd_frame', 'Forward 1 frame')} title={tx('ed_fwd_frame', 'Forward 1 frame') + ' (→)'}><ChevronRight className="w-4 h-4" /></button>
                        <button type="button" className={icono + ' !w-8 !h-8'} onClick={() => paso(1)} disabled={!selLista} aria-label={tx('ed_fwd_1s', 'Forward 1 second')} title={tx('ed_fwd_1s', 'Forward 1 second') + ' (Shift+→)'}><ChevronsRight className="w-4 h-4" /></button>
                      </div>

                      {/* Tramo marcado: entrada y salida, y qué hacer con él */}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2.5">
                        <p className="text-[11px] font-medium text-gray-400 leading-snug">{tx('ed_mark_hint', 'Mark where a part starts and where it ends, then remove it or keep only that.')}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" className={boton + ' justify-center' + (marcas.a !== null ? ' !border-red-400/50 !text-white bg-red-500/10' : '')} onClick={marcarEntrada} disabled={!selLista} title="I">
                            [ {tx('ed_mark_in', 'Mark start')}{marcas.a !== null && <span className="font-mono text-red-300">{mmss(marcas.a, true)}</span>}
                          </button>
                          <button type="button" className={boton + ' justify-center' + (marcas.b !== null ? ' !border-red-400/50 !text-white bg-red-500/10' : '')} onClick={marcarSalida} disabled={!selLista} title="O">
                            {tx('ed_mark_out', 'Mark end')}{marcas.b !== null && <span className="font-mono text-red-300">{mmss(marcas.b, true)}</span>} ]
                          </button>
                        </div>
                        {tramo && (
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" className={boton + ' justify-center !border-red-400/40 !text-red-200 hover:!bg-red-500/15'} onClick={quitarTramo} title="Supr">
                              <Trash2 className="w-3.5 h-3.5" />{tx('ed_remove_marked', 'Remove this part')}
                            </button>
                            <button type="button" className={boton + ' justify-center'} onClick={quedarseConTramo}>
                              <Crop className="w-3.5 h-3.5 text-twitch" />{tx('ed_keep_marked', 'Keep only this')}
                            </button>
                            <button type="button" className="col-span-2 text-[11px] font-bold text-gray-500 hover:text-white cursor-pointer" onClick={() => setMarcas({ a: null, b: null })}>
                              {tx('ed_clear_marks', 'Clear the marks')} · {mmss(tramo.b - tramo.a, true)}
                            </button>
                          </div>
                        )}
                      </div>

                      {(sel.inicio > 0.01 || sel.fin < sel.total - 0.01) && (
                        <button type="button" className={boton + ' justify-center w-full'} onClick={() => cambiar(sel.id, { inicio: 0, fin: sel.total })}>
                          <RotateCcw className="w-3.5 h-3.5" />{tx('ed_reset_trim', 'Undo the trim')}
                        </button>
                      )}
                    </>
                  ) : pestanaActiva === 'sonido' ? (
                    <div className="space-y-4">
                      <span className={titulo}>{tx('ed_volume', 'Volume')}</span>
                      <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                        <button type="button" onClick={() => cambiar(sel.id, { silencio: !sel.silencio })} aria-label={sel.silencio ? tx('ed_unmute', 'Unmute') : tx('ed_mute', 'Mute')} className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${sel.silencio ? 'border-red-400/50 text-red-300 bg-red-500/10' : 'border-white/10 text-gray-300 hover:text-white'}`}>
                          {sel.silencio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input type="range" min={0} max={100} value={Math.round(sel.volumen * 100)} disabled={sel.silencio} onChange={e => cambiarAgrupado(sel.id, { volumen: parseInt(e.target.value, 10) / 100 })} aria-label={tx('ed_volume', 'Volume')} className="flex-1 accent-twitch h-1.5 cursor-pointer disabled:opacity-30" />
                        <span className="w-11 text-right text-sm font-mono font-black text-twitch tabular-nums">{sel.silencio ? '0' : Math.round(sel.volumen * 100)}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className={titulo}>{tx('ed_speed', 'Speed')}</span>
                      <div className="grid grid-cols-5 gap-1.5">
                        {VELOCIDADES.map(v => (
                          <button key={v} type="button" onClick={() => cambiar(sel.id, { velocidad: v })} aria-pressed={sel.velocidad === v} className={`h-12 rounded-xl border text-xs font-black cursor-pointer transition-colors ${sel.velocidad === v ? 'bg-twitch border-twitch text-[var(--color-accent-ink)] shadow-lg shadow-twitch/20' : 'border-white/10 text-gray-400 hover:text-white hover:border-white/25'}`}>{v}x</button>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 tabular-nums">{mmss((sel.fin - sel.inicio), true)} → <span className="text-white font-bold">{mmss(durFinal(sel), true)}</span></p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-gray-500">{tx('ed_empty', 'The timeline is empty. Add a video or an image.')}</div>
            )}
          </aside>
        </div>

        {/* ---- línea de tiempo (estilo CapCut: herramientas encima) ---- */}
        <div className="shrink-0 border-t border-white/[0.06] bg-[#0e0d13] px-3 md:px-4 pt-2 pb-3">
          <input ref={inputRef} type="file" accept="video/*,image/*" multiple className="hidden" onChange={e => { anadir(e.target.files); e.target.value = ''; }} />
          {errorPropio && <p className="text-[11px] font-bold text-red-400 mb-1">{errorPropio}</p>}
          <Timeline
            piezas={piezas}
            seleccionada={selId}
            posicion={posicion}
            reproduciendo={reproduciendo}
            marcas={marcas}
            version={Object.values(cargas).filter(c => c.pct === 100).length}
            tx={tx}
            onSelect={(id, tg) => { parar(); setCapaSel(null); saltarGlobal(tg, id); }}
            capas={capas}
            capaElegida={capaSel}
            onSelectCapa={id => setCapaSel(id)}
            onCapaStart={() => guardar()}
            onCapa={cambiarCapaSinGuardar}
            nombreCapa={c => nombrePlantilla(c.plantilla)}
            onSeek={tg => { parar(); saltarGlobal(tg); }}
            onReorder={next => { guardar(true); setPiezas(next); }}
            onTrimStart={() => { parar(); guardar(); }}
            onTrim={cambiarSinGuardar}
            onPreview={(id, t) => { if (id === selId) buscarEnPieza(t); }}
            herramientas={<>
              <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-0.5">
                <button type="button" className={herramienta} onClick={deshacer} disabled={!hayDeshacer} title={tx('ed_undo', 'Undo') + ' (Ctrl+Z)'} aria-label={tx('ed_undo', 'Undo')}><Undo2 className="w-4 h-4" /></button>
                <button type="button" className={herramienta} onClick={rehacer} disabled={!hayRehacer} title={tx('ed_redo', 'Redo') + ' (Ctrl+Shift+Z)'} aria-label={tx('ed_redo', 'Redo')}><Redo2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center rounded-xl bg-white/[0.03] border border-white/[0.06] p-0.5">
                <button type="button" className={herramienta + ' !text-white'} onClick={cortar} disabled={!selLista || !puedeCortar} title={tx('ed_split', 'Split at the playhead') + ' (Ctrl+B)'}>
                  <Scissors className="w-4 h-4 text-twitch" /><span className="hidden md:inline">{tx('ed_split_short', 'Split')}</span>
                </button>
                <button type="button" className={herramienta} onClick={quitarAntes} disabled={!selLista || !puedeAntes} title={tx('ed_cut_before', 'Remove before') + ' (Q)'}>
                  <ArrowLeftToLine className="w-4 h-4 text-twitch" /><span className="hidden xl:inline">{tx('ed_cut_before', 'Remove before')}</span>
                </button>
                <button type="button" className={herramienta} onClick={quitarDespues} disabled={!selLista || !puedeDespues} title={tx('ed_cut_after', 'Remove after') + ' (W)'}>
                  <span className="hidden xl:inline">{tx('ed_cut_after', 'Remove after')}</span><ArrowRightToLine className="w-4 h-4 text-twitch" />
                </button>
                <button type="button" className={herramienta + ' hover:!text-red-300 hover:!bg-red-500/10'} onClick={() => (tramo ? quitarTramo() : borrar())} disabled={!sel} title={(tramo ? tx('ed_remove_marked', 'Remove this part') : tx('ed_delete', 'Remove')) + ' (Supr)'}>
                  <Trash2 className="w-4 h-4" /><span className="hidden md:inline">{tramo ? tx('ed_remove_marked', 'Remove this part') : tx('ed_delete', 'Remove')}</span>
                </button>
              </div>
              <button type="button" className="h-9 px-3 rounded-xl bg-gradient-to-r from-red-500/25 to-twitch/25 border border-red-400/40 text-[11px] font-bold text-white hover:brightness-125 flex items-center gap-1.5 cursor-pointer transition-all" onClick={() => setGaleria(true)} title={tx('ed_anims_title', 'Ready-made animations')}>
                <Wand2 className="w-4 h-4 text-red-300" /><span className="hidden sm:inline">{tx('ed_anims', 'Animations')}</span>
              </button>
              <button type="button" className="h-9 px-3 rounded-xl bg-twitch/15 border border-twitch/40 text-[11px] font-bold text-white hover:bg-twitch/25 flex items-center gap-1.5 cursor-pointer transition-colors" onClick={() => inputRef.current?.click()} title={`${tx('mergeAddOwn', 'Add your own video or image')} · ${tx('ed_drop_hint', 'Videos and images')}`}>
                <Plus className="w-4 h-4 text-twitch" /><span className="hidden sm:inline">{tx('ed_add', 'Add media')}</span>
              </button>
            </>}
          />
          <p className="mt-1.5 text-[10px] font-medium text-gray-600 hidden md:block">{tx('ed_tl_hint', 'Click a clip to put the playhead there · drag its white edges to trim · drag a clip to move it · Ctrl + wheel to zoom')}</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClipEditor;
