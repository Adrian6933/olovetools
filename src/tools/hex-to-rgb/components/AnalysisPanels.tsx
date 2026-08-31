import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Eye, Ruler, Tags } from 'lucide-react';
import {
  apcaUse,
  contrastApca,
  contrastWcag,
  deltaEOkRgb,
  formatHex,
  formatRgb,
  nearestCssName,
  nearestTailwind,
  simulateCvd,
  wcagLevel,
  type CvdType,
  type Rgb,
} from '../lib/color';

const badgeClass = (ok: boolean, warn = false) =>
  ok
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : warn
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      : 'bg-red-500/20 text-red-300 border-red-500/30';

// ---------------------------------------------------------------------------
// Contraste
// ---------------------------------------------------------------------------

interface ContrastProps {
  t: any;
  color: Rgb;
  bg: Rgb;
  onBgChange: (rgb: Rgb) => void;
  onSwap: () => void;
}

export const ContrastPanel: React.FC<ContrastProps> = ({ t, color, bg, onBgChange, onSwap }) => {
  const ratio = useMemo(() => contrastWcag(color, bg), [color, bg]);
  const level = wcagLevel(ratio);
  const lcText = useMemo(() => contrastApca(color, bg), [color, bg]);
  const lcFlipped = useMemo(() => contrastApca(bg, color), [color, bg]);
  const use = apcaUse(lcText);

  const levelLabel: Record<typeof level, string> = {
    AAA: t.wcag_aaa || 'AAA',
    AA: t.wcag_aa || 'AA',
    'AA-large': t.wcag_aa_large || 'AA · large text only',
    fail: t.wcag_fail || 'Fail',
  };
  const useLabel: Record<ReturnType<typeof apcaUse>, string> = {
    body: t.apca_body || 'Body text and below',
    large: t.apca_large || 'Headings, 24px and up',
    ui: t.apca_ui || 'Large UI text and icons only',
    none: t.apca_none || 'Not usable for text',
  };

  const presets: Array<{ label: string; rgb: Rgb }> = [
    { label: '#FFFFFF', rgb: { r: 255, g: 255, b: 255, a: 1 } },
    { label: '#000000', rgb: { r: 0, g: 0, b: 0, a: 1 } },
    { label: '#0F172A', rgb: { r: 15, g: 23, b: 42, a: 1 } },
    { label: '#F1F5F9', rgb: { r: 241, g: 245, b: 249, a: 1 } },
  ];

  return (
    <div className="glass-card rounded-3xl p-5 md:p-7 space-y-6 border border-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <Ruler className="w-4 h-4" />
          {t.contrast_title || 'Contrast'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <button
          onClick={onSwap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-[11px] font-bold text-slate-300 transition-colors cursor-pointer outline-none"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {t.contrast_swap || 'Swap'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div
          className="rounded-2xl border border-white/10 p-6 space-y-3 min-h-[190px] flex flex-col justify-center"
          style={{ backgroundColor: formatRgb(bg) }}
        >
          <p className="text-2xl font-black leading-tight" style={{ color: formatRgb(color) }}>
            {t.contrast_sample_large || 'Large heading at 24 pixels'}
          </p>
          <p className="text-base font-semibold" style={{ color: formatRgb(color) }}>
            {t.contrast_sample_medium || 'Sub-heading at 16 pixels, semi-bold'}
          </p>
          <p className="text-[13px] leading-relaxed" style={{ color: formatRgb(color) }}>
            {t.contrast_sample_body ||
              'Body copy at 13 pixels. This is the size that decides whether a colour pair is actually usable.'}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-black/30 border border-white/5 p-4 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.contrast_wcag || 'WCAG 2.1'}
              </span>
              <span className="font-mono text-2xl font-black text-white">{ratio.toFixed(2)}:1</span>
            </div>
            <span
              className={`inline-block text-[10px] font-black uppercase px-2 py-1 rounded border ${badgeClass(
                level === 'AAA' || level === 'AA',
                level === 'AA-large'
              )}`}
            >
              {levelLabel[level]}
            </span>
          </div>

          <div className="rounded-2xl bg-black/30 border border-white/5 p-4 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t.contrast_apca || 'APCA (WCAG 3 draft)'}
              </span>
              <span className="font-mono text-2xl font-black text-white">
                Lc {lcText.toFixed(1)}
              </span>
            </div>
            <span
              className={`inline-block text-[10px] font-black uppercase px-2 py-1 rounded border ${badgeClass(
                use === 'body',
                use === 'large' || use === 'ui'
              )}`}
            >
              {useLabel[use]}
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {(t.contrast_apca_flip || 'Flipped (background as text): Lc {n}').replace(
                '{n}',
                lcFlipped.toFixed(1)
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          {t.contrast_bg || 'Background'}
        </span>
        {presets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onBgChange(preset.rgb)}
            title={preset.label}
            className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer outline-none ${
              formatHex(bg) === preset.label ? 'border-teal-400' : 'border-white/10'
            }`}
            style={{ backgroundColor: preset.label }}
          />
        ))}
        <label className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white/10 hover:border-teal-500/50 cursor-pointer transition-colors">
          <span
            className="absolute inset-0"
            style={{
              background:
                'conic-gradient(#ef4444,#eab308,#22c55e,#06b6d4,#3b82f6,#a855f7,#ef4444)',
            }}
          />
          <input
            type="color"
            value={formatHex(bg)}
            onChange={(event) => {
              const hex = event.target.value.slice(1);
              onBgChange({
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16),
                a: 1,
              });
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={t.contrast_bg_custom || 'Custom background colour'}
          />
        </label>
        <span className="font-mono text-[11px] text-slate-500">{formatHex(bg)}</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Visión del color
// ---------------------------------------------------------------------------

const CVD_TYPES: CvdType[] = ['protanopia', 'deuteranopia', 'tritanopia'];

interface CvdProps {
  t: any;
  colors: Rgb[];
}

/**
 * Además de simular cada color, mide la distancia mínima entre dos colores
 * cualesquiera de la paleta bajo cada tipo de visión. Ese número es el que
 * responde a la pregunta real: "¿se van a confundir dos de mis colores?".
 */
export const CvdPanel: React.FC<CvdProps> = ({ t, colors }) => {
  const rows = useMemo(
    () =>
      CVD_TYPES.map((type) => {
        const simulated = colors.map((c) => simulateCvd(c, type));
        let min = Infinity;
        for (let i = 0; i < simulated.length; i++) {
          for (let j = i + 1; j < simulated.length; j++) {
            min = Math.min(min, deltaEOkRgb(simulated[i], simulated[j]));
          }
        }
        return { type, simulated, min: Number.isFinite(min) ? min : null };
      }),
    [colors]
  );

  const labels: Record<CvdType, string> = {
    protanopia: t.cvd_protanopia || 'Protanopia · no red cones',
    deuteranopia: t.cvd_deuteranopia || 'Deuteranopia · no green cones',
    tritanopia: t.cvd_tritanopia || 'Tritanopia · no blue cones',
  };

  return (
    <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5 border border-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <Eye className="w-4 h-4" />
          {t.cvd_title || 'Colour vision'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <span className="text-[11px] text-slate-500">
          {t.cvd_hint || 'Lowest distance between any two swatches, per vision type'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-full sm:w-44 shrink-0 text-[11px] font-bold text-slate-300">
            {t.cvd_normal || 'Typical vision'}
          </span>
          <div className="flex-1 flex rounded-xl overflow-hidden border border-white/10 h-11">
            {colors.map((c, i) => (
              <span key={i} className="flex-1" style={{ backgroundColor: formatRgb(c) }} />
            ))}
          </div>
          <span className="hidden sm:block w-16 text-right font-mono text-[11px] text-slate-500">—</span>
        </div>

        {rows.map((row) => (
          <div key={row.type} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="w-full sm:w-44 shrink-0 text-[11px] font-bold text-slate-400">
              {labels[row.type]}
            </span>
            <div className="flex-1 flex rounded-xl overflow-hidden border border-white/10 h-11">
              {row.simulated.map((c, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: formatRgb(c) }} />
              ))}
            </div>
            <span
              className={`w-full sm:w-16 sm:text-right font-mono text-[11px] font-bold ${
                row.min == null
                  ? 'text-slate-600'
                  : row.min < 0.05
                    ? 'text-red-400'
                    : row.min < 0.12
                      ? 'text-amber-400'
                      : 'text-emerald-400'
              }`}
            >
              {row.min == null ? '—' : `ΔE ${row.min.toFixed(3)}`}
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {t.cvd_legend ||
          'Under ΔE 0.05 two swatches are effectively the same colour for that viewer. Simulation follows Viénot, Brettel & Mollon (1999), applied in linear light.'}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Coincidencias con nombre
// ---------------------------------------------------------------------------

interface NearestProps {
  t: any;
  color: Rgb;
  onPick: (hex: string) => void;
}

export const NearestPanel: React.FC<NearestProps> = ({ t, color, onPick }) => {
  // La tabla de nombres CSS la resuelve el parser del navegador, que no existe
  // en el render de servidor: sin esta espera al montaje, el servidor pinta una
  // fila y el cliente dos, y React aborta la hidratación de toda la isla.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const css = useMemo(() => (mounted ? nearestCssName(color) : null), [color, mounted]);
  const tw = useMemo(() => nearestTailwind(color), [color]);

  const row = (
    key: string,
    label: string,
    match: { name: string; hex: string; deltaE: number; exact: boolean } | null
  ) => {
    if (!match) return null;
    return (
      <button
        key={key}
        onClick={() => onPick(match.hex)}
        className="flex items-center gap-3 w-full text-left rounded-xl bg-black/30 border border-white/5 hover:border-teal-500/30 px-3 py-2.5 transition-colors cursor-pointer outline-none"
      >
        <span
          className="w-9 h-9 rounded-lg border border-white/10 shrink-0"
          style={{ backgroundColor: match.hex }}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
            {label}
          </span>
          <span className="block font-mono text-sm text-white truncate">{match.name}</span>
        </span>
        <span
          className={`font-mono text-[11px] font-bold shrink-0 ${
            match.exact ? 'text-emerald-400' : match.deltaE < 0.02 ? 'text-teal-400' : 'text-slate-500'
          }`}
        >
          {match.exact ? t.nearest_exact || 'exact' : `ΔE ${match.deltaE.toFixed(3)}`}
        </span>
      </button>
    );
  };

  return (
    <div className="glass-card rounded-3xl p-5 md:p-7 space-y-4 border border-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <Tags className="w-4 h-4" />
          {t.nearest_title || 'Closest named colours'}
        </span>
      </div>
      <div className="space-y-2">
        {row('css', t.nearest_css || 'CSS keyword', css)}
        {row('tw', t.nearest_tw || 'Tailwind token', tw)}
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        {t.nearest_legend ||
          'Distance is ΔE in OKLab, where roughly 0.02 is the point most people start to see two swatches as different colours. Click a row to jump to that exact colour.'}
      </p>
    </div>
  );
};
