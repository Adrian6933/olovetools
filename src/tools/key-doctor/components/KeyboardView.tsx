import React, { useMemo } from 'react';
import { LAYOUTS, isKey } from '../lib/layouts';
import { labelFor } from '../lib/layoutMap';
import type { KeyStat, LayoutKind, PhysicalKey } from '../types';

// ============================================================================
// The drawn keyboard.
// ----------------------------------------------------------------------------
// Positions are computed in key units and emitted as percentages, so the board
// scales to any width with no JavaScript measuring and no ResizeObserver (which
// never fires in a background tab anyway).
// ============================================================================

/** Vertical gap between the function row and the rest, in key units. */
const FN_GAP = 0.35;
const BLOCK_GAP = 0.5;

export interface PlacedKey extends PhysicalKey {
  x: number;
  y: number;
}

export interface Placement {
  keys: PlacedKey[];
  width: number;
  height: number;
}

/** Turns the row description into absolute unit coordinates. */
export function placeLayout(layout: LayoutKind): Placement {
  const keys: PlacedKey[] = [];
  let originX = 0;
  let boardW = 0;
  let boardH = 0;

  LAYOUTS[layout].forEach(block => {
    let blockW = 0;
    block.rows.forEach((row, rowIndex) => {
      const y = rowIndex === 0 ? 0 : rowIndex + FN_GAP;
      let x = originX;
      row.forEach(item => {
        if (!isKey(item)) {
          x += item.spacer;
          return;
        }
        keys.push({ ...item, x, y });
        x += item.w;
      });
      blockW = Math.max(blockW, x - originX);
      boardH = Math.max(boardH, y + 1);
    });
    originX += blockW + BLOCK_GAP;
    boardW = originX - BLOCK_GAP;
  });

  return { keys, width: boardW, height: boardH };
}

export type KeyVisual = 'idle' | 'ok' | 'held' | 'stuck';

export function visualOf(stat: KeyStat | undefined): KeyVisual {
  if (!stat) return 'idle';
  if (stat.stuck) return 'stuck';
  if (stat.held) return 'held';
  return stat.downs > 0 ? 'ok' : 'idle';
}

const STYLE: Record<KeyVisual, string> = {
  idle: 'bg-white/[0.03] border-white/10 text-slate-500',
  ok: 'bg-amber-500/15 border-amber-500/40 text-amber-200',
  held: 'bg-amber-400 border-amber-300 text-[#0c0802] shadow-[0_0_18px_rgba(251,191,36,0.55)]',
  stuck: 'bg-red-500/25 border-red-400 text-red-200',
};

interface KeyboardViewProps {
  layout: LayoutKind;
  stats: Record<string, KeyStat>;
  labels: Record<string, string>;
  /** Dim keys that have not been pressed yet, for the coverage run. */
  highlightUntested: boolean;
  t: any;
}

export const KeyboardView: React.FC<KeyboardViewProps> = ({ layout, stats, labels, highlightUntested, t }) => {
  const placement = useMemo(() => placeLayout(layout), [layout]);
  const { width, height } = placement;

  return (
    // A full board is 23 key units wide; below ~700px that means unreadable
    // 14px keys, so it scrolls inside its own box instead of squashing or
    // pushing the page sideways.
    <div className="w-full overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-3">
      <div className="min-w-[680px]">
        <div className="relative w-full" style={{ paddingBottom: `${(height / width) * 100}%` }}>
          {placement.keys.map(pk => {
            const stat = stats[pk.code];
            const visual = visualOf(stat);
            const dim = highlightUntested && visual === 'idle';
            const label = labelFor(pk.code, labels, pk.fallback);
            return (
              <div
                key={pk.code}
                title={pk.code}
                className={`absolute flex items-center justify-center rounded-[0.35em] border text-center transition-colors duration-75 ${STYLE[visual]} ${
                  dim ? 'opacity-45 border-dashed' : ''
                }`}
                style={{
                  left: `${(pk.x / width) * 100}%`,
                  top: `${(pk.y / height) * 100}%`,
                  width: `${(pk.w / width) * 100}%`,
                  height: `${(1 / height) * 100}%`,
                  padding: '0.15%',
                  fontSize: 'clamp(7px, 0.85vw, 12px)',
                }}
              >
                <span className="truncate px-0.5 font-bold leading-none">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-slate-500">
          <span className="w-3 h-3 rounded border border-white/10 bg-white/[0.03]" />
          {t.legendUntested || 'Not tested'}
        </span>
        <span className="flex items-center gap-1.5 text-amber-200/70">
          <span className="w-3 h-3 rounded border border-amber-500/40 bg-amber-500/15" />
          {t.legendOk || 'Works'}
        </span>
        <span className="flex items-center gap-1.5 text-amber-300">
          <span className="w-3 h-3 rounded border border-amber-300 bg-amber-400" />
          {t.legendHeld || 'Held down'}
        </span>
        <span className="flex items-center gap-1.5 text-red-300">
          <span className="w-3 h-3 rounded border border-red-400 bg-red-500/25" />
          {t.legendStuck || 'Stuck'}
        </span>
      </div>
    </div>
  );
};

export default KeyboardView;
