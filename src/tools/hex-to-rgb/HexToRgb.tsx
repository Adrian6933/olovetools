import React, { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AdBanner } from '../../components/shared/AdBanner';
import { LegalModal } from './components/LegalModal';
import { Palette, Copy, Check, RotateCcw, Eye, Contrast, Pipette } from 'lucide-react';
import { legalTranslations } from '../../locales/legal';

interface HexToRgbProps {
  lang: string;
  dictionary: any;
}

const DEFAULT_HEX = 'FF6347';

const normalizeHex = (input: string): string | null => {
  let value = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    value = value.split('').map((c) => c + c).join('');
  }
  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return value.toUpperCase();
  }
  return null;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rN) {
      h = ((gN - bN) / delta) % 6;
    } else if (max === gN) {
      h = (bN - rN) / delta + 2;
    } else {
      h = (rN - gN) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

const rgbToCmyk = (r: number, g: number, b: number): { c: number; m: number; y: number; k: number } => {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const k = 1 - Math.max(rN, gN, bN);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = (1 - rN - k) / (1 - k);
  const m = (1 - gN - k) / (1 - k);
  const y = (1 - bN - k) / (1 - k);
  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100),
  };
};

const relativeLuminance = (r: number, g: number, b: number): number => {
  const channel = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastRatio = (l1: number, l2: number): number => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const wcagBadge = (ratio: number): { label: string; pass: boolean } => {
  if (ratio >= 7) return { label: 'AAA', pass: true };
  if (ratio >= 4.5) return { label: 'AA', pass: true };
  if (ratio >= 3) return { label: 'AA Large', pass: true };
  return { label: 'Fail', pass: false };
};

const CopyCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  copied: boolean;
  onCopy: () => void;
  copyLabel: string;
  copiedLabel: string;
}> = ({ label, value, icon, copied, onCopy, copyLabel, copiedLabel }) => (
  <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-teal-500/20 transition-colors group">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-teal-400/80 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <button
        onClick={onCopy}
        disabled={!value}
        title={copied ? copiedLabel : copyLabel}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all cursor-pointer outline-none ${
          copied
            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            : 'bg-white/5 border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
    <div className="font-mono text-sm text-white break-all min-h-[1.25rem] select-all">
      {value || <span className="text-slate-600">â€”</span>}
    </div>
  </div>
);

export default function HexToRgb({ lang, dictionary }: HexToRgbProps) {
  const t = dictionary || {};
  const [hexInput, setHexInput] = useState<string>(DEFAULT_HEX);
  const [opacity, setOpacity] = useState<number>(100);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  const rgb = useMemo(() => hexToRgb(hexInput), [hexInput]);
  const normalizedHex = useMemo(() => normalizeHex(hexInput), [hexInput]);
  const isValid = normalizedHex !== null;

  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null), [rgb]);
  const cmyk = useMemo(() => (rgb ? rgbToCmyk(rgb.r, rgb.g, rgb.b) : null), [rgb]);

  const alpha = opacity / 100;

  const hexOutput = useMemo(() => {
    if (!normalizedHex) return '';
    if (opacity >= 100) return `#${normalizedHex}`;
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
    return `#${normalizedHex}${alphaHex}`;
  }, [normalizedHex, opacity, alpha]);

  const rgbOutput = useMemo(() => {
    if (!rgb) return '';
    if (opacity >= 100) return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(2)})`;
  }, [rgb, opacity, alpha]);

  const hslOutput = useMemo(() => {
    if (!hsl) return '';
    if (opacity >= 100) return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha.toFixed(2)})`;
  }, [hsl, opacity, alpha]);

  const cmykOutput = useMemo(() => {
    if (!cmyk) return '';
    if (opacity >= 100) return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
    return `cmyka(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%, ${alpha.toFixed(2)})`;
  }, [cmyk, opacity, alpha]);

  const previewColor = useMemo(() => {
    if (!rgb) return 'transparent';
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }, [rgb, alpha]);

  const contrastInfo = useMemo(() => {
    if (!rgb) return null;
    const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
    const whiteRatio = contrastRatio(1, lum);
    const blackRatio = contrastRatio(lum, 0);
    return {
      white: whiteRatio,
      black: blackRatio,
      whiteBadge: wcagBadge(whiteRatio),
      blackBadge: wcagBadge(blackRatio),
      recommended: whiteRatio >= blackRatio ? 'white' : 'black',
    };
  }, [rgb]);

  const copyToClipboard = (field: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
  };

  const handlePickerChange = (value: string) => {
    setHexInput(value.replace(/^#/, '').toUpperCase());
  };

  const resetWorkspace = useCallback(() => {
    setHexInput(DEFAULT_HEX);
    setOpacity(100);
    setCopiedField(null);
  }, []);

  const checkerStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(45deg, #0f1f1c 25%, transparent 25%), linear-gradient(-45deg, #0f1f1c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #0f1f1c 75%), linear-gradient(-45deg, transparent 75%, #0f1f1c 75%)',
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#020a08] text-slate-200 font-sans relative overflow-x-hidden pt-24">
      
      

      <Header
        currentLang={lang}
        onLanguageChange={(l) => (window.location.href = `/${l.toLowerCase()}/hex-to-rgb`)}
        onReset={resetWorkspace}
        t={t}
      />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-12 py-8 relative z-10 flex flex-col space-y-8">
        {/* Bloque AdSense Horizontal */}
        <AdBanner id="adsense-hex-to-rgb-top" />
        <div className="text-center md:text-left space-y-2">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
            <Palette className="w-8 h-8 text-teal-400" />
            <span>{t.seoHeroTitle || 'Color Converter Studio'}</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-3xl leading-relaxed">
            {t.seoHeroText ||
              'Convert between HEX, RGB, HSL and CMYK color formats with opacity and contrast tools 100% locally.'}
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl border border-teal-500/10 relative" style={checkerStyle}>
          <div
            className="h-36 md:h-44 w-full transition-colors duration-200 flex items-end justify-between p-5"
            style={{ backgroundColor: previewColor }}
          >
            <div className="flex items-center gap-2 backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
              <Eye className="w-4 h-4 text-white" />
              <span className="text-xs font-bold text-white tracking-wide">
                {isValid ? `#${normalizedHex}` : 'Invalid'}
              </span>
            </div>
            {rgb && (
              <div className="backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-xs font-mono text-white">
                  {rgb.r}, {rgb.g}, {rgb.b}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col bg-slate-900/40 border border-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
          <div className="space-y-3">
            <label className="block text-xs font-black text-teal-400 uppercase tracking-widest text-left">
              {t.label_hex_input || 'HEX Color'}
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-grow flex items-center">
                <Pipette className="absolute left-4 w-5 h-5 text-teal-400 pointer-events-none" />
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="FF6347"
                  spellCheck={false}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-950/50 border font-mono text-sm uppercase tracking-wider text-white placeholder-slate-600 focus:ring-0 transition-colors outline-none ${
                    isValid
                      ? 'border-white/5 focus:border-teal-500/50'
                      : 'border-red-500/40 focus:border-red-500/60'
                  }`}
                />
                {!isValid && hexInput.length > 0 && (
                  <span className="absolute right-4 text-[10px] font-bold text-red-400">
                    {t.error_invalid_hex || 'Invalid HEX'}
                  </span>
                )}
              </div>
              <div className="relative flex items-center gap-3 bg-slate-950/50 border border-white/5 rounded-2xl px-4 py-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t.label_picker || 'Picker'}
                </span>
                <label className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 cursor-pointer flex items-center justify-center hover:border-teal-500/40 transition-colors shrink-0">
                  <input
                    type="color"
                    value={isValid ? `#${normalizedHex}` : '#FF6347'}
                    onChange={(e) => handlePickerChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Palette className="w-5 h-5 text-teal-400 pointer-events-none" />
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CopyCard
              label="HEX"
              value={hexOutput}
              icon={<Palette className="w-3 h-3" />}
              copied={copiedField === 'hex'}
              onCopy={() => copyToClipboard('hex', hexOutput)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
            <CopyCard
              label="RGB"
              value={rgbOutput}
              icon={<Eye className="w-3 h-3" />}
              copied={copiedField === 'rgb'}
              onCopy={() => copyToClipboard('rgb', rgbOutput)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
            <CopyCard
              label="HSL"
              value={hslOutput}
              icon={<Contrast className="w-3 h-3" />}
              copied={copiedField === 'hsl'}
              onCopy={() => copyToClipboard('hsl', hslOutput)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
            <CopyCard
              label="CMYK"
              value={cmykOutput}
              icon={<Pipette className="w-3 h-3" />}
              copied={copiedField === 'cmyk'}
              onCopy={() => copyToClipboard('cmyk', cmykOutput)}
              copyLabel={t.tooltip_copy || 'Copy'}
              copiedLabel={t.emailCopied || 'Copied!'}
            />
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-teal-400 uppercase tracking-widest text-left flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" />
                {t.label_opacity || 'Opacity'}
              </label>
              <span className="text-sm font-mono font-bold text-white">{opacity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950/60 rounded-full appearance-none cursor-pointer accent-teal-500 outline-none"
              style={{
                background: `linear-gradient(to right, #14b8a6 ${opacity}%, rgba(255,255,255,0.05) ${opacity}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Contrast className="w-3.5 h-3.5 text-teal-400" />
              <label className="text-xs font-black text-teal-400 uppercase tracking-widest text-left">
                {t.label_contrast || 'Contrast Checker'}
              </label>
            </div>

            {contrastInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border border-white/5 min-h-[120px]"
                  style={{ backgroundColor: `rgb(${rgb!.r}, ${rgb!.g}, ${rgb!.b})` }}
                >
                  <span className="text-3xl font-black" style={{ color: '#ffffff' }}>
                    Aa
                  </span>
                  <span className="text-xs font-mono" style={{ color: '#ffffff' }}>
                    {t.label_white_text || 'White Text'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold bg-black/40 text-white px-2 py-0.5 rounded">
                      {contrastInfo.white.toFixed(2)}:1
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        contrastInfo.whiteBadge.pass
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : 'bg-red-500/30 text-red-200'
                      }`}
                    >
                      {contrastInfo.whiteBadge.label}
                    </span>
                    {contrastInfo.recommended === 'white' && (
                      <span className="text-[9px] font-black uppercase text-emerald-300">
                        {t.label_recommended || 'Best'}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="rounded-2xl p-6 flex flex-col items-center justify-center gap-2 border border-white/5 min-h-[120px]"
                  style={{ backgroundColor: `rgb(${rgb!.r}, ${rgb!.g}, ${rgb!.b})` }}
                >
                  <span className="text-3xl font-black" style={{ color: '#000000' }}>
                    Aa
                  </span>
                  <span className="text-xs font-mono" style={{ color: '#000000' }}>
                    {t.label_black_text || 'Black Text'}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold bg-white/60 text-black px-2 py-0.5 rounded">
                      {contrastInfo.black.toFixed(2)}:1
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        contrastInfo.blackBadge.pass
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : 'bg-red-500/30 text-red-200'
                      }`}
                    >
                      {contrastInfo.blackBadge.label}
                    </span>
                    {contrastInfo.recommended === 'black' && (
                      <span className="text-[9px] font-black uppercase text-emerald-300">
                        {t.label_recommended || 'Best'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-6 text-center text-xs text-slate-500">
                {t.message_invalid_contrast || 'Enter a valid HEX color to check contrast.'}
              </div>
            )}
          </div>

          <div className="border-t border-white/5 pt-6 flex justify-end">
            <button
              onClick={resetWorkspace}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-slate-300 hover:text-teal-400 text-xs font-bold transition-all cursor-pointer outline-none"
            >
              <RotateCcw className="w-4 h-4" />
              {t.button_reset || 'Reset'}
            </button>
          </div>
        </div>
      {/* Bloque AdSense Horizontal */}
      <AdBanner id="adsense-hex-to-rgb-bottom" />
      </main>

      <Footer lang={lang} t={t} onOpenModal={(modal) => setLegalModal(modal)} />

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
