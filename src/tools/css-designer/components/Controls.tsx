import React, { useEffect, useId, useRef, useState } from 'react';
import { Pipette, RotateCcw } from 'lucide-react';
import { normalizeHex } from '../lib/color';

// ============================================================================
// Control primitives. Every one of them is labelled, keyboard-operable and
// accepts a typed value — the previous version only let you drag.
// ============================================================================

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  /** Restores this control on double-click of the value badge. */
  defaultValue?: number;
  onChange: (value: number) => void;
  onCommit?: () => void;
}

/**
 * Range + number field sharing one label. Alt makes the arrow keys ten times
 * finer, Shift ten times coarser, which is the convention every design tool
 * uses and costs nothing to support.
 */
export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  defaultValue,
  onChange,
  onCommit,
}) => {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const decimals = step < 1 ? String(step).split('.')[1]?.length || 2 : 0;
  const shown = draft ?? String(Number(value.toFixed(decimals)));

  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (!event.altKey && !event.shiftKey) return;
    event.preventDefault();
    const scale = event.altKey ? 0.1 : 10;
    const delta = (event.key === 'ArrowRight' ? 1 : -1) * step * scale;
    onChange(clamp(Number((value + delta).toFixed(4))));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center gap-3">
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </label>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            inputMode="decimal"
            value={shown}
            min={min}
            max={max}
            step={step}
            aria-label={label}
            onChange={e => {
              setDraft(e.target.value);
              const parsed = parseFloat(e.target.value);
              if (!Number.isNaN(parsed)) onChange(clamp(parsed));
            }}
            onBlur={() => {
              setDraft(null);
              onCommit?.();
            }}
            className="w-16 text-right bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-lg px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-violet-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && <span className="text-[10px] font-bold text-slate-500 w-4">{suffix}</span>}
          {defaultValue !== undefined && value !== defaultValue && (
            <button
              type="button"
              onClick={() => {
                onChange(defaultValue);
                onCommit?.();
              }}
              aria-label={`${label} — reset`}
              className="text-slate-600 hover:text-violet-400 transition-colors cursor-pointer bg-transparent border-none p-0.5"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        onKeyDown={handleKey}
        onPointerUp={onCommit}
        onBlur={onCommit}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  onCommit?: () => void;
  /** Label for the screen-reader-only eyedropper button. */
  pickLabel?: string;
}

declare global {
  interface Window {
    EyeDropper?: new () => { open(): Promise<{ sRGBHex: string }> };
  }
}

/**
 * Swatch + editable hex + screen eyedropper. The EyeDropper API is free,
 * local and shipped in Chromium; where it is missing the button simply is not
 * rendered rather than failing on click.
 */
export const ColorField: React.FC<ColorFieldProps> = ({ label, value, onChange, onCommit, pickLabel }) => {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const [hasPicker, setHasPicker] = useState(false);

  useEffect(() => {
    setHasPicker(typeof window !== 'undefined' && typeof window.EyeDropper === 'function');
  }, []);

  const pick = async () => {
    if (!window.EyeDropper) return;
    try {
      const result = await new window.EyeDropper().open();
      const hex = normalizeHex(result.sRGBHex);
      if (hex) {
        onChange(hex);
        onCommit?.();
      }
    } catch {
      // The user pressed Escape; nothing to report.
    }
  };

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          id={id}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onCommit}
          className="w-9 h-9 shrink-0 rounded-xl border border-white/10 bg-transparent cursor-pointer p-0 overflow-hidden"
        />
        <input
          type="text"
          value={draft ?? value.toUpperCase()}
          aria-label={`${label} (hex)`}
          spellCheck={false}
          onChange={e => {
            setDraft(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
          onBlur={() => {
            setDraft(null);
            onCommit?.();
          }}
          className="min-w-0 flex-1 bg-slate-950/60 border border-white/10 rounded-lg px-2 py-1.5 font-mono text-xs text-slate-300 uppercase focus:outline-none focus:border-violet-500"
        />
        {hasPicker && (
          <button
            type="button"
            onClick={pick}
            title={pickLabel || 'Pick from screen'}
            aria-label={pickLabel || 'Pick from screen'}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-violet-300 hover:border-violet-500/40 transition-colors cursor-pointer"
          >
            <Pipette className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

interface SegmentedProps<T extends string> {
  label?: string;
  value: T;
  options: { id: T; label: string; title?: string }[];
  onChange: (value: T) => void;
  /** Lets long option sets wrap instead of squeezing. */
  wrap?: boolean;
}

export function Segmented<T extends string>({ label, value, options, onChange, wrap }: SegmentedProps<T>) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {label && (
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className={`${wrap ? 'flex flex-wrap' : 'grid'} gap-1 bg-slate-900/50 p-1 rounded-xl border border-white/5`}
        style={wrap ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={value === option.id}
            title={option.title}
            onClick={() => onChange(option.id)}
            className={`px-2.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer border truncate ${
              value === option.id
                ? 'bg-violet-600/30 text-white border-violet-500/40'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, hint }) => (
  <div className="flex items-center justify-between gap-3 bg-slate-900/40 px-4 py-3 rounded-xl border border-white/5">
    <span className="min-w-0">
      <span className="block text-sm font-bold text-slate-300 truncate">{label}</span>
      {hint && <span className="block text-[11px] text-slate-500 truncate">{hint}</span>}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 shrink-0 rounded-full transition-colors relative cursor-pointer border-none ${
        checked ? 'bg-violet-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${checked ? 'left-7' : 'left-1'}`}
      />
    </button>
  </div>
);

// ---------------------------------------------------------------------------

/**
 * Draggable gradient bar. Click to add a stop, drag to move, right-click or
 * Alt-click to remove — the same gestures Photoshop and Figma use.
 */
interface GradientBarProps {
  stops: { id: string; color: string; position: number }[];
  activeId: string | null;
  preview: string;
  onSelect: (id: string) => void;
  onMove: (id: string, position: number) => void;
  onAdd: (position: number) => void;
  onRemove: (id: string) => void;
  onCommit?: () => void;
  label: string;
}

export const GradientBar: React.FC<GradientBarProps> = ({
  stops,
  activeId,
  preview,
  onSelect,
  onMove,
  onAdd,
  onRemove,
  onCommit,
  label,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<string | null>(null);

  const positionFromEvent = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.round(Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)));
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragging.current) return;
      onMove(dragging.current, positionFromEvent(event.clientX));
    };
    const up = () => {
      if (!dragging.current) return;
      dragging.current = null;
      onCommit?.();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [onMove, onCommit]);

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <div
        ref={trackRef}
        className="relative h-11 rounded-xl border border-white/10 cursor-copy select-none"
        style={{
          backgroundImage: `${preview}, repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%)`,
          backgroundSize: 'auto, 12px 12px',
        }}
        onPointerDown={event => {
          // Only a click on empty track adds a stop; handles stop propagation.
          if (event.target !== trackRef.current) return;
          onAdd(positionFromEvent(event.clientX));
        }}
      >
        {stops.map(stop => (
          <button
            key={stop.id}
            type="button"
            aria-label={`${label} ${Math.round(stop.position)}%`}
            onPointerDown={event => {
              event.stopPropagation();
              if (event.button === 2 || event.altKey) {
                onRemove(stop.id);
                return;
              }
              onSelect(stop.id);
              dragging.current = stop.id;
            }}
            onContextMenu={event => {
              event.preventDefault();
              onRemove(stop.id);
            }}
            onKeyDown={event => {
              if (event.key === 'ArrowLeft') onMove(stop.id, Math.max(0, stop.position - (event.shiftKey ? 10 : 1)));
              if (event.key === 'ArrowRight') onMove(stop.id, Math.min(100, stop.position + (event.shiftKey ? 10 : 1)));
              if (event.key === 'Delete' || event.key === 'Backspace') onRemove(stop.id);
            }}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-9 rounded-md border-2 cursor-grab active:cursor-grabbing transition-shadow ${
              activeId === stop.id
                ? 'border-white shadow-[0_0_0_3px_rgba(139,92,246,0.55)]'
                : 'border-white/70 hover:border-white'
            }`}
            style={{ left: `${stop.position}%`, backgroundColor: stop.color }}
          />
        ))}
      </div>
    </div>
  );
};
