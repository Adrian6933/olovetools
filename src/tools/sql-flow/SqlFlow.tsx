import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Braces,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileUp,
  Info,
  Layers,
  Minimize2,
  Play,
  Redo2,
  RotateCcw,
  Sparkles,
  Table2,
  Undo2,
  Wand2,
  XCircle,
  Zap,
} from 'lucide-react';
import type { FormatOptionsWithLanguage, SqlLanguage } from 'sql-formatter';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { NextStepBar } from './components/NextStepBar';
import { SqlEditor, type EditorFocus } from './components/SqlEditor';
import { FEATURE_ART, SqlHeroArt, STEP_ART } from './components/Illustrations';
import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { analyze, type Analysis, type Issue, type Severity } from './lib/analyze';
import { DIALECTS, detectDialect, paramTypesFor } from './lib/dialects';
import { SAMPLES } from './lib/samples';
import { fillParams, toggleComment } from './lib/transform';
import { useFormatter, type FormatResult } from './lib/useFormatter';
import { useHistory } from './lib/useHistory';

interface SqlFlowProps {
  lang: string;
  dictionary: any;
}

/** Un fichero de texto por encima de esto no cabe cómodamente en un textarea. */
const MAX_FILE_BYTES = 8 * 1024 * 1024;
/** Con el formateo automático encendido, sólo se dispara por debajo de esto. */
const AUTO_LIMIT = 60_000;

interface Options {
  dialect: SqlLanguage;
  keywordCase: 'preserve' | 'upper' | 'lower';
  identifierCase: 'preserve' | 'upper' | 'lower';
  dataTypeCase: 'preserve' | 'upper' | 'lower';
  functionCase: 'preserve' | 'upper' | 'lower';
  indentStyle: 'standard' | 'tabularLeft' | 'tabularRight';
  tabWidth: number;
  useTabs: boolean;
  expressionWidth: number;
  linesBetweenQueries: number;
  denseOperators: boolean;
  newlineBeforeSemicolon: boolean;
  logicalOperatorNewline: 'before' | 'after';
}

const DEFAULT_OPTIONS: Options = {
  dialect: 'sql',
  keywordCase: 'upper',
  identifierCase: 'preserve',
  dataTypeCase: 'upper',
  functionCase: 'preserve',
  indentStyle: 'standard',
  tabWidth: 2,
  useTabs: false,
  expressionWidth: 50,
  linesBetweenQueries: 1,
  denseOperators: false,
  newlineBeforeSemicolon: false,
  logicalOperatorNewline: 'before',
};

interface PendingFile {
  name: string;
  size: number;
  text: string;
}

const SEVERITY_STYLE: Record<Severity, { chip: string; icon: React.ReactNode }> = {
  error: {
    chip: 'bg-rose-500/12 text-rose-200 border-rose-500/35',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
  warning: {
    chip: 'bg-amber-500/12 text-amber-100 border-amber-500/35',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
  },
  info: {
    chip: 'bg-sky-500/10 text-sky-100 border-sky-500/30',
    icon: <Info className="w-3.5 h-3.5 text-sky-400" />,
  },
};

/** Rellena los `{0}` del diccionario. */
function fmt(template: string, args?: string[]): string {
  if (!args || !args.length) return template;
  return template.replace(/\{(\d+)\}/g, (match, index) => args[Number(index)] ?? match);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SqlFlow({ lang, dictionary }: SqlFlowProps) {
  const t = dictionary || {};
  const tx = useCallback(
    (key: string, fallback: string, args?: string[]) => fmt(t[key] || fallback, args),
    [t]
  );

  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const history = useHistory('');
  const input = history.text;
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [auto, setAuto] = useState(false);
  const [stripComments, setStripComments] = useState(true);
  const [result, setResult] = useState<FormatResult | null>(null);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [comparing, setComparing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [focus, setFocus] = useState<EditorFocus | null>(null);
  const [detected, setDetected] = useState<SqlLanguage | null>(null);
  const [dragging, setDragging] = useState(false);
  const [liveAnalysis, setLiveAnalysis] = useState<Analysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const analysisTimer = useRef<number | undefined>(undefined);
  const { run, busy } = useFormatter();

  const engineOptions = useMemo<FormatOptionsWithLanguage>(
    () => ({
      language: options.dialect,
      keywordCase: options.keywordCase,
      identifierCase: options.identifierCase,
      dataTypeCase: options.dataTypeCase,
      functionCase: options.functionCase,
      indentStyle: options.indentStyle,
      tabWidth: options.tabWidth,
      useTabs: options.useTabs,
      expressionWidth: options.expressionWidth,
      linesBetweenQueries: options.linesBetweenQueries,
      denseOperators: options.denseOperators,
      newlineBeforeSemicolon: options.newlineBeforeSemicolon,
      logicalOperatorNewline: options.logicalOperatorNewline,
      paramTypes: paramTypesFor(options.dialect),
    }),
    [options]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // --- análisis en vivo ----------------------------------------------------
  // Es barato (un recorrido de tokens) y no toca el motor de formateo, así que
  // sí puede ir con el tecleo: es lo que alimenta el panel de avisos mientras
  // se escribe. El formateo, en cambio, no se dispara solo salvo que el usuario
  // encienda el modo automático.
  useEffect(() => {
    window.clearTimeout(analysisTimer.current);
    if (!input.trim()) {
      setLiveAnalysis(null);
      return;
    }
    analysisTimer.current = window.setTimeout(() => {
      setLiveAnalysis(analyze(input));
    }, 160);
    return () => window.clearTimeout(analysisTimer.current);
  }, [input]);

  useEffect(() => () => {
    window.clearTimeout(toastTimer.current);
    window.clearTimeout(analysisTimer.current);
  }, []);

  const runEngine = useCallback(
    async (mode: 'format' | 'minify', text = input) => {
      if (!text.trim()) return;
      const next = await run(text, mode, engineOptions, stripComments);
      setResult(next);
      if (!next.ok) showToast(tx('toast_engineError', 'The engine could not parse this query.'));
    },
    [engineOptions, input, run, showToast, stripComments, tx]
  );

  // --- formateo automático (apagado por defecto) ---------------------------
  useEffect(() => {
    if (!auto || !input.trim() || input.length > AUTO_LIMIT) return;
    const id = window.setTimeout(() => {
      void runEngine('format');
    }, 400);
    return () => window.clearTimeout(id);
    // `runEngine` cambia con cada opción: es justo lo que queremos, reformatea.
  }, [auto, input, runEngine]);

  // --- detección de dialecto ----------------------------------------------
  useEffect(() => {
    const guess = detectDialect(input);
    setDetected(guess ? guess.dialect : null);
  }, [input]);

  // --- entrada de ficheros -------------------------------------------------
  // Nada se formatea al soltar un archivo: queda en espera y el usuario decide.
  const acceptFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        showToast(tx('toast_fileTooLarge', 'That file is too large ({0} max).', [formatBytes(MAX_FILE_BYTES)]));
        return;
      }
      try {
        const text = await file.text();
        setPendingFile({ name: file.name, size: file.size, text });
      } catch {
        showToast(tx('toast_fileFailed', 'That file could not be read.'));
      }
    },
    [showToast, tx]
  );

  useHandoffIntake(file => void acceptFile(file));

  const loadPending = useCallback(() => {
    if (!pendingFile) return;
    history.setText(pendingFile.text, { checkpoint: true });
    setResult(null);
    setPendingFile(null);
  }, [history, pendingFile]);

  const loadSample = useCallback(
    (id: string) => {
      const sample = SAMPLES.find(s => s.id === id);
      if (!sample) return;
      history.setText(sample.sql, { checkpoint: true });
      setOptions(o => ({ ...o, dialect: sample.dialect }));
      setResult(null);
      setPendingFile(null);
    },
    [history]
  );

  const resetWorkspace = useCallback(() => {
    history.reset('');
    setOptions(DEFAULT_OPTIONS);
    setResult(null);
    setPendingFile(null);
    setParamValues({});
    setLiveAnalysis(null);
    setCopied(false);
  }, [history]);

  const output = result?.output ?? '';
  const analysis = liveAnalysis;
  const issues: Issue[] = analysis?.issues ?? [];
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const params = analysis?.params ?? [];

  const finalOutput = useMemo(() => {
    if (!output) return '';
    const filled = Object.keys(paramValues).filter(key => paramValues[key]);
    return filled.length ? fillParams(output, paramValues) : output;
  }, [output, paramValues]);

  const handleCopy = useCallback(async () => {
    if (!finalOutput) return;
    try {
      await navigator.clipboard.writeText(finalOutput);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(tx('toast_copyFailed', 'The browser refused clipboard access.'));
    }
  }, [finalOutput, showToast, tx]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;
      history.setText(text, { checkpoint: true });
      setResult(null);
    } catch {
      showToast(tx('toast_pasteFailed', 'The browser refused clipboard access.'));
    }
  }, [history, showToast, tx]);

  const handleDownload = useCallback(() => {
    if (!finalOutput) return;
    const url = URL.createObjectURL(new Blob([finalOutput], { type: 'application/sql' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'query.sql';
    link.click();
    // Revocar en el mismo tick cancela la descarga en Firefox; un tick después
    // ya se ha iniciado y el objeto deja de ocupar memoria.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [finalOutput]);

  const getResult = useCallback(async () => {
    const text = finalOutput || input;
    if (!text.trim()) return null;
    return { blob: new Blob([text], { type: 'application/sql' }), name: 'query.sql' };
  }, [finalOutput, input]);

  const jumpTo = useCallback((issue: Issue) => {
    setFocus(current => ({ offset: issue.offset, line: issue.line, nonce: (current?.nonce ?? 0) + 1 }));
  }, []);

  const jumpToStatement = useCallback((offset: number, line: number) => {
    setFocus(current => ({ offset, line, nonce: (current?.nonce ?? 0) + 1 }));
  }, []);

  // --- atajos --------------------------------------------------------------
  const onEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key === 'Enter') {
        event.preventDefault();
        void runEngine('format');
        return;
      }
      if (meta && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        void runEngine('minify');
        return;
      }
      if (meta && event.key === '/') {
        event.preventDefault();
        const area = event.currentTarget;
        const next = toggleComment(area.value, area.selectionStart, area.selectionEnd);
        history.setText(next.text, { checkpoint: true });
        window.requestAnimationFrame(() => area.setSelectionRange(next.from, next.to));
        return;
      }
      if (meta && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        history.undo();
        return;
      }
      if (meta && (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey))) {
        event.preventDefault();
        history.redo();
        return;
      }
      if (event.key === 'Tab') {
        // Tab dentro del editor indenta; salir del campo se sigue haciendo con
        // Escape + Tab, que es lo que esperan los lectores de pantalla.
        event.preventDefault();
        const area = event.currentTarget;
        const pad = ' '.repeat(options.tabWidth);
        const next = area.value.slice(0, area.selectionStart) + pad + area.value.slice(area.selectionEnd);
        const at = area.selectionStart + pad.length;
        history.setText(next);
        window.requestAnimationFrame(() => area.setSelectionRange(at, at));
      }
    },
    [history, options.tabWidth, runEngine]
  );

  // Leer matchMedia durante el render rompería la hidratación: el servidor no
  // tiene media queries y devolvería siempre "no reducido", así que a quien
  // pide menos movimiento le llegaría un HTML distinto del que React genera en
  // el cliente. Se resuelve tras montar, cuando ya no hay HTML que casar.
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setPrefersReduced(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const stats = analysis?.counts;
  const hasText = input.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0802] text-stone-200 font-sans relative">
      <Header
        currentLang={lang}
        onLanguageChange={l => (window.location.href = `/${l.toLowerCase()}/sql-flow/`)}
        onReset={resetWorkspace}
        t={t}
      />

      {/* El ancho máximo vive en el propio <main>: AdRail mide el hueco entre
          este elemento y el borde del viewport, y con un <main> a max-w-7xl
          quedaban 60px por lado a 1400px — por debajo de los 168px que necesita
          un raíl, así que no se mostraban NUNCA. */}
      <main className="flex-1 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))] px-4 md:px-8 pt-28 md:pt-32 pb-16 space-y-6">
        <AdBanner id="adsense-sql-flow-top" />

        {/* ---------------------------------------------------------------- */}
        {/* Héroe                                                            */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center pb-4">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              {tx('hero_badge', 'SQL workbench')}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1]">
              {tx('seoHeroTitle', 'Format, check and understand any SQL query.')}
            </h2>
            <p className="text-stone-400 text-sm md:text-base leading-relaxed max-w-xl">
              {tx(
                'seoHeroText',
                'Nineteen dialects, a linter that points at the line, and a query outline — all inside this tab.'
              )}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => loadSample('report')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-[#1a1002] text-sm font-black hover:bg-amber-400 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {tx('load_sample', 'Load a sample')}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-900/40 bg-white/[0.03] text-sm font-bold text-stone-300 hover:text-white hover:border-amber-500/40 transition-colors cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-amber-400" />
                {tx('open_file', 'Open a .sql file')}
              </button>
            </div>
          </div>
          <SqlHeroArt className="w-full h-auto max-w-lg mx-auto" animated={!prefersReduced} />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Barra de opciones                                                */}
        {/* ---------------------------------------------------------------- */}
        <section className="rounded-2xl border border-amber-900/30 bg-black/40 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 p-4">
            <label className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">
                {tx('dialect', 'Dialect')}
              </span>
              <select
                value={options.dialect}
                onChange={e => setOptions(o => ({ ...o, dialect: e.target.value as SqlLanguage }))}
                className="bg-black/60 border border-amber-900/40 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-100 outline-none focus:border-amber-500/60 cursor-pointer"
              >
                {DIALECTS.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            {detected && detected !== options.dialect && (
              <button
                onClick={() => setOptions(o => ({ ...o, dialect: detected }))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sky-500/35 bg-sky-500/10 text-[11px] font-bold text-sky-200 hover:bg-sky-500/20 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {tx('dialect_detected', 'Looks like {0} — switch?', [
                  DIALECTS.find(d => d.id === detected)?.label || detected,
                ])}
              </button>
            )}

            <ToggleGroup
              label={tx('keywordCase', 'Keywords')}
              value={options.keywordCase}
              onChange={value => setOptions(o => ({ ...o, keywordCase: value as Options['keywordCase'] }))}
              items={[
                { value: 'upper', label: 'UPPER' },
                { value: 'lower', label: 'lower' },
                { value: 'preserve', label: tx('case_preserve', 'As is') },
              ]}
            />

            <ToggleGroup
              label={tx('indentWidth', 'Indent')}
              value={options.useTabs ? 'tab' : String(options.tabWidth)}
              onChange={value =>
                setOptions(o =>
                  value === 'tab'
                    ? { ...o, useTabs: true }
                    : { ...o, useTabs: false, tabWidth: Number(value) }
                )
              }
              items={[
                { value: '2', label: '2' },
                { value: '4', label: '4' },
                { value: '8', label: '8' },
                { value: 'tab', label: tx('indent_tabs', 'Tab') },
              ]}
            />

            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              {tx('advanced_options', 'More options')}
            </button>
          </div>

          {showAdvanced && (
            <div className="border-t border-amber-900/20 p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
              <ToggleGroup
                label={tx('identifierCase', 'Identifiers')}
                value={options.identifierCase}
                onChange={value => setOptions(o => ({ ...o, identifierCase: value as Options['identifierCase'] }))}
                items={[
                  { value: 'preserve', label: tx('case_preserve', 'As is') },
                  { value: 'upper', label: 'UPPER' },
                  { value: 'lower', label: 'lower' },
                ]}
              />
              <ToggleGroup
                label={tx('dataTypeCase', 'Data types')}
                value={options.dataTypeCase}
                onChange={value => setOptions(o => ({ ...o, dataTypeCase: value as Options['dataTypeCase'] }))}
                items={[
                  { value: 'upper', label: 'UPPER' },
                  { value: 'lower', label: 'lower' },
                  { value: 'preserve', label: tx('case_preserve', 'As is') },
                ]}
              />
              <ToggleGroup
                label={tx('functionCase', 'Functions')}
                value={options.functionCase}
                onChange={value => setOptions(o => ({ ...o, functionCase: value as Options['functionCase'] }))}
                items={[
                  { value: 'preserve', label: tx('case_preserve', 'As is') },
                  { value: 'upper', label: 'UPPER' },
                  { value: 'lower', label: 'lower' },
                ]}
              />
              <ToggleGroup
                label={tx('indentStyle', 'Layout')}
                value={options.indentStyle}
                onChange={value => setOptions(o => ({ ...o, indentStyle: value as Options['indentStyle'] }))}
                items={[
                  { value: 'standard', label: tx('indent_standard', 'Standard') },
                  { value: 'tabularLeft', label: tx('indent_tabularLeft', 'Column, left') },
                  { value: 'tabularRight', label: tx('indent_tabularRight', 'Column, right') },
                ]}
              />
              <ToggleGroup
                label={tx('logicalOperatorNewline', 'AND / OR')}
                value={options.logicalOperatorNewline}
                onChange={value =>
                  setOptions(o => ({ ...o, logicalOperatorNewline: value as Options['logicalOperatorNewline'] }))
                }
                items={[
                  { value: 'before', label: tx('operator_before', 'Line start') },
                  { value: 'after', label: tx('operator_after', 'Line end') },
                ]}
              />
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">
                  {tx('expressionWidth', 'Wrap expressions at')} · {options.expressionWidth}
                </span>
                <input
                  type="range"
                  min={20}
                  max={120}
                  step={5}
                  value={options.expressionWidth}
                  onChange={e => setOptions(o => ({ ...o, expressionWidth: Number(e.target.value) }))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </label>
              <Switch
                label={tx('denseOperators', 'Tight operators')}
                checked={options.denseOperators}
                onChange={value => setOptions(o => ({ ...o, denseOperators: value }))}
              />
              <Switch
                label={tx('newlineBeforeSemicolon', 'Semicolon on its own line')}
                checked={options.newlineBeforeSemicolon}
                onChange={value => setOptions(o => ({ ...o, newlineBeforeSemicolon: value }))}
              />
              <Switch
                label={tx('stripComments', 'Drop comments when minifying')}
                checked={stripComments}
                onChange={setStripComments}
              />
              <Switch
                label={tx('auto_format', 'Format as I type')}
                checked={auto}
                onChange={setAuto}
                hint={tx('auto_format_hint', 'Off by default: nothing runs until you press Format.')}
              />
            </div>
          )}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Fichero en espera                                                */}
        {/* ---------------------------------------------------------------- */}
        {pendingFile && (
          <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.06] p-4 flex flex-wrap items-center gap-3">
            <FileCode2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-amber-100 truncate">{pendingFile.name}</p>
              <p className="text-[11px] text-stone-400">
                {formatBytes(pendingFile.size)} · {tx('parked_hint', 'Waiting for you: nothing was loaded or formatted yet.')}
              </p>
            </div>
            <button
              onClick={loadPending}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-[#1a1002] text-xs font-black hover:bg-amber-400 transition-colors cursor-pointer"
            >
              {tx('parked_load', 'Load it')}
            </button>
            <button
              onClick={() => setPendingFile(null)}
              className="px-3 py-2 rounded-xl border border-amber-900/40 text-xs font-bold text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              {tx('discard', 'Discard')}
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Banco de trabajo                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Entrada */}
          <div
            className={`flex flex-col rounded-2xl border bg-black/40 overflow-hidden h-[58vh] min-h-[340px] lg:h-[560px] transition-colors ${
              dragging ? 'border-amber-500/70 bg-amber-500/[0.05]' : 'border-amber-900/30'
            }`}
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void acceptFile(file);
            }}
          >
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-amber-900/25 flex-wrap">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-400">
                  {tx('input', 'Your query')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <IconButton title={tx('undo', 'Undo')} onClick={history.undo} disabled={!history.canUndo}>
                  <Undo2 className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title={tx('redo', 'Redo')} onClick={history.redo} disabled={!history.canRedo}>
                  <Redo2 className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title={tx('paste', 'Paste')} onClick={handlePaste}>
                  <Clipboard className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title={tx('open_file', 'Open a .sql file')} onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title={tx('reset', 'Clear')} onClick={resetWorkspace} disabled={!hasText}>
                  <RotateCcw className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </div>

            <SqlEditor
              value={input}
              onChange={(next, opts) => {
                history.setText(next, opts);
              }}
              onKeyDown={onEditorKeyDown}
              placeholder={tx('placeholder', 'Paste a query, drop a .sql file, or load a sample…')}
              errorLine={issues.find(i => i.severity === 'error')?.line ?? null}
              focus={focus}
              ariaLabel={tx('input', 'Your query')}
            />

            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-amber-900/25 text-[10.5px] text-stone-500 font-mono flex-wrap">
              <span>
                {stats ? `${stats.lines} ${tx('lines', 'lines')} · ${stats.chars} ${tx('chars', 'chars')}` : '—'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.slice(0, 4).map(sample => (
                  <button
                    key={sample.id}
                    onClick={() => loadSample(sample.id)}
                    className="px-2 py-0.5 rounded-md border border-amber-900/30 hover:border-amber-500/50 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {tx(`sample_${sample.id}`, sample.id)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Salida */}
          <div className="flex flex-col rounded-2xl border border-amber-900/30 bg-black/40 overflow-hidden h-[58vh] min-h-[340px] lg:h-[560px]">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-amber-900/25 flex-wrap">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-400">
                  {comparing ? tx('output_original', 'Original') : tx('output', 'Result')}
                </span>
                {result && (
                  <span className="text-[10px] font-mono text-stone-500">
                    {result.ms} ms {result.offthread ? tx('offthread', '· worker') : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  title={tx('hold_compare', 'Hold to see the original')}
                  onPointerDown={() => setComparing(true)}
                  onPointerUp={() => setComparing(false)}
                  onPointerLeave={() => setComparing(false)}
                  disabled={!output}
                  active={comparing}
                >
                  <Eye className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title={tx('download', 'Download .sql')} onClick={handleDownload} disabled={!finalOutput}>
                  <Download className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title={tx('copy', 'Copy')} onClick={handleCopy} disabled={!finalOutput} active={copied}>
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </IconButton>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {finalOutput ? (
                <SqlEditor
                  value={comparing ? input : finalOutput}
                  onChange={() => undefined}
                  readOnly
                  ariaLabel={tx('output', 'Result')}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                  <Wand2 className="w-7 h-7 text-amber-500/40" />
                  <p className="text-sm text-stone-500 max-w-xs">
                    {tx('output_empty', 'Nothing runs on its own. Press Format when your query is ready.')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 border-t border-amber-900/25 flex-wrap">
              <button
                onClick={() => void runEngine('format')}
                disabled={!hasText || busy}
                className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-[#1a1002] text-sm font-black hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Wand2 className="w-4 h-4" />
                {busy ? tx('working', 'Working…') : tx('format_btn', 'Format')}
              </button>
              <button
                onClick={() => void runEngine('minify')}
                disabled={!hasText || busy}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-900/40 bg-white/[0.03] text-xs font-bold text-stone-300 hover:text-white hover:border-amber-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minimize2 className="w-4 h-4 text-amber-400" />
                {tx('minify_btn', 'Minify')}
              </button>
              <button
                onClick={() => {
                  if (!finalOutput) return;
                  history.setText(finalOutput, { checkpoint: true });
                  setResult(null);
                  showToast(tx('toast_movedBack', 'The result is now your query.'));
                }}
                disabled={!finalOutput}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-amber-900/40 bg-white/[0.03] text-xs font-bold text-stone-300 hover:text-white hover:border-amber-500/40 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={tx('use_as_input_hint', 'Send the result back to the editor to keep working on it')}
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                {tx('use_as_input', 'Edit it')}
              </button>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-stone-500">
          <span className="font-black uppercase tracking-[0.18em] text-stone-600">
            {tx('shortcuts', 'Shortcuts')}
          </span>
          {[
            ['Ctrl+Enter', tx('sc_format', 'Format')],
            ['Ctrl+M', tx('sc_minify', 'Minify')],
            ['Ctrl+/', tx('sc_comment', 'Comment the selection')],
            ['Ctrl+Z / Ctrl+Y', tx('sc_undo', 'Undo and redo')],
          ].map(([keys, label]) => (
            <span key={keys} className="inline-flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-amber-900/40 bg-white/[0.03] font-mono text-[10px] text-amber-200/80">
                {keys}
              </kbd>
              {label}
            </span>
          ))}
        </div>

        {result?.engineError && (
          <p className="text-[12px] text-rose-200/90 font-mono bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-3">
            {tx('engine_error_label', 'The engine refused this query')}: {result.engineError}
          </p>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Parámetros                                                       */}
        {/* ---------------------------------------------------------------- */}
        {params.length > 0 && (
          <section className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/[0.04] p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Braces className="w-4 h-4 text-fuchsia-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
                {tx('params_title', 'Placeholders')}
              </span>
              <span className="text-[11px] text-stone-500">
                {tx('params_hint', 'Fill these in to get a query you can run as-is. Leave them empty to keep them.')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {params.map(name => (
                <label key={name} className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-fuchsia-300">{name}</span>
                  <input
                    value={paramValues[name] || ''}
                    onChange={e => setParamValues(v => ({ ...v, [name]: e.target.value }))}
                    placeholder={tx('params_placeholder', 'value')}
                    className="bg-black/50 border border-fuchsia-500/25 rounded-lg px-2.5 py-1.5 text-xs font-mono text-stone-100 outline-none focus:border-fuchsia-400/60"
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Avisos + resumen                                                 */}
        {/* ---------------------------------------------------------------- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-amber-900/30 bg-black/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">
                  {tx('validation', 'Review')}
                </span>
              </div>
              {hasText && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    errorCount
                      ? SEVERITY_STYLE.error.chip
                      : warningCount
                        ? SEVERITY_STYLE.warning.chip
                        : 'bg-emerald-500/12 text-emerald-200 border-emerald-500/35'
                  }`}
                >
                  {errorCount
                    ? tx('status_errors', '{0} problems', [String(errorCount)])
                    : warningCount
                      ? tx('status_warnings', '{0} things to check', [String(warningCount)])
                      : tx('status_clean', 'Nothing to flag')}
                </span>
              )}
            </div>

            {!hasText ? (
              <p className="text-xs text-stone-500">{tx('status_empty', 'Nothing loaded yet.')}</p>
            ) : issues.length === 0 ? (
              <p className="text-xs text-stone-500">{tx('status_clean_hint', 'Parentheses, quotes and clauses all check out.')}</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-auto pr-1">
                {issues.map((issue, index) => (
                  <li key={`${issue.id}-${issue.offset}-${index}`}>
                    <button
                      onClick={() => jumpTo(issue)}
                      className="w-full text-left flex items-start gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer group"
                    >
                      <span className="mt-0.5 shrink-0">{SEVERITY_STYLE[issue.severity].icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-stone-200">
                          {tx(`issue_${issue.id}`, issue.id, issue.args)}
                        </span>
                        <span className="block text-[11px] text-stone-500 leading-snug">
                          {tx(`issueHint_${issue.id}`, '', issue.args)}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10.5px] font-mono text-stone-600 group-hover:text-amber-300">
                        {issue.line}:{issue.col}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-amber-900/30 bg-black/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">
                {tx('outline_title', 'What this query does')}
              </span>
            </div>

            {!analysis || !analysis.statements.length ? (
              <p className="text-xs text-stone-500">{tx('outline_empty', 'The breakdown shows up as soon as there is a statement.')}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Stat label={tx('stat_statements', 'Statements')} value={String(stats?.statements ?? 0)} />
                  <Stat label={tx('stat_tables', 'Tables')} value={String(analysis.tables.length)} />
                  <Stat label={tx('stat_joins', 'Joins')} value={String(stats?.joins ?? 0)} />
                  <Stat label={tx('stat_ctes', 'CTEs')} value={String(analysis.ctes.length)} />
                </div>
                <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                  {analysis.statements.map(statement => (
                    <li key={statement.index}>
                      <button
                        onClick={() => jumpToStatement(statement.start, statement.line)}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <span className="text-[10px] font-black text-amber-400 w-16 shrink-0">{statement.kind}</span>
                        <span className="text-xs font-mono text-stone-300 truncate flex-1 min-w-0">
                          {statement.subject || '—'}
                        </span>
                        <span className="text-[10px] font-mono text-stone-600 shrink-0">L{statement.line}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {analysis.tables.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-900/20">
                    {analysis.tables.map(name => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-amber-900/25 text-[11px] font-mono text-stone-300"
                      >
                        <Table2 className="w-3 h-3 text-amber-500/70" />
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <NextStepBar lang={lang} t={t} getResult={getResult} disabled={!hasText} />

        <AdBanner id="adsense-sql-flow-mid" />

        {/* ---------------------------------------------------------------- */}
        {/* Features                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="pt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {FEATURE_ART.map((Art, index) => (
            <div
              key={index}
              className="rounded-2xl border border-amber-900/25 bg-black/30 p-5 space-y-3 hover:border-amber-500/30 transition-colors"
            >
              <Art className="w-11 h-11" />
              <h3 className="text-sm font-black text-white">{tx(`feature${index + 1}Title`, '')}</h3>
              <p className="text-[12.5px] text-stone-400 leading-relaxed">
                {tx(`feature${index + 1}Text`, '')}
              </p>
            </div>
          ))}
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Cómo funciona                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section className="pt-16 space-y-8">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {tx('howItWorksTitle', 'How it works')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {STEP_ART.map((Art, index) => (
              <div key={index} className="rounded-2xl border border-amber-900/25 bg-black/30 p-5 space-y-3">
                <Art className="w-full h-auto max-w-[160px]" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-black text-white">{tx(`step${index + 1}Title`, '')}</h3>
                </div>
                <p className="text-[12.5px] text-stone-400 leading-relaxed">{tx(`step${index + 1}Text`, '')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Texto SEO + FAQ                                                  */}
        {/* ---------------------------------------------------------------- */}
        <section className="pt-16 space-y-10">
          {/* Texto propio: el pie de página ya publica los bloques
              seoBrowserSpeed / seoUseCase / seoPrivacy, y repetirlos aquí sería
              el mismo párrafo tres veces en la misma página. */}
          <div className="max-w-3xl space-y-4">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {tx('deepTitle', 'A formatter is only half the job')}
            </h2>
            <p className="text-[13px] text-stone-400 leading-relaxed">{tx('deepText1', '')}</p>
            <p className="text-[13px] text-stone-400 leading-relaxed">{tx('deepText2', '')}</p>
            <p className="text-[13px] text-stone-400 leading-relaxed">{tx('deepText3', '')}</p>
          </div>

          {Array.isArray(t.faq) && t.faq.length > 0 && (
            <div className="max-w-3xl space-y-3">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {tx('faqTitle', 'Frequently asked questions')}
              </h2>
              {t.faq.map((item: any, index: number) => (
                <details
                  key={index}
                  className="rounded-2xl border border-amber-900/25 bg-black/30 px-5 py-4 group [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between gap-3 cursor-pointer text-sm font-bold text-white">
                    {item.question}
                    <ChevronDown className="w-4 h-4 text-amber-400 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pt-3 text-[13px] text-stone-400 leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          )}
        </section>

        <AdBanner id="adsense-sql-flow-bottom" />
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept=".sql,.txt,text/plain,application/sql"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) void acceptFile(file);
          e.target.value = '';
        }}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[190] max-w-[90vw] px-4 py-3 rounded-2xl bg-[#160e02] border border-amber-500/30 text-amber-100 text-[12.5px] font-bold shadow-2xl"
        >
          {toast}
        </div>
      )}

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

// ---------------------------------------------------------------------------
// Piezas pequeñas de interfaz
// ---------------------------------------------------------------------------

const ToggleGroup: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}> = ({ label, value, onChange, items }) => (
  <div className="flex items-center gap-2 shrink-0">
    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400/80">{label}</span>
    <div className="inline-flex rounded-lg overflow-hidden border border-amber-900/40">
      {items.map((item, index) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
            index > 0 ? 'border-l border-amber-900/40' : ''
          } ${value === item.value ? 'bg-amber-500/20 text-amber-200' : 'text-stone-400 hover:text-amber-300'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  </div>
);

const Switch: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}> = ({ label, checked, onChange, hint }) => (
  <div className="flex flex-col gap-1">
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 group cursor-pointer text-left"
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${
          checked ? 'bg-amber-500/70' : 'bg-stone-700'
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </span>
      <span className="text-[11px] font-bold text-stone-300 group-hover:text-amber-300 transition-colors">
        {label}
      </span>
    </button>
    {hint && <span className="text-[10.5px] text-stone-500 leading-snug pl-[46px]">{hint}</span>}
  </div>
);

const IconButton: React.FC<{
  title: string;
  onClick?: () => void;
  onPointerDown?: () => void;
  onPointerUp?: () => void;
  onPointerLeave?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, onPointerDown, onPointerUp, onPointerLeave, disabled, active, children }) => (
  <button
    title={title}
    aria-label={title}
    onClick={onClick}
    onPointerDown={onPointerDown}
    onPointerUp={onPointerUp}
    onPointerLeave={onPointerLeave}
    disabled={disabled}
    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
      active
        ? 'border-amber-500/60 bg-amber-500/20 text-amber-200'
        : 'border-amber-900/30 bg-white/[0.02] text-stone-400 hover:text-amber-300 hover:border-amber-500/40'
    }`}
  >
    {children}
  </button>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-amber-900/25 bg-white/[0.02] px-3 py-2">
    <div className="text-lg font-black text-amber-200 leading-none">{value}</div>
    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 mt-1">{label}</div>
  </div>
);
