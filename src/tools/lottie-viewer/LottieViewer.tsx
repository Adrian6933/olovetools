import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { PRESETS } from './utils/presetAnimations';
import { 
  extractUniqueColors, replaceLottieColors, countLayers 
} from './utils/colorHelper';
import { 
  Play, Pause, Square, RotateCcw, Upload, Download, Copy, Check, 
  Settings, Info, Palette, Sparkles, RefreshCw, Eye
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface LottieViewerProps {
  lang: string;
  dictionary: any;
}

export const LottieViewer: React.FC<LottieViewerProps> = ({ lang, dictionary }) => {
  const t = dictionary;

  // Lottie module loaded dynamically to avoid Astro SSR issues
  const [lottie, setLottie] = useState<any>(null);

  // Modal State
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // Animation Data States
  const [originalJson, setOriginalJson] = useState<any>(PRESETS.spinner);
  const [editedJson, setEditedJson] = useState<any>(PRESETS.spinner);
  const [fileName, setFileName] = useState<string>("Bouncing Bars (Preset)");

  // Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [loop, setLoop] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [bgColorMode, setBgColorMode] = useState<'checkered' | 'white' | 'dark' | 'custom'>('checkered');
  const [customBgColor, setCustomBgColor] = useState<string>("#1e1e24");
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [framerate, setFramerate] = useState<number>(30);

  // Editing colors states
  const [uniqueColors, setUniqueColors] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});

  // Error state
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Clipboard & general feedback states
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const animInstanceRef = useRef<any>(null);

  // Dynamic import of lottie-web
  useEffect(() => {
    import('lottie-web').then((module) => {
      setLottie(module.default || module);
    });
  }, []);

  // Sync colors list when original Lottie JSON changes
  useEffect(() => {
    if (originalJson) {
      const colors = extractUniqueColors(originalJson);
      setUniqueColors(colors);
      
      // Reset color map
      const initialMap: Record<string, string> = {};
      colors.forEach(c => {
        initialMap[c] = c;
      });
      setColorMap(initialMap);
      setEditedJson(originalJson);
    }
  }, [originalJson]);

  // Load and play the animation in the container
  useEffect(() => {
    if (!lottie || !containerRef.current || !editedJson) return;

    // Destroy existing instance
    if (animInstanceRef.current) {
      animInstanceRef.current.destroy();
      animInstanceRef.current = null;
    }

    // Keep track of the current frame to preserve position if color is edited
    const savedFrame = currentFrame;

    try {
      const instance = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: loop,
        autoplay: isPlaying,
        animationData: JSON.parse(JSON.stringify(editedJson)) // Deep clone to prevent direct mutations
      });

      animInstanceRef.current = instance;

      // Setup initial player properties
      instance.setSpeed(speed);

      // Metadata calculations
      const totalF = instance.totalFrames || editedJson.op || 100;
      setTotalFrames(Math.round(totalF));
      setFramerate(instance.frameRate || editedJson.fr || 30);

      // Restore playhead position if applicable
      if (savedFrame > 0 && savedFrame < totalF) {
        if (isPlaying) {
          instance.goToAndPlay(savedFrame, true);
        } else {
          instance.goToAndStop(savedFrame, true);
        }
      }

      // Enter frame callback to sync scrubber slider
      instance.addEventListener('enterFrame', (e: any) => {
        setCurrentFrame(Math.round(e.currentTime));
      });

      // Cleanup on unmount or update
      return () => {
        if (instance) {
          instance.destroy();
        }
      };

    } catch (err: any) {
      console.error("Lottie load error:", err);
      setErrorMsg(t.error_no_lottie || "Failed to load animation");
    }
  }, [lottie, editedJson, loop]);

  // Sync playback speed
  useEffect(() => {
    if (animInstanceRef.current) {
      animInstanceRef.current.setSpeed(speed);
    }
  }, [speed]);

  // Toggle play/pause
  const handlePlayPause = () => {
    if (!animInstanceRef.current) return;
    if (isPlaying) {
      animInstanceRef.current.pause();
      setIsPlaying(false);
    } else {
      animInstanceRef.current.play();
      setIsPlaying(true);
    }
  };

  // Stop animation
  const handleStop = () => {
    if (!animInstanceRef.current) return;
    animInstanceRef.current.stop();
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  // Scrubber frame navigation
  const handleScrubberChange = (val: number) => {
    if (!animInstanceRef.current) return;
    animInstanceRef.current.goToAndStop(val, true);
    setCurrentFrame(val);
    setIsPlaying(false);
  };

  // Edit individual color in palette
  const handleColorChange = (originalHex: string, newHex: string) => {
    const nextMap = { ...colorMap, [originalHex]: newHex };
    setColorMap(nextMap);
    
    // Generate new edited Lottie JSON
    const updated = replaceLottieColors(originalJson, nextMap);
    setEditedJson(updated);
  };

  // Restore color map to defaults
  const handleResetColors = () => {
    const resetMap: Record<string, string> = {};
    uniqueColors.forEach(c => {
      resetMap[c] = c;
    });
    setColorMap(resetMap);
    setEditedJson(originalJson);
  };

  // File Uploader Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Simple validation check for Lottie assets
        if (json.v === undefined || json.layers === undefined) {
          setErrorMsg(t.error_no_lottie || "Invalid Lottie animation structure");
          return;
        }

        setCurrentFrame(0);
        setOriginalJson(json);
      } catch (err) {
        setErrorMsg(t.error_invalid_json || "Failed to load: Invalid JSON");
      }
    };
    reader.readAsText(file);
  };

  // Download Modified JSON File
  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editedJson, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    
    const baseName = fileName.replace(".json", "");
    dlAnchorElem.setAttribute("download", `${baseName}_edited.json`);
    dlAnchorElem.click();
  };

  // Copy raw JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(editedJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Load preset animations
  const loadPreset = (key: 'spinner' | 'square' | 'circle', name: string) => {
    setErrorMsg("");
    setCurrentFrame(0);
    setFileName(`${name} (Preset)`);
    setOriginalJson(PRESETS[key]);
  };

  // Total duration in seconds
  const duration = totalFrames > 0 ? (totalFrames / framerate).toFixed(2) : "0.00";

  // Backdrop style
  const getBackdropStyle = () => {
    if (bgColorMode === 'white') return { backgroundColor: '#ffffff' };
    if (bgColorMode === 'dark') return { backgroundColor: '#111827' };
    if (bgColorMode === 'custom') return { backgroundColor: customBgColor };
    
    // Checkered background pattern style
    return {
      backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), 
                        linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%), 
                        linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)`,
      backgroundSize: '20px 20px',
      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      backgroundColor: '#0a0a0f'
    };
  };

  const getPresetLabel = (key: string): string => {
    if (key === 'spinner') return t.preset_spinner || "Loading Spinner";
    if (key === 'square') return t.preset_square || "Rotating Square";
    return t.preset_checkbox || "Pulsing Circle";
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      <Header 
        currentLang={lang} 
        onLanguageChange={(l) => { window.location.href = `/${l.toLowerCase()}/lottie-viewer`; }} 
        onReset={() => loadPreset('spinner', 'Bouncing Bars')} 
        t={t} 
      />

      <main className="flex-grow pt-28 max-w-7xl w-full mx-auto px-4 md:px-8 pb-16 flex flex-col gap-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-lottie-viewer-top" />
        
        {/* Hero Area */}
        <div className="flex flex-col items-center text-center mt-6 mb-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-400 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% Client-Side & Secure</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
            {t.seoHeroTitle}
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
            {t.description}
          </p>
        </div>

        {/* main workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main workspace (Col 1-3) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Player Deck */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>

              {/* Top status bar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-3 truncate">
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-indigo-400 truncate max-w-[250px]">
                    {fileName}
                  </div>
                  {isPlaying ? (
                    <span className="inline-flex items-center space-x-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
                      <span>{t.status_playing}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      <span>{t.status_paused}</span>
                    </span>
                  )}
                </div>

                {/* Background Selector */}
                <div className="flex items-center bg-black/40 border border-white/5 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setBgColorMode('checkered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bgColorMode === 'checkered' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Checkered
                  </button>
                  <button
                    onClick={() => setBgColorMode('white')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bgColorMode === 'white' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    White
                  </button>
                  <button
                    onClick={() => setBgColorMode('dark')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      bgColorMode === 'dark' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dark
                  </button>
                  <div className="relative flex items-center pr-2">
                    <button
                      onClick={() => setBgColorMode('custom')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        bgColorMode === 'custom' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Custom
                    </button>
                    {bgColorMode === 'custom' && (
                      <input 
                        type="color" 
                        value={customBgColor}
                        onChange={(e) => setCustomBgColor(e.target.value)}
                        className="w-5 h-5 border-none cursor-pointer rounded bg-transparent p-0 ml-1.5"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Canvas viewport container */}
              <div 
                className="w-full h-80 md:h-[400px] rounded-2xl flex items-center justify-center relative transition-all border border-white/10 overflow-hidden"
                style={getBackdropStyle()}
              >
                {/* Lottie load errors */}
                {errorMsg && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
                    <Info className="w-12 h-12 text-red-400 mb-3" />
                    <p className="text-red-400 font-semibold">{errorMsg}</p>
                    <button 
                      onClick={() => loadPreset('spinner', 'Bouncing Bars')}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Reload Preset Animation
                    </button>
                  </div>
                )}

                {/* Render container for svg */}
                <div 
                  ref={containerRef} 
                  className="w-full h-full max-w-[90%] max-h-[90%] flex items-center justify-center"
                />
              </div>

              {/* Timeline controls */}
              <div className="flex flex-col gap-4">
                
                {/* Range Scrubber */}
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-slate-500 w-8 text-left">{currentFrame}</span>
                  <input
                    type="range"
                    min={0}
                    max={totalFrames - 1}
                    value={currentFrame}
                    onChange={(e) => handleScrubberChange(Number(e.target.value))}
                    className="flex-grow h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                  />
                  <span className="font-mono text-xs text-slate-500 w-8 text-right">{totalFrames}</span>
                </div>

                {/* Playback Button Actions & speed */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePlayPause}
                      className="p-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white rounded-xl cursor-pointer"
                      title={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
                    </button>
                    <button
                      onClick={handleStop}
                      className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white rounded-xl cursor-pointer"
                      title="Stop"
                    >
                      <Square className="w-5 h-5 fill-slate-300" />
                    </button>
                    <button
                      onClick={() => handleScrubberChange(0)}
                      className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white rounded-xl cursor-pointer"
                      title="Rewind"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Playback speed options */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.label_speed}</span>
                    <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
                      {[0.5, 1, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            speed === s ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Loop Option */}
                  <button
                    onClick={() => setLoop(!loop)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                      loop 
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.label_loop}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Layer Colors Panel */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-cyan-500"></div>

              <div className="flex justify-between items-center">
                <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span>{t.label_layers_colors}</span>
                </label>
                {uniqueColors.length > 0 && (
                  <button 
                    onClick={handleResetColors}
                    className="text-xs text-slate-400 hover:text-cyan-400 transition-colors border border-white/10 bg-white/5 px-3 py-1.5 rounded-lg cursor-pointer font-semibold"
                  >
                    Reset Colors
                  </button>
                )}
              </div>

              {uniqueColors.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {uniqueColors.map((hex, idx) => {
                    const currentMapHex = colorMap[hex] || hex;
                    return (
                      <div 
                        key={idx}
                        className="flex flex-col items-center bg-black/40 border border-white/5 p-3 rounded-xl gap-2 hover:border-cyan-500/30 transition-all group"
                      >
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                          <input 
                            type="color" 
                            value={currentMapHex} 
                            onChange={(e) => handleColorChange(hex, e.target.value)}
                            className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] border-none p-0 cursor-pointer"
                          />
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 select-all uppercase">
                          {currentMapHex}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 italic text-sm">
                  No adjustable layer colors detected in this animation structure.
                </div>
              )}
            </div>

            {/* File Exporter Deck */}
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>{t.label_export}</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold rounded-2xl cursor-pointer flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20"
                >
                  <Download className="w-5 h-5" />
                  <span>{t.btn_download}</span>
                </button>
                <button
                  onClick={handleCopyJson}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/10 text-white font-bold rounded-2xl cursor-pointer flex items-center justify-center space-x-2"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">{t.copied || 'Copied!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>{t.btn_copy_json}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Section (Col 4) */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Presets animations Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Preset Demos</span>
              </label>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => loadPreset('spinner', 'Bouncing Bars')}
                  className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all rounded-xl text-sm font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer flex flex-col gap-1 outline-none"
                >
                  <span>{getPresetLabel('spinner')}</span>
                  <span className="text-[10px] text-slate-500">Bouncing multi-colored loader</span>
                </button>
                <button
                  onClick={() => loadPreset('square', 'Rotating Square')}
                  className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all rounded-xl text-sm font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer flex flex-col gap-1 outline-none"
                >
                  <span>{getPresetLabel('square')}</span>
                  <span className="text-[10px] text-slate-500">Simple 60-frame vector rotation</span>
                </button>
                <button
                  onClick={() => loadPreset('circle', 'Pulsing Circle')}
                  className="w-full text-left px-4 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all rounded-xl text-sm font-semibold text-slate-200 hover:text-indigo-400 cursor-pointer flex flex-col gap-1 outline-none"
                >
                  <span>{getPresetLabel('circle')}</span>
                  <span className="text-[10px] text-slate-500">Elastic vector scale loop</span>
                </button>
              </div>
            </div>

            {/* Upload Area Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>{t.label_lottie_file}</span>
              </label>

              <div className="relative border-2 border-dashed border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all bg-black/20 group">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-indigo-400 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-slate-300 leading-tight">
                  {t.drop_inactive}
                </span>
                <span className="text-[9px] text-slate-500 mt-2 font-mono uppercase">
                  JSON (Lottie Animation)
                </span>
              </div>
            </div>

            {/* Animation Inspector Card */}
            <div className="glass-card rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <label className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>{t.label_metadata}</span>
              </label>

              <div className="flex flex-col gap-2.5 text-xs font-medium text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-500">{t.meta_version}</span>
                  <span className="font-mono text-slate-200">{originalJson.v || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-500">{t.meta_dimensions}</span>
                  <span className="font-mono text-slate-200">
                    {originalJson.w || 0} x {originalJson.h || 0} px
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-500">{t.meta_framerate}</span>
                  <span className="font-mono text-slate-200">{framerate} fps</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-500">{t.meta_duration}</span>
                  <span className="font-mono text-slate-200">{duration} s</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-slate-500">{t.meta_total_frames}</span>
                  <span className="font-mono text-slate-200">{totalFrames}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">{t.meta_layers}</span>
                  <span className="font-mono text-slate-200">
                    {countLayers(originalJson)}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-lottie-viewer-bottom" />
      </main>

      <Footer 
        lang={lang} 
        t={t} 
        onOpenModal={(modal) => setActiveModal(modal)} 
      />

      {/* Legal Modals */}
      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy' 
            ? (legalTranslations[lang]?.privacy.title || 'Privacy Policy')
            : activeModal === 'terms'
            ? (legalTranslations[lang]?.terms.title || 'Terms of Service')
            : (legalTranslations[lang]?.cookies.title || 'Cookie Policy')
        }
        content={
          activeModal === 'privacy' 
            ? (legalTranslations[lang]?.privacy.content || '')
            : activeModal === 'terms'
            ? (legalTranslations[lang]?.terms.content || '')
            : (legalTranslations[lang]?.cookies.content || '')
        }
        t={t}
      />
    </div>
  );
};

export default LottieViewer;
