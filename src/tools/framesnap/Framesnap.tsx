import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Download,
  Film,
  Gauge,
  Layers,
  Loader2,
  Maximize2,
  Package,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { NextStepBar } from './components/NextStepBar';
import { Viewer } from './components/Viewer';
import {
  FrameHeroArt,
  IconBatch,
  IconExact,
  IconHandoff,
  IconLocal,
  IconMeasure,
  IconMemory,
  IconScene,
  IconZoom,
  STEP_ART,
} from './components/Illustrations';

import type {
  BatchOptions,
  BatchProgress,
  CaptureOptions,
  CapturedFrame,
  SceneOptions,
  SceneScan,
  VideoInfo,
} from './types';
import { DEFAULT_BATCH, DEFAULT_CAPTURE, DEFAULT_SCENES } from './types';
import { formatTimecode, frameIndexAt, hasRvfc, measureFps, seekExact, stepFrames } from './lib/video';
import { frameFilename, grabFrame, releaseFrames, totalBytes } from './lib/capture';
import { batchTimes, runBatch, scanScenes } from './lib/batch';
import { ACCEPT_ATTRIBUTE, baseNameOf, classifyVideo, copyImage, downloadBlob, formatBytes } from './lib/io';

interface FramesnapProps {
  lang: string;
  dictionary: any;
}

type LegalKey = 'privacy' | 'terms' | 'cookies';
type Panel = 'single' | 'batch' | 'scenes';

const SPEEDS = [0.25, 0.5, 1, 2, 4];
/** Past this the tab is holding more image data than most machines enjoy. */
const MEMORY_WARN = 300 * 1024 * 1024;

export default function Framesnap({ lang, dictionary }: FramesnapProps) {
  const t = dictionary || {};

  // ---------------------------------------------------------------- state --
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [info, setInfo] = useState<VideoInfo>({ width: 0, height: 0, duration: 0, fps: null, fpsSource: 'unknown', exact: false });
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const [capture, setCapture] = useState<CaptureOptions>(DEFAULT_CAPTURE);
  const [panel, setPanel] = useState<Panel>('single');
  const [batch, setBatch] = useState<BatchOptions>(DEFAULT_BATCH);
  const [progress, setProgress] = useState<BatchProgress>({ done: 0, total: 0, at: 0, running: false });
  const [scenes, setScenes] = useState<SceneOptions>(DEFAULT_SCENES);
  const [scan, setScan] = useState<SceneScan | null>(null);
  const [scanning, setScanning] = useState(false);

  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [expanded, setExpanded] = useState<CapturedFrame | null>(null);
  const [comparing, setComparing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalKey | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stopFlag = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const framesRef = useRef<CapturedFrame[]>([]);
  framesRef.current = frames;

  const base = baseNameOf(fileName);
  const bytes = useMemo(() => totalBytes(frames), [frames]);
  const lastFrame = frames[0] ?? null;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const listen = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    query.addEventListener('change', listen);
    return () => query.removeEventListener('change', listen);
  }, []);

  // Object URLs and timers are released on unmount: the old version leaked
  // every capture and the video URL whenever the island went away.
  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      clearTimeout(toastTimer.current);
      releaseFrames(framesRef.current);
    },
    []
  );

  const flash = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // -------------------------------------------------------------- intake ---
  const loadFile = useCallback(
    (file: File) => {
      const verdict = classifyVideo(file);
      if (verdict === 'not-video') {
        // The old check was `file.type.startsWith('video/')` and a silent
        // return, so a .mkv with no MIME type did nothing at all.
        flash(t.errorNotVideo || 'That does not look like a video file.');
        return;
      }
      setVideoUrl(previous => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(file);
      });
      setFileName(file.name);
      setCurrentTime(0);
      setPlaying(false);
      setInfo({ width: 0, height: 0, duration: 0, fps: null, fpsSource: 'unknown', exact: false });
      setScan(null);
      if (verdict === 'maybe-unsupported') {
        flash((t.warnCodec || 'Trying {name} — the browser may not have this codec.').replace('{name}', file.name));
      }
    },
    [flash, t.errorNotVideo, t.warnCodec]
  );

  useHandoffIntake((file, from) => {
    loadFile(file);
    flash((t.handoffReceived || 'Received from {tool}.').replace('{tool}', from));
  });

  // ---------------------------------------------------------- video setup --
  const onLoadedMetadata = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const exact = hasRvfc(video);
    setInfo({
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration || 0,
      fps: null,
      fpsSource: 'unknown',
      exact,
    });
    if (!exact) return;
    // Measured, not typed into a box. It plays muted for a fraction of a
    // second and reads the presentation timestamps.
    const fps = await measureFps(video);
    if (fps) setInfo(current => ({ ...current, fps, fpsSource: 'measured' }));
  }, []);

  const step = useCallback(
    async (direction: number) => {
      const video = videoRef.current;
      if (!video || busy) return;
      video.pause();
      setPlaying(false);
      setBusy(true);
      const time = await stepFrames(video, info.fps ?? 30, direction);
      setCurrentTime(time);
      setBusy(false);
    },
    [busy, info.fps]
  );

  const seek = useCallback(async (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    const landed = await seekExact(video, time);
    setCurrentTime(landed);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, []);

  // -------------------------------------------------------------- capture --
  const addFrames = useCallback(
    (incoming: CapturedFrame[]) => {
      if (incoming.length === 0) return;
      setFrames(current => {
        const next = [...incoming.reverse(), ...current];
        const size = totalBytes(next);
        if (size > MEMORY_WARN) {
          flash(
            (t.warnMemory || 'The gallery is holding {size}. Download and clear it before it gets heavy.').replace(
              '{size}',
              formatBytes(size)
            )
          );
        }
        return next;
      });
    },
    [flash, t.warnMemory]
  );

  const captureNow = useCallback(async () => {
    const video = videoRef.current;
    if (!video || busy) return;
    setBusy(true);
    // Waiting matters: without it the canvas draws whatever frame the element
    // last painted, which after a step is the previous one.
    if (video.seeking) await seekExact(video, video.currentTime);
    const frame = await grabFrame(video, capture, info.fps, 'manual');
    setBusy(false);
    if (frame) addFrames([frame]);
  }, [busy, capture, info.fps, addFrames]);

  const copyCurrent = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    const frame = await grabFrame(video, { ...capture, format: 'image/png' }, info.fps, 'manual');
    if (!frame) return;
    const ok = await copyImage(frame.blob);
    URL.revokeObjectURL(frame.url);
    if (!ok) {
      flash(t.errorClipboard || 'This browser will not let the page write images to the clipboard.');
      return;
    }
    clearTimeout(copyTimer.current);
    setCopied(true);
    copyTimer.current = setTimeout(() => setCopied(false), 1600);
  }, [capture, info.fps, flash, t.errorClipboard]);

  // ---------------------------------------------------------------- batch --
  const plannedTimes = useMemo(
    () => (info.duration ? batchTimes(batch, info.duration, info.fps) : []),
    [batch, info.duration, info.fps]
  );

  const startBatch = useCallback(async () => {
    const video = videoRef.current;
    if (!video || plannedTimes.length === 0 || progress.running) return;
    stopFlag.current = false;
    const result = await runBatch(video, plannedTimes, capture, info.fps, setProgress, () => stopFlag.current);
    addFrames(result.frames);
    setCurrentTime(video.currentTime);
    if (result.cancelled) flash(t.toastBatchStopped || 'Stopped. The frames grabbed so far are in the gallery.');
  }, [plannedTimes, progress.running, capture, info.fps, addFrames, flash, t.toastBatchStopped]);

  const startScan = useCallback(async () => {
    const video = videoRef.current;
    if (!video || scanning) return;
    stopFlag.current = false;
    setScanning(true);
    setProgress({ done: 0, total: 0, at: 0, running: true });
    const result = await scanScenes(
      video,
      scenes,
      (done, total) => setProgress({ done, total, at: 0, running: true }),
      () => stopFlag.current
    );
    setScanning(false);
    setProgress({ done: 0, total: 0, at: 0, running: false });
    setScan(result);
    setCurrentTime(video.currentTime);
  }, [scanning, scenes]);

  const grabScenes = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !scan || scan.candidates.length === 0) return;
    stopFlag.current = false;
    const grabbed: CapturedFrame[] = [];
    setProgress({ done: 0, total: scan.candidates.length, at: 0, running: true });
    for (let i = 0; i < scan.candidates.length; i += 1) {
      if (stopFlag.current) break;
      const candidate = scan.candidates[i];
      setProgress({ done: i, total: scan.candidates.length, at: candidate.time, running: true });
      await seekExact(video, candidate.time);
      const frame = await grabFrame(video, capture, info.fps, 'scene', candidate.score);
      if (frame) grabbed.push(frame);
    }
    setProgress({ done: 0, total: 0, at: 0, running: false });
    addFrames(grabbed);
    setCurrentTime(video.currentTime);
  }, [scan, capture, info.fps, addFrames]);

  // --------------------------------------------------------------- output --
  const removeFrame = useCallback((id: string) => {
    setFrames(current => {
      const target = current.find(frame => frame.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter(frame => frame.id !== id);
    });
  }, []);

  const clearFrames = useCallback(() => {
    setFrames(current => {
      releaseFrames(current);
      return [];
    });
    setExpanded(null);
  }, []);

  const downloadAll = useCallback(async () => {
    if (frames.length === 0 || zipping) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      [...frames].reverse().forEach((frame, i) => {
        zip.file(`${String(i + 1).padStart(3, '0')}_${frameFilename(base, frame, info.fps)}`, frame.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, `${base}_frames.zip`);
    } finally {
      setZipping(false);
    }
  }, [frames, zipping, base, info.fps]);

  const resetWorkspace = useCallback(() => {
    setVideoUrl(previous => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    clearFrames();
    setFileName('');
    setCurrentTime(0);
    setPlaying(false);
    setRate(1);
    setScan(null);
    setInfo({ width: 0, height: 0, duration: 0, fps: null, fpsSource: 'unknown', exact: false });
  }, [clearFrames]);

  const getResultFile = useCallback(async () => {
    const frame = expanded ?? frames[0];
    if (!frame) return null;
    return { blob: frame.blob, name: frameFilename(base, frame, info.fps) };
  }, [expanded, frames, base, info.fps]);

  // ------------------------------------------------------------ shortcuts --
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!videoUrl) return;
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const key = event.key.toLowerCase();
      if (event.key === 'ArrowRight') { event.preventDefault(); void step(1); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); void step(-1); }
      else if (event.key === ' ') { event.preventDefault(); togglePlay(); }
      else if (key === 's') { event.preventDefault(); void captureNow(); }
      else if (key === 'c') { event.preventDefault(); void copyCurrent(); }
      else if (key === 'f') { event.preventDefault(); stageRef.current?.requestFullscreen?.(); }
      else if (event.key === 'Escape') { stopFlag.current = true; }
    };
    const down = (event: KeyboardEvent) => { if (event.key === 'Alt') setComparing(true); };
    const up = (event: KeyboardEvent) => { if (event.key === 'Alt') setComparing(false); };
    const blur = () => setComparing(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, [videoUrl, step, togglePlay, captureNow, copyCurrent]);

  // -------------------------------------------------------------- derived --
  const currentIndex = frameIndexAt(currentTime, info.fps);
  const totalFrames = info.fps ? Math.round(info.duration * info.fps) : 0;

  const steps = [
    { title: t.step1Title || 'Drop a video', text: t.step1Text || '' },
    { title: t.step2Title || 'Land on the frame', text: t.step2Text || '' },
    { title: t.step3Title || 'Or take a whole run', text: t.step3Text || '' },
    { title: t.step4Title || 'Export', text: t.step4Text || '' },
  ];
  const featureIcons = [IconExact, IconMeasure, IconBatch, IconScene, IconZoom, IconMemory, IconLocal, IconHandoff];
  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const iconButton =
    'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-300 outline-none transition-all hover:border-orange-500/30 hover:bg-orange-500/15 hover:text-orange-200 disabled:cursor-not-allowed disabled:opacity-30';
  const field =
    'w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs font-semibold text-slate-200 outline-none transition-colors focus:border-orange-500/50';
  const microLabel = 'text-[10px] font-black uppercase tracking-[0.14em] text-slate-500';

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0502] font-sans text-slate-200 selection:bg-orange-500/25 selection:text-orange-50">
      <Header currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/framesnap`)} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          The previous max-w-5xl left the gap short of the 168px a rail needs. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-28 min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] md:px-8 md:pt-36">
        <AdBanner id="adsense-framesnap-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="mb-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="min-w-0 space-y-5">
            <span className="inline-block rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
              {t.heroBadge || 'Frame extractor'}
            </span>
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">{t.seoHeroTitle}</h1>
            <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.heroText || t.seoHeroText}</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, i: number) => (
                <span key={i} className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[12px] font-bold text-slate-300">
                  <Check className="h-3.5 w-3.5 stroke-[3] text-orange-400" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <FrameHeroArt className="mx-auto h-auto w-full max-w-lg" animated={!reduceMotion} />
        </section>

        {/* ================================================================ */}
        {/* Workspace                                                        */}
        {/* ================================================================ */}
        <section className="glass-card overflow-hidden rounded-3xl border border-white/5">
          {!videoUrl ? (
            <div
              onDragOver={event => { event.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={event => {
                event.preventDefault();
                setDragOver(false);
                const file = event.dataTransfer.files?.[0];
                if (file) loadFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-4 px-6 py-20 text-center transition-colors ${
                dragOver ? 'bg-orange-500/10' : 'hover:bg-white/[0.02]'
              }`}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10 text-orange-300">
                <Upload className="h-7 w-7" />
              </span>
              <p className="text-lg font-bold text-white">{t.ui_drop || 'Drag & drop a video or click to upload'}</p>
              <p className="max-w-md text-sm text-slate-500">{t.ui_formats || ''}</p>
            </div>
          ) : (
            <>
              {/* --------------------------- stage --------------------- */}
              <div ref={stageRef} className="relative bg-black">
                <Viewer comparing={comparing} compareSrc={lastFrame?.url} className="aspect-video w-full">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="h-full w-full object-contain"
                    playsInline
                    preload="auto"
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={event => setCurrentTime((event.target as HTMLVideoElement).currentTime)}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onError={() => flash(t.errorDecode || 'The browser could not decode this video.')}
                  />
                </Viewer>

                {comparing && lastFrame && (
                  <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/75 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300">
                    {t.compareBadge || 'last capture'}
                  </span>
                )}
                {progress.running && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 px-4 py-2">
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-orange-200">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {progress.total > 0 ? `${progress.done} / ${progress.total}` : '…'}
                      <button
                        type="button"
                        onClick={() => { stopFlag.current = true; }}
                        className="ml-auto cursor-pointer rounded-md border border-white/15 px-2 py-0.5 text-[10px] outline-none hover:border-orange-400/50"
                      >
                        {t.actionStop || 'Stop'}
                      </button>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-orange-500" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* --------------------------- transport ----------------- */}
              <div className="space-y-3 border-t border-white/5 p-3 md:p-4">
                <input
                  type="range"
                  min={0}
                  max={info.duration || 0}
                  step={info.fps ? 1 / info.fps : 0.01}
                  value={currentTime}
                  onChange={event => void seek(Number(event.target.value))}
                  aria-label={t.ui_frame || 'Frame'}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-orange-500"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => void step(-1)} disabled={busy} className={iconButton} title={t.actionPrev || 'Previous frame'}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={togglePlay} className={iconButton} title={t.actionPlay || 'Play / pause'}>
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => void step(1)} disabled={busy} className={iconButton} title={t.actionNext || 'Next frame'}>
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <span className="ml-1 font-mono text-xs text-orange-200">{formatTimecode(currentTime, info.fps)}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {currentIndex >= 0 ? `#${currentIndex}${totalFrames ? ` / ${totalFrames}` : ''}` : ''}
                  </span>

                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <select
                      value={rate}
                      onChange={event => {
                        const value = Number(event.target.value);
                        setRate(value);
                        if (videoRef.current) videoRef.current.playbackRate = value;
                      }}
                      className="h-9 cursor-pointer rounded-lg border border-white/5 bg-white/5 px-2 text-[11px] font-bold text-slate-300 outline-none"
                      aria-label={t.ui_speed || 'Speed'}
                    >
                      {SPEEDS.map(speed => (
                        <option key={speed} value={speed}>{speed}×</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onPointerDown={() => setComparing(true)}
                      onPointerUp={() => setComparing(false)}
                      onPointerLeave={() => setComparing(false)}
                      disabled={!lastFrame}
                      className={`${iconButton} ${comparing ? 'border-orange-500/40 bg-orange-500/20 text-orange-200' : ''}`}
                      title={t.actionCompare || 'Hold to compare with the last capture (or hold Alt)'}
                    >
                      <Layers className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => void copyCurrent()} className={iconButton} title={t.ui_copy || 'Copy'}>
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <ClipboardCopy className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => stageRef.current?.requestFullscreen?.()} className={iconButton} title={t.ui_fullscreen || 'Fullscreen'}>
                      <Maximize2 className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={resetWorkspace} className={iconButton} title={t.ui_clear || 'Clear video'}>
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Source facts, measured rather than assumed */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="truncate font-bold text-slate-400">{fileName}</span>
                  {info.width > 0 && <span className="font-mono">{info.width}×{info.height}</span>}
                  <span className="flex items-center gap-1 font-mono">
                    <Gauge className="h-3 w-3" />
                    {info.fps ? `${info.fps} fps` : t.fpsUnknown || 'fps unknown'}
                    <span className={`rounded px-1 ${info.fpsSource === 'measured' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-500'}`}>
                      {info.fpsSource === 'measured' ? t.fpsMeasured || 'measured' : t.fpsGuess || 'not measured'}
                    </span>
                  </span>
                  {!info.exact && <span className="text-amber-400">{t.noRvfc || 'This browser has no per-frame callback: stepping falls back to seeking.'}</span>}
                </div>
              </div>

              {/* --------------------------- panels -------------------- */}
              <div className="border-t border-white/5">
                <div className="flex flex-wrap gap-1 px-3 pt-3 md:px-4">
                  {([['single', Camera, t.tabSingle || 'Single frame'], ['batch', IconBatchTab, t.tabBatch || 'Batch'], ['scenes', Scissors, t.tabScenes || 'Scene cuts']] as const).map(
                    ([key, Icon, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPanel(key as Panel)}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wider outline-none transition-all ${
                          panel === key ? 'bg-orange-500/15 text-orange-200' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                      </button>
                    )
                  )}
                </div>

                <div className="space-y-3 p-3 md:p-4">
                  {/* shared export settings */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="flex flex-col gap-1">
                      <span className={microLabel}>{t.labelFormat || 'Format'}</span>
                      <select className={`${field} cursor-pointer`} value={capture.format} onChange={e => setCapture(c => ({ ...c, format: e.target.value as CaptureOptions['format'] }))}>
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPG</option>
                        <option value="image/webp">WebP</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={microLabel}>{t.ui_quality || 'Quality'}</span>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={capture.quality}
                        disabled={capture.format === 'image/png'}
                        onChange={e => setCapture(c => ({ ...c, quality: Number(e.target.value) }))}
                        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-orange-500 disabled:opacity-30"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className={microLabel}>{t.labelScale || 'Scale'}</span>
                      <select className={`${field} cursor-pointer`} value={capture.scale} onChange={e => setCapture(c => ({ ...c, scale: Number(e.target.value) }))}>
                        <option value={1}>100%{info.width ? ` · ${info.width}×${info.height}` : ''}</option>
                        <option value={0.5}>50%</option>
                        <option value={0.25}>25%</option>
                      </select>
                    </label>
                    <div className="flex flex-col justify-end">
                      <span className={`${microLabel} mb-1`}>{t.labelHeld || 'In memory'}</span>
                      <span className={`font-mono text-xs font-bold ${bytes > MEMORY_WARN ? 'text-amber-400' : 'text-slate-400'}`}>
                        {frames.length} · {formatBytes(bytes)}
                      </span>
                    </div>
                  </div>

                  {panel === 'single' && (
                    <button
                      type="button"
                      onClick={() => void captureNow()}
                      disabled={busy}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/20 px-4 py-3 text-sm font-black text-orange-100 outline-none transition-all hover:bg-orange-500/30 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {t.ui_capture || 'Capture frame'}
                      <span className="hidden text-[10px] font-bold opacity-60 sm:inline">S</span>
                    </button>
                  )}

                  {panel === 'batch' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.labelMode || 'Pick by'}</span>
                          <select className={`${field} cursor-pointer`} value={batch.mode} onChange={e => setBatch(b => ({ ...b, mode: e.target.value as BatchOptions['mode'] }))}>
                            <option value="interval">{t.modeInterval || 'Every N seconds'}</option>
                            <option value="count">{t.modeCount || 'N evenly spaced'}</option>
                            <option value="every-frame">{t.modeEveryFrame || 'Every frame'}</option>
                          </select>
                        </label>
                        {batch.mode === 'interval' && (
                          <label className="flex flex-col gap-1">
                            <span className={microLabel}>{t.labelInterval || 'Seconds'}</span>
                            <input type="number" min={0.02} step={0.1} className={field} value={batch.interval} onChange={e => setBatch(b => ({ ...b, interval: Number(e.target.value) || 1 }))} />
                          </label>
                        )}
                        {batch.mode === 'count' && (
                          <label className="flex flex-col gap-1">
                            <span className={microLabel}>{t.labelCount || 'How many'}</span>
                            <input type="number" min={1} max={500} className={field} value={batch.count} onChange={e => setBatch(b => ({ ...b, count: Number(e.target.value) || 1 }))} />
                          </label>
                        )}
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.labelFrom || 'From (s)'}</span>
                          <input type="number" min={0} step={0.1} className={field} value={batch.from} onChange={e => setBatch(b => ({ ...b, from: Number(e.target.value) || 0 }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.labelTo || 'To (s, 0 = end)'}</span>
                          <input type="number" min={0} step={0.1} className={field} value={batch.to} onChange={e => setBatch(b => ({ ...b, to: Number(e.target.value) || 0 }))} />
                        </label>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          {(t.batchPlan || '{n} frames will be grabbed.').replace('{n}', String(plannedTimes.length))}
                        </span>
                        <button
                          type="button"
                          onClick={() => void startBatch()}
                          disabled={progress.running || plannedTimes.length === 0}
                          className="ml-auto flex cursor-pointer items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/20 px-4 py-2.5 text-sm font-black text-orange-100 outline-none transition-all hover:bg-orange-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {progress.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                          {t.actionRunBatch || 'Extract'}
                        </button>
                      </div>
                    </div>
                  )}

                  {panel === 'scenes' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.labelStep || 'Sample every (s)'}</span>
                          <input type="number" min={0.05} step={0.05} className={field} value={scenes.step} onChange={e => setScenes(s => ({ ...s, step: Number(e.target.value) || 0.5 }))} />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className={microLabel}>{t.labelThreshold || 'Cut above'}</span>
                          <input type="number" min={0.01} max={1} step={0.01} className={field} value={scenes.threshold} onChange={e => setScenes(s => ({ ...s, threshold: Number(e.target.value) || 0.18 }))} />
                        </label>
                        <div className="col-span-2 flex items-end gap-2">
                          <button
                            type="button"
                            onClick={() => void startScan()}
                            disabled={scanning || progress.running}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 outline-none transition-all hover:border-orange-500/30 hover:text-orange-200 disabled:opacity-40"
                          >
                            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                            {t.actionScan || 'Scan for cuts'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void grabScenes()}
                            disabled={!scan || scan.candidates.length === 0 || progress.running}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/20 px-3 py-2.5 text-xs font-black text-orange-100 outline-none transition-all hover:bg-orange-500/30 disabled:opacity-40"
                          >
                            <Camera className="h-4 w-4" />
                            {t.actionGrabScenes || 'Grab them'}
                          </button>
                        </div>
                      </div>

                      {scan && (
                        <div className="space-y-2 rounded-xl border border-white/5 bg-black/25 p-3">
                          <p className="text-[11px] text-slate-400">
                            {(t.scanResult || '{cuts} cuts out of {samples} samples, in {ms} ms.')
                              .replace('{cuts}', String(scan.candidates.length))
                              .replace('{samples}', String(scan.samples.length))
                              .replace('{ms}', String(scan.ms))}
                          </p>
                          {/* The difference graph, so the threshold is arguable */}
                          <div className="flex h-12 items-end gap-px overflow-hidden">
                            {scan.samples.slice(0, 240).map((sample, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => void seek(sample.time)}
                                title={`${sample.time.toFixed(2)}s · ${(sample.score * 100).toFixed(1)}%`}
                                className={`min-w-[2px] flex-1 cursor-pointer rounded-t-sm ${sample.score >= scenes.threshold ? 'bg-orange-400' : 'bg-white/15'}`}
                                style={{ height: `${Math.max(4, Math.min(100, sample.score * 320))}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* --------------------------- gallery ------------------- */}
              <div className="space-y-3 border-t border-white/5 p-3 md:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={microLabel}>{t.ui_captured || 'Captured frames'}</span>
                  <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">{frames.length}</span>
                  <div className="ml-auto flex gap-1.5">
                    <button type="button" onClick={() => void downloadAll()} disabled={frames.length === 0 || zipping} className={iconButton} title={t.ui_downloadAll || 'Download all (ZIP)'}>
                      {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={clearFrames} disabled={frames.length === 0} className={iconButton} title={t.actionClearFrames || 'Clear the gallery'}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {frames.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-600">
                    {t.ui_empty || 'Step to the exact moment and press Capture. Your frames appear here.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {frames.map(frame => (
                      <div key={frame.id} className="group relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        {/* The strip shows the thumbnail, never the full-size
                            blob: 24 native-resolution <img> is how a gallery
                            eats a gigabyte of decoded bitmaps. */}
                        <img src={frame.thumb} alt="" className="aspect-video w-full cursor-zoom-in object-cover" onClick={() => setExpanded(frame)} />
                        <div className="flex items-center gap-1 px-2 py-1.5">
                          <span className="truncate font-mono text-[10px] text-slate-400">
                            {formatTimecode(frame.time, info.fps)}
                            {frame.origin === 'scene' && frame.score !== undefined && (
                              <span className="ml-1 text-orange-400">{(frame.score * 100).toFixed(0)}%</span>
                            )}
                          </span>
                          <span className="ml-auto shrink-0 font-mono text-[9px] text-slate-600">{formatBytes(frame.bytes)}</span>
                        </div>
                        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => downloadBlob(frame.blob, frameFilename(base, frame, info.fps))}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-black/80 text-slate-200 outline-none hover:text-orange-300"
                            title={t.ui_download || 'Download'}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFrame(frame.id)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-black/80 text-slate-200 outline-none hover:text-rose-300"
                            title={t.actionRemove || 'Remove'}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-white/5 p-3 md:p-4">
                <NextStepBar lang={lang} t={t} getResult={getResultFile} disabled={frames.length === 0} />
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={event => {
              const file = event.target.files?.[0];
              if (file) loadFile(file);
              event.target.value = '';
            }}
          />
        </section>

        {videoUrl && (
          <p className="mt-3 text-center text-[11px] text-slate-600">{t.ui_hint || ''}</p>
        )}

        {toast && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}

        <div className="mt-10">
          <AdBanner id="adsense-framesnap-mid" />
        </div>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-20 space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.howItWorksTitle || 'How it works'}</h2>
            <div className="mx-auto h-1 w-16 rounded-full bg-orange-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div key={i} className="glass-card group relative space-y-4 rounded-3xl border border-white/5 p-6 transition-all hover:border-orange-500/20">
                  <span className="absolute right-6 top-5 text-5xl font-black text-white/5 transition-colors group-hover:text-orange-500/10">{i + 1}</span>
                  <Art className="h-auto w-24 text-orange-400" />
                  <h3 className="text-base font-bold leading-snug text-white">{step.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Features                                                         */}
        {/* ================================================================ */}
        {features.length > 0 && (
          <section className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div key={i} className="glass-card group rounded-3xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300 transition-all group-hover:border-orange-500/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-base font-bold text-white transition-colors group-hover:text-orange-300">{feature.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ================================================================ */}
        {/* SEO content                                                      */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="min-w-0 space-y-6">
              {keywords[0] && (
                <span className="inline-block rounded-lg border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-orange-300">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-white md:text-4xl">{t.seoSecondaryTitle || t.seoUseCaseTitle}</h2>
              <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.seoHeroText}</p>
            </div>
            <div className="glass-card relative flex min-h-[320px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-center md:p-10">
              <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
              <IconLocal className="relative h-16 w-16 text-orange-300" />
              <div className="relative max-w-sm space-y-3">
                <h3 className="text-xl font-black leading-tight tracking-tight text-white md:text-2xl">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-white/5 bg-[#1a0d03] p-7 md:p-12">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl font-black leading-tight text-white md:text-3xl">{t.seoUseCaseTitle}</h2>
              <div className="h-1.5 w-20 rounded-full bg-orange-500" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-8">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.faqTitle || 'FAQ'}</h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-orange-500" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="glass-card group rounded-2xl border border-white/5 px-5 py-5 text-left transition-colors hover:border-orange-500/20 sm:px-6 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 text-[15px] font-bold text-white transition-colors group-hover:text-orange-300">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-[11px] font-black text-orange-300">Q</span>
                      <span className="min-w-0 flex-1">{faq.question}</span>
                      <span className="shrink-0 text-xl leading-none text-orange-300 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="pl-9 pt-3 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-5 text-center opacity-55">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle || 'Related searches'}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-400">{keyword}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-16">
          <AdBanner id="adsense-framesnap-bottom" />
        </div>
      </main>

      {/* Lightbox */}
      {expanded && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setExpanded(null)}>
          <div className="flex max-h-full max-w-full flex-col items-center gap-3" onClick={event => event.stopPropagation()}>
            <img src={expanded.url} alt="" className="max-h-[78vh] max-w-full rounded-2xl object-contain ring-1 ring-white/10" />
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
              <span className="font-mono">{formatTimecode(expanded.time, info.fps)}</span>
              <span className="font-mono">{expanded.width}×{expanded.height}</span>
              <span className="font-mono">{formatBytes(expanded.bytes)}</span>
              <button
                type="button"
                onClick={() => downloadBlob(expanded.blob, frameFilename(base, expanded, info.fps))}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 font-bold outline-none hover:border-orange-400/50 hover:text-orange-200"
              >
                <Download className="h-3.5 w-3.5" />
                {t.ui_download || 'Download'}
              </button>
              <button
                type="button"
                onClick={() => setExpanded(null)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 font-bold outline-none hover:border-white/30"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} t={t} onOpenModal={setLegalModal} />

      {(['privacy', 'terms', 'cookies'] as LegalKey[]).map(key => (
        <LegalModal
          key={key}
          isOpen={legalModal === key}
          onClose={() => setLegalModal(null)}
          title={legalTranslations[lang]?.[key].title || key}
          content={legalTranslations[lang]?.[key].content}
          t={t}
        />
      ))}
    </div>
  );
}

/** The tab icon, kept out of the render body so the tuple stays readable. */
const IconBatchTab: React.FC<{ className?: string }> = ({ className }) => <Film className={className} />;
