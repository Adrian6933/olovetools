import React, { useMemo, useState } from 'react';
import { Eye, Plus, ShieldCheck } from 'lucide-react';
import {
  contrastRatio,
  harmony,
  rgbToHex,
  simulateCvd,
  wcagGrade,
  type CvdType,
  type HarmonyKind,
  type RGB,
} from '../lib/color';
import type { Swatch } from '../lib/quantize';

// ============================================================================
// The panel the old tool had no equivalent of: is this palette readable, does
// it survive colour blindness, and what pairs well with the colour you picked.
// ============================================================================

interface InspectorProps {
  palette: Swatch[];
  selected: number;
  t: any;
  onAdd: (color: RGB) => void;
  canAdd: boolean;
}

const CVD_TYPES: CvdType[] = ['protanopia', 'deuteranopia', 'tritanopia'];
const HARMONIES: HarmonyKind[] = [
  'complementary',
  'analogous',
  'triadic',
  'splitComplementary',
  'tetradic',
  'monochrome',
];

const GRADE_STYLE: Record<string, string> = {
  AAA: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  AA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'AA-large': 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  fail: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
};

export const Inspector: React.FC<InspectorProps> = ({ palette, selected, t, onAdd, canAdd }) => {
  const [kind, setKind] = useState<HarmonyKind>('complementary');
  const [cvd, setCvd] = useState<CvdType | null>(null);

  const base = palette[selected] || palette[0];

  const pairs = useMemo(() => {
    if (!base) return [];
    const refs: Array<{ color: RGB; key: string; fallback: string }> = [
      { color: { r: 255, g: 255, b: 255 }, key: 'onWhite', fallback: 'on white' },
      { color: { r: 0, g: 0, b: 0 }, key: 'onBlack', fallback: 'on black' },
      ...palette
        .filter((_, i) => i !== selected)
        .map(c => ({ color: c as RGB, key: '', fallback: rgbToHex(c.r, c.g, c.b) })),
    ];
    return refs.map(ref => {
      const ratio = contrastRatio(base, ref.color);
      return { ...ref, ratio, grade: wcagGrade(ratio) };
    });
  }, [base, palette, selected]);

  const suggestions = useMemo(() => (base ? harmony(base, kind) : []), [base, kind]);

  if (!base) return null;

  const shown = cvd ? palette.map(c => simulateCvd(c, cvd)) : palette;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Contrast                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-black text-rose-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.contrastTitle || 'Contrast check'}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          {t.contrastHint || 'WCAG 2.1 ratio of the selected colour against white, black and every other swatch.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {pairs.slice(0, 8).map((pair, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/[0.02] border border-white/5"
            >
              <span
                className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-black border border-white/10"
                style={{
                  backgroundColor: rgbToHex(pair.color.r, pair.color.g, pair.color.b),
                  color: rgbToHex(base.r, base.g, base.b),
                }}
              >
                Aa
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-white tabular-nums">{pair.ratio.toFixed(2)}:1</div>
                <div className="text-[10px] text-slate-600 font-medium truncate">
                  {pair.key ? t[pair.key] || pair.fallback : pair.fallback}
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase border shrink-0 ${
                  GRADE_STYLE[pair.grade]
                }`}
              >
                {pair.grade === 'AA-large' ? 'AA+' : pair.grade === 'fail' ? (t.gradeFail || 'Fail') : pair.grade}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Colour vision                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-black text-rose-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
          <Eye className="w-3.5 h-3.5" />
          {t.cvdTitle || 'Colour vision'}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCvd(null)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
              cvd === null
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {t.cvdNormal || 'Normal'}
          </button>
          {CVD_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setCvd(cvd === type ? null : type)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                cvd === type
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {t[`cvd_${type}`] || type}
            </button>
          ))}
        </div>
        <div className="flex h-12 rounded-xl overflow-hidden border border-white/5">
          {shown.map((c, i) => (
            <div
              key={i}
              className="flex-1 transition-colors duration-300"
              style={{ backgroundColor: rgbToHex(c.r, c.g, c.b) }}
              title={rgbToHex(c.r, c.g, c.b)}
            />
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Harmonies                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-black text-rose-400/80 uppercase tracking-[0.2em]">
          {t.harmonyTitle || 'Harmonies'}
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {HARMONIES.map(h => (
            <button
              key={h}
              onClick={() => setKind(h)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                kind === h
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {t[`harmony_${h}`] || h}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {suggestions.map((c, i) => {
            const hex = rgbToHex(c.r, c.g, c.b);
            return (
              <button
                key={`${hex}-${i}`}
                onClick={() => onAdd(c)}
                disabled={!canAdd}
                className="group flex items-center gap-2 p-1.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={t.addToPalette || 'Add to palette'}
              >
                <span className="w-8 h-8 rounded-lg shrink-0 border border-white/10" style={{ backgroundColor: hex }} />
                <span className="font-mono text-[11px] font-bold text-slate-300 truncate">{hex}</span>
                <Plus className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400 transition-colors shrink-0 ml-auto" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Inspector;
