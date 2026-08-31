import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileCode2,
  FileUp,
  Keyboard,
  Loader2,
  Minus,
  Pin,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  WrapText,
  X,
} from 'lucide-react';

import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Editor } from './components/Editor';
import { DiffView, type ViewMode } from './components/DiffView';
import { ProseView } from './components/ProseView';
import { NextStepBar } from './components/NextStepBar';
import {
  DiffHeroArt,
  IconAnchor,
  IconFold,
  IconHandoff,
  IconLocal,
  IconMyers,
  IconPatch,
  IconSyntax,
  IconWhitespace,
  IconWordLevel,
  IconWorker,
  STEP_ART,
} from './components/Illustrations';

import { useDiffSnap, WORKER_THRESHOLD } from './lib/useDiffSnap';
import { useTextDoc } from './lib/history';
import { SAMPLES, type SampleId } from './lib/samples';
import { toHtmlReport, toSummary, toUnifiedPatch } from './lib/patch';
import {
  ACCEPT_ATTRIBUTE,
  baseName,
  copyText,
  downloadText,
  extensionOf,
  formatBytes,
  formatCount,
  MAX_FILE_BYTES,
  PARK_FILE_LIMIT,
  readTextFile,
} from './lib/io';
import {
  ensureGrammar,
  guessLanguage,
  languageForExtension,
  LANGUAGES,
  type LanguageId,
} from './lib/highlight';
import { DEFAULT_OPTIONS, type Anchor, type CompareOptions, type WhitespaceMode } from './types';

interface DiffSnapProps {
  lang: Language;
  dictionary: any;
}

const CONTEXT_CHOICES = [1, 3, 8, Infinity];

export const DiffSnap: React.FC<DiffSnapProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);

  const docA = useTextDoc('');
  const docB = useTextDoc('');
  const compare = useDiffSnap();

  const [options, setOptions] = useState<CompareOptions>(DEFAULT_OPTIONS);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [pendingAnchor, setPendingAnchor] = useState<{ side: 'a' | 'b'; line: number } | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [language, setLanguage] = useState<LanguageId>('auto');
  const [grammarReady, setGrammarReady] = useState(0);
  const [context, setContext] = useState<number>(3);
  const [wrap, setWrap] = useState(false);
  const [fontSize, setFontSize] = useState(12.5);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [inverted, setInverted] = useState(false);
  const [hunkCursor, setHunkCursor] = useState(0);
  const [scrollTo, setScrollTo] = useState<{ hunk: number; nonce: number } | null>(null);

  const [nameA, setNameA] = useState<string | null>(null);
  const [nameB, setNameB] = useState<string | null>(null);
  const [parked, setParked] = useState<{ file: File; side: 'a' | 'b' } | null>(null);
  const [dragOver, setDragOver] = useState<'a' | 'b' | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const fileA = useRef<HTMLInputElement>(null);
  const fileB = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resultRef = useRef<HTMLDivElement>(null);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const notify = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(copyTimer.current);
    },
    []
  );

  const textA = docA.text;
  const textB = docB.text;
  const hasBoth = textA.length > 0 || textB.length > 0;

  // Counting newlines beats split('\n').length here: no array of a hundred
  // thousand strings gets allocated on every keystroke.
  const countLines = (text: string) => {
    let count = 1;
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) count++;
    return count;
  };
  const linesInA = useMemo(() => countLines(textA), [textA]);
  const linesInB = useMemo(() => countLines(textB), [textB]);

  // A pin is a pair of line numbers, so it stops meaning anything once those
  // lines are gone. Dropping the out-of-range ones keeps a stale pin from
  // quietly reshaping a comparison of completely different text.
  useEffect(() => {
    setAnchors(current => {
      const kept = current.filter(anchor => anchor.a < linesInA && anchor.b < linesInB);
      return kept.length === current.length ? current : kept;
    });
    setPendingAnchor(current =>
      current && current.line < (current.side === 'a' ? linesInA : linesInB) ? current : null
    );
  }, [linesInA, linesInB]);

  // ---------------------------------------------------------------------
  // Nothing runs by itself. Every change only marks the result as stale.
  // ---------------------------------------------------------------------
  const touch = compare.touch;
  useEffect(() => {
    touch(textA, textB, options, anchors);
  }, [touch, textA, textB, options, anchors]);

  // -- language ----------------------------------------------------------
  const effectiveLanguage: LanguageId = useMemo(() => {
    if (language !== 'auto') return language;
    const byName = nameA ? languageForExtension(extensionOf(nameA)) : null;
    if (byName) return byName;
    const byNameB = nameB ? languageForExtension(extensionOf(nameB)) : null;
    if (byNameB) return byNameB;
    return guessLanguage(textA || textB);
  }, [language, nameA, nameB, textA, textB]);

  useEffect(() => {
    let cancelled = false;
    void ensureGrammar(effectiveLanguage).then(ok => {
      if (!cancelled && ok) setGrammarReady(value => value + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveLanguage]);

  // -- files -------------------------------------------------------------
  const applyFile = useCallback(
    async (file: File, side: 'a' | 'b') => {
      try {
        const raw = await readTextFile(file);
        const doc = side === 'a' ? docA : docB;
        doc.load(raw);
        if (side === 'a') setNameA(baseName(file.name));
        else setNameB(baseName(file.name));
        // A different file means the pinned line numbers refer to text that is
        // no longer there.
        setAnchors([]);
        setPendingAnchor(null);
      } catch (error) {
        notify(
          (error as Error).message === 'too-large'
            ? (t.file_too_large || 'That file is larger than {0} — a browser tab cannot hold it.').replace(
                '{0}',
                formatBytes(MAX_FILE_BYTES)
              )
            : t.file_failed || 'That file could not be read.'
        );
      }
    },
    [docA, docB, notify, t]
  );

  const acceptFile = useCallback(
    (file: File, side: 'a' | 'b') => {
      // Dropping 12 MB straight into a textarea freezes the tab before anything
      // has been compared, so past a point it waits behind an explicit click.
      if (file.size > PARK_FILE_LIMIT) {
        setParked({ file, side });
        return;
      }
      void applyFile(file, side);
    },
    [applyFile]
  );

  // A document handed over by another tool lands in the first free side.
  useHandoffIntake(file => {
    acceptFile(file, docA.text.trim() === '' ? 'a' : 'b');
  });

  // -- samples -----------------------------------------------------------
  const loadSample = useCallback(
    (id: SampleId) => {
      const sample = SAMPLES[id];
      docA.load(sample.a);
      docB.load(sample.b);
      setNameA(null);
      setNameB(null);
      setAnchors([]);
      setPendingAnchor(null);
      setLanguage(sample.language === 'none' ? 'none' : sample.language);
      if (id === 'prose') setOptions(current => ({ ...current, granularity: 'word' }));
      else setOptions(current => ({ ...current, granularity: 'line' }));
    },
    [docA, docB]
  );

  // -- run ---------------------------------------------------------------
  const run = useCallback(() => {
    if (!hasBoth) return;
    compare.run(textA, textB, options, anchors);
    setHunkCursor(0);
    // Scroll the result into view only when it was not visible: jumping the
    // page on every re-run is worse than not scrolling at all.
    window.setTimeout(() => {
      const box = resultRef.current?.getBoundingClientRect();
      if (box && box.top > window.innerHeight - 120) {
        resultRef.current?.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      }
    }, 40);
  }, [anchors, compare, hasBoth, options, prefersReduced, textA, textB]);

  const swap = useCallback(() => {
    const a = docA.text;
    const b = docB.text;
    docA.load(b);
    docB.load(a);
    setNameA(nameB);
    setNameB(nameA);
    setAnchors(current => current.map(anchor => ({ a: anchor.b, b: anchor.a })));
    setPendingAnchor(null);
  }, [docA, docB, nameA, nameB]);

  const resetAll = useCallback(() => {
    docA.load('');
    docB.load('');
    setNameA(null);
    setNameB(null);
    setAnchors([]);
    setPendingAnchor(null);
    setParked(null);
    compare.clear();
  }, [compare, docA, docB]);

  // -- anchors -----------------------------------------------------------
  // Clicking a line number on one side arms it; clicking one on the other side
  // pins the pair. Clicking an already pinned line removes it. Deliberately
  // written with plain reads instead of nested state updaters — deciding what
  // to do needs both `anchors` and `pendingAnchor` at once, and a `setState`
  // inside another `setState` updater cannot see either of them reliably.
  const handleAnchor = useCallback(
    (side: 'a' | 'b', line: number) => {
      const existing = anchors.find(anchor => (side === 'a' ? anchor.a : anchor.b) === line);
      if (existing) {
        setAnchors(anchors.filter(anchor => anchor !== existing));
        setPendingAnchor(null);
        return;
      }
      if (pendingAnchor && pendingAnchor.side !== side) {
        const next: Anchor =
          side === 'b' ? { a: pendingAnchor.line, b: line } : { a: line, b: pendingAnchor.line };
        setAnchors([...anchors, next]);
        setPendingAnchor(null);
        notify(t.anchor_added || 'Alignment pinned. Press Compare to apply it.');
        return;
      }
      setPendingAnchor({ side, line });
    },
    [anchors, notify, pendingAnchor, t]
  );

  // -- navigation --------------------------------------------------------
  const result = compare.result;
  const lineResult = result && result.kind === 'line' ? result : null;
  const proseResult = result && result.kind === 'prose' ? result : null;
  const stats = result?.stats ?? null;
  const totalHunks = lineResult?.stats.hunks ?? 0;

  const gotoHunk = useCallback(
    (delta: number) => {
      if (totalHunks === 0) return;
      const next = (hunkCursor + delta + totalHunks) % totalHunks;
      setHunkCursor(next);
      setScrollTo({ hunk: next, nonce: Date.now() });
    },
    [hunkCursor, totalHunks]
  );

  // -- exports -----------------------------------------------------------
  const patchName = useCallback(
    (side: 'a' | 'b') => {
      const name = side === 'a' ? nameA : nameB;
      if (name) return `${side === 'a' ? 'a' : 'b'}/${name}`;
      return side === 'a' ? 'a/original.txt' : 'b/modified.txt';
    },
    [nameA, nameB]
  );

  const patchText = useMemo(() => {
    if (!lineResult) return '';
    return toUnifiedPatch(
      lineResult.unified,
      { nameA: patchName('a'), nameB: patchName('b'), context: Number.isFinite(context) ? context : 3 },
      textA.endsWith('\n'),
      textB.endsWith('\n')
    );
  }, [context, lineResult, patchName, textA, textB]);

  const flash = useCallback((key: string) => {
    clearTimeout(copyTimer.current);
    setCopied(key);
    copyTimer.current = setTimeout(() => setCopied(null), 1600);
  }, []);

  const copyAndFlash = useCallback(
    async (key: string, text: string) => {
      if (!text) {
        notify(t.nothing_to_export || 'There is nothing to export yet.');
        return;
      }
      const ok = await copyText(text);
      if (ok) flash(key);
      else notify(t.copy_failed || 'The browser refused clipboard access.');
    },
    [flash, notify, t]
  );

  const getResult = useCallback(async () => {
    const payload = textB.trim() ? textB : textA;
    if (!payload.trim()) return null;
    const name = nameB || nameA || 'diffsnap.txt';
    return { blob: new Blob([payload], { type: 'text/plain;charset=utf-8' }), name: baseName(name) };
  }, [nameA, nameB, textA, textB]);

  // -- keyboard ----------------------------------------------------------
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      return (
        !!element &&
        (element.tagName === 'INPUT' ||
          element.tagName === 'TEXTAREA' ||
          element.tagName === 'SELECT' ||
          element.isContentEditable)
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      const typing = isTyping(event.target);

      // Holding Alt mirrors the comparison: the diff of B against A is the
      // exact mirror of A against B, so nothing is recomputed.
      if (event.key === 'Alt') setInverted(true);

      if (event.key === 'Escape') {
        setShowShortcuts(false);
        setPendingAnchor(null);
        return;
      }

      // The textareas are controlled, so the browser's own undo stack is dead
      // here — these have to be intercepted even while typing.
      if (mod && event.key.toLowerCase() === 'z') {
        const inB = (event.target as HTMLElement | null)?.getAttribute('aria-label') === labelB;
        event.preventDefault();
        const doc = inB ? docB : docA;
        if (event.shiftKey) doc.redo();
        else doc.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        const inB = (event.target as HTMLElement | null)?.getAttribute('aria-label') === labelB;
        event.preventDefault();
        (inB ? docB : docA).redo();
        return;
      }
      if (mod && event.key === 'Enter') {
        event.preventDefault();
        run();
        return;
      }

      if (typing) return;

      if (event.key === 'n' || event.key === 'j') {
        event.preventDefault();
        gotoHunk(1);
      } else if (event.key === 'p' || event.key === 'k') {
        event.preventDefault();
        gotoHunk(-1);
      } else if (event.key === 's') {
        event.preventDefault();
        swap();
      } else if (event.key === 'w') {
        event.preventDefault();
        setWrap(value => !value);
      } else if (event.key === '?') {
        setShowShortcuts(true);
      } else if (event.key === '+' || event.key === '=') {
        setFontSize(size => Math.min(20, size + 1));
      } else if (event.key === '-') {
        setFontSize(size => Math.max(10, size - 1));
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setInverted(false);
    };
    // Alt+Tab steals the keyup, which would leave the view mirrored for good.
    const onBlur = () => setInverted(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docA, docB, gotoHunk, run, swap]);

  // Small screens cannot show two code columns; start on the unified view.
  useEffect(() => {
    if (window.innerWidth < 900) setViewMode('unified');
  }, []);

  // -- copy ---------------------------------------------------------------
  const labelA = nameA || t.label_original || 'Original (A)';
  const labelB = nameB || t.label_modified || 'Modified (B)';

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const steps = [
    { title: t.step1Title || 'Bring both versions in', text: t.step1Text || 'Paste them, drop two files, or let another tool hand one over. Nothing is uploaded and nothing is compared yet.' },
    { title: t.step2Title || 'Say what counts as a change', text: t.step2Text || 'Lines, words or characters; ignore indentation, case or blank lines. Then press Compare — the expensive step only runs when you ask.' },
    { title: t.step3Title || 'Read the result', text: t.step3Text || 'Aligned columns with the changed words picked out, unchanged blocks folded away, and jump-to-next-change on one key.' },
    { title: t.step4Title || 'Take it away', text: t.step4Text || 'A unified .patch that git apply accepts, a standalone HTML report, or the revised text sent straight to another tool.' },
  ];

  const featureIcons = [
    IconMyers,
    IconWordLevel,
    IconWhitespace,
    IconFold,
    IconAnchor,
    IconSyntax,
    IconPatch,
    IconWorker,
  ];
  const features: { title: string; text: string }[] =
    Array.isArray(t.features) && t.features.length
      ? t.features
      : [
          { title: 'Myers, in linear space', text: 'The classic O(ND) algorithm with the divide-and-conquer refinement, so memory stays flat no matter how far apart the two files are.' },
          { title: 'Word-level highlighting', text: 'Rewritten lines are compared again word by word, so you see the three characters that changed, not a wall of red and green.' },
        ];

  const shortcuts: [string, string][] = [
    ['Ctrl / ⌘ + Enter', t.sc_run || 'Compare'],
    ['Ctrl / ⌘ + Z', t.sc_undo || 'Undo in the focused editor'],
    ['Ctrl / ⌘ + ⇧ + Z', t.sc_redo || 'Redo in the focused editor'],
    ['N / J', t.sc_next || 'Next change'],
    ['P / K', t.sc_prev || 'Previous change'],
    ['S', t.sc_swap || 'Swap the two sides'],
    ['W', t.sc_wrap || 'Toggle soft wrap'],
    ['Alt (hold)', t.sc_invert || 'Mirror the comparison while held'],
    ['+ / −', t.sc_font || 'Font size'],
    ['?', t.sc_help || 'This panel'],
  ];

  const identical = !!stats && stats.added === 0 && stats.removed === 0 && stats.modified === 0;

  // -- editor panel -------------------------------------------------------
  const editorPanel = (side: 'a' | 'b') => {
    const doc = side === 'a' ? docA : docB;
    const label = side === 'a' ? labelA : labelB;
    const input = side === 'a' ? fileA : fileB;
    const name = side === 'a' ? nameA : nameB;

    return (
      <div
        onDragOver={event => {
          event.preventDefault();
          setDragOver(side);
        }}
        onDragLeave={() => setDragOver(current => (current === side ? null : current))}
        onDrop={event => {
          event.preventDefault();
          setDragOver(null);
          const file = event.dataTransfer.files?.[0];
          if (file) acceptFile(file, side);
        }}
        className={`relative glass-card rounded-3xl border flex flex-col h-[340px] sm:h-[420px] lg:h-[500px] overflow-hidden transition-colors ${
          dragOver === side ? 'border-cyan-500 border-dashed' : 'border-white/5'
        }`}
      >
        {dragOver === side && (
          <div className="absolute inset-0 z-30 bg-[#050809]/92 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <FileUp className="w-10 h-10 text-cyan-400" />
            <p className="text-sm font-bold text-white text-center px-6">
              {t.drop_file_prompt || 'Drop a text or code file'}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-white/5 bg-black/25 shrink-0">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${side === 'a' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            <span className="truncate max-w-[9rem] sm:max-w-[14rem]">{label}</span>
          </span>
          <span className="h-px flex-1 bg-white/5 min-w-[0.5rem]" />

          <span className="text-[10px] font-mono text-slate-600 tabular-nums">
            {formatCount(doc.text ? doc.text.split(/\r\n|\r|\n/).length : 0)}
          </span>

          <button
            type="button"
            onClick={doc.undo}
            disabled={!doc.canUndo}
            aria-label={t.undo || 'Undo'}
            title={`${t.undo || 'Undo'} (Ctrl+Z)`}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={doc.redo}
            disabled={!doc.canRedo}
            aria-label={t.redo || 'Redo'}
            title={`${t.redo || 'Redo'} (Ctrl+Shift+Z)`}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <label
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer"
            title={t.open_file || 'Open a file'}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span className="sr-only">{t.label_import || 'Import file'}</span>
            <input
              ref={input}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="hidden"
              onChange={event => {
                const file = event.target.files?.[0];
                if (file) acceptFile(file, side);
                // Without this, picking the same file twice does nothing at all.
                event.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              doc.load('');
              if (side === 'a') setNameA(null);
              else setNameB(null);
            }}
            disabled={!doc.text}
            aria-label={t.clear || 'Clear'}
            title={t.clear || 'Clear'}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <Editor
          value={doc.text}
          onChange={next => doc.setText(next, true)}
          ariaLabel={label}
          placeholder={
            side === 'a'
              ? t.placeholder_a || 'Paste the original here, or drop a file…'
              : t.placeholder_b || 'Paste the new version here, or drop a file…'
          }
        />

        {name && (
          <div className="px-4 py-1.5 border-t border-white/5 bg-black/20 text-[10.5px] font-mono text-slate-500 truncate shrink-0">
            {name} · {formatBytes(doc.text.length)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050809] text-slate-200 flex flex-col justify-between font-sans selection:bg-cyan-500/20 selection:text-cyan-100">
      <Header
        currentLang={lang}
        onLanguageChange={next => {
          const segments = window.location.pathname.split('/');
          if (segments.length >= 3) {
            segments[1] = next.toLowerCase();
            window.location.pathname = segments.join('/');
          } else {
            window.location.href = `/${next.toLowerCase()}/diffsnap`;
          }
        }}
        t={t}
      />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          The previous max-w-7xl left 60px at 1400px — well under the 168px a
          rail needs — so the rails never rendered at any window size. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-32 md:pt-36 pb-20">
        <AdBanner id="adsense-diffsnap-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center mb-12">
          <div className="space-y-5 min-w-0">
            <span className="inline-block px-3.5 py-1.5 bg-cyan-500/10 text-cyan-300 text-[11px] font-black uppercase tracking-[0.2em] rounded-full border border-cyan-500/20">
              {t.title} · {t.hero_badge || 'Compare'}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-outfit tracking-tight leading-[1.08]">
              {t.seoHeroTitle}
            </h1>
            <p className="text-slate-400 text-base md:text-lg font-medium leading-relaxed">{t.description}</p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[12px] font-bold text-slate-300"
                >
                  <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3] shrink-0" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <DiffHeroArt className="w-full h-auto max-w-lg mx-auto" animated={!prefersReduced} />
        </section>

        {/* ================================================================ */}
        {/* Samples                                                          */}
        {/* ================================================================ */}
        <section className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mr-1">
            {t.sample_label || 'Try it with'}
          </span>
          {(
            [
              ['code', t.sample_code || 'A rewritten function'],
              ['indent', t.sample_indent || 'A re-indented block'],
              ['config', t.sample_config || 'A changed config'],
              ['prose', t.sample_prose || 'An edited paragraph'],
            ] as [SampleId, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => loadSample(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-[11.5px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              {label}
            </button>
          ))}
        </section>

        {/* ================================================================ */}
        {/* Editors                                                          */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {editorPanel('a')}
          {editorPanel('b')}
        </section>

        {parked && (
          <div className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-wrap items-center gap-3">
            <FileUp className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-[12px] text-amber-100 font-bold break-all">{parked.file.name}</span>
            <span className="text-[11px] font-mono text-amber-200/70">{formatBytes(parked.file.size)}</span>
            <span className="h-px flex-1 bg-amber-500/20 min-w-[1rem]" />
            <span className="text-[11px] text-amber-200/70 max-w-sm">
              {t.parked_hint || 'Held back on purpose: loading a file this size into the editor is the expensive part.'}
            </span>
            <button
              type="button"
              onClick={() => {
                const held = parked;
                setParked(null);
                if (held) void applyFile(held.file, held.side);
              }}
              className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-100 text-[11px] font-bold cursor-pointer"
            >
              {t.parked_load || 'Load it'}
            </button>
            <button
              type="button"
              onClick={() => setParked(null)}
              aria-label={t.close || 'Close'}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* Options + run                                                    */}
        {/* ================================================================ */}
        <section className="mt-4 glass-card rounded-2xl border border-white/5 p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mr-1">
              {t.opt_title || 'Compare by'}
            </span>

            <div className="flex rounded-xl bg-white/[0.03] border border-white/10 p-1 gap-1">
              {(
                [
                  ['line', t.gran_line || 'Lines'],
                  ['word', t.gran_word || 'Words'],
                  ['char', t.gran_char || 'Characters'],
                ] as ['line' | 'word' | 'char', string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOptions(current => ({ ...current, granularity: id }))}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    options.granularity === id
                      ? 'bg-cyan-500 text-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={options.whitespace}
              onChange={event =>
                setOptions(current => ({ ...current, whitespace: event.target.value as WhitespaceMode }))
              }
              aria-label={t.opt_whitespace || 'Whitespace'}
              className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold cursor-pointer"
            >
              <option value="none" className="bg-[#050809]">{t.ws_none || 'Whitespace matters'}</option>
              <option value="trailing" className="bg-[#050809]">{t.ws_trailing || 'Ignore trailing spaces'}</option>
              <option value="all" className="bg-[#050809]">{t.ws_all || 'Ignore all whitespace'}</option>
            </select>

            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={options.ignoreCase}
                onChange={event => setOptions(current => ({ ...current, ignoreCase: event.target.checked }))}
                className="accent-cyan-500 cursor-pointer"
              />
              {t.opt_ignore_case || 'Ignore case'}
            </label>

            <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={options.ignoreBlankLines}
                onChange={event =>
                  setOptions(current => ({ ...current, ignoreBlankLines: event.target.checked }))
                }
                className="accent-cyan-500 cursor-pointer"
              />
              {t.opt_ignore_blank || 'Ignore blank lines'}
            </label>

            <span className="h-px flex-1 bg-white/5 min-w-[1rem]" />

            <button
              type="button"
              onClick={swap}
              disabled={!hasBoth}
              title={`${t.swap || 'Swap the two sides'} (S)`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              {t.swap || 'Swap'}
            </button>
            <button
              type="button"
              onClick={resetAll}
              disabled={!hasBoth}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.btn_reset || 'Start over'}
            </button>
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              aria-label={t.shortcuts || 'Keyboard shortcuts'}
              title={t.shortcuts || 'Keyboard shortcuts'}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>

          {anchors.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 px-3 py-2">
              <Pin className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="text-[11.5px] font-bold text-cyan-100">
                {(t.anchors_count || '{0} forced alignments').replace('{0}', String(anchors.length))}
              </span>
              <span className="text-[11px] text-cyan-200/60 min-w-0 truncate">
                {t.anchors_hint || 'The comparison is solved independently on each side of every pin.'}
              </span>
              <span className="h-px flex-1 bg-cyan-500/20 min-w-[0.5rem]" />
              <button
                type="button"
                onClick={() => {
                  setAnchors([]);
                  setPendingAnchor(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-100 text-[11px] font-bold cursor-pointer"
              >
                {t.anchors_clear || 'Clear pins'}
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={!hasBoth || compare.running}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-[12.5px] font-black uppercase tracking-wider shadow-lg shadow-cyan-950/40 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-none transition-all"
            >
              {compare.running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {compare.running ? t.btn_running || 'Comparing…' : t.btn_compare || 'Compare'}
            </button>

            {compare.running && (
              <button
                type="button"
                onClick={compare.cancel}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[11.5px] font-bold cursor-pointer"
              >
                {t.btn_cancel || 'Stop'}
              </button>
            )}

            {compare.stale && !compare.running && (
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/12 border border-amber-500/30 text-amber-200 text-[11px] font-bold">
                {t.badge_stale || 'The result below is from the previous input'}
              </span>
            )}

            {textA.length + textB.length > WORKER_THRESHOLD && (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10.5px] font-bold uppercase tracking-wider">
                <IconWorker className="w-3.5 h-3.5" />
                {t.badge_worker || 'Worker'}
              </span>
            )}

            <span className="text-[11px] text-slate-600 min-w-0">
              {t.run_hint || 'Nothing is compared until you press this — loading a file never starts it.'}
            </span>
          </div>

          {compare.error && (
            <p className="text-[11.5px] font-bold text-rose-300 m-0">
              {t.run_failed || 'The comparison failed:'} {compare.error}
            </p>
          )}
        </section>

        {/* ================================================================ */}
        {/* Result                                                           */}
        {/* ================================================================ */}
        <section ref={resultRef} className="mt-5 space-y-4 scroll-mt-32">
          {!result ? (
            <div className="glass-card rounded-3xl border border-white/5 p-10 sm:p-14 text-center space-y-3">
              <IconMyers className="w-12 h-12 text-cyan-400/70 mx-auto" />
              <h3 className="text-lg font-bold text-white m-0">{t.empty_title || 'No comparison yet'}</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto m-0">
                {t.empty_text || 'Put a version on each side and press Compare. Everything runs in this tab — nothing is uploaded.'}
              </p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(
                  [
                    [t.stat_additions || 'Added', `+${formatCount(stats!.added)}`, 'text-emerald-300'],
                    [t.stat_deletions || 'Removed', `−${formatCount(stats!.removed)}`, 'text-rose-300'],
                    [t.stat_modified || 'Rewritten', formatCount(stats!.modified), 'text-amber-200'],
                    [t.stat_unchanged || 'Unchanged', formatCount(stats!.unchanged), 'text-slate-200'],
                    [t.stat_blocks || 'Blocks', formatCount(stats!.hunks), 'text-slate-200'],
                    [
                      t.stat_similarity || 'Identical',
                      `${(stats!.similarity * 100).toFixed(1)}%`,
                      'text-cyan-300',
                    ],
                  ] as [string, string, string][]
                ).map(([label, value, tone]) => (
                  <div key={label} className="rounded-xl border border-white/5 bg-black/25 px-3 py-2">
                    <div className="text-[9.5px] font-black uppercase tracking-[0.15em] text-slate-600">{label}</div>
                    <div className={`text-[13px] font-mono font-bold tabular-nums ${tone}`}>{value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono text-slate-600">
                <span>
                  {formatCount(stats!.linesA)} → {formatCount(stats!.linesB)} {t.stat_lines || 'lines'}
                </span>
                <span className="opacity-40">·</span>
                <span>{stats!.ms.toFixed(stats!.ms < 10 ? 1 : 0)} ms</span>
                {compare.offThread && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{t.badge_worker || 'Worker'}</span>
                  </>
                )}
              </div>

              {stats!.truncated && (
                <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-2.5 text-[11.5px] text-amber-100 m-0">
                  {t.badge_truncated ||
                    'These two files share so little that finding the exact minimal alignment would take longer than it is worth. The block below is reported as fully rewritten.'}
                </p>
              )}

              {/* Toolbar */}
              <div className="glass-card rounded-2xl border border-white/5 p-3 flex flex-wrap items-center gap-2">
                {lineResult && (
                  <div className="flex rounded-xl bg-white/[0.03] border border-white/10 p-1 gap-1">
                    {(
                      [
                        ['split', t.btn_split || 'Side by side'],
                        ['unified', t.btn_unified || 'Unified'],
                      ] as [ViewMode, string][]
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setViewMode(id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          viewMode === id ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {lineResult && (
                  <>
                    <select
                      value={Number.isFinite(context) ? String(context) : 'all'}
                      onChange={event =>
                        setContext(event.target.value === 'all' ? Infinity : Number(event.target.value))
                      }
                      aria-label={t.opt_context || 'Context'}
                      className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold cursor-pointer"
                    >
                      {CONTEXT_CHOICES.map(value => (
                        <option key={String(value)} value={Number.isFinite(value) ? String(value) : 'all'} className="bg-[#050809]">
                          {Number.isFinite(value)
                            ? (t.ctx_lines || '{0} lines of context').replace('{0}', String(value))
                            : t.ctx_all || 'Whole file'}
                        </option>
                      ))}
                    </select>

                    <select
                      value={language}
                      onChange={event => setLanguage(event.target.value as LanguageId)}
                      aria-label={t.opt_language || 'Syntax'}
                      className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold cursor-pointer max-w-[9rem]"
                    >
                      {LANGUAGES.map(entry => (
                        <option key={entry.id} value={entry.id} className="bg-[#050809]">
                          {entry.id === 'auto'
                            ? `${t.lang_auto || 'Auto'}${
                                effectiveLanguage !== 'none' ? ` · ${effectiveLanguage}` : ''
                              }`
                            : entry.label}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {proseResult && (
                  <label className="flex items-center gap-1.5 text-[11.5px] font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlyChanges}
                      onChange={event => setOnlyChanges(event.target.checked)}
                      className="accent-cyan-500 cursor-pointer"
                    />
                    {t.prose_only_changes || 'Dim the untouched text'}
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => setWrap(value => !value)}
                  title={`${t.opt_wrap || 'Soft wrap'} (W)`}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                    wrap
                      ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-200'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <WrapText className="w-3.5 h-3.5" />
                  {t.opt_wrap || 'Wrap'}
                </button>

                <div className="flex items-center rounded-xl bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setFontSize(size => Math.max(10, size - 1))}
                    aria-label={t.font_smaller || 'Smaller text'}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer bg-transparent border-none"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10.5px] font-mono text-slate-500 tabular-nums w-8 text-center">
                    {fontSize.toFixed(0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFontSize(size => Math.min(20, size + 1))}
                    aria-label={t.font_bigger || 'Bigger text'}
                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer bg-transparent border-none"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onMouseDown={() => setInverted(true)}
                  onMouseUp={() => setInverted(false)}
                  onMouseLeave={() => setInverted(false)}
                  onTouchStart={() => setInverted(true)}
                  onTouchEnd={() => setInverted(false)}
                  title={t.invert_hint || 'Hold to mirror the comparison (or hold Alt anywhere)'}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                    inverted
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-100'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {t.btn_invert || 'Hold to mirror'}
                </button>

                <span className="h-px flex-1 bg-white/5 min-w-[0.5rem]" />

                {lineResult && totalHunks > 0 && (
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-1">
                    <button
                      type="button"
                      onClick={() => gotoHunk(-1)}
                      aria-label={t.nav_prev || 'Previous change'}
                      title={`${t.nav_prev || 'Previous change'} (P)`}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer bg-transparent border-none"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums px-1">
                      {(t.nav_counter || '{0} / {1}')
                        .replace('{0}', String(Math.min(hunkCursor + 1, totalHunks)))
                        .replace('{1}', String(totalHunks))}
                    </span>
                    <button
                      type="button"
                      onClick={() => gotoHunk(1)}
                      aria-label={t.nav_next || 'Next change'}
                      title={`${t.nav_next || 'Next change'} (N)`}
                      className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer bg-transparent border-none"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* The diff itself */}
              <div
                className="glass-card rounded-3xl border border-white/5 overflow-hidden"
                onContextMenu={event => {
                  // Right-click mirrors the comparison for as long as it is held,
                  // the same as Alt, so the browser menu has to stay out of it.
                  event.preventDefault();
                }}
                onMouseDown={event => {
                  if (event.button === 2) setInverted(true);
                }}
                onMouseUp={event => {
                  if (event.button === 2) setInverted(false);
                }}
                onMouseLeave={() => setInverted(false)}
              >
                {identical ? (
                  <div className="p-12 sm:p-16 flex flex-col items-center justify-center gap-3 text-center">
                    <span className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                      <Check className="w-7 h-7 text-cyan-300 stroke-[3]" />
                    </span>
                    <h3 className="text-xl font-bold text-white m-0">{t.no_diff || 'No differences'}</h3>
                    <p className="text-sm text-slate-500 max-w-sm m-0">
                      {options.whitespace !== 'none' || options.ignoreCase || options.ignoreBlankLines
                        ? t.identical_relaxed ||
                          'Identical under the rules you chose. Turn the "ignore" options off to compare them literally.'
                        : t.identical_text || 'The two sides match character for character.'}
                    </p>
                  </div>
                ) : lineResult ? (
                  <DiffView
                    diff={lineResult}
                    mode={viewMode}
                    language={effectiveLanguage}
                    grammarReady={grammarReady}
                    context={context}
                    wrap={wrap}
                    fontSize={fontSize}
                    inverted={inverted}
                    anchors={anchors}
                    onToggleAnchor={handleAnchor}
                    pendingAnchor={pendingAnchor}
                    scrollTo={scrollTo}
                    labelA={labelA}
                    labelB={labelB}
                    t={t}
                  />
                ) : proseResult ? (
                  <ProseView
                    diff={proseResult}
                    inverted={inverted}
                    fontSize={fontSize}
                    onlyChanges={onlyChanges}
                    t={t}
                  />
                ) : null}
              </div>

              {/* Exports */}
              <div className="rounded-2xl border border-white/5 bg-black/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 shrink-0">
                    {t.export_title || 'Take it with you'}
                  </span>
                  <span className="h-px flex-1 bg-white/5" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyAndFlash('patch', patchText)}
                    disabled={!lineResult}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11.5px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {copied === 'patch' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                    {t.export_patch_copy || 'Copy the .patch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(patchText, 'diffsnap.patch', 'text/x-patch;charset=utf-8')}
                    disabled={!lineResult || !patchText}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11.5px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <IconPatch className="w-4 h-4 text-cyan-400" />
                    {t.export_patch || 'Download .patch'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      lineResult &&
                      downloadText(
                        toHtmlReport(
                          lineResult.unified,
                          lineResult.stats,
                          { nameA: labelA, nameB: labelB, context: Number.isFinite(context) ? context : 3 },
                          `${t.title || 'DiffSnap'} — ${labelA} → ${labelB}`
                        ),
                        'diffsnap-report.html',
                        'text/html;charset=utf-8'
                      )
                    }
                    disabled={!lineResult}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11.5px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    {t.export_html || 'HTML report'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void copyAndFlash(
                        'summary',
                        toSummary(stats!, { nameA: labelA, nameB: labelB, context: 3 })
                      )
                    }
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11.5px] font-bold hover:bg-white/10 cursor-pointer"
                  >
                    {copied === 'summary' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                    {t.export_summary || 'Copy the summary'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadText(textB || textA, baseName(nameB || nameA || 'diffsnap.txt'))
                    }
                    disabled={!hasBoth}
                    className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11.5px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <IconHandoff className="w-4 h-4 text-cyan-400" />
                    {t.export_revised || 'Download the new version'}
                  </button>
                </div>
              </div>

              <NextStepBar lang={lang} t={t} getResult={getResult} disabled={!hasBoth} />
            </>
          )}
        </section>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle || 'How it works'}
            </h2>
            <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div
                  key={i}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-cyan-500/20 transition-all group"
                >
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">
                    {i + 1}
                  </span>
                  <Art className="w-24 h-auto text-cyan-400" />
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
        <section className="mt-20 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {features.map((feature, i) => {
            const Icon = featureIcons[i] || IconMyers;
            return (
              <div
                key={i}
                className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <span className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:border-cyan-500/40 transition-all">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-white text-base font-bold mb-2 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{feature.text}</p>
              </div>
            );
          })}
        </section>

        {/* ================================================================ */}
        {/* SEO content                                                      */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6 min-w-0">
              {keywords[0] && (
                <span className="inline-block px-4 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-[11px] font-black uppercase tracking-[0.2em] border border-cyan-500/20">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tight">
                {t.seoHeroTitle}
              </h2>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 md:p-10 min-h-[320px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <span className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
              <IconLocal className="w-16 h-16 text-cyan-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                  {t.seoBrowserSpeedTitle}
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#07161a] border border-white/5 space-y-8">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-cyan-500 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed font-medium">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed font-medium">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-cyan-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, i: number) => (
                  <details
                    key={i}
                    className="glass-card rounded-2xl px-5 sm:px-6 py-5 text-left border border-white/5 hover:border-cyan-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-cyan-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
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
                {t.seoKeywordsTitle}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, i: number) => (
                  <span
                    key={i}
                    className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-diffsnap-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[190] max-w-[90vw] px-4 py-3 rounded-2xl bg-[#07161a] border border-cyan-500/25 text-cyan-100 text-[12.5px] font-bold shadow-2xl"
        >
          {toast}
        </div>
      )}

      {showShortcuts && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t.shortcuts || 'Keyboard shortcuts'}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07161a] p-6 space-y-4 max-h-[80vh] overflow-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white m-0">{t.shortcuts || 'Keyboard shortcuts'}</h3>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                aria-label={t.close || 'Close'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 list-none p-0 m-0">
              {shortcuts.map(([keys, description]) => (
                <li key={keys} className="flex items-center justify-between gap-4 text-sm">
                  <kbd className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-cyan-300 shrink-0">
                    {keys}
                  </kbd>
                  <span className="text-slate-400 text-right text-[13px]">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <LegalModal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={activeModal ? legalTranslations[lang]?.[activeModal]?.title || '' : ''}
        content={activeModal ? legalTranslations[lang]?.[activeModal]?.content || '' : ''}
        t={t}
      />
    </div>
  );
};

export default DiffSnap;
