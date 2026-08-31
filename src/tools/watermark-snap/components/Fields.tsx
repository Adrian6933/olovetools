import React from 'react';

// ============================================================================
// Controles compartidos del panel. Nada exótico: mantienen el mismo lenguaje
// visual (ámbar sobre vidrio) en todos los ajustes.
// ============================================================================

export const FieldLabel: React.FC<{ children: React.ReactNode; hint?: string }> = ({ children, hint }) => (
  <label title={hint} className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
    {children}
  </label>
);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, unit = '', hint, onChange, onCommit }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-baseline gap-2">
      <FieldLabel hint={hint}>{label}</FieldLabel>
      <span className="text-[11px] text-amber-400 font-black tabular-nums">
        {Number.isInteger(value) ? value : value.toFixed(2)}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      onPointerUp={onCommit}
      onKeyUp={onCommit}
      className="w-full accent-amber-500 cursor-pointer"
    />
  </div>
);

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onCommit?: () => void;
  /** Muestra un control de alfa además del color (para placas y sombras). */
  alpha?: boolean;
}

/** Convierte entre `#rrggbb` + alfa y la cadena `rgba()` que guarda la capa. */
function splitColor(value: string): { hex: string; alpha: number } {
  const rgba = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i);
  if (rgba) {
    const to2 = (n: string) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))).toString(16).padStart(2, '0');
    return { hex: `#${to2(rgba[1])}${to2(rgba[2])}${to2(rgba[3])}`, alpha: rgba[4] === undefined ? 1 : parseFloat(rgba[4]) };
  }
  return { hex: /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000', alpha: 1 };
}

function joinColor(hex: string, alpha: number): string {
  if (alpha >= 1) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange, onCommit, alpha = false }) => {
  const parts = splitColor(value);
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={parts.hex}
          onChange={e => onChange(joinColor(e.target.value, parts.alpha))}
          onBlur={onCommit}
          className="w-9 h-9 shrink-0 rounded-lg border border-white/10 bg-transparent cursor-pointer p-0"
        />
        {alpha ? (
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={parts.alpha}
            onChange={e => onChange(joinColor(parts.hex, parseFloat(e.target.value)))}
            onPointerUp={onCommit}
            className="flex-1 min-w-0 accent-amber-500 cursor-pointer"
          />
        ) : (
          <input
            type="text"
            value={parts.hex}
            onChange={e => onChange(e.target.value)}
            onBlur={onCommit}
            className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white uppercase outline-none focus:border-amber-500/60 transition-colors"
          />
        )}
      </div>
    </div>
  );
};

interface SegmentedProps<T extends string> {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode; title?: string }[];
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.title || opt.label}
          className={`flex-1 min-w-[58px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none outline-none ${
            value === opt.value ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {opt.icon}
          <span className="truncate">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }> = ({
  label,
  checked,
  onChange,
  hint,
}) => (
  <label
    title={hint}
    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      className="w-3.5 h-3.5 accent-amber-500 cursor-pointer"
    />
    {label}
  </label>
);

export const Section: React.FC<{ title: string; children: React.ReactNode; action?: React.ReactNode }> = ({
  title,
  children,
  action,
}) => (
  <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</span>
      {action}
    </div>
    {children}
  </div>
);
