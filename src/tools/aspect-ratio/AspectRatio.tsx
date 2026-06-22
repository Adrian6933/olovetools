import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LegalModal } from './components/LegalModal';
import {
  Ratio, ArrowRight, Copy, Check, RotateCcw, Monitor,
  Smartphone, Square, RectangleHorizontal
} from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface AspectRatioProps {
  lang: string;
  dictionary: any;
}

type Tab = 'calculate' | 'resize' | 'presets';
type ResizeTarget = 'width' | 'height';

const gcd = (a: number, b: number): number => {
  let x = Math.abs(Math.floor(a));
  let y = Math.abs(Math.floor(b));
  while (y) {
    [x, y] = [y, x % y];
  }
  return x || 1;
};

const PRESETS = [
  { id: '16-9', w: 16, h: 9, name: '16:9', icon: 'monitor', label: 'Widescreen HD', resolutions: ['1920×1080', '1280×720', '3840×2160'] },
  { id: '4-3', w: 4, h: 3, name: '4:3', icon: 'monitor', label: 'Standard', resolutions: ['1024×768', '800×600', '1600×1200'] },
  { id: '21-9', w: 21, h: 9, name: '21:9', icon: 'rectangle', label: 'Ultrawide', resolutions: ['2560×1080', '3440×1440'] },
  { id: '1-1', w: 1, h: 1, name: '1:1', icon: 'square', label: 'Square', resolutions: ['1080×1080', '512×512'] },
  { id: '9-16', w: 9, h: 16, name: '9:16', icon: 'smartphone', label: 'Mobile Portrait', resolutions: ['1080×1920', '720×1280'] },
  { id: '3-2', w: 3, h: 2, name: '3:2', icon: 'monitor', label: 'Photography', resolutions: ['3000×2000', '1080×720'] },
  { id: '16-10', w: 16, h: 10, name: '16:10', icon: 'monitor', label: 'Widescreen', resolutions: ['1920×1200', '1280×800'] },
];

export default function AspectRatio({ lang, dictionary }: AspectRatioProps) {
  const t = dictionary || {};
  const [tab, setTab] = useState<Tab>('calculate');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [calcW, setCalcW] = useState<string>('1920');
  const [calcH, setCalcH] = useState<string>('1080');

  const [origW, setOrigW] = useState<string>('1920');
  const [origH, setOrigH] = useState<string>('1080');
  const [resizeTarget, setResizeTarget] = useState<ResizeTarget>('width');
  const [targetW, setTargetW] = useState<string>('1280');
  const [targetH, setTargetH] = useState<string>('720');

  const [selectedPreset, setSelectedPreset] = useState<string>('16-9');

  const calcResult = useMemo(() => {
    const w = parseInt(calcW, 10);
    const h = parseInt(calcH, 10);
    if (!w || !h || w <= 0 || h <= 0) return null;
    const g = gcd(w, h);
    return {
      gcd: g,
      ratioW: w / g,
      ratioH: h / g,
      decimal: w / h,
      w,
      h,
    };
  }, [calcW, calcH]);

  const resizeResult = useMemo(() => {
    const ow = parseInt(origW, 10);
    const oh = parseInt(origH, 10);
    if (!ow || !oh || ow <= 0 || oh <= 0) return null;
    if (resizeTarget === 'width') {
      const tw = parseInt(targetW, 10);
      if (!tw || tw <= 0) return null;
      return { w: tw, h: Math.round((tw * oh) / ow) };
    }
    const th = parseInt(targetH, 10);
    if (!th || th <= 0) return null;
    return { w: Math.round((th * ow) / oh), h: th };
  }, [origW, origH, resizeTarget, targetW, targetH]);

  const currentRatio = useMemo(() => {
    if (tab === 'calculate' && calcResult) return calcResult.w / calcResult.h;
    if (tab === 'resize' && resizeResult) return resizeResult.w / resizeResult.h;
    if (tab === 'presets') {
      const p = PRESETS.find((x) => x.id === selectedPreset);
      if (p) return p.w / p.h;
    }
    if (tab === 'resize') {
      const ow = parseInt(origW, 10);
      const oh = parseInt(origH, 10);
      if (ow > 0 && oh > 0) return ow / oh;
    }
    if (tab === 'calculate') {
      const w = parseInt(calcW, 10);
      const h = parseInt(calcH, 10);
      if (w > 0 && h > 0) return w / h;
    }
    return 16 / 9;
  }, [tab, calcResult, resizeResult, selectedPreset, origW, origH, calcW, calcH]);

  const previewDims = useMemo(() => {
    const maxW = 340;
    const maxH = 210;
    if (!isFinite(currentRatio) || currentRatio <= 0) return { w: maxW, h: maxH };
    if (currentRatio >= maxW / maxH) {
      return { w: maxW, h: maxW / currentRatio };
    }
    return { w: maxH * currentRatio, h: maxH };
  }, [currentRatio]);

  const previewLabel = useMemo(() => {
    if (tab === 'calculate' && calcResult) return `${calcResult.ratioW}:${calcResult.ratioH}`;
    if (tab === 'resize' && resizeResult) return `${resizeResult.w}×${resizeResult.h}`;
    if (tab === 'presets') {
      const p = PRESETS.find((x) => x.id === selectedPreset);
      if (p) return p.name;
    }
    return '—';
  }, [tab, calcResult, resizeResult, selectedPreset]);

  const handleCopy = useCallback((field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const resetWorkspace = useCallback(() => {
    setCalcW('1920');
    setCalcH('1080');
    setOrigW('1920');
    setOrigH('1080');
    setResizeTarget('width');
    setTargetW('1280');
    setTargetH('720');
    setSelectedPreset('16-9');
    setTab('calculate');
    setCopiedField(null);
  }, []);

  const renderPresetIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone className={className} />;
      case 'square':
        return <Square className={className} />;
      case 'rectangle':
        return <RectangleHorizontal className={className} />;
      default:
        return <Monitor className={className} />;
    }
  };

  const CopyButton = ({ field, value }: { field: string; value: string }) => (
    <button
      onClick={() => handleCopy(field, value)}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer outline-none border ${
        copiedField === field
          ? 'bg-lime-500/20 border-lime-500/50 text-lime-400'
          : 'bg-white/5 border-white/5 hover:bg-lime-500/20 hover:border-lime-500/30 text-slate-400 hover:text-lime-400'
      }`}
      title={t.tooltip_copy || 'Copy'}
    >
      {copiedField === field ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  const inputClass =
    'w-full px-4 py-3 bg-lime-950/30 border border-lime-500/15 rounded-xl text-lime-100 placeholder-lime-700 font-mono text-sm focus:outline-none focus:border-lime-500/50 focus:bg-lime-950/50 transition-all';

  return (
    <div className="min-h-screen flex flex-col bg-[#080a02] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-lime-600/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-lime-600/10 blur-[120px] pointer-events-none z-0" />

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/aspect-ratio`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Ratio className="w-8 h-8 text-lime-400" />
            <span>{t.seoHeroTitle || 'Ratio Calculator Pro'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText}
          </p>
        </div>

        <div className="flex flex-wrap bg-lime-950/40 p-1.5 rounded-2xl border border-lime-500/10 self-start">
          <button
            onClick={() => setTab('calculate')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
              tab === 'calculate'
                ? 'bg-lime-500 text-lime-950 shadow-lg shadow-lime-500/30'
                : 'text-slate-400 hover:text-lime-400'
            }`}
          >
            <Ratio className="w-4 h-4" />
            <span>{t.tab_calculate || 'Calculate Ratio'}</span>
          </button>
          <button
            onClick={() => setTab('resize')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
              tab === 'resize'
                ? 'bg-lime-500 text-lime-950 shadow-lg shadow-lime-500/30'
                : 'text-slate-400 hover:text-lime-400'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>{t.tab_resize || 'Resize Proportionally'}</span>
          </button>
          <button
            onClick={() => setTab('presets')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer outline-none flex items-center space-x-2 ${
              tab === 'presets'
                ? 'bg-lime-500 text-lime-950 shadow-lg shadow-lime-500/30'
                : 'text-slate-400 hover:text-lime-400'
            }`}
          >
            <RectangleHorizontal className="w-4 h-4" />
            <span>{t.tab_presets || 'Common Presets'}</span>
          </button>
        </div>

        {tab === 'calculate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col bg-lime-950/20 border border-lime-500/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
                <span className="text-xs font-black text-lime-400/80 uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                  {t.label_dimensions || 'Dimensions'}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_width || 'Width'}
                  </label>
                  <input
                    type="number"
                    value={calcW}
                    onChange={(e) => setCalcW(e.target.value)}
                    placeholder="1920"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_height || 'Height'}
                  </label>
                  <input
                    type="number"
                    value={calcH}
                    onChange={(e) => setCalcH(e.target.value)}
                    placeholder="1080"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => { setCalcW('1920'); setCalcH('1080'); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 text-[11px] font-bold hover:bg-lime-500/10 hover:text-lime-400 hover:border-lime-500/20 transition-all cursor-pointer outline-none"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t.button_example || 'Example 1920×1080'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-lime-950/20 border border-lime-500/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
                <span className="text-xs font-black text-lime-400/80 uppercase tracking-wider flex items-center gap-2">
                  <Ratio className="w-3.5 h-3.5 text-lime-400" />
                  {t.label_result || 'Result'}
                </span>
                {calcResult && (
                  <CopyButton field="calc-ratio" value={`${calcResult.ratioW}:${calcResult.ratioH}`} />
                )}
              </div>
              <div className="p-5 space-y-4">
                {calcResult ? (
                  <>
                    <div className="bg-lime-950/50 border border-lime-500/20 rounded-2xl p-5 text-center">
                      <div className="text-[11px] font-bold text-lime-400/60 uppercase tracking-wider mb-2">
                        {t.label_simplified_ratio || 'Simplified Ratio'}
                      </div>
                      <div className="text-4xl font-black text-lime-400 tracking-tight font-mono">
                        {calcResult.ratioW}
                        <span className="text-lime-500/50 mx-1">:</span>
                        {calcResult.ratioH}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-lime-950/40 border border-lime-500/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-lime-400/60 uppercase tracking-wider mb-1">
                          {t.label_gcd || 'GCD'}
                        </div>
                        <div className="text-lg font-black text-lime-100 font-mono">{calcResult.gcd}</div>
                      </div>
                      <div className="bg-lime-950/40 border border-lime-500/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-lime-400/60 uppercase tracking-wider mb-1">
                          {t.label_decimal || 'Decimal'}
                        </div>
                        <div className="text-lg font-black text-lime-100 font-mono">
                          {calcResult.decimal.toFixed(3)}
                        </div>
                      </div>
                      <div className="bg-lime-950/40 border border-lime-500/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-lime-400/60 uppercase tracking-wider mb-1">
                          {t.label_input || 'Input'}
                        </div>
                        <div className="text-lg font-black text-lime-100 font-mono">
                          {calcResult.w}×{calcResult.h}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full min-h-[200px] flex items-center justify-center text-slate-500 text-sm">
                    {t.placeholder_enter_dims || 'Enter width and height to calculate the ratio...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'resize' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col bg-lime-950/20 border border-lime-500/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
                <span className="text-xs font-black text-lime-400/80 uppercase tracking-wider flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-lime-400" />
                  {t.label_original || 'Original Size'}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                      {t.label_width || 'Width'}
                    </label>
                    <input
                      type="number"
                      value={origW}
                      onChange={(e) => setOrigW(e.target.value)}
                      placeholder="1920"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                      {t.label_height || 'Height'}
                    </label>
                    <input
                      type="number"
                      value={origH}
                      onChange={(e) => setOrigH(e.target.value)}
                      placeholder="1080"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-lime-400/70 uppercase tracking-wider mb-2">
                    {t.label_lock_target || 'Target Dimension'}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setResizeTarget('width')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                        resizeTarget === 'width'
                          ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                          : 'text-slate-500 hover:text-lime-400 border-transparent'
                      }`}
                    >
                      {t.target_width || 'Target Width'}
                    </button>
                    <button
                      onClick={() => setResizeTarget('height')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none border ${
                        resizeTarget === 'height'
                          ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                          : 'text-slate-500 hover:text-lime-400 border-transparent'
                      }`}
                    >
                      {t.target_height || 'Target Height'}
                    </button>
                  </div>
                  {resizeTarget === 'width' ? (
                    <input
                      type="number"
                      value={targetW}
                      onChange={(e) => setTargetW(e.target.value)}
                      placeholder="1280"
                      className={inputClass}
                    />
                  ) : (
                    <input
                      type="number"
                      value={targetH}
                      onChange={(e) => setTargetH(e.target.value)}
                      placeholder="720"
                      className={inputClass}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col bg-lime-950/20 border border-lime-500/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
                <span className="text-xs font-black text-lime-400/80 uppercase tracking-wider flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-lime-400" />
                  {t.label_new_size || 'New Size'}
                </span>
                {resizeResult && (
                  <CopyButton field="resize-result" value={`${resizeResult.w}×${resizeResult.h}`} />
                )}
              </div>
              <div className="p-5 space-y-4">
                {resizeResult ? (
                  <>
                    <div className="bg-lime-950/50 border border-lime-500/20 rounded-2xl p-5 text-center">
                      <div className="text-[11px] font-bold text-lime-400/60 uppercase tracking-wider mb-2">
                        {t.label_result_dimensions || 'Resulting Dimensions'}
                      </div>
                      <div className="text-4xl font-black text-lime-400 tracking-tight font-mono">
                        {resizeResult.w}
                        <span className="text-lime-500/50 mx-1">×</span>
                        {resizeResult.h}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-lime-950/40 border border-lime-500/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-lime-400/60 uppercase tracking-wider mb-1">
                          {t.label_new_width || 'New Width'}
                        </div>
                        <div className="text-lg font-black text-lime-100 font-mono">{resizeResult.w}px</div>
                      </div>
                      <div className="bg-lime-950/40 border border-lime-500/10 rounded-xl p-3 text-center">
                        <div className="text-[10px] text-lime-400/60 uppercase tracking-wider mb-1">
                          {t.label_new_height || 'New Height'}
                        </div>
                        <div className="text-lg font-black text-lime-100 font-mono">{resizeResult.h}px</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full min-h-[200px] flex items-center justify-center text-slate-500 text-sm">
                    {t.placeholder_resize || 'Enter original size and a target dimension...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'presets' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESETS.map((p) => {
              const isActive = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={`text-left bg-lime-950/20 border rounded-3xl overflow-hidden shadow-2xl transition-all cursor-pointer outline-none ${
                    isActive
                      ? 'border-lime-500/50 shadow-lime-500/10'
                      : 'border-lime-500/10 hover:border-lime-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        isActive
                          ? 'bg-lime-500/20 border-lime-500/40 text-lime-400'
                          : 'bg-white/5 border-white/5 text-slate-400'
                      }`}>
                        {renderPresetIcon(p.icon, 'w-4 h-4')}
                      </span>
                      <span className="text-sm font-black text-white font-mono">{p.name}</span>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-lime-400" />}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="text-[11px] font-bold text-lime-400/70 uppercase tracking-wider">
                      {p.label}
                    </div>
                    <div className="space-y-1.5">
                      {p.resolutions.map((r) => (
                        <div
                          key={r}
                          className="flex items-center justify-between bg-lime-950/40 border border-lime-500/10 rounded-lg px-3 py-1.5"
                        >
                          <span className="text-xs font-mono text-lime-100">{r}</span>
                          <span className="text-[10px] text-lime-400/40 font-mono">px</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="bg-lime-950/20 border border-lime-500/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-3 border-b border-lime-500/10 bg-lime-950/40">
            <span className="text-xs font-black text-lime-400/80 uppercase tracking-wider flex items-center gap-2">
              <RectangleHorizontal className="w-3.5 h-3.5 text-lime-400" />
              {t.label_preview || 'Visual Preview'}
            </span>
            <span className="text-xs font-mono text-lime-400/70">{previewLabel}</span>
          </div>
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="relative flex items-center justify-center" style={{ width: 340, height: 210 }}>
              <div
                className="rounded-lg border-2 border-lime-400/60 bg-gradient-to-br from-lime-500/15 to-lime-400/5 shadow-lg shadow-lime-500/10 transition-all duration-300 ease-out flex items-center justify-center"
                style={{ width: previewDims.w, height: previewDims.h }}
              >
                <div className="w-2 h-2 rounded-full bg-lime-400/70" />
              </div>
            </div>
            <div className="text-[11px] text-lime-400/50 font-mono">
              {previewDims.w.toFixed(0)} × {previewDims.h.toFixed(0)} {t.unit_proportional || 'proportional units'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={resetWorkspace}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 text-xs font-black hover:bg-lime-500/10 hover:text-lime-400 hover:border-lime-500/20 transition-all cursor-pointer outline-none"
          >
            <RotateCcw className="w-4 h-4" />
            {t.button_reset || 'Reset All'}
          </button>
        </div>
      </main>

      <Footer
        lang={lang}
        t={t}
        onOpenModal={(modal) => setLegalModal(modal)}
      />

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
