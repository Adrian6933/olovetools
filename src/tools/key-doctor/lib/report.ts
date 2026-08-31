import { placeLayout, visualOf } from '../components/KeyboardView';
import { labelFor } from './layoutMap';
import { codesOf } from './layouts';
import type { KeyRecord, KeyStat, LayoutKind, Rollover, Timing } from '../types';

// ============================================================================
// Reports
// ----------------------------------------------------------------------------
// The point of a key tester is being able to show someone else the result:
// "these three keys are dead" when returning a laptop, or a screenshot in a
// second-hand listing. So the board is drawn to a canvas from the same
// placement data as the DOM, and the numbers go out as text or JSON.
// ============================================================================

const COLORS = {
  bg: '#0c0802',
  idle: { fill: 'rgba(255,255,255,0.03)', edge: 'rgba(255,255,255,0.12)', ink: '#64748b' },
  ok: { fill: 'rgba(245,158,11,0.16)', edge: 'rgba(245,158,11,0.45)', ink: '#fde68a' },
  held: { fill: '#fbbf24', edge: '#fcd34d', ink: '#0c0802' },
  stuck: { fill: 'rgba(239,68,68,0.28)', edge: '#f87171', ink: '#fecaca' },
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface ReportInput {
  layout: LayoutKind;
  stats: Record<string, KeyStat>;
  labels: Record<string, string>;
  rollover: Rollover;
  timing: Timing;
  history: KeyRecord[];
  realLabels: boolean;
}

export interface Coverage {
  total: number;
  tested: number;
  stuck: string[];
  untested: string[];
  /** Codes the board sent that this layout has no key for. */
  extra: string[];
}

export function coverageOf(layout: LayoutKind, stats: Record<string, KeyStat>): Coverage {
  const codes = codesOf(layout);
  const known = new Set(codes);
  const tested = codes.filter(c => (stats[c]?.downs || 0) > 0);
  return {
    total: codes.length,
    tested: tested.length,
    stuck: codes.filter(c => stats[c]?.stuck),
    untested: codes.filter(c => !(stats[c]?.downs > 0)),
    extra: Object.keys(stats).filter(c => !known.has(c)),
  };
}

/** Draws the board exactly as shown, at `scale` device pixels per key unit. */
export function renderPNG(input: ReportInput, unitPx = 44): Promise<Blob | null> {
  const place = placeLayout(input.layout);
  const pad = 20;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(place.width * unitPx + pad * 2);
  canvas.height = Math.round(place.height * unitPx + pad * 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(pad, pad);

  const inset = unitPx * 0.06;
  place.keys.forEach(pk => {
    const visual = visualOf(input.stats[pk.code]);
    const c = COLORS[visual];
    const x = pk.x * unitPx + inset;
    const y = pk.y * unitPx + inset;
    const w = pk.w * unitPx - inset * 2;
    const h = unitPx - inset * 2;
    ctx.fillStyle = c.fill;
    roundRect(ctx, x, y, w, h, unitPx * 0.14);
    ctx.fill();
    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const label = labelFor(pk.code, input.labels, pk.fallback);
    if (!label) return;
    ctx.fillStyle = c.ink;
    ctx.font = `700 ${Math.round(unitPx * 0.28)}px ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Long legends on a 1u key would spill over the edges.
    let text = label;
    while (text.length > 1 && ctx.measureText(text).width > w - 4) text = text.slice(0, -1);
    ctx.fillText(text, x + w / 2, y + h / 2);
  });

  return new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
}

const ms = (v: number) => (v > 0 ? `${v} ms` : '—');

export function toText(input: ReportInput, labelsOn: string): string {
  const cov = coverageOf(input.layout, input.stats);
  const lines: string[] = [];
  lines.push('Key Doctor report');
  lines.push('=================');
  lines.push(`Layout drawn: ${input.layout.toUpperCase()}`);
  lines.push(`Key legends: ${labelsOn}`);
  lines.push(`Keys tested: ${cov.tested} / ${cov.total} (${Math.round((cov.tested / cov.total) * 100)}%)`);
  lines.push(`Stuck keys: ${cov.stuck.length ? cov.stuck.join(', ') : 'none'}`);
  lines.push(`Max simultaneous keys (rollover): ${input.rollover.max || '—'}`);
  if (input.rollover.best.length) lines.push(`  best set: ${input.rollover.best.join(' + ')}`);
  lines.push(`Repeat delay: ${ms(input.timing.repeatDelay)}   Repeat rate: ${ms(input.timing.repeatRate)}`);
  lines.push(`Median hold: ${ms(input.timing.medianHold)} over ${input.timing.samples} presses`);
  if (cov.extra.length) lines.push(`Keys outside this layout: ${cov.extra.join(', ')}`);
  if (cov.untested.length) {
    lines.push('');
    lines.push('Never pressed:');
    lines.push('  ' + cov.untested.join(', '));
  }
  lines.push('');
  lines.push('Last keys');
  lines.push('---------');
  input.history.slice(0, 20).forEach(r => {
    const mods = [r.ctrl && 'Ctrl', r.alt && 'Alt', r.shift && 'Shift', r.meta && 'Meta'].filter(Boolean).join('+');
    lines.push(`  code=${r.code}  key=${JSON.stringify(r.key)}  keyCode=${r.keyCode}  location=${r.location}${mods ? '  mods=' + mods : ''}`);
  });
  return lines.join('\n') + '\n';
}

export function toJSON(input: ReportInput): string {
  const cov = coverageOf(input.layout, input.stats);
  return JSON.stringify(
    {
      layout: input.layout,
      legendsFromBrowser: input.realLabels,
      coverage: { tested: cov.tested, total: cov.total, untested: cov.untested, stuck: cov.stuck, extra: cov.extra },
      rollover: input.rollover,
      timing: input.timing,
      keys: Object.entries(input.stats).map(([code, s]) => ({
        code,
        downs: s.downs,
        minHold: s.minHold === Infinity ? null : Math.round(s.minHold),
        maxHold: Math.round(s.maxHold),
        stuck: s.stuck,
        lastKey: s.lastKey,
      })),
      history: input.history.map(r => ({
        code: r.code,
        key: r.key,
        keyCode: r.keyCode,
        location: r.location,
        ctrl: r.ctrl,
        alt: r.alt,
        shift: r.shift,
        meta: r.meta,
        repeat: r.repeat,
      })),
    },
    null,
    2
  );
}
