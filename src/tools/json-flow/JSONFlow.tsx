import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Braces,
  Check,
  CheckCircle2,
  Copy,
  Crosshair,
  FileUp,
  Keyboard,
  Loader2,
  Minimize2,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
  X,
} from 'lucide-react';
import { createTranslator, type Language } from '../../locales/meta';
import { AdBanner } from '../../components/shared/AdBanner';
import { useHandoffIntake } from '../../lib/useHandoff';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Editor, type EditorFocus } from './components/Editor';
import { Output } from './components/Output';
import { NextStepBar } from './components/NextStepBar';
import {
  IconDiff,
  IconHandoff,
  IconLocal,
  IconParser,
  IconPrecision,
  IconQuery,
  IconRepair,
  IconSchema,
  IconTable,
  IconWorker,
  JsonHeroArt,
  STEP_ART,
} from './components/Illustrations';

import type { IndentMode, IssueCode, OutputTab } from './types';
import { AUTO_BUILD_LIMIT, PARK_FILE_LIMIT, useDocument, type BuiltDoc } from './lib/useDocument';
import { looksLikeEscapedJson } from './lib/parse';
import { joinJsonLines, looksLikeJsonLines, printJson, type SortMode } from './lib/serialize';
import { delimitedToRecords } from './lib/table';
import { ACCEPT_ATTRIBUTE, copyText, downloadText, extensionOf, readTextFile } from './lib/io';
import { formatBytes, formatCount } from './lib/stats';
import { SAMPLES, type SampleId } from './lib/samples';
import type { SearchScope } from './lib/tree';

interface JSONFlowProps {
  lang: Language;
  dictionary: any;
}

const SAMPLE_KEYS: { id: SampleId; key: string; fallback: string }[] = [
  { id: 'user', key: 'mock_user_profile', fallback: 'User profile' },
  { id: 'products', key: 'mock_product_catalog', fallback: 'Product catalog' },
  { id: 'weather', key: 'mock_weather_data', fallback: 'Weather forecast' },
  { id: 'broken', key: 'sample_broken', fallback: 'Broken config (repairable)' },
  { id: 'bigint', key: 'sample_bigint', fallback: '64-bit ids' },
];

const ISSUE_LABEL_KEYS: Record<IssueCode, string> = {
  syntax: 'issueSyntax',
  'duplicate-key': 'issueDuplicateKey',
  precision: 'issuePrecision',
  depth: 'issueDepth',
  'trailing-comma': 'issueTrailingComma',
  comment: 'issueComment',
  'single-quote': 'issueSingleQuote',
  'unquoted-key': 'issueUnquotedKey',
  'python-literal': 'issuePythonLiteral',
  'non-finite': 'issueNonFinite',
  bom: 'issueBom',
  empty: 'issueEmpty',
};

const ISSUE_FALLBACK: Record<IssueCode, string> = {
  syntax: 'Syntax error',
  'duplicate-key': 'Duplicate key',
  precision: 'Number too large for JavaScript',
  depth: 'Nested too deep',
  'trailing-comma': 'Trailing comma',
  comment: 'Comment',
  'single-quote': 'Single-quoted string',
  'unquoted-key': 'Unquoted key',
  'python-literal': 'Python literal',
  'non-finite': 'Not a JSON number',
  bom: 'Byte order mark',
  empty: 'Empty document',
};

export const JSONFlow: React.FC<JSONFlowProps> = ({ lang, dictionary }) => {
  const t = createTranslator(dictionary);
  const store = useDocument('');

  const [indent, setIndent] = useState<IndentMode>(2);
  const [sort, setSort] = useState<SortMode>('none');
  const [tab, setTab] = useState<OutputTab>('tree');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('both');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [autoDepth, setAutoDepth] = useState(2);
  const [focus, setFocus] = useState<EditorFocus | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parked, setParked] = useState<File | null>(null);
  const [copiedInput, setCopiedInput] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const prefersReduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const notify = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const { text, analysis, doc } = store;
  const error = analysis.issues.find(issue => issue.severity === 'error') || null;
  const warnings = analysis.issues.filter(issue => issue.severity === 'warning');
  const hasText = !!text.trim();

  // The AST for the *current* text, or null when the editor has moved on.
  const liveRoot = doc && doc.source === text ? doc.root : null;

  /** Runs the expensive parse when a command needs an AST it does not have. */
  const ensureDoc = useCallback((): BuiltDoc | null => {
    if (doc && doc.source === text) return doc;
    return store.build();
  }, [doc, text, store]);

  // -- file intake -----------------------------------------------------------
  // Loading a file never starts the parse by itself: small ones are cheap
  // enough that the live validation covers them, and anything big is parked
  // behind an explicit click.
  const applyFile = useCallback(
    async (file: File) => {
      try {
        const raw = await readTextFile(file);
        const ext = extensionOf(file.name);
        if (ext === '.csv' || ext === '.tsv') {
          const records = delimitedToRecords(raw, { delimiter: ext === '.tsv' ? '\t' : undefined });
          store.setText(JSON.stringify(records, null, indent === -1 ? '\t' : indent));
          notify((t.toast_csv_loaded || 'Imported {0} rows from {1}.').replace('{0}', String(records.length)).replace('{1}', file.name));
          return;
        }
        if (ext === '.jsonl' || ext === '.ndjson' || looksLikeJsonLines(raw)) {
          store.setText(joinJsonLines(raw));
          notify(t.toast_jsonl_loaded || 'JSON Lines joined into a single array.');
          return;
        }
        store.setText(raw);
      } catch (err) {
        notify(
          (err as Error).message === 'too-large'
            ? t.file_too_large || 'That file is too large to open in a browser tab.'
            : t.file_failed || 'That file could not be read.'
        );
      }
    },
    [indent, notify, store, t]
  );

  const acceptFile = useCallback(
    (file: File) => {
      if (file.size > PARK_FILE_LIMIT) {
        // Dumping 12 MB straight into a textarea freezes the tab on its own,
        // before anything has even been parsed.
        setParked(file);
        return;
      }
      void applyFile(file);
    },
    [applyFile]
  );

  useHandoffIntake(file => acceptFile(file));

  // -- commands --------------------------------------------------------------

  const beautify = useCallback(() => {
    const built = ensureDoc();
    if (!built) {
      notify(t.toast_needs_valid || 'Fix the error first — there is nothing to format yet.');
      return;
    }
    store.setText(printJson(built.root, { indent, sort }));
  }, [ensureDoc, indent, sort, notify, store, t]);

  const minify = useCallback(() => {
    const built = ensureDoc();
    if (!built) {
      notify(t.toast_needs_valid || 'Fix the error first — there is nothing to format yet.');
      return;
    }
    store.setText(printJson(built.root, { indent, minify: true }));
  }, [ensureDoc, indent, notify, store, t]);

  const applySort = useCallback(
    (mode: SortMode) => {
      setSort(mode);
      if (mode === 'none') return;
      const built = ensureDoc();
      if (!built) return;
      store.setText(printJson(built.root, { indent, sort: mode }));
    },
    [ensureDoc, indent, store]
  );

  const repair = useCallback(() => {
    const built = ensureDoc();
    if (!built) {
      notify(t.toast_unrepairable || 'This document is too broken to repair automatically.');
      return;
    }
    store.setText(printJson(built.root, { indent }));
    notify(t.toast_repaired || 'Repaired into strict JSON.');
  }, [ensureDoc, indent, notify, store, t]);

  const unescape = useCallback(() => {
    try {
      const inner = JSON.parse(text);
      if (typeof inner !== 'string') return;
      store.setText(inner);
      notify(t.toast_unescaped || 'Unwrapped the JSON that was hiding inside the string.');
    } catch {
      notify(t.toast_unescape_failed || 'That is not a quoted JSON string.');
    }
  }, [text, store, notify, t]);

  const locate = useCallback(
    (offset: number) => {
      let line = 1;
      for (let i = 0; i < offset && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
      const lineStart = text.lastIndexOf('\n', Math.max(0, offset - 1)) + 1;
      setFocus({ line, column: offset - lineStart + 1, nonce: Date.now() });
    },
    [text]
  );

  const getResult = useCallback(async () => {
    const built = doc && doc.source === text ? doc : null;
    const payload = built ? printJson(built.root, { indent, sort }) : text;
    if (!payload.trim()) return null;
    return { blob: new Blob([payload], { type: 'application/json' }), name: 'json-flow.json' };
  }, [doc, text, indent, sort]);

  // -- keyboard --------------------------------------------------------------

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }

      // The textarea is controlled, so the browser's own undo stack is useless
      // here — these have to be intercepted even while typing.
      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (mod && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        store.redo();
        return;
      }
      if (mod && event.key === 'Enter') {
        event.preventDefault();
        store.build();
        return;
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        beautify();
        return;
      }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        minify();
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        const built = doc && doc.source === text ? doc : null;
        void copyText(built ? printJson(built.root, { indent, sort }) : text);
        notify(t.copied || 'Copied!');
        return;
      }
      if (!typing && event.key === '?') {
        setShowShortcuts(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [store, beautify, minify, doc, text, indent, sort, notify, t]);

  // -- content ---------------------------------------------------------------

  const handleLanguageChange = (next: string) => {
    const segments = window.location.pathname.split('/');
    if (segments.length >= 3) {
      segments[1] = next.toLowerCase();
      window.location.pathname = segments.join('/');
    } else {
      window.location.href = `/${next.toLowerCase()}/json-flow`;
    }
  };

  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const steps = [
    { title: t.step1Title || 'Bring the JSON in', text: t.step1Text || 'Paste it, drop a file, or let another tool hand it over. Nothing is uploaded and nothing is parsed behind your back.' },
    { title: t.step2Title || 'Read the verdict', text: t.step2Text || 'Valid, or the exact line and column that breaks — plus duplicate keys and numbers JavaScript cannot hold.' },
    { title: t.step3Title || 'Explore it', text: t.step3Text || 'Fold the tree, filter by key or value, or run a JSONPath expression over the whole document.' },
    { title: t.step4Title || 'Take it away', text: t.step4Text || 'CSV, XML, YAML, JSONL, a JSON Schema, TypeScript or Go types — or send it straight to another tool.' },
  ];

  const featureIcons = [
    IconParser,
    IconPrecision,
    IconRepair,
    IconQuery,
    IconSchema,
    IconTable,
    IconDiff,
    IconWorker,
  ];
  const features =
    Array.isArray(t.features) && t.features.length
      ? t.features
      : [
          { title: 'A real parser, not JSON.parse', text: 'Errors come with a line, a column and a caret in the gutter instead of a character offset.' },
          { title: '64-bit ids survive', text: 'Long numeric ids are re-printed digit for digit, not rounded to the nearest double.' },
          { title: 'One-click repair', text: 'Comments, trailing commas, single quotes, unquoted keys and Python literals turn into strict JSON.' },
        ];

  const shortcuts: [string, string][] = [
    ['Ctrl / ⌘ + Z', t.sc_undo || 'Undo'],
    ['Ctrl / ⌘ + ⇧ + Z', t.sc_redo || 'Redo'],
    ['Ctrl / ⌘ + Enter', t.sc_parse || 'Parse the document'],
    ['Alt + ⇧ + F', t.sc_beautify || 'Beautify'],
    ['Alt + ⇧ + M', t.sc_minify || 'Minify'],
    ['Ctrl / ⌘ + ⇧ + C', t.sc_copy || 'Copy the formatted output'],
    ['?', t.sc_help || 'This panel'],
  ];

  const escaped = looksLikeEscapedJson(text);
  const jsonl = !escaped && looksLikeJsonLines(text);
  const offThread = text.length > AUTO_BUILD_LIMIT;

  return (
    <div className="min-h-screen bg-[#050807] text-slate-200 flex flex-col justify-between font-sans selection:bg-emerald-500/20 selection:text-emerald-100">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          A full-width <main> leaves a 0px gap and the rails never render — the
          previous max-w-7xl left only 60px at 1400px, well under the 168px the
          rail needs. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-32 md:pt-36 pb-20">
        <AdBanner id="adsense-json-flow-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center mb-12">
          <div className="space-y-5 min-w-0">
            <span className="inline-block px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20">
              {t.title} · {t.hero_badge || 'Workbench'}
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
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <JsonHeroArt className="w-full h-auto max-w-lg mx-auto" animated={!prefersReduced} />
        </section>

        {/* ================================================================ */}
        {/* Workspace                                                        */}
        {/* ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* ---------------- Editor ---------------- */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) acceptFile(file);
            }}
            className={`relative glass-card rounded-3xl border flex flex-col h-[560px] lg:h-[680px] overflow-hidden transition-colors ${
              dragOver ? 'border-emerald-500 border-dashed' : 'border-white/5'
            }`}
          >
            {dragOver && (
              <div className="absolute inset-0 z-30 bg-[#050807]/92 flex flex-col items-center justify-center gap-3 pointer-events-none">
                <FileUp className="w-12 h-12 text-emerald-400" />
                <p className="text-sm font-bold text-white text-center px-6">{t.drop_file_prompt}</p>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/25 shrink-0">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                <span className={`w-2 h-2 rounded-full ${analysis.ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {t.editor_title || 'Source'}
              </span>
              <span className="h-px flex-1 bg-white/5 min-w-[0.5rem]" />

              <select
                value={indent}
                onChange={e => setIndent(Number(e.target.value) as IndentMode)}
                aria-label={t.indentation}
                className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold cursor-pointer"
              >
                <option value={2} className="bg-[#050807]">{t.indent_2_spaces}</option>
                <option value={4} className="bg-[#050807]">{t.indent_4_spaces}</option>
                <option value={-1} className="bg-[#050807]">{t.indent_tabs}</option>
              </select>

              <select
                value={sort}
                onChange={e => applySort(e.target.value as SortMode)}
                aria-label={t.sort_keys}
                className="bg-white/5 border border-white/10 text-slate-300 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold cursor-pointer"
              >
                <option value="none" className="bg-[#050807]">{t.sort_none || 'Original order'}</option>
                <option value="asc" className="bg-[#050807]">{t.sort_asc || 'Keys A → Z'}</option>
                <option value="desc" className="bg-[#050807]">{t.sort_desc || 'Keys Z → A'}</option>
              </select>

              <select
                value=""
                onChange={e => {
                  const id = e.target.value as SampleId;
                  if (id) store.setText(SAMPLES[id]);
                  e.target.value = '';
                }}
                aria-label={t.load_mock}
                className="bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 text-[11px] px-2 py-1.5 rounded-lg outline-none font-bold cursor-pointer"
              >
                <option value="" className="bg-[#050807]">{t.load_mock}</option>
                {SAMPLE_KEYS.map(sample => (
                  <option key={sample.id} value={sample.id} className="bg-[#050807]">
                    {t[sample.key] || sample.fallback}
                  </option>
                ))}
              </select>

              <label className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer" title={t.open_file || 'Open a file'}>
                <FileUp className="w-3.5 h-3.5" />
                <input
                  ref={fileInput}
                  type="file"
                  accept={ACCEPT_ATTRIBUTE}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) acceptFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(text);
                  setCopiedInput(ok);
                  if (!ok) notify(t.copy_failed || 'The browser refused clipboard access.');
                  window.setTimeout(() => setCopiedInput(false), 1600);
                }}
                title={t.copy_source || 'Copy the source'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                {copiedInput ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                title={t.shortcuts || 'Keyboard shortcuts'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status */}
            <div
              className={`px-4 py-2 text-[11.5px] font-semibold flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/5 shrink-0 ${
                !hasText
                  ? 'bg-white/[0.02] text-slate-500'
                  : analysis.pending
                    ? 'bg-white/[0.02] text-slate-400'
                    : analysis.ok
                      ? 'bg-emerald-950/25 text-emerald-300'
                      : 'bg-rose-950/25 text-rose-300'
              }`}
            >
              {!hasText ? (
                <span>{t.status_empty || 'Nothing loaded yet.'}</span>
              ) : analysis.pending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{t.status_checking || 'Validating off the main thread…'}</span>
                </>
              ) : analysis.ok ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.status_valid}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="min-w-0">
                    {t[ISSUE_LABEL_KEYS[error?.code ?? 'syntax']] || ISSUE_FALLBACK[error?.code ?? 'syntax']}
                    {error ? ` · ${(t.error_at || 'line {0}, column {1}').replace('{0}', String(error.line)).replace('{1}', String(error.column))}` : ''}
                  </span>
                  {error && (
                    <button
                      type="button"
                      onClick={() => locate(error.offset)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[10.5px] font-bold cursor-pointer"
                    >
                      <Crosshair className="w-3 h-3" />
                      {t.jump_to_error || 'Go there'}
                    </button>
                  )}
                </>
              )}
            </div>

            {error && (
              <p className="px-4 py-2 text-[11px] font-mono text-rose-200/70 bg-rose-950/10 border-b border-white/5 shrink-0 break-words">
                {error.message}
              </p>
            )}

            <Editor
              value={text}
              onChange={store.setText}
              placeholder={t.empty_placeholder}
              errorLine={error?.line ?? null}
              focus={focus}
              ariaLabel={t.editor_title || 'Source'}
            />

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-white/5 bg-black/25 shrink-0">
              <button
                type="button"
                onClick={store.undo}
                disabled={!store.canUndo}
                title={`${t.undo || 'Undo'} (Ctrl+Z)`}
                aria-label={t.undo || 'Undo'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={store.redo}
                disabled={!store.canRedo}
                title={`${t.redo || 'Redo'} (Ctrl+Shift+Z)`}
                aria-label={t.redo || 'Redo'}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={store.reset}
                disabled={!hasText}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.clear}
              </button>

              <span className="h-px flex-1 bg-white/5 min-w-[0.5rem]" />

              {analysis.repairable && (
                <button
                  type="button"
                  onClick={repair}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] font-bold hover:bg-amber-500/25 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  {t.repair_btn || 'Repair'}
                </button>
              )}
              {escaped && (
                <button
                  type="button"
                  onClick={unescape}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-200 text-[11px] font-bold hover:bg-sky-500/25 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.unescape_btn || 'Unescape'}
                </button>
              )}
              {jsonl && (
                <button
                  type="button"
                  onClick={() => store.setText(joinJsonLines(text))}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-200 text-[11px] font-bold hover:bg-sky-500/25 cursor-pointer"
                >
                  <Braces className="w-3.5 h-3.5" />
                  {t.jsonl_btn || 'Join JSON Lines'}
                </button>
              )}

              <button
                type="button"
                onClick={minify}
                disabled={!hasText}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#0c1e15] border border-emerald-900/50 text-emerald-300 text-[11px] font-bold hover:bg-[#122e20] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                {t.minify}
              </button>
              <button
                type="button"
                onClick={beautify}
                disabled={!hasText}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black shadow-lg shadow-emerald-950/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-none"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {t.beautify}
              </button>
            </div>
          </div>

          {/* ---------------- Output ---------------- */}
          <div className="glass-card rounded-3xl border border-white/5 p-4 sm:p-5 flex flex-col h-[560px] lg:h-[680px] min-h-0">
            <Output
              t={t}
              tab={tab}
              setTab={setTab}
              root={liveRoot}
              indent={indent}
              sort={sort}
              stale={!!doc && doc.source !== text}
              emptyLabel={
                !hasText
                  ? t.no_nodes
                  : analysis.ok
                    ? t.press_parse || 'Press Parse to build the tree for this document.'
                    : t.fix_first || 'Fix the error on the left and the panels will fill in.'
              }
              onLocate={locate}
              onUseAsDocument={next => {
                store.setText(next);
                setTab('tree');
              }}
              notify={notify}
              query={query}
              setQuery={setQuery}
              scope={scope}
              setScope={setScope}
              expanded={expanded}
              setExpanded={setExpanded}
              autoDepth={autoDepth}
              setAutoDepth={setAutoDepth}
            />
          </div>
        </section>

        {/* ---------------- Run bar + stats ---------------- */}
        <section className="mt-5 space-y-4">
          <div className="glass-card rounded-2xl border border-white/5 p-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[11.5px] font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={store.manual}
                onChange={e => store.setManual(e.target.checked)}
                className="accent-emerald-500 cursor-pointer"
              />
              {t.manual_mode || 'Manual mode'}
            </label>
            <span className="text-[11px] text-slate-500 max-w-md">
              {store.manual
                ? t.manual_on || 'Nothing is built until you press Parse.'
                : (t.manual_off || 'Documents under {0} build as you type; bigger ones wait for Parse.').replace(
                    '{0}',
                    formatBytes(AUTO_BUILD_LIMIT)
                  )}
            </span>
            <span className="h-px flex-1 bg-white/5 min-w-[1rem]" />
            {offThread && (
              <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 rounded-lg">
                <IconWorker className="w-3.5 h-3.5" />
                {t.stat_offthread || 'Worker'}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                const built = store.build();
                if (!built) notify(t.toast_needs_valid || 'Fix the error first — there is nothing to build yet.');
              }}
              disabled={!hasText || store.building}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11.5px] font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer border-none"
            >
              {store.building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {t.parse_btn || 'Parse'}
            </button>
          </div>

          {parked && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 flex flex-wrap items-center gap-3">
              <FileUp className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-[12px] text-amber-100 font-bold break-all">{parked.name}</span>
              <span className="text-[11px] font-mono text-amber-200/70">{formatBytes(parked.size)}</span>
              <span className="h-px flex-1 bg-amber-500/20 min-w-[1rem]" />
              <span className="text-[11px] text-amber-200/70 max-w-sm">
                {t.parked_hint || 'Held back on purpose: loading a file this size into the editor is the expensive part.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const file = parked;
                  setParked(null);
                  if (file) void applyFile(file);
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

          {hasText && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                [t.stat_bytes || 'Size', formatBytes(analysis.stats.bytes)],
                [t.stat_lines || 'Lines', formatCount(analysis.stats.lines)],
                [t.stat_nodes || 'Nodes', formatCount(analysis.stats.nodes)],
                [t.stat_depth || 'Depth', String(analysis.stats.depth)],
                [t.stat_keys || 'Unique keys', formatCount(analysis.stats.uniqueKeys)],
                [t.stat_time || 'Parse', `${analysis.ms.toFixed(analysis.ms < 10 ? 1 : 0)} ms`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/5 bg-black/25 px-3 py-2">
                  <div className="text-[9.5px] font-black uppercase tracking-[0.15em] text-slate-600">{label}</div>
                  <div className="text-[13px] font-mono font-bold text-slate-200">{value}</div>
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <details className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center gap-2 cursor-pointer list-none text-[12px] font-bold text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {(t.warnings_title || '{0} things worth knowing').replace('{0}', String(warnings.length))}
                <span className="ml-auto text-amber-400 group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <ul className="mt-3 space-y-2 list-none p-0 m-0">
                {warnings.map((issue, i) => (
                  <li key={i} className="text-[11.5px] text-amber-100/80 flex flex-wrap items-baseline gap-2">
                    <button
                      type="button"
                      onClick={() => locate(issue.offset)}
                      className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-200 cursor-pointer shrink-0"
                    >
                      {issue.line}:{issue.column}
                    </button>
                    <span className="font-bold shrink-0">
                      {t[ISSUE_LABEL_KEYS[issue.code]] || ISSUE_FALLBACK[issue.code]}
                    </span>
                    <span className="opacity-70">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <NextStepBar lang={lang} t={t} getResult={getResult} disabled={!hasText} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const built = doc && doc.source === text ? doc : null;
                downloadText(
                  built ? printJson(built.root, { indent, sort }) : text,
                  'json-flow.json',
                  'application/json'
                );
              }}
              disabled={!hasText}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-[11.5px] font-bold hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <IconHandoff className="w-4 h-4 text-emerald-400" />
              {t.download_json || 'Download .json'}
            </button>
            <button
              type="button"
              onClick={() => {
                setExpanded(new Set());
                setAutoDepth(2);
                setQuery('');
                setSort('none');
                setTab('tree');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11.5px] font-bold hover:bg-white/10 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {t.reset_view || 'Reset the view'}
            </button>
          </div>
        </section>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle || 'How it works'}
            </h2>
            <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div
                  key={i}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-emerald-500/20 transition-all group"
                >
                  <span className="absolute top-5 right-6 text-5xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors">
                    {i + 1}
                  </span>
                  <Art className="w-24 h-auto text-emerald-400" />
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
          {features.map((feature: any, i: number) => {
            const Icon = featureIcons[i] || IconParser;
            return (
              <div
                key={i}
                className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <span className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:border-emerald-500/40 transition-all">
                  <Icon className="w-5 h-5" />
                </span>
                <h3 className="text-white text-base font-bold mb-2 group-hover:text-emerald-400 transition-colors">
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
                <span className="inline-block px-4 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-white leading-[1.1] tracking-tight">
                {t.seoHeroTitle}
              </h2>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">{t.seoHeroText}</p>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 md:p-10 min-h-[320px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <span className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl" />
              <IconLocal className="w-16 h-16 text-emerald-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                  {t.seoBrowserSpeedTitle}
                </h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#07130f] border border-white/5 space-y-8">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-emerald-500 rounded-full" />
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
                <div className="h-1 w-16 bg-emerald-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, i: number) => (
                  <details
                    key={i}
                    className="glass-card rounded-2xl px-5 sm:px-6 py-5 text-left border border-white/5 hover:border-emerald-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-emerald-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-emerald-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
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

        <AdBanner id="adsense-json-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[190] max-w-[90vw] px-4 py-3 rounded-2xl bg-[#0a1512] border border-emerald-500/25 text-emerald-100 text-[12.5px] font-bold shadow-2xl"
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
            className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07130f] p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">{t.shortcuts || 'Keyboard shortcuts'}</h3>
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
                  <kbd className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px] text-emerald-300 shrink-0">
                    {keys}
                  </kbd>
                  <span className="text-slate-400 text-right text-[13px]">{description}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* `nav[...]` is the short menu label and `sections` does not exist at all,
          so this modal used to open with an empty body. The real copy lives at
          legalTranslations[lang][kind].title / .content. */}
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

export default JSONFlow;
