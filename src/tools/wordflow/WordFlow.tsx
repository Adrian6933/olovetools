import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ALargeSmall,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileJson,
  FileText,
  Gauge,
  Highlighter,
  Languages,
  Loader2,
  Printer,
  Redo2,
  Save,
  ScanText,
  Search,
  Sliders,
  Sparkles,
  Table2,
  Target,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useReducedMotion, fadeInUp } from '../../components/shared/motion';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Editor, ISSUE_TONE, type Mark } from './components/Editor';
import { FindReplace } from './components/FindReplace';
import { NextStepBar } from './components/NextStepBar';
import {
  EmptyInsightArt,
  IconEditor,
  IconGauge,
  IconHandoff,
  IconKeywords,
  IconLocalOnly,
  IconProse,
  IconSegmenter,
  IconTiming,
  StepAnalyse,
  StepShip,
  StepTune,
  StepWrite,
  WordFlowHeroArt,
} from './components/Illustrations';

import { useTextDoc } from './lib/history';
import { useAnalysis } from './lib/useAnalysis';
import {
  AUTO_LIMIT,
  HIGHLIGHT_LIMIT,
  READING_WPM,
  SPEAKING_WPM,
  secondsFor,
} from './lib/analyze';
import {
  ACCEPT_ATTRIBUTE,
  MAX_FILE_BYTES,
  baseName,
  copyText,
  downloadText,
  formatBytes,
  formatDuration,
  printDocument,
  readDocument,
} from './lib/io';
import {
  TRANSFORMS,
  applyTransform,
  buildFinder,
  findMatches,
  replaceAll,
  type FindOptions,
  type Range,
  type Transform,
  type TransformGroup,
} from './lib/transforms';
import type { IssueKind, LangId } from './types';

interface WordFlowProps {
  lang: Language;
  dictionary: any;
}

const DRAFT_KEY = 'wordflow:draft';
const DRAFT_FLAG = 'wordflow:autosave';

const ISSUE_ORDER: IssueKind[] = [
  'veryLongSentence',
  'longSentence',
  'passive',
  'adverb',
  'filler',
  'complexWord',
  'repeatedWord',
  'whitespace',
];

const ISSUE_KEY: Record<IssueKind, string> = {
  veryLongSentence: 'iVeryLongSentence',
  longSentence: 'iLongSentence',
  passive: 'iPassive',
  adverb: 'iAdverb',
  filler: 'iFiller',
  complexWord: 'iComplexWord',
  repeatedWord: 'iRepeatedWord',
  whitespace: 'iWhitespace',
};

const FORMULA_KEY: Record<string, string> = {
  flesch: 'fFlesch',
  fleschKincaid: 'fFleschKincaid',
  ari: 'fAri',
  gunningFog: 'fGunningFog',
  colemanLiau: 'fColemanLiau',
  smog: 'fSmog',
  lix: 'fLix',
  huerta: 'fHuerta',
};

const GROUP_KEY: Record<TransformGroup, string> = {
  case: 'groupCase',
  clean: 'groupClean',
  lines: 'groupLines',
};

const GOAL_PRESETS: { id: string; key: string; fallback: string; kind: 'chars' | 'words'; value: number }[] = [
  { id: 'seo', key: 'goalSeoTitle', fallback: 'SEO title', kind: 'chars', value: 60 },
  { id: 'meta', key: 'goalMeta', fallback: 'Meta description', kind: 'chars', value: 155 },
  { id: 'post', key: 'goalTweet', fallback: 'Social post', kind: 'chars', value: 280 },
  { id: 'essay', key: 'goalEssay', fallback: 'Short essay', kind: 'words', value: 500 },
  { id: 'article', key: 'goalArticle', fallback: 'Long article', kind: 'words', value: 1200 },
];

const LANG_CHOICES: LangId[] = ['en', 'es', 'fr', 'de', 'pt', 'ru', 'hi', 'ja', 'zh'];

/** Alt swaps every tool button to its second reading while it is held. */
function useAltKey(): boolean {
  const [alt, setAlt] = useState(false);
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.altKey) setAlt(true);
    };
    const up = (event: KeyboardEvent) => {
      if (!event.altKey) setAlt(false);
    };
    const clear = () => setAlt(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    // Alt+Tab leaves the key "held" forever without this.
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);
  return alt;
}

export const WordFlow: React.FC<WordFlowProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const prefersReduced = useReducedMotion();
  const alt = useAltKey();

  const doc = useTextDoc('');
  const text = doc.text;

  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selection, setSelection] = useState<Range>({ start: 0, end: 0 });
  const [fontSize, setFontSize] = useState(16);
  const [highlightOn, setHighlightOn] = useState(true);
  const [ghost, setGhost] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const [staged, setStaged] = useState<{ name: string; size: number; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [langOverride, setLangOverride] = useState<LangId | null>(null);
  const [live, setLive] = useState(true);
  const [keywordSize, setKeywordSize] = useState<1 | 2 | 3>(1);
  const [showMoreStats, setShowMoreStats] = useState(false);

  const [goalId, setGoalId] = useState<string>('none');
  const [wpmOverride, setWpmOverride] = useState<number | null>(null);
  const [autosave, setAutosave] = useState(false);
  const [restored, setRestored] = useState(false);

  const [showFind, setShowFind] = useState(false);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [findOptions, setFindOptions] = useState<FindOptions>({
    regex: false,
    caseSensitive: false,
    wholeWord: false,
  });
  const [matchIndex, setMatchIndex] = useState(0);

  const { analysis, busy, stale, run } = useAnalysis(text, langOverride, live);

  // -----------------------------------------------------------------------
  // Intake — a file never overwrites the editor on its own
  // -----------------------------------------------------------------------
  const stageFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      try {
        if (file.size > MAX_FILE_BYTES) {
          setError((t.errTooLarge || 'That file is over {n}.').replace('{n}', formatBytes(MAX_FILE_BYTES)));
          return;
        }
        const body = await readDocument(file);
        if (!body.trim()) {
          setError(t.errEmpty || 'That file has no readable text.');
          return;
        }
        setStaged({ name: file.name, size: file.size, body });
      } catch (cause) {
        const code = cause instanceof Error ? cause.message : 'read-failed';
        setError(
          code === 'too-large'
            ? (t.errTooLarge || 'That file is over {n}.').replace('{n}', formatBytes(MAX_FILE_BYTES))
            : code === 'unsupported'
              ? t.errUnsupported || 'That file type cannot be read here.'
              : t.errRead || 'That file could not be read.'
        );
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const stageFiles = useCallback(
    (files: FileList) => {
      const file = files.item(0);
      if (file) void stageFile(file);
    },
    [stageFile]
  );

  // One line, right next to the normal intake: this is what makes the tool a
  // stop on a chain instead of an island.
  useHandoffIntake(file => {
    void stageFile(file);
  });

  const acceptStaged = useCallback(
    (mode: 'replace' | 'append') => {
      if (!staged) return;
      if (mode === 'replace') doc.load(staged.body);
      else doc.setText(text ? `${text.replace(/\s*$/, '')}\n\n${staged.body}` : staged.body, { label: 'stagedAppend' });
      setStaged(null);
      window.setTimeout(() => areaRef.current?.focus(), 0);
    },
    [doc, staged, text]
  );

  // -----------------------------------------------------------------------
  // Local draft — opt-in, and the copy on the page says where it lives
  // -----------------------------------------------------------------------
  useEffect(() => {
    try {
      if (localStorage.getItem(DRAFT_FLAG) !== '1') return;
      setAutosave(true);
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        doc.load(saved);
        setRestored(true);
      }
    } catch {
      // Storage disabled: the tool simply keeps nothing, which is the default.
    }
    // Runs once; `doc.load` is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autosave) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, text);
      } catch {
        /* quota or private mode */
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [text, autosave]);

  const toggleAutosave = useCallback(() => {
    setAutosave(current => {
      const next = !current;
      try {
        localStorage.setItem(DRAFT_FLAG, next ? '1' : '0');
        if (!next) localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      return next;
    });
    setRestored(false);
  }, []);

  // -----------------------------------------------------------------------
  // Find and replace
  // -----------------------------------------------------------------------
  const finder = useMemo(() => buildFinder(query, findOptions), [query, findOptions]);
  const invalidQuery = query.length > 0 && finder === null;
  const matches = useMemo(() => (showFind ? findMatches(text, finder) : []), [text, finder, showFind]);

  useEffect(() => {
    if (matchIndex >= matches.length) setMatchIndex(0);
  }, [matches.length, matchIndex]);

  const jumpTo = useCallback((range: Range) => {
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(range.start, range.end);
    setSelection({ start: range.start, end: range.end });
    // Chrome only scrolls the caret into view on focus, so nudge it after the
    // selection is in place.
    const ratio = range.start / Math.max(1, area.value.length);
    area.scrollTop = Math.max(0, ratio * area.scrollHeight - area.clientHeight / 2);
  }, []);

  const stepMatch = useCallback(
    (delta: number) => {
      if (matches.length === 0) return;
      const next = (matchIndex + delta + matches.length) % matches.length;
      setMatchIndex(next);
      jumpTo(matches[next]);
    },
    [matches, matchIndex, jumpTo]
  );

  const replaceOne = useCallback(() => {
    if (matches.length === 0) return;
    const target = matches[Math.min(matchIndex, matches.length - 1)];
    const value = findOptions.regex ? replacement : replacement;
    doc.setText(text.slice(0, target.start) + value + text.slice(target.end), { label: 'replaceOne' });
  }, [matches, matchIndex, replacement, findOptions.regex, doc, text]);

  const doReplaceAll = useCallback(() => {
    if (!finder) return;
    const next = replaceAll(text, finder, replacement, findOptions.regex);
    if (next !== text) doc.setText(next, { label: 'replaceAll' });
  }, [finder, text, replacement, findOptions.regex, doc]);

  const findMarks: Mark[] = useMemo(() => {
    if (!showFind || matches.length === 0) return [];
    return matches.map((match, index) => ({
      ...match,
      kind: index === matchIndex ? ('findActive' as const) : ('find' as const),
    }));
  }, [matches, matchIndex, showFind]);

  // -----------------------------------------------------------------------
  // Transforms
  // -----------------------------------------------------------------------
  const runTransform = useCallback(
    (transform: Transform, useAlt: boolean, ignoreSelection: boolean) => {
      if (!text) return;
      const result = applyTransform(text, selection, transform, useAlt, ignoreSelection);
      if (result.text === text) return;
      const variant = useAlt && transform.alt ? transform.alt : transform;
      doc.setText(result.text, { label: variant.key });
      window.setTimeout(() => {
        const area = areaRef.current;
        if (!area) return;
        area.focus();
        area.setSelectionRange(result.selection.start, result.selection.end);
        setSelection(result.selection);
      }, 0);
    },
    [doc, selection, text]
  );

  // -----------------------------------------------------------------------
  // Derived numbers
  // -----------------------------------------------------------------------
  const counts = analysis.counts;
  const detected = analysis.lang;
  const readingWpm = wpmOverride ?? READING_WPM[detected] ?? READING_WPM.other;
  const speakingWpm = SPEAKING_WPM[detected] ?? SPEAKING_WPM.other;
  const readingTime = formatDuration(secondsFor(counts.words, readingWpm));
  const speakingTime = formatDuration(secondsFor(counts.words, speakingWpm));

  const goal = GOAL_PRESETS.find(preset => preset.id === goalId) || null;
  const goalCurrent = goal ? (goal.kind === 'chars' ? counts.chars : counts.words) : 0;
  const goalPercent = goal ? Math.min(100, Math.round((goalCurrent / goal.value) * 100)) : 0;

  const levels: string[] = Array.isArray(t.readabilityLevels) ? t.readabilityLevels : [];
  const bandLabel = levels[analysis.readability.band] || '—';

  const keywordRows =
    keywordSize === 1 ? analysis.keywords.one : keywordSize === 2 ? analysis.keywords.two : analysis.keywords.three;

  const totalIssues = ISSUE_ORDER.reduce((sum, kind) => sum + analysis.issueCounts[kind], 0);
  const highlightPossible = text.length <= HIGHLIGHT_LIMIT;

  const selectionLength = selection.end - selection.start;

  // -----------------------------------------------------------------------
  // Exports
  // -----------------------------------------------------------------------
  const fileStem = useMemo(() => {
    const firstLine = text.trim().split('\n')[0] || 'wordflow';
    const stem = baseName(firstLine).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    return stem || 'wordflow';
  }, [text]);

  const buildReport = useCallback((): string => {
    const rows = analysis.keywords.one.slice(0, 15);
    const lines: string[] = [];
    lines.push(`# ${t.reportTitle || 'WordFlow report'}`);
    lines.push('');
    lines.push(`| ${t.words || 'Words'} | ${counts.words} |`);
    lines.push('| --- | --- |');
    lines.push(`| ${t.characters || 'Characters'} | ${counts.chars} |`);
    lines.push(`| ${t.sentences || 'Sentences'} | ${counts.sentences} |`);
    lines.push(`| ${t.paragraphs || 'Paragraphs'} | ${counts.paragraphs} |`);
    lines.push(`| ${t.uniqueWords || 'Unique words'} | ${counts.uniqueWords} |`);
    lines.push(`| ${t.readingTime || 'Reading time'} | ${readingTime} |`);
    lines.push(`| ${t.speakingTime || 'Speaking time'} | ${speakingTime} |`);
    lines.push(`| ${t.readability || 'Readability'} | ${bandLabel} (${analysis.readability.ease}/100) |`);
    lines.push('');
    if (totalIssues > 0) {
      lines.push(`## ${t.issuesTitle || 'Style check'}`);
      lines.push('');
      for (const kind of ISSUE_ORDER) {
        const value = analysis.issueCounts[kind];
        if (value > 0) lines.push(`- ${t[ISSUE_KEY[kind]] || kind}: ${value}`);
      }
      lines.push('');
    }
    if (rows.length) {
      lines.push(`## ${t.keywordDensity || 'Keyword density'}`);
      lines.push('');
      lines.push(`| # | ${t.count || 'Count'} | ${t.density || 'Density'} |`);
      lines.push('| --- | --- | --- |');
      for (const row of rows) lines.push(`| ${row.phrase} | ${row.count} | ${row.density}% |`);
      lines.push('');
    }
    lines.push('---');
    lines.push('');
    lines.push(text);
    return lines.join('\n');
  }, [analysis, counts, readingTime, speakingTime, bandLabel, totalIssues, text, t]);

  const exportCsv = useCallback(() => {
    const header = `phrase,count,density\n`;
    const body = analysis.keywords.one
      .map(row => `"${row.phrase.replace(/"/g, '""')}",${row.count},${row.density}`)
      .join('\n');
    downloadText(header + body, `${fileStem}-keywords.csv`, 'text/csv;charset=utf-8');
  }, [analysis.keywords.one, fileStem]);

  const exportJson = useCallback(() => {
    // The sentence table on a long document is megabytes of offsets nobody
    // asked for; the export keeps the summary.
    const { sentences, issues, ...summary } = analysis;
    downloadText(
      JSON.stringify({ ...summary, readingTime, speakingTime, generatedAt: new Date().toISOString() }, null, 2),
      `${fileStem}-analysis.json`,
      'application/json;charset=utf-8'
    );
  }, [analysis, fileStem, readingTime, speakingTime]);

  const doCopy = useCallback(async () => {
    const chunk = selectionLength > 0 ? text.slice(selection.start, selection.end) : text;
    const ok = await copyText(chunk);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }, [text, selection, selectionLength]);

  const doPaste = useCallback(async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip) return;
      const area = areaRef.current;
      const at = area ? area.selectionStart : text.length;
      const to = area ? area.selectionEnd : text.length;
      doc.setText(text.slice(0, at) + clip + text.slice(to), { label: 'pasteLabel' });
    } catch {
      setError(t.errClipboard || 'The browser refused clipboard access — use Ctrl+V instead.');
    }
  }, [doc, text, t]);

  const clearAll = useCallback(() => {
    doc.load('');
    setStaged(null);
    setError(null);
    setSelection({ start: 0, end: 0 });
    areaRef.current?.focus();
  }, [doc]);

  // -----------------------------------------------------------------------
  // Keyboard
  // -----------------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (!meta) {
        if (event.key === 'Escape' && showFind) setShowFind(false);
        return;
      }
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        if (event.shiftKey) doc.redo();
        else doc.undo();
      } else if (key === 'y') {
        event.preventDefault();
        doc.redo();
      } else if (key === 'f' || key === 'h') {
        event.preventDefault();
        setShowFind(true);
      } else if (key === 's') {
        event.preventDefault();
        if (text) downloadText(text, `${fileStem}.txt`);
      } else if (event.altKey && (key === '+' || key === '=')) {
        event.preventDefault();
        setFontSize(size => Math.min(24, size + 1));
      } else if (event.altKey && key === '-') {
        event.preventDefault();
        setFontSize(size => Math.max(12, size - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doc, showFind, text, fileStem]);

  // -----------------------------------------------------------------------
  // Static content
  // -----------------------------------------------------------------------
  const steps = [
    { art: StepWrite, title: t.step1Title, text: t.step1Text },
    { art: StepTune, title: t.step2Title, text: t.step2Text },
    { art: StepAnalyse, title: t.step3Title, text: t.step3Text },
    { art: StepShip, title: t.step4Title, text: t.step4Text },
  ];
  const featureIcons = [IconSegmenter, IconGauge, IconProse, IconKeywords, IconEditor, IconHandoff];
  const features = Array.isArray(t.features) ? t.features : [];
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const groups: TransformGroup[] = ['case', 'clean', 'lines'];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-100 relative">
      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang}/wordflow`;
        }}
        onReset={clearAll}
        t={t}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 sm:px-6 pt-28 md:pt-36 pb-20 flex flex-col gap-16 relative z-10">
        <AdBanner id="adsense-wordflow-top" />

        {/* ================================================================= */}
        {/* Hero                                                              */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-teal-950/40 border border-teal-800/40 text-teal-400 text-[11px] font-black tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.badge || 'Local text analytics'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05] text-balance">
              {t.seoHeroTitle}
            </h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              {t.description}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl mx-auto lg:mx-0">
              {(Array.isArray(t.heroPoints) ? t.heroPoints : []).map((point: string, index: number) => (
                <div key={index} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5 text-left">
                  <span className="w-6 h-6 shrink-0 bg-teal-500/20 text-teal-300 rounded-lg flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span className="text-slate-300 font-bold text-[13px] leading-snug">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <WordFlowHeroArt
              className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              animated={!prefersReduced}
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* Workspace                                                         */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* -- editor column ---------------------------------------------- */}
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {staged && (
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 shrink-0 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{staged.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatBytes(staged.size)} · {staged.body.length.toLocaleString()} {t.characters || 'characters'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStaged(null)}
                    className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title={t.stagedDiscard || 'Discard'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.stagedHint || 'Nothing has been loaded yet — pick what should happen to your current text.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => acceptStaged('replace')}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black transition-all cursor-pointer"
                  >
                    {t.stagedReplace || 'Replace the editor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptStaged('append')}
                    className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-black transition-all cursor-pointer"
                  >
                    {t.stagedAppend || 'Append at the end'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-200">
                <span className="flex-1">{error}</span>
                <button type="button" onClick={() => setError(null)} className="text-red-300 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-[#0b0f10]/80 glass-card overflow-hidden">
              {/* toolbar */}
              <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 border-b border-white/5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{t.openFile || 'Open file'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => void doPaste()}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.pasteText || 'Paste'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => doc.load(String(t.sampleText || ''))}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  <ScanText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.loadSample || 'Sample'}</span>
                </button>

                <span className="w-px h-6 bg-white/10 mx-0.5" />

                <button
                  type="button"
                  onClick={doc.undo}
                  disabled={!doc.canUndo}
                  title={`${t.undo || 'Undo'} (Ctrl+Z)`}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={doc.redo}
                  disabled={!doc.canRedo}
                  title={`${t.redo || 'Redo'} (Ctrl+Shift+Z)`}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!doc.canUndo}
                  title={t.compareBefore || 'Hold to see the text before the last change'}
                  onMouseDown={() => setGhost(doc.previous())}
                  onMouseUp={() => setGhost(null)}
                  onMouseLeave={() => setGhost(null)}
                  onTouchStart={() => setGhost(doc.previous())}
                  onTouchEnd={() => setGhost(null)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    ghost !== null
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                <span className="w-px h-6 bg-white/10 mx-0.5" />

                <button
                  type="button"
                  onClick={() => setShowFind(value => !value)}
                  title={`${t.findTitle || 'Find & replace'} (Ctrl+F)`}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    showFind ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setHighlightOn(value => !value)}
                  disabled={!highlightPossible}
                  title={t.highlights || 'Style highlights'}
                  className={`p-2 rounded-lg border transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    highlightOn && highlightPossible
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize(size => (size >= 22 ? 13 : size + 2))}
                  title={t.textSize || 'Text size'}
                  className="flex items-center gap-1 px-2 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-mono transition-all cursor-pointer"
                >
                  <ALargeSmall className="w-3.5 h-3.5" />
                  {fontSize}
                </button>

                <span className="flex-1" />

                <button
                  type="button"
                  onClick={() => void doCopy()}
                  disabled={!text}
                  title={t.copyText}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={!text}
                  title={t.clearText}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-red-500/10 text-slate-300 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {showFind && (
                <div className="px-3 pt-3">
                  <FindReplace
                    t={t}
                    query={query}
                    replacement={replacement}
                    options={findOptions}
                    total={matches.length}
                    index={matchIndex}
                    invalid={invalidQuery}
                    onQuery={setQuery}
                    onReplacement={setReplacement}
                    onOption={key => setFindOptions(current => ({ ...current, [key]: !current[key] }))}
                    onStep={stepMatch}
                    onReplaceOne={replaceOne}
                    onReplaceAll={doReplaceAll}
                    onClose={() => setShowFind(false)}
                  />
                </div>
              )}

              <div className="h-[46vh] min-h-[320px] lg:h-[560px] p-1.5">
                <Editor
                  value={text}
                  onChange={next => doc.setText(next, { coalesce: true })}
                  onSelectionChange={setSelection}
                  placeholder={t.placeholder}
                  ariaLabel={t.editorLabel || 'Document'}
                  fontSize={fontSize}
                  issues={analysis.issues}
                  findMarks={findMarks}
                  highlightEnabled={highlightOn && highlightPossible}
                  ghost={ghost}
                  areaRef={areaRef}
                  onDropFiles={stageFiles}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 border-t border-white/5 text-[10px] font-bold font-mono text-slate-500">
                <span>
                  {t.lines}: {counts.lines} · {t.sentences}: {counts.sentences} · {t.paragraphs}: {counts.paragraphs}
                </span>
                {selectionLength > 0 && (
                  <span className="text-teal-400">
                    {(t.selectionLabel || '{n} selected').replace('{n}', selectionLength.toLocaleString())}
                  </span>
                )}
                <span className="flex-1" />
                {doc.steps > 0 && (
                  <span className="text-slate-600">
                    {(t.historyLabel || '{n} steps · {size}')
                      .replace('{n}', String(doc.steps))
                      .replace('{size}', formatBytes(doc.bytes))}
                  </span>
                )}
                <span className="text-slate-600 lowercase">{t.localBadge || '100% in this tab'}</span>
              </div>
            </div>

            {/* -- transforms ---------------------------------------------- */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  {t.toolsTitle || 'Text tools'}
                </h3>
                <span className="flex-1" />
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${alt ? 'text-teal-300 border-teal-500/40 bg-teal-500/10' : 'text-slate-600 border-white/5'}`}>
                  {alt ? t.altOn || 'Alt — second version' : t.altHint || 'Hold Alt for the second version'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {selectionLength > 0
                  ? t.toolsSelection || 'These apply to your selection. Right-click a button to run it on the whole document instead.'
                  : t.toolsWhole || 'With nothing selected these apply to the whole document. Select a paragraph to narrow them down.'}
              </p>

              {groups.map(group => (
                <div key={group} className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                    {t[GROUP_KEY[group]] || group}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                    {TRANSFORMS.filter(item => item.group === group).map(item => {
                      const variant = alt && item.alt ? item.alt : item;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!text}
                          onClick={() => runTransform(item, alt, false)}
                          onContextMenu={event => {
                            event.preventDefault();
                            runTransform(item, alt, true);
                          }}
                          // Wrapping, not truncating: "Remove duplicate lines"
                          // does not fit a 145 px cell at 375 px and a tooltip
                          // is no help on a touch screen.
                          className={`px-3 py-2.5 rounded-xl border text-[11px] font-bold tracking-wide leading-tight text-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                            alt && item.alt
                              ? 'border-teal-500/30 bg-teal-500/10 text-teal-200 hover:bg-teal-500/20'
                              : 'border-white/5 bg-white/[0.03] text-slate-300 hover:bg-teal-500/10 hover:text-teal-200'
                          }`}
                          title={variant.fallback}
                        >
                          {t[variant.key] || variant.fallback}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-slate-600 leading-relaxed pt-1">
                {t.shortcutsHint ||
                  'Ctrl+Z and Ctrl+Shift+Z undo and redo every tool, Ctrl+F opens find & replace, Ctrl+S saves a .txt, Ctrl+Alt+plus and minus change the text size.'}
              </p>
            </div>

            <NextStepBar
              lang={lang}
              t={t}
              disabled={!text}
              getResult={async () => {
                if (!text) return null;
                return { blob: new Blob([text], { type: 'text/plain;charset=utf-8' }), name: `${fileStem}.txt` };
              }}
            />
          </div>

          {/* -- insight column --------------------------------------------- */}
          <aside className="space-y-5 min-w-0">
            {/* counters */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <ScanText className="w-4 h-4 text-teal-400" />
                  {t.statsTitle || 'Counters'}
                </h3>
                <span className="flex-1" />
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: t.words, value: counts.words.toLocaleString(), tone: 'text-white' },
                  { label: t.characters, value: counts.chars.toLocaleString(), tone: 'text-white' },
                  { label: t.readingTime, value: readingTime, tone: 'text-teal-400' },
                  { label: t.speakingTime, value: speakingTime, tone: 'text-cyan-400' },
                ].map(stat => (
                  <div key={String(stat.label)} className="rounded-2xl bg-black/30 border border-white/5 px-3 py-3 text-center">
                    <p className={`text-lg font-black font-mono truncate ${stat.tone}`}>{stat.value}</p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 truncate">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="shrink-0">{t.readingSpeed || 'Reading speed'}</span>
                <input
                  type="range"
                  min={80}
                  max={450}
                  step={10}
                  value={readingWpm}
                  onChange={event => setWpmOverride(Number(event.target.value))}
                  className="flex-1 accent-teal-500 cursor-pointer"
                  aria-label={String(t.readingSpeed || 'Reading speed')}
                />
                <span className="font-mono text-slate-400 shrink-0 tabular-nums">{readingWpm} {t.wpm || 'wpm'}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreStats(value => !value)}
                className="w-full text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-teal-400 transition-colors cursor-pointer"
              >
                {showMoreStats ? t.lessStats || 'Fewer numbers' : t.moreStats || 'More numbers'}
              </button>

              {showMoreStats && (
                <div className="space-y-1.5 text-[11px]">
                  {[
                    { label: t.charactersNoSpaces || 'Characters, no spaces', value: counts.charsNoSpaces.toLocaleString() },
                    { label: t.uniqueWords || 'Unique words', value: counts.uniqueWords.toLocaleString() },
                    { label: t.syllables || 'Syllables', value: counts.syllables.toLocaleString() },
                    { label: t.avgWord || 'Average word', value: `${counts.avgWordChars} ${t.charsShort || 'chars'}` },
                    { label: t.avgSentence || 'Average sentence', value: `${counts.avgSentenceWords} ${t.wordsShort || 'words'}` },
                    { label: t.diversity || 'Vocabulary variety', value: `${counts.lexicalDiversity}%` },
                    { label: t.longestWord || 'Longest word', value: counts.longestWord || '—' },
                    { label: t.size || 'Size', value: formatBytes(counts.bytes) },
                  ].map(row => (
                    <div key={String(row.label)} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1">
                      <span className="text-slate-500 truncate">{row.label}</span>
                      <span className="font-mono text-slate-300 shrink-0 truncate max-w-[9rem]">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* target */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Target className="w-4 h-4 text-teal-400" />
                {t.goalTitle || 'Target'}
              </h3>
              <select
                value={goalId}
                onChange={event => setGoalId(event.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-200 outline-none focus:border-teal-500/50 cursor-pointer"
              >
                <option value="none">{t.goalNone || 'No target'}</option>
                {GOAL_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {`${t[preset.key] || preset.fallback} — ${preset.value} ${
                      preset.kind === 'chars' ? t.charsShort || 'chars' : t.wordsShort || 'words'
                    }`}
                  </option>
                ))}
              </select>
              {goal && (
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${
                        goalCurrent > goal.value ? 'bg-amber-500' : 'bg-teal-500'
                      }`}
                      style={{ width: `${goalPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 tabular-nums">
                    {goalCurrent.toLocaleString()} / {goal.value.toLocaleString()} ·{' '}
                    {goalCurrent > goal.value ? (
                      <span className="text-amber-400">
                        {(t.goalOver || '{n} over').replace('{n}', (goalCurrent - goal.value).toLocaleString())}
                      </span>
                    ) : goalCurrent === goal.value ? (
                      <span className="text-teal-400">{t.goalReached || 'Target reached'}</span>
                    ) : (
                      <span>{(t.goalRemaining || '{n} to go').replace('{n}', (goal.value - goalCurrent).toLocaleString())}</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* readability */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-teal-400" />
                  {t.readability || 'Readability'}
                </h3>
                <span className="flex-1" />
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Languages className="w-3 h-3" />
                  <select
                    value={langOverride ?? 'auto'}
                    onChange={event => setLangOverride(event.target.value === 'auto' ? null : (event.target.value as LangId))}
                    className="bg-transparent border-none outline-none text-slate-400 cursor-pointer"
                    aria-label={String(t.detectedLang || 'Language')}
                  >
                    <option value="auto" className="bg-slate-900">
                      {`${t.langAuto || 'Auto'}${analysis.counts.words ? ` · ${detected}` : ''}`}
                    </option>
                    {LANG_CHOICES.map(id => (
                      <option key={id} value={id} className="bg-slate-900">
                        {id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {counts.words === 0 ? (
                <div className="flex flex-col items-center gap-3 py-4 text-slate-700">
                  <EmptyInsightArt className="w-24 h-auto" animated={!prefersReduced} />
                  <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                    {t.emptyInsight || 'Write or load something and every panel here fills in.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xl font-black text-white leading-tight truncate">{bandLabel}</p>
                      <p className="text-[11px] text-slate-500">
                        {analysis.readability.gradeMeaningful && analysis.readability.grade !== null
                          ? (t.gradeLabel || 'School year {n}').replace('{n}', String(Math.round(analysis.readability.grade)))
                          : t.gradeNa || 'School-year scales are built on English syllables.'}
                      </p>
                    </div>
                    <span className="shrink-0 text-2xl font-black font-mono text-teal-400 tabular-nums">
                      {analysis.readability.ease}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-teal-400 transition-[width] duration-300"
                      style={{ width: `${analysis.readability.ease}%` }}
                    />
                  </div>

                  <details className="group">
                    <summary className="cursor-pointer list-none text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-teal-400 transition-colors">
                      {t.formulaTitle || 'All formulas'}
                    </summary>
                    <div className="pt-3 space-y-1.5 text-[11px]">
                      {analysis.readability.formulas.map(formula => (
                        <div key={formula.id} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1">
                          <span className={`truncate ${formula.id === analysis.readability.primary ? 'text-teal-400 font-bold' : 'text-slate-500'}`}>
                            {t[FORMULA_KEY[formula.id]] || formula.id}
                          </span>
                          <span className="font-mono text-slate-300 shrink-0 tabular-nums">{formula.score}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </div>

            {/* style check */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <IconProse className="w-4 h-4 text-teal-400" />
                {t.issuesTitle || 'Style check'}
              </h3>
              {counts.words === 0 || totalIssues === 0 ? (
                <p className="text-[11px] text-slate-600 italic leading-relaxed py-2">
                  {counts.words === 0 ? t.emptyInsight || '—' : t.issuesNone || 'Nothing flagged — this reads clean.'}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-1.5">
                    {ISSUE_ORDER.filter(kind => analysis.issueCounts[kind] > 0).map(kind => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => {
                          const first = analysis.issues.find(issue => issue.kind === kind);
                          if (first) jumpTo({ start: first.start, end: first.end });
                        }}
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer hover:brightness-125 ${ISSUE_TONE[kind]}`}
                      >
                        <span className="truncate text-left">{t[ISSUE_KEY[kind]] || kind}</span>
                        <span className="font-mono tabular-nums shrink-0">{analysis.issueCounts[kind]}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {t.issuesHint || 'Click a row to jump to the first one. The marks are painted straight onto the text.'}
                  </p>
                </>
              )}
            </div>

            {/* keywords */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Search className="w-4 h-4 text-teal-400" />
                  {t.keywordDensity}
                </h3>
                <span className="flex-1" />
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  {([1, 2, 3] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setKeywordSize(size)}
                      className={`px-2 py-1 text-[10px] font-black transition-colors cursor-pointer ${
                        keywordSize === size ? 'bg-teal-500/20 text-teal-300' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {size === 1 ? t.kwOne || '1' : size === 2 ? t.kwTwo || '2' : t.kwThree || '3'}
                    </button>
                  ))}
                </div>
              </div>

              {keywordRows.length === 0 ? (
                <p className="text-[11px] text-slate-600 italic leading-relaxed py-2">{t.noKeywords}</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[9px] uppercase font-black tracking-wider text-slate-600 border-b border-white/5 pb-1">
                    <span>{t.kwPhrase || 'Phrase'}</span>
                    <span className="text-right w-10">{t.count}</span>
                    <span className="text-right w-12">{t.density}</span>
                  </div>
                  {keywordRows.map(row => (
                    <button
                      key={row.phrase}
                      type="button"
                      onClick={() => {
                        setQuery(row.phrase);
                        setShowFind(true);
                      }}
                      className="w-full grid grid-cols-[1fr_auto_auto] gap-3 text-[11px] items-center py-1 rounded hover:bg-white/5 transition-colors cursor-pointer text-left"
                    >
                      <span className="truncate text-slate-300 font-semibold">{row.phrase}</span>
                      <span className="text-right w-10 font-mono text-slate-500 tabular-nums">{row.count}</span>
                      <span className="text-right w-12 font-mono text-teal-400 tabular-nums">{row.density}%</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-600 leading-relaxed">{t.kwHint || 'Stop words are filtered per language.'}</p>
            </div>

            {/* sentiment */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <IconGauge className="w-4 h-4 text-teal-400" />
                {t.sentiment}
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: t.sentimentPositive, value: analysis.sentiment.positive, bar: 'bg-emerald-500', tone: 'text-emerald-400' },
                  { label: t.sentimentNeutral, value: analysis.sentiment.neutral, bar: 'bg-slate-500', tone: 'text-slate-300' },
                  { label: t.sentimentNegative, value: analysis.sentiment.negative, bar: 'bg-rose-500', tone: 'text-rose-400' },
                ].map(row => (
                  <div key={String(row.label)} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span className="truncate">{row.label}</span>
                      <span className={`font-mono tabular-nums ${row.tone}`}>{row.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${row.bar} rounded-full transition-[width] duration-300`} style={{ width: `${row.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              {analysis.sentiment.top.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {analysis.sentiment.top.map(item => (
                    <span
                      key={item.word}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        item.score > 0
                          ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'
                          : 'text-rose-300 border-rose-500/30 bg-rose-500/10'
                      }`}
                    >
                      {item.word}
                      {item.count > 1 && <span className="opacity-50"> ×{item.count}</span>}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {t.sentimentNote || 'Scored from a per-language word list with negation handling — not a machine-learning model.'}
              </p>
            </div>

            {/* tone */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <IconSegmenter className="w-4 h-4 text-teal-400" />
                  {t.tone}
                </h3>
                <span className="flex-1" />
                {analysis.tone.dominant && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 truncate">
                    {t[`tone${analysis.tone.dominant.charAt(0).toUpperCase()}${analysis.tone.dominant.slice(1)}`] || analysis.tone.dominant}
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {[
                  { key: 'formal', label: t.toneFormal, bar: 'bg-blue-500', tone: 'text-blue-400' },
                  { key: 'casual', label: t.toneCasual, bar: 'bg-amber-500', tone: 'text-amber-400' },
                  { key: 'academic', label: t.toneAcademic, bar: 'bg-purple-500', tone: 'text-purple-400' },
                  { key: 'confident', label: t.toneConfident, bar: 'bg-teal-500', tone: 'text-teal-400' },
                  { key: 'creative', label: t.toneCreative, bar: 'bg-pink-500', tone: 'text-pink-400' },
                ].map(row => {
                  const value = analysis.tone[row.key as 'formal'];
                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                        <span className="truncate">{row.label}</span>
                        <span className={`font-mono tabular-nums ${row.tone}`}>{value}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${row.bar} rounded-full transition-[width] duration-300`} style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {t.toneNote || 'Vocabulary plus structure: sentence length, passives, questions and punctuation all count.'}
              </p>
            </div>

            {/* analysis mode + export */}
            <div className="rounded-3xl border border-white/5 bg-[#0b0f10]/70 glass-card p-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <IconTiming className="w-4 h-4 text-teal-400" />
                {t.controlTitle || 'Analysis & export'}
              </h3>

              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={live}
                  onChange={() => setLive(value => !value)}
                  className="mt-0.5 accent-teal-500 cursor-pointer"
                />
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-300">{t.liveAnalysis || 'Analyse as I type'}</span>
                  <span className="block text-[10px] text-slate-600 leading-relaxed">
                    {t.liveHint || 'Turn this off to keep the editor untouched and run everything by hand.'}
                  </span>
                </span>
              </label>

              {(!live || stale) && text.length > 0 && (
                <button
                  type="button"
                  onClick={run}
                  disabled={busy}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white font-black text-xs uppercase tracking-wide transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {busy ? t.analysing || 'Analysing…' : t.runAnalysis || 'Analyse now'}
                </button>
              )}

              {text.length > AUTO_LIMIT && live && (
                <p className="text-[10px] text-amber-400/80 leading-relaxed">
                  {(t.manualHint || 'Past {n} characters the analysis waits for the button so typing stays smooth.').replace(
                    '{n}',
                    AUTO_LIMIT.toLocaleString()
                  )}
                </p>
              )}
              {!highlightPossible && (
                <p className="text-[10px] text-amber-400/80 leading-relaxed">
                  {(t.highlightOffHint || 'Highlighting is off past {n} characters.').replace('{n}', HIGHLIGHT_LIMIT.toLocaleString())}
                </p>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={autosave} onChange={toggleAutosave} className="mt-0.5 accent-teal-500 cursor-pointer" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-slate-300">{t.autosave || 'Keep a local draft'}</span>
                  <span className="block text-[10px] text-slate-600 leading-relaxed">
                    {t.autosaveHint || 'Saved in this browser only, never uploaded. Off unless you switch it on.'}
                  </span>
                </span>
              </label>
              {restored && <p className="text-[10px] text-teal-400">{t.draftRestored || 'Draft restored from this browser.'}</p>}

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: <FileText className="w-3.5 h-3.5" />, label: t.exportTxt || 'Text', onClick: () => downloadText(text, `${fileStem}.txt`) },
                  { icon: <FileCode2 className="w-3.5 h-3.5" />, label: t.exportMd || 'Report', onClick: () => downloadText(buildReport(), `${fileStem}-report.md`, 'text/markdown;charset=utf-8') },
                  { icon: <Table2 className="w-3.5 h-3.5" />, label: t.exportCsv || 'Keywords', onClick: exportCsv },
                  { icon: <FileJson className="w-3.5 h-3.5" />, label: t.exportJson || 'Analysis', onClick: exportJson },
                ].map(action => (
                  <button
                    key={String(action.label)}
                    type="button"
                    onClick={action.onClick}
                    disabled={!text}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {action.icon}
                    <span className="truncate">{action.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  printDocument(
                    text,
                    t.reportTitle || 'WordFlow',
                    `${new Date().toLocaleDateString()} · ${counts.words} ${t.wordsShort || 'words'} · ${counts.chars} ${t.charsShort || 'chars'}`
                  )
                }
                disabled={!text}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-[11px] font-bold text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {t.exportPrint || 'Print / PDF'}
              </button>
            </div>
          </aside>
        </section>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={event => {
            if (event.target.files?.length) stageFiles(event.target.files);
            event.target.value = '';
          }}
        />

        {/* ================================================================= */}
        {/* How it works                                                      */}
        {/* ================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.howItWorksTitle || 'How it works'}</h2>
            <div className="h-1 w-16 bg-teal-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Art = step.art;
              return (
                <div
                  key={index}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-teal-500/20 transition-all group overflow-hidden"
                >
                  <span className="absolute top-4 right-5 text-5xl font-black text-white/5 group-hover:text-teal-500/10 transition-colors">
                    {index + 1}
                  </span>
                  <Art className="w-24 h-auto text-teal-400" />
                  <h3 className="text-base font-bold text-white leading-snug">{step.title}</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{step.text}</p>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature: any, index: number) => {
            const Icon = featureIcons[index] || IconLocalOnly;
            return (
              <div key={index} className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-110 group-hover:border-teal-500/40 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white text-base font-bold mb-2 group-hover:text-teal-400 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-[13px] leading-relaxed font-medium">{feature.text}</p>
              </div>
            );
          })}
        </motion.section>

        {/* ================================================================= */}
        {/* SEO copy + FAQ                                                    */}
        {/* ================================================================= */}
        <section className="space-y-16 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6">
              {keywords[0] && (
                <div className="inline-block px-4 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] border border-teal-500/20">
                  {keywords[0]}
                </div>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">{t.seoBrowserSpeedTitle}</h2>
              <p className="text-slate-400 text-base leading-relaxed">{t.seoBrowserSpeedText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, index: number) => (
                  <div key={index} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="w-6 h-6 shrink-0 bg-teal-500/20 text-teal-300 rounded-lg flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span className="text-slate-300 font-bold text-[13px]">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 py-14 min-h-[340px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl" />
              <IconLocalOnly className="w-16 h-16 text-teal-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl font-black text-white tracking-tight leading-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#04140f] border border-white/5 space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-teal-500 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="text-white text-[11px] font-black uppercase tracking-[0.3em] opacity-40 flex items-center gap-3">
                  <span className="w-6 h-px bg-white/20" />
                  {t.seoHeroTitle}
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed">{t.seoHeroText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.faqTitle}</h2>
                <div className="h-1 w-16 bg-teal-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, index: number) => (
                  <details
                    key={index}
                    className="glass-card rounded-2xl px-5 py-4 text-left border border-white/5 hover:border-teal-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-teal-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-teal-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                    </summary>
                    <p className="text-slate-400 leading-relaxed pl-9 pt-3 text-sm">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="max-w-4xl mx-auto w-full space-y-4 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-teal-500/10 hover:border-teal-500/20 hover:text-teal-400 transition-all cursor-default"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-wordflow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={modal => setLegalModal(modal)} />

      <LegalModal
        isOpen={legalModal === 'privacy'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.nav.privacy || 'Privacy Policy'}
        content={legalTranslations[lang]?.privacy.content || ''}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'terms'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.nav.terms || 'Terms of Service'}
        content={legalTranslations[lang]?.terms.content || ''}
        t={t}
      />
      <LegalModal
        isOpen={legalModal === 'cookies'}
        onClose={() => setLegalModal(null)}
        title={legalTranslations[lang]?.nav.cookies || 'Cookie Policy'}
        content={legalTranslations[lang]?.cookies.content || ''}
        t={t}
      />
    </div>
  );
};

export default WordFlow;
