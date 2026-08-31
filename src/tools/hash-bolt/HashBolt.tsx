import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  File as FileIcon,
  FileText,
  FolderOpen,
  Hash,
  KeyRound,
  Loader2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import {
  FingerprintArt,
  HashHeroArt,
  IconBatch,
  IconKeyed,
  IconLocalOnly,
  IconMultiHash,
  IconStream,
  IconVerify,
  StepBring,
  StepChoose,
  StepCompare,
  StepCompute,
} from './components/Illustrations';
import { legalTranslations } from '../../locales/legal';
import { AdBanner } from '../../components/shared/AdBanner';
import { fadeInUp, useReducedMotion } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { ALGORITHMS, ALGO_BY_ID, DEFAULT_ALGOS, sortAlgos, type AlgoGroup, type AlgoId } from './lib/algorithms';
import { formatBytes, formatDigest, formatDuration, formatSpeed, groupDigest, type OutputFormat } from './lib/format';
import { buildSumsFile, compareHashes, matchFile, parseExpected, type MatchReport } from './lib/verify';
import { useHashEngine } from './lib/useHashEngine';

interface HashBoltProps {
  lang: string;
  dictionary: any;
}

type Mode = 'file' | 'text' | 'compare';
type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled';

interface Job {
  id: string;
  file: File;
  status: JobStatus;
  digests: Partial<Record<AlgoId, string>>;
  loaded: number;
  bytesPerSecond: number;
  ms: number;
  error?: string;
  /** Which settings produced `digests`; a change makes the result stale. */
  signature: string;
}

const GROUP_KEYS: Record<AlgoGroup, { key: string; fallback: string }> = {
  checksum: { key: 'groupChecksum', fallback: 'Checksums & legacy' },
  sha2: { key: 'groupSha2', fallback: 'SHA-2 family' },
  modern: { key: 'groupModern', fallback: 'Modern' },
};

// ============================================================================
// Presentational pieces. Declared at module level on purpose: nested inside the
// component they would be a brand-new component type on every render, and the
// whole result list would remount on each 120 ms progress tick.
// ============================================================================
const DigestRow: React.FC<{
  label: string;
  value: string;
  highlight?: boolean;
  copied: boolean;
  copyLabel: string;
  onCopy: () => void;
}> = ({ label, value, highlight, copied, copyLabel, onCopy }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-start gap-2 rounded-xl border px-3 py-2.5 transition-colors ${
      highlight ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/5 bg-black/25'
    }`}
  >
    <span className="flex items-center gap-1.5 shrink-0 sm:w-28">
      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">{label}</span>
      {highlight && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
    </span>
    <span className="flex-1 min-w-0 font-mono text-[12px] leading-relaxed text-slate-200 break-all select-all">
      {value}
    </span>
    <button
      onClick={onCopy}
      aria-label={copyLabel}
      className="shrink-0 self-start text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  </div>
);

const VerdictBanner: React.FC<{ report: MatchReport; t: any }> = ({ report, t }) => {
  if (report.state === 'match') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[12px] font-bold text-emerald-300 leading-snug">
          {(t.verifyMatch || 'Match — the same {algo} digest.').replace('{algo}', ALGO_BY_ID[report.algo].label)}
        </p>
      </div>
    );
  }
  if (report.state === 'mismatch') {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3">
        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <p className="text-[12px] font-bold text-red-300 leading-snug">
          {t.verifyMismatch || 'No match. This file is not the one that checksum describes.'}
        </p>
      </div>
    );
  }
  if (report.lengthUnsupported) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[12px] font-bold text-amber-300 leading-snug">
          {t.verifyUnknownLength ||
            'That checksum length matches none of the algorithms you ticked. Tick the right one and compute again.'}
        </p>
      </div>
    );
  }
  return null;
};

let jobSeq = 0;
const nextJobId = () => `job-${++jobSeq}-${Date.now().toString(36)}`;

export default function HashBolt({ lang, dictionary }: HashBoltProps) {
  const t = dictionary || {};
  const prefersReduced = useReducedMotion();
  const { hashFile, hashBytes, cancel } = useHashEngine();

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [mode, setMode] = useState<Mode>('file');

  // Settings
  const [algos, setAlgos] = useState<AlgoId[]>(DEFAULT_ALGOS);
  const [format, setFormat] = useState<OutputFormat>('hex');
  const [uppercase, setUppercase] = useState(false);
  const [grouped, setGrouped] = useState(false);
  const [hmacOn, setHmacOn] = useState(false);
  const [hmacKey, setHmacKey] = useState('');
  const [algoPanelOpen, setAlgoPanelOpen] = useState(true);

  // File mode
  const [jobs, setJobs] = useState<Job[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const abortRun = useRef(false);

  // Text mode
  const [text, setText] = useState('');
  const [normalizeEol, setNormalizeEol] = useState(false);
  const [textDigests, setTextDigests] = useState<Partial<Record<AlgoId, string>>>({});
  const [textMs, setTextMs] = useState(0);
  const [textBytes, setTextBytes] = useState(0);

  // Compare mode
  const [hashA, setHashA] = useState('');
  const [hashB, setHashB] = useState('');

  // Verification
  const [expectedRaw, setExpectedRaw] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // ==========================================================================
  // Derived settings
  // ==========================================================================
  const activeKey = hmacOn ? hmacKey : '';
  const effectiveAlgos = useMemo(
    () => (activeKey ? algos.filter(a => ALGO_BY_ID[a].hmac) : algos),
    [algos, activeKey]
  );
  const skippedByHmac = useMemo(
    () => (activeKey ? algos.filter(a => !ALGO_BY_ID[a].hmac) : []),
    [algos, activeKey]
  );
  const signature = useMemo(
    () => `${sortAlgos(effectiveAlgos).join(',')}|${activeKey}`,
    [effectiveAlgos, activeKey]
  );

  const expected = useMemo(() => parseExpected(expectedRaw), [expectedRaw]);

  const toggleAlgo = (id: AlgoId) =>
    setAlgos(current =>
      current.includes(id) ? current.filter(a => a !== id) : sortAlgos([...current, id])
    );

  const show = useCallback(
    (hex: string) => {
      const value = formatDigest(hex, format, uppercase);
      return grouped ? groupDigest(value) : value;
    },
    [format, uppercase, grouped]
  );

  const copy = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(current => (current === key ? null : current)), 1600);
    } catch {
      /* clipboard blocked by the browser; the value is on screen anyway */
    }
  }, []);

  // ==========================================================================
  // File queue — adding a file never starts the expensive part
  // ==========================================================================
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter(file => file.size >= 0);
    if (!list.length) return;
    setJobs(current => [
      ...current,
      ...list.map(file => ({
        id: nextJobId(),
        file,
        status: 'queued' as JobStatus,
        digests: {},
        loaded: 0,
        bytesPerSecond: 0,
        ms: 0,
        signature: '',
      })),
    ]);
    setMode('file');
  }, []);

  // A file handed over by another tool lands in the queue like a dropped one:
  // still waiting for the user to press the button.
  useHandoffIntake(file => addFiles([file]));

  const patchJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs(current => current.map(job => (job.id === id ? { ...job, ...patch } : job)));
  }, []);

  const runJob = useCallback(
    async (job: Job) => {
      setRunningId(job.id);
      patchJob(job.id, { status: 'running', loaded: 0, bytesPerSecond: 0, error: undefined });
      try {
        const result = await hashFile(
          job.id,
          job.file,
          effectiveAlgos,
          activeKey,
          (loaded, _total, bytesPerSecond) => patchJob(job.id, { loaded, bytesPerSecond })
        );
        if (!result) {
          patchJob(job.id, { status: 'cancelled' });
          return;
        }
        patchJob(job.id, {
          status: 'done',
          digests: result.digests,
          ms: result.ms,
          loaded: result.bytes,
          bytesPerSecond: result.bytes / Math.max(0.001, result.ms / 1000),
          signature,
        });
      } catch (error) {
        patchJob(job.id, {
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setRunningId(null);
      }
    },
    [activeKey, effectiveAlgos, hashFile, patchJob, signature]
  );

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const runPending = useCallback(async () => {
    if (!effectiveAlgos.length || runningId) return;
    abortRun.current = false;
    const pending = jobsRef.current.filter(
      job => job.status !== 'done' || job.signature !== signature
    );
    for (const job of pending) {
      if (abortRun.current) break;
      const fresh = jobsRef.current.find(item => item.id === job.id);
      if (!fresh) continue;
      await runJob(fresh);
    }
  }, [effectiveAlgos.length, runJob, runningId, signature]);

  const stopRun = useCallback(() => {
    abortRun.current = true;
    if (runningId) cancel(runningId);
  }, [cancel, runningId]);

  const removeJob = (id: string) => {
    if (id === runningId) cancel(id);
    setJobs(current => current.filter(job => job.id !== id));
  };

  const clearJobs = () => {
    if (runningId) {
      abortRun.current = true;
      cancel(runningId);
    }
    setJobs([]);
  };

  const resetWorkspace = () => {
    clearJobs();
    setText('');
    setExpectedRaw('');
    setHashA('');
    setHashB('');
    setTextDigests({});
  };

  // Dropping a file onto the page, or pasting one, is the same intake path.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      const files = event.clipboardData?.files;
      if (files && files.length) {
        event.preventDefault();
        addFiles(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  // Ctrl/Cmd+Enter computes, Escape stops.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (mode === 'file') void runPending();
      } else if (event.key === 'Escape' && runningId) {
        stopRun();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, runPending, runningId, stopRun]);

  // ==========================================================================
  // Text mode — cheap enough to stay live, and still computed off-thread
  // ==========================================================================
  useEffect(() => {
    if (mode !== 'text') return;
    if (!effectiveAlgos.length) {
      setTextDigests({});
      return;
    }
    const id = window.setTimeout(() => {
      const source = normalizeEol ? text.replace(/\r\n/g, '\n') : text;
      const bytes = new TextEncoder().encode(source);
      setTextBytes(bytes.length);
      void hashBytes(`text-${Date.now()}`, bytes, effectiveAlgos, activeKey)
        .then(result => {
          if (!result) return;
          setTextDigests(result.digests);
          setTextMs(result.ms);
        })
        .catch(() => setTextDigests({}));
    }, 140);
    return () => window.clearTimeout(id);
  }, [activeKey, effectiveAlgos, hashBytes, mode, normalizeEol, text]);

  // ==========================================================================
  // Verification
  // ==========================================================================
  const reports = useMemo(() => {
    const map = new Map<string, MatchReport>();
    for (const job of jobs) {
      if (job.status === 'done') map.set(job.id, matchFile(job.file.name, job.digests, expected));
    }
    return map;
  }, [jobs, expected]);

  const verifiedCount = useMemo(
    () => Array.from(reports.values()).filter(report => report.state === 'match').length,
    [reports]
  );
  const mismatchCount = useMemo(
    () => Array.from(reports.values()).filter(report => report.state === 'mismatch').length,
    [reports]
  );

  const textReport = useMemo(
    () => (mode === 'text' ? matchFile('', textDigests, expected) : { state: 'unknown' as const }),
    [mode, textDigests, expected]
  );

  const comparison = useMemo(() => compareHashes(hashA, hashB), [hashA, hashB]);

  // ==========================================================================
  // Export
  // ==========================================================================
  const doneJobs = jobs.filter(job => job.status === 'done');

  // A SUMS file carries one algorithm. Picking the first ticked one would hand
  // out MD5 whenever it is also selected, which is the opposite of what someone
  // publishing checksums wants.
  const sumsAlgo = useMemo(() => {
    const ordered = sortAlgos(effectiveAlgos);
    return (
      ordered.find(a => a === 'sha256') ||
      ordered.find(a => !ALGO_BY_ID[a].broken && !ALGO_BY_ID[a].nonCrypto) ||
      ordered[0]
    );
  }, [effectiveAlgos]);

  const downloadSums = () => {
    const algo = sumsAlgo;
    if (!algo || !doneJobs.length) return;
    const rows = doneJobs
      .filter(job => job.digests[algo])
      .map(job => ({ name: job.file.name, hex: job.digests[algo] }));
    const blob = new Blob([buildSumsFile(rows, algo)], { type: 'text/plain;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = `${algo.replace(/-/g, '')}sums.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  };

  const copyAll = () => {
    const lines: string[] = [];
    for (const job of doneJobs) {
      lines.push(job.file.name);
      for (const algo of sortAlgos(Object.keys(job.digests) as AlgoId[])) {
        lines.push(`  ${ALGO_BY_ID[algo].label.padEnd(12)} ${show(job.digests[algo])}`);
      }
    }
    void copy(lines.join('\n'), 'all');
  };

  // ==========================================================================
  // Copy blocks
  // ==========================================================================
  const steps = [
    { art: StepBring, title: t.step1Title, text: t.step1Text },
    { art: StepChoose, title: t.step2Title, text: t.step2Text },
    { art: StepCompute, title: t.step3Title, text: t.step3Text },
    { art: StepCompare, title: t.step4Title, text: t.step4Text },
  ];
  const featureIcons = [IconStream, IconMultiHash, IconVerify, IconBatch, IconKeyed, IconLocalOnly];
  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const canCompute = effectiveAlgos.length > 0 && jobs.length > 0 && !runningId;
  const pendingCount = jobs.filter(job => job.status !== 'done' || job.signature !== signature).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#020813] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/hash-bolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The width cap lives on <main>: AdRail measures this element to decide
          whether the fixed side rails fit next to the content. */}
      <main className="flex-1 flex flex-col items-center pt-36 pb-32 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-hash-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-sky-950/40 border border-sky-800/30 text-sky-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(14,165,233,0.15)]">
                <Hash className="w-3.5 h-3.5 shrink-0" />
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
                    <Check className="w-3.5 h-3.5 text-sky-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-sky-500/10 blur-[80px] rounded-full" />
              <HashHeroArt
                className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                animated={!prefersReduced}
              />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ---------------------------------------------------- input */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex p-1 rounded-2xl bg-[#061424]/80 border border-white/5 gap-1 w-full">
                {[
                  { id: 'file' as Mode, label: t.modeFile || 'Files', icon: FileIcon },
                  { id: 'text' as Mode, label: t.modeText || 'Text', icon: FileText },
                  { id: 'compare' as Mode, label: t.modeCompare || 'Compare hashes', icon: ShieldCheck },
                ].map(tab => {
                  const Icon = tab.icon;
                  const active = mode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setMode(tab.id)}
                      className={`flex-1 min-w-0 flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-sky-600 text-white shadow-[0_0_25px_rgba(14,165,233,0.35)]'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* ------------------------------------------------ file mode */}
              {mode === 'file' && (
                <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
                  <div
                    onDragOver={event => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={event => {
                      event.preventDefault();
                      setDragging(false);
                      if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-2xl border-2 border-dashed p-8 md:p-10 text-center flex flex-col items-center gap-4 cursor-pointer transition-all ${
                      dragging
                        ? 'border-sky-500/60 bg-sky-500/5'
                        : 'border-white/10 hover:border-sky-500/40 bg-black/20 hover:bg-black/40'
                    }`}
                  >
                    <FingerprintArt className="w-20 h-20 text-sky-400" animated={!prefersReduced} />
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white uppercase tracking-wider">
                        {t.dropTitle || 'Drop files here'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {t.dropHint || 'Any file, any size, as many as you like — nothing is read until you press the button'}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={event => {
                        if (event.target.files?.length) addFiles(event.target.files);
                        event.target.value = '';
                      }}
                      className="hidden"
                    />
                    <input
                      ref={folderInputRef}
                      type="file"
                      multiple
                      // @ts-expect-error non-standard but supported everywhere that matters
                      webkitdirectory=""
                      directory=""
                      onChange={event => {
                        if (event.target.files?.length) addFiles(event.target.files);
                        event.target.value = '';
                      }}
                      className="hidden"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {t.browseBtn || 'Choose files'}
                    </button>
                    <button
                      onClick={() => folderInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4" />
                      {t.folderBtn || 'Whole folder'}
                    </button>
                    <span className="flex items-center gap-1.5 px-3 py-2.5 text-[11px] text-slate-600 font-medium">
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      {t.pasteHint || 'or paste with Ctrl+V'}
                    </span>
                  </div>

                  {/* Queue */}
                  {jobs.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {(t.queueTitle || 'Queue ({count})').replace('{count}', String(jobs.length))}
                        </span>
                        <button
                          onClick={clearJobs}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          {t.clearBtn || 'Clear'}
                        </button>
                      </div>

                      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {jobs.map(job => {
                          const report = reports.get(job.id);
                          const progress = job.file.size ? Math.min(1, job.loaded / job.file.size) : 0;
                          const stale = job.status === 'done' && job.signature !== signature;
                          return (
                            <li
                              key={job.id}
                              className="rounded-xl border border-white/5 bg-black/25 px-3.5 py-3 space-y-2"
                            >
                              <div className="flex items-center gap-3">
                                <span className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                  {job.status === 'running' ? (
                                    <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                                  ) : report?.state === 'match' ? (
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                  ) : report?.state === 'mismatch' ? (
                                    <ShieldAlert className="w-4 h-4 text-red-400" />
                                  ) : (
                                    <FileIcon className="w-4 h-4 text-slate-500" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[12px] font-bold text-white truncate">
                                    {job.file.name}
                                  </span>
                                  <span className="block text-[10px] text-slate-500 font-medium">
                                    {formatBytes(job.file.size)}
                                    {job.status === 'done' && (
                                      <>
                                        {' · '}
                                        {formatDuration(job.ms)}
                                        {' · '}
                                        {formatSpeed(job.bytesPerSecond)}
                                      </>
                                    )}
                                    {job.status === 'queued' && ` · ${t.statusQueued || 'waiting'}`}
                                    {job.status === 'cancelled' && ` · ${t.statusCancelled || 'stopped'}`}
                                    {stale && ` · ${t.staleNotice || 'settings changed'}`}
                                  </span>
                                </span>
                                <button
                                  onClick={() => removeJob(job.id)}
                                  aria-label={t.removeBtn || 'Remove'}
                                  className="shrink-0 text-slate-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {job.status === 'running' && (
                                <div className="space-y-1.5">
                                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                    <div
                                      className="h-full bg-sky-500 transition-[width] duration-150"
                                      style={{ width: `${Math.round(progress * 100)}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                    <span>{Math.round(progress * 100)}%</span>
                                    <span>{formatSpeed(job.bytesPerSecond)}</span>
                                  </div>
                                </div>
                              )}

                              {job.status === 'error' && (
                                <p className="text-[11px] font-bold text-red-400 leading-snug">{job.error}</p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    {runningId ? (
                      <button
                        onClick={stopRun}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Square className="w-4 h-4" />
                        {t.cancelBtn || 'Stop'}
                      </button>
                    ) : (
                      <button
                        onClick={() => void runPending()}
                        disabled={!canCompute || pendingCount === 0}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        {pendingCount > 0 && doneJobs.length > 0
                          ? t.computeAgainBtn || 'Compute again'
                          : t.computeBtn || 'Compute hashes'}
                      </button>
                    )}
                    {jobs.length > 0 && (
                      <span className="text-[11px] text-slate-600 font-medium">
                        {(t.pendingCount || '{count} waiting').replace('{count}', String(pendingCount))}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------ text mode */}
              {mode === 'text' && (
                <div className="glass-card rounded-3xl p-5 md:p-7 space-y-4">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {t.textLabel || 'Text to hash'}
                  </span>
                  <textarea
                    value={text}
                    onChange={event => setText(event.target.value)}
                    rows={9}
                    placeholder={t.textPlaceholder || 'Type or paste anything — the digest updates as you type.'}
                    className="w-full bg-[#050f1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-sky-500 font-mono resize-y"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={normalizeEol}
                        onChange={event => setNormalizeEol(event.target.checked)}
                        className="w-4 h-4 accent-sky-500 cursor-pointer"
                      />
                      {t.normalizeEolLabel || 'Normalise Windows line endings (CRLF → LF)'}
                    </label>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {formatBytes(textBytes)} · UTF-8
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {t.textHint ||
                      'Hashing text is not the same as hashing a file that contains it: a trailing newline or a CRLF changes the digest.'}
                  </p>
                </div>
              )}

              {/* --------------------------------------------- compare mode */}
              {mode === 'compare' && (
                <div className="glass-card rounded-3xl p-5 md:p-7 space-y-4">
                  <p className="text-[11px] text-slate-500 font-medium leading-snug">
                    {t.compareHint ||
                      'Two hashes, no file. Paste one from the vendor and one from wherever you got yours — hex or Base64, any case.'}
                  </p>
                  {[
                    { label: t.compareA || 'Hash A', value: hashA, set: setHashA },
                    { label: t.compareB || 'Hash B', value: hashB, set: setHashB },
                  ].map(field => (
                    <div key={field.label} className="space-y-2">
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {field.label}
                      </span>
                      <textarea
                        value={field.value}
                        onChange={event => field.set(event.target.value)}
                        rows={2}
                        className="w-full bg-[#050f1a] border border-white/10 rounded-xl px-4 py-3 text-[13px] text-slate-200 outline-none focus:border-sky-500 font-mono resize-none break-all"
                      />
                    </div>
                  ))}

                  {hashA.trim() && hashB.trim() && (
                    <div
                      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${
                        !comparison.hexA || !comparison.hexB
                          ? 'border-amber-500/25 bg-amber-500/10'
                          : comparison.equal
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-red-500/30 bg-red-500/10'
                      }`}
                    >
                      {!comparison.hexA || !comparison.hexB ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[12px] font-bold text-amber-300 leading-snug">
                            {t.compareInvalid || 'One of those is not a hash in hex or Base64.'}
                          </p>
                        </>
                      ) : comparison.equal ? (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <p className="text-[12px] font-bold text-emerald-300 leading-snug">
                            {t.compareEqual || 'Identical. Same digest, whatever notation each one used.'}
                          </p>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[12px] font-bold text-red-300 leading-snug">
                            {t.compareDifferent || 'Different. These two describe different content.'}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------- settings */}
              <div className="glass-card rounded-3xl overflow-hidden">
                <button
                  onClick={() => setAlgoPanelOpen(open => !open)}
                  className="w-full flex items-center justify-between gap-3 px-5 md:px-7 py-4 text-left cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {t.algoTitle || 'Algorithms'}
                    </span>
                    <span className="block text-[13px] font-bold text-white truncate">
                      {sortAlgos(algos).map(a => ALGO_BY_ID[a].label).join(' · ') ||
                        (t.algoNone || 'Nothing selected')}
                    </span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${algoPanelOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {algoPanelOpen && (
                  <div className="px-5 md:px-7 pb-6 space-y-5 border-t border-white/5 pt-5">
                    <p className="text-[11px] text-slate-500 font-medium leading-snug">
                      {t.algoHint ||
                        'Tick as many as you need: the file is read once and every digest is computed on that single pass.'}
                    </p>

                    {(['checksum', 'sha2', 'modern'] as AlgoGroup[]).map(group => (
                      <div key={group} className="space-y-2">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {t[GROUP_KEYS[group].key] || GROUP_KEYS[group].fallback}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {ALGORITHMS.filter(spec => spec.group === group).map(spec => {
                            const on = algos.includes(spec.id);
                            const disabled = !!activeKey && !spec.hmac;
                            return (
                              <button
                                key={spec.id}
                                onClick={() => toggleAlgo(spec.id)}
                                disabled={disabled}
                                title={disabled ? t.hmacSkipped : undefined}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                  on
                                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                <span
                                  className={`w-3.5 h-3.5 rounded-[5px] border flex items-center justify-center ${
                                    on ? 'bg-sky-500 border-sky-500' : 'border-white/20'
                                  }`}
                                >
                                  {on && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                                </span>
                                {spec.label}
                                <span className="text-[9px] font-black text-slate-600">{spec.bytes * 8}</span>
                                {spec.broken && (
                                  <span
                                    className="text-[9px] font-black uppercase text-amber-400/80"
                                    title={t.brokenTag || 'Broken for security use'}
                                  >
                                    !
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div className="space-y-3 border-t border-white/5 pt-5">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {t.outputTitle || 'Output'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {([
                          ['hex', t.formatHex || 'Hex'],
                          ['base64', t.formatBase64 || 'Base64'],
                          ['base64url', t.formatBase64Url || 'Base64URL'],
                        ] as [OutputFormat, string][]).map(([id, label]) => (
                          <button
                            key={id}
                            onClick={() => setFormat(id)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              format === id
                                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        <button
                          onClick={() => setUppercase(value => !value)}
                          disabled={format !== 'hex'}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            uppercase && format === 'hex'
                              ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.uppercaseLabel || 'UPPERCASE'}
                        </button>
                        <button
                          onClick={() => setGrouped(value => !value)}
                          className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            grouped
                              ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.groupedLabel || 'Grouped'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5 border-t border-white/5 pt-5">
                      <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hmacOn}
                          onChange={event => setHmacOn(event.target.checked)}
                          className="w-4 h-4 accent-sky-500 cursor-pointer"
                        />
                        <KeyRound className="w-3.5 h-3.5" />
                        {t.hmacTitle || 'HMAC (keyed hash)'}
                      </label>
                      {hmacOn && (
                        <>
                          <input
                            type="text"
                            value={hmacKey}
                            onChange={event => setHmacKey(event.target.value)}
                            placeholder={t.hmacPlaceholder || 'Secret key'}
                            className="w-full bg-[#050f1a] border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-slate-200 outline-none focus:border-sky-500 font-mono"
                          />
                          <p className="text-[11px] text-slate-600 font-medium leading-snug">
                            {t.hmacHint ||
                              'Signs the content with a shared secret — the digest is worthless to anyone without the key.'}
                          </p>
                          {skippedByHmac.length > 0 && (
                            <p className="text-[11px] text-amber-400/80 font-medium leading-snug">
                              {(t.hmacSkipped || '{algos} have no HMAC mode and are skipped.').replace(
                                '{algos}',
                                skippedByHmac.map(a => ALGO_BY_ID[a].label).join(', ')
                              )}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------- results */}
            <div className="lg:col-span-5 space-y-5">
              <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t.resultsTitle || 'Digests'}
                  </span>
                  {(doneJobs.length > 0 || Object.keys(textDigests).length > 0) && (
                    <button
                      onClick={() =>
                        mode === 'text'
                          ? copy(
                              sortAlgos(Object.keys(textDigests) as AlgoId[])
                                .map(a => `${ALGO_BY_ID[a].label}: ${show(textDigests[a])}`)
                                .join('\n'),
                              'all'
                            )
                          : copyAll()
                      }
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      {copied === 'all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {t.copyAllBtn || 'Copy all'}
                    </button>
                  )}
                </div>

                {mode === 'text' ? (
                  Object.keys(textDigests).length === 0 ? (
                    <p className="py-10 text-center text-xs text-slate-600 font-bold leading-relaxed">
                      {t.resultsEmptyText || 'Start typing and the digests appear here.'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortAlgos(Object.keys(textDigests) as AlgoId[]).map(algo => (
                        <DigestRow
                          key={algo}
                          label={ALGO_BY_ID[algo].label}
                          value={show(textDigests[algo])}
                          highlight={textReport.state === 'match' && textReport.algo === algo}
                          copied={copied === `text-${algo}`}
                          copyLabel={t.copyBtn || 'Copy'}
                          onCopy={() => copy(show(textDigests[algo]), `text-${algo}`)}
                        />
                      ))}
                      <p className="text-[10px] text-slate-600 font-medium pt-1">
                        {formatBytes(textBytes)} · {formatDuration(textMs)}
                      </p>
                    </div>
                  )
                ) : mode === 'compare' ? (
                  <p className="py-10 text-center text-xs text-slate-600 font-bold leading-relaxed">
                    {t.resultsEmptyCompare ||
                      'Compare mode does not hash anything: it only tells you whether two digests are the same value.'}
                  </p>
                ) : doneJobs.length === 0 ? (
                  <p className="py-10 text-center text-xs text-slate-600 font-bold leading-relaxed">
                    {t.resultsEmpty || 'Queue a file, tick the algorithms you need and press Compute.'}
                  </p>
                ) : (
                  <div className="space-y-5">
                    {doneJobs.map(job => {
                      const report = reports.get(job.id);
                      return (
                        <div key={job.id} className="space-y-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span className="text-[12px] font-bold text-white truncate">{job.file.name}</span>
                          </div>
                          {sortAlgos(Object.keys(job.digests) as AlgoId[]).map(algo => (
                            <DigestRow
                              key={algo}
                              label={ALGO_BY_ID[algo].label}
                              value={show(job.digests[algo])}
                              highlight={report?.state === 'match' && report.algo === algo}
                              copied={copied === `${job.id}-${algo}`}
                              copyLabel={t.copyBtn || 'Copy'}
                              onCopy={() => copy(show(job.digests[algo]), `${job.id}-${algo}`)}
                            />
                          ))}
                          {report && <VerdictBanner report={report} t={t} />}
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={downloadSums}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t.downloadSumsBtn || 'Download SUMS file'}</span>
                        <span className="text-slate-500">· {ALGO_BY_ID[sumsAlgo]?.label}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification */}
              {mode !== 'compare' && (
                <div className="glass-card rounded-3xl p-5 md:p-7 space-y-3">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t.verifyTitle || 'Verify against a checksum'}
                  </span>
                  <textarea
                    value={expectedRaw}
                    onChange={event => setExpectedRaw(event.target.value)}
                    rows={3}
                    placeholder={
                      t.verifyPlaceholder ||
                      'Paste one hash, or a whole SHA256SUMS file — names are matched line by line.'
                    }
                    className="w-full bg-[#050f1a] border border-white/10 rounded-xl px-4 py-3 text-[12px] text-slate-200 outline-none focus:border-sky-500 font-mono resize-y break-all"
                  />
                  {expected.length > 0 && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      {(t.verifySummary || '{count} checksum(s) read · {ok} verified · {bad} mismatched')
                        .replace('{count}', String(expected.length))
                        .replace('{ok}', String(verifiedCount))
                        .replace('{bad}', String(mismatchCount))}
                    </p>
                  )}
                  {mode === 'text' && Object.keys(textDigests).length > 0 && (
                    <VerdictBanner report={textReport} t={t} />
                  )}
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {t.verifyHint ||
                      'Hex and Base64 both work, in any case. A digest length no ticked algorithm produces is called out instead of being reported as a mismatch.'}
                  </p>
                </div>
              )}

              {/* Handoff */}
              {mode === 'file' && doneJobs.length > 0 && (
                <NextStepBar lang={lang} t={t} file={doneJobs[doneJobs.length - 1].file} />
              )}
            </div>
          </section>

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-sky-500 mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-sky-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-sky-500/10 transition-colors">
                      {i + 1}
                    </span>
                    <Art className="w-24 h-auto text-sky-400" />
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
          <motion.section
            initial={prefersReduced ? false : 'hidden'}
            whileInView={prefersReduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeInUp}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature, idx) => {
              const Icon = featureIcons[idx] || IconStream;
              return (
                <div
                  key={idx}
                  className="p-7 glass-card rounded-3xl text-left hover:-translate-y-1.5 transition-all duration-300 group border border-white/5"
                >
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5 group-hover:scale-110 group-hover:border-sky-500/40 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-sky-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.text}</p>
                </div>
              );
            })}
          </motion.section>

          {/* ================================================================ */}
          {/* SEO content                                                      */}
          {/* ================================================================ */}
          <section className="space-y-24 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-24 items-center">
              <div className="space-y-7">
                <div className="inline-block px-4 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 text-[11px] font-black uppercase tracking-[0.2em] border border-sky-500/20">
                  {keywords[0]}
                </div>
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
                <IconStream className="w-20 h-20 text-sky-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#061421] border border-white/5 space-y-10">
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
        </div>

        <AdBanner id="adsense-hash-bolt-bottom" />
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
