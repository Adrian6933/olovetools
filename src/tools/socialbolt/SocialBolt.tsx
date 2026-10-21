import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import {
  SocialHeroArt,
  StepPasteArt,
  StepChooseArt,
  StepDownloadArt,
  IconNoWatermark,
  IconQuality,
  IconBatch,
  IconAudioTrack,
  IconLinkShield,
  IconHandoff,
} from './components/Illustrations';
import {
  AlertCircle,
  ArrowUp,
  Check,
  ClipboardPaste,
  Download,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Music,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';
import type { Asset, AssetKind, Job, Platform, ResolvedMedia, Transfer, ResolveOptions } from './types';
import {
  detectPlatform,
  directResult,
  fetchAsset,
  filenameFor,
  formatBytes,
  formatCount,
  formatDuration,
  isDirectMediaUrl,
  ResolveError,
  resolveLink,
  saveBlob,
  splitLinks,
  inspectLinks,
} from './lib/socialApi';

interface SocialBoltProps {
  lang: Language;
  dictionary: any;
}

const PLATFORM_STYLE: Record<Platform, { label: string; ring: string; text: string; dot: string }> = {
  tiktok: { label: 'TikTok', ring: 'border-cyan-500/40', text: 'text-cyan-300', dot: 'bg-cyan-400' },
  twitter: { label: 'X', ring: 'border-slate-400/40', text: 'text-slate-200', dot: 'bg-slate-200' },
  youtube: { label: 'YouTube', ring: 'border-red-500/40', text: 'text-red-300', dot: 'bg-red-500' },
  instagram: { label: 'Instagram', ring: 'border-pink-500/40', text: 'text-pink-300', dot: 'bg-pink-400' },
  direct: { label: 'CDN', ring: 'border-emerald-500/40', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  unknown: { label: '—', ring: 'border-white/10', text: 'text-slate-400', dot: 'bg-slate-600' },
};

const KIND_ICON: Record<AssetKind, React.ReactNode> = {
  video: <FileVideo className="w-3.5 h-3.5" />,
  audio: <Music className="w-3.5 h-3.5" />,
  image: <ImageIcon className="w-3.5 h-3.5" />,
};

/** TikWM corta a ~1 petición por segundo y por IP; la cola respeta ese ritmo. */
const RESOLVE_GAP_MS = 1100;

let jobCounter = 0;
const nextJobKey = () => `job-${++jobCounter}-${Date.now().toString(36)}`;

export const SocialBolt: React.FC<SocialBoltProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  const [input, setInput] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [transfers, setTransfers] = useState<Record<string, Transfer>>({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [manualOpen, setManualOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [options, setOptions] = useState<ResolveOptions>({ mode: 'auto', quality: '1080' });
  const [youtubeMedia, setYoutubeMedia] = useState(false);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMessage, setBatchMessage] = useState('');
  const batchAbort = useRef<AbortController | null>(null);
  const operationEpoch = useRef(0);
  const removedJobs = useRef(new Set<string>());

  const resolveAbort = useRef<AbortController | null>(null);
  const transferAborts = useRef<Map<string, AbortController>>(new Map());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const animated = !reducedMotion;

  // Derivado, no espejado: la versión anterior guardaba esto en estado con un
  // useEffect y provocaba un render extra por cada tecla.
  const intake = useMemo(() => inspectLinks(input), [input]);
  const pendingLinks = intake.links;
  const pendingPlatforms = useMemo(() => pendingLinks.map(detectPlatform), [pendingLinks]);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/social?action=capabilities', { signal: controller.signal })
      .then(r => r.ok ? r.json() : null).then(d => setYoutubeMedia(d?.youtubeMedia === true)).catch(() => {});
    return () => controller.abort();
  }, []);

  // Al desmontar: nada de peticiones huérfanas escribiendo en estado muerto.
  useEffect(
    () => () => {
      resolveAbort.current?.abort();
      transferAborts.current.forEach(controller => controller.abort());
      transferAborts.current.clear();
      batchAbort.current?.abort();
      operationEpoch.current++;
    },
    []
  );

  const errorText = useCallback(
    (key: string) => t[`err_${key}`] || t.error_failed || 'Could not resolve that link.',
    [t]
  );

  const assetLabel = useCallback(
    (asset: Asset) => {
      const base = t[asset.labelKey] || asset.labelKey;
      return asset.labelIndex ? `${base} ${asset.labelIndex}` : base;
    },
    [t]
  );

  // -------------------------------------------------------------------------
  // Cola de resolución
  // -------------------------------------------------------------------------

  const patchJob = useCallback((key: string, patch: Partial<Job>) => {
    setJobs(prev => prev.map(job => (job.key === key ? { ...job, ...patch } : job)));
  }, []);

  const runResolve = useCallback(
    async (queued: Job[]) => {
      const controller = new AbortController();
      resolveAbort.current?.abort();
      resolveAbort.current = controller;
      setBusy(true);

      for (const [index, job] of queued.entries()) {
        if (controller.signal.aborted) break;
        if (removedJobs.current.has(job.key)) continue;
        patchJob(job.key, { status: 'resolving' });

        try {
          const result = await resolveLink(job.url, controller.signal, job.options);
          if (controller.signal.aborted) break;
          patchJob(job.key, {
            status: 'ready',
            result,
            platform: result.platform,
            selected: result.assets.filter(a => a.primary).map(a => a.id),
          });
        } catch (e) {
          if ((e as Error).name === 'AbortError') break;
          const key = e instanceof ResolveError ? e.key : 'resolve_failed';
          patchJob(job.key, { status: 'error', errorKey: key, errorDetail: (e as Error).message });
        }

        if (index < queued.length - 1 && !controller.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, RESOLVE_GAP_MS));
        }
      }

      if (resolveAbort.current === controller) {
        resolveAbort.current = null;
        setBusy(false);
      }
    },
    [patchJob]
  );

  /** Nada se resuelve al pegar: esto solo corre cuando el usuario pulsa el botón. */
  const handleAnalyze = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setFormError('');

    const links = splitLinks(input);
    if (links.length + jobs.length > 30) { setFormError(t.queueLimit); return; }
    if (!links.length) {
      setFormError(t.error_invalid_url || 'Paste a link first.');
      return;
    }

    const known = new Set(jobs.map(job => job.url));
    const fresh: Job[] = [];
    const directOnes: Job[] = [];

    for (const url of links) {
      if (known.has(url)) continue;
      known.add(url);
      const platform = detectPlatform(url);
      if (platform === 'unknown') continue;
      const job: Job = { key: nextJobKey(), url, platform, status: 'queued', selected: [], options: { ...options } };
      // Un enlace directo de CDN no necesita resolutor: ya es el archivo.
      if (platform === 'direct') {
        const result = directResult(url);
        directOnes.push({ ...job, status: 'ready', result, selected: result.assets.map(a => a.id) });
      } else {
        fresh.push(job);
      }
    }

    if (!fresh.length && !directOnes.length) {
      setFormError(t.error_invalid_url || 'Unsupported link.');
      return;
    }

    setJobs(prev => [...prev, ...directOnes, ...fresh]);
    setInput(intake.invalid.join('\n'));
    if (fresh.length) void runResolve(fresh);
  };

  const cancelResolve = () => {
    resolveAbort.current?.abort();
    resolveAbort.current = null;
    setBusy(false);
    setJobs(prev => prev.map(job => (job.status === 'queued' || job.status === 'resolving' ? { ...job, status: 'error', errorKey: 'cancelled' } : job)));
  };

  const retryJob = (job: Job) => {
    patchJob(job.key, { status: 'queued', errorKey: undefined, errorDetail: undefined });
    void runResolve([{ ...job, status: 'queued' }]);
  };

  const removeJob = (key: string) => {
    removedJobs.current.add(key);
    for (const [id, controller] of transferAborts.current) if (id.startsWith(`${key}:`)) controller.abort();
    batchAbort.current?.abort();
    setJobs(prev => prev.filter(job => job.key !== key));
    setTransfers(prev => {
      const next = { ...prev };
      for (const id of Object.keys(next)) if (id.startsWith(`${key}:`)) delete next[id];
      return next;
    });
  };

  const clearAll = () => {
    operationEpoch.current++;
    resolveAbort.current?.abort();
    resolveAbort.current = null;
    batchAbort.current?.abort();
    batchAbort.current = null;
    transferAborts.current.forEach(c => c.abort());
    transferAborts.current.clear();
    setJobs([]);
    setTransfers({});
    setBusy(false);
    setFormError('');
    setBatchMessage('');
    setBatchBusy(false);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(prev => (prev ? `${prev}\n${text}` : text));
      inputRef.current?.focus();
    } catch {
      // Sin permiso de portapapeles: el usuario pega a mano, no es un error.
      inputRef.current?.focus();
    }
  };

  // -------------------------------------------------------------------------
  // Selección y descarga
  // -------------------------------------------------------------------------

  const toggleAsset = (job: Job, assetId: string) => {
    const selected = job.selected.includes(assetId)
      ? job.selected.filter(id => id !== assetId)
      : [...job.selected, assetId];
    patchJob(job.key, { selected });
  };

  const setAllAssets = (job: Job, all: boolean) => {
    patchJob(job.key, { selected: all ? (job.result?.assets || []).map(a => a.id) : [] });
  };

  const downloadOne = useCallback(
    async (job: Job, asset: Asset): Promise<{ blob: Blob; name: string } | null> => {
      const result = job.result!;
      const name = filenameFor(result, asset);
      const id = `${job.key}:${asset.id}`;
      if (transferAborts.current.has(id) || removedJobs.current.has(job.key)) return null;
      const controller = new AbortController();
      transferAborts.current.set(id, controller);

      setTransfers(prev => ({
        ...prev,
        [id]: { id, name, received: 0, total: asset.bytes || 0, status: 'active' },
      }));

      try {
        const blob = await fetchAsset(asset, name, {
          signal: controller.signal,
          onProgress: (received, total) =>
            setTransfers(prev =>
              prev[id] ? { ...prev, [id]: { ...prev[id], received, total: total || prev[id].total } } : prev
            ),
        });
        setTransfers(prev =>
          prev[id] ? { ...prev, [id]: { ...prev[id], status: 'done', received: blob.size, total: blob.size } } : prev
        );
        if (controller.signal.aborted || removedJobs.current.has(job.key)) return null;
        return { blob, name };
      } catch (e) {
        const cancelled = (e as Error).name === 'AbortError';
        setTransfers(prev =>
          prev[id] ? { ...prev, [id]: { ...prev[id], status: cancelled ? 'cancelled' : 'error' } } : prev
        );
        return null;
      } finally {
        if (transferAborts.current.get(id) === controller) transferAborts.current.delete(id);
      }
    },
    []
  );

  const downloadAsset = async (job: Job, asset: Asset) => {
    const epoch = operationEpoch.current;
    const file = await downloadOne(job, asset);
    if (file && epoch === operationEpoch.current) saveBlob(file.blob, file.name);
  };

  const downloadBatch = async (selection: Job[]) => {
    if (batchAbort.current || transferAborts.current.size) return;
    const chosen = selection.flatMap(job => (job.result?.assets || []).filter(a => job.selected.includes(a.id)).map(asset => ({ job, asset })));
    if (!chosen.length) return;
    const controller = new AbortController();
    batchAbort.current = controller;
    setBatchBusy(true);
    setBatchMessage('');
    const files: { name: string; blob: Blob }[] = [];
    try {
      for (const { job, asset } of chosen) {
        if (controller.signal.aborted) return;
        const file = await downloadOne(job, asset);
        if (controller.signal.aborted) return;
        if (!file) { setBatchMessage(t.batchFailed); return; }
        files.push(file);
        setBatchMessage(`${files.length} / ${chosen.length}`);
      }
      if (files.length === 1) saveBlob(files[0].blob, files[0].name);
      else {
        // Build before saving so clearing/cancelling the queue cannot trigger
        // a delayed unwanted download while JSZip is still working.
        const { default: JSZip } = await import('jszip');
        const zip = new JSZip();
        files.forEach((file, i) => zip.file(`${String(i + 1).padStart(2, '0')}-${file.name}`, file.blob));
        const blob = await zip.generateAsync({ type: 'blob' });
        if (!controller.signal.aborted) saveBlob(blob, 'socialbolt.zip');
      }
      if (!controller.signal.aborted) setBatchMessage(t.batchDone);
    } catch { if (!controller.signal.aborted) setBatchMessage(t.batchFailed); }
    finally {
      if (batchAbort.current === controller) { batchAbort.current = null; setBatchBusy(false); }
    }
  };

  const downloadSelected = (job: Job) => { void downloadBatch([job]); };
  const selectedCount = jobs.reduce((n, j) => n + (j.status === 'ready' ? j.selected.length : 0), 0);

  const cancelTransfer = (id: string) => transferAborts.current.get(id)?.abort();

  // -------------------------------------------------------------------------
  // Modal legal
  // -------------------------------------------------------------------------

  const modal = useMemo(() => {
    if (!activeModal) return { title: '', content: '' };
    return {
      title: legalTranslations[lang]?.nav[activeModal] || '',
      content: legalTranslations[lang]?.sections[activeModal]?.join('\n\n') || '',
    };
  }, [activeModal, lang]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const featureIcons = [IconNoWatermark, IconQuality, IconBatch, IconAudioTrack, IconLinkShield, IconHandoff];
  const howSteps: { title: string; text: string }[] = Array.isArray(t.howSteps) ? t.howSteps : [];
  const stepArt = [StepPasteArt, StepChooseArt, StepDownloadArt];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/20 selection:text-indigo-200 relative">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => (window.location.href = `/${newLang}/socialbolt`)}
        onReset={clearAll}
        t={t}
      />

      {/* Keep the workspace centered within its own maximum width. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 sm:px-6 md:px-10 pt-28 md:pt-36 pb-24 flex flex-col gap-16 relative z-10">
        <AdBanner id="adsense-socialbolt-top" />

        {/* ================================================================ */}
        {/* Héroe                                                            */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/50 border border-indigo-700/40 text-indigo-300 text-[11px] font-black tracking-[0.2em] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="truncate">{t.heroKicker}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white leading-[1.05]">
              {t.title}
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.description}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-400/80">{t.noAutoNote}</p>
          </div>
          <SocialHeroArt animated={animated} className="w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" />
        </section>

        {/* ================================================================ */}
        {/* Entrada                                                          */}
        {/* ================================================================ */}
        <section className="space-y-4">
          <form onSubmit={handleAnalyze} className="glass-card rounded-3xl p-4 sm:p-5 space-y-4 border border-white/10">
            <label htmlFor="sb-input" className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.inputLabel}
            </label>
            <textarea
              id="sb-input"
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAnalyze();
                }
                if (e.key === 'Escape') setInput('');
              }}
              rows={Math.min(6, Math.max(2, pendingLinks.length + 1))}
              placeholder={t.placeholder}
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-slate-200 outline-none focus:border-indigo-500/60 placeholder:text-slate-600 font-mono text-xs sm:text-sm leading-relaxed resize-y"
            />

            {/* Only once a YouTube link is pasted; without an extractor the
                quality and audio pickers would offer outputs that never come. */}
            {pendingPlatforms.includes('youtube') && !youtubeMedia && (
              <p role="status" className="text-xs leading-relaxed text-amber-200/80 rounded-2xl bg-amber-500/5 border border-amber-500/15 p-3">{t.youtubeLimited}</p>
            )}
            {pendingPlatforms.includes('youtube') && youtubeMedia && <div className="grid sm:grid-cols-2 gap-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 p-4">
              <label className="text-xs text-slate-400 space-y-2">{t.youtubeMode}
                <select value={options.mode} onChange={e => setOptions(p => ({ ...p, mode: e.target.value as ResolveOptions['mode'] }))} className="block w-full bg-[#121222] border border-white/10 rounded-xl p-2.5 text-slate-200">
                  <option value="auto">{t.modeVideo}</option><option value="audio">{t.modeAudio}</option><option value="metadata">{t.modeMetadata}</option>
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-2">{t.qualityLabel}
                <select value={options.quality} disabled={options.mode !== 'auto'} onChange={e => setOptions(p => ({ ...p, quality: e.target.value as ResolveOptions['quality'] }))} className="block w-full bg-[#121222] border border-white/10 rounded-xl p-2.5 text-slate-200 disabled:opacity-40">
                  <option value="max">{t.qualityMax}</option>{['2160', '1080', '720', '480', '360'].map(q => <option key={q} value={q}>{q}p</option>)}
                </select>
              </label>
              <p className="sm:col-span-2 text-xs leading-relaxed text-amber-200/80">{t.youtubeAvailable}</p>
            </div>}
            {intake.invalid.length > 0 && <div role="status" className="text-xs text-amber-300 border border-amber-500/20 bg-amber-500/5 p-3 rounded-xl break-all"><p>{t.invalidLines} · {intake.invalid.length}</p><ul className="mt-2 space-y-1">{intake.invalid.slice(0, 5).map((s, i) => <li key={i}>{s.slice(0, 160)}</li>)}</ul></div>}
            {intake.duplicates > 0 && <p className="text-xs text-slate-400">{t.duplicatesRemoved} · {intake.duplicates}</p>}

            {/* Detección en vivo, sin lanzar nada */}
            {pendingLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pendingLinks.map((link, i) => {
                  const style = PLATFORM_STYLE[pendingPlatforms[i]];
                  return (
                    <span
                      key={`${link}-${i}`}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white/[0.03] text-[11px] font-bold ${style.ring} ${style.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {pendingPlatforms[i] === 'unknown' ? t.unsupportedTag : style.label}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={busy || !pendingLinks.length}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-indigo-950/50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {busy ? t.btn_fetching : t.btn_analyze}
              </button>

              <button
                type="button"
                onClick={pasteFromClipboard}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-4 h-4 text-indigo-400" />
                {t.btn_paste}
              </button>

              {busy && (
                <button
                  type="button"
                  onClick={cancelResolve}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  {t.btn_cancel}
                </button>
              )}

              {jobs.length > 0 && !busy && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  {t.btn_clear}
                </button>
              )}

              <span className="text-[11px] text-slate-600 font-medium ml-auto hidden sm:block">{t.shortcutHint}</span>
            </div>

            {formError && (
              <div className="p-3.5 bg-red-950/25 border border-red-900/50 rounded-2xl text-red-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}
          </form>

          {/* Vía manual: saltarse el resolutor por completo */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setManualOpen(v => !v)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
            >
              <Plus className={`w-4 h-4 text-indigo-400 transition-transform ${manualOpen ? 'rotate-45' : ''}`} />
              <span className="text-sm font-bold text-white">{t.manualTitle}</span>
              <span className="text-[11px] text-slate-500 hidden sm:block ml-auto">{t.manualHint}</span>
            </button>
            {manualOpen && (
              <div className="px-5 pb-5 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">{t.manualText}</p>
                <ManualInput
                  t={t}
                  onAdd={url => {
                    const result = directResult(url);
                    setJobs(prev => [
                      ...prev,
                      { key: nextJobKey(), url, platform: 'direct', status: 'ready', result, selected: result.assets.map(a => a.id) },
                    ]);
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Cola de resultados                                               */}
        {/* ================================================================ */}
        {jobs.length > 0 && (
          <section className="space-y-5" aria-label={t.queueTitle}>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
              {t.queueTitle} · {jobs.length}
            </h2>
            <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
              <span className="text-xs text-emerald-300">{t.status_ready} · {jobs.filter(j => j.status === 'ready').length} / {jobs.length}</span>
              <button disabled={batchBusy || !selectedCount || Object.values(transfers).some(x => x.status === 'active')} onClick={() => void downloadBatch(jobs)} className="px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold disabled:opacity-40">{batchBusy ? t.btn_fetching : t.downloadQueue} · {selectedCount}</button>
              <button disabled={busy || !jobs.some(j => j.status === 'error')} onClick={() => void runResolve(jobs.filter(j => j.status === 'error'))} className="text-xs text-indigo-300 disabled:opacity-40">{t.retryFailed}</button>
              {batchBusy && <button onClick={() => { batchAbort.current?.abort(); transferAborts.current.forEach(c => c.abort()); setBatchMessage(t.err_cancelled); }} className="text-xs text-red-300">{t.btn_cancel}</button>}
              <span role="status" className="text-xs text-slate-400">{batchMessage}</span>
            </div>
            {jobs.map(job => (
              <JobCard
                key={job.key}
                job={job}
                t={t}
                lang={lang}
                busy={busy || batchBusy}
                transfers={transfers}
                assetLabel={assetLabel}
                errorText={errorText}
                onToggle={toggleAsset}
                onSelectAll={setAllAssets}
                onDownloadAsset={downloadAsset}
                onDownloadSelected={downloadSelected}
                onCancelTransfer={cancelTransfer}
                onRetry={retryJob}
                onRemove={removeJob}
                onGetResult={downloadOne}
              />
            ))}
          </section>
        )}

        {/* ================================================================ */}
        {/* Qué se puede descargar de verdad (sin promesas falsas)           */}
        {/* ================================================================ */}
        <section className="glass-card rounded-3xl border border-white/5 p-6 md:p-8 space-y-5">
          <h2 className="text-lg md:text-xl font-black text-white tracking-tight">{t.supportTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'supportTiktok', platform: 'tiktok' as Platform, full: true },
              { key: 'supportTwitter', platform: 'twitter' as Platform, full: true },
              { key: youtubeMedia ? 'youtubeAvailable' : 'supportYoutube', platform: 'youtube' as Platform, full: youtubeMedia },
              { key: 'supportInstagram', platform: 'instagram' as Platform, full: false },
            ].map(row => (
              <div key={row.key} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <span
                  className={`mt-0.5 w-6 h-6 shrink-0 rounded-lg flex items-center justify-center ${
                    row.full ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {row.full ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <AlertCircle className="w-3.5 h-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${PLATFORM_STYLE[row.platform].text}`}>
                    {PLATFORM_STYLE[row.platform].label}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{t[row.key]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Cómo funciona                                                    */}
        {/* ================================================================ */}
        {howSteps.length > 0 && (
          <section className="space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.howTitle}</h2>
              <div className="h-1 w-16 bg-indigo-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {howSteps.slice(0, 3).map((step, i) => {
                const Art = stepArt[i] || StepPasteArt;
                return (
                  <div key={i} className="glass-card rounded-3xl border border-white/5 p-6 space-y-4">
                    <Art animated={animated} className="w-full h-28" />
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-300 text-[11px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <h3 className="text-white font-bold text-base">{step.title}</h3>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================ */}
        {/* Características                                                  */}
        {/* ================================================================ */}
        {features.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = featureIcons[i] || IconNoWatermark;
              return (
                <div
                  key={i}
                  className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:border-indigo-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-base font-bold mb-2 group-hover:text-indigo-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ================================================================ */}
        {/* SEO                                                              */}
        {/* ================================================================ */}
        <section className="space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tighter">
                {t.seoHeroTitle}
              </h2>
              <p className="text-slate-400 leading-relaxed">{t.seoHeroText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(t.seoHeroList || []).map((point: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <span className="w-6 h-6 shrink-0 bg-indigo-500/20 text-indigo-300 rounded-lg flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-slate-300 font-bold text-xs">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 py-12 flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl" />
              <IconLinkShield className="w-16 h-16 text-indigo-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl font-black text-white tracking-tight">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#0a0a14] border border-white/5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-indigo-500 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-indigo-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="glass-card rounded-2xl px-5 sm:px-6 py-5 border border-white/5 hover:border-indigo-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-indigo-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
            <div className="max-w-4xl mx-auto w-full space-y-4 opacity-60 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map(keyword => (
                  <span
                    key={keyword}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t.scrollTopLabel || 'Back to top'}
          className="fixed bottom-8 right-8 z-[200] w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={modal.title}
        content={modal.content}
        t={t}
      />
    </div>
  );
};

// ===========================================================================
// Entrada del modo manual
// ===========================================================================

const ManualInput: React.FC<{ t: any; onAdd: (url: string) => void }> = ({ t, onAdd }) => {
  const [value, setValue] = useState('');
  const valid = isDirectMediaUrl(value.trim());

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && valid) {
            onAdd(value.trim());
            setValue('');
          }
        }}
        placeholder={t.manualPlaceholder}
        className="flex-1 min-w-0 px-4 py-3 bg-black/40 border border-white/10 rounded-2xl text-slate-200 outline-none focus:border-indigo-500/60 placeholder:text-slate-600 font-mono text-xs"
      />
      <button
        type="button"
        disabled={!valid}
        onClick={() => {
          onAdd(value.trim());
          setValue('');
        }}
        className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-indigo-500/15 border border-white/10 hover:border-indigo-500/30 text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        {t.manualAdd}
      </button>
    </div>
  );
};

// ===========================================================================
// Tarjeta de un enlace resuelto
// ===========================================================================

interface JobCardProps {
  job: Job;
  t: any;
  lang: string;
  /** Hay una tanda resolviéndose: reintentar ahora la abortaría. */
  busy: boolean;
  transfers: Record<string, Transfer>;
  assetLabel: (asset: Asset) => string;
  errorText: (key: string) => string;
  onToggle: (job: Job, assetId: string) => void;
  onSelectAll: (job: Job, all: boolean) => void;
  onDownloadAsset: (job: Job, asset: Asset) => void;
  onDownloadSelected: (job: Job) => void;
  onCancelTransfer: (id: string) => void;
  onRetry: (job: Job) => void;
  onRemove: (key: string) => void;
  onGetResult: (job: Job, asset: Asset) => Promise<{ blob: Blob; name: string } | null>;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  t,
  lang,
  busy,
  transfers,
  assetLabel,
  errorText,
  onToggle,
  onSelectAll,
  onDownloadAsset,
  onDownloadSelected,
  onCancelTransfer,
  onRetry,
  onRemove,
  onGetResult,
}) => {
  const style = PLATFORM_STYLE[job.platform];
  const result = job.result;
  const primary = result?.assets.find(a => job.selected.includes(a.id)) || result?.assets[0];
  const previewVideo = primary?.kind === 'video' && !primary.external ? primary : result?.assets.find(a => a.kind === 'video' && !a.external);
  const downloading = busy || Object.entries(transfers).some(([id, x]) => id.startsWith(`${job.key}:`) && x.status === 'active');

  return (
    <article className="glass-card rounded-3xl border border-white/10 overflow-hidden">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/5">
        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-black ${style.ring} ${style.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {style.label}
        </span>
        <span className="text-[11px] text-slate-500 font-mono truncate flex-1 min-w-[8rem]">{job.url}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
          {t[`status_${job.status}`] || job.status}
        </span>
        <button
          onClick={() => onRemove(job.key)}
          aria-label={t.btn_remove}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {(job.status === 'queued' || job.status === 'resolving') && (
        <div className="px-5 py-8 flex items-center justify-center gap-3 text-slate-400 text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          {t[`status_${job.status}`]}
        </div>
      )}

      {job.status === 'error' && (
        <div className="px-5 py-6 space-y-3">
          <div className="flex items-start gap-3 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <p className="font-semibold leading-relaxed">{errorText(job.errorKey || 'resolve_failed')}</p>
          </div>
          <button
            onClick={() => onRetry(job)}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.btn_retry}
          </button>
        </div>
      )}

      {job.status === 'ready' && result && (
        <div className="p-5 space-y-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Vista previa */}
            <div className="w-full lg:w-64 shrink-0 space-y-3">
              {primary?.kind === 'audio' ? <audio controls preload="none" src={primary.url} className="w-full" /> : previewVideo ? (
                <video
                  src={previewVideo.url}
                  poster={result.thumbnail || undefined}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full rounded-2xl bg-black border border-white/5 max-h-[340px]"
                />
              ) : result.thumbnail ? (
                <img
                  src={result.thumbnail}
                  alt=""
                  className="w-full rounded-2xl bg-black border border-white/5 object-cover max-h-[340px]"
                />
              ) : (
                <div className="w-full aspect-video rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-slate-700">
                  <FileVideo className="w-10 h-10" />
                </div>
              )}
            </div>

            {/* Metadatos + assets */}
            <div className="flex-1 min-w-0 space-y-4">
              {(result.author.name || result.title) && (
                <div className="space-y-2">
                  {result.author.name && (
                    <div className="flex items-center gap-3">
                      {result.author.avatar ? (
                        <img src={result.author.avatar} alt="" className="w-9 h-9 rounded-full border border-white/10" />
                      ) : null}
                      <div className="min-w-0">
                        <p className="text-white font-bold text-sm truncate">{result.author.name}</p>
                        {result.author.handle && (
                          <p className="text-slate-500 text-[11px] font-mono truncate">{result.author.handle}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {result.title && <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{result.title}</p>}
                </div>
              )}

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-bold text-slate-400">
                {result.duration > 0 && <span>{formatDuration(result.duration)}</span>}
                {result.stats.views !== null && <span>{formatCount(result.stats.views)} {t.views}</span>}
                {result.stats.likes !== null && <span>{formatCount(result.stats.likes)} {t.likes}</span>}
                {result.stats.comments !== null && <span>{formatCount(result.stats.comments)} {t.comments}</span>}
                {result.stats.shares !== null && <span>{formatCount(result.stats.shares)} {t.shares}</span>}
              </div>

              {result.warnings.map(warning => (
                <p key={warning} className="text-[11px] text-amber-300/90 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 leading-relaxed">
                  {t[`warn_${warning}`] || warning}
                </p>
              ))}

              {/* Selector de assets */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {t.assetsTitle}
                  </span>
                  <button
                    onClick={() => onSelectAll(job, job.selected.length !== result.assets.length)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {job.selected.length === result.assets.length ? t.selectNone : t.selectAll}
                  </button>
                </div>

                <div className="grid gap-2">
                  {result.assets.map(asset => {
                    const transferId = `${job.key}:${asset.id}`;
                    const transfer = transfers[transferId];
                    const checked = job.selected.includes(asset.id);
                    const pct =
                      transfer && transfer.total > 0
                        ? Math.min(100, Math.round((transfer.received / transfer.total) * 100))
                        : transfer?.status === 'done'
                          ? 100
                          : 0;
                    return (
                      <div
                        key={asset.id}
                        className={`relative overflow-hidden flex flex-wrap items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                          checked ? 'border-indigo-500/40 bg-indigo-500/[0.07]' : 'border-white/5 bg-white/[0.02]'
                        }`}
                      >
                        {transfer?.status === 'active' && (
                          <div
                            className="absolute inset-y-0 left-0 bg-indigo-500/15 transition-[width] duration-200"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        <label className="relative flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggle(job, asset.id)}
                            className="w-4 h-4 shrink-0 accent-indigo-500 cursor-pointer"
                          />
                          <span className="text-indigo-400 shrink-0">{KIND_ICON[asset.kind]}</span>
                          <span className="text-xs font-bold text-slate-200 truncate">{assetLabel(asset)}</span>
                          {asset.badge && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-black">
                              {asset.badge}
                            </span>
                          )}
                          {asset.bytes ? (
                            <span className="shrink-0 text-[10px] text-slate-500 font-mono">{formatBytes(asset.bytes)}</span>
                          ) : null}
                        </label>

                        <div className="relative flex items-center gap-2 shrink-0">
                          {transfer?.status === 'active' ? (
                            <>
                              <span className="text-[10px] font-mono text-indigo-300">
                                {transfer.total > 0 ? `${pct}%` : formatBytes(transfer.received)}
                              </span>
                              <button
                                onClick={() => onCancelTransfer(transferId)}
                                aria-label={t.btn_cancel}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onDownloadAsset(job, asset)}
                              aria-label={`${t.btn_download} — ${assetLabel(asset)}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            >
                              {transfer?.status === 'done' ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={() => onDownloadSelected(job)}
                  disabled={!job.selected.length || downloading}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  {job.selected.length > 1 ? t.btn_download_zip : t.btn_download_selected}
                  {job.selected.length > 0 && <span className="opacity-70">· {job.selected.length}</span>}
                </button>
                <button onClick={() => saveBlob(new Blob([JSON.stringify({ source: job.url, title: result.title, author: result.author, duration: result.duration, stats: result.stats, files: result.assets.map(({ url: _url, ...asset }) => asset) }, null, 2)], { type: 'application/json' }), `${result.platform}-${result.id || 'media'}.json`)} className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5">{t.saveMetadata}</button>
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:bg-white/5">{t.openOriginal}</a>
              </div>
            </div>
          </div>

          {primary && (
            <NextStepBar
              lang={lang}
              t={t}
              kind={primary.kind}
              getResult={() => onGetResult(job, primary)}
            />
          )}
        </div>
      )}
    </article>
  );
};
