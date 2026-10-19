// Piezas pequeñas que repiten todos los paneles del editor de marca: así cada
// deslizador, interruptor y color se ve y se comporta igual en todas partes.
import React from 'react';
import type { WatermarkConfig } from '../../types';
import { formatWatermarkText, getFontCss } from '../../services/watermarkService';

export type Tr = (clave: string, respaldo: string) => string;

export const Section: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({ title, children, right }) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between gap-2">
      <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400">{title}</h4>
      {right}
    </div>
    {children}
  </section>
);

export const Slider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, unit = '', onChange }) => (
  <label className="block">
    <span className="flex justify-between text-xs font-bold text-gray-300 mb-2">
      <span>{label}</span>
      <span className="font-mono text-twitch">{value}{unit}</span>
    </span>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
      className="w-full accent-twitch h-1.5 cursor-pointer"
    />
  </label>
);

export const Toggle: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode }> = ({ label, checked, onChange, icon }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between gap-3 py-1 cursor-pointer group"
  >
    <span className="flex items-center gap-2 text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{icon}{label}</span>
    <span className={`w-10 h-[22px] rounded-full p-[3px] flex shrink-0 transition-colors ${checked ? 'bg-twitch justify-end' : 'bg-white/15 justify-start'}`}>
      <span className="w-4 h-4 rounded-full bg-white shadow" />
    </span>
  </button>
);

export const ColorField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-dark-950 border border-white/10 hover:border-twitch/50 transition-colors cursor-pointer min-w-0">
    <span className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/15 shrink-0" style={{ background: value }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
    </span>
    <span className="min-w-0">
      <span className="block text-[10px] font-bold text-gray-400 truncate">{label}</span>
      <span className="block text-xs font-mono font-bold text-white uppercase">{value}</span>
    </span>
  </label>
);

/** Fila de botones donde solo uno está elegido. */
export function Segmented<T extends string>({ value, options, onChange }: {
  value: T; options: { id: T; label: React.ReactNode }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex p-1 rounded-xl bg-dark-950 border border-white/10 gap-1">
      {options.map(o => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`flex-1 min-w-0 py-2 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate ${
            value === o.id ? 'bg-twitch text-white shadow-md shadow-twitch/25' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const hexARgba = (hex: string, alfa: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
};

export const TwitchGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M4.3 3 3 6.4v13.1h4.6V22h2.6l2.4-2.5h3.7l5-5V3H4.3Zm15.5 10.6-2.9 2.9h-4.6L9.8 19v-2.5H6V4.7h13.8v8.9Zm-2.9-5.9v5h-1.7v-5h1.7Zm-4.6 0v5h-1.7v-5h1.7Z" />
  </svg>
);

/**
 * El cartel en pequeño, con el estilo de verdad, para las tarjetas de letra,
 * estilos y animaciones: se elige mirando cómo queda, no leyendo un nombre.
 */
export const BadgePreview = React.forwardRef<HTMLSpanElement, {
  config: WatermarkConfig; channelName: string; size?: number; text?: string; className?: string;
}>(({ config, channelName, size = 14, text, className = '' }, ref) => {
  const contenido = text ?? formatWatermarkText(config, channelName);
  const glow = config.shadow && config.glowMode;
  return (
    <span
      ref={ref}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap max-w-full ${className}`}
      style={{
        background: hexARgba(config.bgColor, config.bgOpacity),
        color: config.textColor,
        fontFamily: getFontCss(config.fontFamily),
        fontWeight: config.fontWeight === '900' ? 900 : config.fontWeight === 'normal' ? 400 : 700,
        fontStyle: config.fontStyle || 'normal',
        letterSpacing: `${((config.letterSpacing || 0) * size) / 22}px`,
        fontSize: size,
        lineHeight: 1.15,
        padding: `${size * 0.36}px ${size * 0.64}px`,
        borderRadius: (config.borderRadius * size) / 22,
        border: config.boxBorder ? `${Math.max(1, ((config.boxBorderWidth || 2) * size) / 22)}px solid ${config.boxBorderColor || '#fff'}` : undefined,
        textShadow: config.shadow
          ? glow
            ? `0 0 ${((config.shadowBlur ?? 8) * size) / 22}px ${config.shadowColor}`
            : `${((config.shadowOffsetX ?? 2) * size) / 22}px ${((config.shadowOffsetY ?? 2) * size) / 22}px ${((config.shadowBlur ?? 8) * size) / 44}px ${config.shadowColor}`
          : undefined,
        WebkitTextStroke: config.stroke ? `${Math.max(0.5, ((config.strokeWidth || 2) * size) / 44)}px ${config.strokeColor || '#000'}` : undefined,
        paintOrder: 'stroke fill',
      }}
    >
      {config.showIcon && <TwitchGlyph className="shrink-0 w-[1.05em] h-[1.05em]" />}
      <span className="truncate">{contenido || '…'}</span>
    </span>
  );
});
BadgePreview.displayName = 'BadgePreview';
