import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeftRight,
  Braces,
  Check,
  ChevronDown,
  ClipboardPaste,
  Copy,
  Download,
  Eye,
  FileText,
  Info,
  Library,
  Link2,
  Loader2,
  Play,
  Redo2,
  Replace,
  Scissors,
  ShieldCheck,
  Sparkles,
  SplitSquareHorizontal,
  Trash2,
  Undo2,
  Upload,
  X,
  Zap,
} from 'lucide-react';

import { createTranslator } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { PatternField } from './components/PatternField';
import { TestPad } from './components/TestPad';
import { ExplainTree } from './components/ExplainTree';
import { MatchTable } from './components/MatchTable';
import { NextStepBar } from './components/NextStepBar';
import {
  IconExport,
  IconHandoff,
  IconHighlight,
  IconLint,
  IconLocalOnly,
  IconSandbox,
  IconTree,
  IconWatchdog,
  RegexHeroArt,
  StepRun,
  StepShip,
  StepTune,
  StepWrite,
} from './components/Illustrations';

import { parsePattern } from './lib/ast';
import { explain } from './lib/explain';
import { lint, supportsIndices, supportsLookbehind, supportsUnicodeSets } from './lib/lint';
import { replacementTokens } from './lib/engine';
import { needsUnicodeFlag, regexErrorKey } from './lib/errors';
import { AUTO_LIMIT, TIMEOUT_MS, useRegexRun } from './lib/useRegexRun';
import { CATEGORIES, CHEAT_SHEET, LIBRARY, type LibraryCategory, type LibraryEntry } from './lib/library';
import { CODE_TARGETS, targetById } from './lib/codegen';
import type { LintSeverity, ParseResult, RunMode } from './types';

interface RegexFlowProps {
  lang: string;
  dictionary: any;
}

/** Text files only: this tool reads test data, it does not decode formats. */
const TEXT_TYPES = /\.(txt|log|md|csv|tsv|json|xml|ya?ml|html?|css|js|ts|tsx|jsx|py|rb|go|rs|java|cs|php|sql|env|ini|conf)$/i;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Undo entries are four short strings; a thousand of them is a few hundred KB. */
const HISTORY_LIMIT = 200;

interface Snapshot {
  pattern: string;
  flags: string;
  text: string;
  replacement: string;
}

const DEFAULT_ENTRY = LIBRARY[0];

const FLAG_ORDER = ['g', 'i', 'm', 's', 'u', 'v', 'y', 'd'] as const;

const SEVERITY_STYLE: Record<LintSeverity, string> = {
  danger: 'border-red-500/30 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info: 'border-white/10 bg-white/5 text-slate-400',
};

const MODE_ICON: Record<RunMode, React.ReactNode> = {
  match: <Eye className="w-3.5 h-3.5" />,
  replace: <Replace className="w-3.5 h-3.5" />,
  split: <SplitSquareHorizontal className="w-3.5 h-3.5" />,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const RegexFlow: React.FC<RegexFlowProps> = ({ lang, dictionary }) => {
  const dict = createTranslator(dictionary);
  const prefersReduced = useReducedMotion();

  /** `t('key', { n: 1 })` — the dictionary lookup plus `{placeholder}` filling. */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = dict(key);
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.split(`{${name}}`).join(String(value));
        }
      }
      return text;
    },
    [dict]
  );

  // -- core state -----------------------------------------------------------

  const [pattern, setPattern] = useState(DEFAULT_ENTRY.pattern);
  const [flags, setFlags] = useState(DEFAULT_ENTRY.flags);
  const [text, setText] = useState(DEFAULT_ENTRY.sample);
  const [replacement, setReplacement] = useState(DEFAULT_ENTRY.replacement);
  const [mode, setMode] = useState<RunMode>('match');
  const [live, setLive] = useState(true);

  const [activeMatch, setActiveMatch] = useState<number | null>(0);
  const [focusRange, setFocusRange] = useState<{ start: number; end: number } | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [rawView, setRawView] = useState(false);

  const [staged, setStaged] = useState<{ name: string; size: number; body: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [shelf, setShelf] = useState<'library' | 'cheat' | 'code'>('library');
  const [category, setCategory] = useState<LibraryCategory>('web');
  const [target, setTarget] = useState('javascript');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- undo / redo ----------------------------------------------------------
  // Only the four strings are kept — never a rendered result — so the whole
  // stack stays in the tens of kilobytes even after an hour of editing.

  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [historyTick, setHistoryTick] = useState(0);
  const coalesce = useRef<number>(0);

  const current = useCallback(
    (): Snapshot => ({ pattern, flags, text, replacement }),
    [pattern, flags, text, replacement]
  );

  const commit = useCallback(
    (snapshot: Snapshot, immediate = false) => {
      const now = Date.now();
      // Typing produces one entry per burst, not one per keystroke.
      if (!immediate && now - coalesce.current < 500 && past.current.length > 0) {
        coalesce.current = now;
        return;
      }
      coalesce.current = now;
      past.current = [...past.current.slice(-HISTORY_LIMIT), snapshot];
      future.current = [];
      setHistoryTick(value => value + 1);
    },
    []
  );

  const apply = useCallback((snapshot: Snapshot) => {
    setPattern(snapshot.pattern);
    setFlags(snapshot.flags);
    setText(snapshot.text);
    setReplacement(snapshot.replacement);
  }, []);

  const undo = useCallback(() => {
    const previous = past.current.pop();
    if (!previous) return;
    future.current = [current(), ...future.current].slice(0, HISTORY_LIMIT);
    apply(previous);
    setHistoryTick(value => value + 1);
  }, [apply, current]);

  const redo = useCallback(() => {
    const [next, ...rest] = future.current;
    if (!next) return;
    future.current = rest;
    past.current = [...past.current, current()];
    apply(next);
    setHistoryTick(value => value + 1);
  }, [apply, current]);

  const canUndo = past.current.length > 0;
  const canRedo = future.current.length > 0;
  void historyTick; // the refs above are the source of truth; this forces the repaint

  // -- parse, explain, lint -------------------------------------------------
  // All three are pure and cheap (they walk the pattern, never the text), so
  // they run on the main thread; only the match itself needs the sandbox.

  const parsed = useMemo<ParseResult | null>(() => (pattern ? parsePattern(pattern) : null), [pattern]);

  const explanation = useMemo(
    () => (parsed ? explain(parsed.root, (key, params) => t(key, params)) : []),
    [parsed, t]
  );

  const findings = useMemo(
    () => (parsed ? lint(parsed.root, flags, pattern) : []),
    [parsed, flags, pattern]
  );

  const dangerous = findings.some(finding => finding.severity === 'danger');

  // -- the run --------------------------------------------------------------

  const runState = useRegexRun({ pattern, flags, text, replacement, mode }, live);
  const { matches, total, truncated, replaced, parts, ms, busy, timedOut, sandboxed, manual, ok, error } = runState;

  useEffect(() => {
    // The active match must not point past the end of a shorter new result.
    setActiveMatch(previous => (previous !== null && previous < matches.length ? previous : matches.length > 0 ? 0 : null));
  }, [matches.length]);

  // -- capability probes ----------------------------------------------------

  const capabilities = useMemo(
    () => ({ lookbehind: supportsLookbehind(), unicodeSets: supportsUnicodeSets(), indices: supportsIndices() }),
    []
  );

  // -- flags ----------------------------------------------------------------

  const toggleFlag = (flag: string) => {
    commit(current(), true);
    setFlags(previous => {
      if (previous.includes(flag)) return previous.replace(flag, '');
      // `u` and `v` are mutually exclusive; the engine throws if both are set.
      let next = previous;
      if (flag === 'u') next = next.replace('v', '');
      if (flag === 'v') next = next.replace('u', '');
      return [...next, flag].sort((a, b) => FLAG_ORDER.indexOf(a as never) - FLAG_ORDER.indexOf(b as never)).join('');
    });
  };

  // -- library --------------------------------------------------------------

  const loadEntry = (entry: LibraryEntry) => {
    commit(current(), true);
    setPattern(entry.pattern);
    setFlags(entry.flags);
    setText(entry.sample);
    setReplacement(entry.replacement);
    setActiveMatch(0);
    setNotice(null);
  };

  const reset = useCallback(() => {
    commit({ pattern, flags, text, replacement }, true);
    setPattern('');
    setFlags('g');
    setText('');
    setReplacement('');
    setMode('match');
    setStaged(null);
    setNotice(null);
  }, [commit, flags, pattern, replacement, text]);

  // -- file intake ----------------------------------------------------------
  // Opening a file never starts anything: it parks the text and waits for the
  // user to say whether it replaces the pad or is appended to it.

  const stageFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        setNotice(t('errTooLarge', { size: formatBytes(MAX_FILE_BYTES) }));
        return;
      }
      if (file.type && !file.type.startsWith('text/') && !TEXT_TYPES.test(file.name)) {
        setNotice(t('errUnsupported'));
        return;
      }
      try {
        const body = await file.text();
        if (!body.trim()) {
          setNotice(t('errEmpty'));
          return;
        }
        setNotice(null);
        setStaged({ name: file.name, size: file.size, body });
      } catch {
        setNotice(t('errRead'));
      }
    },
    [t]
  );

  // One line, next to the tool's own file intake: this is all it takes to
  // receive a document from another tool in the suite.
  useHandoffIntake(file => void stageFile(file));

  const acceptStaged = (how: 'replace' | 'append') => {
    if (!staged) return;
    commit(current(), true);
    setText(previous => (how === 'append' ? `${previous}${previous.endsWith('\n') ? '' : '\n'}${staged.body}` : staged.body));
    setStaged(null);
  };

  const pasteFromClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) return;
      commit(current(), true);
      setText(clip);
    } catch {
      setNotice(t('errClipboard'));
    }
  };

  const copy = async (value: string, tag: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(tag);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // Non-secure contexts and hardened browsers refuse the API outright.
      setNotice(t('errClipboardWrite'));
    }
  };

  // -- exports --------------------------------------------------------------

  const matchesAsJson = useCallback(
    () =>
      JSON.stringify(
        matches.map(hit => ({
          index: hit.index,
          start: hit.start,
          end: hit.end,
          match: hit.value,
          groups: hit.groups.map(group => ({ number: group.number, name: group.name, value: group.value, start: group.start })),
        })),
        null,
        2
      ),
    [matches]
  );

  const matchesAsCsv = useCallback(() => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const width = matches.reduce((max, hit) => Math.max(max, hit.groups.length), 0);
    const header = ['index', 'start', 'end', 'match', ...Array.from({ length: width }, (_, i) => `group${i + 1}`)];
    const rows = matches.map(hit => [
      String(hit.index),
      String(hit.start),
      String(hit.end),
      escape(hit.value),
      ...Array.from({ length: width }, (_, i) => escape(hit.groups[i]?.value ?? '')),
    ]);
    return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  }, [matches]);

  const download = (body: string, name: string, type: string) => {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    // Revoked on the next tick: the click has already queued the download,
    // and holding the URL keeps the whole blob alive in memory.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handoffPayload = useCallback(async () => {
    const body = mode === 'replace' ? replaced : mode === 'split' ? parts.join('\n') : matchesAsJson();
    const name = mode === 'match' ? 'regexflow-matches.json' : 'regexflow-output.txt';
    const type = mode === 'match' ? 'application/json' : 'text/plain';
    return { blob: new Blob([body], { type }), name };
  }, [mode, replaced, parts, matchesAsJson]);

  // -- shareable link -------------------------------------------------------

  const shareLink = useCallback(() => {
    const payload = { p: pattern, f: flags, t: text.slice(0, 4000), r: replacement, m: mode };
    try {
      // encodeURIComponent first so non-Latin test text survives btoa.
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const url = `${window.location.origin}${window.location.pathname}#r=${encoded}`;
      void copy(url, 'link');
    } catch {
      setNotice(t('errShare'));
    }
  }, [pattern, flags, text, replacement, mode, t]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#r=')) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(hash.slice(3)))));
      if (typeof decoded.p === 'string') setPattern(decoded.p);
      if (typeof decoded.f === 'string') setFlags(decoded.f);
      if (typeof decoded.t === 'string') setText(decoded.t);
      if (typeof decoded.r === 'string') setReplacement(decoded.r);
      if (decoded.m === 'match' || decoded.m === 'replace' || decoded.m === 'split') setMode(decoded.m);
      window.history.replaceState({}, '', window.location.pathname);
    } catch {
      // A truncated or hand-edited hash is not worth an error banner.
    }
  }, []);

  // -- keyboard -------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;

      if (meta && event.key === 'Enter') {
        event.preventDefault();
        runState.run();
        return;
      }
      if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        const tag = (event.target as HTMLElement | null)?.tagName;
        // Inside a field the browser's own undo is the better behaviour.
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        event.preventDefault();
        undo();
        return;
      }
      if (meta && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'))) {
        const tag = (event.target as HTMLElement | null)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        event.preventDefault();
        redo();
        return;
      }
      if (event.key === 'F3') {
        event.preventDefault();
        setActiveMatch(previous => {
          if (matches.length === 0) return null;
          const base = previous ?? -1;
          const next = event.shiftKey ? base - 1 : base + 1;
          return (next + matches.length) % matches.length;
        });
        return;
      }
      // Alt shows the text as it really is, without any highlight on top.
      if (event.key === 'Alt') setRawView(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setRawView(false);
    };
    const onBlur = () => setRawView(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [matches.length, redo, runState, undo]);

  // -- derived --------------------------------------------------------------

  const tokens = useMemo(() => (mode === 'replace' ? replacementTokens(replacement) : []), [mode, replacement]);
  const generated = useMemo(
    () => targetById(target).build(pattern, flags, replacement),
    [target, pattern, flags, replacement]
  );
  const caveats = useMemo(() => targetById(target).caveats(pattern, flags), [target, pattern, flags]);

  const steps = [
    { art: StepWrite, title: t('step1Title'), text: t('step1Text') },
    { art: StepTune, title: t('step2Title'), text: t('step2Text') },
    { art: StepRun, title: t('step3Title'), text: t('step3Text') },
    { art: StepShip, title: t('step4Title'), text: t('step4Text') },
  ];
  const featureIcons = [IconTree, IconSandbox, IconHighlight, IconLint, IconExport, IconHandoff];
  const features = Array.isArray(dictionary?.features) ? dictionary.features : [];
  const faqs = Array.isArray(dictionary?.faq) ? dictionary.faq : [];
  const keywords: string[] = Array.isArray(dictionary?.seoKeywords) ? dictionary.seoKeywords : [];

  const cardClass = 'glass-card rounded-3xl border border-white/5 p-5 sm:p-6';
  const chipClass =
    'flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-slate-300 transition-all hover:bg-white/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="relative flex min-h-screen flex-col font-sans text-slate-100 selection:bg-fuchsia-500/30 selection:text-white">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/regex-flow`;
        }}
        onReset={reset}
        t={dictionary}
      />

      {/* The max-w lives on <main> itself, and reserves the width of the two
          fixed ad rails past 1400px. AdRail measures the gap between <main>
          and the viewport edge: with a plain max-w-7xl that gap is 60px a side
          at 1400px and the rails silently never render. */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] flex-1 flex-col gap-16 px-4 pb-20 pt-28 sm:px-6 md:pt-36">
        <AdBanner id="adsense-regex-flow-top" />

        {/* ================================================================= */}
        {/* Hero                                                              */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-fuchsia-800/40 bg-fuchsia-950/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-400">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t('badge')}</span>
            </div>
            <h1 className="text-balance text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t('seoHeroTitle')}
            </h1>
            <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-400 lg:mx-0 md:text-lg">
              {t('description')}
            </p>
            <div className="mx-auto grid max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2 lg:mx-0">
              {(Array.isArray(dictionary?.heroPoints) ? dictionary.heroPoints : []).map((point: string, index: number) => (
                <div key={index} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 p-3 text-left">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-fuchsia-300">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span className="text-[13px] font-bold leading-snug text-slate-300">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <RegexHeroArt
              className="relative mx-auto w-full max-w-lg drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              animated={!prefersReduced}
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* Workspace                                                         */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
          {/* -- inputs --------------------------------------------------- */}
          <div className="min-w-0 space-y-6 lg:col-span-3">
            {staged && (
              <div className="space-y-3 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{staged.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(staged.size)} · {staged.body.length.toLocaleString()} {t('charactersShort')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaged(null)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 transition-colors hover:text-white"
                    title={t('stagedDiscard')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">{t('stagedHint')}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => acceptStaged('replace')}
                    className="cursor-pointer rounded-xl bg-fuchsia-600 px-3.5 py-2 text-xs font-black text-white transition-all hover:bg-fuchsia-500"
                  >
                    {t('stagedReplace')}
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptStaged('append')}
                    className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-black text-slate-200 transition-all hover:bg-white/10"
                  >
                    {t('stagedAppend')}
                  </button>
                </div>
              </div>
            )}

            {notice && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                <span className="flex-1">{notice}</span>
                <button type="button" onClick={() => setNotice(null)} className="cursor-pointer text-red-300 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* -- pattern ------------------------------------------------- */}
            <div className={`${cardClass} space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Braces className="w-4 h-4 text-fuchsia-400" />
                  {t('label_regex')}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={undo} disabled={!canUndo} className={chipClass} title={t('undo')}>
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={redo} disabled={!canRedo} className={chipClass} title={t('redo')}>
                    <Redo2 className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={shareLink} className={chipClass} title={t('share')}>
                    {copied === 'link' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Link2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copy(`/${pattern}/${flags}`, 'regex')}
                    className={chipClass}
                    title={t('tooltip_copy')}
                  >
                    {copied === 'regex' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <PatternField
                value={pattern}
                onChange={value => {
                  commit(current());
                  setPattern(value);
                }}
                parsed={parsed}
                findings={findings}
                focus={focusRange}
                placeholder={t('regex_placeholder')}
                invalid={!ok}
                label={t('label_regex')}
              />

              {/* flags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {FLAG_ORDER.map(flag => {
                  const active = flags.includes(flag);
                  const unavailable = flag === 'v' && !capabilities.unicodeSets;
                  return (
                    <button
                      key={flag}
                      type="button"
                      onClick={() => toggleFlag(flag)}
                      disabled={unavailable}
                      title={`${t(`flag_${flag}`)}${unavailable ? ` — ${t('flagUnsupported')}` : ''}`}
                      className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                        active
                          ? 'border-fuchsia-400 bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {flag}
                    </button>
                  );
                })}
                <span className="ml-1 hidden text-[11px] text-slate-600 sm:inline">{t('flagsHint')}</span>
              </div>

              {/* status */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {!ok ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 font-bold text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="min-w-0 break-words" title={error}>
                      {regexErrorKey(error) ? t(regexErrorKey(error)!) : error}
                    </span>
                  </span>
                ) : timedOut ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-3 py-1.5 font-bold text-red-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {t('statusTimeout', { ms: TIMEOUT_MS })}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 font-bold text-green-400">
                    <Check className="w-3.5 h-3.5" />
                    {t('status_valid')}
                  </span>
                )}

                {ok && !timedOut && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-400">
                    {total === 0 ? t('noMatches') : t('matchesFound', { count: total })}
                  </span>
                )}

                {ok && needsUnicodeFlag(pattern, flags) && (
                  <span className="flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 font-bold text-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {t('regexHintUnicode')}
                  </span>
                )}

                {busy && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-slate-400">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t('running')}
                  </span>
                )}

                {ok && !busy && !timedOut && total > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-slate-500">
                    {ms} ms
                  </span>
                )}

                <span
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-bold ${
                    sandboxed ? 'border-white/10 bg-white/5 text-slate-400' : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
                  }`}
                  title={sandboxed ? t('sandboxOnHint') : t('sandboxOffHint')}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {sandboxed ? t('sandboxOn') : t('sandboxOff')}
                </span>
              </div>

              {/* lint */}
              {findings.length > 0 && (
                <ul className="space-y-1.5 list-none m-0 p-0">
                  {findings.slice(0, 4).map(finding => (
                    <li
                      key={finding.code}
                      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] leading-relaxed ${SEVERITY_STYLE[finding.severity]}`}
                    >
                      {finding.severity === 'info' ? (
                        <Info className="mt-0.5 w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertTriangle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1">{t(`lint_${finding.code}`, finding.params)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* -- mode + run --------------------------------------------- */}
            <div className={`${cardClass} space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {(['match', 'replace', 'split'] as RunMode[]).map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                        mode === item
                          ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      {MODE_ICON[item]}
                      {t(`mode_${item}`)}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLive(value => !value)}
                    title={t('liveHint')}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black transition-all ${
                      live
                        ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {live ? t('liveOn') : t('liveOff')}
                  </button>

                  <button
                    type="button"
                    onClick={runState.run}
                    disabled={busy || !pattern}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-black text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                      manual && pattern ? 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-lg shadow-fuchsia-900/40' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {t('runNow')}
                  </button>
                </div>
              </div>

              {manual && pattern && (
                <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
                  {live ? t('manualBecauseSize', { limit: AUTO_LIMIT.toLocaleString() }) : t('manualBecauseOff')}
                </p>
              )}

              {dangerous && (
                <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-300">
                  {t('dangerNotice', { ms: TIMEOUT_MS })}
                </p>
              )}
            </div>

            {/* -- test text ------------------------------------------------ */}
            <div className={`${cardClass} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <FileText className="w-4 h-4 text-fuchsia-400" />
                  {t('label_test_text')}
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={chipClass}>
                    <Upload className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('openFile')}</span>
                  </button>
                  <button type="button" onClick={() => void pasteFromClipboard()} className={chipClass}>
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('pasteText')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      commit(current(), true);
                      setText('');
                    }}
                    disabled={!text}
                    className={chipClass}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('clearText')}</span>
                  </button>
                </div>
              </div>

              <TestPad
                value={text}
                onChange={value => {
                  commit(current());
                  setText(value);
                }}
                matches={rawView ? [] : matches}
                activeIndex={activeMatch}
                onActivate={setActiveMatch}
                placeholder={t('text_placeholder')}
                label={t('label_test_text')}
                dimmed={busy}
              />

              <p className="text-[11px] text-slate-600">{t('padHint')}</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.log,.md,.csv,.tsv,.json,.xml,.yml,.yaml,.html,.css,.js,.ts,text/*"
                className="hidden"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) void stageFile(file);
                  event.target.value = '';
                }}
              />
            </div>

            {/* -- replacement / split -------------------------------------- */}
            {mode === 'replace' && (
              <div className={`${cardClass} space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Replace className="w-4 h-4 text-fuchsia-400" />
                    {t('label_replacement')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onMouseDown={() => setShowOriginal(true)}
                      onMouseUp={() => setShowOriginal(false)}
                      onMouseLeave={() => setShowOriginal(false)}
                      onTouchStart={() => setShowOriginal(true)}
                      onTouchEnd={() => setShowOriginal(false)}
                      className={chipClass}
                      title={t('compareHint')}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('compare')}</span>
                    </button>
                    <button type="button" onClick={() => void copy(replaced, 'result')} className={chipClass}>
                      {copied === 'result' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{t('tooltip_copy')}</span>
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={replacement}
                  onChange={event => {
                    commit(current());
                    setReplacement(event.target.value);
                  }}
                  placeholder={t('replace_placeholder')}
                  spellCheck={false}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-fuchsia-500/50"
                />

                {tokens.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tokens.map((token, index) => (
                      <span
                        key={`${token.raw}-${index}`}
                        className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-300"
                      >
                        <code className="font-mono">{token.raw}</code> · {t(`token_${token.kind}`, { value: token.value })}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {showOriginal ? t('label_before') : t('label_result')}
                  </span>
                  <div className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/5 bg-black/60 p-4 font-mono text-[13px] leading-6 text-slate-300">
                    {(showOriginal ? text : replaced) || <span className="italic text-slate-600">{t('emptyResult')}</span>}
                  </div>
                </div>
              </div>
            )}

            {mode === 'split' && (
              <div className={`${cardClass} space-y-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <Scissors className="w-4 h-4 text-fuchsia-400" />
                    {t('mode_split')}
                  </span>
                  <span className="text-[11px] text-slate-500">{t('splitCount', { count: parts.length })}</span>
                </div>
                <ol className="max-h-64 space-y-1.5 overflow-auto pr-1 list-none m-0 p-0">
                  {parts.map((part, index) => (
                    <li key={index} className="flex gap-2 rounded-lg border border-white/5 bg-black/40 px-3 py-2">
                      <span className="shrink-0 font-mono text-[10px] text-slate-600">{index}</span>
                      <code className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-[12px] text-slate-300">
                        {part === '' ? <span className="italic text-slate-600">{t('emptyPart')}</span> : part}
                      </code>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <NextStepBar lang={lang} t={t} getResult={handoffPayload} disabled={!ok || total === 0} />
          </div>

          {/* -- results -------------------------------------------------- */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <div className={`${cardClass} space-y-4`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <IconHighlight className="w-4 h-4 text-fuchsia-400" />
                  {t('label_matches')}
                </span>
                {matches.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => download(matchesAsJson(), 'regexflow-matches.json', 'application/json')} className={chipClass}>
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                    <button type="button" onClick={() => download(matchesAsCsv(), 'regexflow-matches.csv', 'text/csv')} className={chipClass}>
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                  </div>
                )}
              </div>

              <MatchTable
                matches={matches}
                total={total}
                truncated={truncated}
                activeIndex={activeMatch}
                onActivate={setActiveMatch}
                t={t}
              />
            </div>

            <div className={`${cardClass} space-y-4`}>
              <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                <IconTree className="w-4 h-4 text-fuchsia-400" />
                {t('label_explanation')}
              </span>

              {explanation.length > 0 ? (
                <div className="max-h-[28rem] overflow-y-auto pr-1">
                  <ExplainTree nodes={explanation} onFocus={setFocusRange} />
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-slate-600">{t('explainEmpty')}</p>
              )}

              {parsed && parsed.captures.length > 0 && (
                <p className="border-t border-white/5 pt-3 text-[11px] text-slate-500">
                  {t('captureCount', { count: parsed.captures.length })}
                  {!capabilities.indices && ` · ${t('noIndices')}`}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* Library / cheat sheet / code export                               */}
        {/* ================================================================= */}
        <section className={`${cardClass} space-y-5`}>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'library' as const, icon: <Library className="w-3.5 h-3.5" />, label: t('shelf_library') },
                { id: 'cheat' as const, icon: <Braces className="w-3.5 h-3.5" />, label: t('shelf_cheat') },
                { id: 'code' as const, icon: <IconExport className="w-3.5 h-3.5" />, label: t('shelf_code') },
              ]
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setShelf(tab.id)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                  shelf === tab.id
                    ? 'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {shelf === 'library' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all ${
                      category === item
                        ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {t(`cat_${item}`)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {LIBRARY.filter(entry => entry.category === category).map(entry => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => loadEntry(entry)}
                    className="group flex cursor-pointer flex-col gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-fuchsia-500/30 hover:bg-fuchsia-500/5"
                  >
                    <span className="text-[13px] font-bold text-slate-200 group-hover:text-fuchsia-300">
                      {t(`lib_${entry.id}`)}
                    </span>
                    <code className="w-full truncate font-mono text-[10px] text-slate-500">{entry.pattern}</code>
                  </button>
                ))}
              </div>
            </div>
          )}

          {shelf === 'cheat' && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {CHEAT_SHEET.map(group => (
                <div key={group.id} className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-400/70">
                    {t(`cheatGroup_${group.id}`)}
                  </h3>
                  <dl className="space-y-1.5 m-0">
                    {group.items.map(item => (
                      <div key={item.token} className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-1.5">
                        <dt>
                          <code className="select-all rounded border border-fuchsia-500/20 bg-fuchsia-500/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-fuchsia-300">
                            {item.token}
                          </code>
                        </dt>
                        <dd className="m-0 min-w-0 flex-1 text-right text-[11px] font-medium text-slate-400">{t(item.key)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          )}

          {shelf === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {CODE_TARGETS.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTarget(item.id)}
                    className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all ${
                      target === item.id
                        ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {caveats.length > 0 && (
                <ul className="space-y-1.5 list-none m-0 p-0">
                  {caveats.map(code => (
                    <li
                      key={code}
                      className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300"
                    >
                      <AlertTriangle className="mt-0.5 w-3.5 h-3.5 shrink-0" />
                      <span className="min-w-0 flex-1">{t(`caveat_${code}`)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => void copy(generated, 'code')}
                  className={`absolute right-3 top-3 z-10 ${chipClass}`}
                >
                  {copied === 'code' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{t('tooltip_copy')}</span>
                </button>
                <pre className="overflow-x-auto rounded-2xl border border-white/5 bg-black/60 p-4 pr-24 font-mono text-[12px] leading-6 text-slate-300">
                  <code>{generated}</code>
                </pre>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================= */}
        {/* How it works                                                      */}
        {/* ================================================================= */}
        <section className="space-y-8">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t('howItWorksTitle')}</h2>
            <div className="mx-auto h-1 w-16 rounded-full bg-fuchsia-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Art = step.art;
              return (
                <div
                  key={index}
                  className="group relative space-y-4 overflow-hidden rounded-3xl border border-white/5 glass-card p-6 transition-all hover:border-fuchsia-500/20"
                >
                  <span className="absolute right-5 top-4 text-5xl font-black text-white/5 transition-colors group-hover:text-fuchsia-500/10">
                    {index + 1}
                  </span>
                  <Art className="h-auto w-24 text-fuchsia-400" />
                  <h3 className="text-base font-bold leading-snug text-white">{step.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================= */}
        {/* Features                                                          */}
        {/* ================================================================= */}
        <motion.section
          initial={prefersReduced ? false : 'hidden'}
          whileInView={prefersReduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.12 }}
          variants={fadeInUp}
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature: any, index: number) => {
            const Icon = featureIcons[index] || IconLocalOnly;
            return (
              <div key={index} className="group rounded-3xl border border-white/5 glass-card p-6 transition-all duration-300 hover:-translate-y-1">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-400 transition-all group-hover:scale-110 group-hover:border-fuchsia-500/40">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="mb-2 text-base font-bold text-white transition-colors group-hover:text-fuchsia-400">{feature.title}</h3>
                <p className="text-[13px] font-medium leading-relaxed text-slate-500">{feature.text}</p>
              </div>
            );
          })}
        </motion.section>

        {/* ================================================================= */}
        {/* SEO copy + FAQ                                                    */}
        {/* ================================================================= */}
        <section className="space-y-16 text-left">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-6">
              {keywords[0] && (
                <div className="inline-block rounded-lg border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-400">
                  {keywords[0]}
                </div>
              )}
              <h2 className="text-2xl font-black leading-tight tracking-tight text-white md:text-4xl">
                {t('seoBrowserSpeedTitle')}
              </h2>
              <p className="text-base leading-relaxed text-slate-400">{t('seoBrowserSpeedText')}</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {(Array.isArray(dictionary?.seoHeroList) ? dictionary.seoHeroList : []).map((point: string, index: number) => (
                  <div key={index} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/5 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-fuchsia-300">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span className="text-[13px] font-bold text-slate-300">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 glass-card p-8 py-14 text-center">
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
              <IconLocalOnly className="relative h-16 w-16 text-fuchsia-400" />
              <div className="relative max-w-sm space-y-3">
                <h3 className="text-xl font-black leading-tight tracking-tight text-white">{t('seoPrivacyTitle')}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{t('seoPrivacyText')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-white/5 bg-[#150719] p-7 md:p-12">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-xl font-black leading-tight text-white md:text-3xl">{t('seoSecondaryTitle')}</h2>
              <div className="h-1.5 w-20 rounded-full bg-fuchsia-500" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t('seoUseCaseTitle')}
                </div>
                <p className="text-[15px] leading-relaxed text-slate-400">{t('seoUseCaseText')}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t('seoEngineTitle')}
                </div>
                <p className="text-[15px] leading-relaxed text-slate-400">{t('seoEngineText')}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-8">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t('faqTitle')}</h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-fuchsia-500" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, index: number) => (
                  <details
                    key={index}
                    className="group rounded-2xl border border-white/5 glass-card px-5 py-4 text-left transition-colors hover:border-fuchsia-500/20 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 text-[15px] font-bold text-white transition-colors group-hover:text-fuchsia-400">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-[11px] font-black text-fuchsia-400">
                        Q
                      </span>
                      <span className="min-w-0 flex-1">{faq.question}</span>
                      <ChevronDown className="mt-0.5 w-4 h-4 shrink-0 text-fuchsia-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="pl-9 pt-3 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-4 text-center opacity-55">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t('seoKeywordsTitle')}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="cursor-default rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-all hover:border-fuchsia-500/20 hover:bg-fuchsia-500/10 hover:text-fuchsia-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-regex-flow-bottom" />
      </main>

      <Footer lang={lang} t={dictionary} onOpenModal={setLegalModal} />

      <LegalModal
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        title={
          legalModal === 'privacy'
            ? legalTranslations[lang]?.nav.privacy || 'Privacy Policy'
            : legalModal === 'terms'
              ? legalTranslations[lang]?.nav.terms || 'Terms of Service'
              : legalTranslations[lang]?.nav.cookies || 'Cookie Policy'
        }
        content={
          legalModal === 'privacy'
            ? legalTranslations[lang]?.privacy.content || ''
            : legalModal === 'terms'
              ? legalTranslations[lang]?.terms.content || ''
              : legalTranslations[lang]?.cookies.content || ''
        }
        t={dictionary}
      />
    </div>
  );
};

export default RegexFlow;
