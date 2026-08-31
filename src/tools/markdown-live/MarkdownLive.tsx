import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  Columns2,
  Copy,
  Download,
  Eye,
  FileCode,
  FileDown,
  FileText,
  Layers,
  Link2,
  ListTree,
  Loader2,
  Palette,
  PanelLeft,
  Printer,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { useHandoffIntake } from '../../lib/useHandoff';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { Editor, type EditorHandle } from './components/Editor';
import { Preview, type PreviewHandle } from './components/Preview';
import { NextStepBar } from './components/NextStepBar';
import {
  IconExport,
  IconHandoff,
  IconHistory,
  IconLive,
  IconLocalOnly,
  IconOutline,
  IconParser,
  IconSyntax,
  IconThemes,
  MarkdownHeroArt,
  StepPreview,
  StepShip,
  StepStyle,
  StepWrite,
} from './components/Illustrations';

import { useTextDoc } from './lib/history';
import { useCompiled } from './lib/useCompiled';
import { allThemesCss } from './lib/themes';
import { THEMES } from './lib/themes';
import {
  buildHtmlFile,
  copyRich,
  copyText,
  download,
  documentName,
  printDocument,
  renderBody,
} from './lib/exporters';
import { SAMPLE_FALLBACK, templatesFrom } from './lib/samples';
import type { PaneMode, PreviewMode, StagedDoc, ThemeId } from './types';

interface MarkdownLiveProps {
  lang: string;
  dictionary: any;
}

const STORAGE_KEY = 'olovetools:markdown-live:draft';
const THEME_KEY = 'olovetools:markdown-live:theme';
/** Anything past this is not a document somebody typed; it is a paste accident. */
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

const ACCEPTED = '.md,.markdown,.mdown,.mkd,.mdx,.txt,.text,text/markdown,text/plain';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function MarkdownLive({ lang, dictionary }: MarkdownLiveProps) {
  const t = dictionary || {};

  const sample = typeof t.placeholder === 'string' && t.placeholder ? t.placeholder : SAMPLE_FALLBACK;
  const templates = useMemo(() => templatesFrom(t), [t]);

  // Pinned to the page's language rather than left to `toLocaleString()`. This
  // island is server-rendered, and the server's default locale is not the
  // visitor's: "1075" from Node against "1,075" from the browser is a hydration
  // mismatch that throws away the server markup on every visit.
  const number = useMemo(() => new Intl.NumberFormat(lang || 'en'), [lang]);

  const doc = useTextDoc(sample);
  // Set once the saved draft has been looked at, so autosave cannot write the
  // sample document over a real draft during the first render.
  const restored = useRef(false);

  const [theme, setTheme] = useState<ThemeId>('slate');
  const [pane, setPane] = useState<PaneMode>('split');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('preview');
  const [syncScroll, setSyncScroll] = useState(true);
  const [staged, setStaged] = useState<StagedDoc | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [dragging, setDragging] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  // The word count comes from `Intl.Segmenter`, and Node's ICU and the
  // browser's do not always agree on the same text (157 against 159 on the
  // sample document). Both numbers are defensible; disagreeing during
  // hydration is not, so the counters wait for the client.
  const [mounted, setMounted] = useState(false);

  const editorRef = useRef<EditorHandle>(null);
  const previewRef = useRef<PreviewHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which pane is currently driving the scroll, so the two never fight.
  const scrollOwner = useRef<'editor' | 'preview' | null>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const compiled = useCompiled(doc.text);

  // -------------------------------------------------------------------------
  // Preferences and persistence
  // -------------------------------------------------------------------------

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY) as ThemeId | null;
      if (saved && THEMES.some(entry => entry.id === saved)) setTheme(saved);
    } catch {
      // Storage disabled: the default theme is a perfectly good answer.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* no-op */
    }
  }, [theme]);

  // The saved draft is restored after mount rather than in the initial state:
  // this island is server-rendered, and reading storage during the first render
  // makes the server's markup and the client's disagree.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim() !== '' && saved !== sample) doc.load(saved);
    } catch {
      /* Storage disabled: the sample document is a fine place to start. */
    }
    restored.current = true;
    // Runs once. `doc.load` is stable and `sample` cannot change after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave, debounced: a refresh, a crash or a mis-click on the tab must not
  // be the end of what somebody just wrote.
  useEffect(() => {
    if (!restored.current) return;
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, doc.text);
      } catch {
        /* quota or private mode: the editor still works, it just forgets. */
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [doc.text]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => () => clearTimeout(scrollTimer.current), []);

  // -------------------------------------------------------------------------
  // Intake — nothing loads itself
  // -------------------------------------------------------------------------

  const stage = useCallback(
    async (file: File, from: string | null) => {
      if (file.size > MAX_INPUT_BYTES) {
        setNotice(
          (t.errorTooBig || 'That file is larger than {size} and will not fit in a browser tab.').replace(
            '{size}',
            formatBytes(MAX_INPUT_BYTES)
          )
        );
        return;
      }
      try {
        const body = await file.text();
        const isJson = /\.jsonl?$/i.test(file.name);
        setStaged({
          name: file.name,
          size: file.size,
          body: isJson ? '```json\n' + body.trim() + '\n```' : body,
          from,
        });
      } catch {
        setNotice(t.errorRead || 'That file could not be read.');
      }
    },
    [t]
  );

  // A document handed over by another tool waits in the same tray a dropped
  // file does: arriving from wordflow must not silently wipe what is on screen.
  useHandoffIntake((file, from) => {
    void stage(file, from);
  });

  const acceptStaged = (how: 'replace' | 'append') => {
    if (!staged) return;
    if (how === 'replace') doc.load(staged.body);
    else doc.setText(`${doc.text.replace(/\s+$/, '')}\n\n${staged.body}`, { label: 'stagedAppend' });
    setStaged(null);
    editorRef.current?.focus();
  };

  const onFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    void stage(files[0], null);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    onFiles(event.dataTransfer.files);
  };

  const doPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      setStaged({ name: t.pastedName || 'Pasted text', size: new Blob([text]).size, body: text, from: null });
    } catch {
      setNotice(t.errorClipboard || 'The browser did not allow reading the clipboard. Paste into the editor instead.');
    }
  };

  // -------------------------------------------------------------------------
  // Scroll sync
  // -------------------------------------------------------------------------

  const releaseOwner = () => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      scrollOwner.current = null;
    }, 120);
  };

  const onEditorScroll = (ratio: number) => {
    if (!syncScroll || pane !== 'split') return;
    if (scrollOwner.current === 'preview') return;
    scrollOwner.current = 'editor';
    previewRef.current?.scrollTo(ratio);
    releaseOwner();
  };

  const onPreviewScroll = (ratio: number) => {
    if (!syncScroll || pane !== 'split') return;
    if (scrollOwner.current === 'editor') return;
    scrollOwner.current = 'preview';
    editorRef.current?.scrollTo(ratio);
    releaseOwner();
  };

  // -------------------------------------------------------------------------
  // Exports
  // -------------------------------------------------------------------------

  const baseName = useMemo(() => documentName(doc.text), [doc.text]);

  const run = async (id: string, action: () => void | Promise<void>) => {
    setBusy(id);
    try {
      await action();
    } catch {
      setNotice(t.errorExport || 'That export could not be produced.');
    } finally {
      setBusy(null);
    }
  };

  const downloadMarkdown = () =>
    run('md', () => {
      download(new Blob([doc.text], { type: 'text/markdown;charset=utf-8' }), `${baseName}.md`);
    });

  const downloadHtml = () =>
    run('html', () => {
      const file = buildHtmlFile(doc.text, theme, lang);
      download(new Blob([file], { type: 'text/html;charset=utf-8' }), `${baseName}.html`);
    });

  const doPrint = () => run('pdf', () => printDocument(doc.text, theme));

  const copyCleanHtml = () =>
    run('copyHtml', async () => {
      const ok = await copyText(renderBody(doc.text, { bare: true, anchors: false }));
      setCopied(ok ? 'copyHtml' : null);
      if (!ok) setNotice(t.errorClipboardWrite || 'The clipboard is not available in this browser.');
    });

  const copyFormatted = () =>
    run('copyRich', async () => {
      const ok = await copyRich(doc.text, theme);
      setCopied(ok ? 'copyRich' : null);
      if (!ok) setNotice(t.errorClipboardWrite || 'The clipboard is not available in this browser.');
    });

  const copyMarkdown = () =>
    run('copyMd', async () => {
      const ok = await copyText(doc.text);
      setCopied(ok ? 'copyMd' : null);
    });

  const getResult = useCallback(
    async () => ({
      blob: new Blob([doc.text], { type: 'text/markdown;charset=utf-8' }),
      name: `${documentName(doc.text)}.md`,
    }),
    [doc.text]
  );

  const resetWorkspace = () => {
    doc.load('');
    setStaged(null);
    setNotice(t.noticeCleared || 'Editor cleared. Ctrl+Z brings your text back.');
    editorRef.current?.focus();
  };

  const loadTemplate = (body: string) => {
    doc.load(body);
    setStaged(null);
    editorRef.current?.focus();
  };

  // -------------------------------------------------------------------------
  // Copy for the marketing sections
  // -------------------------------------------------------------------------

  const steps = [
    { art: StepWrite, title: t.step1Title, text: t.step1Text },
    { art: StepPreview, title: t.step2Title, text: t.step2Text },
    { art: StepStyle, title: t.step3Title, text: t.step3Text },
    { art: StepShip, title: t.step4Title, text: t.step4Text },
  ];
  const featureIcons = [IconParser, IconSyntax, IconLive, IconThemes, IconExport, IconOutline, IconHistory, IconHandoff];
  const features = Array.isArray(t.features) ? t.features : [];
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];
  const stats = compiled.stats;
  const isEmpty = doc.text.trim() === '';

  const paneButtons: { id: PaneMode; icon: React.ReactNode; labelKey: string; fallback: string }[] = [
    { id: 'editor', icon: <PanelLeft className="w-3.5 h-3.5" />, labelKey: 'pane_editor', fallback: 'Editor' },
    { id: 'split', icon: <Columns2 className="w-3.5 h-3.5" />, labelKey: 'pane_split', fallback: 'Split' },
    { id: 'preview', icon: <Eye className="w-3.5 h-3.5" />, labelKey: 'pane_preview', fallback: 'Preview' },
  ];

  const previewButtons: { id: PreviewMode; icon: React.ReactNode; labelKey: string; fallback: string }[] = [
    { id: 'preview', icon: <Eye className="w-3.5 h-3.5" />, labelKey: 'preview_mode', fallback: 'Preview' },
    { id: 'html', icon: <FileCode className="w-3.5 h-3.5" />, labelKey: 'html_mode', fallback: 'HTML' },
    { id: 'toc', icon: <ListTree className="w-3.5 h-3.5" />, labelKey: 'toc_mode', fallback: 'Outline' },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-violet-500/25 selection:text-violet-50 relative">
      {/* Every theme's variables, once. Injected here rather than per render so
          switching skins never re-parses a stylesheet. */}
      <style dangerouslySetInnerHTML={{ __html: allThemesCss() }} />

      <Header
        currentLang={lang}
        onLanguageChange={newLang => {
          window.location.href = `/${newLang.toLowerCase()}/markdown-live`;
        }}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 sm:px-6 pt-28 md:pt-36 pb-20 flex flex-col gap-16 relative z-10">
        <AdBanner id="adsense-markdown-live-top" />

        {/* ================================================================= */}
        {/* Hero                                                              */}
        {/* ================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-violet-950/40 border border-violet-800/40 text-violet-300 text-[11px] font-black tracking-[0.2em] uppercase">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.badge || 'Markdown, rendered in your tab'}</span>
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
                  <span className="w-6 h-6 shrink-0 bg-violet-500/20 text-violet-300 rounded-lg flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <span className="text-slate-300 font-bold text-[13px] leading-snug">{point}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-10 -right-10 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <MarkdownHeroArt
              className="relative w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              animated={!prefersReduced}
            />
          </div>
        </section>

        {/* ================================================================= */}
        {/* Workspace                                                         */}
        {/* ================================================================= */}
        <section className="space-y-4">
          {/* --- staged document ------------------------------------------- */}
          {staged && (
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 shrink-0 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <FileText className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{staged.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatBytes(staged.size)}
                    {staged.from ? ` · ${(t.fromTool || 'from {tool}').replace('{tool}', staged.from)}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStaged(null)}
                  title={t.stagedDiscard || 'Discard'}
                  aria-label={t.stagedDiscard || 'Discard'}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.stagedHint || 'Nothing has been loaded yet — say what should happen to the text you already have.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => acceptStaged('replace')}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition-all cursor-pointer"
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

          {notice && (
            <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-100">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label={t.dismiss || 'Dismiss'}
                className="text-amber-200 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* --- the workspace card ---------------------------------------- */}
          <div
            onDragOver={event => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`glass-card rounded-3xl border overflow-hidden transition-colors ${
              dragging ? 'border-violet-500/60 bg-violet-500/5' : 'border-white/10'
            }`}
          >
            {/* top bar */}
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-white/5 bg-black/25">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
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

              {/* Start from scratch or from a skeleton: the manual route, with
                  no file and no handoff involved. */}
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.startFrom || 'Start from'}</span>
                </button>
                <div className="absolute left-0 top-full pt-1.5 z-30 hidden group-hover:block group-focus-within:block">
                  <div className="w-56 rounded-xl border border-white/10 bg-[#0d0718] shadow-2xl shadow-black/60 p-1.5 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => loadTemplate('')}
                      className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold text-slate-300 hover:bg-violet-500/15 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.tplBlank || 'Blank document'}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTemplate(sample)}
                      className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold text-slate-300 hover:bg-violet-500/15 hover:text-white transition-colors cursor-pointer"
                    >
                      {t.tplSample || 'Syntax tour'}
                    </button>
                    {templates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => loadTemplate(template.body)}
                        className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold text-slate-300 hover:bg-violet-500/15 hover:text-white transition-colors cursor-pointer"
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={resetWorkspace}
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-bold text-slate-300 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.clear || 'Clear'}</span>
              </button>

              <span className="flex-1" />

              {/* theme */}
              <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/30 text-[11px] font-bold text-slate-400 cursor-pointer">
                <Palette className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="hidden md:inline">{t.style_label || 'Theme'}</span>
                <select
                  value={theme}
                  onChange={event => setTheme(event.target.value as ThemeId)}
                  aria-label={t.style_label || 'Theme'}
                  className="bg-transparent border-none text-[11px] text-white font-black cursor-pointer outline-none"
                >
                  {THEMES.map(entry => (
                    <option key={entry.id} value={entry.id} className="bg-[#0d0718] text-white">
                      {t[entry.labelKey] || entry.fallback}
                    </option>
                  ))}
                </select>
              </label>

              {/* layout */}
              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
                {paneButtons.map(button => (
                  <button
                    key={button.id}
                    type="button"
                    onClick={() => setPane(button.id)}
                    title={t[button.labelKey] || button.fallback}
                    aria-label={t[button.labelKey] || button.fallback}
                    aria-pressed={pane === button.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                      pane === button.id ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {button.icon}
                    <span className="hidden lg:inline">{t[button.labelKey] || button.fallback}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* second row: what the right pane shows + scroll sync */}
            {pane !== 'editor' && (
              <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white/5 bg-black/10">
                <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
                  {previewButtons.map(button => (
                    <button
                      key={button.id}
                      type="button"
                      onClick={() => setPreviewMode(button.id)}
                      aria-pressed={previewMode === button.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-black transition-all cursor-pointer ${
                        previewMode === button.id ? 'bg-violet-600/80 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {button.icon}
                      <span>{t[button.labelKey] || button.fallback}</span>
                    </button>
                  ))}
                </div>

                {pane === 'split' && (
                  <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-black/30 text-[11px] font-bold text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncScroll}
                      onChange={event => setSyncScroll(event.target.checked)}
                      className="accent-violet-500 cursor-pointer"
                    />
                    {t.syncScroll || 'Sync scroll'}
                  </label>
                )}

                <span className="flex-1" />

                {compiled.stale && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {t.rendering || 'Rendering…'}
                  </span>
                )}
                {compiled.frontMatter && (
                  <span
                    title={compiled.frontMatter}
                    className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-500"
                  >
                    {t.frontMatter || 'Front matter'}
                  </span>
                )}
              </div>
            )}

            {/* --- the two panes ------------------------------------------- */}
            {/* `lg:flex-1` and never a bare `flex-1`: inside a flex-col the
                shorthand sets flex-basis:0 on the vertical axis and collapses
                the pane, which is exactly how the editor ended up 88 px tall on
                a phone. Explicit heights below lg, a shared height from lg up. */}
            <div className="flex flex-col lg:flex-row lg:h-[clamp(30rem,68vh,54rem)]">
              {pane !== 'preview' && (
                <Editor
                  ref={editorRef}
                  value={doc.text}
                  onChange={doc.setText}
                  onScrollRatio={onEditorScroll}
                  onUndo={doc.undo}
                  onRedo={doc.redo}
                  canUndo={doc.canUndo}
                  canRedo={doc.canRedo}
                  t={t}
                  className={`h-[52vh] min-h-[20rem] lg:h-auto lg:min-h-0 lg:flex-1 ${
                    pane === 'split' ? 'border-b lg:border-b-0 lg:border-r border-white/5' : ''
                  }`}
                />
              )}
              {pane !== 'editor' && (
                <Preview
                  ref={previewRef}
                  html={compiled.html}
                  toc={compiled.toc}
                  mode={previewMode}
                  theme={theme}
                  empty={isEmpty}
                  onScrollRatio={onPreviewScroll}
                  onCopyHtml={copyCleanHtml}
                  copied={copied === 'copyHtml'}
                  t={t}
                  className="h-[52vh] min-h-[20rem] lg:h-auto lg:min-h-0 lg:flex-1 bg-black/20"
                />
              )}
            </div>

            {/* --- status + exports ----------------------------------------- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 px-4 py-3 border-t border-white/5 bg-black/25">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500">
                <span>
                  <b className="text-white font-black">{mounted ? number.format(stats.words) : '—'}</b>{' '}
                  {t.words || 'words'}
                </span>
                <span>
                  <b className="text-white font-black">{number.format(stats.chars)}</b> {t.characters || 'characters'}
                </span>
                <span>
                  <b className="text-white font-black">{mounted ? stats.readingMinutes : '—'}</b>{' '}
                  {t.minRead || 'min read'}
                </span>
                <span className="hidden sm:inline">
                  <b className="text-white font-black">{stats.headings}</b> {t.headings || 'headings'}
                </span>
                {stats.tasks.total > 0 && (
                  <span className="hidden sm:inline">
                    <b className="text-white font-black">
                      {stats.tasks.done}/{stats.tasks.total}
                    </b>{' '}
                    {t.tasksDone || 'tasks'}
                  </span>
                )}
                {doc.steps > 0 && (
                  <span className="hidden lg:inline opacity-70">
                    {(t.historySize || '{steps} undo steps · {bytes}')
                      .replace('{steps}', String(doc.steps))
                      .replace('{bytes}', formatBytes(doc.bytes))}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyMarkdown}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    copied === 'copyMd'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {copied === 'copyMd' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === 'copyMd' ? t.copied || 'Copied!' : t.btn_copy_md || 'Copy MD'}
                </button>
                <button
                  type="button"
                  onClick={copyFormatted}
                  title={t.btn_copy_rich_hint || 'Paste into a doc or an email keeping the formatting'}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                    copied === 'copyRich'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {copied === 'copyRich' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                  {copied === 'copyRich' ? t.copied || 'Copied!' : t.btn_copy_rich || 'Copy formatted'}
                </button>
                <button
                  type="button"
                  onClick={downloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-bold transition-all cursor-pointer"
                >
                  {busy === 'md' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {t.btn_download_md || 'Download MD'}
                </button>
                <button
                  type="button"
                  onClick={downloadHtml}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-[11px] font-bold transition-all cursor-pointer"
                >
                  {busy === 'html' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                  {t.btn_download_html || 'Download HTML'}
                </button>
                <button
                  type="button"
                  onClick={doPrint}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black transition-all cursor-pointer shadow-lg shadow-violet-900/40"
                >
                  {busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  {t.btn_download_pdf || 'Export PDF'}
                </button>
              </div>
            </div>
          </div>

          <NextStepBar lang={lang} t={t} getResult={getResult} disabled={isEmpty} />

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={event => {
              onFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </section>

        {/* ================================================================= */}
        {/* How it works                                                      */}
        {/* ================================================================= */}
        <section className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {t.howItWorksTitle || 'How it works'}
            </h2>
            <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => {
              const Art = step.art;
              return (
                <div
                  key={index}
                  className="relative glass-card rounded-3xl p-6 space-y-4 border border-white/5 hover:border-violet-500/20 transition-all group overflow-hidden"
                >
                  <span className="absolute top-4 right-5 text-5xl font-black text-white/5 group-hover:text-violet-500/10 transition-colors">
                    {index + 1}
                  </span>
                  <Art className="w-24 h-auto text-violet-400" />
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
              <div
                key={index}
                className="p-6 glass-card rounded-3xl border border-white/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4 group-hover:scale-110 group-hover:border-violet-500/40 transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white text-base font-bold mb-2 group-hover:text-violet-400 transition-colors">
                  {feature.title}
                </h3>
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
                <div className="inline-block px-4 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 text-[11px] font-black uppercase tracking-[0.2em] border border-violet-500/20">
                  {keywords[0]}
                </div>
              )}
              <h2 className="text-2xl md:text-4xl font-black text-white leading-tight tracking-tight">
                {t.seoBrowserSpeedTitle}
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">{t.seoBrowserSpeedText}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, index: number) => (
                  <div key={index} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="w-6 h-6 shrink-0 bg-violet-500/20 text-violet-300 rounded-lg flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                    <span className="text-slate-300 font-bold text-[13px]">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative glass-card rounded-[2.5rem] p-8 py-14 min-h-[340px] flex flex-col items-center justify-center gap-6 text-center overflow-hidden border border-white/5">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />
              <IconLocalOnly className="w-16 h-16 text-violet-400 relative" />
              <div className="space-y-3 max-w-sm relative">
                <h3 className="text-xl font-black text-white tracking-tight leading-tight">{t.seoPrivacyTitle}</h3>
                <p className="text-slate-400 font-medium text-sm leading-relaxed">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          <div className="p-7 md:p-12 rounded-3xl bg-[#0d0620] border border-white/5 space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-xl md:text-3xl font-black text-white leading-tight">{t.seoSecondaryTitle}</h2>
              <div className="h-1.5 w-20 bg-violet-500 rounded-full" />
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
                <div className="h-1 w-16 bg-violet-500 mx-auto rounded-full" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq: any, index: number) => (
                  <details
                    key={index}
                    className="glass-card rounded-2xl px-5 py-4 text-left border border-white/5 hover:border-violet-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex items-start gap-3 cursor-pointer list-none text-[15px] font-bold text-white group-hover:text-violet-400 transition-colors">
                      <span className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-[11px] font-black">
                        Q
                      </span>
                      <span className="flex-1 min-w-0">{faq.question}</span>
                      <span className="shrink-0 text-violet-400 transition-transform group-open:rotate-45 text-xl leading-none">
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
            <div className="max-w-4xl mx-auto w-full space-y-4 opacity-55 text-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{t.seoKeywordsTitle}</h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-violet-500/10 hover:border-violet-500/20 hover:text-violet-400 transition-all cursor-default"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <AdBanner id="adsense-markdown-live-bottom" />
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
