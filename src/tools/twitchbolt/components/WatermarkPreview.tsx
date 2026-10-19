// ============================================================================
// Estudio de marca de agua de TwitchBolt
// ----------------------------------------------------------------------------
// Se abre en la propia página, en una caja de altura fija: el vídeo a la
// izquierda tan grande como quepa y los mandos en un panel con pestañas que
// hace scroll por dentro (antes era un vídeo diminuto y un menú larguísimo
// hacia abajo). Un botón lo pasa a pantalla completa y otro lo devuelve.
//
// El exportado graba con MediaRecorder sobre un canvas y va A VELOCIDAD REAL:
// un clip de 60 s tarda 60 s. Se avisa antes de empezar y se enseña lo que
// queda. Ir más rápido exigiría pasar el codificador a WebCodecs.
// ============================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ClipData, WatermarkConfig, PositionPreset } from '../types';
import {
  drawWatermarkOnCanvas,
  loadWatermarkFonts,
  DEFAULT_WATERMARK_CONFIG,
} from '../services/watermarkService';
import {
  MessageSquareText, Type, Palette, Move, Wand2, Play, Pause, X, Download, RotateCcw, LogIn, LogOut, Check, Sparkles, Maximize2, Minimize2,
} from 'lucide-react';
import WatermarkTextEditor from './WatermarkTextEditor';
import FontPanel from './watermark/FontPanel';
import StylePanel from './watermark/StylePanel';
import PositionPanel from './watermark/PositionPanel';
import EffectPanel from './watermark/EffectPanel';

interface WatermarkPreviewProps {
  clip: ClipData;
  config: WatermarkConfig;
  onChangeConfig: (newConfig: WatermarkConfig) => void;
  presets: PositionPreset[];
  onSavePreset: (newPreset: PositionPreset) => void;
  onDeletePreset: (presetId: string) => void;
  lang?: string;
  dictionary?: any;
  /** Se muestra el botón de descargar sólo si el padre sabe conseguir el vídeo. */
  onExport?: (calidad: string, config: WatermarkConfig, signal: AbortSignal, onProgress: (fase: 'descarga' | 'render', pct: number, restante: number) => void) => Promise<void>;
  onClose?: () => void;
  /** La marca va a varios clips: el nombre del streamer cambia en cada uno. */
  multiClip?: boolean;
}

type Pestana = 'text' | 'font' | 'style' | 'position' | 'fx';

const mmss = (seg: number) => {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const WatermarkPreview: React.FC<WatermarkPreviewProps> = ({
  clip,
  config,
  onChangeConfig,
  presets,
  onSavePreset,
  onDeletePreset,
  dictionary,
  onExport,
  onClose,
  multiClip = false,
}) => {
  // Los textos viven en el diccionario de la herramienta; el segundo argumento
  // es el respaldo en inglés para un despliegue con el diccionario a medias.
  const tr = useCallback((clave: string, respaldo: string): string => {
    const v = dictionary?.[clave];
    return typeof v === 'string' && v ? v : respaldo;
  }, [dictionary]);

  const [pestana, setPestana] = useState<Pestana>('text');
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip.duration || 10);
  const [isDragging, setIsDragging] = useState(false);
  const [fuentesListas, setFuentesListas] = useState(0);

  // ---- Exportado --------------------------------------------------------
  const [calidad, setCalidad] = useState(clip.resolutions[0]?.quality || '');
  const [fase, setFase] = useState<'quieto' | 'descarga' | 'render'>('quieto');
  const [pct, setPct] = useState(0);
  const [restante, setRestante] = useState(0);
  const [errorExport, setErrorExport] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const trabajando = fase !== 'quieto';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const channelName = clip.broadcaster || 'Streamer';
  const videoUrl = clip.resolutions[0]?.url;

  // Las tipografías se piden al abrir el estudio; cuando llegan hay que volver
  // a pintar, porque con el vídeo en pausa nadie más lo haría.
  useEffect(() => {
    let vivo = true;
    loadWatermarkFonts().then(() => document.fonts?.ready).then(() => { if (vivo) setFuentesListas(n => n + 1); });
    const alCargar = () => setFuentesListas(n => n + 1);
    document.fonts?.addEventListener?.('loadingdone', alCargar);
    return () => { vivo = false; document.fonts?.removeEventListener?.('loadingdone', alCargar); };
  }, []);

  // En pantalla completa: sin scroll detrás y Esc para volver a la página.
  useEffect(() => {
    if (!pantallaCompleta) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement)) setPantallaCompleta(false);
    };
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', alTeclear);
    };
  }, [pantallaCompleta]);

  // Si se cierra a mitad de un render, el trabajo se aborta.
  useEffect(() => () => abortRef.current?.abort(), []);

  const renderPreview = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const time = video ? video.currentTime : currentTime;
    const dur = video && video.duration ? video.duration : duration;
    drawWatermarkOnCanvas(ctx, config, channelName, canvas.width, canvas.height, time, dur);
    if (isPlaying && video && !video.paused) {
      animFrameRef.current = requestAnimationFrame(renderPreview);
    }
  }, [config, channelName, currentTime, duration, isPlaying, fuentesListas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    renderPreview();
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [renderPreview]);

  const alAvanzar = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.duration) setDuration(v.duration);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setIsPlaying(true); } else { v.pause(); setIsPlaying(false); }
  };

  const saltar = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, t);
    v.play().catch(() => {});
    setIsPlaying(true);
  };
  const probarEntrada = () => saltar(Math.max(0, (config.entryDelay || 0) - 0.1));
  const probarSalida = () => saltar((videoRef.current?.duration || duration) - (config.exitDuration || 0.8) - 0.6);

  // ---- arrastrar el cartel sobre el vídeo --------------------------------
  const moverA = (e: React.PointerEvent) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.max(3, Math.min(97, Math.round(((e.clientX - r.left) / r.width) * 100)));
    const y = Math.max(3, Math.min(97, Math.round(((e.clientY - r.top) / r.height) * 100)));
    onChangeConfig({ ...config, positionId: 'custom', customX: x, customY: y });
  };
  const alPulsar = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    moverA(e);
  };
  const alMover = (e: React.PointerEvent) => { if (isDragging) moverA(e); };
  const alSoltar = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* */ }
  };

  const lanzarExport = async () => {
    if (!onExport || trabajando) return;
    setErrorExport(null);
    setPct(0);
    setRestante(0);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setFase('descarga');
    try {
      await onExport(calidad, config, ctrl.signal, (f, porcentaje, quedan) => {
        setFase(f);
        setPct(porcentaje);
        setRestante(quedan);
      });
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setErrorExport(
          e?.message === 'BACKGROUND_PAUSE'
            ? tr('wm_export_paused', 'The browser paused the clip to save power, so the render stopped. Keep this tab visible and try again.')
            : (e?.message || tr('wm_export_error', 'The render failed'))
        );
      }
    } finally {
      abortRef.current = null;
      setFase('quieto');
      setPct(0);
      setRestante(0);
    }
  };

  const pestanas: { id: Pestana; icon: React.ReactNode; label: string }[] = [
    { id: 'text', icon: <MessageSquareText className="w-4 h-4" />, label: tr('wm_tab_text', 'Text') },
    { id: 'font', icon: <Type className="w-4 h-4" />, label: tr('wm_tab_font', 'Font') },
    { id: 'style', icon: <Palette className="w-4 h-4" />, label: tr('wm_tab_style', 'Style') },
    { id: 'position', icon: <Move className="w-4 h-4" />, label: tr('wm_tab_position', 'Position') },
    { id: 'fx', icon: <Wand2 className="w-4 h-4" />, label: tr('wm_tab_fx', 'Animation') },
  ];

  const contenido = (
    <>
      {/* ---- Cabecera ---- */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-3 px-3 md:px-5 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="p-2 rounded-xl bg-twitch/20 border border-twitch/30 shrink-0">
            <Sparkles className="w-4 h-4 text-twitch" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-tight truncate">{tr('wm_title_full', 'Watermark editor')}</h3>
            <p className="text-[11px] text-gray-500 truncate">
              {multiClip ? tr('wm_applies_all', 'Applies to every clip in the list') : `${clip.broadcaster} · ${clip.title}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeConfig({ ...DEFAULT_WATERMARK_CONFIG })}
            title={tr('wm_reset', 'Reset')}
            aria-label={tr('wm_reset', 'Reset')}
            className="h-9 px-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tr('wm_reset', 'Reset')}</span>
          </button>
          <button
            type="button"
            onClick={() => setPantallaCompleta(v => !v)}
            title={pantallaCompleta ? tr('wm_exit_fullscreen', 'Exit fullscreen') : tr('wm_fullscreen', 'Fullscreen')}
            aria-label={pantallaCompleta ? tr('wm_exit_fullscreen', 'Exit fullscreen') : tr('wm_fullscreen', 'Fullscreen')}
            className="h-9 px-3 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-twitch/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {pantallaCompleta ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{pantallaCompleta ? tr('wm_exit_fullscreen', 'Exit fullscreen') : tr('wm_fullscreen', 'Fullscreen')}</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title={tr('wm_close', 'Close')}
              aria-label={tr('wm_close', 'Close')}
              className="w-9 h-9 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-red-500/15 hover:border-red-500/30 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* ---- El vídeo, lo más grande posible ---- */}
        <div className="shrink-0 lg:shrink lg:flex-1 min-w-0 flex flex-col gap-3 p-3 md:p-5">
          <div className="relative w-full aspect-video max-h-[42vh] lg:max-h-none lg:aspect-auto lg:flex-1 lg:min-h-0 [container-type:size] flex items-center justify-center">
            <div
              ref={stageRef}
              onPointerDown={alPulsar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
              className={`relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl select-none touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
              style={{ width: 'min(100cqw, calc(100cqh * 16 / 9))' }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                onTimeUpdate={alAvanzar}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={() => {
                  if (canvasRef.current && videoRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth || 1280;
                    canvasRef.current.height = videoRef.current.videoHeight || 720;
                    renderPreview();
                  }
                }}
                className="w-full h-full object-contain pointer-events-none"
              />
              <canvas ref={canvasRef} width={1280} height={720} className="absolute inset-0 w-full h-full pointer-events-none" />
              {isDragging && (
                <span className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-[11px] font-mono font-bold pointer-events-none">
                  {config.customX}% · {config.customY}%
                </span>
              )}
            </div>
          </div>

          {/* Reproducción y pruebas, pegadas al vídeo */}
          <div className="flex items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-twitch flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <span className="text-[11px] font-mono text-gray-400 tabular-nums shrink-0">{mmss(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.05}
              value={Math.min(currentTime, duration || 1)}
              onChange={e => {
                const v = videoRef.current;
                if (v) v.currentTime = parseFloat(e.target.value);
                setCurrentTime(parseFloat(e.target.value));
              }}
              aria-label={tr('wm_timeline', 'Timeline')}
              className="flex-1 min-w-0 accent-twitch h-1.5 cursor-pointer"
            />
            <span className="text-[11px] font-mono text-gray-500 tabular-nums shrink-0">{mmss(duration)}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button type="button" onClick={probarEntrada} title={tr('wm_test_in', 'Play the entrance')} className="h-9 px-2.5 rounded-xl border border-white/10 hover:border-twitch/50 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer">
                <LogIn className="w-3.5 h-3.5 text-twitch" /><span className="hidden sm:inline">{tr('wm_test_in_short', 'In')}</span>
              </button>
              <button type="button" onClick={probarSalida} title={tr('wm_test_out', 'Play the exit')} className="h-9 px-2.5 rounded-xl border border-white/10 hover:border-twitch/50 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer">
                <LogOut className="w-3.5 h-3.5 text-twitch" /><span className="hidden sm:inline">{tr('wm_test_out_short', 'Out')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ---- Panel de mandos ---- */}
        <aside className={`${pantallaCompleta ? 'flex-1' : 'h-[68vh]'} lg:h-auto lg:flex-none ${pantallaCompleta ? 'lg:w-[400px] xl:w-[440px]' : 'lg:w-[340px] xl:w-[360px]'} min-h-0 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0e0d12]`}>
          <nav className="shrink-0 grid grid-cols-5 gap-1 p-2 border-b border-white/10" role="tablist">
            {pestanas.map(p => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={pestana === p.id}
                onClick={() => setPestana(p.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-colors cursor-pointer min-w-0 ${
                  pestana === p.id ? 'bg-twitch text-white shadow-lg shadow-twitch/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {p.icon}
                <span className="truncate max-w-full px-0.5">{p.label}</span>
              </button>
            ))}
          </nav>

          <div className="@container flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4">
            {pestana === 'text' && (
              <WatermarkTextEditor config={config} onChangeConfig={onChangeConfig} channelName={channelName} multiClip={multiClip} tr={tr} />
            )}
            {pestana === 'font' && <FontPanel config={config} onChange={onChangeConfig} channelName={channelName} tr={tr} />}
            {pestana === 'style' && <StylePanel config={config} onChange={onChangeConfig} channelName={channelName} tr={tr} />}
            {pestana === 'position' && (
              <PositionPanel config={config} onChange={onChangeConfig} presets={presets} onSavePreset={onSavePreset} onDeletePreset={onDeletePreset} tr={tr} />
            )}
            {pestana === 'fx' && (
              <EffectPanel config={config} onChange={onChangeConfig} channelName={channelName} tr={tr} onTestEntry={probarEntrada} onTestExit={probarSalida} />
            )}
          </div>

          {/* ---- Lo que se hace al terminar ---- */}
          <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
            {onExport ? (
              trabajando ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-twitch uppercase tracking-widest">
                      {fase === 'descarga' ? tr('wm_export_downloading', 'Downloading the clip') : tr('wm_export_rendering', 'Burning in the watermark')}
                    </span>
                    <span className="text-gray-400 tabular-nums">{pct}%{fase === 'render' && restante > 0 ? ' · ' + mmss(restante) : ''}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-twitch transition-all duration-300" style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                  <button type="button" onClick={() => abortRef.current?.abort()} className="w-full py-2 rounded-xl border border-white/10 text-[11px] font-bold text-gray-400 hover:text-white cursor-pointer">
                    {tr('wm_cancel', 'Cancel')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {clip.resolutions.length > 1 && (
                      <select
                        value={calidad}
                        onChange={e => setCalidad(e.target.value)}
                        aria-label={tr('wm_export_quality', 'Quality')}
                        className="h-11 bg-dark-950 border border-white/10 rounded-xl px-2 text-xs font-bold text-gray-200 cursor-pointer outline-none focus:border-twitch"
                      >
                        {clip.resolutions.map(r => <option key={r.quality} value={r.quality}>{r.quality}</option>)}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={lanzarExport}
                      className="flex-1 h-11 rounded-xl bg-twitch hover:bg-twitch-dark text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-twitch/25 active:scale-[0.98] transition-all"
                    >
                      <Download className="w-4 h-4" />
                      {tr('wm_export_go', 'Render and download')}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-snug">
                    {tr('wm_export_hint', 'Rendering runs in real time, so it takes about as long as the clip lasts')}
                    {clip.duration > 0 ? ` — ~${mmss(clip.duration)}` : ''}
                  </p>
                </>
              )
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-twitch hover:bg-twitch-dark text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-twitch/25"
              >
                <Check className="w-4 h-4" />
                {tr('wm_done', 'Done')}
              </button>
            )}
            {errorExport && (
              <p className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">{errorExport}</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );

  if (pantallaCompleta && typeof document !== 'undefined') {
    return createPortal(
      // Por encima del reproductor flotante (z-9999), que también va al body.
      <div
        className="fixed inset-0 z-[100000] bg-[#07060a] text-white flex flex-col animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-label={tr('wm_title_full', 'Watermark editor')}
        data-no-drag
      >
        {contenido}
      </div>,
      document.body
    );
  }

  // En la página: caja de altura fija para que el vídeo y los mandos se vean
  // a la vez sin tener que subir y bajar.
  return (
    <div
      className="w-full bg-[#07060a] text-white flex flex-col rounded-[1.75rem] border border-twitch/30 overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.6)] lg:h-[min(74vh,560px)] animate-fade-in"
      aria-label={tr('wm_title_full', 'Watermark editor')}
      data-no-drag
    >
      {contenido}
    </div>
  );
};

export default WatermarkPreview;
