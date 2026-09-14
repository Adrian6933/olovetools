// ============================================================================
// Lottie optimizer.
//
// The bytes in a Lottie are almost entirely coordinates written with 15
// significant digits by the After Effects exporter. Rounding them to 2-3
// decimals is invisible at any realistic render size and routinely removes
// 40-60% of the file. Dropping author metadata and hidden layers takes more.
//
// Everything here is measured, not claimed: the caller gets the byte count
// before and after and shows the real delta.
// ============================================================================

import type { LottieJson, OptimizeOptions, OptimizeResult } from '../types';

export const DEFAULT_OPTIMIZE: OptimizeOptions = {
  precision: 2,
  dropHidden: true,
  dropNames: true,
  dropExpressions: false,
};

/** Author metadata: useful in After Effects, dead weight in a shipped file. */
// Blend modes and property indices affect rendering / expressions. Keep them.
const METADATA_KEYS = ['nm', 'mn', 'cl', 'ln'];
/** Keys we must never round or strip — they are structural, not geometric. */
const STRUCTURAL_KEYS = new Set(['v', 'fr', 'ip', 'op', 'w', 'h', 'ty', 'ind', 'parent', 'refId', 'id', 'st', 'sr', 'ddd', 'a', 'p', 'e', 'tt', 'td', 'hd']);

function round(value: number, precision: number): number {
  if (!Number.isFinite(value) || Number.isInteger(value)) return value;
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

interface Stats {
  removedLayers: number;
  removedExpressions: number;
}

function transform(node: any, opts: OptimizeOptions, stats: Stats, key: string | null): any {
  if (typeof node === 'number') {
    // `fr`, `ip`, `op`, `w`, `h` and friends must keep their exact values —
    // rounding a frame rate to 2 decimals is fine, rounding an index is not.
    if (key && STRUCTURAL_KEYS.has(key)) return node;
    return round(node, opts.precision);
  }

  if (Array.isArray(node)) {
    const out: any[] = [];
    for (const item of node) {
      // Hidden layers/shapes: `hd: true` means the author turned the eye off.
      if (opts.dropHidden && item && typeof item === 'object' && item.hd === true) {
        stats.removedLayers++;
        continue;
      }
      out.push(transform(item, opts, stats, key));
    }
    return out;
  }

  if (!node || typeof node !== 'object') return node;

  const out: Record<string, any> = {};
  for (const k in node) {
    if (!Object.prototype.hasOwnProperty.call(node, k)) continue;

    if (opts.dropExpressions && k === 'x' && typeof node[k] === 'string') {
      stats.removedExpressions++;
      continue;
    }
    // `nm` on the root is the animation's own name; keep that one.
    if (opts.dropNames && METADATA_KEYS.includes(k)) continue;

    out[k] = transform(node[k], opts, stats, k);
  }
  return out;
}

export function optimizeLottie(json: LottieJson, opts: OptimizeOptions): OptimizeResult {
  const bytesBefore = new Blob([JSON.stringify(json)]).size;
  const stats: Stats = { removedLayers: 0, removedExpressions: 0 };

  const optimized = transform(json, opts, stats, null) as LottieJson;

  // Restore the fields that identify the document — a Lottie without `v`, `fr`,
  // `w`/`h` or its own name is not loadable, and `nm` on the root is not clutter.
  optimized.v = json.v;
  optimized.fr = json.fr;
  optimized.ip = json.ip;
  optimized.op = json.op;
  optimized.w = json.w;
  optimized.h = json.h;
  if (json.nm) optimized.nm = json.nm;

  const bytesAfter = new Blob([JSON.stringify(optimized)]).size;

  return {
    json: optimized,
    bytesBefore,
    bytesAfter,
    removedLayers: stats.removedLayers,
    removedExpressions: stats.removedExpressions,
  };
}
