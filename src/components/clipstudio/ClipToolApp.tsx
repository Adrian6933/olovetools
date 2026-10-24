// ============================================================================
// La herramienta de descarga de clips, común a TwitchBolt y KickBolt
// ----------------------------------------------------------------------------
// Las dos páginas eran copias que se iban separando: cada mejora había que
// hacerla dos veces y a KickBolt no le llegaban. Ahora son esto mismo con una
// configuración distinta (ClipToolConfig): de dónde salen los clips, cómo se
// leen sus enlaces, sus ilustraciones, su cabecera y su color.
// ============================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ClipResult from './ClipResult';
import {
  loadStoredWatermarkConfig,
  saveStoredWatermarkConfig,
  loadStoredPresets,
  saveCustomPresets,
  loadStoredQuality,
  saveStoredQuality,
  loadStoredWatermarkAll,
  saveStoredWatermarkAll,
  nombreDeArchivo,
} from './watermarkService';
import WatermarkPreview from './WatermarkPreview';
import type { WatermarkConfig, PositionPreset, ClipData, ClipItem, LoadingState } from './types';
import ClipSkeleton from './ClipSkeleton';
import ClipSortBar from './ClipSortBar';
import SortableClipList, { type SortableClipListHandle } from './SortableClipList';
import ClipOrderPanel from './ClipOrderPanel';
import MergePanel, { type MergePanelHandle } from './MergePanel';
import ClipEditor from './editor/ClipEditor';
import { FUERZA, leerCalidad } from './nitidez';
import { obtenerFuente, soltarFuentes, type Pieza } from './editor/model';
import { sendToTool } from '../../lib/handoff';
import { BrandContext, type ClipBrand } from './brand';
import {
  ArrowRight, Loader2, FileText, Zap, Sparkles, ArrowUp, Lightbulb, CheckCircle2, FolderDown, X, ChevronDown, Diamond, Film, Gauge, Scissors, ExternalLink, Clapperboard, Layers, Download, Crop, Blend
} from 'lucide-react';
import { AdBanner } from '../shared/AdBanner';
import { createTranslator, type Language } from '../../locales/meta';
import JSZip from 'jszip';
import { FORMATOS, sufijoFormato, type Encaje, type Formato } from './formato';
import { DESCARGAS_A_LA_VEZ, procesarClips, resolucionDe, semaforo, soltarDescarga, type ProgresoLote } from './lotes';

type Ilustracion = React.FC<{ className?: string }>;

/** Lo que distingue a una herramienta de la otra. */
export interface ClipToolConfig {
  brand: ClipBrand;
  /** Ruta y prefijo de lo guardado: "twitchbolt", "kickbolt". */
  slug: string;
  fetchClipInfo: (url: string) => Promise<ClipData>;
  /** Saca los enlaces de clip válidos de lo pegado, ya sin repetidos. */
  extractLinks: (text: string) => string[];
  route: {
    getLastRoute: () => { host: string } | null;
    setAllowThirdParty: (allow: boolean) => void;
  };
  Header: React.FC<any>;
  Footer: React.FC<any>;
  LegalModal: React.FC<any>;
  art: {
    HeroArt: Ilustracion;
    IconPaste: Ilustracion; IconBulk: Ilustracion; IconQuality: Ilustracion;
    IconZip: Ilustracion; IconNoLogin: Ilustracion; IconRoute: Ilustracion;
    StepPaste: Ilustracion; StepPick: Ilustracion; StepFetch: Ilustracion; StepSave: Ilustracion;
  };
  /** El enlace a la herramienta hermana. */
  crossSell: { slug: string; label: string; cta: string; color: string };
  fallbacks: { routeNotice: string; noLinks: string };
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

interface ClipToolAppProps {
  lang: Language;
  dictionary?: any;
  tool: ClipToolConfig;
}

const ClipToolApp: React.FC<ClipToolAppProps> = ({ lang = 'en', dictionary, tool }) => {
  const { brand, slug, Header, Footer, LegalModal } = tool;
  const {
    HeroArt, IconBulk, IconNoLogin, IconPaste, IconQuality, IconRoute, IconZip,
    StepFetch, StepPaste, StepPick, StepSave,
  } = tool.art;
  const { fetchClipInfo } = tool;
  const fetchMovieBlob = brand.fetchMovieBlob;
  const { getLastRoute, setAllowThirdParty } = tool.route;
  const RELAY_KEY = `${slug}-allow-relays`;
  const [inputText, setInputText] = useState('');
  const [status, setStatus] = useState<LoadingState>('idle');
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [zipProgress, setZipProgress] = useState<{current: number, total: number, percentage: number, loadedBytes: number, totalBytes: number, speed: number, preparingZip?: boolean} | null>(null);
  const [activeLegal, setActiveLegal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  // La calidad se recuerda: es lo primero que se toca al llegar y volver a
  // ponerla en cada visita no aporta nada.
  // Se lee tras montar, no en el primer render: el servidor pinta 'max' y si
  // el navegador pintara otra cosa React se quejaría de la hidratación. Y se
  // guarda al elegir, no en un efecto, que la machacaría con 'max' al cargar.
  const [selectedQuality, setSelectedQuality] = useState('max');
  useEffect(() => { setSelectedQuality(loadStoredQuality(brand, 'max')); }, [brand]);

  // ---- marca de agua en todos los clips de golpe --------------------------
  // Es un interruptor, no un botón de "hazlo ahora": con él puesto, el ZIP de
  // siempre sale con la marca incrustada en cada clip. Antes era una acción
  // aparte que soltaba los vídeos sueltos uno a uno, y había que ir
  // recogiéndolos de la carpeta de descargas mientras salían.
  const [marcaActiva, setMarcaActiva] = useState(false);
  useEffect(() => { setMarcaActiva(loadStoredWatermarkAll(brand)); }, []);
  const cambiarMarcaActiva = (activa: boolean) => {
    setMarcaActiva(activa);
    saveStoredWatermarkAll(brand, activa);
    if (activa) {
      setWmAllConfig(loadStoredWatermarkConfig(brand));
      setWmAllPresets(loadStoredPresets(brand));
    } else {
      setWmEditorAbierto(false);
    }
  };

  /** El editor grande: se toca la marca una vez y todos salen igual. */
  const [wmEditorAbierto, setWmEditorAbierto] = useState(false);
  const [wmAllConfig, setWmAllConfig] = useState<WatermarkConfig | null>(null);
  const [wmAllPresets, setWmAllPresets] = useState<PositionPreset[]>([]);

  const cambiarConfigMarca = (siguiente: WatermarkConfig) => {
    setWmAllConfig(siguiente);
    // Guardada en el navegador: es la misma marca que usan los editores de
    // cada clip, así que tocarla aquí la cambia en todas partes.
    saveStoredWatermarkConfig(brand, siguiente);
  };

  const guardarPresetMarca = (nuevo: PositionPreset) => {
    setWmAllPresets(prev => {
      const siguiente = [...prev, nuevo];
      saveCustomPresets(brand, siguiente);
      return siguiente;
    });
  };

  const borrarPresetMarca = (id: string) => {
    setWmAllPresets(prev => {
      const siguiente = prev.filter(x => x.id !== id);
      saveCustomPresets(brand, siguiente);
      return siguiente;
    });
  };

  const [wmAll, setWmAll] = useState<(ProgresoLote & { fase: 'trabajo' | 'zip' }) | null>(null);
  const wmAllAbort = useRef<AbortController | null>(null);
  /** Cuántos se quedaron por el camino en la última pasada. */
  const [wmAllFallos, setWmAllFallos] = useState(0);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  /** Mientras se une el vídeo, el ZIP y la marca en lote esperan. */
  const [uniendo, setUniendo] = useState(false);

  // ---- qué sale al pulsar el botón grande -----------------------------------
  // Los clips sueltos en un ZIP, todos seguidos en un vídeo, o las dos cosas
  // (el vídeo largo y cada clip aparte, en un ZIP). El vídeo lo arma el panel
  // de unir, que tiene sus opciones (fundido, lo propio, calidad).
  type ModoDescarga = 'clips' | 'video' | 'ambos';
  const MODO_KEY = `${brand.storagePrefix}_download_mode`;
  const [modoGuardado, setModoGuardado] = useState<ModoDescarga>('clips');
  useEffect(() => {
    try {
      const v = localStorage.getItem(MODO_KEY);
      if (v === 'video' || v === 'ambos') setModoGuardado(v);
    } catch { /* sin almacenamiento, el de serie */ }
  }, []);
  const cambiarModo = (m: ModoDescarga) => {
    setModoGuardado(m);
    try { localStorage.setItem(MODO_KEY, m); } catch { /* vale para esta visita */ }
  };
  const mergeRef = useRef<MergePanelHandle>(null);

  // Forma de lo que se exporta: por separado para el vídeo unido y para los
  // clips (p. ej. el vídeo en 16:9 y los clips en vertical para el móvil).
  const FORMATO_KEY = `${brand.storagePrefix}_export_format`;
  const [formatoVideo, setFormatoVideo] = useState<Formato>('original');
  const [formatoClips, setFormatoClips] = useState<Formato>('original');
  const [encaje, setEncaje] = useState<Encaje>('recortar');
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(FORMATO_KEY) || 'null');
      if (v && FORMATOS.includes(v.video)) setFormatoVideo(v.video);
      if (v && FORMATOS.includes(v.clips)) setFormatoClips(v.clips);
      if (v && (v.encaje === 'recortar' || v.encaje === 'difuminar')) setEncaje(v.encaje);
    } catch { /* el de serie */ }
  }, []);
  const guardarFormato = (cambio: Partial<{ video: Formato; clips: Formato; encaje: Encaje }>) => {
    const siguiente = { video: formatoVideo, clips: formatoClips, encaje, ...cambio };
    setFormatoVideo(siguiente.video);
    setFormatoClips(siguiente.clips);
    setEncaje(siguiente.encaje);
    try { localStorage.setItem(FORMATO_KEY, JSON.stringify(siguiente)); } catch { /* vale para esta visita */ }
  };

  // ---- editor de clips ----------------------------------------------------
  // Las piezas viven aquí y no en el editor: cerrarlo y volver a abrirlo
  // conserva los recortes.
  const [editor, setEditor] = useState<{ enfoque: string | null } | null>(null);
  const clipsListos = React.useMemo(
    () => clips.filter(c => c.status === 'success' && c.data).map(c => c.data!),
    [clips],
  );
  const [piezasEditor, setPiezasEditor] = useState<Pieza[]>([]);

  // ---- "Abrir en Clip Editor": los clips, a la herramienta suelta ----------
  // Se bajan (o se toman de la caché del editor, si ya se abrió) y viajan por
  // el traspaso de lib/handoff, todos en un solo registro.
  const [enviando, setEnviando] = useState<number | null>(null);
  const enviarAlEditor = async () => {
    if (enviando !== null || !clipsListos.length) return;
    setEnviando(0);
    try {
      const archivos: Array<{ blob: Blob; name: string }> = [];
      for (let i = 0; i < clipsListos.length; i += 1) {
        const c = clipsListos[i];
        const r = selectedQuality === 'max'
          ? c.resolutions[0]
          : c.resolutions.find(x => x.quality === `${selectedQuality}p`) || c.resolutions.find(x => x.quality.startsWith(selectedQuality)) || c.resolutions[0];
        const f = await obtenerFuente(`clip:${c.id}`, () => fetchMovieBlob(r.url, (l, tot) => {
          if (tot > 0) setEnviando(Math.round(((i + l / tot) / clipsListos.length) * 100));
        }));
        archivos.push({ blob: f.blob, name: `${nombreDeArchivo(c.title, c.broadcaster, c.id)}.mp4` });
        setEnviando(Math.round(((i + 1) / clipsListos.length) * 100));
      }
      const [primero, ...resto] = archivos;
      await sendToTool('clip-editor', lang, primero.blob, primero.name, slug, resto);
    } catch {
      setEnviando(null);
    }
  };

  // Cambiar el orden desde fuera de las tarjetas (panel, atajos de orden):
  // primero se le avisa a la lista para que las tarjetas se deslicen.
  const listaRef = useRef<SortableClipListHandle>(null);
  const reordenar = useCallback((next: ClipItem[]) => {
    listaRef.current?.snapshot();
    setClips(next);
  }, []);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qualityRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // fetchClipInfo cannot be aborted through the relay chain. Keep the
  // current batch identity so a late response cannot restore discarded clips.
  const resolveRequestRef = useRef(0);
  
  const t = createTranslator(dictionary);

  // Labels used to be hardcoded English inside the component, so the three
  // quality choices stayed in English in all nine languages.
  const qualityOptions = [
    { id: 'max', label: t.qMaxLabel || 'Max Quality', sub: t.qMaxSub || 'Original Source', icon: <Diamond className="w-4 h-4 text-blue-400" /> },
    { id: '720', label: t.q720Label || '720p HD', sub: t.q720Sub || 'Balanced', icon: <Film className="w-4 h-4 text-twitch" /> },
    { id: '360', label: t.q360Label || '360p Fast', sub: t.q360Sub || 'Low Data', icon: <Gauge className="w-4 h-4 text-green-400" /> }
  ];

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityRef.current && !qualityRef.current.contains(event.target as Node)) {
        setIsQualityOpen(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    if (isQualityOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQualityOpen]);

  // Route preference: the public relays are opt-out, and the choice is
  // remembered so nobody has to re-refuse it on every visit.
  const [allowRelays, setAllowRelays] = useState(true);
  const [lastRouteHost, setLastRouteHost] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(RELAY_KEY);
    const allow = stored === null ? true : stored === '1';
    setAllowRelays(allow);
    setAllowThirdParty(allow);
  }, []);

  const toggleRelays = () => {
    const next = !allowRelays;
    setAllowRelays(next);
    setAllowThirdParty(next);
    try {
      localStorage.setItem(RELAY_KEY, next ? '1' : '0');
    } catch {
      // Storage refused; the choice still holds for this session.
    }
  };

  // useCallback because it is in a useEffect dependency list: as a plain
  // function it was a new value on every render, so the popstate listener was
  // torn down and re-attached on each one.
  const handleReset = useCallback(() => {
    setEditor(null);
    setPiezasEditor([]);
    soltarFuentes();
    resolveRequestRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (wmAllAbort.current) {
      wmAllAbort.current.abort();
      wmAllAbort.current = null;
    }
    setWmAll(null);
    setStatus('idle');
    setClips([]);
    setInputText('');
    setZipProgress(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    val = val.replace(/([^\s\n])(https?:\/\/)/g, '$1\n$2');
    setInputText(val);
  };

  const enlacesDetectados = tool.extractLinks(inputText);

  const processClips = useCallback(async (urls: string[]) => {
    const unique = [...new Set(urls.filter(u => u.trim()))];
    if (unique.length === 0) { setStatus('idle'); return; }
    const requestId = resolveRequestRef.current + 1;
    resolveRequestRef.current = requestId;

    setStatus('success'); // Go to results page immediately

    const initialClips: ClipItem[] = unique.map(url => ({
      id: url,
      url,
      status: 'loading'
    }));
    setClips(initialClips);

    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'results' }, '');
    }

    const CONCURRENCY_LIMIT = 3;
    
    for (let i = 0; i < unique.length; i += CONCURRENCY_LIMIT) {
        const batch = unique.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.allSettled(batch.map(async (url) => {
            try {
                const data = await fetchClipInfo(url);
                if (resolveRequestRef.current !== requestId) return;
                setClips(prev => prev.map(c => c.url === url ? { ...c, status: 'success', data } : c));
            } catch (error) {
                if (resolveRequestRef.current !== requestId) return;
                setClips(prev => prev.map(c => c.url === url ? { ...c, status: 'error' } : c));
            }
        }));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlClips = params.get('clips');
    const storageClips = localStorage.getItem(`${slug}_shared_clips`);
    const sharedClips = urlClips || storageClips;
    
    if (sharedClips) {
      setInputText(sharedClips);
      const urls = sharedClips.split('\n').filter(u => u.trim());
      // Pre-filled, not launched: arriving with a list used to start the whole
      // fan-out of network requests before anyone had picked a quality or even
      // seen what came across. The button is one click away.
      
      // Cleanup
      if (urlClips) window.history.replaceState({ view: 'results' }, '', window.location.pathname);
      if (storageClips) localStorage.removeItem(`${slug}_shared_clips`);
    }
  }, [processClips]);

  // Manejo del botón atrás del navegador/ratón
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Si estamos en la vista de resultados y el usuario pulsa atrás, volvemos al buscador
      if (status === 'success') {
        handleReset();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [status, handleReset]);

  // Reset scroll to top when entering results
  useEffect(() => {
    if (status === 'success') {
      window.scrollTo(0, 0);
    }
  }, [status]);

  const downloadAllAsZip = async () => {
    const validClips = clips.filter(c => c.status === 'success' && c.data).map(c => c.data!);
    if (validClips.length === 0 || zipProgress) return;
    
    // Crear nuevo controlador para permitir abortar
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setZipProgress({ current: 0, total: validClips.length, percentage: 0, loadedBytes: 0, totalBytes: 0, speed: 0 });
    const zip = new JSZip();
    
    let completedCount = 0;
    // Antes un clip que fallaba se quedaba fuera del ZIP sin decir nada.
    let fallidos = 0;
    setWmAllFallos(0);
    let globalLoaded = 0;
    let globalTotal = 0;
    let lastTime = Date.now();
    let lastLoaded = 0;
    let currentSpeed = 0;

    const updateProgress = () => {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        if (timeDiff > 0.5) {
            const bytesDiff = globalLoaded - lastLoaded;
            currentSpeed = bytesDiff / timeDiff;
            lastTime = now;
            lastLoaded = globalLoaded;
        }

        setZipProgress({
            current: completedCount,
            total: validClips.length,
            percentage: Math.round((completedCount / validClips.length) * 100),
            loadedBytes: globalLoaded,
            totalBytes: globalTotal,
            speed: currentSpeed
        });
    };

    try {
      const downloadTask = async (clip: ClipData, index: number) => {
        if (signal.aborted) return;

        const chosenRes = resolucionDe(clip, selectedQuality);

        let clipLoaded = 0;
        let clipTotal = 0;

        try {
          const blob = await fetchMovieBlob(chosenRes.url, (loaded, total) => {
              globalLoaded += (loaded - clipLoaded);
              clipLoaded = loaded;
              if (total > clipTotal) {
                  globalTotal += (total - clipTotal);
                  clipTotal = total;
              }
              updateProgress();
          }, signal);
          const fileName = `${index + 1}_${nombreDeArchivo(clip.title, clip.broadcaster, clip.id)}_${chosenRes.quality}.mp4`;
          zip.file(fileName, blob);
        } catch (err: any) {
          if (err.message !== "AbortError") {
            console.error(`Error downloading clip ${clip.id}`, err);
            if (!signal.aborted) fallidos += 1;
          }
        } finally {
          if (!signal.aborted) {
            completedCount++;
            updateProgress();
          }
        }
      };

      // Una cola y no tandas: en tandas de cinco, un clip lento dejaba a los
      // otros cuatro huecos parados hasta que acababa.
      const turno = semaforo(DESCARGAS_A_LA_VEZ);
      await Promise.all(validClips.map((clip, i) => turno(() => downloadTask(clip, i))));

      if (signal.aborted) throw new Error("AbortError");
      setWmAllFallos(fallidos);
      if (fallidos === validClips.length) throw new Error('Nothing downloaded');

      setZipProgress(prev => prev ? { ...prev, preparingZip: true } : null);

      const content = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      soltarDescarga(content, `${slug}_${selectedQuality}_pack_${new Date().getTime()}.zip`);
      setLastRouteHost(getLastRoute()?.host ?? null);
    } catch (error: any) {
      if (error.message !== "AbortError") {
        alert(t.zipError || "Error generating ZIP");
      }
    } finally {
      if (!signal.aborted) {
        setTimeout(() => setZipProgress(null), 2000);
      }
      abortControllerRef.current = null;
    }
  };

  /**
   * El mismo ZIP de siempre, pero con la marca incrustada en cada clip.
   *
   * Bajar y marcar van en cadena (lotes.ts): mientras se marca un clip ya se
   * bajan los siguientes, y con exportación fotograma a fotograma se marcan dos
   * a la vez. Antes iba de uno en uno y la red y el render se esperaban.
   */
  const descargarZipConMarca = useCallback(async () => {
    const listos = clips.filter(c => c.status === 'success' && c.data).map(c => c.data!);
    if (listos.length === 0 || wmAll || zipProgress) return;
    // También sin marca, si hay que cambiarles la forma.
    const config = marcaActiva ? (wmAllConfig ?? loadStoredWatermarkConfig(brand)) : null;

    const abort = new AbortController();
    wmAllAbort.current = abort;
    setWmAllFallos(0);
    let fallos = 0;
    setWmAll({ hechos: 0, total: listos.length, pct: 0, bajando: 0, marcando: 0, fallos: 0, fase: 'trabajo' });

    try {
      // La nitidez y el alto elegidos (nitidez.ts) valen también aquí.
      const calidadGuardada = leerCalidad(brand.storagePrefix);
      const resultados = await procesarClips(listos, {
        quality: selectedQuality,
        fetchMovieBlob,
        marca: config ? { config, nitidez: FUERZA[calidadGuardada.nitidez], alto: calidadGuardada.alto } : null,
        formato: formatoClips,
        encaje,
        calidad: { nitidez: FUERZA[calidadGuardada.nitidez], alto: calidadGuardada.alto },
        signal: abort.signal,
        onProgress: p => { fallos = p.fallos; setWmAll({ ...p, fase: 'trabajo' }); },
      });

      const zip = new JSZip();
      let metidos = 0;
      resultados.forEach(({ clip, res, final }, i) => {
        if (!final) return;
        const nombre = nombreDeArchivo(clip.title, clip.broadcaster, clip.id);
        const ext = final.type.includes('webm') ? 'webm' : 'mp4';
        zip.file(`${i + 1}_${nombre}_${res.quality}${config ? '_watermark' : ''}${sufijoFormato(formatoClips)}.${ext}`, final);
        metidos += 1;
      });
      if (metidos === 0) return;

      setWmAll(prev => prev ? { ...prev, fase: 'zip', pct: 100 } : prev);
      const contenido = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      soltarDescarga(contenido, `${slug}_${selectedQuality}${config ? '_watermark' : ''}${sufijoFormato(formatoClips)}_pack_${Date.now()}.zip`);
      setLastRouteHost(getLastRoute()?.host ?? null);
    } catch {
      // Cancelar a mitad no deja medio ZIP: o sale entero o no sale.
    } finally {
      wmAllAbort.current = null;
      setWmAll(null);
      setWmAllFallos(abort.signal.aborted ? 0 : fallos);
    }
  }, [clips, wmAll, wmAllConfig, zipProgress, selectedQuality, marcaActiva, formatoClips, encaje]);

  const modo: 'clips' | 'video' | 'ambos' = clipsListos.length > 1 ? modoGuardado : 'clips';

  const activeOption = qualityOptions.find(o => o.id === selectedQuality) || qualityOptions[0];

  /** Sobre este se previsualiza la marca; la que se guarda va a todos. */
  const primerClipListo = clips.find(c => c.status === 'success' && c.data)?.data ?? null;

  const handleLangChange = (code: string) => {
    if (code === lang) return;
    localStorage.setItem('olovetools_lang', code);
    window.location.href = `/${code}/${slug}`;
  };

  /**
   * Reinicio desde el nombre de la herramienta en la cabecera.
   * No hace nada mientras se arma un ZIP: reiniciar ahi aborta la descarga y tira el trabajo sin avisar.
   */
  const handleSoftReset = () => {
    handleReset();
  };

  return (
    <BrandContext.Provider value={brand}>
    <div className="min-h-screen flex flex-col bg-[#050407] selection:bg-twitch/30 relative overflow-x-clip" style={{ ...brand.cssVars, backgroundImage: 'linear-gradient(to bottom, #15121e 0%, #0f0d14 25%, #0a080f 50%, #07060a 75%, #050407 100%)' }}>
      {/* Long Linear Atmospheric Glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-twitch/[0.05] via-transparent to-transparent pointer-events-none" />
      
      <Header
        onReset={handleSoftReset} resetHint={t('resetHint')} currentLang={lang} onLangChange={handleLangChange} />

      {/* Keep the workspace centered within its own maximum width. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 sm:px-6 pt-56 md:pt-52 pb-40">
        <AdBanner id={`adsense-${slug}-top`} className="mb-12" />
        
        {status !== 'success' && (
          <div className="flex flex-col items-center">
            <div className="text-center mb-16 space-y-6 animate-slide-up">
              <h1 className="text-[clamp(2.5rem,10.5vw,115px)] font-[900] uppercase leading-[0.82] tracking-tight text-white pr-6 inline-block max-w-full skew-x-[-15deg] drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <span className="block mb-2">{t.heroTitle?.split(' ')[0]}</span>
                <span className="text-twitch">{t.heroTitle?.split(' ').slice(1,2)}</span> <span className="text-white">{t.heroTitle?.split(' ').slice(2).join(' ')}</span>
              </h1>
              <h2 className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed opacity-60">
                {t.heroDesc}
              </h2>
              <HeroArt className="w-full max-w-lg mx-auto h-auto pt-4" />
            </div>

            <div className="w-full max-w-4xl animate-slide-up [animation-delay:150ms]">
              <div 
                style={{ willChange: 'transform' }}
                className="bg-[#111114]/50 backdrop-blur-3xl border border-white/5 p-4 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
              >
                <div className="bg-[#0e0e10] rounded-[3rem] p-10 flex flex-col md:flex-row gap-12 items-stretch">
                  <div className="md:w-[38%] shrink-0 order-2 md:order-1">
                    <input type="file" ref={fileInputRef} accept=".txt" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = (ev) => setInputText(ev.target?.result as string);
                        r.readAsText(file);
                      }
                    }} className="hidden" />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full min-h-[140px] md:min-h-[280px] border-2 border-dashed border-white/5 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center justify-center gap-4 md:gap-6 hover:border-twitch/40 hover:bg-twitch/5 transition-all group overflow-hidden p-6 md:p-0 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="p-4 md:p-7 bg-dark-800 rounded-xl md:rounded-[2rem] group-hover:scale-110 transition-transform shadow-inner shrink-0">
                        <FileText className="w-6 h-6 md:w-12 md:h-12 text-gray-500 group-hover:text-twitch" />
                      </div>
                      <span className="text-[9px] md:text-[11px] font-[900] uppercase tracking-[0.15em] md:tracking-[0.25em] text-white/40 group-hover:text-white/80 text-center">
                        {t.uploadTxt}
                      </span>
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-between gap-6 py-2 order-1 md:order-2">
                    <div className="flex flex-col gap-5 h-full">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 px-2">
                        <div className="order-2 md:order-1 flex items-center gap-2.5">
                          <div className="w-1.5 h-1.5 bg-twitch rounded-full animate-pulse" />
                          <span className="text-[10px] font-black text-gray-400 md:text-gray-500 uppercase tracking-[0.2em]">{t.linkInputLabel}</span>
                        </div>
                        <div className="order-1 md:order-2 px-3 py-1 bg-twitch/10 rounded-md border border-twitch/20">
                          <span className="text-[9px] font-black text-twitch uppercase tracking-[0.2em]">{t.twitchClipsLabel}</span>
                        </div>
                      </div>
                      
                      <div 
                        style={{ willChange: 'transform, opacity, border-color' }}
                        className={`
                        relative flex-1 bg-white/[0.02] rounded-[2rem] p-6 border-2 transition-all duration-1000
                        ${!inputText ? 'border-twitch/30 animate-soft-pulse shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.05)]' : 'border-white/5'}
                        focus-within:border-twitch/50 focus-within:bg-white/[0.04] focus-within:animate-none focus-within:scale-[1.01] focus-within:shadow-[0_0_50px_rgba(var(--color-accent-rgb),0.1)]
                      `}>
                        <textarea 
                          value={inputText}
                          onChange={handleTextChange}
                          placeholder={t.pastePlaceholder}
                          className="w-full h-44 md:h-64 bg-transparent border-none text-base md:text-xl font-medium placeholder:text-gray-700 resize-none outline-none text-white p-0 custom-scrollbar relative z-10"
                        />
                        {!inputText && (
                          <div className="absolute top-6 left-5 pointer-events-none flex items-center gap-1">
                            <div className="w-[3px] h-6 md:h-8 bg-twitch rounded-full animate-caret shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.8)]" />
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => processClips(enlacesDetectados)}
                      disabled={status === 'loading' || enlacesDetectados.length === 0}
                      className="w-full h-16 bg-twitch hover:bg-twitch-dark text-[var(--color-accent-ink)] rounded-2xl font-[900] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(var(--color-accent-rgb),0.3)] transition-all hover:translate-y-[-2px] hover:scale-[1.01] active:translate-y-[1px] active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {status === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : <> {t.processButton} <ArrowRight className="w-5 h-5" /> </>}
                    </button>
                    {/* Lo que se ha entendido de lo pegado, antes de pulsar: con
                        texto escrito y cero enlaces el botón estaba gris sin
                        decir por qué. */}
                    {inputText.trim() && (
                      <div className={`-mt-2 text-xs font-bold text-center ${enlacesDetectados.length ? 'text-gray-400' : 'text-amber-300'}`}>
                        {enlacesDetectados.length
                          ? (enlacesDetectados.length === 1
                              ? (t.linksDetectedOne || '1 clip ready to fetch')
                              : (t.linksDetected || '{n} clips ready to fetch').replace('{n}', String(enlacesDetectados.length)))
                          : (t.noClipsFound || tool.fallbacks.noLinks)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Route disclosure. Neither platform serves its clip data and CDN
                with CORS a browser may read, so the request is always relayed;
                until now the page said nothing about that and the legal text
                only promised that *our* server keeps no log. */}
            <div className="mt-6 w-full max-w-4xl animate-slide-up [animation-delay:180ms]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#18181b]/60 border border-white/5 rounded-2xl">
                <div className="w-8 h-8 shrink-0"><IconRoute /></div>
                <p className="flex-1 text-xs text-gray-400 leading-relaxed">
                  {t.routeNotice || tool.fallbacks.routeNotice}
                  {lastRouteHost && (
                    <span className="block mt-1 text-gray-500">
                      {(t.routeLast || 'Last download handled by: {host}').replace('{host}', lastRouteHost)}
                    </span>
                  )}
                </p>
                <button
                  onClick={toggleRelays}
                  className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border ${
                    allowRelays
                      ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                      : 'bg-twitch/10 border-twitch/30 text-twitch'
                  }`}
                >
                  {allowRelays ? (t.routeAllowOn || 'Public relays: on') : (t.routeAllowOff || 'Public relays: off')}
                </button>
              </div>
            </div>

            <div className="mt-6 w-full max-w-4xl animate-slide-up [animation-delay:200ms]">
               <a
                 href={`/${lang}/${tool.crossSell.slug}`}
                 className="flex flex-col md:flex-row items-center justify-center gap-3 p-4 border rounded-2xl transition-all group cursor-pointer hover:brightness-125"
                 style={{ backgroundColor: `${tool.crossSell.color}1a`, borderColor: `${tool.crossSell.color}33` }}
               >
                  <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: tool.crossSell.color }} />
                  <span className="text-sm font-medium text-gray-300">
                    {tool.crossSell.label} <span className="font-bold" style={{ color: tool.crossSell.color }}>{tool.crossSell.cta} →</span>
                  </span>
               </a>
            </div>

            <div className="mt-48 w-full max-w-4xl animate-slide-up [animation-delay:300ms]">
               <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-[#18181b]/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] hover:bg-[#18181b]/50 transition-all group">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-twitch fill-twitch/10" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-white">{t.ctaTitle}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{t.ctaDesc}</p>
                  </div>
                  <a 
                    href={`/${lang}/${brand.id === 'kick' ? 'klipy' : 'clipy'}/`}
                    className="bg-twitch text-[var(--color-accent-ink)] px-10 py-4 rounded-xl font-[900] uppercase text-xs tracking-widest hover:bg-twitch-dark transition-all shadow-xl shadow-twitch/10 hover:scale-105 whitespace-nowrap"
                  >
                    {t.ctaButton}
                  </a>
               </div>
            </div>

            <section className="mt-48 w-full max-w-6xl animate-slide-up [animation-delay:450ms]">
                <div className="flex flex-col items-center text-center space-y-4 mb-16">
                    <div className="bg-yellow-500/10 p-4 rounded-[1.5rem] border border-yellow-500/20">
                        <Lightbulb className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h2 className="text-4xl font-[900] uppercase italic tracking-tighter text-white">{t.proTipsTitle}</h2>
                    <div className="w-24 h-1 bg-yellow-500 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                      { title: t.tip1Title, desc: t.tips1, color: 'border-blue-500/20' },
                      { title: t.tip2Title, desc: t.tips2, color: 'border-pink-500/20' },
                      { title: t.tip3Title, desc: t.tips3, color: 'border-green-500/20' }
                    ].map((tip, i) => (
                      <div key={i} className={`p-10 bg-[#111114] border ${tip.color} rounded-[2.5rem] space-y-4 hover:bg-[#18181b] transition-all`}>
                          <h4 className="font-black text-white uppercase tracking-widest text-xs flex items-center gap-3">
                              <CheckCircle2 className="w-4 h-4 text-green-500" /> {tip.title}
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">{tip.desc}</p>
                      </div>
                    ))}
                </div>
            </section>

            {/* How it works ------------------------------------------------- */}
            <section id="how-it-works" className="mt-32 w-full max-w-6xl space-y-10 scroll-mt-32">
              <h2 className="text-3xl md:text-4xl font-[900] uppercase italic tracking-tighter text-white text-center">
                {t.howTitle || 'How it works'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { art: StepPaste, title: t.step1Title, text: t.step1Text },
                  { art: StepPick, title: t.step2Title, text: t.step2Text },
                  { art: StepFetch, title: t.step3Title, text: t.step3Text },
                  { art: StepSave, title: t.step4Title, text: t.step4Text },
                ].map((step, i) => (
                  <div key={i} className="bg-[#111114] border border-white/5 rounded-[2rem] p-5 space-y-4">
                    <step.art />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-twitch/15 text-twitch text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      {step.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Features ----------------------------------------------------- */}
            <section className="mt-32 w-full max-w-6xl space-y-10">
              <h2 className="text-3xl md:text-4xl font-[900] uppercase italic tracking-tighter text-white text-center">
                {t.featuresTitle || 'What it actually does'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: IconPaste, title: t.feat1Title, text: t.feat1Text },
                  { icon: IconBulk, title: t.feat2Title, text: t.feat2Text },
                  { icon: IconQuality, title: t.feat3Title, text: t.feat3Text },
                  { icon: IconZip, title: t.feat4Title, text: t.feat4Text },
                  { icon: IconNoLogin, title: t.feat5Title, text: t.feat5Text },
                  { icon: IconRoute, title: t.feat6Title, text: t.feat6Text },
                ].map((f, i) => (
                  <div key={i} className="bg-[#111114] border border-white/5 rounded-[2rem] p-8 space-y-4 hover:bg-[#18181b] transition-all">
                    <div className="w-10 h-10"><f.icon /></div>
                    <h3 className="font-black text-white uppercase tracking-widest text-xs">{f.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ ---------------------------------------------------------- */}
            {Array.isArray(t.faq) && t.faq.length > 0 && (
              <section className="mt-32 w-full max-w-3xl space-y-8">
                <h2 className="text-3xl md:text-4xl font-[900] uppercase italic tracking-tighter text-white text-center">
                  {t.faqTitle || 'Frequently Asked Questions'}
                </h2>
                <div className="space-y-3">
                  {t.faq.map((item: any, i: number) => (
                    <details key={i} className="group bg-[#111114] border border-white/5 rounded-[1.5rem] overflow-hidden">
                      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none text-sm font-bold text-white hover:opacity-80 transition-opacity">
                        <span>{item.question}</span>
                        <span className="text-xl leading-none text-twitch shrink-0 transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="px-6 pb-6 text-sm text-gray-400 leading-relaxed">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* RESULTS AREA */}
        {status === 'success' && (
          <div id="results-area" className={`w-full space-y-8 animate-fade-in mx-auto ${clips.length > 1 ? 'max-w-6xl' : 'max-w-5xl'}`}>
             <div className="w-full bg-[#111114] border border-white/5 rounded-[2.5rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 xl:gap-6 shadow-2xl relative z-40">
                
                {/* Barra al 88%, margen superior de 4px, centrada horizontalmente */}
                {zipProgress && (
                  <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-[88%] h-1 overflow-hidden pointer-events-none rounded-full bg-white/5">
                    <div className="h-full bg-twitch transition-all duration-300 z-50" style={{ width: `${zipProgress.percentage}%` }}></div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 px-2 md:px-4 xl:px-6">
                    <h2 className="text-sm font-black uppercase text-white tracking-widest">{clips.length} {t.clipsFound}</h2>
                </div>

                {/* CUSTOM SELECT QUALITY */}
                <div className="relative w-full md:flex-1 md:max-w-xs min-w-0" ref={qualityRef}>
                    <button 
                      onClick={() => setIsQualityOpen(!isQualityOpen)}
                      className="relative z-50 w-full bg-dark-950 text-white rounded-2xl p-4 border border-white/5 flex items-center justify-between group hover:border-twitch/30 transition-all cursor-pointer hover:bg-white/[0.03] active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-twitch/10 transition-colors">
                              {activeOption.icon}
                            </div>
                            <div className="text-left">
                              <p className="text-xs font-black uppercase tracking-tight">{activeOption.label}</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase">{activeOption.sub}</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isQualityOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isQualityOpen && (
                        <div 
                          className="absolute top-full left-0 w-full mt-2 bg-[#111114] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-fade-in z-50"
                        >
                            {qualityOptions.map((opt) => (
                              <button 
                                key={opt.id}
                                onClick={() => { setSelectedQuality(opt.id); saveStoredQuality(brand, opt.id); setIsQualityOpen(false); }}
                                className={`w-full flex items-center gap-4 p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer ${selectedQuality === opt.id ? 'bg-twitch/5' : ''}`}
                              >
                                  <div className={`p-2 rounded-lg ${selectedQuality === opt.id ? 'bg-twitch/20' : 'bg-white/5'}`}>
                                    {opt.icon}
                                  </div>
                                  <div>
                                      <p className={`text-xs font-black uppercase tracking-tight ${selectedQuality === opt.id ? 'text-twitch' : 'text-white'}`}>
                                        {opt.label}
                                      </p>
                                      <p className="text-[9px] font-bold text-gray-500 uppercase">{opt.sub}</p>
                                  </div>
                                  {selectedQuality === opt.id && <div className="ml-auto w-1.5 h-1.5 bg-twitch rounded-full" />}
                              </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto shrink-0">
                    {(() => {
                      const isAnyLoading = clips.some(c => c.status === 'loading');
                      return (
                        <button
                          onClick={modo === 'clips'
                            ? (marcaActiva || formatoClips !== 'original' ? descargarZipConMarca : downloadAllAsZip)
                            : () => mergeRef.current?.empezar()}
                          disabled={!!zipProgress || !!wmAll || isAnyLoading || uniendo}
                          className="flex-1 md:flex-none justify-center bg-white text-black font-[900] text-xs px-5 md:px-6 xl:px-10 py-4 rounded-xl flex items-center gap-3 hover:bg-gray-100 uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.03] active:scale-[0.97] shadow-xl"
                        >
                          {isAnyLoading ? (
                            <> <Loader2 className="w-4 h-4 animate-spin" /> {t.loadingClips || 'LOADING CLIPS...'} </>
                          ) : uniendo ? (
                            // El detalle va en el panel de unir, que se abre solo.
                            <> <Loader2 className="w-4 h-4 animate-spin" /> {t.mergeBusy || 'Creating the video...'} </>
                          ) : wmAll ? (
                            // Con marca el ZIP tarda: el detalle de por dónde va
                            // está en el panel de abajo, aquí basta el recuento.
                            wmAll.fase === 'zip' ? (
                              <> <Loader2 className="w-4 h-4 animate-spin" /> {t.preparingZip || 'PREPARING ZIP...'} </>
                            ) : (
                              <> <Loader2 className="w-4 h-4 animate-spin" /> {wmAll.hechos}/{wmAll.total} ({wmAll.pct}%) </>
                            )
                          ) : zipProgress ? (
                            zipProgress.preparingZip ? (
                              <> <Loader2 className="w-4 h-4 animate-spin" /> {t.preparingZip || 'PREPARING ZIP...'} </>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>{zipProgress.current}/{zipProgress.total} ({zipProgress.percentage}%)</span>
                                </div>
                                {zipProgress.speed > 0 && (
                                  <span className="text-[9px] text-gray-500 font-bold mt-0.5">
                                    {formatBytes(zipProgress.speed)}/s • {formatBytes(zipProgress.loadedBytes)}
                                  </span>
                                )}
                              </div>
                            )
                          ) : modo === 'video' ? (
                            <> <Clapperboard className="w-4 h-4" /> {t.mergeGo || 'Create the video'} </>
                          ) : modo === 'ambos' ? (
                            <> <Layers className="w-4 h-4" /> {t.mergeGoBoth || 'Create video + clips'} </>
                          ) : (
                            <> <FolderDown className="w-4 h-4" /> {t.downloadZip || 'Download ZIP'} </>
                          )}
                        </button>
                      );
                    })()}
                    {/* La marca, a todos de una vez. Es un interruptor y se ve
                        si está puesto o no: sin eso no había forma de saber si
                        el ZIP iba a salir con marca hasta que salía. */}
                    <button
                      onClick={() => cambiarMarcaActiva(!marcaActiva)}
                      disabled={!!wmAll || !!zipProgress || uniendo || clips.every(c => c.status !== 'success')}
                      role="switch"
                      aria-checked={marcaActiva}
                      title={t.watermarkAllTitle || 'Watermark on every clip'}
                      className={`h-12 px-3 sm:px-4 shrink-0 rounded-xl flex items-center gap-2.5 text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 border ${
                        marcaActiva
                          ? 'bg-twitch text-[var(--color-accent-ink)] border-twitch shadow-lg shadow-twitch/25'
                          : 'bg-dark-950 text-gray-400 border-white/10 hover:text-white hover:border-white/25'
                      }`}
                    >
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span className="hidden xl:inline">{t.watermarkAll || 'Watermark all'}</span>
                        {/* El interruptor de verdad, dibujado: el color solo no
                            distingue "puesto" de "pásame el ratón por encima". */}
                        <span className={`w-8 h-[18px] rounded-full p-[2px] flex shrink-0 transition-colors ${marcaActiva ? 'bg-white/35 justify-end' : 'bg-white/10 justify-start'}`}>
                          <span className={`w-[14px] h-[14px] rounded-full transition-colors ${marcaActiva ? 'bg-white' : 'bg-gray-500'}`} />
                        </span>
                    </button>
                    <button onClick={handleReset} aria-label={t.cancel || 'Close'} className="w-12 h-12 shrink-0 bg-dark-950 border border-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-all cursor-pointer hover:bg-red-500/10 hover:border-red-500/20 active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>
             </div>
             
             {/* Qué descargar y en qué forma, en una tarjeta como la barra de
                 arriba: en pantalla ancha todo en una fila, cada grupo con su
                 título; en móvil, uno debajo de otro. Con un clip solo no hay
                 vídeo que unir, así que solo sale el formato de los clips. */}
             {clipsListos.length > 0 && (() => {
               const ocupado = !!zipProgress || !!wmAll || uniendo;
               const usaVideo = modo !== 'clips';
               const usaClips = modo !== 'video';
               const hayVertical = (usaVideo && formatoVideo === '9:16') || (usaClips && formatoClips === '9:16');

               /** El dibujo de la forma: un rectángulo tumbado o de pie. */
               const forma = (f: Formato) => f === 'original'
                 ? <Film className="w-3.5 h-3.5 shrink-0" />
                 : <span aria-hidden="true" className={`shrink-0 rounded-[3px] border-[1.5px] border-current ${f === '16:9' ? 'w-[17px] h-[10px]' : 'w-[10px] h-[17px]'}`} />;
               const tituloFormato: Record<Formato, string> = {
                 original: t.fmtOriginal || 'Original',
                 '16:9': t.fmt169 || '16:9',
                 '9:16': t.fmt916 || '9:16 vertical',
               };

               type Opcion = { id: string; icon: React.ReactNode; label: string; hint?: string };
               type Grupo = { id: string; titulo: string; icono: React.ReactNode; opciones: Opcion[]; valor: string; elegir: (id: string) => void; ancho: string };
               const grupos: Grupo[] = [];
               if (clipsListos.length > 1) grupos.push({
                 id: 'modo', titulo: t.modeLabel || 'Download as', icono: <Download className="w-3.5 h-3.5" />, ancho: 'xl:flex-[1.5]',
                 valor: modo, elegir: id => cambiarModo(id as ModoDescarga),
                 opciones: [
                   { id: 'clips', icon: <FolderDown className="w-4 h-4 shrink-0" />, label: t.modeClips || 'Separate clips', hint: t.modeClipsHint || 'Each clip on its own, in a ZIP' },
                   { id: 'video', icon: <Clapperboard className="w-4 h-4 shrink-0" />, label: t.modeVideo || 'One video', hint: t.modeVideoHint || 'All the clips back to back, in the order of the list' },
                   { id: 'ambos', icon: <Layers className="w-4 h-4 shrink-0" />, label: t.modeBoth || 'Both', hint: t.modeBothHint || 'The long video and each clip on its own, in one ZIP' },
                 ],
               });
               const opcionesFormato: Opcion[] = FORMATOS.map(f => ({ id: f, icon: forma(f), label: f === 'original' ? tituloFormato.original : f, hint: tituloFormato[f] }));
               if (usaVideo) grupos.push({
                 id: 'video', titulo: t.fmtSectionVideo || 'Video format', icono: <Clapperboard className="w-3.5 h-3.5" />, ancho: 'xl:flex-1',
                 valor: formatoVideo, elegir: id => guardarFormato({ video: id as Formato }), opciones: opcionesFormato,
               });
               if (usaClips) grupos.push({
                 id: 'clips', titulo: t.fmtSectionClips || 'Clips format', icono: <FolderDown className="w-3.5 h-3.5" />, ancho: 'xl:flex-1',
                 valor: formatoClips, elegir: id => guardarFormato({ clips: id as Formato }), opciones: opcionesFormato,
               });
               const encajeGrupo: Grupo | null = !hayVertical ? null : {
                 id: 'encaje', titulo: t.fitLabel || 'Vertical', icono: forma('9:16'), ancho: 'xl:flex-[1.2]',
                 valor: encaje, elegir: id => guardarFormato({ encaje: id as Encaje }),
                 opciones: [
                   { id: 'recortar', icon: <Crop className="w-4 h-4 shrink-0" />, label: t.fitCrop || 'Crop the centre', hint: t.fitCropHint || 'The centre fills the screen; what is at the sides is cut off' },
                   { id: 'difuminar', icon: <Blend className="w-4 h-4 shrink-0" />, label: t.fitBlur || 'Blurred background', hint: t.fitBlurHint || 'The whole clip in the middle, with a blurred copy behind it' },
                 ],
               };

               // Debajo, en una línea, qué va a salir: lo que antes solo estaba
               // en el title de cada botón y no se veía sin pasar el ratón.
               const resumen = [
                 grupos.find(g => g.id === 'modo')?.opciones.find(o => o.id === modo)?.hint,
                 encajeGrupo?.opciones.find(o => o.id === encaje)?.hint,
               ].filter(Boolean).join(' · ');

               const selector = (g: Grupo, extra = '') => (
                 <div role="radiogroup" aria-label={g.titulo} className={`flex gap-1 p-1 rounded-2xl bg-dark-950 border border-white/10 ${extra}`}>
                   {g.opciones.map(o => {
                     const activa = g.valor === o.id;
                     return (
                       <button
                         key={o.id}
                         type="button"
                         role="radio"
                         aria-checked={activa}
                         title={o.hint}
                         onClick={() => g.elegir(o.id)}
                         disabled={ocupado}
                         className={`flex-1 min-w-0 min-h-[40px] px-2.5 py-2 rounded-xl flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-center leading-tight sm:whitespace-nowrap transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                           activa
                             ? 'bg-twitch text-[var(--color-accent-ink)] shadow-lg shadow-twitch/20'
                             : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                         }`}
                       >
                         {o.icon}<span className="min-w-0">{o.label}</span>
                       </button>
                     );
                   })}
                 </div>
               );

               return (
                 <div className="!mt-3 w-full bg-[#111114] border border-white/5 rounded-[2rem] p-3 sm:p-4 shadow-2xl relative z-30">
                   <div className="flex flex-col xl:flex-row gap-3 xl:gap-0">
                     {grupos.map((g, i) => (
                       <div
                         key={g.id}
                         className={`min-w-0 flex flex-col sm:flex-row xl:flex-col gap-2 sm:items-center xl:items-stretch ${g.ancho} ${i > 0 ? 'xl:pl-4 xl:ml-4 xl:border-l xl:border-white/5' : ''}`}
                       >
                         <span className="sm:w-44 xl:w-auto shrink-0 flex items-center gap-1.5 px-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                           <span className="text-twitch flex">{g.icono}</span>{g.titulo}
                         </span>
                         {selector(g, 'flex-1')}
                       </div>
                     ))}
                   </div>
                   {/* Abajo, cómo llenar el vertical (solo si algo sale en vertical) y
                       en una línea qué va a salir. */}
                   {(resumen || encajeGrupo) && (
                     <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                       {encajeGrupo && (
                         <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                           <span className="flex items-center gap-1.5 px-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
                             <span className="text-twitch flex">{encajeGrupo.icono}</span>{encajeGrupo.titulo}
                           </span>
                           {selector(encajeGrupo)}
                         </div>
                       )}
                       {resumen && <p className="px-1 text-[11px] font-medium text-gray-500 leading-relaxed">{resumen}</p>}
                     </div>
                   )}
                 </div>
               );
             })()}

             {/* Panel de "marca en todos": lo que se va a hacer, en cuantos, y
                 con que marca — antes de empezar, no despues. */}
             {(marcaActiva || wmAll) && (
               <div className="w-full bg-[#111114] border border-twitch/30 rounded-[2rem] p-4 sm:p-6 md:p-7 shadow-2xl relative z-30 space-y-5">
                 <div className="flex items-start gap-4">
                   <div className="p-3 bg-twitch/15 border border-twitch/30 rounded-2xl shrink-0">
                     <Sparkles className="w-5 h-5 text-twitch" />
                   </div>
                   <div className="min-w-0 flex-1">
                     <h3 className="text-sm font-black uppercase tracking-widest text-white">
                       {t.watermarkAll || 'Watermark all'}
                       <span className="ml-2 text-twitch">{t.watermarkAllOn || 'On'}</span>
                     </h3>
                     <p className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">
                       {t.watermarkAllHint || 'Every clip in the ZIP comes out with it burned in. Customise it once and they all match.'}
                     </p>
                   </div>
                 </div>

                 {wmAll ? (
                   <div className="space-y-3">
                     <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
                       <span className="text-white tabular-nums">
                         {wmAll.hechos} / {wmAll.total}
                         <span className="text-gray-500 font-medium ml-2">{t.watermarkAllDone || 'ready'}</span>
                       </span>
                       <span className="text-twitch uppercase tracking-widest">
                         {wmAll.fase === 'zip'
                           ? (t.preparingZip || 'PREPARING ZIP...')
                           : [
                               wmAll.bajando > 0 ? `${t.watermarkAllDownloading || 'Downloading'} ${wmAll.bajando}` : '',
                               wmAll.marcando > 0 ? `${t.watermarkAllRendering || 'Burning in'} ${wmAll.marcando}` : '',
                               `${wmAll.pct}%`,
                             ].filter(Boolean).join(' · ')}
                       </span>
                     </div>
                     <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                       <div className="h-full bg-twitch transition-[width] duration-200" style={{ width: `${wmAll.pct}%` }} />
                     </div>
                     <button
                       onClick={() => wmAllAbort.current?.abort()}
                       className="px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/25 transition-all cursor-pointer"
                     >
                       {t.cancel || 'Cancel'}
                     </button>
                   </div>
                 ) : (
                   <div className="flex flex-wrap items-center gap-3">
                     {/* Personalizar: el editor de siempre, pero sobre el primer
                         clip de la lista y guardando en la marca compartida, que
                         es la que se le pone a todos. */}
                     <button
                       onClick={() => {
                         if (!wmEditorAbierto) {
                           setWmAllConfig(loadStoredWatermarkConfig(brand));
                           setWmAllPresets(loadStoredPresets(brand));
                         }
                         setWmEditorAbierto(v => !v);
                       }}
                       aria-expanded={wmEditorAbierto}
                       className={`px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 flex items-center gap-2 border ${
                         wmEditorAbierto
                           ? 'bg-twitch text-[var(--color-accent-ink)] border-twitch'
                           : 'bg-twitch/10 text-twitch border-twitch/40 hover:bg-twitch hover:text-[var(--color-accent-ink)]'
                       }`}
                     >
                       <Sparkles className="w-4 h-4" />
                       {t.watermarkAllCustomize || 'Customise the watermark'}
                     </button>
                     <span className="text-[11px] font-bold text-gray-500">
                       {(t.watermarkAllGo || 'Applies to {n} clips').replace('{n}', String(clips.filter(c => c.status === 'success').length))}
                       <span className="text-gray-600 mx-1.5">·</span>
                       {activeOption.label}
                     </span>
                   </div>
                 )}

                 {wmEditorAbierto && !wmAll && wmAllConfig && primerClipListo && (
                   <div className="-mx-2 sm:mx-0">
                   <WatermarkPreview
                     clip={primerClipListo}
                     config={wmAllConfig}
                     onChangeConfig={cambiarConfigMarca}
                     presets={wmAllPresets}
                     onSavePreset={guardarPresetMarca}
                     onDeletePreset={borrarPresetMarca}
                     lang={lang}
                     dictionary={dictionary}
                     onClose={() => setWmEditorAbierto(false)}
                     multiClip
                   />
                   </div>
                 )}
               </div>
             )}

             {wmAllFallos > 0 && !wmAll && (
               <div className="w-full rounded-[2rem] border border-amber-500/25 bg-amber-500/5 px-6 py-4 text-xs font-bold text-amber-300">
                 {(t.watermarkAllFailed || '{n} clips could not be processed.').replace('{n}', String(wmAllFallos))}
               </div>
             )}


             {clipsListos.length > 0 && (
               <button
                 type="button"
                 onClick={() => setEditor({ enfoque: null })}
                 disabled={!!zipProgress || !!wmAll || uniendo}
                 className="w-full rounded-[2rem] border border-twitch/40 bg-[linear-gradient(120deg,rgba(var(--color-accent-rgb),0.16),rgba(var(--color-accent-rgb),0.04))] hover:bg-twitch/[0.14] p-5 flex items-center gap-4 text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
               >
                 <span className="p-3 rounded-2xl bg-twitch text-[var(--color-accent-ink)] shrink-0 group-hover:scale-105 transition-transform shadow-lg shadow-twitch/25">
                   <Scissors className="w-5 h-5" />
                 </span>
                 <span className="min-w-0 flex-1">
                   <span className="block text-sm font-black uppercase tracking-widest text-white">{t.ed_title || 'Clip editor'}</span>
                   <span className="block text-xs text-gray-400 mt-0.5">{t.ed_card || 'Trim, split, reorder, change speed or volume and export, without leaving this page.'}</span>
                 </span>
                 <ArrowRight className="w-5 h-5 text-twitch shrink-0 group-hover:translate-x-1 transition-transform" />
               </button>
             )}

             {clipsListos.length > 0 && (
               <div className="!mt-3 flex justify-end">
               <button
                 type="button"
                 onClick={enviarAlEditor}
                 disabled={enviando !== null || !!zipProgress || !!wmAll || uniendo}
                 className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-gray-400 hover:text-white hover:border-twitch/40 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                 title={t.ed_send_hint || 'The standalone editor, with these clips already on the timeline'}
               >
                 {enviando !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin text-twitch" /> : <ExternalLink className="w-3.5 h-3.5 text-twitch" />}
                 {enviando !== null
                   ? (t.ed_send_busy || 'Preparing the clips… {p}%').replace('{p}', String(enviando))
                   : (t.ed_send_title || 'Open in Clip Editor')}
               </button>
               </div>
             )}

             {/* Con un solo clip también: se le puede añadir una intro o un cierre propio. */}
             {clips.some(c => c.status === 'success') && (
               <MergePanel
                 ref={mergeRef}
                 formatoVideo={formatoVideo}
                 formatoClips={formatoClips}
                 encaje={encaje}
                 conClips={modo === 'ambos'}
                 onConClips={v => cambiarModo(v ? 'ambos' : 'video')}
                 clips={clips.filter(c => c.status === 'success' && c.data).map(c => c.data!)}
                 quality={selectedQuality}
                 watermarkOn={marcaActiva}
                 watermarkConfig={wmAllConfig}
                 t={t}
                 busy={!!zipProgress || !!wmAll || uniendo || clips.some(c => c.status === 'loading')}
                 onBusyChange={setUniendo}
               />
             )}

             {clips.length > 1 && <ClipSortBar clips={clips} onReorder={reordenar} t={t} />}

             {/* El panel de orden va solo junto a las tarjetas: la barra de
                 arriba necesita todo el ancho y ahí no hace falta. */}
             <div className={clips.length > 1 ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8 lg:items-start' : ''}>
             <SortableClipList
               ref={listaRef}
               items={clips}
               onReorder={setClips}
               t={t}
               renderItem={(c, i) => {
                  if (c.status === 'loading') {
                    return <ClipSkeleton />;
                  }
                  if (c.status === 'error') {
                    return (
                      <div className="bg-[#111114]/50 backdrop-blur-3xl border border-red-500/20 rounded-[3rem] p-6 md:p-10 flex items-center justify-between">
                        <div className="text-red-400 font-medium">{t.failedToLoad} <span className="text-gray-500 text-sm ml-2">{c.url}</span></div>
                        <button onClick={() => setClips(prev => prev.filter(x => x.id !== c.id))} className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 rounded-full flex items-center justify-center text-red-400 transition-colors cursor-pointer">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    );
                  }
                  if (c.data) {
                    return <ClipResult data={c.data} index={i+1} onReset={() => setClips(prev => prev.filter(x => x.id !== c.id))} lang={lang} dictionary={dictionary} onEdit={() => setEditor({ enfoque: c.data!.id })} />;
                  }
                  return null;
               }}
             />

             {clips.length > 1 && (
               <ClipOrderPanel
                 clips={clips}
                 onReorder={reordenar}
                 onGo={id => listaRef.current?.irA(id)}
                 t={t}
               />
             )}
             </div>
          </div>
        )}

      </main>

      <Footer lang={lang} dictionary={dictionary} onOpenLegal={setActiveLegal} />

      <LegalModal type={activeLegal} lang={lang} dictionary={dictionary} onClose={() => setActiveLegal(null)} />

      <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className={`fixed bottom-8 right-8 p-4 bg-twitch text-white rounded-full shadow-2xl transition-all ${showScrollTop ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} hover:scale-110 hover:-translate-y-2 active:scale-95 z-50 cursor-pointer group`}><ArrowUp className="w-6 h-6 group-hover:scale-110 transition-transform" /></button>
      {editor && (
        <ClipEditor
          clips={clipsListos}
          piezas={piezasEditor}
          setPiezas={setPiezasEditor}
          enfoque={editor.enfoque}
          quality={selectedQuality}
          watermarkOn={marcaActiva}
          watermarkConfig={wmAllConfig}
          t={t}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
    </BrandContext.Provider>
  );
};

export default ClipToolApp;
