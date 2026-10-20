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
import JSZip from 'jszip';
import {
  Scissors, X, Play, Pause, SkipBack, SkipForward, ListVideo, Plus, Copy, Trash2, ChevronLeft, ChevronRight,
  Volume2, VolumeX, RotateCcw, Download, Loader2, Blend, Sparkles, Film, Package, AlertCircle,
} from 'lucide-react';
import type { ClipData, WatermarkConfig } from '../types';
import { useBrand } from '../brand';
import { duracionDe, mergeClipsToVideo } from '../mergeService';
import { loadStoredWatermarkConfig, nombreDeArchivo } from '../watermarkService';
import { prepararVideo } from './ownMedia';
import TrimBar from './TrimBar';
import Timeline from './Timeline';
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
}

const VELOCIDADES = [0.5, 0.75, 1, 1.5, 2];

type Export =
  | { fase: 'preparando'; pct: number }
  | { fase: 'grabando'; pieza: number; total: number; pct: number; queda: number };

const ClipEditor: React.FC<Props> = ({ clips, piezas, setPiezas, enfoque, quality, watermarkOn, watermarkConfig, t, onClose }) => {
  const brand = useBrand();
  const tx = (k: string, fb: string) => (typeof t?.[k] === 'string' && t[k]) || fb;

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
  }, [sel?.id, sel?.total, cargas]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (sel && lista(sel)) cargar(sel);
  }, [sel?.id, cargas]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (v.currentTime >= p.fin - 0.06) v.currentTime = p.inicio;
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

  const saltarGlobal = (tg: number) => {
    let acc = 0;
    for (const p of piezas) {
      const d = durFinal(p);
      if (tg <= acc + d) {
        const tOrig = p.inicio + (tg - acc) * (p.tipo === 'imagen' ? 1 : p.velocidad);
        setSelId(p.id);
        cargar(p, tOrig);
        return;
      }
      acc += d;
    }
  };

  // ---- edición ------------------------------------------------------------
  const cambiar = (id: string, parche: Partial<Pieza>) =>
    setPiezas(prev => prev.map(p => (p.id === id ? { ...p, ...parche } : p)));

  const puedeCortar = !!sel && sel.tipo !== 'imagen' && tiempo > sel.inicio + 0.3 && tiempo < sel.fin - 0.3;
  const cortar = () => {
    if (!sel || !puedeCortar) return;
    const a = { ...sel, fin: tiempo };
    const b = { ...sel, id: nuevoId(), inicio: tiempo, fuente: sel.fuente || (sel.clipId ? undefined : sel.id) };
    setPiezas(prev => prev.flatMap(p => (p.id === sel.id ? [a, b] : [p])));
    setSelId(b.id);
  };
  const marcarInicio = () => { if (sel && sel.tipo !== 'imagen' && tiempo < sel.fin - 0.3) cambiar(sel.id, { inicio: tiempo }); };
  const marcarFin = () => { if (sel && sel.tipo !== 'imagen' && tiempo > sel.inicio + 0.3) cambiar(sel.id, { fin: tiempo }); };
  const duplicar = () => {
    if (!sel) return;
    const copia = { ...sel, id: nuevoId(), fuente: sel.fuente || (sel.clipId ? undefined : sel.id) };
    setPiezas(prev => prev.flatMap(p => (p.id === sel.id ? [p, copia] : [p])));
    setSelId(copia.id);
  };
  const borrar = () => {
    if (!sel) return;
    const i = selIdx;
    setPiezas(prev => prev.filter(p => p.id !== sel.id));
    const vecina = piezas[i + 1] || piezas[i - 1];
    setSelId(vecina?.id ?? null);
    parar();
  };
  const desplazar = (paso: -1 | 1) => {
    if (selIdx < 0) return;
    const j = selIdx + paso;
    if (j < 0 || j >= piezas.length) return;
    setPiezas(prev => {
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

  // ---- exportar -----------------------------------------------------------
  const [modo, setModo] = useState<'uno' | 'separado'>('uno');
  const [fundido, setFundido] = useState(true);
  const [conMarca, setConMarca] = useState(watermarkOn);
  const [exp, setExp] = useState<Export | null>(null);
  const [errorExp, setErrorExp] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
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
      const opts = { watermark: marca, fade: fundido, height: alto };
      const items = piezas.map(aMergeItem);

      if (modo === 'uno') {
        const video = await mergeClipsToVideo(items, opts, pr => {
          setExp({ fase: 'grabando', pieza: pr.index, total: pr.total, pct: pr.pct, queda: Math.max(0, pr.duration - pr.elapsed) });
        }, ctrl.signal);
        descargar(video, `${brand.storagePrefix}_edit_${Date.now()}.${video.type.includes('webm') ? 'webm' : 'mp4'}`);
      } else {
        // Uno detrás de otro: grabar va a tiempo real y en paralelo se pisan.
        const zip = new JSZip();
        const durs = piezas.map(durFinal);
        const totalSeg = durs.reduce((a, b) => a + b, 0) || 1;
        let hechoSeg = 0;
        for (let i = 0; i < items.length; i += 1) {
          const video = await mergeClipsToVideo([items[i]], opts, pr => {
            const seg = hechoSeg + pr.elapsed;
            setExp({ fase: 'grabando', pieza: i + 1, total: items.length, pct: Math.min(100, Math.round((seg / totalSeg) * 100)), queda: Math.max(0, totalSeg - seg) });
          }, ctrl.signal);
          hechoSeg += durs[i];
          const ext = video.type.includes('webm') ? 'webm' : 'mp4';
          zip.file(`${i + 1}_${nombreDeArchivo(piezas[i].nombre, piezas[i].canal, piezas[i].id)}.${ext}`, video);
        }
        const contenido = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
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
      if (e.code === 'Space') { e.preventDefault(); reproduciendo ? parar() : reproducir(false); }
      else if (e.key === 's' || e.key === 'S') cortar();
      else if (e.key === 'i' || e.key === 'I') marcarInicio();
      else if (e.key === 'o' || e.key === 'O') marcarFin();
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
  const boton = 'h-9 px-3 rounded-xl border border-white/10 text-xs font-bold text-gray-300 hover:text-white hover:border-white/25 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed';

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-[#07060a] text-white flex flex-col animate-fade-in" style={brand.cssVars} role="dialog" aria-modal="true" aria-label={tx('ed_title', 'Clip editor')}>
      {/* ---- cabecera ---- */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-3 px-3 md:px-5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-2 rounded-xl bg-twitch/20 border border-twitch/30 shrink-0"><Scissors className="w-4 h-4 text-twitch" /></span>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-tight truncate">{tx('ed_title', 'Clip editor')}</h3>
            <p className="text-[11px] text-gray-500 truncate">
              {tx('ed_summary', '{n} pieces · {d}').replace('{n}', String(piezas.length)).replace('{d}', mmss(totalFinal))}
              {pendientesCarga > 0 && <span className="text-twitch"> · {tx('ed_loading', 'Loading clips…')} {clips.length - pendientesCarga}/{clips.length}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden lg:block text-[10px] text-gray-500 font-bold">{tx('ed_keys', 'Space play · S split · I start · O end')}</span>
          <button type="button" onClick={onClose} aria-label={tx('wm_close', 'Close')} className="w-9 h-9 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/15 hover:border-red-500/30 flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col overflow-y-auto lg:overflow-hidden">
        <div className="lg:flex-1 lg:min-h-0 flex flex-col lg:flex-row">
          {/* ---- reproductor ---- */}
          <div className="shrink-0 lg:shrink lg:flex-1 min-w-0 flex flex-col gap-3 p-3 md:p-5">
            <div className="relative w-full aspect-video max-h-[46vh] lg:max-h-none lg:aspect-auto lg:flex-1 lg:min-h-0 [container-type:size] flex items-center justify-center">
              <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ width: 'min(100cqw, calc(100cqh * 16 / 9))' }}>
                <video
                  ref={videoRef}
                  playsInline
                  className={`w-full h-full object-contain ${sel?.tipo === 'imagen' ? 'hidden' : ''}`}
                  onPause={() => { if (!todo) setReproduciendo(false); }}
                />
                {sel?.tipo === 'imagen' && fuenteLista(sel) && (
                  <img src={fuenteLista(sel)!.url} alt="" className="absolute inset-0 w-full h-full object-contain" />
                )}
                {sel && !lista(sel) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs font-bold text-gray-400">
                    {carga?.error
                      ? <><AlertCircle className="w-6 h-6 text-red-400" />{tx('failedToLoad', 'Could not load the clip')}</>
                      : <><Loader2 className="w-6 h-6 animate-spin text-twitch" />{tx('ed_loading', 'Loading clips…')} {carga?.pct ?? 0}%</>}
                  </div>
                )}
                {!sel && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-500">{tx('ed_empty', 'The timeline is empty. Add a video or an image.')}</div>
                )}
              </div>
            </div>
            {/* transporte */}
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" className={boton} onClick={() => selIdx > 0 && setSelId(piezas[selIdx - 1].id)} disabled={selIdx <= 0} aria-label={tx('ed_prev', 'Previous piece')}><SkipBack className="w-4 h-4" /></button>
              <button
                type="button"
                onClick={() => (reproduciendo ? parar() : reproducir(false))}
                disabled={!lista(sel)}
                aria-label={reproduciendo ? 'Pause' : 'Play'}
                className="w-11 h-11 rounded-xl bg-twitch hover:bg-twitch-dark text-[var(--color-accent-ink)] flex items-center justify-center cursor-pointer disabled:opacity-40 shadow-lg shadow-twitch/25"
              >
                {reproduciendo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button type="button" className={boton} onClick={() => selIdx < piezas.length - 1 && setSelId(piezas[selIdx + 1].id)} disabled={selIdx < 0 || selIdx >= piezas.length - 1} aria-label={tx('ed_next', 'Next piece')}><SkipForward className="w-4 h-4" /></button>
              <button type="button" className={boton} onClick={reproducirTodo} disabled={!piezas.length || pendientesCarga > 0}>
                <ListVideo className="w-4 h-4 text-twitch" />{tx('ed_play_all', 'Play everything')}
              </button>
              <span className="ml-auto text-xs font-mono font-bold text-gray-400 tabular-nums">{mmss(posicion, true)} / {mmss(totalFinal, true)}</span>
            </div>
          </div>

          {/* ---- panel de la pieza ---- */}
          <aside className="lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0e0d12] flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
              {sel ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-twitch">{tx('ed_piece', 'Piece {n}').replace('{n}', String(selIdx + 1))}</p>
                      <p className="text-sm font-bold text-white truncate">{sel.nombre}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" className={boton} onClick={() => desplazar(-1)} disabled={selIdx <= 0} aria-label={tx('ed_move_left', 'Move earlier')}><ChevronLeft className="w-4 h-4" /></button>
                      <button type="button" className={boton} onClick={() => desplazar(1)} disabled={selIdx >= piezas.length - 1} aria-label={tx('ed_move_right', 'Move later')}><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {sel.tipo === 'imagen' ? (
                    <label className="block">
                      <span className="flex justify-between text-xs font-bold text-gray-300 mb-2"><span>{tx('mergeImageSecs', 'Seconds on screen')}</span><span className="font-mono text-twitch">{sel.total}s</span></span>
                      <input type="range" min={1} max={30} value={sel.total} onChange={e => { const v = parseInt(e.target.value, 10); cambiar(sel.id, { total: v, fin: v }); }} className="w-full accent-twitch h-1.5 cursor-pointer" />
                    </label>
                  ) : (
                    <>
                      <section className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{tx('ed_trim', 'Trim')}</h4>
                        <TrimBar
                          total={sel.total}
                          inicio={sel.inicio}
                          fin={sel.fin}
                          actual={tiempo}
                          frames={frames}
                          onChange={(a, b) => cambiar(sel.id, { inicio: a, fin: b })}
                          onSeek={buscarEnPieza}
                          etiquetaInicio={tx('ed_start', 'Start')}
                          etiquetaFin={tx('ed_end', 'End')}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" className={boton + ' justify-center'} onClick={marcarInicio} disabled={!lista(sel)}>[ {tx('ed_set_start', 'Start here')}</button>
                          <button type="button" className={boton + ' justify-center'} onClick={marcarFin} disabled={!lista(sel)}>{tx('ed_set_end', 'End here')} ]</button>
                          <button type="button" className={boton + ' justify-center col-span-2 !border-twitch/40 !text-white'} onClick={cortar} disabled={!puedeCortar}>
                            <Scissors className="w-4 h-4 text-twitch" />{tx('ed_split', 'Split at the playhead')}
                          </button>
                          {(sel.inicio > 0.01 || sel.fin < sel.total - 0.01) && (
                            <button type="button" className={boton + ' justify-center col-span-2'} onClick={() => cambiar(sel.id, { inicio: 0, fin: sel.total })}>
                              <RotateCcw className="w-3.5 h-3.5" />{tx('ed_reset_trim', 'Undo the trim')}
                            </button>
                          )}
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{tx('ed_audio', 'Sound')}</h4>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => cambiar(sel.id, { silencio: !sel.silencio })} aria-label={sel.silencio ? tx('ed_unmute', 'Unmute') : tx('ed_mute', 'Mute')} className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer shrink-0 ${sel.silencio ? 'border-red-400/50 text-red-300 bg-red-500/10' : 'border-white/10 text-gray-300 hover:text-white'}`}>
                            {sel.silencio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <input type="range" min={0} max={100} value={Math.round(sel.volumen * 100)} disabled={sel.silencio} onChange={e => cambiar(sel.id, { volumen: parseInt(e.target.value, 10) / 100 })} aria-label={tx('ed_volume', 'Volume')} className="flex-1 accent-twitch h-1.5 cursor-pointer disabled:opacity-30" />
                          <span className="w-10 text-right text-xs font-mono font-bold text-twitch">{sel.silencio ? '0' : Math.round(sel.volumen * 100)}%</span>
                        </div>
                      </section>

                      <section className="space-y-3">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{tx('ed_speed', 'Speed')}</h4>
                        <div className="flex p-1 rounded-xl bg-dark-950 border border-white/10 gap-1">
                          {VELOCIDADES.map(v => (
                            <button key={v} type="button" onClick={() => cambiar(sel.id, { velocidad: v })} aria-pressed={sel.velocidad === v} className={`flex-1 py-2 rounded-lg text-[11px] font-bold cursor-pointer ${sel.velocidad === v ? 'bg-twitch text-[var(--color-accent-ink)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{v}x</button>
                          ))}
                        </div>
                      </section>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" className={boton + ' justify-center'} onClick={duplicar}><Copy className="w-3.5 h-3.5" />{tx('ed_duplicate', 'Duplicate')}</button>
                    <button type="button" className={boton + ' justify-center hover:!text-red-300 hover:!border-red-400/40'} onClick={borrar}><Trash2 className="w-3.5 h-3.5" />{tx('ed_delete', 'Remove')}</button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-500">{tx('ed_empty', 'The timeline is empty. Add a video or an image.')}</p>
              )}
            </div>

            {/* ---- exportar ---- */}
            <div className="shrink-0 border-t border-white/10 p-3 space-y-2.5">
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
                    {([['uno', <Film key="f" className="w-3.5 h-3.5" />, tx('ed_one_video', 'One video')], ['separado', <Package key="p" className="w-3.5 h-3.5" />, tx('ed_separate', 'Separate (ZIP)')]] as const).map(([id, icono, txt]) => (
                      <button key={id} type="button" onClick={() => setModo(id)} aria-pressed={modo === id} className={`flex-1 py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${modo === id ? 'bg-twitch text-[var(--color-accent-ink)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{icono}{txt}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { on: fundido, set: setFundido, icon: <Blend className="w-3.5 h-3.5" />, label: tx('ed_fades', 'Fades') },
                      { on: conMarca, set: setConMarca, icon: <Sparkles className="w-3.5 h-3.5" />, label: tx('ed_watermark', 'Watermark') },
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
                  <p className="text-[10px] text-gray-500 leading-snug">{tx('ed_export_hint', 'It records in real time, so it takes about as long as the result. Keep this tab open.')} {alto}p</p>
                </>
              )}
              {hecho && !exp && <p className="text-[11px] font-bold text-green-400">{tx('mergeDone', 'Done! The video is in your downloads.')}</p>}
              {errorExp && <p className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">{errorExp}</p>}
            </div>
          </aside>
        </div>

        {/* ---- línea de tiempo ---- */}
        <div className="shrink-0 border-t border-white/10 bg-[#0b0a0f] px-3 md:px-5 pt-2 pb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{tx('ed_timeline', 'Timeline')}</h4>
            <input ref={inputRef} type="file" accept="video/*,image/*" multiple className="hidden" onChange={e => { anadir(e.target.files); e.target.value = ''; }} />
            <button type="button" className={boton} onClick={() => inputRef.current?.click()}>
              <Plus className="w-4 h-4 text-twitch" />{tx('mergeAddOwn', 'Add your own video or image')}
            </button>
          </div>
          {errorPropio && <p className="text-[11px] font-bold text-red-400 mb-1">{errorPropio}</p>}
          <Timeline
            piezas={piezas}
            seleccionada={selId}
            onSelect={id => { parar(); setSelId(id); }}
            onReorder={setPiezas}
            posicion={posicion}
            onSeek={tg => { parar(); saltarGlobal(tg); }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClipEditor;
