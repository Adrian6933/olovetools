import React, { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import {
  Film,
  Upload,
  Play,
  Pause,
  Rewind,
  FastForward,
  ChevronLeft,
  ChevronRight,
  Camera,
  Download,
  Trash2,
  Package,
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';

interface FramesnapProps {
  lang: string;
  dictionary: any;
}

interface CapturedFrame {
  id: string;
  url: string;
  blob: Blob;
  time: number;
  frame: number;
  ext: string;
}

const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];

const formatTimecode = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 1000);
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export default function Framesnap({ lang, dictionary }: FramesnapProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fps, setFps] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [jpgQuality, setJpgQuality] = useState(92);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [expanded, setExpanded] = useState<CapturedFrame | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoSize, setVideoSize] = useState<{ w: number; h: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const holdTimeout = useRef<number | null>(null);
  const holdInterval = useRef<number | null>(null);

  const fileBase = (fileName.replace(/\.[^.]+$/, '') || 'framesnap').replace(/[^a-z0-9-_]+/gi, '_');
  const extOf = (mime: string) => (mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png');

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) return;
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
    e.target.value = '';
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) loadFile(e.dataTransfer.files[0]);
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.max(0, Math.min(duration || 0, time));
    v.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const stepFrame = useCallback(
    (dir: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      setIsPlaying(false);
      const delta = 1 / (fps || 30);
      seekTo(v.currentTime + dir * delta);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fps, duration]
  );

  const setRate = (r: number) => {
    setPlaybackRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
  };

  // Press-and-hold to step frames rapidly
  const stopHold = useCallback(() => {
    if (holdTimeout.current) { clearTimeout(holdTimeout.current); holdTimeout.current = null; }
    if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null; }
  }, []);
  const startHold = (dir: number) => {
    stepFrame(dir);
    holdTimeout.current = window.setTimeout(() => {
      holdInterval.current = window.setInterval(() => stepFrame(dir), 70);
    }, 350);
  };
  useEffect(() => () => stopHold(), [stopHold]);

  // Fullscreen
  const toggleFullscreen = () => {
    const el = playerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Copy current frame to clipboard
  const copyFrame = useCallback(() => {
    const v = videoRef.current;
    const canvas = canvasRef.current;
    if (!v || !canvas || !v.videoWidth) return;
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* clipboard image write not supported */ }
    }, 'image/png');
  }, []);

  const captureFrame = useCallback(() => {
    const v = videoRef.current;
    const canvas = canvasRef.current;
    if (!v || !canvas || !v.videoWidth) return;
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const quality = format === 'image/png' ? undefined : jpgQuality / 100;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setFrames((prev) => [
          {
            id: Math.random().toString(36).substring(2, 11),
            url,
            blob,
            time: v.currentTime,
            frame: Math.round(v.currentTime * (fps || 30)),
            ext: extOf(format),
          },
          ...prev,
        ]);
      },
      format,
      quality
    );
  }, [format, jpgQuality, fps]);

  const downloadFrame = (f: CapturedFrame) => {
    const a = document.createElement('a');
    a.href = f.url;
    a.download = `${fileBase}_frame_${f.frame}.${f.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const removeFrame = (id: string) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  };

  const downloadAll = async () => {
    if (frames.length === 0 || isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      // Oldest first for nicer ordering inside the zip
      [...frames].reverse().forEach((f, i) => {
        zip.file(`${String(i + 1).padStart(3, '0')}_${fileBase}_frame_${f.frame}.${f.ext}`, f.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `${fileBase}_frames.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } finally {
      setIsZipping(false);
    }
  };

  const resetWorkspace = useCallback(() => {
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFrames((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.url));
      return [];
    });
    setFileName('');
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setPlaybackRate(1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!videoUrl) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); stepFrame(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); stepFrame(-1); }
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key.toLowerCase() === 's') { e.preventDefault(); captureFrame(); }
      else if (e.key.toLowerCase() === 'c') { e.preventDefault(); copyFrame(); }
      else if (e.key.toLowerCase() === 'f') { e.preventDefault(); toggleFullscreen(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [videoUrl, stepFrame, togglePlay, captureFrame, copyFrame]);

  const currentFrame = Math.round(currentTime * (fps || 30));
  const totalFrames = Math.round((duration || 0) * (fps || 30));

  const L = {
    drop: t.ui_drop || 'Drag & drop a video or click to upload',
    formats: t.ui_formats || 'MP4 · WebM · MOV · MKV — never leaves your device',
    select: t.ui_select || 'Select video',
    capture: t.ui_capture || 'Capture frame',
    copy: t.ui_copy || 'Copy',
    copied: t.ui_copied || 'Copied!',
    speed: t.ui_speed || 'Speed',
    fps: t.ui_fps || 'FPS',
    quality: t.ui_quality || 'Quality',
    frame: t.ui_frame || 'Frame',
    captured: t.ui_captured || 'Captured frames',
    downloadAll: t.ui_downloadAll || 'Download all (ZIP)',
    download: t.ui_download || 'Download',
    clear: t.ui_clear || 'Clear video',
    empty: t.ui_empty || 'Step to the exact moment and press “Capture frame”. Your captures appear here.',
    hint: t.ui_hint || '← / → step one frame · hold to go fast · Space play/pause · S capture · F fullscreen',
    fullscreen: t.ui_fullscreen || 'Fullscreen',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0502] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-orange-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/framesnap`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col space-y-8">
        {/* Hero */}
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Film className="w-8 h-8 text-orange-400" />
            <span>{t.seoHeroTitle || 'FrameSnap'}</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText || 'Step through any video frame by frame and export the exact frame as an image.'}
          </p>
        </div>

        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-framesnap-top" />

        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInput} className="hidden" />

        {!videoUrl ? (
          /* Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            className={`group relative rounded-3xl border-2 border-dashed cursor-pointer px-8 py-24 flex flex-col items-center justify-center text-center transition-all duration-300 ${
              isDragging ? 'border-orange-400 bg-orange-500/10 scale-[1.01]' : 'border-white/10 bg-white/[0.015] hover:border-orange-500/40 hover:bg-white/[0.03]'
            }`}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-all ${isDragging ? 'bg-orange-500/20 text-orange-300 scale-110' : 'bg-white/5 text-orange-400'}`}>
              <Upload className="w-9 h-9" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-black text-white tracking-tight mb-2">{L.drop}</p>
            <p className="text-slate-500 text-sm font-medium mb-6">{L.formats}</p>
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-orange-600/30">
              <Film className="w-4 h-4" /> {L.select}
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player */}
            <div ref={playerRef} className={`glass-card rounded-3xl p-4 md:p-5 space-y-4 ${isFullscreen ? 'fixed inset-0 z-[400] rounded-none overflow-auto flex flex-col justify-center bg-[#0a0502]' : ''}`}>
              <div className="relative rounded-2xl overflow-hidden bg-black ring-1 ring-white/5 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className={`w-full object-contain bg-black ${isFullscreen ? 'max-h-[78vh]' : 'max-h-[60vh]'}`}
                  onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setVideoSize({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight }); }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  playsInline
                />
                {videoSize && (
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-white/70 bg-black/50 px-2 py-1 rounded">
                    {videoSize.w}×{videoSize.h}
                  </div>
                )}
                <button onClick={toggleFullscreen} title={L.fullscreen} aria-label={L.fullscreen} className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all cursor-pointer">
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Timecode + scrub */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="text-orange-300 font-bold">{formatTimecode(currentTime)}</span>
                  <span>
                    {L.frame} <span className="text-white font-bold">{currentFrame}</span>
                    {totalFrames > 0 && <span className="opacity-50"> / {totalFrames}</span>}
                  </span>
                  <span>{formatTimecode(duration)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={1 / (fps || 30)}
                  value={currentTime}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full bg-white/10 outline-none accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Transport controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
                <button onClick={() => seekTo(currentTime - 1)} title="-1s" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer">
                  <Rewind className="w-5 h-5" />
                </button>
                <button
                  onPointerDown={(e) => { e.preventDefault(); startHold(-1); }}
                  onPointerUp={stopHold}
                  onPointerLeave={stopHold}
                  onPointerCancel={stopHold}
                  title="Previous frame (← · hold to rewind fast)"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all active:scale-90 cursor-pointer select-none touch-none"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={togglePlay} title="Play / Pause (Space)" className="p-4 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white transition-all active:scale-90 shadow-lg shadow-orange-600/30 cursor-pointer">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button
                  onPointerDown={(e) => { e.preventDefault(); startHold(1); }}
                  onPointerUp={stopHold}
                  onPointerLeave={stopHold}
                  onPointerCancel={stopHold}
                  title="Next frame (→ · hold to advance fast)"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white transition-all active:scale-90 cursor-pointer select-none touch-none"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => seekTo(currentTime + 1)} title="+1s" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-90 cursor-pointer">
                  <FastForward className="w-5 h-5" />
                </button>
              </div>

              {/* Speed + FPS + capture */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 border-t border-white/5 pt-4">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">{L.speed}</span>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setRate(s)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        playbackRate === s ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{L.fps}</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={fps}
                    onChange={(e) => setFps(Math.max(1, Math.min(120, Number(e.target.value) || 30)))}
                    className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm outline-none focus:border-orange-500/40"
                  />
                </label>

                <div className="flex-1" />

                <button
                  onClick={copyFrame}
                  title="Copy frame to clipboard (C)"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-sm transition-all active:scale-95 cursor-pointer"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />} {copied ? L.copied : L.copy}
                </button>
                <button
                  onClick={captureFrame}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-black hover:bg-orange-500 hover:text-white font-black text-sm transition-all active:scale-95 cursor-pointer shadow-lg"
                >
                  <Camera className="w-5 h-5" /> {L.capture}
                </button>
              </div>

              {/* Export format */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  {(['image/png', 'image/jpeg', 'image/webp'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                        format === f ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {extOf(f)}
                    </button>
                  ))}
                </div>
                {format !== 'image/png' && (
                  <label className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{L.quality} {jpgQuality}%</span>
                    <input type="range" min={50} max={100} value={jpgQuality} onChange={(e) => setJpgQuality(Number(e.target.value))} className="w-28 h-1.5 rounded bg-white/10 accent-orange-500 cursor-pointer" />
                  </label>
                )}
                <div className="flex-1" />
                <button onClick={resetWorkspace} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 font-bold transition-all cursor-pointer">
                  <Trash2 className="w-4 h-4" /> {L.clear}
                </button>
              </div>

              <p className="text-center text-[11px] text-slate-600 font-medium">{L.hint}</p>
            </div>

            {/* Captured frames */}
            <div className="glass-card rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange-400" />
                  {L.captured} <span className="text-orange-400">({frames.length})</span>
                </h2>
                {frames.length > 1 && (
                  <button
                    onClick={downloadAll}
                    disabled={isZipping}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                  >
                    {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />} {L.downloadAll}
                  </button>
                )}
              </div>

              {frames.length === 0 ? (
                <p className="text-slate-600 text-sm py-6 text-center">{L.empty}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {frames.map((f) => (
                    <div key={f.id} className="group relative rounded-xl overflow-hidden bg-black/40 ring-1 ring-white/5">
                      <img src={f.url} alt={`Frame ${f.frame}`} loading="lazy" className="w-full aspect-video object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-orange-300">{formatTimecode(f.time)}</span>
                        <span className="text-[10px] font-mono text-slate-300">#{f.frame}</span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setExpanded(f)} aria-label="Expand" className="p-1.5 bg-white/10 hover:bg-white hover:text-black text-white rounded-lg backdrop-blur-xl transition-all cursor-pointer">
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => downloadFrame(f)} aria-label="Download" className="p-1.5 bg-orange-500/80 hover:bg-orange-500 text-white rounded-lg backdrop-blur-xl transition-all cursor-pointer">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeFrame(f.id)} aria-label="Remove" className="p-1.5 bg-red-500/30 hover:bg-red-500 text-white rounded-lg backdrop-blur-xl transition-all cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-framesnap-bottom" />
      </main>

      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Lightbox */}
      {expanded && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl" onClick={() => setExpanded(null)}>
          <div className="relative max-w-full max-h-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img src={expanded.url} alt={`Frame ${expanded.frame}`} className="max-w-full max-h-[80vh] object-contain rounded-2xl ring-1 ring-white/10" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-slate-300">{formatTimecode(expanded.time)} · #{expanded.frame}</span>
              <button onClick={() => downloadFrame(expanded)} className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-orange-500 hover:text-white font-black rounded-2xl transition-all active:scale-95 cursor-pointer">
                <Download className="w-5 h-5" /> {L.download}
              </button>
            </div>
            <button onClick={() => setExpanded(null)} aria-label="Close" className="absolute -top-2 right-0 md:top-2 md:-right-12 p-3 text-white/70 hover:text-white cursor-pointer">
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />
      <LegalModal isOpen={legalModal === 'privacy'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'} content={legalTranslations[lang]?.privacy.content} t={t} />
      <LegalModal isOpen={legalModal === 'terms'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.terms.title || 'Terms of Service'} content={legalTranslations[lang]?.terms.content} t={t} />
      <LegalModal isOpen={legalModal === 'cookies'} onClose={() => setLegalModal(null)} title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'} content={legalTranslations[lang]?.cookies.content} t={t} />
    </div>
  );
}
