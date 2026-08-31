import React from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Lock, Unlock, X } from 'lucide-react';
import {
  nameColor,
  rgbToHex,
  rgbToHsl,
  rgbToOklch,
  readableInk,
  type RGB,
} from '../lib/color';
import type { Swatch } from '../lib/quantize';

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch';

export const FORMATS: ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch'];

export function formatColor(c: RGB, format: ColorFormat): string {
  switch (format) {
    case 'rgb':
      return `rgb(${c.r}, ${c.g}, ${c.b})`;
    case 'hsl': {
      const { h, s, l } = rgbToHsl(c.r, c.g, c.b);
      return `hsl(${h}, ${s}%, ${l}%)`;
    }
    case 'oklch': {
      const { l, c: chroma, h } = rgbToOklch(c.r, c.g, c.b);
      return `oklch(${(l * 100).toFixed(1)}% ${chroma.toFixed(3)} ${h.toFixed(1)})`;
    }
    case 'hex':
    default:
      return rgbToHex(c.r, c.g, c.b);
  }
}

interface PalettePanelProps {
  palette: Swatch[];
  format: ColorFormat;
  selected: number;
  copiedIndex: number | null;
  t: any;
  onSelect: (index: number) => void;
  onCopy: (index: number) => void;
  onToggleLock: (index: number) => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onEdit: (index: number, color: RGB) => void;
}

/** `nameColor` returns keys so the label can be translated; this joins the two
 *  halves with whatever the dictionary provides, falling back to English. */
function label(c: RGB, t: any): string {
  const { hue, tone } = nameColor(c);
  const hueText = t.colorNames?.[hue] || hue;
  const toneText = tone ? t.colorTones?.[tone] || tone : '';
  return toneText ? `${toneText} ${hueText}` : hueText;
}

export const PalettePanel: React.FC<PalettePanelProps> = ({
  palette,
  format,
  selected,
  copiedIndex,
  t,
  onSelect,
  onCopy,
  onToggleLock,
  onRemove,
  onMove,
  onEdit,
}) => {
  if (palette.length === 0) return null;

  return (
    <div className="space-y-2">
      {palette.map((swatch, i) => {
        const value = formatColor(swatch, format);
        const hex = rgbToHex(swatch.r, swatch.g, swatch.b);
        const ink = readableInk(swatch);
        const inkHex = rgbToHex(ink.r, ink.g, ink.b);
        const isSelected = selected === i;

        return (
          <div
            key={`${hex}-${i}`}
            onClick={() => onSelect(i)}
            className={`group relative flex items-stretch rounded-2xl overflow-hidden border transition-all cursor-pointer ${
              isSelected
                ? 'border-rose-500/60 shadow-lg shadow-rose-950/40'
                : 'border-white/5 hover:border-rose-500/25'
            }`}
          >
            {/* Colour block doubles as a native colour input: the fastest way to
                nudge a swatch by hand, and it comes with the OS picker free. */}
            <label
              className="relative w-16 sm:w-20 shrink-0 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: hex }}
              onClick={e => e.stopPropagation()}
              title={t.editColor || 'Edit this colour'}
            >
              <input
                type="color"
                value={hex}
                onChange={e => {
                  const v = e.target.value;
                  onEdit(i, {
                    r: parseInt(v.slice(1, 3), 16),
                    g: parseInt(v.slice(3, 5), 16),
                    b: parseInt(v.slice(5, 7), 16),
                  });
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label={t.editColor || 'Edit this colour'}
              />
              <span
                className="text-[10px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-70 transition-opacity"
                style={{ color: inkHex }}
              >
                {t.editShort || 'Edit'}
              </span>
            </label>

            <div className="flex-1 min-w-0 px-3 py-2.5 bg-white/[0.02] flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white font-mono truncate">{value}</span>
                  {swatch.locked && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="capitalize truncate">{label(swatch, t)}</span>
                  {swatch.share > 0 && (
                    <span className="tabular-nums shrink-0">{(swatch.share * 100).toFixed(1)}%</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onCopy(i);
                  }}
                  aria-label={t.copy || 'Copy'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {copiedIndex === i ? <Check className="w-4 h-4 text-rose-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleLock(i);
                  }}
                  aria-label={swatch.locked ? t.unlock || 'Unlock' : t.lock || 'Lock'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer hover:bg-white/5 ${
                    swatch.locked ? 'text-rose-400' : 'text-slate-500 hover:text-rose-300'
                  }`}
                >
                  {swatch.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <div className="hidden sm:flex flex-col">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onMove(i, i - 1);
                    }}
                    disabled={i === 0}
                    aria-label={t.moveUp || 'Move up'}
                    className="w-7 h-4 flex items-center justify-center text-slate-600 hover:text-rose-300 disabled:opacity-25 disabled:cursor-default transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onMove(i, i + 1);
                    }}
                    disabled={i === palette.length - 1}
                    aria-label={t.moveDown || 'Move down'}
                    className="w-7 h-4 flex items-center justify-center text-slate-600 hover:text-rose-300 disabled:opacity-25 disabled:cursor-default transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(i);
                  }}
                  aria-label={t.removeColor || 'Remove'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PalettePanel;
