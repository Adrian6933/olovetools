// ============================================================================
// Editor de marca de agua de TwitchBolt
// ----------------------------------------------------------------------------
// Se abre desde el botón de cada clip en ClipResult. Deja colocar, dar estilo y
// animar un cartel sobre el vídeo, y descargar el clip con el cartel incrustado.
//
// Lo que hay que saber del exportado: se graba con MediaRecorder sobre un canvas
// y eso va A VELOCIDAD REAL. Un clip de 60 s tarda 60 s, y no es un fallo que
// se pueda optimizar: canvas.captureStream() muestrea a ritmo de reloj de pared,
// así que acelerar el vídeo sólo produce un archivo acelerado. La interfaz lo
// dice antes de empezar y enseña cuánto queda. Ir más rápido exigiría pasar el
// codificador a WebCodecs.
// ============================================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ClipData, WatermarkConfig, PositionPreset, FontFamily, TextTransform, FontWeight, EntryEffect, ExitEffect } from '../types';
import { 
  drawWatermarkOnCanvas, 
  getFontCss 
} from '../services/watermarkService';
import { 
  Palette, Sparkles, Move, Plus, Trash2, RotateCcw, Play, Pause, Check, Wand2, Maximize2, Minimize2, X, ArrowRight, ArrowLeft, Download
} from 'lucide-react';

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
}

const WatermarkPreview: React.FC<WatermarkPreviewProps> = ({
  clip,
  config,
  onChangeConfig,
  presets,
  onSavePreset,
  onDeletePreset,
  // Sin idioma explícito se cae al inglés, no al castellano: el castellano por
  // defecto hacía que un montaje descuidado saliera en español para todos.
  lang = 'en',
  dictionary,
  onExport,
  onClose
}) => {
  // Los textos viven en el diccionario de la herramienta. El segundo argumento
  // es el respaldo en inglés, para que un despliegue con el diccionario a medias
  // enseñe algo legible en vez de la clave.
  const tr = (clave: string, respaldo: string): string => {
    const v = dictionary?.[clave];
    return typeof v === 'string' && v ? v : respaldo;
  };
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(clip.duration || 10);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'position' | 'style' | 'animation'>('position');

  // ---- Exportado --------------------------------------------------------
  const [calidad, setCalidad] = useState(clip.resolutions[0]?.quality || '');
  const [fase, setFase] = useState<'quieto' | 'descarga' | 'render'>('quieto');
  const [pct, setPct] = useState(0);
  const [restante, setRestante] = useState(0);
  const [errorExport, setErrorExport] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trabajando = fase !== 'quieto';

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
      // Cancelar es una decisión del usuario, no un error que enseñarle.
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

  const cancelarExport = () => abortRef.current?.abort();

  // Si el editor se cierra a mitad de un render, el trabajo se aborta: si no,
  // seguiría gastando CPU y acabaría descargando un archivo que ya nadie espera.
  useEffect(() => () => abortRef.current?.abort(), []);

  const duracionClip = clip.duration || 0;
  const mmss = (seg: number) => {
    const s2 = Math.max(0, Math.round(seg));
    return `${Math.floor(s2 / 60)}:${String(s2 % 60).padStart(2, '0')}`;
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const channelName = clip.broadcaster || 'Streamer';
  const videoUrl = clip.resolutions[0]?.url;

  // Render loop for preview canvas overlay
  const renderPreview = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const time = video ? video.currentTime : currentTime;
    const dur = video && video.duration ? video.duration : duration;

    drawWatermarkOnCanvas(ctx, config, channelName, width, height, time, dur);

    if (isPlaying && video && !video.paused) {
      animFrameRef.current = requestAnimationFrame(renderPreview);
    }
  }, [config, channelName, currentTime, duration, isPlaying]);

  useEffect(() => {
    renderPreview();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderPreview]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || duration);
      renderPreview();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTestEntry = () => {
    if (videoRef.current) {
      const delay = config.entryDelay || 0;
      videoRef.current.currentTime = Math.max(0, delay);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTestExit = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || duration;
      const exitDur = config.exitDuration || 0.8;
      videoRef.current.currentTime = Math.max(0, dur - exitDur - 0.2);
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTestFull = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Dragging logic for custom position
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePositionFromPointer(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePositionFromPointer(e);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const updatePositionFromPointer = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;

    let xPct = Math.round((relativeX / rect.width) * 100);
    let yPct = Math.round((relativeY / rect.height) * 100);

    xPct = Math.max(3, Math.min(97, xPct));
    yPct = Math.max(3, Math.min(97, yPct));

    onChangeConfig({
      ...config,
      positionId: 'custom',
      customX: xPct,
      customY: yPct
    });
  };

  // Las posiciones de fábrica se traducen por su id; las que guarda cada
  // persona conservan el nombre que ella escribió, que no hay que tocar.
  const nombrePreset = (preset: PositionPreset): string =>
    preset.isDefault ? tr('wm_pos_' + preset.id, preset.name) : preset.name;

  const handleSelectPreset = (preset: PositionPreset) => {
    onChangeConfig({
      ...config,
      positionId: preset.id,
      customX: preset.x,
      customY: preset.y
    });
  };

  const handleSaveCurrentPreset = () => {
    const name = newPresetName.trim() || `${tr('wm_tab_position', 'Position')} (${config.customX}%, ${config.customY}%)`;
    const newPreset: PositionPreset = {
      id: `custom_${Date.now()}`,
      name,
      x: config.customX,
      y: config.customY,
      isDefault: false
    };
    onSavePreset(newPreset);
    handleSelectPreset(newPreset);
    setNewPresetName('');
    setIsSavingPreset(false);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Quick template options
  const quickTemplates = [
    { label: '@' + channelName, template: '@{channel}' },
    { label: 'LIVE: ' + channelName, template: 'LIVE: {channel}' },
    { label: 'TWITCH.TV/' + channelName, template: 'TWITCH.TV/{channel}' },
    { label: channelName, template: '{channel}' },
    { label: tr('wm_tpl_follow', 'FOLLOW') + ' ' + channelName, template: tr('wm_tpl_follow', 'FOLLOW') + ' {channel}' },
  ];

  // Helper render for controls sidebar panel (shared between normal & fullscreen view)
  const renderSidebarControls = () => (
    <div className="flex flex-col gap-5 h-full">
      {/* Tabs with Micro-Animations & Pointer Cursor */}
      <div className="flex bg-dark-950 p-1.5 rounded-2xl border border-white/5 gap-1 shrink-0">
        <button
          onClick={() => setActiveTab('position')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'position' ? 'bg-twitch text-white shadow-lg shadow-twitch/20 ring-1 ring-twitch/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Move className="w-3.5 h-3.5" /> {tr('wm_tab_position', 'Position')}
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'style' ? 'bg-twitch text-white shadow-lg shadow-twitch/20 ring-1 ring-twitch/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Palette className="w-3.5 h-3.5" /> {tr('wm_tab_text', 'Text')}
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'animation' ? 'bg-twitch text-white shadow-lg shadow-twitch/20 ring-1 ring-twitch/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Wand2 className="w-3.5 h-3.5" /> {tr('wm_tab_fx', 'Effects')}
        </button>
      </div>

      {/* TAB 1: POSITION PRESETS & CUSTOM PRESETS */}
      {activeTab === 'position' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto custom-scrollbar pr-1">
          {saveSuccessMsg && (
            <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
              <Check className="w-4 h-4 text-green-400" /> {tr('wm_saved_ok', 'Custom position saved successfully!')}
            </div>
          )}

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-3">
              {tr('wm_presets_default', 'Preset Positions')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.filter(p => p.isDefault).map(preset => {
                const isSelected = config.positionId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-xs font-bold uppercase transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${isSelected ? 'bg-twitch/20 border-twitch text-twitch shadow-md ring-1 ring-twitch/30' : 'bg-white/5 border-white/5 text-gray-300 hover:border-white/20 hover:text-white hover:bg-white/10'}`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-twitch" />}
                    {nombrePreset(preset)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Presets Section */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                {tr('wm_presets_custom', 'Saved Custom Positions')}
              </label>
              {!isSavingPreset && (
                <button
                  onClick={() => setIsSavingPreset(true)}
                  className="text-[11px] font-black uppercase tracking-wider text-twitch hover:text-white flex items-center gap-1 cursor-pointer bg-twitch/10 hover:bg-twitch px-3 py-1.5 rounded-xl border border-twitch/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> {tr('wm_save_current', 'Save Current Position')}
                </button>
              )}
            </div>

            {isSavingPreset && (
              <div className="p-3.5 bg-twitch/10 border border-twitch/40 rounded-2xl space-y-3 animate-fade-in shadow-xl">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-twitch" />
                  <span>Guardar posición ({config.customX}%, {config.customY}%)</span>
                </div>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder={tr('wm_preset_name_ph', 'Name (e.g. Gamer Corner)')}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-twitch"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsSavingPreset(false)}
                    className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer font-bold"
                  >
                    {tr('wm_cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSaveCurrentPreset}
                    className="px-4 py-1.5 bg-twitch text-white font-black rounded-xl text-xs hover:bg-twitch-dark transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-twitch/20"
                  >
                    {tr('wm_save', 'Save Position')}
                  </button>
                </div>
              </div>
            )}

            {presets.filter(p => !p.isDefault).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {presets.filter(p => !p.isDefault).map(preset => {
                  const isSelected = config.positionId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all duration-200 flex items-center justify-between ${isSelected ? 'bg-twitch/20 border-twitch text-twitch shadow-md ring-1 ring-twitch/30' : 'bg-white/5 border-white/5 text-gray-300 hover:border-white/20'}`}
                    >
                      <button
                        onClick={() => handleSelectPreset(preset)}
                        className="flex-1 text-left truncate cursor-pointer uppercase font-bold transition-transform hover:scale-102"
                      >
                        {nombrePreset(preset)}
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-all duration-200 hover:scale-125 cursor-pointer ml-1"
                        title={tr('wm_delete_preset', 'Delete position')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                {tr('wm_no_presets', 'No custom positions saved yet. Drag overlay on video and click "Save Current Position"!')}
              </p>
            )}
          </div>

          {/* Coordinates Sliders */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>{tr('wm_pos_x', 'Horizontal position (X)')}</span>
                <span className="text-twitch font-mono font-bold">{config.customX}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="97"
                value={config.customX}
                onChange={e => onChangeConfig({ ...config, positionId: 'custom', customX: parseInt(e.target.value) })}
                className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>{tr('wm_pos_y', 'Vertical position (Y)')}</span>
                <span className="text-twitch font-mono font-bold">{config.customY}%</span>
              </div>
              <input
                type="range"
                min="3"
                max="97"
                value={config.customY}
                onChange={e => onChangeConfig({ ...config, positionId: 'custom', customY: parseInt(e.target.value) })}
                className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEXT & STYLE ENHANCED */}
      {activeTab === 'style' && (
        <div className="space-y-5 animate-fade-in flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* Preset Visual Themes */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
              {tr('wm_styles', 'Visual Preset Themes')}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { name: 'Twitch', bg: '#9146FF', text: '#ffffff', glow: false, stroke: false },
                { name: 'Neon Cyber', bg: '#05050a', text: '#00f3ff', glow: true, stroke: false, shadowColor: '#00f3ff' },
                { name: 'Gamer Gold', bg: '#14120a', text: '#ffd700', glow: false, stroke: true, strokeColor: '#000000' },
                { name: 'Minimal White', bg: '#ffffff', text: '#000000', glow: false, stroke: false },
                { name: 'Cyber Red', bg: '#ff0055', text: '#ffffff', glow: true, stroke: false, shadowColor: '#ff0055' },
                { name: 'Outline', bg: '#000000', text: '#ffffff', glow: false, stroke: true, strokeColor: '#9146FF' }
              ].map((theme, i) => (
                <button
                  key={i}
                  onClick={() => onChangeConfig({
                    ...config,
                    bgColor: theme.bg,
                    textColor: theme.text,
                    glowMode: theme.glow,
                    shadowColor: theme.shadowColor || 'rgba(0,0,0,0.7)',
                    stroke: theme.stroke,
                    strokeColor: theme.strokeColor || '#000000',
                    bgOpacity: theme.name === 'Contorno Only' ? 0.3 : 0.85
                  })}
                  className="p-2.5 rounded-xl border border-white/10 text-[10px] font-black tracking-wide text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Template Presets */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
              {tr('wm_templates', 'Quick Text Formats')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickTemplates.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => onChangeConfig({ ...config, template: t.template })}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${config.template === t.template ? 'bg-twitch text-white border-twitch shadow-md' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={config.template}
              onChange={e => onChangeConfig({ ...config, template: e.target.value })}
              placeholder="@{channel}"
              className="w-full bg-dark-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-twitch font-mono"
            />
          </div>

          {/* Text Case Transformation */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
              {tr('wm_case', 'Text Case')}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'none', label: tr('wm_case_original', 'Original') },
                { id: 'uppercase', label: tr('wm_case_upper', 'UPPER') },
                { id: 'lowercase', label: tr('wm_case_lower', 'lower') },
                { id: 'capitalize', label: tr('wm_case_title', 'Title') },
              ].map(tc => (
                <button
                  key={tc.id}
                  onClick={() => onChangeConfig({ ...config, textTransform: tc.id as TextTransform })}
                  className={`py-2 rounded-xl border text-[11px] font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer text-center ${config.textTransform === tc.id || (!config.textTransform && tc.id === 'none') ? 'bg-twitch/20 border-twitch text-twitch font-black shadow-sm' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  {tc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Extended */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
              {tr('wm_font', 'Font Family')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'sans', name: 'Inter (Sans)' },
                { id: 'montserrat', name: 'Montserrat' },
                { id: 'bebas', name: 'Bebas / Gaming' },
                { id: 'impact', name: 'Impact Heavy' },
                { id: 'orbitron', name: 'Orbitron Cyber' },
                { id: 'righteous', name: 'Righteous Retro' },
                { id: 'pixel', name: 'Pixel Arcade' },
                { id: 'mono', name: 'Monospace Code' },
                { id: 'serif', name: 'Serif Elegante' },
                { id: 'handwriting', name: 'Graffiti Marker' },
              ].map(font => (
                <button
                  key={font.id}
                  onClick={() => onChangeConfig({ ...config, fontFamily: font.id as FontFamily })}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer text-left truncate ${config.fontFamily === font.id ? 'bg-twitch/20 border-twitch text-twitch shadow-sm ring-1 ring-twitch/30' : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'}`}
                  style={{ fontFamily: getFontCss(font.id as FontFamily) }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          {/* Weight & Italic options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">{tr('wm_weight', 'Font weight')}</label>
              <select
                value={config.fontWeight || 'bold'}
                onChange={e => onChangeConfig({ ...config, fontWeight: e.target.value as FontWeight })}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-twitch cursor-pointer font-bold"
              >
                <option value="normal">{tr('wm_weight_normal', 'Normal')}</option>
                <option value="bold">{tr('wm_weight_bold', 'Bold')}</option>
                <option value="900">{tr('wm_weight_black', 'Black')}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">{tr('wm_italic', 'Italic')}</label>
              <button
                onClick={() => onChangeConfig({ ...config, fontStyle: config.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className={`w-full py-2 rounded-xl border text-xs font-bold italic transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${config.fontStyle === 'italic' ? 'bg-twitch/20 border-twitch text-twitch shadow-sm' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
              >
                {config.fontStyle === 'italic' ? 'Italic Activo' : 'Cursiva / Italic'}
              </button>
            </div>
          </div>

          {/* Font Size & Colors */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>{tr('wm_size', 'Font Size')}</span>
                <span className="text-twitch font-mono font-bold">{config.fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="60"
                value={config.fontSize}
                onChange={e => onChangeConfig({ ...config, fontSize: parseInt(e.target.value) })}
                className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>{tr('wm_kerning', 'Letter spacing')}</span>
                <span className="text-twitch font-mono font-bold">{config.letterSpacing || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                value={config.letterSpacing || 0}
                onChange={e => onChangeConfig({ ...config, letterSpacing: parseInt(e.target.value) })}
                className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">{tr('wm_color_text', 'Text colour')}</label>
                <div className="flex items-center gap-2 bg-dark-950 p-2 border border-white/10 rounded-xl cursor-pointer hover:border-twitch/50 transition-colors">
                  <input
                    type="color"
                    value={config.textColor}
                    onChange={e => onChangeConfig({ ...config, textColor: e.target.value })}
                    className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white uppercase font-bold">{config.textColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1.5">{tr('wm_color_bg', 'Background colour')}</label>
                <div className="flex items-center gap-2 bg-dark-950 p-2 border border-white/10 rounded-xl cursor-pointer hover:border-twitch/50 transition-colors">
                  <input
                    type="color"
                    value={config.bgColor}
                    onChange={e => onChangeConfig({ ...config, bgColor: e.target.value })}
                    className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-white uppercase font-bold">{config.bgColor}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>{tr('wm_bg_opacity', 'Background opacity')}</span>
                <span className="text-twitch font-mono font-bold">{Math.round(config.bgOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.bgOpacity}
                onChange={e => onChangeConfig({ ...config, bgOpacity: parseFloat(e.target.value) })}
                className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
              />
            </div>
          </div>

          {/* ADVANCED STROKE / BORDE DE TEXTO */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">{tr('wm_stroke', 'Text outline')}</span>
              <input
                type="checkbox"
                checked={config.stroke || false}
                onChange={e => onChangeConfig({ ...config, stroke: e.target.checked })}
                className="w-4 h-4 accent-twitch rounded cursor-pointer"
              />
            </div>

            {config.stroke && (
              <div className="space-y-3 animate-fade-in p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 block mb-1">{tr('wm_stroke_color', 'Outline colour')}</label>
                    <input
                      type="color"
                      value={config.strokeColor || '#000000'}
                      onChange={e => onChangeConfig({ ...config, strokeColor: e.target.value })}
                      className="w-full h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                      <span>{tr('wm_stroke_width', 'Width')}</span>
                      <span className="text-twitch font-mono font-bold">{config.strokeWidth || 2}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.strokeWidth || 2}
                      onChange={e => onChangeConfig({ ...config, strokeWidth: parseInt(e.target.value) })}
                      className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">{tr('wm_corner', 'Corner style')}</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'round', label: 'Redonda' },
                      { id: 'miter', label: 'Puntiaguda' },
                      { id: 'bevel', label: 'Biselada' }
                    ].map(j => (
                      <button
                        key={j.id}
                        onClick={() => onChangeConfig({ ...config, strokeJoin: j.id as any })}
                        className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${config.strokeJoin === j.id || (!config.strokeJoin && j.id === 'round') ? 'bg-twitch/20 border-twitch text-twitch shadow-sm' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'}`}
                      >
                        {j.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ADVANCED SHADOW & GLOW */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">{tr('wm_shadow', 'Shadow / neon glow')}</span>
              <input
                type="checkbox"
                checked={config.shadow}
                onChange={e => onChangeConfig({ ...config, shadow: e.target.checked })}
                className="w-4 h-4 accent-twitch rounded cursor-pointer"
              />
            </div>

            {config.shadow && (
              <div className="space-y-3 animate-fade-in p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[11px] font-bold text-twitch flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Modo Resplandor Neon
                  </span>
                  <input
                    type="checkbox"
                    checked={config.glowMode || false}
                    onChange={e => onChangeConfig({ ...config, glowMode: e.target.checked })}
                    className="w-3.5 h-3.5 accent-twitch rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">{tr('wm_shadow_color', 'Shadow colour')}</label>
                  <input
                    type="color"
                    value={config.shadowColor?.startsWith('#') ? config.shadowColor : '#000000'}
                    onChange={e => onChangeConfig({ ...config, shadowColor: e.target.value })}
                    className="w-full h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>{tr('wm_blur', 'Blur radius')}</span>
                    <span className="text-twitch font-mono font-bold">{config.shadowBlur ?? 8}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={config.shadowBlur ?? 8}
                    onChange={e => onChangeConfig({ ...config, shadowBlur: parseInt(e.target.value) })}
                    className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                {!config.glowMode && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                        <span>{tr('wm_offset_x', 'Offset X')}</span>
                        <span className="text-twitch font-mono font-bold">{config.shadowOffsetX ?? 2}px</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="15"
                        value={config.shadowOffsetX ?? 2}
                        onChange={e => onChangeConfig({ ...config, shadowOffsetX: parseInt(e.target.value) })}
                        className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                        <span>{tr('wm_offset_y', 'Offset Y')}</span>
                        <span className="text-twitch font-mono font-bold">{config.shadowOffsetY ?? 2}px</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="15"
                        value={config.shadowOffsetY ?? 2}
                        onChange={e => onChangeConfig({ ...config, shadowOffsetY: parseInt(e.target.value) })}
                        className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOX BORDER CONTROLS */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300">{tr('wm_box_border', 'Background card border')}</span>
              <input
                type="checkbox"
                checked={config.boxBorder || false}
                onChange={e => onChangeConfig({ ...config, boxBorder: e.target.checked })}
                className="w-4 h-4 accent-twitch rounded cursor-pointer"
              />
            </div>

            {config.boxBorder && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in p-3.5 bg-white/5 border border-white/10 rounded-2xl">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">{tr('wm_box_border_color', 'Card border colour')}</label>
                  <input
                    type="color"
                    value={config.boxBorderColor || '#ffffff'}
                    onChange={e => onChangeConfig({ ...config, boxBorderColor: e.target.value })}
                    className="w-full h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>{tr('wm_box_border_width', 'Border width')}</span>
                    <span className="text-twitch font-mono font-bold">{config.boxBorderWidth || 2}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={config.boxBorderWidth || 2}
                    onChange={e => onChangeConfig({ ...config, boxBorderWidth: parseInt(e.target.value) })}
                    className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Icon Toggle */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">{tr('wm_show_icon', 'Show the Twitch icon')}</span>
            <input
              type="checkbox"
              checked={config.showIcon}
              onChange={e => onChangeConfig({ ...config, showIcon: e.target.checked })}
              className="w-4 h-4 accent-twitch rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* TAB 3: ANIMATIONS / EFFECTS WITH INDEPENDENT ENTRY / EXIT TESTING */}
      {activeTab === 'animation' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* Quick Playback Test Buttons */}
          <div className="p-3.5 bg-twitch/10 border border-twitch/30 rounded-2xl space-y-2 shadow-lg">
            <label className="text-[11px] font-black uppercase tracking-wider text-twitch block">
              {tr('wm_fx_test', 'Animation Testing')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleTestEntry}
                className="px-2.5 py-2.5 bg-twitch text-white hover:bg-twitch-dark font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-twitch/20 uppercase tracking-wide"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Entrada
              </button>
              <button
                onClick={handleTestExit}
                className="px-2.5 py-2.5 bg-twitch/80 text-white hover:bg-twitch-dark font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md uppercase tracking-wide"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Salida
              </button>
              <button
                onClick={handleTestFull}
                className="px-2.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-white/10 uppercase tracking-wide"
              >
                <Play className="w-3.5 h-3.5" /> Completa
              </button>
            </div>
          </div>

          {/* Entry Animation Controls */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-twitch" />
                {tr('wm_entry', 'Entry Animation')}
              </label>
              <button
                onClick={handleTestEntry}
                className="text-[10px] font-black uppercase tracking-wider text-twitch hover:text-white flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 bg-twitch/10 px-2 py-1 rounded-lg border border-twitch/20"
              >
                <Play className="w-3 h-3" /> Probar Entrada
              </button>
            </div>

            <select
              value={config.entryEffect}
              onChange={e => onChangeConfig({ ...config, entryEffect: e.target.value as EntryEffect })}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-twitch cursor-pointer uppercase font-bold"
            >
              <option value="none">{tr('wm_fx_none', 'None (static)')}</option>
              <option value="fade">{tr('wm_fx_fade_in', 'Fade in')}</option>
              <option value="slide-down">{tr('wm_fx_slide_down', 'Slide down')}</option>
              <option value="slide-up">{tr('wm_fx_slide_up', 'Slide up')}</option>
              <option value="slide-left">{tr('wm_fx_slide_left', 'Slide in from the right')}</option>
              <option value="slide-right">{tr('wm_fx_slide_right', 'Slide in from the left')}</option>
              <option value="zoom">{tr('wm_fx_zoom_in', 'Zoom in')}</option>
              <option value="bounce">{tr('wm_fx_bounce', 'Bounce')}</option>
              <option value="rotate-in">{tr('wm_fx_rotate_fade', 'Rotate and fade')}</option>
              <option value="pop-in">{tr('wm_fx_pop_spring', 'Elastic pop')}</option>
              <option value="flip-x">{tr('wm_fx_flip', 'Flip')}</option>
              <option value="typewriter">{tr('wm_fx_typewriter', 'Typewriter')}</option>
            </select>

            {config.entryEffect !== 'none' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>{tr('wm_entry_duration', 'Entry duration')}</span>
                    <span className="text-twitch font-mono font-bold">{config.entryDuration}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.5"
                    step="0.1"
                    value={config.entryDuration}
                    onChange={e => onChangeConfig({ ...config, entryDuration: parseFloat(e.target.value) })}
                    className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>{tr('wm_entry_delay', 'Start delay')}</span>
                    <span className="text-twitch font-mono font-bold">{config.entryDelay || 0}s</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="5.0"
                    step="0.2"
                    value={config.entryDelay || 0}
                    onChange={e => onChangeConfig({ ...config, entryDelay: parseFloat(e.target.value) })}
                    className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Exit Animation Controls */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5 text-twitch" />
                {tr('wm_exit', 'Exit Animation')}
              </label>
              <button
                onClick={handleTestExit}
                className="text-[10px] font-black uppercase tracking-wider text-twitch hover:text-white flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 bg-twitch/10 px-2 py-1 rounded-lg border border-twitch/20"
              >
                <Play className="w-3 h-3" /> Probar Salida
              </button>
            </div>

            <select
              value={config.exitEffect}
              onChange={e => onChangeConfig({ ...config, exitEffect: e.target.value as ExitEffect })}
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-twitch cursor-pointer uppercase font-bold"
            >
              <option value="none">{tr('wm_fxo_none', 'None (stays to the end)')}</option>
              <option value="fade">{tr('wm_fxo_fade', 'Fade out')}</option>
              <option value="slide-down">{tr('wm_fxo_slide_down', 'Slide down')}</option>
              <option value="slide-up">{tr('wm_fxo_slide_up', 'Slide up')}</option>
              <option value="slide-left">{tr('wm_fxo_slide_left', 'Slide left')}</option>
              <option value="slide-right">{tr('wm_fxo_slide_right', 'Slide right')}</option>
              <option value="zoom">{tr('wm_fxo_zoom_out', 'Zoom out')}</option>
              <option value="rotate-out">{tr('wm_fxo_rotate', 'Rotate out')}</option>
              <option value="pop-out">{tr('wm_fxo_pop', 'Elastic pop out')}</option>
            </select>

            {config.exitEffect !== 'none' && (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                  <span>{tr('wm_exit_duration', 'Exit duration')}</span>
                  <span className="text-twitch font-mono font-bold">{config.exitDuration}s</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.5"
                  step="0.1"
                  value={config.exitDuration}
                  onChange={e => onChangeConfig({ ...config, exitDuration: parseFloat(e.target.value) })}
                  className="w-full accent-twitch bg-white/10 rounded-lg h-1.5 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // FULLSCREEN MODAL LAYOUT VIA REACT PORTAL (Escapes any parent stacking contexts)
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 z-[99999] bg-[#07060a] p-4 md:p-6 flex flex-col animate-fade-in overflow-hidden w-screen h-screen">
        {/* Fullscreen Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-twitch/20 rounded-2xl border border-twitch/30">
              <Sparkles className="w-5 h-5 text-twitch" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                {tr('wm_title_full', 'Watermark Fullscreen Editor')}
                <span className="text-[9px] bg-twitch/20 text-twitch px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-twitch/30">
                  PRO VIEW
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-twitch/10 border border-twitch/30 rounded-xl text-xs font-bold text-twitch">
              <Move className="w-3.5 h-3.5" />
              <span>{tr('wm_drag_hint', 'Drag on video to move')}</span>
            </div>

            <div className="px-3.5 py-1.5 bg-dark-950/80 border border-white/10 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-gray-300">
              <Move className="w-3.5 h-3.5 text-twitch" />
              <span>X: <strong className="text-twitch">{config.customX}%</strong></span>
              <span className="text-white/20">|</span>
              <span>Y: <strong className="text-twitch">{config.customY}%</strong></span>
            </div>

            <button
              onClick={handleTestEntry}
              className="px-3.5 py-2 bg-twitch/20 hover:bg-twitch/30 border border-twitch/40 rounded-xl text-xs font-bold text-twitch flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Entrada
            </button>

            <button
              onClick={handleTestExit}
              className="px-3.5 py-2 bg-twitch/20 hover:bg-twitch/30 border border-twitch/40 rounded-xl text-xs font-bold text-twitch flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Salida
            </button>

            <button
              onClick={handleTestFull}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:text-white flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {tr('wm_replay', 'Replay')}
            </button>

            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 py-2 bg-twitch text-white hover:bg-twitch-dark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-twitch shadow-lg flex items-center gap-2 text-xs font-black uppercase px-4 shadow-twitch/20"
              title={tr('wm_exit_fullscreen', 'Leave fullscreen')}
            >
              <X className="w-4 h-4" />
              <span>{tr('wm_close', 'Close')}</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Body: Video Player Left (~75%), Controls Sidebar Right (~25%) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 min-h-0 overflow-hidden">
          {/* LEFT: Huge Clip Video Player */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col justify-center items-center h-full relative bg-black/60 rounded-3xl border border-white/10 p-2 overflow-hidden shadow-2xl">
            <div 
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onMouseEnter={() => setIsHoveringVideo(true)}
              onMouseLeave={() => setIsHoveringVideo(false)}
              className="relative w-full h-full max-h-[84vh] aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl group cursor-crosshair select-none flex items-center justify-center"
            >
              <video
                ref={videoRef}
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={() => {
                  if (canvasRef.current && videoRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth || 1280;
                    canvasRef.current.height = videoRef.current.videoHeight || 720;
                    renderPreview();
                  }
                }}
                className="w-full h-full object-contain pointer-events-none"
              />
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
              />



              <button
                onClick={togglePlay}
                className="absolute bottom-4 left-4 z-30 p-3.5 bg-black/60 hover:bg-twitch backdrop-blur-md rounded-2xl text-white transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-2xl"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* RIGHT SIDEBAR: Control Menu */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-full bg-[#111114]/90 border border-white/10 rounded-3xl p-5 overflow-hidden shadow-2xl">
            {renderSidebarControls()}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // STANDARD INLINE VIEW LAYOUT
  return (
    <div className="w-full bg-[#111114]/90 backdrop-blur-2xl border border-twitch/30 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-fade-in space-y-8">
      {/* Cabecera del editor.
          Antes era una fila unica con el titulo, la insignia, la pista de
          arrastrar, las coordenadas, dos botones de prueba, la equis y pantalla
          completa — todo del mismo tamaño y del mismo color, apretandose entre
          si en cuanto la ventana se estrechaba. Ahora va en dos alturas: arriba
          quien eres y donde estas, abajo los mandos, agrupados por lo que hacen
          y separados por lineas. */}
      <div className="space-y-4 pb-6 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-twitch/20 rounded-2xl border border-twitch/30 shrink-0">
              <Sparkles className="w-6 h-6 text-twitch" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base md:text-lg font-black uppercase tracking-tight text-white truncate">
                {tr('wm_title', 'Channel Watermark Preview')}
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                {tr('wm_subtitle', 'Set up the overlay before you burn it into the clip')}
              </p>
            </div>
          </div>

          {/* Cerrar y pantalla completa arriba a la derecha, que es donde se
              buscan, y lejos de los mandos que cambian el cartel. */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreen(true)}
              className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
              title={tr('wm_fullscreen', 'Fullscreen')}
              aria-label={tr('wm_fullscreen', 'Fullscreen')}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                title={tr('wm_close', 'Close')}
                aria-label={tr('wm_close', 'Close')}
                className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Donde esta el cartel: la pista y las coordenadas son la misma
              informacion, asi que van en la misma pastilla en vez de en dos. */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-dark-950/80 border border-white/10 rounded-xl text-xs font-bold text-gray-400">
            <Move className="w-3.5 h-3.5 text-twitch shrink-0" />
            <span className="hidden md:inline font-medium">{tr('wm_drag_hint', 'Drag on video to move')}</span>
            <span className="hidden md:inline text-white/15">|</span>
            <span className="font-mono text-gray-300">
              X <strong className="text-twitch">{config.customX}%</strong>
              <span className="text-white/20 mx-1.5">·</span>
              Y <strong className="text-twitch">{config.customY}%</strong>
            </span>
          </div>

          {/* Probar las animaciones: dos acciones hermanas, en un mismo grupo
              con la etiqueta delante, para que no parezcan navegacion. */}
          <div className="flex items-center gap-1 px-1.5 py-1 bg-dark-950/80 border border-white/10 rounded-xl">
            <span className="hidden sm:inline px-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
              {tr('wm_test', 'Test')}
            </span>
            <button
              onClick={handleTestEntry}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-twitch hover:bg-twitch/15 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={tr('wm_test_in', 'Entry animation')}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              {tr('wm_test_in_short', 'In')}
            </button>
            <button
              onClick={handleTestExit}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-twitch hover:bg-twitch/15 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={tr('wm_test_out', 'Exit animation')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {tr('wm_test_out_short', 'Out')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* PREVIEW PLAYER AREA (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div 
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onMouseEnter={() => setIsHoveringVideo(true)}
            onMouseLeave={() => setIsHoveringVideo(false)}
            className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl group cursor-crosshair select-none"
          >
            {/* Video element */}
            <video
              ref={videoRef}
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={() => {
                if (canvasRef.current && videoRef.current) {
                  canvasRef.current.width = videoRef.current.videoWidth || 1280;
                  canvasRef.current.height = videoRef.current.videoHeight || 720;
                  renderPreview();
                }
              }}
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Canvas Overlay Layer */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
            />



            {/* Video Controls overlay button */}
            <button
              onClick={togglePlay}
              className="absolute bottom-4 left-4 z-30 p-3 bg-black/60 hover:bg-twitch backdrop-blur-md rounded-2xl text-white transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-lg"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>

          {/* ---- Descargar el clip con la marca de agua incrustada ---- */}
          {onExport && (
            <div className="rounded-3xl border border-twitch/25 bg-dark-950/70 p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-twitch/15 border border-twitch/30">
                    <Download className="w-4 h-4 text-twitch" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white leading-tight">
                      {tr('wm_export_title', 'Download with the watermark')}
                    </p>
                    {/* Se dice ANTES de empezar, no después: el render va a
                        velocidad real y sin avisar parecería que se ha colgado. */}
                    <p className="text-[11px] text-gray-400 leading-snug">
                      {tr('wm_export_hint', 'Rendering runs in real time, so it takes about as long as the clip lasts')}
                      {duracionClip > 0 ? ` — ~${mmss(duracionClip)}` : ''}
                    </p>
                  </div>
                </div>

                {!trabajando && (
                  <div className="flex items-center gap-2">
                    {clip.resolutions.length > 1 && (
                      <select
                        value={calidad}
                        onChange={(e) => setCalidad(e.target.value)}
                        aria-label={tr('wm_export_quality', 'Quality')}
                        className="bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-twitch/50"
                      >
                        {clip.resolutions.map((r) => (
                          <option key={r.quality} value={r.quality}>{r.quality}</option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={lanzarExport}
                      className="px-4 py-2.5 rounded-xl bg-twitch hover:bg-twitch-dark text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-twitch/20"
                    >
                      <Download className="w-4 h-4" />
                      {tr('wm_export_go', 'Render and download')}
                    </button>
                  </div>
                )}
              </div>

              {trabajando && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-twitch uppercase tracking-widest">
                      {fase === 'descarga'
                        ? tr('wm_export_downloading', 'Downloading the clip')
                        : tr('wm_export_rendering', 'Burning in the watermark')}
                    </span>
                    <span className="text-gray-400 tabular-nums">
                      {pct}%{fase === 'render' && restante > 0 ? ' · ' + mmss(restante) : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-twitch transition-all duration-300"
                      style={{ width: `${Math.max(2, pct)}%` }}
                    />
                  </div>
                  <button
                    onClick={cancelarExport}
                    className="w-full py-2 rounded-xl border border-white/10 text-[11px] font-bold text-gray-400 hover:text-white hover:border-white/25 transition-colors cursor-pointer"
                  >
                    {tr('wm_cancel', 'Cancel')}
                  </button>
                </div>
              )}

              {errorExport && (
                <p className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-3 py-2">
                  {errorExport}
                </p>
              )}
            </div>
          )}
        </div>

        {/* CONTROLS SIDEBAR (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {renderSidebarControls()}
        </div>
      </div>
    </div>
  );
};

export default WatermarkPreview;
