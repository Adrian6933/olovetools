import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Check, ChevronDown, Copy, Lock } from 'lucide-react';

import {
  buildSnippets,
  identifySize,
  megapixels,
  orientation,
  parseDimension,
  ratioDrift,
  resizeProportional,
  simplifyRatio,
  sizesForRatio,
} from '../lib/ratio';
import type { Size } from '../types';

export interface CalcState {
  w1: string;
  h1: string;
  w2: string;
  h2: string;
  /** The side of the new size the person typed; the other one is computed. */
  pinned: 'w2' | 'h2';
}

export const DEFAULT_CALC: CalcState = { w1: '1920', h1: '1080', w2: '1280', h2: '', pinned: 'w2' };

/** The ratios people reach for most, in the order they reach for them. */
export const QUICK_RATIOS: { label: string; w: number; h: number }[] = [
  { label: '16:9', w: 1920, h: 1080 },
  { label: '9:16', w: 1080, h: 1920 },
  { label: '4:3', w: 1440, h: 1080 },
  { label: '1:1', w: 1080, h: 1080 },
  { label: '4:5', w: 1080, h: 1350 },
  { label: '3:2', w: 1620, h: 1080 },
  { label: '21:9', w: 2560, h: 1080 },
  { label: '2.39:1', w: 2048, h: 858 },
];

const MULTIPLES = [1, 2, 4, 8, 16];

const pct = (fraction: number): string => {
  const v = fraction * 100;
  if (v === 0) return '0%';
  if (v < 0.01) return '<0.01%';
  return v < 1 ? `${v.toFixed(2)}%` : `${v.toFixed(1)}%`;
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100));

interface Props {
  t: any;
  state: CalcState;
  onChange: (next: CalcState) => void;
}

/**
 * The calculator everybody means by "aspect ratio calculator":
 * W1 × H1 gives the ratio, and W2 × H2 keeps it — type either side and the
 * other one follows. Works with a ratio (16 × 9) as well as with pixels.
 */
export function Calculator({ t, state, onChange }: Props) {
  const [maxDen, setMaxDen] = useState(40);
  const [multiple, setMultiple] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);

  const src: Size = { w: parseDimension(state.w1), h: parseDimension(state.h1) };
  const valid = src.w > 0 && src.h > 0;

  const result = useMemo(() => {
    if (!valid) return null;
    const ratio = simplifyRatio(src.w, src.h, maxDen);
    const known = identifySize({ w: Math.round(src.w), h: Math.round(src.h) });
    return { ratio, known, orient: orientation(ratio.decimal) };
  }, [valid, src.w, src.h, maxDen]);

  // The new size: the pinned side is what was typed, the other is derived.
  const resized = useMemo(() => {
    if (!valid) return null;
    const target = parseDimension(state.pinned === 'w2' ? state.w2 : state.h2);
    if (!(target > 0)) return null;
    const size = resizeProportional(src, target, state.pinned === 'w2' ? 'width' : 'height', multiple);
    return size.w > 0 ? { size, drift: ratioDrift(src, size) } : null;
  }, [valid, src.w, src.h, state.pinned, state.w2, state.h2, multiple]);

  const sameRatio = useMemo(() => (result ? sizesForRatio(src.w, src.h) : []), [result, src.w, src.h]);

  const set = (patch: Partial<CalcState>) => onChange({ ...state, ...patch });

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(c => (c === key ? null : c)), 1500);
    } catch {
      /* the value is on screen */
    }
  };

  const ratioText = result
    ? result.known?.ratio.cinemaLabel && result.known.error < 0.002 && !result.known.flipped
      ? result.known.ratio.cinemaLabel
      : `${result.ratio.w}:${result.ratio.h}`
    : '—';

  const knownName = result?.known
    ? `${t[result.known.ratio.labelKey] || result.known.ratio.label}${result.known.flipped ? ` (${t.rotated || 'rotated'})` : ''}`
    : null;

  const orientLabel = result
    ? result.orient === 'landscape'
      ? t.orient_landscape || 'Landscape'
      : result.orient === 'portrait'
        ? t.orient_portrait || 'Portrait'
        : t.orient_square || 'Square'
    : '';

  const shownW2 = state.pinned === 'w2' ? state.w2 : resized ? String(resized.size.w) : '';
  const shownH2 = state.pinned === 'h2' ? state.h2 : resized ? String(resized.size.h) : '';
  const looksLikePixels = src.w * src.h >= 10_000;

  // Preview box: the shape of the ratio, inside a fixed area.
  const box = (() => {
    if (!result) return { w: 160, h: 90 };
    const d = result.ratio.decimal;
    const maxW = 220, maxH = 160;
    return d >= maxW / maxH ? { w: maxW, h: maxW / d } : { w: maxH * d, h: maxH };
  })();

  const field =
    'w-full min-w-0 h-14 px-4 rounded-2xl bg-black/40 border border-lime-500/20 text-white text-xl font-black font-mono tabular-nums focus:outline-none focus:border-lime-400 focus:bg-black/60 transition-colors';
  const label = 'block text-[11px] font-black uppercase tracking-widest text-lime-300/70 mb-1.5';

  const CopyBtn = ({ k, v }: { k: string; v: string }) => (
    <button
      type="button"
      onClick={() => copy(k, v)}
      aria-label={t.tooltip_copy || 'Copy'}
      className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-white/5 hover:bg-lime-500/20 text-slate-300 hover:text-lime-300 cursor-pointer"
    >
      {copied === k ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Quick ratios */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t.quickRatios || 'Common ratios'}>
        {QUICK_RATIOS.map(q => {
          const active = Math.round(src.w) === q.w && Math.round(src.h) === q.h;
          return (
            <button
              key={q.label}
              onClick={() => set({ w1: String(q.w), h1: String(q.h) })}
              className={`snap-start shrink-0 px-3.5 h-10 rounded-xl text-sm font-black font-mono border cursor-pointer transition-colors ${
                active ? 'bg-lime-400 text-lime-950 border-lime-300' : 'bg-white/5 border-white/10 text-slate-300 hover:text-lime-300 hover:border-lime-500/40'
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-stretch">
        <div className="space-y-4 min-w-0">
          {/* Original size or ratio */}
          <fieldset className="rounded-2xl bg-lime-950/25 border border-lime-500/15 p-4">
            <legend className="px-1 text-sm font-black text-white">{t.calcOriginal || 'Original size (or a ratio)'}</legend>
            <div className="flex items-end gap-2">
              <label className="flex-1 min-w-0">
                <span className={label}>{t.label_width || 'Width'}</span>
                <input inputMode="decimal" value={state.w1} onChange={e => set({ w1: e.target.value })} className={field} aria-label={t.label_width || 'Width'} />
              </label>
              <button
                onClick={() => set({ w1: state.h1, h1: state.w1 })}
                className="h-14 w-11 shrink-0 rounded-2xl bg-white/5 hover:bg-lime-500/20 text-slate-300 hover:text-lime-300 flex items-center justify-center cursor-pointer"
                aria-label={t.button_swap || 'Swap'}
                title={t.button_swap || 'Swap'}
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
              <label className="flex-1 min-w-0">
                <span className={label}>{t.label_height || 'Height'}</span>
                <input inputMode="decimal" value={state.h1} onChange={e => set({ h1: e.target.value })} className={field} aria-label={t.label_height || 'Height'} />
              </label>
            </div>
          </fieldset>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-lime-400/15 to-lime-500/5 border border-lime-400/30 p-4 flex items-center gap-4" aria-live="polite">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-lime-300/80">{t.label_simplified_ratio || 'Aspect ratio'}</p>
              <p className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight">{ratioText}</p>
              {result && (
                <p className="text-sm text-slate-300 mt-1">
                  {knownName ? <span className="font-bold text-lime-200">{knownName}</span> : null}
                  {knownName ? ' · ' : ''}
                  {orientLabel} · {result.ratio.decimal.toFixed(3)}
                  {looksLikePixels ? ` · ${megapixels(src).toFixed(2)} MP` : ''}
                  {!result.ratio.exact && (
                    <span className="text-amber-300"> · {(t.label_error || 'off by {p}').replace('{p}', pct(result.ratio.error))}</span>
                  )}
                </p>
              )}
              {!result && <p className="text-sm text-slate-400">{t.placeholder_enter_dims || 'Enter a width and a height to get the ratio.'}</p>}
            </div>
            {result && <CopyBtn k="ratio" v={ratioText} />}
          </div>

          {/* New size keeping the ratio */}
          <fieldset className="rounded-2xl bg-lime-950/25 border border-lime-500/15 p-4">
            <legend className="px-1 text-sm font-black text-white">{t.calcNew || 'New size, same ratio'}</legend>
            <p className="text-xs text-slate-400 mb-3">{t.calcNewHint || 'Type the width or the height you need: the other side is calculated.'}</p>
            <div className="flex items-end gap-2">
              <label className="flex-1 min-w-0">
                <span className={label}>
                  {t.label_width || 'Width'} {state.pinned === 'w2' && <Lock className="inline w-3 h-3 -mt-0.5" />}
                </span>
                <input
                  inputMode="decimal"
                  value={shownW2}
                  onChange={e => set({ w2: e.target.value, pinned: 'w2' })}
                  className={`${field} ${state.pinned === 'h2' ? 'text-lime-300' : ''}`}
                  aria-label={t.target_width || 'New width'}
                />
              </label>
              <span className="h-14 w-6 flex items-center justify-center text-slate-500 font-black">×</span>
              <label className="flex-1 min-w-0">
                <span className={label}>
                  {t.label_height || 'Height'} {state.pinned === 'h2' && <Lock className="inline w-3 h-3 -mt-0.5" />}
                </span>
                <input
                  inputMode="decimal"
                  value={shownH2}
                  onChange={e => set({ h2: e.target.value, pinned: 'h2' })}
                  className={`${field} ${state.pinned === 'w2' ? 'text-lime-300' : ''}`}
                  aria-label={t.target_height || 'New height'}
                />
              </label>
              {resized && <CopyBtn k="size" v={`${resized.size.w}×${resized.size.h}`} />}
            </div>
            {resized && resized.drift > 0 && (
              <p className={`text-xs mt-2 font-bold ${resized.drift > 0.002 ? 'text-amber-300' : 'text-slate-400'}`}>
                {(t.label_drift || 'ratio drifts by {p}').replace('{p}', pct(resized.drift))}
              </p>
            )}
          </fieldset>
        </div>

        {/* Preview */}
        <div className="hidden md:flex md:w-64 rounded-2xl bg-black/30 border border-white/10 items-center justify-center p-4">
          <figure className="flex flex-col items-center gap-3">
            <div
              className="rounded-md border-2 border-lime-400 bg-lime-400/10 flex items-center justify-center text-lime-200 text-sm font-black font-mono transition-all duration-300"
              style={{ width: box.w, height: box.h }}
            >
              {ratioText}
            </div>
            {valid && (
              <figcaption className="text-xs text-slate-400 font-mono">
                {fmt(src.w)} × {fmt(src.h)}
              </figcaption>
            )}
          </figure>
        </div>
      </div>

      {/* Same-ratio sizes */}
      {sameRatio.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">{t.sameRatioTitle || 'Sizes with this ratio'}</p>
          <div className="flex flex-wrap gap-2">
            {sameRatio.map(s => (
              <button
                key={`${s.w}x${s.h}`}
                onClick={() => set({ w2: String(s.w), pinned: 'w2' })}
                className="px-3 h-9 rounded-xl bg-white/5 border border-white/10 hover:border-lime-500/40 hover:text-lime-300 text-sm font-bold font-mono text-slate-300 cursor-pointer"
              >
                {s.w}×{s.h}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced */}
      <details className="group rounded-2xl border border-white/10 bg-black/20">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none text-sm font-bold text-slate-300 [&::-webkit-details-marker]:hidden">
          {t.advancedTitle || 'Advanced options and code'}
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4 space-y-5">
          <div>
            <label htmlFor="ar-maxden" className="block text-xs font-bold text-slate-300 mb-1">
              {t.label_max_den || 'Largest denominator'}: <span className="font-mono text-lime-300">{maxDen}</span>
            </label>
            <input id="ar-maxden" type="range" min={4} max={1000} value={maxDen} onChange={e => setMaxDen(Number(e.target.value))} className="w-full accent-lime-400" />
            <p className="text-xs text-slate-500 mt-1">{(t.hint_max_den || 'Keeps the ratio readable. At {n}, 1998×1080 comes back as 1.85:1 instead of 999:540.').replace('{n}', String(maxDen))}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-300 mb-1.5">{t.label_multiple || 'Snap both sides to a multiple of'}</p>
            <div className="flex gap-1.5">
              {MULTIPLES.map(m => (
                <button
                  key={m}
                  onClick={() => setMultiple(m)}
                  className={`px-3 h-9 rounded-lg text-xs font-black border cursor-pointer ${multiple === m ? 'bg-lime-400 text-lime-950 border-lime-300' : 'bg-white/5 border-white/10 text-slate-300'}`}
                >
                  {m === 1 ? t.multiple_none || 'off' : m}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t.hint_multiple || 'H.264 refuses odd dimensions and most hardware encoders want multiples of 4 or 8.'}</p>
          </div>
          {result && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-300">{t.label_snippets || 'Ready to paste'}</p>
              {buildSnippets(result.ratio, resized ? resized.size : { w: Math.round(src.w), h: Math.round(src.h) }).map(s => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl bg-black/40 border border-white/5 pl-3 pr-1.5 py-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-lime-300/70 w-20 shrink-0">{s.label}</span>
                  <code className="flex-1 min-w-0 truncate text-xs text-slate-300 font-mono">{s.code}</code>
                  <CopyBtn k={s.id} v={s.code} />
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
