import React from 'react';
import { fieldOfBit, type Precision } from '../lib/floats';
import type { Signedness } from '../types';

interface BitGridProps {
  /** Bit string, most significant bit first, already padded to the width. */
  bits: string;
  signedness: Signedness;
  precision: Precision;
  /** Fixed width in bits, or 0 for arbitrary precision (no bit is clickable
   *  past the natural length, and there is no sign bit to colour). */
  fixedWidth: boolean;
  onToggle: (indexFromMsb: number) => void;
  t: any;
}

const FIELD_STYLE: Record<string, { on: string; off: string; rail: string }> = {
  sign: {
    on: 'bg-rose-500 text-[#020610] border-rose-400',
    off: 'bg-rose-500/10 text-rose-300/60 border-rose-500/25',
    rail: 'text-rose-300',
  },
  exponent: {
    on: 'bg-amber-400 text-[#020610] border-amber-300',
    off: 'bg-amber-400/10 text-amber-300/60 border-amber-400/25',
    rail: 'text-amber-300',
  },
  mantissa: {
    on: 'bg-sky-400 text-[#020610] border-sky-300',
    off: 'bg-sky-400/10 text-sky-300/60 border-sky-400/25',
    rail: 'text-sky-300',
  },
  plain: {
    on: 'bg-blue-500 text-white border-blue-400',
    off: 'bg-white/[0.03] text-slate-500 border-white/10',
    rail: 'text-slate-500',
  },
  signBit: {
    on: 'bg-rose-500 text-[#020610] border-rose-400',
    off: 'bg-white/[0.03] text-slate-500 border-rose-500/30',
    rail: 'text-rose-300',
  },
};

export const BitGrid: React.FC<BitGridProps> = ({
  bits,
  signedness,
  precision,
  fixedWidth,
  onToggle,
  t,
}) => {
  const total = bits.length;

  const styleFor = (i: number) => {
    if (signedness === 'float') return FIELD_STYLE[fieldOfBit(i, precision)];
    // In a fixed-width signed value the top bit is the sign, and saying so is
    // the difference between "255" and "-1" making sense.
    if (signedness === 'signed' && fixedWidth && i === 0) return FIELD_STYLE.signBit;
    return FIELD_STYLE.plain;
  };

  // Bytes, most significant first. A trailing partial byte only happens at
  // arbitrary width, where the value has no declared size.
  const bytes: { start: number; bits: string }[] = [];
  for (let i = 0; i < total; i += 8) bytes.push({ start: i, bits: bits.slice(i, i + 8) });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {bytes.map(byte => (
          <div key={byte.start} className="flex flex-col gap-1">
            <div className="flex gap-1">
              {byte.bits.split('').map((bit, j) => {
                const index = byte.start + j;
                const st = styleFor(index);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onToggle(index)}
                    title={`${t.bitTooltip || 'Bit'} ${total - 1 - index}`}
                    aria-label={`${t.bitTooltip || 'Bit'} ${total - 1 - index}: ${bit}`}
                    className={`w-6 h-8 sm:w-7 sm:h-9 rounded-md border font-mono text-xs sm:text-sm font-bold flex items-center justify-center transition-colors cursor-pointer hover:brightness-125 ${
                      bit === '1' ? st.on : st.off
                    }`}
                  >
                    {bit}
                  </button>
                );
              })}
            </div>
            {/* Bit numbers run high to low, the way every datasheet writes them. */}
            <div className="flex gap-1 justify-between px-0.5">
              <span className="font-mono text-[9px] text-slate-600">{total - 1 - byte.start}</span>
              <span className="font-mono text-[9px] text-slate-600">
                {Math.max(0, total - byte.start - byte.bits.length)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {signedness === 'float' && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            {t.fieldSign || 'Sign'}
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            {t.fieldExponent || 'Exponent'}
          </span>
          <span className="flex items-center gap-1.5 text-sky-300">
            <span className="w-3 h-3 rounded-sm bg-sky-400" />
            {t.fieldMantissa || 'Mantissa'}
          </span>
        </div>
      )}

      <p className="text-[11px] text-slate-500">{t.bitGridHint || 'Click any bit to flip it.'}</p>
    </div>
  );
};

export default BitGrid;
