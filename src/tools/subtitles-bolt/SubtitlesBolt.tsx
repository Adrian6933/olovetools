import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Captions,
  Check,
  Copy,
  Download,
  FileText,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import type { Cue, Format, Track } from './lib/model';
import { nextUid, toReadable, totalDuration } from './lib/model';
import { INPUT_FORMATS, OUTPUT_FORMATS, FILE_EXTENSION, FORMAT_LABEL, MIME_TYPE, emit } from './lib/format';
import { TRANSCRIPT_DEFAULTS, readSubtitles } from './lib/parse';
import {
  closeShortGaps, convertFrameRate, enforceDurations, fixOverlaps, resync, rewrap, shift, stripTags, tidy,
} from './lib/timing';
import type { PresetId, Spec } from './lib/qc';
import { PRESETS, issuesByUid, runQc } from './lib/qc';

import {
  IconEditor, IconFormats, IconLocal, IconQuality, IconRepair, IconTiming,
  StepCheck, StepExport, StepLoad, StepSync, SubtitleHeroArt,
} from './components/Illustrations';
import { CueEditor } from './components/CueEditor';
import { Timeline } from './components/Timeline';
import { QcPanel } from './components/QcPanel';
import { TimingPanel } from './components/TimingPanel';
import { NextStepBar } from './components/NextStepBar';

interface SubtitlesBoltProps {
  lang: string;
  dictionary: any;
}

const FEATURE_ICONS = [IconFormats, IconTiming, IconQuality, IconEditor, IconRepair, IconLocal];
const STEP_ART = [StepLoad, StepCheck, StepSync, StepExport];

/** A subtitle file is text; anything past this is not one. */
const MAX_BYTES = 8 * 1024 * 1024;

interface PendingFile {
  text: string;
  name: string;
  /** Slug of the tool that sent it, when it arrived through a handoff. */
  from: string;
  bytes: number;
}

export default function SubtitlesBolt({ lang, dictionary }: SubtitlesBoltProps) {
  const t = dictionary || {};

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies'>(null);
  const [source, setSource] = useState('');
  const [inputFormat, setInputFormat] = useState<Format>(null); // null = auto
  const [targetFormat, setTargetFormat] = useState<Format>('srt');
  const [pending, setPending] = useState<PendingFile>(null);
  const [preset, setPreset] = useState<PresetId>('netflix');
  const [spec, setSpec] = useState<Spec>(PRESETS.netflix);
  const [focusUid, setFocusUid] = useState(0);
  const [tab, setTab] = useState<'editor' | 'timing' | 'quality'>('editor');
  const [speakerNames, setSpeakerNames] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  // The cue list is the document; undo keeps arrays of the same cue objects,
  // so a hundred steps of a feature-length file is a list of pointers rather
  // than a hundred deep copies.
  const [history, setHistory] = useState<{ cues: Cue[]; past: Cue[][]; future: Cue[][] }>({
    cues: [],
    past: [],
    future: [],
  });
  const [meta, setMeta] = useState<{ header: string; format: Format; issues: Track['issues'] }>({
    header: '',
    format: 'srt',
    issues: [],
  });

  const copyTimer = useRef<number>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    },
    []
  );

  // --------------------------------------------------------------------------
  // Loading. A file never parses itself: it lands in `pending` and waits for
  // the button, whether it came from the picker, a drop, or another tool.
  // --------------------------------------------------------------------------
  const acceptFile = useCallback((file: File, from: string) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setPending({ text: '', name: file.name, from, bytes: file.size });
      return;
    }
    file.text().then(text => setPending({ text, name: file.name, from, bytes: file.size }), () => undefined);
  }, []);

  useHandoffIntake((file, from) => acceptFile(file, from));

  const readPending = useCallback(() => {
    if (!pending || pending.text === '') return;
    setSource(pending.text);
    setPending(null);
  }, [pending]);

  // --------------------------------------------------------------------------
  // Parsing. Debounced so a 2 MB paste does not re-parse on every keystroke,
  // and re-run whenever the user overrides the detected format.
  // --------------------------------------------------------------------------
  const [debouncedSource, setDebouncedSource] = useState('');
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSource(source), 200);
    return () => window.clearTimeout(id);
  }, [source]);

  const parsed = useMemo(
    () => readSubtitles(debouncedSource, inputFormat, TRANSCRIPT_DEFAULTS),
    [debouncedSource, inputFormat]
  );

  // Replacing the document resets the undo stack: the previous file's cues are
  // not a state of this one.
  const loadedRef = useRef('');
  useEffect(() => {
    const key = `${debouncedSource.length}:${inputFormat}:${debouncedSource.slice(0, 200)}`;
    if (key === loadedRef.current) return;
    loadedRef.current = key;
    setHistory({ cues: parsed.track.cues, past: [], future: [] });
    setMeta({ header: parsed.track.header, format: parsed.track.format, issues: parsed.track.issues });
    setFocusUid(0);
  }, [parsed, debouncedSource, inputFormat]);

  const cues = history.cues;

  const apply = useCallback((next: Cue[]) => {
    setHistory(h => (next === h.cues ? h : { cues: next, past: [...h.past, h.cues].slice(-60), future: [] }));
  }, []);

  const undo = useCallback(() => {
    setHistory(h =>
      h.past.length === 0
        ? h
        : { cues: h.past[h.past.length - 1], past: h.past.slice(0, -1), future: [h.cues, ...h.future].slice(0, 60) }
    );
  }, []);

  const redo = useCallback(() => {
    setHistory(h =>
      h.future.length === 0
        ? h
        : { cues: h.future[0], past: [...h.past, h.cues].slice(-60), future: h.future.slice(1) }
    );
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === 'z' && event.shiftKey) || key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // --------------------------------------------------------------------------
  // Derived
  // --------------------------------------------------------------------------
  const report = useMemo(() => runQc(cues, spec), [cues, spec]);
  const byUid = useMemo(() => issuesByUid(report), [report]);

  const track: Track = useMemo(
    () => ({ cues, format: meta.format, header: meta.header, issues: meta.issues }),
    [cues, meta]
  );

  const output = useMemo(
    () => emit(track, targetFormat, { speakerNames, keepHeader: true }),
    [track, targetFormat, speakerNames]
  );

  const units = useMemo(
    () => ({ h: t.unit_h || 'h', m: t.unit_m || 'm', s: t.unit_s || 's' }),
    [t]
  );

  const span = useMemo(() => totalDuration(cues), [cues]);

  // --------------------------------------------------------------------------
  // Editing
  // --------------------------------------------------------------------------
  const patchCue = useCallback(
    (uid: number, patch: Partial<Cue>) => {
      apply(cues.map(cue => (cue.uid === uid ? { ...cue, ...patch } : cue)));
    },
    [cues, apply]
  );

  const deleteCue = useCallback((uid: number) => apply(cues.filter(cue => cue.uid !== uid)), [cues, apply]);

  const insertAfter = useCallback(
    (uid: number) => {
      const at = cues.findIndex(cue => cue.uid === uid);
      if (at === -1) return;
      const previous = cues[at];
      const next = cues[at + 1];
      const start = previous.end + 80;
      const end = next ? Math.max(start + 400, Math.min(next.start - 80, start + 2000)) : start + 2000;
      const fresh: Cue = { uid: nextUid(), start, end, lines: [''] };
      apply([...cues.slice(0, at + 1), fresh, ...cues.slice(at + 1)]);
      setFocusUid(fresh.uid);
    },
    [cues, apply]
  );

  const autoFix = useCallback(() => {
    let next = tidy(cues.filter(cue => cue.end > cue.start && cue.lines.join('').trim() !== ''));
    next = fixOverlaps(next, spec.minGap);
    next = closeShortGaps(next, spec.minGap * 2, spec.minGap);
    next = enforceDurations(next, { minMs: spec.minDuration, maxMs: spec.maxDuration, gapMs: spec.minGap });
    apply(next);
  }, [cues, spec, apply]);

  // --------------------------------------------------------------------------
  // Output actions
  // --------------------------------------------------------------------------
  const copyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(
      () => {
        setCopied(true);
        if (copyTimer.current) window.clearTimeout(copyTimer.current);
        copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
      },
      () => setCopied(false)
    );
  };

  const buildBlob = useCallback(
    () => ({
      blob: new Blob([output], { type: `${MIME_TYPE[targetFormat]};charset=utf-8` }),
      name: `subtitles.${FILE_EXTENSION[targetFormat]}`,
    }),
    [output, targetFormat]
  );

  const download = () => {
    if (!output) return;
    const { blob, name } = buildBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    // Revoking on the next tick, not synchronously: Firefox cancels a download
    // whose object URL is released in the same task as the click.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const resetWorkspace = () => {
    setSource('');
    setPending(null);
    setInputFormat(null);
    setTargetFormat('srt');
    setHistory({ cues: [], past: [], future: [] });
    setMeta({ header: '', format: 'srt', issues: [] });
    setCopied(false);
    setFocusUid(0);
  };

  const applyPreset = (id: PresetId) => {
    setPreset(id);
    setSpec(PRESETS[id]);
  };

  // --------------------------------------------------------------------------
  // Presentation
  // --------------------------------------------------------------------------
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const features = Array.isArray(t.features) ? t.features : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const steps = [1, 2, 3, 4].map((n, i) => ({
    title: t[`step${n}Title`] || '',
    text: t[`step${n}Text`] || '',
    art: STEP_ART[i],
  }));

  const hasCues = cues.length > 0;
  const detectedLabel = parsed.detected ? FORMAT_LABEL[parsed.detected] : t.format_unknown || 'unrecognised';

  return (
    <div className="min-h-screen flex flex-col bg-[#020610] text-slate-200 font-sans relative overflow-x-hidden">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/subtitles-bolt`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          to decide whether the fixed side rails fit. At max-w-6xl the gap at
          1400px was 124px, under the 168px the rails need, so they never
          rendered between 1400 and 1650. */}
      <main className="flex-1 flex flex-col items-center pt-40 md:pt-36 pb-24 px-4 md:px-12 relative z-10 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-subtitles-bolt-top" />

        <div className="w-full space-y-20 md:space-y-28">
          {/* ================================================================ */}
          {/* Hero                                                             */}
          {/* ================================================================ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-2">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-blue-950/40 border border-blue-800/30 text-blue-400 text-[11px] font-black tracking-[0.2em] uppercase shadow-[0_0_25px_rgba(59,130,246,0.15)]">
                <Captions className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.badge || t.title}</span>
              </div>

              <h1 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400">
                {t.title}
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.description || t.seoHeroText}
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {(t.seoHeroList || []).slice(0, 3).map((point: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full" />
              <SubtitleHeroArt className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]" />
            </div>
          </section>

          {/* ================================================================ */}
          {/* Workspace                                                        */}
          {/* ================================================================ */}
          <section className="space-y-6">
            {/* -------- Load ------------------------------------------------ */}
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files && e.dataTransfer.files[0];
                if (file) acceptFile(file, '');
              }}
              className={`glass-card rounded-3xl p-5 md:p-6 space-y-4 border transition-colors ${
                dragging ? 'border-blue-400/60 bg-blue-500/[0.06]' : 'border-white/5'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  {t.label_input || 'Subtitles in'}
                </span>
                <span className="h-px flex-1 min-w-[1rem] bg-white/5" />
                {source.trim() !== '' && (
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {inputFormat ? FORMAT_LABEL[inputFormat] : detectedLabel}
                  </span>
                )}
                <select
                  value={inputFormat || 'auto'}
                  onChange={e => setInputFormat(e.target.value === 'auto' ? null : (e.target.value as Format))}
                  aria-label={t.label_inputFormat || 'Input format'}
                  className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2.5 py-1.5 rounded-lg outline-none font-bold cursor-pointer hover:border-blue-500/30 transition-colors"
                >
                  <option value="auto" className="bg-[#020610]">
                    {t.format_auto || 'Detect'}
                  </option>
                  {INPUT_FORMATS.map(f => (
                    <option key={f} value={f} className="bg-[#020610]">
                      {FORMAT_LABEL[f]}
                    </option>
                  ))}
                </select>
              </div>

              {pending && (
                <div className="flex flex-wrap items-center gap-3 px-3 py-3 rounded-xl bg-blue-500/10 border border-blue-500/25">
                  <FileText className="w-4 h-4 text-blue-300 shrink-0" />
                  <span className="text-[11px] text-blue-100 font-bold min-w-0 truncate flex-1">
                    {pending.name}
                    {pending.from ? ` · ${pending.from}` : ''}
                  </span>
                  {pending.text === '' ? (
                    <span className="text-[11px] text-amber-300 font-bold">
                      {(t.error_tooBig || 'Larger than {n} MB — that is not a subtitle file.').replace(
                        '{n}',
                        String(MAX_BYTES / 1024 / 1024)
                      )}
                    </span>
                  ) : (
                    <button
                      onClick={readPending}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 border border-blue-500 text-white text-[11px] font-black hover:bg-blue-500 transition-all cursor-pointer outline-none"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {t.button_read || 'Read the file'}
                    </button>
                  )}
                  <button
                    onClick={() => setPending(null)}
                    aria-label={t.button_discard || 'Discard'}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <textarea
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder={t.placeholder_input || 'Paste subtitles here, or drop a file anywhere in this box.'}
                spellCheck={false}
                rows={8}
                className="w-full px-4 py-3 rounded-2xl bg-[#08122a] border border-white/10 focus:border-blue-500/50 text-slate-200 font-mono text-xs leading-relaxed outline-none transition-colors resize-y"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fileInput.current && fileInput.current.click()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 transition-all cursor-pointer outline-none"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t.button_open || 'Open a file'}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".srt,.vtt,.sbv,.ass,.ssa,.ttml,.dfxp,.xml,.lrc,.json,.csv,.txt,text/plain"
                  className="hidden"
                  onChange={e => {
                    acceptFile(e.target.files && e.target.files[0], '');
                    e.target.value = '';
                  }}
                />
                <button
                  onClick={undo}
                  disabled={history.past.length === 0}
                  title={t.tooltip_undo || 'Undo (Ctrl+Z)'}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={history.future.length === 0}
                  title={t.tooltip_redo || 'Redo (Ctrl+Shift+Z)'}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={resetWorkspace}
                  title={t.button_reset || 'Reset'}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white flex items-center justify-center transition-all cursor-pointer outline-none"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {hasCues && (
                  <span className="ml-auto flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
                    <span className="text-blue-400 font-bold">
                      {cues.length} {t.unit_cues || 'cues'}
                    </span>
                    <span>{toReadable(span, units)}</span>
                    <span>{Math.round((report.coverage || 0) * 100)}% {t.label_coverage || 'covered'}</span>
                  </span>
                )}
              </div>

              {meta.issues.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    {(t.warn_unreadable ||
                      '{n} block(s) could not be read and were left out. First one on line {line}: "{sample}"')
                      .replace('{n}', String(meta.issues.length))
                      .replace('{line}', String(meta.issues[0].line))
                      .replace('{sample}', meta.issues[0].sample)}
                  </span>
                </div>
              )}

              {source.trim() !== '' && !hasCues && meta.issues.length === 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  {t.error_no_subtitles || 'No cues found. Pick the format by hand if the detector got it wrong.'}
                </div>
              )}
            </div>

            {/* -------- Overview ------------------------------------------- */}
            {hasCues && (
              <div className="glass-card rounded-3xl p-5 md:p-6 space-y-3 border border-white/5">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  {t.label_overview || 'The whole track'}
                </span>
                <Timeline cues={cues} issues={report.issues} onSeek={setFocusUid} t={t} />
              </div>
            )}

            {/* -------- Work + output --------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 min-w-0 space-y-5">
                <div className="flex gap-2">
                  {(['editor', 'timing', 'quality'] as const).map(id => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-black border transition-all cursor-pointer outline-none ${
                        tab === id
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-[#08122a] border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t[`tab_${id}`] || id}
                      {id === 'quality' && report.issues.length > 0 && (
                        <span className="ml-1.5 text-[10px] opacity-80">({report.issues.length})</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="glass-card rounded-3xl p-5 md:p-6 border border-white/5">
                  {tab === 'editor' && (
                    <CueEditor
                      cues={cues}
                      issuesByUid={byUid}
                      onChange={patchCue}
                      onDelete={deleteCue}
                      onInsertAfter={insertAfter}
                      focusUid={focusUid}
                      t={t}
                      maxCps={spec.maxCps}
                    />
                  )}
                  {tab === 'timing' && (
                    <TimingPanel
                      t={t}
                      disabled={!hasCues}
                      firstStart={hasCues ? cues[0].start : 0}
                      lastStart={hasCues ? cues[cues.length - 1].start : 0}
                      defaultWidth={spec.maxLineLength}
                      defaultLines={spec.maxLines}
                      onShift={delta => apply(shift(cues, delta))}
                      onFrameRate={(from, to) => apply(convertFrameRate(cues, from, to))}
                      onResync={(fa, ta, fb, tb) => apply(resync(cues, fa, ta, fb, tb))}
                      onRewrap={(width, lines) => apply(rewrap(cues, width, lines))}
                      onStripTags={() => apply(stripTags(cues))}
                    />
                  )}
                  {tab === 'quality' && (
                    <QcPanel
                      spec={spec}
                      preset={preset}
                      onPreset={applyPreset}
                      onSpec={patch => setSpec(s => ({ ...s, ...patch }))}
                      report={report}
                      onSeek={uid => {
                        setTab('editor');
                        setFocusUid(uid);
                      }}
                      onAutoFix={autoFix}
                      t={t}
                    />
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 min-w-0 space-y-5">
                <div className="glass-card rounded-3xl overflow-hidden border border-white/5">
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0a1a3a]/40">
                    <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      {t.label_output || 'Subtitles out'}
                    </span>
                    <select
                      value={targetFormat}
                      onChange={e => setTargetFormat(e.target.value as Format)}
                      aria-label={t.label_outputFormat || 'Output format'}
                      className="ml-auto bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2.5 py-1.5 rounded-lg outline-none font-bold cursor-pointer hover:border-blue-500/30 transition-colors"
                    >
                      {OUTPUT_FORMATS.map(f => (
                        <option key={f} value={f} className="bg-[#020610]">
                          {FORMAT_LABEL[f]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={copyOutput}
                      disabled={!output}
                      title={t.tooltip_copy || 'Copy'}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/40 flex items-center justify-center transition-all cursor-pointer outline-none disabled:opacity-30"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={download}
                      disabled={!output}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-300 text-[11px] font-bold hover:bg-blue-600/30 transition-all cursor-pointer outline-none disabled:opacity-30"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.button_download || 'Download'}
                    </button>
                  </div>

                  <pre className="h-72 overflow-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words">
                    {output || <span className="text-slate-600">{t.placeholder_output || 'The converted file appears here.'}</span>}
                  </pre>

                  <label className="flex items-center gap-2 px-4 py-3 border-t border-white/5 bg-[#0a1a3a]/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={speakerNames}
                      onChange={e => setSpeakerNames(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <span className="text-[11px] text-slate-400 font-medium">
                      {t.option_speakers || 'Write speaker names into the text'}
                    </span>
                  </label>
                </div>

                <NextStepBar lang={lang} t={t} disabled={!output} getResult={buildBlob} />
              </div>
            </div>
          </section>

          <AdBanner id="adsense-subtitles-bolt-mid" />

          {/* ================================================================ */}
          {/* How it works                                                     */}
          {/* ================================================================ */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {t.howItWorksTitle || 'How it works'}
              </h2>
              <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => {
                const Art = step.art;
                return (
                  <div
                    key={i}
                    className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-blue-500/20 transition-all group"
                  >
                    <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-blue-500/10 transition-colors">
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
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-110 group-hover:border-blue-500/40 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-white text-lg font-bold mb-2.5 group-hover:text-blue-400 transition-colors">
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
                  <div className="inline-block px-4 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
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
                      <span className="w-7 h-7 shrink-0 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-slate-300 font-bold text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative glass-card rounded-[3rem] p-10 py-16 min-h-[400px] flex flex-col items-center justify-center gap-7 text-center overflow-hidden">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl" />
                <IconQuality className="w-20 h-20 text-blue-400 relative" />
                <div className="space-y-3 max-w-sm relative">
                  <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                    {t.seoBrowserSpeedTitle}
                  </h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-14 rounded-3xl md:rounded-[2.5rem] bg-[#08122a] border border-white/5 space-y-10">
              <div className="max-w-4xl space-y-4">
                <h2 className="text-2xl md:text-4xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
                <div className="h-1.5 w-20 bg-blue-500 rounded-full" />
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
                  <div className="h-1 w-16 bg-blue-500 mx-auto rounded-full" />
                </div>
                <div className="grid gap-3">
                  {faqs.map((faq: any, idx: number) => (
                    <details
                      key={idx}
                      className="glass-card rounded-2xl px-6 py-5 text-left border border-white/5 hover:border-blue-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-[11px] font-black">
                          Q
                        </span>
                        <span className="flex-1">{faq.question}</span>
                        <span className="shrink-0 text-blue-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
                      className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 transition-all cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <AdBanner id="adsense-subtitles-bolt-bottom" />
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
