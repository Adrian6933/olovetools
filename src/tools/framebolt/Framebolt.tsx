// ============================================================================
// FrameBolt — el vídeo entero convertido en imágenes, sin tope de fotogramas.
// ----------------------------------------------------------------------------
// Es la hermana de FrameSnap y hacen cosas distintas a propósito: FrameSnap es
// un visor para elegir EL fotograma, con su galería y su comparador. Aquí no
// hay galería, y ésa es justamente la característica: nada de lo que se extrae
// se queda en memoria, cada imagen va directa al ZIP y se olvida. Por eso esto
// puede sacar 40.000 fotogramas y aquello se para en 500.
// ============================================================================
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clapperboard,
  Download,
  FileArchive,
  Filter,
  Gauge,
  HardDriveDownload,
  Images,
  Loader2,
  RotateCcw,
  Settings2,
  Square,
  Timer,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import {
  DEFAULT_FILTERS,
  DEFAULT_OUTPUT,
  DEFAULT_PICK,
  FORMAT_EXT,
  type FilterOptions,
  type ImageFormat,
  type OutputOptions,
  type PickMode,
  type PickOptions,
  type RunProgress,
  type VideoInfo,
} from './types';
import { engineFor, estimateFrames, outputSize, rangeOf, runExtraction } from './lib/extract';
import { canSaveToDisk, createDiskSink, createMemorySink, saveBlob, type ZipSink } from './lib/sink';
import { baseNameOf, formatBytes, formatDuration, formatTimecode, probeVideo } from './lib/video';

const VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.webm', '.mov', '.mkv', '.avi', '.ogv', '.ogg', '.3gp', '.mpg', '.mpeg'];
const ACCEPT = `video/*,${VIDEO_EXTENSIONS.join(',')}`;

/** El MIME se pierde con .mkv y .mov en Windows, así que la extensión manda. */
function looksLikeVideo(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  const name = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => name.endsWith(ext));
}

interface FrameboltProps {
  lang: string;
  dictionary: any;
}

type Phase = 'idle' | 'running' | 'done' | 'partial' | 'cancelled' | 'error';

export default function Framebolt({ lang, dictionary }: FrameboltProps) {
  const t = dictionary || {};
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const urlRef = useRef<string | null>(null);
  const stopRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [intakeError, setIntakeError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState(0);

  const [pick, setPick] = useState<PickOptions>(DEFAULT_PICK);
  const [output, setOutput] = useState<OutputOptions>(DEFAULT_OUTPUT);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [toDisk, setToDisk] = useState(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [result, setResult] = useState<{ blob: Blob | null; filename: string; kind: 'disk' | 'memory' } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  /** Bytes de un fotograma real con los ajustes de ahora, para la estimación. */
  const [perFrame, setPerFrame] = useState<number | null>(null);

  const diskAvailable = useMemo(() => canSaveToDisk(), []);
  useEffect(() => setToDisk(diskAvailable), [diskAvailable]);

  // ---------------------------------------------------------------- entrada

  const clearVideo = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    setFile(null);
    setInfo(null);
    setPerFrame(null);
    setPosition(0);
    setPhase('idle');
    setProgress(null);
    setResult(null);
    setRunError(null);
    setPick(DEFAULT_PICK);
  }, []);

  const acceptFile = useCallback(
    async (incoming: File) => {
      if (!looksLikeVideo(incoming)) {
        setIntakeError(t.ui_notVideo || 'That is not a video.');
        return;
      }
      setIntakeError(null);
      setResult(null);
      setRunError(null);
      setPhase('idle');
      setProgress(null);
      setPerFrame(null);
      setLoading(true);

      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(incoming);
      urlRef.current = url;

      try {
        const video = videoRef.current;
        if (!video) return;
        const probed = await probeVideo(video, incoming, url);
        setFile(incoming);
        setInfo(probed);
        setPick({ ...DEFAULT_PICK, to: 0 });
        setPosition(0);
      } catch {
        setIntakeError(t.ui_decodeError || 'Your browser could not decode this video.');
        URL.revokeObjectURL(url);
        urlRef.current = null;
        setFile(null);
        setInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [t.ui_notVideo, t.ui_decodeError]
  );

  // Un vídeo que llega de otra herramienta de la suite entra por aquí. Cargarlo
  // no dispara nada: la extracción sigue esperando a que se pulse el botón.
  useHandoffIntake(useCallback((incoming: File) => { void acceptFile(incoming); }, [acceptFile]));

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) void acceptFile(dropped);
  };

  // ------------------------------------------------------------ estimación

  const frameCount = useMemo(() => estimateFrames(pick, info), [pick, info]);
  const engine = useMemo(() => engineFor(pick, info), [pick, info]);
  const size = useMemo(() => (info ? outputSize(info, output.maxWidth) : null), [info, output.maxWidth]);

  /**
   * Pesa un fotograma de verdad, el que ya está en pantalla, con el formato y
   * el tamaño elegidos. Se hace sobre el fotograma actual y sin saltar a ningún
   * lado: una estimación inventada a partir del área de la imagen se equivoca
   * por un factor de cinco entre una escena plana y una llena de detalle.
   */
  useEffect(() => {
    if (!info || phase === 'running') return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const { width, height } = outputSize(info, output.maxWidth);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, width, height);
        const blob = await new Promise<Blob | null>(resolve =>
          canvas.toBlob(
            resolve,
            output.format,
            output.format === 'image/png' ? undefined : Math.min(1, Math.max(0.01, output.quality / 100))
          )
        );
        if (!cancelled && blob) setPerFrame(blob.size);
      } catch {
        if (!cancelled) setPerFrame(null);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [info, output.format, output.quality, output.maxWidth, position, phase]);

  const estimatedBytes = frameCount > 0 && perFrame ? frameCount * perFrame : null;
  const huge = frameCount > 20000 || (estimatedBytes !== null && estimatedBytes > 4 * 1024 ** 3);

  // ---------------------------------------------------------------- la pasada

  const start = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !info || phase === 'running') return;

    const filename = `${baseNameOf(info.name)}_frames.zip`;
    let sink: ZipSink;
    if (toDisk && diskAvailable) {
      const disk = await createDiskSink(filename);
      // Cerrar el diálogo de guardar no es un error: es cambiar de opinión.
      if (!disk) return;
      sink = disk;
    } else {
      sink = createMemorySink();
    }

    stopRef.current = false;
    setRunError(null);
    setResult(null);
    setProgress(null);
    setPhase('running');

    const outcome = await runExtraction({
      video,
      info,
      pick,
      output,
      filters,
      sink,
      filename,
      onProgress: next => setProgress(next),
      shouldStop: () => stopRef.current,
    });

    setProgress(outcome.progress);
    if (outcome.cancelled) {
      setPhase('cancelled');
      return;
    }
    // Un ZIP a medias pero bien cerrado se entrega igual, con el aviso: se abre
    // y trae lo que dio tiempo a sacar.
    if (outcome.error && !outcome.partial) {
      setRunError(outcome.error);
      setPhase('error');
      return;
    }
    setResult({ blob: outcome.blob, filename: outcome.filename, kind: sink.kind });
    setRunError(outcome.error ?? null);
    setPhase(outcome.partial ? 'partial' : 'done');
    if (sink.kind === 'memory' && outcome.blob) saveBlob(outcome.blob, outcome.filename);
  }, [info, phase, pick, output, filters, toDisk, diskAvailable]);

  const cancel = useCallback(() => {
    stopRef.current = true;
  }, []);

  // ---------------------------------------------------------------- derivados

  const elapsed = progress ? (Date.now() - progress.startedAt) / 1000 : 0;
  const rate = progress && elapsed > 0.5 ? progress.seen / elapsed : 0;
  const remaining =
    progress && progress.total > 0 && rate > 0 ? Math.max(0, (progress.total - progress.seen) / rate) : -1;
  const percent =
    progress && progress.total > 0 ? Math.min(100, (progress.seen / progress.total) * 100) : null;

  const keywords: string[] = t.seoKeywords || [];
  const faqs: { question: string; answer: string }[] = t.faq || [];
  const running = phase === 'running';

  const setMode = (mode: PickMode) => setPick(prev => ({ ...prev, mode }));
  const num = (value: string, fallback: number) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const range = info ? rangeOf(pick, info.duration) : { from: 0, to: 0 };

  return (
    <div className="min-h-screen flex flex-col bg-[#020813] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-sky-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-sky-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/framebolt`)}
        onReset={clearVideo}
        t={t}
      />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 flex flex-col gap-10">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-[11px] font-black uppercase tracking-[0.2em] border border-sky-500/20">
            <Zap className="w-3.5 h-3.5" />
            {t.heroBadge || 'Every frame, no limit'}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Images className="w-8 h-8 text-sky-400 shrink-0" />
            <span>{t.title || 'FrameBolt'}</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">{t.tagline || t.seoHeroText}</p>
        </div>

        <AdBanner id="adsense-framebolt-top" />

        {/* ================================================================ */}
        {/* Entrada                                                          */}
        {/* ================================================================ */}
        {!info && (
          <label
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`glass-card rounded-[2rem] border-2 border-dashed px-8 py-20 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all ${
              dragging ? 'border-sky-400 bg-sky-500/10' : 'border-white/10 hover:border-sky-500/40'
            }`}
          >
            <input
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={e => {
                const chosen = e.target.files?.[0];
                if (chosen) void acceptFile(chosen);
                e.target.value = '';
              }}
            />
            {loading ? (
              <Loader2 className="w-12 h-12 text-sky-400 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-sky-400" />
            )}
            <span className="text-lg font-black text-white">{t.ui_drop || 'Drop a video here'}</span>
            <span className="text-sm text-slate-400 max-w-md">{t.ui_formats}</span>
            {intakeError && (
              <span className="flex items-center gap-2 text-sm font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" /> {intakeError}
              </span>
            )}
          </label>
        )}

        {/* El elemento vive siempre: es donde se decodifica, y montarlo y
            desmontarlo con el vídeo obligaría a recargarlo en cada pasada. */}
        <video
          ref={videoRef}
          className={info ? 'w-full rounded-2xl bg-black border border-white/10 max-h-[46vh] object-contain' : 'hidden'}
          playsInline
          muted
          preload="auto"
          onTimeUpdate={e => setPosition((e.target as HTMLVideoElement).currentTime)}
          onSeeked={e => setPosition((e.target as HTMLVideoElement).currentTime)}
        />

        {info && (
          <>
            {/* ------------------------------------------------ ficha ------ */}
            <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="flex items-center gap-2 font-bold text-white min-w-0">
                <Clapperboard className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate max-w-[16rem]">{info.name}</span>
              </span>
              <Fact label={t.infoResolution || 'Size'} value={`${info.width}×${info.height}`} />
              <Fact label={t.infoDuration || 'Duration'} value={formatTimecode(info.duration, false)} />
              <Fact
                label={t.infoFps || 'fps'}
                value={info.fps ? String(info.fps) : t.fpsUnknown || 'unknown'}
              />
              <Fact label={t.infoSize || 'File'} value={formatBytes(info.bytes)} />
              <button
                onClick={clearVideo}
                disabled={running}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> {t.ui_remove || 'Remove'}
              </button>
            </div>

            {!info.exact && (
              <p className="flex items-start gap-2 text-xs font-bold text-amber-400/90 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {t.engineNoRvfc}
              </p>
            )}

            {/* ------------------------------------------------ recorte ---- */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <input
                type="range"
                min={0}
                max={Math.max(0.01, info.duration)}
                step={0.01}
                value={Math.min(position, info.duration)}
                disabled={running}
                onChange={e => {
                  const video = videoRef.current;
                  const next = num(e.target.value, 0);
                  setPosition(next);
                  if (video) video.currentTime = next;
                }}
                className="w-full accent-sky-500 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-wrap items-end gap-4">
                <Field label={t.labelFrom || 'From (s)'}>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={pick.from}
                    disabled={running}
                    onChange={e => setPick(p => ({ ...p, from: Math.max(0, num(e.target.value, 0)) }))}
                    className={inputClass}
                  />
                </Field>
                <button onClick={() => setPick(p => ({ ...p, from: position }))} disabled={running} className={ghostBtn}>
                  {t.actionSetIn || 'Set in'}
                </button>
                <Field label={t.labelTo || 'To (s, 0 = end)'}>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={pick.to}
                    disabled={running}
                    onChange={e => setPick(p => ({ ...p, to: Math.max(0, num(e.target.value, 0)) }))}
                    className={inputClass}
                  />
                </Field>
                <button onClick={() => setPick(p => ({ ...p, to: position }))} disabled={running} className={ghostBtn}>
                  {t.actionSetOut || 'Set out'}
                </button>
                <button
                  onClick={() => setPick(p => ({ ...p, from: 0, to: 0 }))}
                  disabled={running}
                  className={ghostBtn}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t.actionFullRange || 'Whole video'}
                </button>
                <span className="text-xs font-bold text-slate-500 tabular-nums ml-auto">
                  {formatTimecode(range.from)} → {formatTimecode(range.to)}
                </span>
              </div>
            </div>

            {/* ------------------------------------------------ ajustes ---- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Panel icon={<Images className="w-4 h-4" />} title={t.secWhich || 'Which frames'}>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['all', t.modeAll || 'Every frame'],
                      ['every-n', t.modeEveryN || '1 in every N'],
                      ['interval', t.modeInterval || 'Every N seconds'],
                      ['count', t.modeCount || 'N spread out'],
                    ] as [PickMode, string][]
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setMode(mode)}
                      disabled={running}
                      className={`px-3 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer disabled:opacity-40 border ${
                        pick.mode === mode
                          ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                          : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {pick.mode === 'every-n' && (
                  <Field label={t.labelEveryN || 'Keep 1 in every'}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={pick.everyN}
                      disabled={running}
                      onChange={e => setPick(p => ({ ...p, everyN: Math.max(1, Math.round(num(e.target.value, 2))) }))}
                      className={inputClass}
                    />
                  </Field>
                )}
                {pick.mode === 'interval' && (
                  <Field label={t.labelInterval || 'Seconds between frames'}>
                    <input
                      type="number"
                      min={0.01}
                      step={0.1}
                      value={pick.interval}
                      disabled={running}
                      onChange={e => setPick(p => ({ ...p, interval: Math.max(0.01, num(e.target.value, 1)) }))}
                      className={inputClass}
                    />
                  </Field>
                )}
                {pick.mode === 'count' && (
                  <Field label={t.labelCount || 'How many'}>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={pick.count}
                      disabled={running}
                      onChange={e => setPick(p => ({ ...p, count: Math.max(1, Math.round(num(e.target.value, 24))) }))}
                      className={inputClass}
                    />
                  </Field>
                )}

                <p className="text-[11px] font-bold text-slate-500 leading-relaxed">
                  {engine === 'playback' ? t.enginePlayback : t.engineSeek}
                </p>
                {engine === 'playback' && (
                  <p className="text-[11px] font-bold text-amber-400/80 leading-relaxed">{t.engineForeground}</p>
                )}
              </Panel>

              <Panel icon={<Settings2 className="w-4 h-4" />} title={t.secOutput || 'Output'}>
                <Field label={t.labelFormat || 'Format'}>
                  <select
                    value={output.format}
                    disabled={running}
                    onChange={e => setOutput(o => ({ ...o, format: e.target.value as ImageFormat }))}
                    className={inputClass}
                  >
                    <option value="image/jpeg">JPEG</option>
                    <option value="image/webp">WebP</option>
                    <option value="image/png">PNG</option>
                  </select>
                </Field>
                {output.format !== 'image/png' && (
                  <Field label={`${t.labelQuality || 'Quality'} · ${output.quality}`}>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={output.quality}
                      disabled={running}
                      onChange={e => setOutput(o => ({ ...o, quality: Math.round(num(e.target.value, 92)) }))}
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </Field>
                )}
                <Field label={t.labelMaxWidth || 'Max width (px)'}>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    value={output.maxWidth}
                    disabled={running}
                    placeholder="0"
                    onChange={e => setOutput(o => ({ ...o, maxWidth: Math.max(0, Math.round(num(e.target.value, 0))) }))}
                    className={inputClass}
                  />
                </Field>
                <Field label={t.labelPattern || 'File name'}>
                  <input
                    type="text"
                    value={output.pattern}
                    disabled={running}
                    maxLength={80}
                    onChange={e => setOutput(o => ({ ...o, pattern: e.target.value }))}
                    className={inputClass}
                  />
                </Field>
                <p className="text-[11px] font-bold text-slate-500">
                  {t.patternHint} · {size ? `${size.width}×${size.height}` : ''}.{FORMAT_EXT[output.format]}
                </p>
              </Panel>

              <Panel icon={<Filter className="w-4 h-4" />} title={t.secFilters || 'Skip'}>
                <Toggle
                  checked={filters.skipDuplicates}
                  disabled={running}
                  onChange={v => setFilters(f => ({ ...f, skipDuplicates: v }))}
                  label={t.filterDuplicates || 'Repeated frames'}
                  hint={t.filterDuplicatesHint}
                />
                {filters.skipDuplicates && (
                  <Field label={`${t.labelThreshold || 'Sensitivity'} · ${(filters.duplicateThreshold * 100).toFixed(0)}%`}>
                    <input
                      type="range"
                      min={0.2}
                      max={15}
                      step={0.1}
                      value={filters.duplicateThreshold * 100}
                      disabled={running}
                      onChange={e =>
                        setFilters(f => ({ ...f, duplicateThreshold: num(e.target.value, 2) / 100 }))
                      }
                      className="w-full accent-sky-500 cursor-pointer"
                    />
                  </Field>
                )}
                <Toggle
                  checked={filters.skipBlank}
                  disabled={running}
                  onChange={v => setFilters(f => ({ ...f, skipBlank: v }))}
                  label={t.filterBlank || 'Black frames'}
                  hint={t.filterBlankHint}
                />

                <div className="pt-2 border-t border-white/5 space-y-2">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                    <HardDriveDownload className="w-3.5 h-3.5" /> {t.secDestination || 'Where it goes'}
                  </span>
                  {diskAvailable ? (
                    <>
                      <Toggle
                        checked={toDisk}
                        disabled={running}
                        onChange={setToDisk}
                        label={t.destDisk || 'Straight to disk'}
                        hint={t.destDiskHint}
                      />
                      {!toDisk && <p className="text-[11px] font-bold text-slate-500">{t.destMemoryHint}</p>}
                    </>
                  ) : (
                    <p className="text-[11px] font-bold text-slate-500">{t.destUnavailable}</p>
                  )}
                </div>
              </Panel>
            </div>

            {/* ------------------------------------------------ estimación -- */}
            <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center gap-x-8 gap-y-4">
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500">
                <Gauge className="w-3.5 h-3.5" /> {t.estimateTitle || 'Before you start'}
              </span>
              <Fact
                label={t.estimateFramesLabel || 'Frames'}
                value={frameCount >= 0 ? frameCount.toLocaleString(lang) : t.estimateUnknown || '?'}
              />
              <Fact
                label={t.estimateSizeLabel || 'ZIP size'}
                value={estimatedBytes ? `≈ ${formatBytes(estimatedBytes)}` : t.estimateUnknown || '?'}
              />
              <Fact
                label={t.estimatePerFrame || 'Per frame'}
                value={perFrame ? formatBytes(perFrame) : '—'}
              />
              {huge && (
                <span className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {t.estimateWarn}
                </span>
              )}
            </div>

            {/* ------------------------------------------------ acción ----- */}
            {!running && (
              <button
                onClick={start}
                disabled={frameCount === 0}
                className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-black uppercase tracking-widest transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-sky-900/40"
              >
                <FileArchive className="w-5 h-5" />
                {t.actionRun || 'Extract to ZIP'}
              </button>
            )}

            {running && progress && (
              <div className="glass-card rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3 font-black text-white">
                    <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                    {t.runTitle || 'Extracting'}
                  </span>
                  <button
                    onClick={cancel}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" /> {t.actionCancel || 'Stop'}
                  </button>
                </div>

                {progress.waiting && (
                  <p className="flex items-start gap-2 text-xs font-bold text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {t.waitingTab}
                  </p>
                )}

                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 transition-[width] duration-200"
                    style={{ width: `${percent ?? 0}%` }}
                  />
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-3">
                  <Fact label={t.runWritten || 'Written'} value={progress.written.toLocaleString(lang)} />
                  {(filters.skipDuplicates || filters.skipBlank) && (
                    <Fact label={t.runSkipped || 'Skipped'} value={progress.skipped.toLocaleString(lang)} />
                  )}
                  <Fact label={t.runSize || 'ZIP'} value={formatBytes(progress.bytes)} />
                  <Fact label={t.runAt || 'At'} value={formatTimecode(progress.at, false)} />
                  <Fact label={t.runSpeed || 'Speed'} value={`${rate.toFixed(1)} f/s`} />
                  <Fact
                    label={t.runEta || 'Left'}
                    value={remaining >= 0 ? formatDuration(remaining) : '—'}
                  />
                </div>
              </div>
            )}

            {(phase === 'done' || phase === 'partial') && result && progress && (
              <div
                className={`rounded-2xl border p-6 flex flex-wrap items-center gap-5 ${
                  phase === 'partial' ? 'border-amber-500/25 bg-amber-500/5' : 'border-sky-500/25 bg-sky-500/5'
                }`}
              >
                {phase === 'partial' ? (
                  <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                ) : (
                  <Check className="w-8 h-8 text-sky-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-black text-white">{phase === 'partial' ? t.partialTitle : t.doneTitle}</p>
                  <p className="text-sm text-slate-400">
                    {progress.written.toLocaleString(lang)} · {formatBytes(progress.bytes)} ·{' '}
                    {result.kind === 'disk' ? t.doneSaved : t.doneReady}
                  </p>
                  {phase === 'partial' && <p className="text-sm text-amber-400/90 mt-1">{t.partialBody}</p>}
                </div>
                {result.blob && (
                  <button
                    onClick={() => saveBlob(result.blob!, result.filename)}
                    className="ml-auto flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> {t.actionDownloadZip || 'Download again'}
                  </button>
                )}
              </div>
            )}

            {phase === 'cancelled' && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center gap-4">
                <Timer className="w-6 h-6 text-slate-400 shrink-0" />
                <div>
                  <p className="font-black text-white">{t.cancelledTitle || 'Stopped'}</p>
                  <p className="text-sm text-slate-400">{t.cancelledBody}</p>
                </div>
              </div>
            )}

            {phase === 'error' && (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 p-6 flex items-center gap-4">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                <div>
                  <p className="font-black text-white">{t.errTitle || 'It did not finish'}</p>
                  <p className="text-sm text-slate-400">
                    {runError === 'playback' ? t.errPlayback : runError === 'encode' ? t.errEncode : runError === 'stalled' ? t.errStalled : t.errGeneric}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ================================================================ */}
        {/* SEO                                                              */}
        {/* ================================================================ */}
        <section className="space-y-24 text-left pt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
            <div className="space-y-7">
              {keywords[0] && (
                <div className="inline-block px-4 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-[11px] font-black uppercase tracking-[0.2em] border border-sky-500/20">
                  {keywords[0]}
                </div>
              )}
              <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.05] tracking-tighter">
                {t.seoHeroTitle}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(t.seoHeroList || []).map((point: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all"
                  >
                    <span className="w-7 h-7 shrink-0 bg-sky-500/20 text-sky-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span className="text-slate-300 font-bold text-sm">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl" />
              <FilmStripArt className="w-56 h-40 text-sky-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                  {t.seoBrowserSpeedTitle}
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#050f1a] border border-white/5 space-y-10">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-sky-500 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-slate-400 text-base leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
            </div>

            <a
              href={`/${lang.toLowerCase()}/framesnap/`}
              className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider transition-all"
            >
              <Clapperboard className="w-4 h-4" />
              {t.ctaFramesnap || 'Pick one exact frame instead'}
            </a>
          </div>

          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-10">
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-sky-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-sky-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1">{faq.question}</span>
                      <span className="shrink-0 text-sky-400 transition-transform group-open:rotate-45 text-xl leading-none">
                        +
                      </span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-5 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.seoKeywordsTitle}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-sky-500/10 hover:border-sky-500/20 hover:text-sky-400 transition-all cursor-default"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-framebolt-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />
      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.privacy.title || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.terms.title || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.cookies.title || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content}
        t={t}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Piezas sueltas
// ---------------------------------------------------------------------------

const inputClass =
  'w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none focus:border-sky-500 transition-colors disabled:opacity-40';

const ghostBtn =
  'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-black transition-colors disabled:opacity-40 cursor-pointer';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      <span className="text-sm font-bold text-white tabular-nums">{value}</span>
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 min-w-[7rem] flex-1">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-sky-400">
        {icon}
        {title}
      </span>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-sky-500 cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{label}</span>
        {hint && <span className="text-[11px] font-bold text-slate-500 leading-relaxed">{hint}</span>}
      </span>
    </label>
  );
}

/** Una tira de película: lo que la herramienta hace, en un dibujo. */
function FilmStripArt({ className }: { className?: string }) {
  return (
    <svg viewBox="1 27 224 106" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="34" width="150" height="92" rx="8" stroke="currentColor" strokeWidth="3" opacity="0.9" />
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={`t${i}`} x={20 + i * 28} y="42" width="14" height="10" rx="2" fill="currentColor" opacity="0.35" />
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <rect key={`b${i}`} x={20 + i * 28} y="108" width="14" height="10" rx="2" fill="currentColor" opacity="0.35" />
      ))}
      {[0, 1, 2].map(i => (
        <rect
          key={`f${i}`}
          x={20 + i * 46}
          y="60"
          width="40"
          height="40"
          rx="4"
          fill="currentColor"
          opacity={0.16 + i * 0.08}
        />
      ))}
      <path d="M168 80h30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <path d="M188 70l10 10-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <rect x="196" y="52" width="22" height="56" rx="5" stroke="currentColor" strokeWidth="3" />
      <path d="M207 52v14M207 74v6M207 88v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
