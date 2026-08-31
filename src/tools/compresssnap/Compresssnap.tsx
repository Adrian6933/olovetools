import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertTriangle,
  Check,
  Cpu,
  Download,
  Eye,
  ImageDown,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import type { Language } from '../../locales/meta';
import { useHandoffIntake } from '../../lib/useHandoff';

import type { CompressItem, CompressSettings } from './lib/types';
import { DEFAULT_SETTINGS } from './lib/types';
import { ACCEPTED_TYPES, decodeFile, isSupportedImage } from './lib/decode';
import { ssimBand } from './lib/metrics';
import { useCompressor } from './lib/useCompressor';

import {
  CompressHeroArt, IconBudget, IconFormats, IconLocal, IconMeasure, IconPalette, IconWorker,
  StepChoose, StepDrop, StepRun, StepTake,
} from './components/Illustrations';
import { SettingsPanel } from './components/SettingsPanel';
import { CompareStage } from './components/CompareStage';
import { NextStepBar } from './components/NextStepBar';

interface CompresssnapProps {
  lang: Language;
  dictionary?: any;
}

const FEATURE_ICONS = [IconWorker, IconBudget, IconMeasure, IconPalette, IconFormats, IconLocal];
const STEP_ART = [StepDrop, StepChoose, StepRun, StepTake];

/**
 * Two encodes in flight at once. More does not go faster — there is one worker
 * and the encoder is CPU-bound — but it does keep two full-resolution bitmaps
 * alive at the same time, which is how a batch of 48 MP photos runs a tab out
 * of memory.
 */
const CONCURRENCY = 2;

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

const BAND_KEY: Record<string, string> = {
  identical: 'bandIdentical',
  excellent: 'bandExcellent',
  good: 'bandGood',
  fair: 'bandFair',
  poor: 'bandPoor',
};
const BAND_FALLBACK: Record<string, string> = {
  identical: 'Indistinguishable',
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Visible loss',
};
const BAND_CLASS: Record<string, string> = {
  identical: 'text-emerald-300',
  excellent: 'text-emerald-300',
  good: 'text-cyan-300',
  fair: 'text-amber-300',
  poor: 'text-red-300',
};

export const Compresssnap: React.FC<CompresssnapProps> = ({ lang, dictionary }) => {
  const t = dictionary || {};

  const [items, setItems] = useState<CompressItem[]>([]);
  const [settings, setSettings] = useState<CompressSettings>(DEFAULT_SETTINGS);
  const [running, setRunning] = useState(false);
  const [compareId, setCompareId] = useState<string>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState(0);

  const fileInput = useRef<HTMLInputElement>(null);
  const cancelled = useRef(false);
  // Every object URL this component ever made, so unmount can free the lot.
  // Relying on the item list alone leaks the ones removed mid-run.
  const urls = useRef<Set<string>>(new Set());

  const { run, formats, usingWorker } = useCompressor();

  const track = useCallback((url: string) => {
    urls.current.add(url);
    return url;
  }, []);

  const release = useCallback((url: string) => {
    if (!url) return;
    urls.current.delete(url);
    URL.revokeObjectURL(url);
  }, []);

  useEffect(
    () => () => {
      cancelled.current = true;
      urls.current.forEach(url => URL.revokeObjectURL(url));
      urls.current.clear();
    },
    []
  );

  const formatBytes = useCallback((bytes: number): string => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${parseFloat((bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1))} ${units[i]}`;
  }, []);

  // --------------------------------------------------------------------------
  // Intake. Adding files never starts an encode: they queue, and the button
  // starts the work. Dropping forty photos used to lock the tab for a minute
  // before the user had chosen a single setting.
  // --------------------------------------------------------------------------
  const addFiles = useCallback(
    (incoming: FileList | File[], from = '') => {
      const list = Array.from(incoming);
      const accepted = list.filter(isSupportedImage);
      const skipped = list.length - accepted.length;
      if (skipped > 0) setRejected(count => count + skipped);
      if (accepted.length === 0) return;

      setItems(prev => [
        ...prev,
        ...accepted.map(file => ({
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          name: file.name,
          originalSize: file.size,
          originalUrl: track(URL.createObjectURL(file)),
          width: null,
          height: null,
          sourceMime: file.type || '',
          status: 'queued' as const,
          result: null,
          error: null,
          settings: null,
          appliedSettings: null,
          from,
        })),
      ]);
    },
    [track]
  );

  useHandoffIntake((file, from) => addFiles([file], from));

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = event.clipboardData && event.clipboardData.files;
      if (files && files.length > 0) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // --------------------------------------------------------------------------
  // The run
  // --------------------------------------------------------------------------
  const patch = useCallback((id: string, changes: Partial<CompressItem>) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...changes } : item)));
  }, []);

  const compressOne = useCallback(
    async (item: CompressItem, active: CompressSettings) => {
      patch(item.id, { status: 'decoding', error: null });
      try {
        // Decoding stays here: the HEIC and TIFF converters are dynamic
        // imports, which cannot live inside a bundled worker.
        const decoded = await decodeFile(item.file);
        if (cancelled.current) {
          decoded.bitmap.close();
          return;
        }
        const width = decoded.bitmap.width;
        const height = decoded.bitmap.height;
        patch(item.id, { status: 'working', width, height, sourceMime: decoded.mime });

        const outcome = await run(decoded.bitmap, active, decoded.mime);
        if (cancelled.current) return;

        // Re-encoding can easily make a file bigger — a screenshot PNG pushed
        // through JPEG at quality 95 is the classic case. Saying so and
        // keeping the original beats silently handing back a worse file.
        if (outcome.blob.size >= item.originalSize) {
          patch(item.id, {
            status: 'skipped',
            result: null,
            appliedSettings: active,
            error: null,
          });
          return;
        }

        setItems(prev =>
          prev.map(current => {
            if (current.id !== item.id) return current;
            if (current.result) release(current.result.url);
            return {
              ...current,
              status: 'done',
              appliedSettings: active,
              result: {
                blob: outcome.blob,
                url: track(URL.createObjectURL(outcome.blob)),
                bytes: outcome.blob.size,
                width: outcome.width,
                height: outcome.height,
                mime: outcome.mime,
                quality: outcome.quality,
                ssim: outcome.ssim,
                ms: outcome.ms,
                attempts: outcome.attempts,
              },
            };
          })
        );
      } catch (error) {
        if (!cancelled.current) patch(item.id, { status: 'error', error: String(error) });
      }
    },
    [patch, release, run, track]
  );

  const compressAll = useCallback(async () => {
    if (running) return;
    setRunning(true);
    cancelled.current = false;

    // Snapshot the queue: `items` changes on every result, and a loop reading
    // it live would process the same file twice.
    const queue = items.filter(item => item.status === 'queued' || item.status === 'error');
    let cursor = 0;

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (cursor < queue.length && !cancelled.current) {
        const item = queue[cursor++];
        await compressOne(item, item.settings || settings);
      }
    });

    await Promise.all(workers);
    if (!cancelled.current) setRunning(false);
  }, [items, running, settings, compressOne]);

  /** Any change to the settings makes the finished results stale, not wrong. */
  const stale = useMemo(
    () =>
      items.some(
        item =>
          (item.status === 'done' || item.status === 'skipped') &&
          item.appliedSettings &&
          JSON.stringify(item.appliedSettings) !== JSON.stringify(item.settings || settings)
      ),
    [items, settings]
  );

  const queued = items.filter(item => item.status === 'queued' || item.status === 'error').length;
  const done = items.filter(item => item.status === 'done');
  const busy = items.some(item => item.status === 'decoding' || item.status === 'working');

  const requeueAll = useCallback(() => {
    setItems(prev => prev.map(item => (item.status === 'done' || item.status === 'skipped' ? { ...item, status: 'queued' } : item)));
  }, []);

  // --------------------------------------------------------------------------
  // Output
  // --------------------------------------------------------------------------
  const nameFor = useCallback((item: CompressItem): string => {
    const mime = item.result ? item.result.mime : item.sourceMime;
    const ext = EXTENSION[mime] || 'jpg';
    const dot = item.name.lastIndexOf('.');
    const base = dot > 0 ? item.name.slice(0, dot) : item.name;
    return `${base}-min.${ext}`;
  }, []);

  const saveBlob = useCallback((blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    // Next tick, not synchronously: Firefox cancels a download whose object
    // URL is released in the same task as the click.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, []);

  const downloadOne = useCallback(
    (item: CompressItem) => {
      if (!item.result) return;
      saveBlob(item.result.blob, nameFor(item));
    },
    [nameFor, saveBlob]
  );

  const downloadAll = useCallback(async () => {
    if (done.length === 0) return;
    const zip = new JSZip();
    // The blobs are already in memory — the old build fetched each object URL
    // back out of the browser to get them again.
    done.forEach((item, index) => zip.file(`${String(index + 1).padStart(2, '0')}_${nameFor(item)}`, item.result.blob));
    const archive = await zip.generateAsync({ type: 'blob' });
    saveBlob(archive, 'compressed-images.zip');
  }, [done, nameFor, saveBlob]);

  const removeItem = useCallback(
    (id: string) => {
      setItems(prev => {
        const target = prev.find(item => item.id === id);
        if (target) {
          release(target.originalUrl);
          if (target.result) release(target.result.url);
        }
        return prev.filter(item => item.id !== id);
      });
      setCompareId(current => (current === id ? null : current));
    },
    [release]
  );

  const resetAll = useCallback(() => {
    cancelled.current = true;
    setItems(prev => {
      prev.forEach(item => {
        release(item.originalUrl);
        if (item.result) release(item.result.url);
      });
      return [];
    });
    setSettings(DEFAULT_SETTINGS);
    setCompareId(null);
    setRunning(false);
    setRejected(0);
  }, [release]);

  const handoffResult = useCallback(() => {
    const first = done[0];
    if (!first) return null;
    return { blob: first.result.blob, name: nameFor(first) };
  }, [done, nameFor]);

  // --------------------------------------------------------------------------
  // Totals
  // --------------------------------------------------------------------------
  const totals = useMemo(() => {
    const before = done.reduce((sum, item) => sum + item.originalSize, 0);
    const after = done.reduce((sum, item) => sum + item.result.bytes, 0);
    const measured = done.filter(item => item.result.ssim !== null);
    return {
      before,
      after,
      saved: before > 0 ? Math.round(((before - after) / before) * 100) : 0,
      ssim: measured.length > 0 ? measured.reduce((sum, item) => sum + item.result.ssim, 0) / measured.length : null,
    };
  }, [done]);

  const compared = compareId ? items.find(item => item.id === compareId) : null;
  const sourceMime = items.length > 0 ? items[0].sourceMime : '';

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const features = Array.isArray(t.features) ? t.features : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const steps = [1, 2, 3, 4].map((n, i) => ({
    title: t[`step${n}Title`] || '',
    text: t[`step${n}Text`] || '',
    art: STEP_ART[i],
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#060b11] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={(l: string) => (window.location.href = `/${l.toLowerCase()}/compresssnap`)}
        onReset={resetAll}
        t={t}
      />

      {/* The max width lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit. */}
      <main className="flex-1 flex flex-col items-center pt-40 md:pt-36 pb-24 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-compresssnap-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(6,182,212,0.15)]">
                <ImageDown className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">{t.description}</p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full" />
              <CompressHeroArt className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 min-w-0 space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={event => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={event => {
                  event.preventDefault();
                  setDragging(false);
                  if (event.dataTransfer.files.length > 0) addFiles(event.dataTransfer.files);
                }}
                onClick={() => fileInput.current && fileInput.current.click()}
                className={`group border-2 border-dashed rounded-3xl p-10 md:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                  dragging
                    ? 'border-cyan-400/70 bg-cyan-500/[0.07]'
                    : 'border-cyan-950 hover:border-cyan-500/40 bg-[#080d16]/30'
                }`}
              >
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={event => {
                    if (event.target.files) addFiles(event.target.files);
                    event.target.value = '';
                  }}
                />
                <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400 shadow-lg shadow-black/40 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 text-center">
                  <h3 className="text-lg font-bold text-white tracking-tight">{t.dropzonePrompt}</h3>
                  <p className="text-slate-500 text-xs font-medium">{t.dropzoneSubtitle}</p>
                </div>
              </div>

              {rejected > 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{(t.rejectedFiles || '{n} file(s) were not images and were left out.').replace('{n}', String(rejected))}</span>
                </div>
              )}

              {/* Run bar */}
              {items.length > 0 && (
                <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3 border border-white/5">
                  <button
                    onClick={compressAll}
                    disabled={running || busy || queued === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 border border-cyan-500 text-white text-xs font-black hover:bg-cyan-500 transition-all cursor-pointer outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {running || busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {running || busy
                      ? t.statusCompressing || 'Compressing…'
                      : (t.compressBtn || 'Compress {n}').replace('{n}', String(queued))}
                  </button>

                  {stale && !running && !busy && (
                    <button
                      onClick={requeueAll}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] font-bold hover:bg-amber-500/25 transition-all cursor-pointer outline-none"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t.recompressBtn || 'Settings changed — run again'}
                    </button>
                  )}

                  {done.length > 0 && (
                    <button
                      onClick={downloadAll}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.downloadAllBtn || 'Download all (ZIP)'}
                    </button>
                  )}

                  <button
                    onClick={resetAll}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.clearBtn || 'Clear'}
                  </button>

                  <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-slate-600" title={t.workerHint || ''}>
                    <Cpu className="w-3 h-3" />
                    {usingWorker ? t.workerOn || 'off main thread' : t.workerOff || 'main thread'}
                  </span>
                </div>
              )}

              {/* Totals */}
              {done.length > 0 && (
                <div className="glass-card rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border border-white/5">
                  <div className="text-center">
                    <div className="text-lg font-black text-white tabular-nums">{formatBytes(totals.before)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.originalSize || 'before'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-cyan-300 tabular-nums">{formatBytes(totals.after)}</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.compressedSize || 'after'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-300 tabular-nums">−{totals.saved}%</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.savings || 'saved'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black text-white tabular-nums">
                      {totals.ssim === null ? '—' : totals.ssim.toFixed(3)}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold">{t.avgSsim || 'avg SSIM'}</div>
                  </div>
                </div>
              )}

              {/* Queue */}
              <div className="space-y-2">
                {items.map(item => {
                  const band = item.result && item.result.ssim !== null ? ssimBand(item.result.ssim) : null;
                  return (
                    <div key={item.id} className="glass-card rounded-2xl p-3 flex items-center gap-3 border border-white/5">
                      <img
                        src={item.originalUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover bg-black/40 shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{item.name}</span>
                          {item.from && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold shrink-0">
                              {item.from}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-mono text-slate-500">
                          <span>{formatBytes(item.originalSize)}</span>
                          {item.result && (
                            <>
                              <span className="text-cyan-300">→ {formatBytes(item.result.bytes)}</span>
                              <span className="text-emerald-300">
                                −{Math.round(((item.originalSize - item.result.bytes) / item.originalSize) * 100)}%
                              </span>
                              <span>
                                {item.result.width}×{item.result.height}
                              </span>
                              {band && (
                                <span className={BAND_CLASS[band]}>
                                  {item.result.ssim.toFixed(3)} · {t[BAND_KEY[band]] || BAND_FALLBACK[band]}
                                </span>
                              )}
                              {item.result.attempts > 1 && (
                                <span title={t.attemptsHint || 'Encodes needed to fit the budget'}>
                                  q{item.result.quality} · {item.result.attempts}×
                                </span>
                              )}
                            </>
                          )}
                          {item.status === 'queued' && <span className="text-slate-600">{t.statusQueued || 'waiting'}</span>}
                          {item.status === 'decoding' && <span className="text-cyan-400">{t.statusDecoding || 'decoding…'}</span>}
                          {item.status === 'working' && <span className="text-cyan-400">{t.statusCompressing || 'compressing…'}</span>}
                          {item.status === 'skipped' && (
                            <span className="text-amber-300">{t.statusSkipped || 'already smaller than we could make it'}</span>
                          )}
                          {item.status === 'error' && <span className="text-red-300">{t.statusError || 'failed'}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.result && (
                          <>
                            <button
                              onClick={() => setCompareId(item.id)}
                              title={t.compareBtn || 'Compare'}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-cyan-500/40 flex items-center justify-center transition-all cursor-pointer outline-none"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadOne(item)}
                              title={t.downloadBtn || 'Download'}
                              className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 hover:bg-cyan-600/30 flex items-center justify-center transition-all cursor-pointer outline-none"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          title={t.removeBtn || 'Remove'}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-red-300 hover:border-red-500/40 flex items-center justify-center transition-all cursor-pointer outline-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 min-w-0 space-y-5">
              <div className="glass-card rounded-3xl p-5 md:p-6 border border-white/5">
                <SettingsPanel
                  settings={settings}
                  onChange={changes => setSettings(current => ({ ...current, ...changes }))}
                  available={formats}
                  t={t}
                  sourceMime={sourceMime}
                />
              </div>
              <NextStepBar lang={lang} t={t} disabled={done.length === 0} getResult={handoffResult} />
            </div>
          </section>

          <AdBanner id="adsense-compresssnap-mid" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-cyan-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto" />
                    <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                    <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/* Features                                                         */}
          {/* ================================================================ */}
          {features.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature: any, idx: number) => {
                const Icon = FEATURE_ICONS[idx] || IconLocal;
                return (
                  <div
                    key={idx}
                    className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-110 group-hover:border-cyan-500/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-cyan-400 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                  </div>
                );
              })}
            </section>
          )}

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                {keywords.length > 0 && (
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[11px] font-black uppercase tracking-[0.2em] border border-cyan-500/20">
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
                      <span className="w-7 h-7 shrink-0 bg-cyan-500/20 text-cyan-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
                <IconMeasure className="w-20 h-20 text-cyan-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#080d16] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-cyan-500 rounded-full" />
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
            </div>

            {faqs.length > 0 && (
              <div className="max-w-4xl mx-auto w-full space-y-10">
                <div className="text-center space-y-3">
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                  <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-cyan-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-cyan-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                  {t.seoKeywordsTitle || 'Keywords'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {keywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 hover:text-cyan-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-compresssnap-bottom" />
      </main>

      <Footer lang={lang} t={t} />

      {compared && (
        <CompareStage
          item={compared}
          onClose={() => setCompareId(null)}
          onDownload={() => downloadOne(compared)}
          formatBytes={formatBytes}
          t={t}
        />
      )}

    </div>
  );
};

export default Compresssnap;
