// ============================================================================
// CÓDIGO DORMIDO — NO ESTÁ CONECTADO A LA INTERFAZ (revisado 2026-08-31)
// ----------------------------------------------------------------------------
// Este editor de marca de agua está terminado pero NO lo importa nadie: no hay
// ningún botón en TwitchBolt que lo abra, así que ningún usuario puede llegar a
// él y no entra en el bundle publicado. Último trabajo real: 2026-07-28.
//
// No es un descuido pendiente de arreglar: Adrián decidió el 2026-08-31 dejarlo
// dormido a propósito, ni conectarlo ni borrarlo.
//
// Si algún día se conecta, quedan dos deudas conocidas antes de enseñarlo:
//   1. Los ~26 textos de la interfaz son ternarios `lang === 'es' ? … : …`, o
//      sea que los otros siete idiomas verían inglés. Necesita el diccionario.
//   2. El prop `lang` tiene DEFAULT 'es': sin idioma explícito sale en español.
//   3. processVideoWithWatermark() graba con MediaRecorder sobre un canvas, o
//      sea A VELOCIDAD REAL: un clip de 60 s tarda 60 s en procesarse. Antes de
//      publicarlo hay que avisarlo en pantalla o pasar el encoder a WebCodecs.
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ClipData, WatermarkConfig, PositionPreset, FontFamily, TextTransform, FontWeight, EntryEffect, ExitEffect } from '../types';
import { 
  drawWatermarkOnCanvas, 
  getFontCss 
} from '../services/watermarkService';
import { 
  Palette, Sparkles, Move, Plus, Trash2, RotateCcw, Play, Pause, Check, Wand2, Maximize2, Minimize2, X, ArrowRight, ArrowLeft
} from 'lucide-react';

interface WatermarkPreviewProps {
  clip: ClipData;
  config: WatermarkConfig;
  onChangeConfig: (newConfig: WatermarkConfig) => void;
  presets: PositionPreset[];
  onSavePreset: (newPreset: PositionPreset) => void;
  onDeletePreset: (presetId: string) => void;
  lang?: string;
}

const WatermarkPreview: React.FC<WatermarkPreviewProps> = ({
  clip,
  config,
  onChangeConfig,
  presets,
  onSavePreset,
  onDeletePreset,
  lang = 'es'
}) => {
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

  const handleSelectPreset = (preset: PositionPreset) => {
    onChangeConfig({
      ...config,
      positionId: preset.id,
      customX: preset.x,
      customY: preset.y
    });
  };

  const handleSaveCurrentPreset = () => {
    const name = newPresetName.trim() || `Posición (${config.customX}%, ${config.customY}%)`;
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
    { label: 'SIGUE A ' + channelName, template: 'SIGUE A {channel}' },
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
          <Move className="w-3.5 h-3.5" /> {lang === 'es' ? 'Posición' : 'Position'}
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'style' ? 'bg-twitch text-white shadow-lg shadow-twitch/20 ring-1 ring-twitch/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Palette className="w-3.5 h-3.5" /> {lang === 'es' ? 'Texto' : 'Text'}
        </button>
        <button
          onClick={() => setActiveTab('animation')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'animation' ? 'bg-twitch text-white shadow-lg shadow-twitch/20 ring-1 ring-twitch/50' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Wand2 className="w-3.5 h-3.5" /> {lang === 'es' ? 'Efectos' : 'Effects'}
        </button>
      </div>

      {/* TAB 1: POSITION PRESETS & CUSTOM PRESETS */}
      {activeTab === 'position' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto custom-scrollbar pr-1">
          {saveSuccessMsg && (
            <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
              <Check className="w-4 h-4 text-green-400" /> {lang === 'es' ? '¡Posición personalizada guardada!' : 'Custom position saved successfully!'}
            </div>
          )}

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-3">
              {lang === 'es' ? 'Posiciones por Defecto' : 'Preset Positions'}
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
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Presets Section */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                {lang === 'es' ? 'Posiciones Personalizadas' : 'Saved Custom Positions'}
              </label>
              {!isSavingPreset && (
                <button
                  onClick={() => setIsSavingPreset(true)}
                  className="text-[11px] font-black uppercase tracking-wider text-twitch hover:text-white flex items-center gap-1 cursor-pointer bg-twitch/10 hover:bg-twitch px-3 py-1.5 rounded-xl border border-twitch/30 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> {lang === 'es' ? 'Guardar Posición Actual' : 'Save Current Position'}
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
                  placeholder={lang === 'es' ? 'Nombre (ej: Esquina Gamer)' : 'Name (e.g. Gamer Corner)'}
                  className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-twitch"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsSavingPreset(false)}
                    className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer font-bold"
                  >
                    {lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSaveCurrentPreset}
                    className="px-4 py-1.5 bg-twitch text-white font-black rounded-xl text-xs hover:bg-twitch-dark transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-twitch/20"
                  >
                    {lang === 'es' ? 'Guardar Mi Posición' : 'Save Position'}
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
                        {preset.name}
                      </button>
                      <button
                        onClick={() => onDeletePreset(preset.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-all duration-200 hover:scale-125 cursor-pointer ml-1"
                        title="Eliminar preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">
                {lang === 'es' ? 'No has guardado posiciones personalizadas aún. ¡Arrastra el cartel sobre el vídeo y pulsa "Guardar Posición Actual"!' : 'No custom positions saved yet. Drag overlay on video and click "Save Current Position"!'}
              </p>
            )}
          </div>

          {/* Coordinates Sliders */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                <span>Posición Horizontal (X)</span>
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
                <span>Posición Vertical (Y)</span>
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
              {lang === 'es' ? 'Estilos Visuales Predefinidos' : 'Visual Preset Themes'}
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { name: 'Twitch', bg: '#9146FF', text: '#ffffff', glow: false, stroke: false },
                { name: 'Neon Cyber', bg: '#05050a', text: '#00f3ff', glow: true, stroke: false, shadowColor: '#00f3ff' },
                { name: 'Gamer Gold', bg: '#14120a', text: '#ffd700', glow: false, stroke: true, strokeColor: '#000000' },
                { name: 'Minimal White', bg: '#ffffff', text: '#000000', glow: false, stroke: false },
                { name: 'Cyber Red', bg: '#ff0055', text: '#ffffff', glow: true, stroke: false, shadowColor: '#ff0055' },
                { name: 'Contorno Only', bg: '#000000', text: '#ffffff', glow: false, stroke: true, strokeColor: '#9146FF' }
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
              {lang === 'es' ? 'Plantillas Rápidas de Texto' : 'Quick Text Formats'}
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
              {lang === 'es' ? 'Formato de Mayúsculas / Minúsculas' : 'Text Case'}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'none', label: 'Original' },
                { id: 'uppercase', label: 'MAYÚS' },
                { id: 'lowercase', label: 'minús' },
                { id: 'capitalize', label: 'Título' },
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
              {lang === 'es' ? 'Tipografía / Fuente' : 'Font Family'}
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
              <label className="text-xs font-bold text-gray-400 block mb-1.5">Grosor de Letra</label>
              <select
                value={config.fontWeight || 'bold'}
                onChange={e => onChangeConfig({ ...config, fontWeight: e.target.value as FontWeight })}
                className="w-full bg-dark-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-twitch cursor-pointer font-bold"
              >
                <option value="normal">Normal</option>
                <option value="bold">Negrita (Bold)</option>
                <option value="900">Black (Extra Bold)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 block mb-1.5">Estilo Cursiva</label>
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
                <span>{lang === 'es' ? 'Tamaño de Letra' : 'Font Size'}</span>
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
                <span>Espaciado entre letras (Kerning)</span>
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
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Color Texto</label>
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
                <label className="text-xs font-bold text-gray-400 block mb-1.5">Color Fondo</label>
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
                <span>Opacidad Fondo</span>
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
              <span className="text-xs font-bold text-gray-300">Contorno / Borde de Texto</span>
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
                    <label className="text-[11px] font-bold text-gray-400 block mb-1">Color Borde</label>
                    <input
                      type="color"
                      value={config.strokeColor || '#000000'}
                      onChange={e => onChangeConfig({ ...config, strokeColor: e.target.value })}
                      className="w-full h-8 rounded border-none bg-transparent cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                      <span>Grosor</span>
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
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Tipo de Esquina</label>
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
              <span className="text-xs font-bold text-gray-300">Sombra / Resplandor Neon</span>
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
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Color Sombra / Glow</label>
                  <input
                    type="color"
                    value={config.shadowColor?.startsWith('#') ? config.shadowColor : '#000000'}
                    onChange={e => onChangeConfig({ ...config, shadowColor: e.target.value })}
                    className="w-full h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>Radio Desenfoque (Blur)</span>
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
                        <span>Desplazamiento X</span>
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
                        <span>Desplazamiento Y</span>
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
              <span className="text-xs font-bold text-gray-300">Borde de Tarjeta de Fondo</span>
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
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Color Borde Caja</label>
                  <input
                    type="color"
                    value={config.boxBorderColor || '#ffffff'}
                    onChange={e => onChangeConfig({ ...config, boxBorderColor: e.target.value })}
                    className="w-full h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>Grosor Borde</span>
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
            <span className="text-xs font-bold text-gray-300">Mostrar Icono Twitch</span>
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
              {lang === 'es' ? 'Prueba de Animaciones' : 'Animation Testing'}
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
                {lang === 'es' ? 'Efecto de Entrada' : 'Entry Animation'}
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
              <option value="none">Ninguno (Fijo)</option>
              <option value="fade">Desvanecer (Fade In)</option>
              <option value="slide-down">Deslizar Arriba → Abajo</option>
              <option value="slide-up">Deslizar Abajo → Arriba</option>
              <option value="slide-left">Deslizar Derecha → Izquierda</option>
              <option value="slide-right">Deslizar Izquierda → Derecha</option>
              <option value="zoom">Escala / Zoom In</option>
              <option value="bounce">Rebote Elastic (Bounce)</option>
              <option value="rotate-in">Rotación + Fade</option>
              <option value="pop-in">Pop Spring Elastic</option>
              <option value="flip-x">Giro / Flip</option>
              <option value="typewriter">Máquina de Escribir (Typewriter)</option>
            </select>

            {config.entryEffect !== 'none' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                    <span>Duración Entrada</span>
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
                    <span>Retraso de Inicio (Start Delay)</span>
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
                {lang === 'es' ? 'Efecto de Salida' : 'Exit Animation'}
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
              <option value="none">Ninguno (Permanece hasta el final)</option>
              <option value="fade">Desvanecer (Fade Out)</option>
              <option value="slide-down">Deslizar Abajo</option>
              <option value="slide-up">Deslizar Arriba</option>
              <option value="slide-left">Deslizar Izquierda</option>
              <option value="slide-right">Deslizar Derecha</option>
              <option value="zoom">Escala / Zoom Out</option>
              <option value="rotate-out">Rotación Out</option>
              <option value="pop-out">Pop Out Elastic</option>
            </select>

            {config.exitEffect !== 'none' && (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1">
                  <span>Duración Salida</span>
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
                {lang === 'es' ? 'Editor de Marca de Agua' : 'Watermark Fullscreen Editor'}
                <span className="text-[9px] bg-twitch/20 text-twitch px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-twitch/30">
                  PRO VIEW
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-twitch/10 border border-twitch/30 rounded-xl text-xs font-bold text-twitch">
              <Move className="w-3.5 h-3.5" />
              <span>{lang === 'es' ? 'Arrastra sobre el vídeo para mover' : 'Drag on video to move'}</span>
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
              {lang === 'es' ? 'Reanimar' : 'Replay'}
            </button>

            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 py-2 bg-twitch text-white hover:bg-twitch-dark rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer border border-twitch shadow-lg flex items-center gap-2 text-xs font-black uppercase px-4 shadow-twitch/20"
              title="Cerrar pantalla completa"
            >
              <X className="w-4 h-4" />
              <span>{lang === 'es' ? 'Cerrar' : 'Close'}</span>
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
      {/* Header bar of editor */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-twitch/20 rounded-2xl border border-twitch/30">
            <Sparkles className="w-6 h-6 text-twitch" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              {lang === 'es' ? 'Previsualización del Canal' : 'Channel Watermark Preview'}
              <span className="text-[10px] bg-twitch/20 text-twitch px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border border-twitch/30">
                Live Editor
              </span>
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {lang === 'es' 
                ? 'Personaliza y ajusta la marca de agua antes de descargar tus clips'
                : 'Customize and fine-tune your channel overlay before downloading'}
            </p>
          </div>
        </div>

        {/* Position coordinates indicator & Drag hint OUTSIDE video player */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 bg-twitch/10 border border-twitch/30 rounded-xl text-xs font-bold text-twitch">
            <Move className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Arrastra sobre el vídeo para mover' : 'Drag on video to move'}</span>
          </div>

          <div className="px-3.5 py-2 bg-dark-950/80 border border-white/10 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-gray-300">
            <Move className="w-3.5 h-3.5 text-twitch" />
            <span>X: <strong className="text-twitch">{config.customX}%</strong></span>
            <span className="text-white/20">|</span>
            <span>Y: <strong className="text-twitch">{config.customY}%</strong></span>
          </div>

          <button
            onClick={handleTestEntry}
            className="px-3 py-1.5 bg-twitch/20 hover:bg-twitch/30 border border-twitch/40 rounded-xl text-xs font-bold text-twitch flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Entrada
          </button>

          <button
            onClick={handleTestExit}
            className="px-3 py-1.5 bg-twitch/20 hover:bg-twitch/30 border border-twitch/40 rounded-xl text-xs font-bold text-twitch flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Salida
          </button>

          {/* FULLSCREEN TOGGLE BUTTON */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-2.5 rounded-xl border text-xs font-bold transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer bg-twitch/10 border-twitch/30 text-twitch hover:bg-twitch hover:text-white shadow-sm"
            title="Ver en Pantalla Completa"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">
              {lang === 'es' ? 'Ampliar Pantalla' : 'Fullscreen'}
            </span>
          </button>
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
