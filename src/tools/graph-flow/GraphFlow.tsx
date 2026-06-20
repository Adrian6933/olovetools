import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import { PRESET_DATA } from './utils/presetData';
import { parseCSV, type DataSet } from './utils/dataParser';
import {
  renderChart, COLOR_PALETTES, downloadCanvasPNG,
  type ChartType, type ChartOptions,
} from './utils/chartEngine';
import {
  Upload, Download, Copy, Check, BarChart3, LineChart, PieChart,
  Settings, ChevronDown, ChevronUp, Sparkles, RotateCcw,
  Plus, Minus, Table2, Image, Activity, Target, ScatterChart
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface GraphFlowProps {
  lang: string;
  dictionary: any;
}

const CHART_TYPES: { key: ChartType; icon: React.ReactNode; labelKey: string }[] = [
  { key: 'bar',            icon: <BarChart3 className="w-4 h-4" />,    labelKey: 'chart_bar' },
  { key: 'line',           icon: <LineChart className="w-4 h-4" />,    labelKey: 'chart_line' },
  { key: 'pie',            icon: <PieChart className="w-4 h-4" />,     labelKey: 'chart_pie' },
  { key: 'area',           icon: <Activity className="w-4 h-4" />,     labelKey: 'chart_area' },
  { key: 'radar',          icon: <Target className="w-4 h-4" />,       labelKey: 'chart_radar' },
  { key: 'scatter',        icon: <ScatterChart className="w-4 h-4" />, labelKey: 'chart_scatter' },
  { key: 'horizontal-bar', icon: <BarChart3 className="w-4 h-4 rotate-90" />, labelKey: 'chart_horizontal_bar' },
];

const DEFAULT_OPTIONS: ChartOptions = {
  chartType: 'bar',
  title: '',
  showLegend: true,
  showGrid: true,
  showValues: false,
  animate: true,
  roundedBars: true,
  fillArea: false,
  doughnut: false,
  smoothLine: true,
  darkTheme: true,
  palette: COLOR_PALETTES.vibrant,
};

const GraphFlow: React.FC<GraphFlowProps> = ({ lang, dictionary }) => {
  const t = dictionary;

  // Modal
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // Data
  const [data, setData] = useState<DataSet>(PRESET_DATA.sales.data);
  const [fileName, setFileName] = useState<string>('');

  // Chart options
  const [options, setOptions] = useState<ChartOptions>({ ...DEFAULT_OPTIONS });
  const [selectedPalette, setSelectedPalette] = useState<string>('vibrant');
  const [showOptions, setShowOptions] = useState<boolean>(true);

  // Manual input
  const [manualHeaders, setManualHeaders] = useState<string>('');
  const [manualRows, setManualRows] = useState<string[]>(['']);
  const [activeTab, setActiveTab] = useState<'csv' | 'manual' | 'presets'>('presets');

  // UI
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedState, setCopiedState] = useState<boolean>(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-render chart whenever data or options change
  useEffect(() => {
    if (!canvasRef.current || !data || data.labels.length === 0) return;
    renderChart(canvasRef.current, data, options);
  }, [data, options]);

  // File handling
  const handleFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setErrorMsg(t.error_invalid_csv);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataset = parseCSV(e.target?.result as string);
        setData(dataset);
        setErrorMsg('');
        setActiveTab('csv');
      } catch (err: any) {
        setErrorMsg(err.message || t.error_invalid_csv);
      }
    };
    reader.readAsText(file);
  }, [t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Preset
  const loadPreset = useCallback((key: string) => {
    const preset = PRESET_DATA[key];
    if (preset) {
      setData(preset.data);
      setErrorMsg('');
      setFileName('');
    }
  }, []);

  // Manual input parsing
  const applyManualData = useCallback(() => {
    try {
      const headers = manualHeaders.split(',').map(h => h.trim()).filter(Boolean);
      if (headers.length < 2) {
        setErrorMsg('Need at least 2 columns (label + values)');
        return;
      }
      const labels: string[] = [];
      const seriesValues: number[][] = headers.slice(1).map(() => []);

      for (const row of manualRows) {
        const cols = row.split(',').map(c => c.trim());
        if (!cols[0]) continue;
        labels.push(cols[0]);
        for (let j = 0; j < headers.length - 1; j++) {
          const num = parseFloat(cols[j + 1] || '0');
          seriesValues[j].push(isNaN(num) ? 0 : num);
        }
      }

      if (labels.length === 0) {
        setErrorMsg(t.error_no_data);
        return;
      }

      setData({
        labels,
        series: headers.slice(1).map((name, i) => ({ name, values: seriesValues[i] })),
      });
      setErrorMsg('');
    } catch {
      setErrorMsg(t.error_invalid_csv);
    }
  }, [manualHeaders, manualRows, t]);

  // Download
  const downloadPNG = useCallback(() => {
    if (!canvasRef.current) return;
    const name = fileName ? fileName.replace(/\.csv$/i, '') : 'graph-flow-chart';
    downloadCanvasPNG(canvasRef.current, `${name}.png`);
  }, [fileName]);

  // Copy image
  const copyImage = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
      });
    } catch {
      setCopiedState(false);
    }
  }, []);

  // Reset
  const handleReset = useCallback(() => {
    setData(PRESET_DATA.sales.data);
    setOptions({ ...DEFAULT_OPTIONS });
    setSelectedPalette('vibrant');
    setErrorMsg('');
    setFileName('');
    setActiveTab('presets');
  }, []);

  // Language change
  const handleLanguageChange = useCallback((newLang: string) => {
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/[a-z]{2}\//, `/${newLang.toLowerCase()}/`);
    window.location.href = newPath;
  }, []);

  // Options updater
  const updateOption = useCallback(<K extends keyof ChartOptions>(key: K, value: ChartOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Palette change
  const handlePaletteChange = useCallback((paletteName: string) => {
    setSelectedPalette(paletteName);
    setOptions(prev => ({ ...prev, palette: COLOR_PALETTES[paletteName] || COLOR_PALETTES.vibrant }));
  }, []);

  // Legal
  const legalContent = useMemo(() => {
    const legal = legalTranslations[lang];
    if (!legal) return { privacy: '', terms: '', cookies: '', titles: { privacy: '', terms: '', cookies: '' } };
    return { privacy: legal.privacy, terms: legal.terms, cookies: legal.cookies, titles: legal.nav };
  }, [lang]);

  return (
    <div className="min-h-screen flex flex-col font-sans antialiased">
      <Header currentLang={lang} onLanguageChange={handleLanguageChange} onReset={handleReset} t={t} />

      <main className="flex-1 pt-28 md:pt-32 pb-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Hero */}
          <div className="text-center space-y-3 mb-8">
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {t.seoHeroText}
            </p>
          </div>

          {/* Data Source Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['presets', 'csv', 'manual'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeTab === tab
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab === 'csv' && <Upload className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                {tab === 'manual' && <Table2 className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                {tab === 'presets' && <Sparkles className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />}
                {t[`tab_${tab}`] || tab}
              </button>
            ))}
          </div>

          {/* CSV Upload */}
          {activeTab === 'csv' && (
            <div
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`glass-card rounded-2xl p-8 md:p-10 cursor-pointer text-center transition-all duration-300 group border-2 border-dashed ${
                isDragging ? 'border-amber-400/60 bg-amber-500/5 shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]' : 'border-white/10 hover:border-amber-500/30'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileInput} className="hidden" />
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isDragging ? 'bg-amber-500/20 rotate-6 scale-110' : 'bg-white/5 group-hover:bg-amber-500/10 group-hover:rotate-3'
                }`}>
                  <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-amber-300' : 'text-amber-500'}`} />
                </div>
                <p className="text-lg font-bold text-white">
                  {isDragging ? t.drop_active : t.label_data_source}
                </p>
                <p className="text-sm text-gray-500">{t.drop_inactive}</p>
              </div>
            </div>
          )}

          {/* Presets */}
          {activeTab === 'presets' && (
            <div className="flex flex-wrap items-center gap-3">
              {Object.entries(PRESET_DATA).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => loadPreset(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    data === preset.data
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_15px_-5px_rgba(245,158,11,0.3)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline-block mr-1.5 -mt-0.5" />
                  {t[preset.nameKey] || preset.nameKey}
                </button>
              ))}
            </div>
          )}

          {/* Manual Input */}
          {activeTab === 'manual' && (
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">{t.label_manual_headers}</label>
                <input
                  type="text"
                  value={manualHeaders}
                  onChange={e => setManualHeaders(e.target.value)}
                  placeholder="Label, Series A, Series B"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-gray-600 outline-none focus:border-amber-500/40"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">{t.label_manual_values}</label>
                {manualRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={row}
                      onChange={e => {
                        const newRows = [...manualRows];
                        newRows[i] = e.target.value;
                        setManualRows(newRows);
                      }}
                      placeholder="Label, 10, 20"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono placeholder-gray-600 outline-none focus:border-amber-500/40"
                    />
                    {manualRows.length > 1 && (
                      <button
                        onClick={() => setManualRows(manualRows.filter((_, j) => j !== i))}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex gap-3">
                  <button
                    onClick={() => setManualRows([...manualRows, ''])}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t.label_add_row}
                  </button>
                  <button
                    onClick={applyManualData}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 rounded-xl transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Generate Chart
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm font-medium flex items-start gap-3">
              <span className="text-red-400 mt-0.5">⚠</span> {errorMsg}
            </div>
          )}

          {/* Chart Type Selector */}
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

          {/* Chart Title Input */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <input
              type="text"
              value={options.title}
              onChange={e => updateOption('title', e.target.value)}
              placeholder={t.label_chart_title_placeholder}
              className="w-full bg-transparent px-6 py-4 text-white font-bold text-sm outline-none placeholder-gray-600 border-none"
            />
          </div>

          {/* Main Layout: Canvas + Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Canvas Preview */}
            <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <Image className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-gray-300 tracking-wider uppercase">{t.label_preview}</span>
              </div>
              <div className="p-4">
                <canvas
                  ref={canvasRef}
                  className="w-full rounded-xl"
                  style={{ height: '420px', background: options.darkTheme ? '#0f172a' : '#ffffff' }}
                />
              </div>
            </div>

            {/* Actions sidebar */}
            <div className="space-y-4">
              {/* Download PNG */}
              <button
                onClick={downloadPNG}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all cursor-pointer hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.4)] active:scale-95"
              >
                <Download className="w-4.5 h-4.5" /> {t.btn_download_png}
              </button>

              {/* Copy Image */}
              <button
                onClick={copyImage}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-gray-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
              >
                {copiedState ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedState ? t.copied : t.btn_copy_image}
              </button>

              {/* Color Palettes */}
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.label_colors}</span>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(COLOR_PALETTES).map(([name, colors]) => (
                    <button
                      key={name}
                      onClick={() => handlePaletteChange(name)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                        selectedPalette === name
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex gap-0.5">
                        {colors.slice(0, 4).map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-gray-500">{t[`palette_${name}`] || name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Options Panel */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="w-full px-6 py-4 flex items-center justify-between cursor-pointer bg-transparent border-none text-left"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-bold text-white tracking-tight">{t.label_options}</span>
              </div>
              {showOptions ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {showOptions && (
              <div className="px-6 pb-6 space-y-3 border-t border-white/5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    { key: 'showLegend', label: t.opt_show_legend },
                    { key: 'showGrid', label: t.opt_show_grid },
                    { key: 'showValues', label: t.opt_show_values },
                    { key: 'roundedBars', label: t.opt_rounded_bars },
                    { key: 'fillArea', label: t.opt_fill_area },
                    { key: 'doughnut', label: t.opt_doughnut },
                    { key: 'smoothLine', label: t.opt_smooth_line },
                    { key: 'darkTheme', label: t.opt_dark_theme },
                  ] as { key: keyof ChartOptions; label: string }[]).map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        options[key] ? 'bg-amber-500/8 border-amber-500/20 hover:border-amber-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={!!options[key]}
                          onChange={(e) => updateOption(key, e.target.checked as any)}
                          className="sr-only peer"
                        />
                        <div className={`w-9 h-5 rounded-full transition-all duration-200 ${
                          options[key] ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/10'
                        }`} />
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${
                          options[key] ? 'left-[18px] bg-white' : 'left-0.5 bg-gray-400'
                        }`} />
                      </div>
                      <span className={`text-xs font-semibold transition-colors ${options[key] ? 'text-gray-200' : 'text-gray-500'}`}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEO Banner */}
          <div className="glass-card rounded-2xl p-8 md:p-12 text-center space-y-4 border border-white/5">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{t.seoHeroTitle}</h2>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">{t.seoHeroText}</p>
          </div>
        </div>
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setActiveModal(modal)} />

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
