import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, BarChart3, Check, ChevronDown, Copy, Download, FileSpreadsheet,
  LineChart, PieChart, Redo2, RotateCcw, ScatterChart, Settings2, Sparkles,
  Table2, Target, Undo2, Upload, X,
} from 'lucide-react';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { ChartCanvas } from './components/ChartCanvas';
import { DataTable } from './components/DataTable';
import { NextStepBar } from './components/NextStepBar';
import {
  ChartHeroArt, EmptyChartArt, IconCombo, IconHistory, IconLocalChart,
  IconPalette, IconTableEdit, IconVector, StepData, StepExport, StepShape,
} from './components/Illustrations';

import { AdBanner } from '../../components/shared/AdBanner';
import { legalTranslations } from '../../locales/legal';
import { useHandoffIntake } from '../../lib/useHandoff';
import { useHistory } from './lib/useHistory';

import type { CanvasPreset, ChartOptions, ChartType, DataSet, NumberFormat, StackMode } from './types';
import {
  MAX_FILE_BYTES, cloneDataSet, datasetToCSV, emptyDataSet, parseDelimited,
} from './utils/dataParser';
import { getPreset, listPresets } from './utils/presetData';
import { COLOR_PALETTES, buildScene } from './utils/scene';
import {
  copySceneToClipboard, downloadPNG, downloadSVG, downloadText,
  getTextMeasurer, sceneToPNGBlob,
} from './utils/render';

interface GraphFlowProps {
  lang: string;
  dictionary: any;
}

const CHART_TYPES: { key: ChartType; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'bar',            icon: <BarChart3 className="w-4 h-4" />,                labelKey: 'chart_bar' },
  { key: 'horizontal-bar', icon: <BarChart3 className="w-4 h-4 -rotate-90" />,     labelKey: 'chart_horizontal_bar' },
  { key: 'line',           icon: <LineChart className="w-4 h-4" />,                labelKey: 'chart_line' },
  { key: 'area',           icon: <Activity className="w-4 h-4" />,                 labelKey: 'chart_area' },
  { key: 'pie',            icon: <PieChart className="w-4 h-4" />,                 labelKey: 'chart_pie' },
  { key: 'radar',          icon: <Target className="w-4 h-4" />,                   labelKey: 'chart_radar' },
  { key: 'scatter',        icon: <ScatterChart className="w-4 h-4" />,             labelKey: 'chart_scatter' },
];

const DEFAULT_OPTIONS: ChartOptions = {
  chartType: 'bar',
  title: '',
  stack: 'none',
  showLegend: true,
  showGrid: true,
  showValues: false,
  roundedBars: true,
  fillArea: false,
  doughnut: false,
  smoothLine: true,
  darkTheme: true,
  referenceLine: null,
  numberFormat: 'thousands',
  valueSuffix: '',
  palette: COLOR_PALETTES.vibrant,
  paletteName: 'vibrant',
  canvasPreset: 'auto',
};

/** A staged file: read, sniffed, but deliberately not charted yet. */
interface StagedFile {
  name: string;
  size: number;
  text: string;
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
}

const ERROR_KEYS: Record<string, string> = {
  TOO_FEW_ROWS: 'error_too_few_rows',
  TOO_FEW_COLUMNS: 'error_too_few_columns',
  NO_ROWS: 'error_no_data',
  NO_NUMERIC_COLUMNS: 'error_no_numeric',
  FILE_TOO_BIG: 'error_file_too_big',
  READ_FAILED: 'error_read_failed',
  CLIPBOARD_UNSUPPORTED: 'error_clipboard',
  ENCODE_FAILED: 'error_export_failed',
};

function chartHeight(width: number, preset: CanvasPreset): number {
  switch (preset) {
    case 'square': return Math.round(Math.min(width, 560));
    case 'wide':   return Math.round(width * 9 / 16);
    case 'tall':   return Math.round(Math.min(width * 16 / 9, 680));
    default:       return Math.round(Math.max(280, Math.min(width * 0.52, 460)));
  }
}

const GraphFlow: React.FC<GraphFlowProps> = ({ lang, dictionary }) => {
  const t = dictionary;

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────
  // `null` until the user asks for a chart: uploading a file must never start
  // the work on its own.
  const history = useHistory<DataSet | null>(null);
  const data = history.value;

  /** The dataset as it arrived, for the hold-to-compare button. */
  const [baseline, setBaseline] = useState<DataSet | null>(null);
  const [comparing, setComparing] = useState(false);

  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [sourceName, setSourceName] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [notice, setNotice] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Presentation ─────────────────────────────────────────────────────────
  const [options, setOptions] = useState<ChartOptions>({ ...DEFAULT_OPTIONS });
  const [panel, setPanel] = useState<'style' | 'data' | 'export'>('style');
  const [showTable, setShowTable] = useState(false);
  const [exportScale, setExportScale] = useState(2);
  const [width, setWidth] = useState(720);
  const [reducedMotion, setReducedMotion] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const measure = useMemo(() => getTextMeasurer(), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const showError = useCallback((code: string) => {
    setErrorMsg(t[ERROR_KEYS[code] || ''] || t.error_invalid_csv || code);
  }, [t]);

  // ── Scene ────────────────────────────────────────────────────────────────
  const height = chartHeight(width, options.canvasPreset);
  const active = comparing && baseline ? baseline : data;

  const scene = useMemo(
    () => buildScene(active || { labels: [], series: [] }, options, { width, height, measure }),
    [active, options, width, height, measure]
  );

  // ── Intake ───────────────────────────────────────────────────────────────

  /** Reads the file and sniffs its shape. Charting still waits for a click. */
  const stageFile = useCallback((file: File) => {
    setErrorMsg('');
    setNotice('');

    if (file.size > MAX_FILE_BYTES) {
      showError('FILE_TOO_BIG');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => showError('READ_FAILED');
    reader.onload = e => {
      const text = String(e.target?.result ?? '');
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        showError('TOO_FEW_ROWS');
        return;
      }
      // A cheap sniff for the preview card — the real parse happens on click.
      const delim = [',', ';', '\t', '|']
        .map(d => ({ d, n: lines[0].split(d).length }))
        .sort((a, b) => b.n - a.n)[0].d;
      const cut = (l: string) => l.split(delim).map(c => c.trim().replace(/^"|"$/g, ''));

      setStaged({
        name: file.name,
        size: file.size,
        text,
        headers: cut(lines[0]),
        sampleRows: lines.slice(1, 4).map(cut),
        totalRows: lines.length - 1,
      });
      setPanel('data');
    };
    reader.readAsText(file);
  }, [showError]);

  // One line, and a chart handed over from another tool lands in the same
  // staging area a dropped file would.
  useHandoffIntake(file => stageFile(file));

  const applyParsed = useCallback((text: string, name: string) => {
    try {
      const result = parseDelimited(text);
      history.reset(result.data);
      setBaseline(cloneDataSet(result.data));
      setSourceName(name);
      setStaged(null);
      setErrorMsg('');
      setShowTable(true);

      const notes: string[] = [];
      if (result.truncated > 0) {
        notes.push((t.notice_truncated || 'Charted the first {max} rows ({dropped} more were left out).')
          .replace('{max}', '5,000')
          .replace('{dropped}', String(result.truncated)));
      }
      if (result.coerced > 0) {
        notes.push((t.notice_coerced || '{n} cells held no number and were read as 0.')
          .replace('{n}', String(result.coerced)));
      }
      setNotice(notes.join(' '));
    } catch (err: any) {
      showError(err?.message || 'NO_ROWS');
    }
  }, [history, showError, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) stageFile(file);
  }, [stageFile]);

  const loadPreset = useCallback((key: string) => {
    const preset = getPreset(key);
    if (!preset) return;
    history.reset(preset.data);
    setBaseline(cloneDataSet(preset.data));
    setOptions(o => ({ ...o, chartType: preset.suggested, stack: 'none' }));
    setSourceName(t[preset.nameKey] || key);
    setStaged(null);
    setErrorMsg('');
    setNotice('');
    setShowTable(false);
  }, [history, t]);

  /** The manual route: skips the file step entirely. */
  const startBlank = useCallback(() => {
    const blank = emptyDataSet();
    history.reset(blank);
    setBaseline(cloneDataSet(blank));
    setSourceName('');
    setStaged(null);
    setErrorMsg('');
    setNotice('');
    setShowTable(true);
    setPanel('data');
  }, [history]);

  const handleReset = useCallback(() => {
    history.reset(null);
    setBaseline(null);
    setOptions({ ...DEFAULT_OPTIONS });
    setStaged(null);
    setSourceName('');
    setPasteText('');
    setErrorMsg('');
    setNotice('');
    setShowTable(false);
    setPanel('style');
  }, [history]);

  // ── Options ──────────────────────────────────────────────────────────────
  const updateOption = useCallback(<K extends keyof ChartOptions>(key: K, value: ChartOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePaletteChange = useCallback((name: string) => {
    setOptions(prev => ({ ...prev, paletteName: name, palette: COLOR_PALETTES[name] || COLOR_PALETTES.vibrant }));
  }, []);

  // ── Export ───────────────────────────────────────────────────────────────
  const baseName = sourceName
    ? sourceName.replace(/\.(csv|tsv|txt)$/i, '').replace(/[^\w\-]+/g, '-').slice(0, 60) || 'chart'
    : 'graph-flow-chart';

  const doExport = useCallback(async (kind: 'png' | 'svg' | 'csv') => {
    if (!data) return;
    setBusy(true);
    setErrorMsg('');
    try {
      if (kind === 'png') await downloadPNG(scene, `${baseName}.png`, exportScale);
      else if (kind === 'svg') downloadSVG(scene, `${baseName}.svg`);
      else downloadText(datasetToCSV(data), `${baseName}.csv`, 'text/csv');
    } catch (err: any) {
      showError(err?.message || 'ENCODE_FAILED');
    } finally {
      setBusy(false);
    }
  }, [data, scene, baseName, exportScale, showError]);

  const doCopy = useCallback(async () => {
    if (!data) return;
    try {
      await copySceneToClipboard(scene, exportScale);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      showError(err?.message || 'CLIPBOARD_UNSUPPORTED');
    }
  }, [data, scene, exportScale, showError]);

  const getHandoffResult = useCallback(async () => {
    if (!data) return null;
    const blob = await sceneToPNGBlob(scene, exportScale);
    return { blob, name: `${baseName}.png` };
  }, [data, scene, exportScale, baseName]);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      // Never steal Ctrl+Z from a field the user is typing in.
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (!(e.ctrlKey || e.metaKey)) return;

      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); history.undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); history.redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history]);

  // ── Misc ─────────────────────────────────────────────────────────────────
  const handleLanguageChange = useCallback((newLang: string) => {
    const path = window.location.pathname.replace(/^\/[a-z]{2}\//, `/${newLang.toLowerCase()}/`);
    window.location.href = path;
  }, []);

  const legalContent = useMemo(() => {
    const legal = legalTranslations[lang];
    if (!legal) return { privacy: '', terms: '', cookies: '', titles: { privacy: '', terms: '', cookies: '' } };
    return { privacy: legal.privacy, terms: legal.terms, cookies: legal.cookies, titles: legal.nav };
  }, [lang]);

  const presets = useMemo(() => listPresets(), []);
  const faqs = Array.isArray(t.faq) ? t.faq : [];
  const hasChart = !!data && data.labels.length > 0;

  const features = [
    { Icon: IconVector,     title: t.feat_vector_title,  text: t.feat_vector_text },
    { Icon: IconTableEdit,  title: t.feat_table_title,   text: t.feat_table_text },
    { Icon: IconCombo,      title: t.feat_combo_title,   text: t.feat_combo_text },
    { Icon: IconHistory,    title: t.feat_history_title, text: t.feat_history_text },
    { Icon: IconPalette,    title: t.feat_style_title,   text: t.feat_style_text },
    { Icon: IconLocalChart, title: t.feat_local_title,   text: t.feat_local_text },
  ];

  const steps = [
    { Art: StepData,   title: t.how_step1_title, text: t.how_step1_text },
    { Art: StepShape,  title: t.how_step2_title, text: t.how_step2_text },
    { Art: StepExport, title: t.how_step3_title, text: t.how_step3_text },
  ];

  const toggleRows: { key: keyof ChartOptions; label: string; when?: boolean }[] = [
    { key: 'showLegend',  label: t.opt_show_legend },
    { key: 'showGrid',    label: t.opt_show_grid },
    { key: 'showValues',  label: t.opt_show_values },
    { key: 'roundedBars', label: t.opt_rounded_bars, when: options.chartType === 'bar' || options.chartType === 'horizontal-bar' },
    { key: 'fillArea',    label: t.opt_fill_area,    when: options.chartType === 'line' },
    { key: 'doughnut',    label: t.opt_doughnut,     when: options.chartType === 'pie' },
    { key: 'smoothLine',  label: t.opt_smooth_line,  when: options.chartType === 'line' || options.chartType === 'area' },
    { key: 'darkTheme',   label: t.opt_dark_theme },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={handleReset} t={t} />

      {/* The max-width lives on <main> itself: AdRail measures the gap between
          this element and the viewport edge, and a full-width <main> leaves it
          zero, silently suppressing both rails at every screen size. */}
      <main className="flex-1 pt-28 md:pt-32 pb-8 px-4 md:px-8 w-full max-w-6xl mx-auto min-[1400px]:max-w-[min(72rem,calc(100vw-440px))]">
        <AdBanner id="adsense-graph-flow-top" />

        <div className="space-y-8">

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center pt-2">
            <div className="space-y-5 text-center lg:text-left">
              <div className="inline-flex max-w-full items-center gap-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-800/30 text-amber-400 text-[11px] font-black tracking-[0.2em] uppercase">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.heroBadge}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-[1.05]">
                {t.heroTitle}
              </h1>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.5)] active:scale-95"
                >
                  <Upload className="w-4 h-4" /> {t.btn_choose_file}
                </button>
                <button
                  onClick={startBlank}
                  className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-gray-200 font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  <Table2 className="w-4 h-4" /> {t.btn_start_manual}
                </button>
              </div>
            </div>
            <ChartHeroArt
              className="w-full max-w-lg mx-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
              animated={!reducedMotion}
            />
          </section>

          {/* ── Data source ───────────────────────────────────────────── */}
          <section
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
            className={`glass-card rounded-2xl p-5 md:p-6 space-y-5 transition-colors ${
              isDragging ? 'border-amber-400/50 bg-amber-500/5' : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain,application/vnd.ms-excel"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) stageFile(f);
                e.target.value = '';
              }}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mr-1">
                {t.label_data_source}
              </span>
              {presets.map(p => (
                <button
                  key={p.key}
                  onClick={() => loadPreset(p.key)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold border bg-white/5 border-white/10 text-gray-400 hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-amber-200 transition-all cursor-pointer"
                >
                  {t[p.nameKey] || p.key}
                </button>
              ))}
            </div>

            {/* Staged file — read and sniffed, not yet charted. */}
            {staged && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{staged.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {(t.staged_summary || '{rows} rows · {cols} columns · {size} KB')
                        .replace('{rows}', String(staged.totalRows))
                        .replace('{cols}', String(staged.headers.length))
                        .replace('{size}', (staged.size / 1024).toFixed(1))}
                    </p>
                  </div>
                  <button
                    onClick={() => setStaged(null)}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors cursor-pointer shrink-0"
                    aria-label={t.btn_discard || 'Discard'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-white/5 bg-black/30">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-white/10">
                        {staged.headers.slice(0, 6).map((h, i) => (
                          <th key={i} className="text-left px-2.5 py-1.5 text-amber-300/80 font-bold whitespace-nowrap">
                            {h || '—'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {staged.sampleRows.map((r, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0">
                          {staged.headers.slice(0, 6).map((_, j) => (
                            <td key={j} className="px-2.5 py-1 text-gray-400 whitespace-nowrap">{r[j] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => applyParsed(staged.text, staged.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-[0.98]"
                >
                  <BarChart3 className="w-4 h-4" /> {t.btn_generate_chart}
                </button>
                <p className="text-[10px] text-gray-500 text-center font-medium">{t.staged_hint}</p>
              </div>
            )}

            {!staged && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-white/10 hover:border-amber-500/40 hover:bg-amber-500/[0.04] transition-all cursor-pointer"
                >
                  <Upload className={`w-6 h-6 transition-colors ${isDragging ? 'text-amber-300' : 'text-amber-500'}`} />
                  <span className="text-sm font-bold text-white">
                    {isDragging ? t.drop_active : t.drop_inactive}
                  </span>
                  <span className="text-[11px] text-gray-500">{t.accepted_formats}</span>
                </button>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 block">
                    {t.paste_label}
                  </label>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={t.paste_placeholder}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-600 outline-none focus:border-amber-500/40 resize-y"
                  />
                  <button
                    onClick={() => applyParsed(pasteText, '')}
                    disabled={pasteText.trim().length === 0}
                    className="w-full px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {t.btn_parse_paste}
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 text-red-300 text-xs font-medium flex items-start gap-2.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.2h.01" />
                </svg>
                {errorMsg}
              </div>
            )}
            {notice && !errorMsg && (
              <p className="text-[11px] text-amber-300/70 font-medium">{notice}</p>
            )}
          </section>

          {/* ── Chart ─────────────────────────────────────────────────── */}
          {hasChart && (
            <>
              <div className="flex flex-wrap gap-2">
                {CHART_TYPES.map(ct => (
                  <button
                    key={ct.key}
                    onClick={() => updateOption('chartType', ct.key)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      options.chartType === ct.key
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {ct.icon} {t[ct.labelKey] || ct.labelKey}
                  </button>
                ))}
              </div>

              {/* flex-col on mobile, side by side from lg. The preview keeps
                  lg:flex-1 rather than flex-1: on the column axis flex-1 sets
                  flex-basis:0 and collapses the panel to nothing. */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div ref={chartAreaRef} className="w-full lg:flex-1 min-w-0 space-y-4">
                  <div className="glass-card rounded-2xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase mr-auto">
                        {t.label_preview}
                      </span>

                      <button
                        onClick={history.undo}
                        disabled={!history.canUndo}
                        title={t.btn_undo}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={history.redo}
                        disabled={!history.canRedo}
                        title={t.btn_redo}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent transition-all cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Redo2 className="w-4 h-4" />
                      </button>
                      <button
                        onPointerDown={() => setComparing(true)}
                        onPointerUp={() => setComparing(false)}
                        onPointerLeave={() => setComparing(false)}
                        disabled={!history.canUndo}
                        title={t.compare_hint}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed ${
                          comparing ? 'bg-amber-500/25 text-amber-200' : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {t.btn_compare}
                      </button>
                    </div>

                    <div className="p-3 md:p-4">
                      <ChartCanvas
                        scene={scene}
                        onWidth={w => setWidth(Math.max(240, w))}
                        t={t}
                        empty={!hasChart}
                        placeholder={<EmptyChartArt className="w-40" animated={!reducedMotion} />}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-600 font-medium text-center px-2">
                    {comparing ? t.compare_active : t.zoom_hint}
                  </p>

                  <NextStepBar lang={lang} t={t} getResult={getHandoffResult} disabled={busy} />
                </div>

                {/* ── Side panel ───────────────────────────────────────── */}
                <div className="w-full lg:w-[320px] lg:shrink-0 space-y-4">
                  <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
                    {([
                      { key: 'style',  label: t.tab_style,  icon: <Settings2 className="w-3.5 h-3.5" /> },
                      { key: 'data',   label: t.tab_data,   icon: <Table2 className="w-3.5 h-3.5" /> },
                      { key: 'export', label: t.tab_export, icon: <Download className="w-3.5 h-3.5" /> },
                    ] as const).map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setPanel(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          panel === tab.key ? 'bg-amber-500/20 text-amber-200' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.icon} <span className="truncate">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {panel === 'style' && (
                    <div className="glass-card rounded-2xl p-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t.label_chart_title}
                        </label>
                        <input
                          value={options.title}
                          onChange={e => updateOption('title', e.target.value)}
                          placeholder={t.label_chart_title_placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-amber-500/40 placeholder-gray-600"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t.label_colors}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                            <button
                              key={name}
                              onClick={() => handlePaletteChange(name)}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                                options.paletteName === name
                                  ? 'border-amber-500/40 bg-amber-500/10'
                                  : 'border-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="flex gap-0.5">
                                {colors.slice(0, 4).map((c, i) => (
                                  <span key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                                ))}
                              </div>
                              <span className="text-[9px] font-bold text-gray-500">{t[`palette_${name}`] || name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {(options.chartType === 'bar' || options.chartType === 'horizontal-bar') && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                            {t.label_stack}
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['none', 'stack', 'percent'] as StackMode[]).map(m => (
                              <button
                                key={m}
                                onClick={() => updateOption('stack', m)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  options.stack === m
                                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                                }`}
                              >
                                {t[`stack_${m}`] || m}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                            {t.label_number_format}
                          </label>
                          <select
                            value={options.numberFormat}
                            onChange={e => updateOption('numberFormat', e.target.value as NumberFormat)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500/40 cursor-pointer"
                          >
                            <option value="plain">{t.fmt_plain}</option>
                            <option value="thousands">{t.fmt_thousands}</option>
                            <option value="compact">{t.fmt_compact}</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                            {t.label_value_suffix}
                          </label>
                          <input
                            value={options.valueSuffix}
                            onChange={e => updateOption('valueSuffix', e.target.value.slice(0, 6))}
                            placeholder="%"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500/40 placeholder-gray-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t.label_reference_line}
                        </label>
                        <input
                          inputMode="decimal"
                          value={options.referenceLine ?? ''}
                          onChange={e => {
                            const v = e.target.value.trim();
                            const n = Number(v);
                            updateOption('referenceLine', v === '' || !Number.isFinite(n) ? null : n);
                          }}
                          placeholder={t.reference_placeholder}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500/40 placeholder-gray-600"
                        />
                      </div>

                      <div className="space-y-2 pt-1">
                        {toggleRows.filter(r => r.when !== false).map(({ key, label }) => (
                          <label
                            key={key}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all border ${
                              options[key] ? 'bg-amber-500/[0.08] border-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                            }`}
                          >
                            <span className="relative flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={!!options[key]}
                                onChange={e => updateOption(key, e.target.checked as any)}
                                className="sr-only peer"
                              />
                              <span className={`block w-9 h-5 rounded-full transition-all ${options[key] ? 'bg-amber-500' : 'bg-white/10'}`} />
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${options[key] ? 'left-[18px] bg-white' : 'left-0.5 bg-gray-400'}`} />
                            </span>
                            <span className={`text-[11px] font-semibold ${options[key] ? 'text-gray-200' : 'text-gray-500'}`}>
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {panel === 'data' && (
                    <div className="glass-card rounded-2xl p-4">
                      <button
                        onClick={() => setShowTable(v => !v)}
                        className="w-full flex items-center justify-between mb-3 cursor-pointer bg-transparent border-none p-0"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t.label_data_table}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showTable ? 'rotate-180' : ''}`} />
                      </button>
                      {showTable && data && (
                        <DataTable data={data} onChange={history.set} palette={options.palette} t={t} />
                      )}
                    </div>
                  )}

                  {panel === 'export' && (
                    <div className="glass-card rounded-2xl p-4 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t.label_dimensions}
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['auto', 'square', 'wide', 'tall'] as CanvasPreset[]).map(p => (
                            <button
                              key={p}
                              onClick={() => updateOption('canvasPreset', p)}
                              className={`px-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                options.canvasPreset === p
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {t[`dim_${p}`] || p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                          {t.label_export_scale}
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[1, 2, 3].map(s => (
                            <button
                              key={s}
                              onClick={() => setExportScale(s)}
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                exportScale === s
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              {s}×
                            </button>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono">
                          {Math.round(width * exportScale)} × {Math.round(height * exportScale)} px
                        </p>
                      </div>

                      <button
                        onClick={() => doExport('png')}
                        disabled={busy}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" /> {t.btn_download_png}
                      </button>
                      <button
                        onClick={() => doExport('svg')}
                        disabled={busy}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        <IconVector className="w-4 h-4" /> {t.btn_download_svg}
                      </button>
                      <button
                        onClick={doCopy}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? t.copied : t.btn_copy_image}
                      </button>
                      <button
                        onClick={() => doExport('csv')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> {t.btn_download_csv}
                      </button>
                      <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-500 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> {t.btn_reset}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <AdBanner id="adsense-graph-flow-mid" />

          {/* ── Features ──────────────────────────────────────────────── */}
          <section className="space-y-6 pt-4">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center">
              {t.featuresTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map(({ Icon, title, text }, i) => (
                <div key={i} className="glass-card rounded-2xl p-5 space-y-2.5">
                  <span className="inline-flex w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── How it works ──────────────────────────────────────────── */}
          <section className="space-y-6 pt-4">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center">
              {t.howTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map(({ Art, title, text }, i) => (
                <div key={i} className="glass-card rounded-2xl p-6 space-y-3 text-center">
                  <Art className="w-28 h-20 mx-auto text-amber-500/80" />
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-black">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FAQ ───────────────────────────────────────────────────── */}
          {faqs.length > 0 && (
            <section className="space-y-4 pt-4 max-w-4xl mx-auto w-full">
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center mb-6">
                {t.faqTitle}
              </h2>
              {faqs.map((faq: any, i: number) => (
                <details key={i} className="group glass-card rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center gap-3 cursor-pointer list-none text-sm font-bold text-white">
                    <span className="flex-1">{faq.question}</span>
                    <ChevronDown className="w-4 h-4 text-amber-400 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="text-gray-400 leading-relaxed pt-3 text-sm">{faq.answer}</p>
                </details>
              ))}
            </section>
          )}
        </div>

        <AdBanner id="adsense-graph-flow-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={setActiveModal} />

      {activeModal && (
        <LegalModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          title={legalContent.titles[activeModal] || activeModal}
          content={legalContent[activeModal] || ''}
          t={t}
        />
      )}
    </div>
  );
};

export default GraphFlow;
