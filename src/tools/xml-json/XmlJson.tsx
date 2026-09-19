import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Braces,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileCode,
  FilePlus2,
  FolderOpen,
  Hand,
  Keyboard,
  Loader2,
  Minimize2,
  PlayCircle,
  Redo2,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';

import { Editor } from './components/Editor';
import { OptionsPanel } from './components/OptionsPanel';
import { TreeView } from './components/TreeView';
import { NextStepBar } from './components/NextStepBar';
import {
  IconAst,
  IconHandoff,
  IconLocal,
  IconOptions,
  IconPointer,
  IconRoundTrip,
  IconWorker,
  IconXPath,
  STEP_ART,
  XmlHeroArt,
} from './components/Illustrations';

import type { Direction, ParseIssue, ToJsonOptions, ToXmlOptions } from './types';
import { DEFAULT_TO_JSON, DEFAULT_TO_XML } from './types';
import { useConvert } from './lib/useConvert';
import { formatJson, formatXml, parseJsonWithPosition } from './lib/convert';
import { parseXml } from './lib/xmlParse';
import { projectDocument } from './lib/toJson';
import { useTextHistory } from './lib/history';
import { runXPath, type XPathOutcome } from './lib/xpath';
import { SAMPLES, SAMPLE_JSON, SAMPLE_XML } from './lib/samples';
import { ACCEPT_ATTRIBUTE, copyText, detectDirection, downloadText, MAX_BYTES, readTextFile } from './lib/io';

interface XmlJsonProps {
  lang: string;
  dictionary: any;
}

type ResultTab = 'output' | 'tree' | 'xpath' | 'issues';
type LegalKey = 'privacy' | 'terms' | 'cookies';

interface ParkedFile {
  name: string;
  text: string;
  direction: Direction;
  bytes: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ISSUE_FALLBACK: Record<string, string> = {
  'unclosed-tag': 'Tag never closed',
  'mismatched-tag': 'Closing tag does not match the open one',
  'stray-close': 'Closing tag with nothing open',
  'no-root': 'No root element',
  'multiple-roots': 'A document can only have one root element',
  'bad-name': 'Not a valid name here',
  'unquoted-attr': 'Attribute value is not quoted',
  'duplicate-attr': 'Attribute repeated on the same element',
  'unknown-entity': 'Entity is not declared',
  'bad-char-ref': 'Invalid character reference',
  'unterminated-comment': 'Comment never closed',
  'unterminated-cdata': 'CDATA section never closed',
  'unterminated-pi': 'Processing instruction never closed',
  'unterminated-tag': 'Tag never closed with >',
  'double-hyphen-comment': '-- is not allowed inside a comment',
  'text-before-root': 'Text outside the root element',
  'bad-declaration': 'Malformed XML declaration',
  'undeclared-prefix': 'Namespace prefix is not declared',
  'json-syntax': 'JSON syntax error',
  'json-root': 'Several top-level keys wrapped into one root',
  'json-empty': 'Nothing to convert',
  'bad-key': 'Key is not a valid XML name and was repaired',
};

export default function XmlJson({ lang, dictionary }: XmlJsonProps) {
  const t = dictionary || {};

  // ---------------------------------------------------------------- state --
  const [direction, setDirection] = useState<Direction>('xml-to-json');
  const [xmlText, setXmlText] = useState(SAMPLE_XML);
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [jsonOptions, setJsonOptions] = useState<ToJsonOptions>(DEFAULT_TO_JSON);
  const [xmlOptions, setXmlOptions] = useState<ToXmlOptions>(DEFAULT_TO_XML);
  const [roundTripOn, setRoundTripOn] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>('output');
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(13);
  const [gotoLine, setGotoLine] = useState<{ line: number; col: number; nonce: number } | null>(null);
  const [parked, setParked] = useState<ParkedFile | null>(null);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState('');
  const [comparing, setComparing] = useState(false);
  const [xpathExpression, setXpathExpression] = useState('');
  const [xpathResult, setXpathResult] = useState<XPathOutcome | null>(null);
  const [legalModal, setLegalModal] = useState<LegalKey | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const xmlHistory = useTextHistory(SAMPLE_XML);
  const jsonHistory = useTextHistory(SAMPLE_JSON);
  const { result, running, stale, run, markStale } = useConvert();

  const isXmlSource = direction === 'xml-to-json';
  const source = isXmlSource ? xmlText : jsonText;
  const history = isXmlSource ? xmlHistory : jsonHistory;
  const output = manual ? manualText : result.output;

  // Reading `matchMedia` during render would make the server and the client
  // disagree on the first paint, so it lands after mount.
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const listen = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    query.addEventListener('change', listen);
    return () => query.removeEventListener('change', listen);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(copyTimer.current);
      clearTimeout(toastTimer.current);
    },
    []
  );

  const flash = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const setSource = useCallback(
    (value: string, options?: { silent?: boolean }) => {
      if (isXmlSource) setXmlText(value);
      else setJsonText(value);
      if (!options?.silent) history.push(value);
      markStale();
    },
    [isXmlSource, history, markStale]
  );

  // ------------------------------------------------------------- converting --
  const convert = useCallback(() => {
    run(direction, isXmlSource ? xmlText : jsonText, jsonOptions, xmlOptions, roundTripOn);
    setResultTab(current => (current === 'issues' ? 'output' : current));
  }, [run, direction, isXmlSource, xmlText, jsonText, jsonOptions, xmlOptions, roundTripOn]);

  // Changing an option invalidates the result but does not re-run it: the
  // conversion is the expensive part and it stays under the user's finger.
  useEffect(() => {
    markStale();
  }, [jsonOptions, xmlOptions, direction, markStale]);

  // --------------------------------------------------------------- intake --
  const takeText = useCallback(
    (name: string, text: string, bytes: number) => {
      // Nothing is converted on arrival: the file waits, the user picks the
      // settings and presses the button.
      setParked({ name, text, direction: detectDirection(name, text), bytes });
      setResultTab('output');
    },
    []
  );

  const openFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        flash((t.error_too_large || 'That file is over {max}.').replace('{max}', formatBytes(MAX_BYTES)));
        return;
      }
      readTextFile(file)
        .then(text => takeText(file.name, text, file.size))
        .catch(() => flash(t.error_read || 'That file could not be read.'));
    },
    [flash, t.error_too_large, t.error_read, takeText]
  );

  useHandoffIntake((file, from) => {
    readTextFile(file)
      .then(text => {
        takeText(file.name, text, file.size);
        flash((t.handoff_received || 'Received from {tool}.').replace('{tool}', from));
      })
      .catch(() => flash(t.error_read || 'That file could not be read.'));
  });

  const loadParked = useCallback(
    (andConvert: boolean) => {
      if (!parked) return;
      setDirection(parked.direction);
      if (parked.direction === 'xml-to-json') {
        setXmlText(parked.text);
        xmlHistory.reset(parked.text);
      } else {
        setJsonText(parked.text);
        jsonHistory.reset(parked.text);
      }
      setParked(null);
      markStale();
      if (andConvert) {
        run(parked.direction, parked.text, jsonOptions, xmlOptions, roundTripOn);
      }
    },
    [parked, xmlHistory, jsonHistory, markStale, run, jsonOptions, xmlOptions, roundTripOn]
  );

  // ---------------------------------------------------------------- actions --
  const swapDirection = useCallback(() => {
    const next: Direction = isXmlSource ? 'json-to-xml' : 'xml-to-json';
    // The result becomes the new source: that is the whole point of a swap.
    if (result.output && !manual) {
      if (next === 'json-to-xml') {
        setJsonText(result.output);
        jsonHistory.reset(result.output);
      } else {
        setXmlText(result.output);
        xmlHistory.reset(result.output);
      }
    }
    setDirection(next);
    markStale();
  }, [isXmlSource, result.output, manual, jsonHistory, xmlHistory, markStale]);

  const beautify = useCallback(
    (minify: boolean) => {
      const indent = isXmlSource ? xmlOptions.indent : jsonOptions.indent;
      const formatted = isXmlSource ? formatXml(source, indent, minify) : formatJson(source, indent, minify);
      if (!formatted.ok) {
        flash(t.error_format || 'Fix the errors first — the document cannot be re-formatted as it stands.');
        return;
      }
      setSource(formatted.text);
    },
    [isXmlSource, xmlOptions.indent, jsonOptions.indent, source, flash, t.error_format, setSource]
  );

  const doCopy = useCallback(
    async (text: string, message?: string) => {
      const ok = await copyText(text);
      if (!ok) {
        flash(t.error_copy || 'The clipboard is not available on this page.');
        return;
      }
      if (message) {
        flash(message);
        return;
      }
      clearTimeout(copyTimer.current);
      setCopied(true);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    },
    [flash, t.error_copy]
  );

  const download = useCallback(() => {
    if (!output) return;
    const asJson = isXmlSource;
    downloadText(output, asJson ? 'converted.json' : 'converted.xml', asJson ? 'application/json' : 'application/xml');
  }, [output, isXmlSource]);

  const resetWorkspace = useCallback(() => {
    setDirection('xml-to-json');
    setXmlText(SAMPLE_XML);
    setJsonText(SAMPLE_JSON);
    xmlHistory.reset(SAMPLE_XML);
    jsonHistory.reset(SAMPLE_JSON);
    setJsonOptions(DEFAULT_TO_JSON);
    setXmlOptions(DEFAULT_TO_XML);
    setManual(false);
    setManualText('');
    setParked(null);
    setXpathExpression('');
    setXpathResult(null);
    markStale();
  }, [xmlHistory, jsonHistory, markStale]);

  const startBlank = useCallback(() => {
    setSource('');
    setManual(true);
    setManualText('');
    flash(t.manual_started || 'Manual mode: write the output yourself, nothing is generated.');
  }, [setSource, flash, t.manual_started]);

  // ------------------------------------------------------------- shortcuts --
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key === 'Enter') {
        event.preventDefault();
        convert();
      } else if (meta && event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        beautify(false);
      } else if (meta && event.shiftKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        beautify(true);
      } else if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        swapDirection();
      } else if (meta && event.shiftKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        void doCopy(output);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [convert, beautify, swapDirection, doCopy, output]);

  // Holding Alt peeks at the source in the result pane, the same gesture as
  // press-and-hold on the compare button.
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setComparing(true);
    };
    const up = (event: KeyboardEvent) => {
      if (event.key === 'Alt') setComparing(false);
    };
    const blur = () => setComparing(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  // ------------------------------------------------------------- derived ---
  const treeValue = useMemo(() => {
    if (resultTab !== 'tree' || !output) return undefined;
    if (isXmlSource) {
      const parsed = parseJsonWithPosition(output);
      return parsed.issue ? undefined : parsed.value;
    }
    const doc = parseXml(output);
    return projectDocument(doc, { ...DEFAULT_TO_JSON, arrays: 'smart' }).value;
  }, [resultTab, output, isXmlSource]);

  const xmlForXPath = isXmlSource ? source : output;

  const runQuery = useCallback(() => {
    setXpathResult(runXPath(xmlForXPath, xpathExpression));
  }, [xmlForXPath, xpathExpression]);

  const issues: ParseIssue[] = result.issues;
  const errorCount = issues.filter(i => i.level === 'error').length;
  const warningCount = issues.length - errorCount;

  const sizeDelta =
    result.stats.inputBytes > 0
      ? Math.round(((result.stats.outputBytes - result.stats.inputBytes) / result.stats.inputBytes) * 100)
      : 0;

  const getResultFile = useCallback(async () => {
    if (!output) return null;
    const asJson = isXmlSource;
    return {
      blob: new Blob([output], { type: asJson ? 'application/json' : 'application/xml' }),
      name: asJson ? 'converted.json' : 'converted.xml',
    };
  }, [output, isXmlSource]);

  const steps = [
    { title: t.step1Title || 'Drop it in', text: t.step1Text || '' },
    { title: t.step2Title || 'Set the shape', text: t.step2Text || '' },
    { title: t.step3Title || 'Convert', text: t.step3Text || '' },
    { title: t.step4Title || 'Take it with you', text: t.step4Text || '' },
  ];

  const featureIcons = [IconAst, IconPointer, IconOptions, IconRoundTrip, IconXPath, IconWorker, IconLocal, IconHandoff];
  const features: { title: string; text: string }[] = Array.isArray(t.features) ? t.features : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const keywords: string[] = Array.isArray(t.seoKeywords) ? t.seoKeywords : [];

  const inputLabel = isXmlSource ? 'XML' : 'JSON';
  const outputLabel = isXmlSource ? 'JSON' : 'XML';

  const tabButton = (key: ResultTab, text: string, badge?: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setResultTab(key)}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider outline-none transition-all ${
        resultTab === key ? 'bg-teal-500/15 text-teal-300' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
      }`}
    >
      {text}
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full bg-red-500/20 px-1.5 text-[10px] text-red-300">{badge}</span>
      )}
    </button>
  );

  const iconButton =
    'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 outline-none transition-all hover:border-teal-500/30 hover:bg-teal-500/15 hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div className="flex min-h-screen flex-col bg-[#020a08] font-sans text-slate-200 selection:bg-teal-500/25 selection:text-teal-50">
      <Header
        onReset={resetWorkspace} currentLang={lang} onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/xml-json`)} t={t} />

      {/* The max width lives on <main> on purpose: AdRail measures this element
          against the viewport edge to decide whether the fixed side rails fit.
          The previous max-w-6xl left 124px at 1400px, under the 168px a rail
          needs, so the rails never rendered at any width at all. */}
      <main className="w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] flex-1 px-4 pb-20 pt-28 md:px-8 md:pt-36">
        <AdBanner id="adsense-xml-json-top" />

        {/* ================================================================ */}
        {/* Hero                                                             */}
        {/* ================================================================ */}
        <section className="mb-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="min-w-0 space-y-5">
            <span className="inline-block rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
              {t.hero_badge || 'Converter'}
            </span>
            <h1 className="text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.seoHeroTitle || 'XML ⇄ JSON'}
            </h1>
            <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">
              {t.hero_text || t.seoHeroText}
            </p>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(t.seoHeroList) ? t.seoHeroList : []).map((point: string, i: number) => (
                <span
                  key={i}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[12px] font-bold text-slate-300"
                >
                  <Check className="h-3.5 w-3.5 stroke-[3] text-teal-400" />
                  {point}
                </span>
              ))}
            </div>
          </div>
          <XmlHeroArt className="mx-auto h-auto w-full max-w-lg" animated={!reduceMotion} />
        </section>

        {/* ================================================================ */}
        {/* Workspace                                                        */}
        {/* ================================================================ */}
        <section className="glass-card overflow-hidden rounded-3xl border border-white/5">
          {/* Direction + top controls */}
          <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-3 py-3 md:px-4">
            <div className="flex rounded-xl bg-black/30 p-1">
              {(['xml-to-json', 'json-to-xml'] as Direction[]).map(key => {
                const active = direction === key;
                const Icon = key === 'xml-to-json' ? FileCode : Braces;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setDirection(key);
                      markStale();
                    }}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-black outline-none transition-all md:text-sm ${
                      active ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {key === 'xml-to-json' ? t.label_xml_to_json || 'XML → JSON' : t.label_json_to_xml || 'JSON → XML'}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={swapDirection}
              title={`${t.tooltip_swap || 'Swap direction'} (Alt+S)`}
              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-400 outline-none transition-all hover:border-teal-500/30 hover:text-teal-300"
            >
              <ArrowLeftRight className="h-4 w-4" />
              <span className="hidden sm:inline">{t.button_swap || 'Swap'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOptions(v => !v)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold outline-none transition-all ${
                showOptions
                  ? 'border-teal-500/30 bg-teal-500/15 text-teal-300'
                  : 'border-white/5 bg-white/5 text-slate-400 hover:text-teal-300'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t.button_options || 'Options'}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setManual(v => !v);
                  if (!manual && !manualText) setManualText(result.output);
                }}
                title={t.manual_hint || 'Edit the output by hand; nothing overwrites it'}
                className={`flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold outline-none transition-all ${
                  manual
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                    : 'border-white/5 bg-white/5 text-slate-400 hover:text-amber-300'
                }`}
              >
                <Hand className="h-4 w-4" />
                <span className="hidden sm:inline">{t.button_manual || 'Manual'}</span>
              </button>
              <button
                type="button"
                onClick={startBlank}
                title={t.button_blank_hint || 'Empty document, no conversion at all'}
                className={iconButton}
              >
                <FilePlus2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={resetWorkspace} title={t.button_reset || 'Reset'} className={iconButton}>
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showOptions && (
            <div className="border-b border-white/5 bg-black/20 px-3 py-4 md:px-4">
              <OptionsPanel
                direction={direction}
                json={jsonOptions}
                xml={xmlOptions}
                onJson={patch => setJsonOptions(current => ({ ...current, ...patch }))}
                onXml={patch => setXmlOptions(current => ({ ...current, ...patch }))}
                t={t}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-bold text-slate-400">
                  <input
                    type="checkbox"
                    checked={roundTripOn}
                    onChange={e => setRoundTripOn(e.target.checked)}
                    className="h-3.5 w-3.5 accent-teal-500"
                  />
                  {t.opt_roundtrip || 'Measure round-trip fidelity'}
                </label>
                <span className="text-[11px] text-slate-600">{t.opt_roundtrip_hint || ''}</span>
              </div>
            </div>
          )}

          {/* Parked file: uploading does not start the conversion */}
          {parked && (
            <div className="flex flex-wrap items-center gap-3 border-b border-white/5 bg-teal-500/[0.06] px-3 py-3 md:px-4">
              <FolderOpen className="h-5 w-5 shrink-0 text-teal-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{parked.name}</div>
                <div className="text-[11px] text-slate-400">
                  {formatBytes(parked.bytes)} ·{' '}
                  {parked.direction === 'xml-to-json' ? t.label_xml_to_json || 'XML → JSON' : t.label_json_to_xml || 'JSON → XML'}{' '}
                  · {t.parked_hint || 'waiting — nothing has been converted yet'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => loadParked(false)}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 outline-none transition-all hover:border-white/20"
              >
                {t.parked_load || 'Load into the editor'}
              </button>
              <button
                type="button"
                onClick={() => loadParked(true)}
                className="cursor-pointer rounded-xl border border-teal-500/40 bg-teal-500/20 px-3 py-2 text-[11px] font-black text-teal-200 outline-none transition-all hover:bg-teal-500/30"
              >
                {t.parked_convert || 'Load and convert'}
              </button>
              <button type="button" onClick={() => setParked(null)} className={iconButton} title={t.button_clear || 'Clear'}>
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Panes */}
          <div className="grid grid-cols-1 gap-px bg-white/5 lg:grid-cols-2">
            {/* -------------------------------- source ------------------- */}
            <div className="flex min-h-[520px] flex-col gap-3 bg-[#020a08] p-3 md:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-400">
                  {isXmlSource ? <FileCode className="h-3.5 w-3.5" /> : <Braces className="h-3.5 w-3.5" />}
                  {t.label_input || 'Input'} ({inputLabel})
                </span>

                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                  <select
                    value=""
                    onChange={e => {
                      const sample = SAMPLES.find(s => s.id === e.target.value);
                      if (!sample) return;
                      setDirection(sample.direction);
                      if (sample.direction === 'xml-to-json') {
                        setXmlText(sample.body);
                        xmlHistory.reset(sample.body);
                      } else {
                        setJsonText(sample.body);
                        jsonHistory.reset(sample.body);
                      }
                      markStale();
                    }}
                    className="h-8 cursor-pointer rounded-lg border border-white/5 bg-white/5 px-2 text-[11px] font-bold text-slate-300 outline-none"
                    aria-label={t.button_samples || 'Samples'}
                  >
                    <option value="">{t.button_samples || 'Samples'}</option>
                    {SAMPLES.map(sample => (
                      <option key={sample.id} value={sample.id}>
                        {t[sample.key] || sample.id}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className={iconButton} title={t.button_open || 'Open a file'}>
                    <FolderOpen className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => beautify(false)} className={iconButton} title={`${t.button_beautify || 'Beautify'} (Ctrl+Shift+B)`}>
                    <Wand2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => beautify(true)} className={iconButton} title={`${t.button_minify || 'Minify'} (Ctrl+Shift+M)`}>
                    <Minimize2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const previous = history.undo();
                      if (previous !== null) setSource(previous, { silent: true });
                    }}
                    disabled={!history.canUndo}
                    className={iconButton}
                    title={`${t.button_undo || 'Undo'} (Ctrl+Z)`}
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = history.redo();
                      if (next !== null) setSource(next, { silent: true });
                    }}
                    disabled={!history.canRedo}
                    className={iconButton}
                    title={`${t.button_redo || 'Redo'} (Ctrl+Shift+Z)`}
                  >
                    <Redo2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setFontSize(s => Math.max(10, s - 1))} className={iconButton} title={t.button_zoom_out || 'Smaller text'}>
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setFontSize(s => Math.min(22, s + 1))} className={iconButton} title={t.button_zoom_in || 'Larger text'}>
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setSource('')} className={iconButton} title={t.button_clear || 'Clear'}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
                onChange={e => {
                  openFiles(e.target.files);
                  e.target.value = '';
                }}
              />

              <Editor
                value={source}
                onChange={setSource}
                placeholder={
                  isXmlSource
                    ? '<?xml version="1.0"?>\n<root>\n  <item>value</item>\n</root>'
                    : '{\n  "root": {\n    "item": "value"\n  }\n}'
                }
                issues={result.issues}
                fontSize={fontSize}
                gotoLine={gotoLine}
                onDropFiles={openFiles}
                label={`${t.label_input || 'Input'} ${inputLabel}`}
                onUndo={() => {
                  const previous = history.undo();
                  if (previous !== null) setSource(previous, { silent: true });
                }}
                onRedo={() => {
                  const next = history.redo();
                  if (next !== null) setSource(next, { silent: true });
                }}
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={convert}
                  disabled={running}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-500/20 px-4 py-3 text-sm font-black text-teal-100 outline-none transition-all hover:bg-teal-500/30 disabled:cursor-wait disabled:opacity-60"
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  {t.button_convert || 'Convert'}
                  <span className="hidden text-[10px] font-bold opacity-60 sm:inline">Ctrl+↵</span>
                </button>
                {stale && !running && (
                  <span className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t.status_stale || 'Not converted yet'}
                  </span>
                )}
              </div>
            </div>

            {/* -------------------------------- result ------------------- */}
            <div className="flex min-h-[520px] flex-col gap-3 bg-[#020a08] p-3 md:p-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {tabButton('output', `${t.label_output || 'Output'} · ${outputLabel}`)}
                  {tabButton('tree', t.tab_tree || 'Tree')}
                  {tabButton('xpath', t.tab_xpath || 'XPath')}
                  {tabButton('issues', t.tab_issues || 'Issues', issues.length)}
                </div>

                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onPointerDown={() => setComparing(true)}
                    onPointerUp={() => setComparing(false)}
                    onPointerLeave={() => setComparing(false)}
                    title={t.button_compare || 'Hold to see the source (or hold Alt)'}
                    className={`${iconButton} ${comparing ? 'border-teal-500/40 bg-teal-500/20 text-teal-300' : ''}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void doCopy(output)}
                    disabled={!output}
                    className={`${iconButton} ${copied ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-400' : ''}`}
                    title={`${t.tooltip_copy || 'Copy'} (Ctrl+Shift+C)`}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={download} disabled={!output} className={iconButton} title={t.button_download || 'Download'}>
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#01100d]">
                {comparing ? (
                  <pre
                    className="h-full overflow-auto p-3 font-mono text-teal-200/80"
                    style={{ fontSize: `${fontSize}px`, lineHeight: 1.55 }}
                  >
                    {source || '—'}
                  </pre>
                ) : resultTab === 'output' ? (
                  manual ? (
                    <textarea
                      value={manualText}
                      onChange={e => setManualText(e.target.value)}
                      spellCheck={false}
                      wrap="off"
                      aria-label={`${t.label_output || 'Output'} ${outputLabel}`}
                      className="h-full w-full resize-none bg-transparent p-3 font-mono text-white caret-amber-400 outline-none"
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.55 }}
                    />
                  ) : (
                    <pre
                      className="h-full overflow-auto p-3 font-mono text-white"
                      style={{ fontSize: `${fontSize}px`, lineHeight: 1.55 }}
                    >
                      {result.output || <span className="text-slate-600">{t.empty_output || 'Press Convert.'}</span>}
                    </pre>
                  )
                ) : resultTab === 'tree' ? (
                  <TreeView
                    value={treeValue}
                    emptyLabel={t.tree_empty || 'Convert first, then explore the result here.'}
                    truncatedLabel={t.tree_capped || 'Only the first 4000 rows are drawn.'}
                    copyLabel={t.copy_path || 'Copy path'}
                    onCopyPath={path => void doCopy(path, t.toast_path_copied || 'Path copied.')}
                  />
                ) : resultTab === 'xpath' ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex flex-wrap gap-2 border-b border-white/5 p-3">
                      <input
                        value={xpathExpression}
                        onChange={e => setXpathExpression(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') runQuery();
                        }}
                        placeholder="//book[@category='fiction']/title"
                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-white outline-none focus:border-teal-500/50"
                      />
                      <button
                        type="button"
                        onClick={runQuery}
                        className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/15 px-3 py-2 text-[11px] font-black text-teal-200 outline-none transition-all hover:bg-teal-500/25"
                      >
                        <Search className="h-3.5 w-3.5" />
                        {t.xpath_run || 'Run'}
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs">
                      {!xpathResult ? (
                        <p className="text-slate-600">{t.xpath_hint || 'XPath 1.0, evaluated by the browser itself.'}</p>
                      ) : xpathResult.error ? (
                        <p className="text-red-400">{t.xpath_error || 'That expression could not be evaluated.'}</p>
                      ) : xpathResult.scalar !== null ? (
                        <p className="text-amber-300">{xpathResult.scalar}</p>
                      ) : xpathResult.matches.length === 0 ? (
                        <p className="text-slate-500">{t.xpath_none || 'No matches.'}</p>
                      ) : (
                        <>
                          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                            {((xpathResult.total === 1 && t.xpath_matches_one) || t.xpath_matches || '{n} matches').replace('{n}', String(xpathResult.total))}
                          </p>
                          {xpathResult.matches.map((match, i) => (
                            <div key={i} className="border-b border-white/5 py-1.5">
                              <div className="text-teal-300">{match.path}</div>
                              <div className="truncate text-slate-400">{match.value}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto p-2">
                    {issues.length === 0 ? (
                      <p className="p-3 text-sm text-slate-500">{t.issues_none || 'Nothing to report.'}</p>
                    ) : (
                      issues.map((issue, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setGotoLine({ line: issue.pos.line, col: issue.pos.col, nonce: Date.now() })}
                          className="flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-white/5"
                        >
                          <span
                            className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-black ${
                              issue.level === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {issue.pos.line}:{issue.pos.col}
                          </span>
                          <span className="min-w-0 text-xs text-slate-300">
                            {t[`issue_${issue.code}`] || ISSUE_FALLBACK[issue.code] || issue.code}
                            {issue.detail && <span className="ml-1.5 font-mono text-slate-500">{issue.detail}</span>}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: t.stat_elements || 'Elements', value: String(result.stats.elements) },
                  { label: t.stat_attributes || 'Attributes', value: String(result.stats.attributes) },
                  { label: t.stat_depth || 'Depth', value: String(result.stats.depth) },
                  {
                    label: t.stat_size || 'Size',
                    value: result.stats.outputBytes ? formatBytes(result.stats.outputBytes) : '—',
                    hint: result.stats.inputBytes
                      ? `${formatBytes(result.stats.inputBytes)} → ${sizeDelta >= 0 ? '+' : ''}${sizeDelta}%`
                      : '',
                  },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl border border-white/5 bg-black/30 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{stat.label}</div>
                    <div className="font-mono text-base font-extrabold tabular-nums text-teal-400">{stat.value}</div>
                    {'hint' in stat && stat.hint && <div className="text-[10px] text-slate-600">{stat.hint}</div>}
                  </div>
                ))}
              </div>

              {/* Round-trip fidelity */}
              {result.roundTrip && (
                <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {t.stat_fidelity || 'Round-trip fidelity'}
                    </span>
                    <span
                      className={`ml-auto font-mono text-sm font-black tabular-nums ${
                        result.roundTrip.score === 100
                          ? 'text-emerald-400'
                          : result.roundTrip.score >= 90
                            ? 'text-amber-400'
                            : 'text-red-400'
                      }`}
                    >
                      {result.roundTrip.score}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${
                        result.roundTrip.score === 100 ? 'bg-emerald-500' : result.roundTrip.score >= 90 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.roundTrip.score}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                    {result.roundTrip.losses.length === 0
                      ? t.fidelity_perfect || 'Converting back reproduces every node of the original.'
                      : result.roundTrip.losses
                          .map(loss => `${t[`loss_${loss.code}`] || loss.code}: ${loss.before} → ${loss.after}`)
                          .join(' · ')}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-600">
                <span>
                  {result.stats.ms} ms
                  {result.stats.offThread && (
                    <span className="ml-1.5 rounded bg-teal-500/10 px-1.5 py-0.5 text-teal-400">{t.stat_offthread || 'worker'}</span>
                  )}
                </span>
                {errorCount > 0 && <span className="text-red-400">{errorCount} × error</span>}
                {warningCount > 0 && <span className="text-amber-400">{warningCount} × warning</span>}
                <span className="ml-auto flex items-center gap-1">
                  <Keyboard className="h-3 w-3" />
                  Ctrl+↵ · Alt+S · Ctrl+Shift+B
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 p-3 md:p-4">
            <NextStepBar lang={lang} t={t} getResult={getResultFile} disabled={!output} />
          </div>
        </section>

        {toast && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-teal-500/20 bg-teal-500/10 px-4 py-3 text-sm font-bold text-teal-200">
            <Sparkles className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}

        <div className="mt-10">
          <AdBanner id="adsense-xml-json-mid" />
        </div>

        {/* ================================================================ */}
        {/* How it works                                                     */}
        {/* ================================================================ */}
        <section className="mt-20 space-y-10">
          <div className="space-y-3 text-center">
            <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.howItWorksTitle || 'How it works'}</h2>
            <div className="mx-auto h-1 w-16 rounded-full bg-teal-500" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => {
              const Art = STEP_ART[i];
              return (
                <div
                  key={i}
                  className="glass-card group relative space-y-4 rounded-3xl border border-white/5 p-6 transition-all hover:border-teal-500/20"
                >
                  <span className="absolute right-6 top-5 text-5xl font-black text-white/5 transition-colors group-hover:text-teal-500/10">
                    {i + 1}
                  </span>
                  <Art className="h-auto w-24 text-teal-400" />
                  <h3 className="text-base font-bold leading-snug text-white">{step.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{step.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================ */}
        {/* Features                                                         */}
        {/* ================================================================ */}
        {features.length > 0 && (
          <section className="mt-20 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => {
              const Icon = featureIcons[i % featureIcons.length];
              return (
                <div
                  key={i}
                  className="glass-card group rounded-3xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-400 transition-all group-hover:border-teal-500/40">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-base font-bold text-white transition-colors group-hover:text-teal-400">{feature.title}</h3>
                  <p className="text-[13px] font-medium leading-relaxed text-slate-500">{feature.text}</p>
                </div>
              );
            })}
          </section>
        )}

        {/* ================================================================ */}
        {/* SEO content                                                      */}
        {/* ================================================================ */}
        <section className="mt-24 space-y-20">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="min-w-0 space-y-6">
              {keywords[0] && (
                <span className="inline-block rounded-lg border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
                  {keywords[0]}
                </span>
              )}
              <h2 className="text-2xl font-black leading-[1.1] tracking-tight text-white md:text-4xl">{t.seoSecondaryTitle}</h2>
              <p className="text-base font-medium leading-relaxed text-slate-400 md:text-lg">{t.seoHeroText}</p>
            </div>
            <div className="glass-card relative flex min-h-[320px] flex-col items-center justify-center gap-6 overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-center md:p-10">
              <span className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal-500/10 blur-3xl" />
              <IconLocal className="relative h-16 w-16 text-teal-400" />
              <div className="relative max-w-sm space-y-3">
                <h3 className="text-xl font-black leading-tight tracking-tight text-white md:text-2xl">{t.seoBrowserSpeedTitle}</h3>
                <p className="text-sm font-medium leading-relaxed text-slate-400">{t.seoBrowserSpeedText}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-white/5 bg-[#04140f] p-7 md:p-12">
            <div className="max-w-4xl space-y-4">
              <h2 className="text-xl font-black leading-tight text-white md:text-3xl">{t.seoUseCaseTitle}</h2>
              <div className="h-1.5 w-20 rounded-full bg-teal-500" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoUseCaseTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoUseCaseText}</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-white opacity-40">
                  <span className="h-px w-6 bg-white/20" />
                  {t.seoPrivacyTitle}
                </div>
                <p className="text-[15px] font-medium leading-relaxed text-slate-400">{t.seoPrivacyText}</p>
              </div>
            </div>
          </div>

          {faqs.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-8">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-black tracking-tight text-white md:text-4xl">{t.faqTitle || 'FAQ'}</h2>
                <div className="mx-auto h-1 w-16 rounded-full bg-teal-500" />
              </div>
              <div className="grid gap-3">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="glass-card group rounded-2xl border border-white/5 px-5 py-5 text-left transition-colors hover:border-teal-500/20 sm:px-6 [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 text-[15px] font-bold text-white transition-colors group-hover:text-teal-400">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-[11px] font-black text-teal-400">
                        Q
                      </span>
                      <span className="min-w-0 flex-1">{faq.question}</span>
                      <span className="shrink-0 text-xl leading-none text-teal-400 transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="pl-9 pt-3 text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          )}

          {keywords.length > 0 && (
            <div className="mx-auto w-full max-w-4xl space-y-5 text-center opacity-55">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.seoKeywordsTitle || 'Related searches'}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {keywords.map((keyword, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-slate-400">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-16">
          <AdBanner id="adsense-xml-json-bottom" />
        </div>
      </main>

      <Footer lang={lang} t={t} onOpenModal={setLegalModal} />

      {(['privacy', 'terms', 'cookies'] as LegalKey[]).map(key => (
        <LegalModal
          key={key}
          isOpen={legalModal === key}
          onClose={() => setLegalModal(null)}
          title={legalTranslations[lang]?.[key].title || key}
          content={legalTranslations[lang]?.[key].content}
          t={t}
        />
      ))}
    </div>
  );
}
