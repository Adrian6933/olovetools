
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, GripHorizontal, AlertCircle, MonitorPlay, ExternalLink, Plus, Check, Link as LinkIcon, CheckCircle2, Download, RotateCcw, MoreVertical, Menu, EyeOff, Gauge, Loader2, ChevronDown, ListPlus } from 'lucide-react';
import { Clip } from './types';

// Twitch clips no traen pista de audio de alta calidad ni suelen durar mucho,
// así que velocidades altas (x3/x4) siguen siendo perfectamente reproducibles
// en un <video> normal — el límite real es de gusto/comprensión, no técnico.
const PLAYBACK_SPEEDS = [1, 1.5, 2, 3, 4];

interface FloatingPlayerProps {
  clip: Clip;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (clip: Clip) => void;
  onDownloadExternal: (url: string) => void;
  /**
   * Abre el selector de listas para este clip. Sin esto, el unico sitio desde
   * donde archivar en una lista con nombre eran la tarjeta de la rejilla y el
   * panel de guardados — y viendo un clip en el reproductor no hay ninguna de
   * las dos a mano.
   */
  onAddToList?: (clip: Clip) => void;
  onBlockStreamer?: (id: string, name: string, image?: string) => void;
  t: (key: string) => string;
  /** Velocidad de reproducción elegida en el filtro; 1 = normal. */
  /**
   * De donde sale el mp4 reproducible del clip. Se inyecta en vez de importarse
   * porque este componente lo comparten Clipy (Twitch) y Klipy (Kick), y cada
   * una lo resuelve contra su propia API.
   */
  getVideoSource: (clipId: string) => Promise<string | null>;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const STORAGE_KEY = 'clipy_player_dims';
const VOLUME_KEY = 'clipy_player_volume';

/** Volumen y silencio guardados, para que cada clip no arranque al 100%. */
const readStoredVolume = (): { volume: number; muted: boolean } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (!raw) return null;
    const { volume, muted } = JSON.parse(raw);
    // Un valor corrupto (NaN, fuera de rango, string) dejaría el <video> mudo
    // sin que se vea por qué, así que se descarta y se usa el del navegador.
    if (typeof volume !== 'number' || !Number.isFinite(volume) || volume < 0 || volume > 1) return null;
    return { volume, muted: muted === true };
  } catch {
    return null;
  }
};

/** Una fuente HLS es un playlist .m3u8, no un fichero de video suelto. */
const esHls = (url: string | null): boolean => !!url && /\.m3u8(\?|$)/i.test(url);

/**
 * hls.js bajo demanda, desde CDN. Solo se pide cuando la fuente es un .m3u8 y
 * el navegador no sabe reproducirlo por su cuenta, asi que en Safari (que si
 * sabe) y con fuentes mp4 no se descarga nada.
 */
const loadHls = (): Promise<any> =>
  new Promise((resolve, reject) => {
    if ((window as any).Hls) { resolve((window as any).Hls); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
    script.onload = () => (window as any).Hls ? resolve((window as any).Hls) : reject(new Error('Hls no aparecio en window'));
    script.onerror = () => reject(new Error('no se pudo cargar hls.js'));
    document.head.appendChild(script);
  });

const FloatingPlayer: React.FC<FloatingPlayerProps> = ({ clip, onClose, isSaved, onToggleSave, onDownloadExternal, onAddToList, onBlockStreamer, t, playbackSpeed, onPlaybackSpeedChange, getVideoSource }) => {
  // 480px fijos no caben en un móvil: el reproductor arrancaba saliéndose por
  // la derecha (x se topaba en 20 y el ancho seguía siendo 480 en una pantalla
  // de 375). Se ajusta al viewport manteniendo el 16:9.
  const getDefaultSize = () => {
    if (typeof window === 'undefined') return { width: 480, height: 270 };
    const width = Math.max(240, Math.min(480, window.innerWidth - 32));
    return { width, height: Math.round((width * 9) / 16) };
  };
  const defaultSize = getDefaultSize();
  const getDefaultPosition = () => {
    if (typeof window === 'undefined') return { x: 100, y: 100 };
    const { width, height } = getDefaultSize();
    return {
      x: Math.max(16, window.innerWidth - width - 20),
      y: Math.max(80, window.innerHeight - height - 110),
    };
  };

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDirection>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  
  const isCompact = size.width < 500;

  const isMockClip = clip.id.startsWith('mock-');
  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

  const startPos = useRef({ x: 0, y: 0 });
  const startDims = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Arrastrar el control de volumen dispara volumechange decenas de veces, así
  // que se escribe en localStorage una sola vez al soltar.
  const volumeSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const applyStoredVolume = (video: HTMLVideoElement) => {
    const stored = readStoredVolume();
    if (!stored) return;
    video.volume = stored.volume;
    video.muted = stored.muted;
  };

  const rememberVolume = (video: HTMLVideoElement) => {
    const { volume, muted } = video;
    clearTimeout(volumeSaveTimer.current);
    volumeSaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(VOLUME_KEY, JSON.stringify({ volume, muted }));
      } catch {
        // Cuota llena o almacenamiento bloqueado: el volumen de esta sesión
        // sigue funcionando, solo no se recuerda para la próxima.
      }
    }, 250);
  };

  useEffect(() => () => clearTimeout(volumeSaveTimer.current), []);

  // Los clips se reproducen a la velocidad elegida en el filtro. El iframe de
  // embed de Twitch es cross-origin (no hay forma de tocar su <video> interno
  // desde aquí), así que en vez de usarlo resolvemos la URL real del vídeo
  // (mismo truco que usa TwitchBolt para la descarga) y lo reproducimos en un
  // <video> propio donde sí controlamos playbackRate. Si no se puede resolver
  // (clip eliminado, endpoint bloqueado...), cae de vuelta al iframe de Twitch
  // sin forzar velocidad — mejor eso que no reproducir nada.
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoResolveFailed, setVideoResolveFailed] = useState(false);
  /** Rellenando buffer. Sin esto, un clip que tarda parece uno roto. */
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    setVideoSrc(null);
    setVideoResolveFailed(false);
    setBuffering(false);
    if (isMockClip) return;
    // Si el listado ya trajo la fuente, no hace falta preguntar por ella.
    if (clip.playback_url) {
      setVideoSrc(clip.playback_url);
      return;
    }
    let cancelled = false;
    getVideoSource(clip.id).then(url => {
      if (cancelled) return;
      if (url) setVideoSrc(url);
      else setVideoResolveFailed(true);
    });
    return () => { cancelled = true; };
  }, [clip.id, clip.playback_url, isMockClip]);


  // Fuentes HLS (.m3u8): las sirve Kick. Chrome y Firefox no las reproducen de
  // forma nativa, asi que hace falta hls.js. Safari si puede y ahi se usa el
  // camino directo.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || !esHls(videoSrc)) return;

    // Se intenta hls.js PRIMERO y el soporte nativo despues, no al reves.
    // canPlayType('application/vnd.apple.mpegurl') devuelve "maybe" en Chrome
    // aunque no sepa reproducir HLS, y "maybe" es truthy: preguntando primero
    // por lo nativo se tomaba esa rama, se asignaba el src y el elemento moria
    // con error 4 sin que hls.js llegase a cargarse. Comprobado en Chrome.
    let hls: any = null;
    let cancelado = false;
    loadHls()
      .then((Hls) => {
        if (cancelado || !videoRef.current) return;
        if (Hls.isSupported()) {
          // Los clips de Kick vienen en un solo nivel de calidad, en trozos de
          // dos segundos de ~2,2 MB — unos 9 Mbps. Con los valores de fabrica
          // (maxBufferSize 60 MB) el buffer se llenaba a los ~25 segundos y el
          // reproductor iba siempre pegado al borde: de ahi los cortes. Un clip
          // dura 180 s como mucho, asi que cabe entero y se le deja caber.
          hls = new Hls({
            maxBufferLength: 60,
            maxMaxBufferLength: 200,
            maxBufferSize: 300 * 1000 * 1000,
            backBufferLength: 30,
            fragLoadingMaxRetry: 6,
            manifestLoadingMaxRetry: 4,
            levelLoadingMaxRetry: 4,
          });
          // Un fallo de red a mitad dejaba el reproductor congelado sin decir
          // nada. La propia libreria sabe recuperarse de casi todos si se le
          // pide; solo lo que no tiene arreglo termina la reproduccion.
          hls.on(Hls.Events.ERROR, (_evento: unknown, datos: any) => {
            if (!datos?.fatal) return;
            if (datos.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (datos.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            else setVideoResolveFailed(true);
          });
          hls.loadSource(videoSrc);
          hls.attachMedia(videoRef.current);
          return;
        }
        // Safari: reproduce HLS por su cuenta y no necesita la libreria.
        videoRef.current.src = videoSrc;
      })
      .catch(() => {
        // Sin hls.js no hay nada que hacer con un .m3u8: se marca como no
        // resuelto para que la tarjeta lo diga, en vez de dejar un reproductor
        // negro y mudo.
        if (!cancelado) setVideoResolveFailed(true);
      });

    return () => {
      cancelado = true;
      if (hls) hls.destroy();
    };
  }, [videoSrc]);

  // Si se cambia la velocidad en el filtro mientras ya hay un clip
  // reproduciéndose, se aplica al momento en vez de esperar al siguiente clip.
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const { x, y, width, height } = JSON.parse(saved);
          // El tamaño guardado puede venir de una pantalla mucho más ancha
          // (mismo localStorage en móvil y escritorio), así que se recorta al
          // viewport actual antes de colocarlo.
          const validWidth = Math.max(240, Math.min(width || defaultSize.width, window.innerWidth - 24));
          const validHeight = Math.max(160, Math.min(height || defaultSize.height, window.innerHeight - 140));
          const validX = Math.min(Math.max(0, x), Math.max(0, window.innerWidth - validWidth));
          const validY = Math.min(Math.max(0, y), Math.max(0, window.innerHeight - 100));
          setPosition({ x: validX, y: validY });
          setSize({ width: validWidth, height: validHeight });
        } catch (e) {
          setPosition(getDefaultPosition());
        }
      } else {
        setPosition(getDefaultPosition());
      }
    }
  }, []);

  const saveDimensions = (newPos: {x: number, y: number}, newSize: {width: number, height: number}) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      x: newPos.x,
      y: newPos.y,
      width: newSize.width,
      height: newSize.height
    }));
  };

  const resetToDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defPos = getDefaultPosition();
    setPosition(defPos);
    setSize(defaultSize);
    localStorage.removeItem(STORAGE_KEY);
  };

  const { embedUrl, parentDomains, currentHostname } = useMemo(() => {
    if (typeof window === 'undefined') {
        return { embedUrl: '', parentDomains: [], currentHostname: '' };
    }
    const currentHost = window.location.hostname;
    const parents = new Set<string>();
    parents.add('localhost');
    parents.add('127.0.0.1');
    if (currentHost) {
        const parts = currentHost.split('.');
        for (let i = 0; i < parts.length; i++) {
            const domainSlice = parts.slice(i).join('.');
            if (domainSlice.includes('.') || parts.length === 1) {
                parents.add(domainSlice);
            }
        }
    }
    if (document.location.ancestorOrigins) {
        for (let i = 0; i < document.location.ancestorOrigins.length; i++) {
            const origin = document.location.ancestorOrigins[i];
            try {
                const url = new URL(origin);
                if (url.hostname) parents.add(url.hostname);
            } catch (e) {
                if (origin && !origin.includes('://')) parents.add(origin);
            }
        }
    }
    if (document.referrer) {
        try {
            const refUrl = new URL(document.referrer);
            if (refUrl.hostname) parents.add(refUrl.hostname);
        } catch (e) { }
    }
    const finalParents = Array.from(parents);
    let urlString = '';
    if (!isMockClip) {
        const url = new URL(`https://clips.twitch.tv/embed`);
        url.searchParams.set('clip', clip.id);
        url.searchParams.set('autoplay', 'true');
        url.searchParams.set('muted', 'false'); 
        url.searchParams.set('time', '0s');
        finalParents.forEach(p => url.searchParams.append('parent', p));
        urlString = url.toString();
    }
    return { 
        embedUrl: urlString, 
        parentDomains: finalParents,
        currentHostname: currentHost
    };
  }, [clip.id, isMockClip]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch) e.preventDefault();
    
    setIsDragging(true);
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    startPos.current = { x: clientX, y: clientY };
    startDims.current = { x: position.x, y: position.y, w: size.width, h: size.height };
  };

  const handleResizeStart = (direction: ResizeDirection) => (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch) e.preventDefault();
    e.stopPropagation();
    
    setResizeDir(direction);
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    startPos.current = { x: clientX, y: clientY };
    startDims.current = { x: position.x, y: position.y, w: size.width, h: size.height };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const isTouch = 'touches' in e;
      
      if (isTouch && (isDragging || resizeDir)) {
        if (e.cancelable) e.preventDefault();
      }

      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const dx = clientX - startPos.current.x;
        const dy = clientY - startPos.current.y;
        
        let newX = startDims.current.x + dx;
        let newY = startDims.current.y + dy;

        // Enforce boundaries
        newX = Math.max(-size.width + 100, Math.min(newX, window.innerWidth - 100));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 40));

        setPosition({ x: newX, y: newY });
        return;
      }
      if (resizeDir) {
        const dx = clientX - startPos.current.x;
        const dy = clientY - startPos.current.y;
        const MIN_W = 320;
        const MIN_H = 180;
        let newW = startDims.current.w;
        let newH = startDims.current.h;
        let newX = startDims.current.x;
        let newY = startDims.current.y;
        if (resizeDir.includes('e')) {
            newW = Math.max(MIN_W, startDims.current.w + dx);
        } else if (resizeDir.includes('w')) {
            const proposedWidth = startDims.current.w - dx;
            if (proposedWidth > MIN_W) {
                newW = proposedWidth;
                newX = startDims.current.x + dx;
            }
        }
        if (resizeDir.includes('s')) {
            newH = Math.max(MIN_H, startDims.current.h + dy);
        } else if (resizeDir.includes('n')) {
            const proposedHeight = startDims.current.h - dy;
            if (proposedHeight > MIN_H) {
                newH = proposedHeight;
                newY = startDims.current.y + dy;
            }
        }
        setSize({ width: newW, height: newH });
        setPosition({ x: newX, y: newY });
      }
    };
    const handleEnd = () => {
      if (isDragging || resizeDir) {
        saveDimensions(position, size);
      }
      setIsDragging(false);
      setResizeDir(null);
    };

    // Ensure player stays in bounds on resize
    const handleWindowResize = () => {
      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, window.innerWidth - 100)),
        y: Math.max(0, Math.min(prev.y, window.innerHeight - 40))
      }));
      setSize(prev => ({
        width: Math.min(prev.width, window.innerWidth - 20),
        height: Math.min(prev.height, window.innerHeight - 60)
      }));
    };

    if (isDragging || resizeDir) {
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.body.style.cursor = resizeDir ? `${resizeDir}-resize` : 'move';
    } else {
        document.body.style.cursor = '';
    }
    
    window.addEventListener('resize', handleWindowResize);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      window.removeEventListener('resize', handleWindowResize);
      document.body.style.cursor = '';
    };
  }, [isDragging, resizeDir, position, size]);

  const handleCopyLink = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(clip.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false);
      }
    };
    if (showSpeedMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu]);

  // Portal directo a <body>: #root tiene su propio z-index en el CSS de
  // Clipy (crea un contexto de apilamiento), así que un z-index alto aquí
  // dentro solo gana frente a OTRO contenido de #root — no frente a hermanos
  // de #root a nivel de body, como el raíl de anuncios fijo (que sí tiene su
  // propio z-index ahí). Sin el portal, el iframe del anuncio se interponía
  // por delante y se comía los clics en los controles del reproductor
  // (incluida la X de cerrar) cuando el raíl quedaba visible y solapado.
  return createPortal(
    <div
      ref={playerRef}
      style={{
        // top/left explícitos: sin ellos, "fixed" sin offsets cae a su
        // posición "estática" en el flujo del documento — con el portal a
        // <body> eso pasó a ser el final de toda la página (miles de px más
        // abajo) en vez de la esquina del viewport de la que parte el
        // transform.
        top: 0,
        left: 0,
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: size.width,
        height: size.height,
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: 'calc(100vh - 20px)',
        zIndex: 9999,
        position: 'fixed'
      }}
      className="bg-[#0e0e10] border-[#2b2b2b] shadow-2xl overflow-visible flex flex-col border rounded-lg"
    >
      <div onMouseDown={handleResizeStart('n')} onTouchStart={handleResizeStart('n')} className="absolute -top-1.5 left-4 right-4 h-4 cursor-n-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('s')} onTouchStart={handleResizeStart('s')} className="absolute -bottom-1.5 left-4 right-4 h-4 cursor-s-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('w')} onTouchStart={handleResizeStart('w')} className="absolute top-4 bottom-4 -left-1.5 w-4 cursor-w-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('e')} onTouchStart={handleResizeStart('e')} className="absolute top-4 bottom-4 -right-1.5 w-4 cursor-e-resize z-[100] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('nw')} onTouchStart={handleResizeStart('nw')} className="absolute -top-1.5 -left-1.5 w-6 h-6 cursor-nw-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('ne')} onTouchStart={handleResizeStart('ne')} className="absolute -top-1.5 -right-1.5 w-6 h-6 cursor-ne-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('sw')} onTouchStart={handleResizeStart('sw')} className="absolute -bottom-1.5 -left-1.5 w-6 h-6 cursor-sw-resize z-[101] bg-transparent"></div>
      <div onMouseDown={handleResizeStart('se')} onTouchStart={handleResizeStart('se')} className="absolute -bottom-1.5 -right-1.5 w-6 h-6 cursor-se-resize z-[101] bg-transparent"></div>

      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{ touchAction: 'none' }}
        className="h-12 bg-[#18181b] flex-shrink-0 flex items-center justify-between px-3 select-none border-b border-[#2b2b2b] cursor-move"
      >
        <div className="flex items-center gap-2 text-gray-300 flex-1 min-w-0 mr-4">
            <GripHorizontal className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {videoSrc && (
                <div className="relative flex-shrink-0" ref={speedMenuRef}>
                    <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        title={t('playback_speed_desc')}
                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black cursor-pointer transition-colors ${
                            playbackSpeed !== 1
                                ? 'bg-twitch-base/20 text-twitch-base hover:bg-twitch-base/30'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        <Gauge className="w-3 h-3" />{playbackSpeed}x
                        <ChevronDown className={`w-3 h-3 transition-transform ${showSpeedMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showSpeedMenu && (
                        <div
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-full left-0 mt-1 w-28 bg-[#18181b] border border-[#2b2b2b] rounded-lg shadow-2xl py-1 z-[110] animate-in fade-in zoom-in-95 duration-100"
                        >
                            {PLAYBACK_SPEEDS.map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => { onPlaybackSpeedChange(speed); setShowSpeedMenu(false); }}
                                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-twitch-base hover:text-[var(--color-accent-ink)] transition-colors cursor-pointer"
                                >
                                    <span>{speed}x</span>
                                    {playbackSpeed === speed && <Check className="w-3.5 h-3.5" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <span className="text-sm font-bold truncate">
                {isMockClip ? `[DEMO] ${clip.title}` : clip.title}
            </span>
        </div>
        
        <div className="flex items-center gap-1.5 h-full">
            {isCompact ? (
              <div className="relative h-full flex items-center" ref={menuRef}>
                  <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => setShowMenu(!showMenu)}
                  className={`p-2 rounded-lg transition-all cursor-pointer ${showMenu ? 'bg-white/10 text-twitch-base' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Menu className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-10 w-48 bg-[#18181b] border border-[#2b2b2b] rounded-xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={(e) => { e.stopPropagation(); resetToDefault(e); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('restore')}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDownloadExternal(clip.url); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t('download_zip_web')}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(e); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${isCopied ? 'text-green-400 bg-green-500/10' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                      <span>{isCopied ? t('copied') : t('link')}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSave(clip); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer ${isSaved ? 'text-twitch-base bg-twitch-base/10' : 'text-gray-300 hover:bg-white/10'}`}
                    >
                      {isSaved ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{isSaved ? t('saved') : t('save')}</span>
                    </button>
                    {onAddToList && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToList(clip); setShowMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <ListPlus className="w-4 h-4" />
                        <span>{t('add_to_lists')}</span>
                      </button>
                    )}
                    {onBlockStreamer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlockStreamer(clip.broadcaster_id, clip.broadcaster_name, clip.broadcaster_image);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <EyeOff className="w-4 h-4" />
                        <span>{t('block') || 'Ocultar'}</span>
                      </button>
                    )}
                    <div className="h-px bg-white/5 my-1"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(clip.url, '_blank'); setShowMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {/* Rotulo traducido, no "Twitch" a pelo: este menu lo
                          comparte Klipy, donde el enlace lleva a Kick. */}
                      <span>{t('open_twitch')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={resetToDefault}
                    className="group/reset flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] shadow-md cursor-pointer"
                    title={t('restore_desc')}
                >
                    <RotateCcw className="w-3.5 h-3.5 group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
                    <span>{t('restore')}</span>
                </button>

                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onDownloadExternal(clip.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20 cursor-pointer"
                    title={t('download_zip_web')}
                >
                    <Download className="w-3.5 h-3.5" />
                </button>
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleCopyLink}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        isCopied 
                        ? 'bg-green-600 text-white border-green-600' 
                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20'
                    }`}
                    title={t('copy_link')}
                >
                    {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    <span>{isCopied ? t('copied') : t('link')}</span>
                </button>
                <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onToggleSave(clip)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
                        isSaved 
                        ? 'bg-twitch-base text-[var(--color-accent-ink)] border-twitch-base hover:bg-red-600 hover:border-red-600' 
                        : 'bg-white/10 text-white border-white/10 hover:bg-twitch-base hover:border-twitch-base'
                    }`}
                >
                    {isSaved ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isSaved ? t('saved') : t('save')}</span>
                </button>
                {onAddToList && (
                  <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => onAddToList(clip)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border bg-white/10 text-white border-white/10 hover:bg-twitch-base hover:border-twitch-base hover:text-[var(--color-accent-ink)] cursor-pointer"
                      title={t('add_to_lists')}
                  >
                      <ListPlus className="w-3.5 h-3.5" />
                  </button>
                )}
                {onBlockStreamer && (
                  <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => onBlockStreamer(clip.broadcaster_id, clip.broadcaster_name, clip.broadcaster_image)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 cursor-pointer"
                      title={`${t('block') || 'Ocultar'} ${clip.broadcaster_name}`}
                  >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{t('block') || 'Ocultar'}</span>
                  </button>
                )}
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                    onMouseDown={(e) => e.stopPropagation()} 
                    onClick={() => window.open(clip.url, '_blank')}
                    title={t('open_twitch')}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={onClose}
                className="p-2 hover:bg-red-500/20 hover:text-red-500 rounded-full text-gray-400 transition-colors cursor-pointer"
                title={t('close')}
            >
                <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="relative flex-grow bg-black w-full h-full overflow-hidden rounded-b-lg">
        {(isDragging || resizeDir) && (
            <div className="absolute inset-0 z-50 bg-transparent"></div>
        )}
        {isFileProtocol ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-[#1f1f23]">
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <h3 className="text-white font-bold text-lg">{t('protocol_error')}</h3>
                <p className="text-sm text-gray-400 mt-2">{t('protocol_desc')}</p>
                <div className="mt-4 flex flex-col gap-2">
                    <button 
                        onClick={() => window.open(clip.url, '_blank')}
                        className="text-xs bg-twitch-base hover:bg-twitch-dark text-[var(--color-accent-ink)] py-2 px-4 rounded font-bold transition-colors"
                    >
                        {t('open_twitch')}
                    </button>
                </div>
             </div>
        ) : isMockClip ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 bg-[#1f1f23]/50">
                <MonitorPlay className="w-12 h-12 text-twitch-base mb-2 opacity-80" />
                <h3 className="text-white font-bold">{t('demo_mode')}</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-[250px]">{t('demo_desc')}</p>
            </div>
        ) : videoSrc ? (
            // <video> propio (no el iframe de Twitch) es lo único que permite
            // forzar playbackRate — un iframe cross-origin no da acceso a su
            // <video> interno desde aquí.
            <>
            <video
                ref={videoRef}
                key={videoSrc}
                /* Sin `src` cuando la fuente es HLS: en ese caso la adjunta
                   hls.js en el efecto de abajo. Ponerla aqui haria que el
                   navegador intentase decodificar el .m3u8 el solo y fallase
                   con error 4 antes de que hls.js llegue a engancharse. */
                src={esHls(videoSrc) ? undefined : videoSrc}
                autoPlay
                controls
                playsInline
                className="w-full h-full bg-black"
                // El volumen se aplica ya en onLoadedMetadata (antes de que
                // empiece a sonar) y no en onPlay, para que no se cuele el
                // primer instante al 100%.
                onLoadedMetadata={(e) => {
                    applyStoredVolume(e.currentTarget);
                    e.currentTarget.playbackRate = playbackSpeed;
                }}
                onWaiting={() => setBuffering(true)}
                onStalled={() => setBuffering(true)}
                onPlaying={() => setBuffering(false)}
                onCanPlay={() => setBuffering(false)}
                onVolumeChange={(e) => rememberVolume(e.currentTarget)}
                onRateChange={(e) => {
                    if (e.currentTarget.playbackRate !== playbackSpeed) e.currentTarget.playbackRate = playbackSpeed;
                }}
            />
            {buffering && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="w-8 h-8 text-twitch-base animate-spin" />
              </div>
            )}
            </>
        ) : videoResolveFailed ? (
            <iframe
            key={embedUrl}
            src={embedUrl}
            title={clip.title}
            width="100%"
            height="100%"
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="origin-when-cross-origin"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation allow-storage-access-by-user-activation"
            className="w-full h-full border-none bg-black"
            ></iframe>
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 text-twitch-base animate-spin" />
            </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FloatingPlayer;
