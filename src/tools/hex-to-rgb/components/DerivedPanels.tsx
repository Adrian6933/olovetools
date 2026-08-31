import React, { useMemo, useState } from 'react';
import { Blend, Layers, Shapes, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import {
  buildRamp,
  clamp,
  deltaEOkRgb,
  formatHex,
  formatRgb,
  gamutMapOklch,
  harmony,
  mixOklch,
  oklchToRgb,
  rgbToOklch,
  type HarmonyId,
  type Rgb,
} from '../lib/color';

// ---------------------------------------------------------------------------
// Ajuste fino en OKLCH
// ---------------------------------------------------------------------------

/** Croma máximo que alcanza sRGB en cualquier tono; el deslizador llega ahí
 *  y marca a partir de dónde el color deja de existir en esta pantalla. */
const C_MAX = 0.37;

interface TunerProps {
  t: any;
  color: Rgb;
  onChange: (rgb: Rgb) => void;
}

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  gradient: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, display, gradient, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="font-mono text-xs font-bold text-white">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(parseFloat(event.target.value))}
      className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none border border-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black/40 [&::-webkit-slider-thumb]:shadow [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black/40"
      style={{ background: gradient }}
      aria-label={label}
    />
  </div>
);

/**
 * Los deslizadores trabajan en OKLCH y no en HSL a propósito: mover la
 * claridad de un amarillo y de un azul el mismo tanto por ciento en HSL da dos
 * saltos visuales completamente distintos.
 */
export const Tuner: React.FC<TunerProps> = ({ t, color, onChange }) => {
  const oklch = useMemo(() => rgbToOklch(color), [color]);
  const [showRgb, setShowRgb] = useState(false);

  const stops = (build: (i: number) => Rgb, n = 12) =>
    `linear-gradient(to right, ${Array.from({ length: n + 1 }, (_, i) => formatHex(build(i / n))).join(', ')})`;

  const lGradient = stops((k) => oklchToRgb({ ...oklch, l: k }));
  const cGradient = stops((k) => oklchToRgb({ ...oklch, c: k * C_MAX }));
  const hGradient = stops((k) => oklchToRgb({ ...oklch, h: k * 360 }), 24);

  const outOfGamut = useMemo(() => {
    const { clipped, deltaE } = gamutMapOklch(oklch);
    return clipped ? deltaE : 0;
  }, [oklch]);

  const set = (patch: Partial<typeof oklch>) =>
    onChange({ ...oklchToRgb({ ...oklch, ...patch }), a: color.a });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <SlidersHorizontal className="w-4 h-4" />
          {t.tuner_title || 'Fine tuning'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <button
          onClick={() => setShowRgb((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-[11px] font-bold text-slate-300 transition-colors cursor-pointer outline-none"
        >
          {showRgb ? t.tuner_show_oklch || 'OKLCH sliders' : t.tuner_show_rgb || 'RGB sliders'}
        </button>
      </div>

      {showRgb ? (
        <div className="space-y-4">
          {(['r', 'g', 'b'] as const).map((channel) => (
            <Slider
              key={channel}
              label={channel.toUpperCase()}
              value={Math.round(color[channel])}
              min={0}
              max={255}
              step={1}
              display={String(Math.round(color[channel]))}
              gradient={stops((k) => ({ ...color, [channel]: k * 255 }))}
              onChange={(value) => onChange({ ...color, [channel]: value })}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Slider
            label={t.tuner_lightness || 'Lightness'}
            value={oklch.l}
            min={0}
            max={1}
            step={0.001}
            display={`${(oklch.l * 100).toFixed(1)}%`}
            gradient={lGradient}
            onChange={(l) => set({ l })}
          />
          <Slider
            label={t.tuner_chroma || 'Chroma'}
            value={Math.min(oklch.c, C_MAX)}
            min={0}
            max={C_MAX}
            step={0.001}
            display={oklch.c.toFixed(3)}
            gradient={cGradient}
            onChange={(c) => set({ c })}
          />
          <Slider
            label={t.tuner_hue || 'Hue'}
            value={oklch.h}
            min={0}
            max={360}
            step={0.5}
            display={`${oklch.h.toFixed(1)}°`}
            gradient={hGradient}
            onChange={(h) => set({ h })}
          />
        </div>
      )}

      <Slider
        label={t.tuner_alpha || 'Alpha'}
        value={color.a}
        min={0}
        max={1}
        step={0.01}
        display={`${Math.round(color.a * 100)}%`}
        gradient={`linear-gradient(to right, ${formatHex(color)}00, ${formatHex(color)}ff)`}
        onChange={(a) => onChange({ ...color, a })}
      />

      {outOfGamut > 0 && (
        <p className="flex items-start gap-2 text-[11px] text-amber-400 leading-relaxed">
          <TriangleAlert className="w-4 h-4 shrink-0 mt-px" />
          {(t.tuner_gamut || 'Outside sRGB — chroma was reduced to fit, ΔE {n}.').replace(
            '{n}',
            outOfGamut.toFixed(3)
          )}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rampa
// ---------------------------------------------------------------------------

interface RampProps {
  t: any;
  color: Rgb;
  onPick: (rgb: Rgb) => void;
  onSendAll: (colors: Rgb[]) => void;
}

export const RampPanel: React.FC<RampProps> = ({ t, color, onPick, onSendAll }) => {
  const ramp = useMemo(() => buildRamp(color), [color]);
  const clipped = ramp.filter((stop) => stop.clipped).length;

  return (
    <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5 border border-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <Layers className="w-4 h-4" />
          {t.ramp_title || 'Tint and shade ramp'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <button
          onClick={() => onSendAll(ramp.filter((_, i) => i % 2 === 1).map((stop) => stop.rgb))}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-[11px] font-bold text-slate-300 transition-colors cursor-pointer outline-none"
        >
          {t.ramp_to_palette || 'Send to palette'}
        </button>
      </div>

      <div className="grid grid-cols-11 gap-1">
        {ramp.map((stop) => (
          <button
            key={stop.step}
            onClick={() => onPick(stop.rgb)}
            title={`${stop.step} · ${formatHex(stop.rgb)}${stop.clipped ? ` · ΔE ${stop.deltaE.toFixed(3)}` : ''}`}
            className="group relative aspect-[2/3] sm:aspect-[3/4] rounded-md sm:rounded-lg border border-white/10 hover:border-teal-400 hover:z-10 hover:scale-[1.08] transition-transform cursor-pointer outline-none"
            style={{ backgroundColor: formatRgb(stop.rgb) }}
          >
            <span className="absolute inset-x-0 bottom-0.5 text-[8px] sm:text-[9px] font-mono font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity text-white mix-blend-difference">
              {stop.step}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>{t.ramp_legend || 'Eleven steps built in OKLCH from your colour, anchored on the closest step.'}</span>
        {clipped > 0 && (
          <span className="text-amber-400/80">
            {(t.ramp_clipped || '{n} steps were pulled back into sRGB.').replace('{n}', String(clipped))}
          </span>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Armonías y mezcla
// ---------------------------------------------------------------------------

const HARMONIES: HarmonyId[] = [
  'complementary',
  'analogous',
  'triadic',
  'split',
  'tetradic',
  'monochrome',
];

interface HarmonyProps {
  t: any;
  color: Rgb;
  palette: Rgb[];
  onPick: (rgb: Rgb) => void;
  onSendAll: (colors: Rgb[]) => void;
}

export const HarmonyPanel: React.FC<HarmonyProps> = ({ t, color, palette, onPick, onSendAll }) => {
  const [kind, setKind] = useState<HarmonyId>('complementary');
  const [mixTarget, setMixTarget] = useState(0);
  const [mixAmount, setMixAmount] = useState(0.5);

  const swatches = useMemo(() => harmony(color, kind), [color, kind]);
  const other = palette[Math.min(mixTarget, palette.length - 1)] ?? color;
  const mixed = useMemo(() => mixOklch(color, other, mixAmount), [color, other, mixAmount]);
  const mixDistance = useMemo(() => deltaEOkRgb(color, mixed), [color, mixed]);

  const labels: Record<HarmonyId, string> = {
    complementary: t.harmony_complementary || 'Complementary',
    analogous: t.harmony_analogous || 'Analogous',
    triadic: t.harmony_triadic || 'Triadic',
    split: t.harmony_split || 'Split complementary',
    tetradic: t.harmony_tetradic || 'Tetradic',
    monochrome: t.harmony_monochrome || 'Monochrome',
  };

  return (
    <div className="glass-card rounded-3xl p-5 md:p-7 space-y-5 border border-white/5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
          <Shapes className="w-4 h-4" />
          {t.harmony_title || 'Harmonies'}
        </span>
        <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
        <button
          onClick={() => onSendAll(swatches)}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-teal-500/20 hover:border-teal-500/30 text-[11px] font-bold text-slate-300 transition-colors cursor-pointer outline-none"
        >
          {t.harmony_to_palette || 'Send to palette'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {HARMONIES.map((id) => (
          <button
            key={id}
            onClick={() => setKind(id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer outline-none ${
              kind === id
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/15'
            }`}
          >
            {labels[id]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {swatches.map((swatch, i) => (
          <button
            key={i}
            onClick={() => onPick(swatch)}
            className="group flex-1 min-w-[76px] rounded-2xl border border-white/10 hover:border-teal-400 h-24 flex items-end justify-center pb-2 transition-colors cursor-pointer outline-none"
            style={{ backgroundColor: formatRgb(swatch) }}
          >
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {formatHex(swatch)}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-white/5 pt-5 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-teal-400">
            <Blend className="w-4 h-4" />
            {t.mix_title || 'Blend'}
          </span>
          <span className="h-px flex-1 min-w-[2rem] bg-white/5" />
          <span className="font-mono text-[11px] text-slate-500">ΔE {mixDistance.toFixed(3)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500">{t.mix_with || 'with'}</span>
          {palette.map((swatch, i) => (
            <button
              key={i}
              onClick={() => setMixTarget(i)}
              className={`w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110 cursor-pointer outline-none ${
                i === mixTarget ? 'border-teal-400' : 'border-white/10'
              }`}
              style={{ backgroundColor: formatRgb(swatch) }}
              title={formatHex(swatch)}
            />
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={mixAmount}
          onChange={(event) => setMixAmount(parseFloat(event.target.value))}
          className="w-full h-3 rounded-full appearance-none cursor-pointer outline-none border border-white/10 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black/40 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-black/40"
          style={{
            background: `linear-gradient(to right, ${Array.from({ length: 11 }, (_, i) =>
              formatHex(mixOklch(color, other, i / 10))
            ).join(', ')})`,
          }}
          aria-label={t.mix_title || 'Blend'}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onPick(mixed)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-teal-400 transition-colors cursor-pointer outline-none"
            style={{ backgroundColor: formatRgb(mixed) }}
          >
            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white">
              {formatHex(mixed)}
            </span>
          </button>
          <span className="text-[11px] text-slate-500">
            {(t.mix_hint || 'Interpolated in OKLCH along the short hue arc — {n}% of the way.').replace(
              '{n}',
              String(Math.round(clamp(mixAmount, 0, 1) * 100))
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
