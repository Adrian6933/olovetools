// ============================================================================
// GraphFlow — scene builder
// ----------------------------------------------------------------------------
// Turns (data + options) into flat drawing primitives plus hit regions. Nothing
// here touches a canvas or the DOM, so the exact same layout drives the on-screen
// canvas, the vector SVG export, and the tooltip hit-testing.
// ============================================================================

import type {
  ChartOptions, DataSet, HitRegion, NumberFormat, Scene, SceneNode, Series, TextMeasurer,
} from '../types';

// ── Palettes ────────────────────────────────────────────────────────────────
export const COLOR_PALETTES: Record<string, string[]> = {
  vibrant:    ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'],
  pastel:     ['#fbbf24', '#fb7185', '#93c5fd', '#6ee7b7', '#c4b5fd', '#f9a8d4', '#67e8f9', '#bef264', '#fdba74', '#a5b4fc'],
  monochrome: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#a16207'],
  ocean:      ['#0ea5e9', '#06b6d4', '#14b8a6', '#0d9488', '#0891b2', '#0284c7', '#0369a1', '#155e75', '#164e63', '#0e7490'],
  sunset:     ['#f97316', '#ef4444', '#ec4899', '#f59e0b', '#eab308', '#d946ef', '#f43f5e', '#fb923c', '#fbbf24', '#a855f7'],
  neon:       ['#22d3ee', '#a78bfa', '#fb7185', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#c084fc', '#4ade80', '#f87171'],
};

// ── Theme ───────────────────────────────────────────────────────────────────
export function getThemeColors(dark: boolean) {
  return {
    bg: dark ? '#0f172a' : '#ffffff',
    text: dark ? '#e2e8f0' : '#1e293b',
    muted: dark ? '#94a3b8' : '#64748b',
    gridLine: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    axisLine: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.22)',
  };
}

// ── Number formatting ───────────────────────────────────────────────────────
// Deliberately locale-independent: the same function labels the chart (drawn
// after mount) and the data table (server-rendered), and an `Intl` call would
// make those two disagree during hydration.

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatValue(v: number, fmt: NumberFormat = 'plain', suffix = ''): string {
  if (!Number.isFinite(v)) return '—';
  const neg = v < 0;
  const abs = Math.abs(v);
  let out: string;

  if (fmt === 'compact' && abs >= 1000) {
    const units = [
      { n: 1e9, s: 'B' },
      { n: 1e6, s: 'M' },
      { n: 1e3, s: 'K' },
    ];
    const u = units.find(x => abs >= x.n)!;
    out = trimZeros((abs / u.n).toFixed(abs / u.n >= 100 ? 0 : 1)) + u.s;
  } else {
    // Keep enough decimals to distinguish small values without spraying noise.
    const decimals = abs === 0 ? 0 : abs < 1 ? 3 : abs < 10 ? 2 : abs < 1000 ? 1 : 0;
    const fixed = trimZeros(abs.toFixed(decimals));
    if (fmt === 'plain') {
      out = fixed;
    } else {
      const [i, d] = fixed.split('.');
      out = group(i) + (d ? '.' + d : '');
    }
  }
  return (neg ? '-' : '') + out + suffix;
}

// ── Scales ──────────────────────────────────────────────────────────────────

function niceNum(range: number, round: boolean): number {
  if (range <= 0) return 1;
  const exp = Math.floor(Math.log10(range));
  const f = range / Math.pow(10, exp);
  const nf = round
    ? f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10
    : f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * Math.pow(10, exp);
}

export interface Scale {
  min: number;
  max: number;
  step: number;
  ticks: number[];
}

/**
 * A tick scale that includes zero when the data straddles it — the old
 * `niceMax` clamped the floor to 0, so negative bars were drawn upward and off
 * the plot entirely.
 */
export function niceScale(dataMin: number, dataMax: number, targetTicks = 5): Scale {
  let lo = Math.min(dataMin, 0);
  let hi = Math.max(dataMax, 0);

  if (lo === hi) {
    if (lo === 0) { lo = 0; hi = 1; }
    else if (lo > 0) { lo = 0; hi = hi * 1.2; }
    else { hi = 0; lo = lo * 1.2; }
  }

  const range = niceNum(hi - lo, false);
  const step = niceNum(range / Math.max(1, targetTicks - 1), true);
  const min = Math.floor(lo / step) * step;
  const max = Math.ceil(hi / step) * step;

  const ticks: number[] = [];
  // Accumulate by index, not by repeated addition, so float error cannot drift.
  const count = Math.round((max - min) / step);
  for (let i = 0; i <= count; i++) {
    const t = min + i * step;
    // Snap away the 0.30000000000000004 class of artefact.
    ticks.push(Math.abs(t) < step * 1e-9 ? 0 : Number(t.toPrecision(12)));
  }
  return { min, max, step, ticks };
}

/** min/max over the visible series without `Math.max(...arr)` — that blows the
 *  call stack somewhere north of 100k values. */
function extent(series: Series[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    for (const v of s.values) {
      if (!Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (min === Infinity) return { min: 0, max: 0 };
  return { min, max };
}

/** Per-label totals for stacked bars, split by sign so negatives stack down. */
function stackExtent(series: Series[], labelCount: number, percent: boolean) {
  if (percent) return { min: 0, max: 100 };
  let min = 0;
  let max = 0;
  for (let i = 0; i < labelCount; i++) {
    let pos = 0;
    let neg = 0;
    for (const s of series) {
      const v = s.values[i] ?? 0;
      if (!Number.isFinite(v)) continue;
      if (v >= 0) pos += v;
      else neg += v;
    }
    if (pos > max) max = pos;
    if (neg < min) min = neg;
  }
  return { min, max };
}

// ── Path helpers ────────────────────────────────────────────────────────────

function n(v: number): string {
  // Two decimals is well under a device pixel and keeps the SVG small.
  return (Math.round(v * 100) / 100).toString();
}

export function roundRectPath(x: number, y: number, w: number, h: number, r: number): string {
  if (h < 0) { y += h; h = -h; }
  if (w < 0) { x += w; w = -w; }
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r === 0) return `M${n(x)} ${n(y)}H${n(x + w)}V${n(y + h)}H${n(x)}Z`;
  return (
    `M${n(x + r)} ${n(y)}` +
    `H${n(x + w - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w)} ${n(y + r)}` +
    `V${n(y + h - r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + w - r)} ${n(y + h)}` +
    `H${n(x + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x)} ${n(y + h - r)}` +
    `V${n(y + r)}A${n(r)} ${n(r)} 0 0 1 ${n(x + r)} ${n(y)}Z`
  );
}

export interface Pt { x: number; y: number }

function polylinePath(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${n(p.x)} ${n(p.y)}`).join('');
}

/**
 * Monotone cubic (Fritsch–Carlson). The previous smoothing used a midpoint
 * bezier that overshoots hard on spiky data — it would draw a line dipping
 * below zero between two positive points.
 */
function monotonePath(pts: Pt[]): string {
  const len = pts.length;
  if (len < 3) return polylinePath(pts);

  const slope: number[] = [];
  for (let i = 0; i < len - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    slope.push(dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx);
  }

  const tan: number[] = new Array(len);
  tan[0] = slope[0];
  tan[len - 1] = slope[len - 2];
  for (let i = 1; i < len - 1; i++) {
    tan[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
  }
  // Clamp so the curve cannot overshoot the data points.
  for (let i = 0; i < len - 1; i++) {
    if (slope[i] === 0) { tan[i] = 0; tan[i + 1] = 0; continue; }
    const a = tan[i] / slope[i];
    const b = tan[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const f = 3 / Math.sqrt(s);
      tan[i] = f * a * slope[i];
      tan[i + 1] = f * b * slope[i];
    }
  }

  let d = `M${n(pts[0].x)} ${n(pts[0].y)}`;
  for (let i = 0; i < len - 1; i++) {
    const h = (pts[i + 1].x - pts[i].x) / 3;
    d += `C${n(pts[i].x + h)} ${n(pts[i].y + tan[i] * h)} ` +
         `${n(pts[i + 1].x - h)} ${n(pts[i + 1].y - tan[i + 1] * h)} ` +
         `${n(pts[i + 1].x)} ${n(pts[i + 1].y)}`;
  }
  return d;
}

function linePath(pts: Pt[], smooth: boolean): string {
  return smooth ? monotonePath(pts) : polylinePath(pts);
}

function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const x0 = cx + Math.cos(a0) * r1, y0 = cy + Math.sin(a0) * r1;
  const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1;

  if (r0 <= 0) {
    return `M${n(cx)} ${n(cy)}L${n(x0)} ${n(y0)}A${n(r1)} ${n(r1)} 0 ${large} 1 ${n(x1)} ${n(y1)}Z`;
  }
  const ix1 = cx + Math.cos(a1) * r0, iy1 = cy + Math.sin(a1) * r0;
  const ix0 = cx + Math.cos(a0) * r0, iy0 = cy + Math.sin(a0) * r0;
  return (
    `M${n(x0)} ${n(y0)}A${n(r1)} ${n(r1)} 0 ${large} 1 ${n(x1)} ${n(y1)}` +
    `L${n(ix1)} ${n(iy1)}A${n(r0)} ${n(r0)} 0 ${large} 0 ${n(ix0)} ${n(iy0)}Z`
  );
}

/** Adds an alpha channel to a #rrggbb colour. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex + a : hex;
}

function ellipsize(text: string, maxWidth: number, measure: TextMeasurer, size: number): string {
  if (measure(text, size) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(text.slice(0, mid) + '…', size) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo <= 0 ? '' : text.slice(0, lo) + '…';
}

export function seriesColor(s: Series, index: number, palette: string[]): string {
  return s.color || palette[index % palette.length];
}

// ── Layout constants ────────────────────────────────────────────────────────
const PAD = { top: 16, right: 20, bottom: 12, left: 16 };
const TITLE_H = 34;
const LEGEND_ROW_H = 22;
const TICK_SIZE = 10;
const LABEL_SIZE = 10;

interface BuildContext {
  width: number;
  height: number;
  measure: TextMeasurer;
}

/**
 * Builds the scene. Returns an empty scene (background only) when there is
 * nothing to draw, so callers never have to special-case it.
 */
export function buildScene(data: DataSet, options: ChartOptions, ctx: BuildContext): Scene {
  const { width, height, measure } = ctx;
  const theme = getThemeColors(options.darkTheme);
  const nodes: SceneNode[] = [];
  const hits: HitRegion[] = [];

  const scene: Scene = { width, height, background: theme.bg, nodes, hits };

  const visible = data.series.filter(s => !s.hidden);
  // Keep the original index so colours stay stable when a series is hidden.
  const colorIndex = new Map<Series, number>();
  data.series.forEach((s, i) => colorIndex.set(s, i));
  const colorOf = (s: Series) => seriesColor(s, colorIndex.get(s) ?? 0, options.palette);

  if (data.labels.length === 0 || visible.length === 0) {
    nodes.push({
      kind: 'text', x: width / 2, y: height / 2, text: '', fill: theme.muted,
      size: 12, anchor: 'middle',
    });
    return scene;
  }

  let top = PAD.top;
  if (options.title) {
    nodes.push({
      kind: 'text', x: width / 2, y: top + 18, text: options.title,
      fill: theme.text, size: 16, weight: 800, anchor: 'middle',
    });
    top += TITLE_H;
  }

  // ── Legend (measured first: it eats into the plot height) ─────────────────
  const isPie = options.chartType === 'pie';
  const legendItems = isPie
    ? data.labels.map((l, i) => ({ label: l, color: options.palette[i % options.palette.length] }))
    : visible.map(s => ({ label: s.name, color: colorOf(s) }));

  let legendRows: { label: string; color: string; x: number }[][] = [];
  let legendH = 0;

  if (options.showLegend && legendItems.length > 0) {
    const avail = width - PAD.left - PAD.right;
    let row: typeof legendRows[number] = [];
    let x = 0;
    for (const item of legendItems) {
      const label = ellipsize(item.label, avail - 20, measure, 11);
      const w = 14 + measure(label, 11) + 18;
      if (x + w > avail && row.length > 0) {
        legendRows.push(row);
        row = [];
        x = 0;
      }
      row.push({ label, color: item.color, x });
      x += w;
    }
    if (row.length > 0) legendRows.push(row);
    // Never let a 60-series legend swallow the chart; the rest is reachable
    // from the series list in the editor.
    if (legendRows.length > 4) legendRows = legendRows.slice(0, 4);
    legendH = legendRows.length * LEGEND_ROW_H + 8;
  }

  const bottom = height - PAD.bottom - legendH;

  const plot = { x: PAD.left, y: top, w: width - PAD.left - PAD.right, h: bottom - top };

  if (plot.w > 20 && plot.h > 20) {
    switch (options.chartType) {
      case 'pie':
        drawPie(scene, data, options, plot, theme, measure);
        break;
      case 'radar':
        drawRadar(scene, visible, data.labels, options, plot, theme, measure, colorOf);
        break;
      case 'scatter':
        drawScatter(scene, visible, data.labels, options, plot, theme, measure, colorOf);
        break;
      case 'horizontal-bar':
        drawCartesian(scene, visible, data.labels, options, plot, theme, measure, colorOf, true);
        break;
      default:
        drawCartesian(scene, visible, data.labels, options, plot, theme, measure, colorOf, false);
        break;
    }
  }

  // ── Legend nodes, drawn last so they sit on top ───────────────────────────
  legendRows.forEach((row, ri) => {
    const y = height - PAD.bottom - legendH + 8 + ri * LEGEND_ROW_H;
    const rowWidth = row.reduce((acc, it) => acc + 14 + measure(it.label, 11) + 18, 0) - 18;
    const startX = Math.max(PAD.left, (width - rowWidth) / 2);
    for (const item of row) {
      nodes.push({
        kind: 'rect', x: startX + item.x, y: y - 8, w: 10, h: 10, r: 3, fill: item.color,
      });
      nodes.push({
        kind: 'text', x: startX + item.x + 16, y, text: item.label,
        fill: theme.muted, size: 11, weight: 600, anchor: 'start',
      });
    }
  });

  return scene;
}

// ── Cartesian: bars, lines, areas, and any combo of them ────────────────────

type Theme = ReturnType<typeof getThemeColors>;
type Rect = { x: number; y: number; w: number; h: number };

function drawCartesian(
  scene: Scene, visible: Series[], labels: string[], options: ChartOptions,
  plot: Rect, theme: Theme, measure: TextMeasurer,
  colorOf: (s: Series) => string, horizontal: boolean,
) {
  const { nodes, hits } = scene;
  const isLineChart = options.chartType === 'line' || options.chartType === 'area';

  // A series is drawn as a line when it says so, or when the chart itself is
  // a line/area chart and the series has no opinion.
  const asLine = (s: Series) => s.type === 'line' || (isLineChart && s.type !== 'bar');
  const barSeries = horizontal ? visible : visible.filter(s => !asLine(s));
  const lineSeries = horizontal ? [] : visible.filter(s => asLine(s));

  const stacking = options.stack !== 'none' && barSeries.length > 1 && !isLineChart;
  const percent = options.stack === 'percent';

  const ext = stacking
    ? stackExtent(barSeries, labels.length, percent)
    : extent(visible);
  const scale = niceScale(ext.min, ext.max);

  // ── Axis gutters, measured from the actual tick text ──────────────────────
  const tickLabels = scale.ticks.map(t =>
    formatValue(percent ? t : t, options.numberFormat, percent ? '%' : options.valueSuffix)
  );
  const maxTickW = Math.max(...tickLabels.map(s => measure(s, TICK_SIZE)));

  const n = labels.length;

  // Category-axis label handling: fit horizontally, else rotate, else thin out.
  let rotate = 0;
  let labelBand = 18;
  let labelStep = 1;
  let maxLabelW = 0;
  for (const l of labels) maxLabelW = Math.max(maxLabelW, measure(l, LABEL_SIZE));

  let gutterLeft: number;
  let gutterBottom: number;

  if (horizontal) {
    gutterLeft = Math.min(plot.w * 0.4, maxLabelW + 12);
    gutterBottom = 22;
  } else {
    gutterLeft = maxTickW + 12;
    const slot = (plot.w - gutterLeft) / n;
    if (maxLabelW <= slot - 6) {
      rotate = 0;
      labelBand = 18;
    } else {
      rotate = -45;
      // A rotated label needs its projected height, capped so a single very
      // long category cannot eat half the chart.
      const capped = Math.min(maxLabelW, 110);
      labelBand = capped * Math.SQRT1_2 + 14;
      // Even rotated, labels need ~13px of horizontal room each.
      labelStep = Math.max(1, Math.ceil(13 / Math.max(1, slot)));
    }
    gutterBottom = labelBand;
  }

  const area = {
    x: plot.x + gutterLeft,
    y: plot.y + 6,
    w: plot.w - gutterLeft - 4,
    h: plot.h - gutterBottom - 6,
  };
  if (area.w <= 10 || area.h <= 10) return;

  // Value → pixel along the value axis.
  const span = scale.max - scale.min || 1;
  const vToPx = (v: number) =>
    horizontal
      ? area.x + ((v - scale.min) / span) * area.w
      : area.y + area.h - ((v - scale.min) / span) * area.h;
  const zero = vToPx(0);

  // ── Grid + tick labels ───────────────────────────────────────────────────
  scale.ticks.forEach((t, i) => {
    const p = vToPx(t);
    if (options.showGrid) {
      nodes.push({
        kind: 'path',
        d: horizontal
          ? `M${p} ${area.y}V${area.y + area.h}`
          : `M${area.x} ${p}H${area.x + area.w}`,
        stroke: t === 0 ? theme.axisLine : theme.gridLine,
        strokeWidth: 1,
      });
    }
    if (horizontal) {
      nodes.push({
        kind: 'text', x: p, y: area.y + area.h + 15, text: tickLabels[i],
        fill: theme.muted, size: TICK_SIZE, anchor: 'middle',
      });
    } else {
      nodes.push({
        kind: 'text', x: area.x - 8, y: p + 3.5, text: tickLabels[i],
        fill: theme.muted, size: TICK_SIZE, anchor: 'end',
      });
    }
  });

  // Baseline is always drawn, even with the grid off — it is the reference the
  // whole chart is read against.
  nodes.push({
    kind: 'path',
    d: horizontal ? `M${zero} ${area.y}V${area.y + area.h}` : `M${area.x} ${zero}H${area.x + area.w}`,
    stroke: theme.axisLine,
    strokeWidth: 1.2,
  });

  // ── Category labels ──────────────────────────────────────────────────────
  const catSlot = horizontal ? area.h / n : area.w / n;
  for (let i = 0; i < n; i++) {
    if (i % labelStep !== 0) continue;
    if (horizontal) {
      nodes.push({
        kind: 'text',
        x: area.x - 8,
        y: area.y + i * catSlot + catSlot / 2 + 3.5,
        text: ellipsize(labels[i], gutterLeft - 12, measure, LABEL_SIZE),
        fill: theme.muted, size: LABEL_SIZE, anchor: 'end',
      });
    } else {
      const cx = area.x + i * catSlot + catSlot / 2;
      if (rotate) {
        nodes.push({
          kind: 'text', x: cx, y: area.y + area.h + 14,
          text: ellipsize(labels[i], 110, measure, LABEL_SIZE),
          fill: theme.muted, size: LABEL_SIZE, anchor: 'end', rotate: -45,
        });
      } else {
        nodes.push({
          kind: 'text', x: cx, y: area.y + area.h + 15,
          text: labels[i], fill: theme.muted, size: LABEL_SIZE, anchor: 'middle',
        });
      }
    }
  }

  // ── Reference line ───────────────────────────────────────────────────────
  if (options.referenceLine !== null && Number.isFinite(options.referenceLine)) {
    const p = vToPx(options.referenceLine);
    const inside = horizontal
      ? p >= area.x && p <= area.x + area.w
      : p >= area.y && p <= area.y + area.h;
    if (inside) {
      nodes.push({
        kind: 'path',
        d: horizontal ? `M${p} ${area.y}V${area.y + area.h}` : `M${area.x} ${p}H${area.x + area.w}`,
        stroke: '#f43f5e', strokeWidth: 1.6, dash: [6, 5],
      });
      nodes.push({
        kind: 'text',
        x: horizontal ? p + 5 : area.x + area.w - 4,
        y: horizontal ? area.y + 11 : p - 5,
        text: formatValue(options.referenceLine, options.numberFormat, options.valueSuffix),
        fill: '#fb7185', size: 10, weight: 700,
        anchor: horizontal ? 'start' : 'end',
      });
    }
  }

  // ── Bars ─────────────────────────────────────────────────────────────────
  const barCount = stacking ? 1 : barSeries.length;
  const bandFill = 0.72;
  const bandW = catSlot * bandFill;
  const oneBar = barCount > 0 ? bandW / barCount : 0;

  // Running offsets for the stacked case, one pair per category.
  const stackPos = new Array(n).fill(0);
  const stackNeg = new Array(n).fill(0);
  const totals = percent
    ? labels.map((_, i) =>
        barSeries.reduce((acc, s) => acc + Math.abs(s.values[i] ?? 0), 0))
    : [];

  barSeries.forEach((s, si) => {
    const color = colorOf(s);
    for (let i = 0; i < n; i++) {
      let v = s.values[i] ?? 0;
      if (!Number.isFinite(v)) v = 0;
      if (percent) {
        const total = totals[i] || 1;
        v = (v / total) * 100;
      }

      let from: number;
      let to: number;
      if (stacking) {
        const base = v >= 0 ? stackPos[i] : stackNeg[i];
        from = base;
        to = base + v;
        if (v >= 0) stackPos[i] = to; else stackNeg[i] = to;
      } else {
        from = 0;
        to = v;
      }

      const p0 = vToPx(from);
      const p1 = vToPx(to);
      const offset = stacking ? 0 : si * oneBar;
      const catStart = (horizontal ? area.y : area.x) + i * catSlot + (catSlot - bandW) / 2;

      let rect: Rect;
      if (horizontal) {
        rect = { x: Math.min(p0, p1), y: catStart + offset, w: Math.abs(p1 - p0), h: Math.max(1, oneBar - 2) };
      } else {
        rect = { x: catStart + offset, y: Math.min(p0, p1), w: Math.max(1, oneBar - 2), h: Math.abs(p1 - p0) };
      }

      const radius = options.roundedBars ? Math.min(5, (horizontal ? rect.h : rect.w) / 2.5) : 0;
      nodes.push({
        kind: 'path',
        d: roundRectPath(rect.x, rect.y, rect.w, rect.h, radius),
        fill: color,
      });

      hits.push({
        area: { shape: 'rect', ...rect },
        seriesIndex: si, pointIndex: i,
        seriesName: s.name, label: labels[i], value: s.values[i] ?? 0, color,
        anchorX: horizontal ? Math.max(p0, p1) : rect.x + rect.w / 2,
        anchorY: horizontal ? rect.y + rect.h / 2 : Math.min(p0, p1),
      });

      if (options.showValues && Math.abs(p1 - p0) > 1) {
        const text = formatValue(
          percent ? v : (s.values[i] ?? 0),
          options.numberFormat,
          percent ? '%' : options.valueSuffix
        );
        // Inside the bar when stacked (no room above), outside otherwise.
        if (stacking) {
          const fits = horizontal ? rect.w > measure(text, 9) + 8 : rect.h > 14;
          if (fits) {
            nodes.push({
              kind: 'text', x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 + 3,
              text, fill: '#ffffff', size: 9, weight: 700, anchor: 'middle',
            });
          }
        } else if (horizontal) {
          nodes.push({
            kind: 'text', x: Math.max(p0, p1) + 5, y: rect.y + rect.h / 2 + 3,
            text, fill: theme.muted, size: 9, weight: 600, anchor: 'start',
          });
        } else {
          nodes.push({
            kind: 'text', x: rect.x + rect.w / 2, y: (v >= 0 ? rect.y - 5 : rect.y + rect.h + 11),
            text, fill: theme.muted, size: 9, weight: 600, anchor: 'middle',
          });
        }
      }
    }
  });

  // ── Lines / areas ────────────────────────────────────────────────────────
  lineSeries.forEach((s, si) => {
    const color = colorOf(s);
    const pts: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const v = s.values[i];
      if (!Number.isFinite(v)) continue;
      pts.push({ x: area.x + i * catSlot + catSlot / 2, y: vToPx(v) });
    }
    if (pts.length === 0) return;

    const smooth = options.smoothLine;

    if (options.chartType === 'area' || options.fillArea) {
      const d = linePath(pts, smooth) +
        `L${pts[pts.length - 1].x} ${zero}L${pts[0].x} ${zero}Z`;
      scene.nodes.push({ kind: 'path', d, fill: withAlpha(color, 0.22) });
    }

    scene.nodes.push({
      kind: 'path', d: linePath(pts, smooth),
      stroke: color, strokeWidth: 2.5,
    });

    // Dots stay off once they would collide with each other.
    const showDots = pts.length < 2 || (area.w / pts.length) > 12;
    let pi = 0;
    for (let i = 0; i < n; i++) {
      const v = s.values[i];
      if (!Number.isFinite(v)) continue;
      const p = pts[pi++];
      if (showDots) {
        scene.nodes.push({
          kind: 'circle', cx: p.x, cy: p.y, r: 4,
          fill: color, stroke: theme.bg, strokeWidth: 2,
        });
      }
      hits.push({
        area: { shape: 'rect', x: p.x - 9, y: p.y - 9, w: 18, h: 18 },
        seriesIndex: si, pointIndex: i,
        seriesName: s.name, label: labels[i], value: v, color,
        anchorX: p.x, anchorY: p.y,
      });
      if (options.showValues) {
        scene.nodes.push({
          kind: 'text', x: p.x, y: p.y - 10,
          text: formatValue(v, options.numberFormat, options.valueSuffix),
          fill: theme.muted, size: 9, weight: 600, anchor: 'middle',
        });
      }
    }
  });
}

// ── Pie / doughnut ──────────────────────────────────────────────────────────

function drawPie(
  scene: Scene, data: DataSet, options: ChartOptions,
  plot: Rect, theme: Theme, measure: TextMeasurer,
) {
  const { nodes, hits } = scene;
  const series = data.series.find(s => !s.hidden);
  if (!series) return;

  // A pie of negative numbers is meaningless; use magnitudes and say nothing —
  // the tooltip still reports the signed original.
  const values = data.labels.map((_, i) => Math.abs(series.values[i] ?? 0));
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return;

  const cx = plot.x + plot.w / 2;
  const cy = plot.y + plot.h / 2;
  const r1 = Math.min(plot.w, plot.h) / 2 - 22;
  if (r1 <= 4) return;
  const r0 = options.doughnut ? r1 * 0.58 : 0;

  let a = -Math.PI / 2;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === 0) continue;
    const sweep = (values[i] / total) * Math.PI * 2;
    const a1 = a + sweep;
    const color = options.palette[i % options.palette.length];

    nodes.push({
      kind: 'path', d: arcPath(cx, cy, r0, r1, a, a1),
      fill: color, stroke: theme.bg, strokeWidth: 2,
    });

    const mid = a + sweep / 2;
    const labelR = r0 + (r1 - r0) * 0.62;
    hits.push({
      area: { shape: 'slice', cx, cy, r0, r1, a0: a, a1 },
      seriesIndex: 0, pointIndex: i,
      seriesName: series.name, label: data.labels[i],
      value: series.values[i] ?? 0, color,
      anchorX: cx + Math.cos(mid) * labelR,
      anchorY: cy + Math.sin(mid) * labelR,
    });

    // Only label a wedge wide enough for the text to sit inside it.
    if (options.showValues && sweep > 0.22) {
      const pct = ((values[i] / total) * 100).toFixed(1) + '%';
      nodes.push({
        kind: 'text',
        x: cx + Math.cos(mid) * labelR,
        y: cy + Math.sin(mid) * labelR + 4,
        text: pct, fill: '#ffffff', size: 11, weight: 800, anchor: 'middle',
      });
    }
    a = a1;
  }

  // Total in the hole — the reason to pick a doughnut in the first place.
  if (options.doughnut) {
    nodes.push({
      kind: 'text', x: cx, y: cy - 2,
      text: formatValue(total, options.numberFormat, options.valueSuffix),
      fill: theme.text, size: Math.min(20, r0 / 2.4), weight: 800, anchor: 'middle',
    });
  }
}

// ── Radar ───────────────────────────────────────────────────────────────────

function drawRadar(
  scene: Scene, visible: Series[], labels: string[], options: ChartOptions,
  plot: Rect, theme: Theme, measure: TextMeasurer, colorOf: (s: Series) => string,
) {
  const { nodes, hits } = scene;
  const n = labels.length;
  if (n < 3) {
    nodes.push({
      kind: 'text', x: plot.x + plot.w / 2, y: plot.y + plot.h / 2,
      text: '', fill: theme.muted, size: 12, anchor: 'middle',
    });
    return;
  }

  const cx = plot.x + plot.w / 2;
  const cy = plot.y + plot.h / 2;
  // Leave room for the outermost axis labels.
  const maxLabelW = Math.max(...labels.map(l => measure(l, LABEL_SIZE)));
  const radius = Math.min(plot.w / 2 - Math.min(maxLabelW, 70) - 10, plot.h / 2 - 24);
  if (radius <= 10) return;

  const ext = extent(visible);
  const scale = niceScale(Math.min(0, ext.min), ext.max);
  const span = scale.max - scale.min || 1;
  const step = (Math.PI * 2) / n;
  const at = (i: number) => -Math.PI / 2 + i * step;
  const rOf = (v: number) => ((v - scale.min) / span) * radius;

  for (let ring = 1; ring <= 5; ring++) {
    const rr = (ring / 5) * radius;
    const pts: Pt[] = [];
    for (let i = 0; i < n; i++) pts.push({ x: cx + Math.cos(at(i)) * rr, y: cy + Math.sin(at(i)) * rr });
    nodes.push({ kind: 'path', d: polylinePath(pts) + 'Z', stroke: theme.gridLine, strokeWidth: 1 });
  }

  for (let i = 0; i < n; i++) {
    const a = at(i);
    nodes.push({
      kind: 'path',
      d: `M${cx} ${cy}L${cx + Math.cos(a) * radius} ${cy + Math.sin(a) * radius}`,
      stroke: theme.gridLine, strokeWidth: 1,
    });
    const lx = cx + Math.cos(a) * (radius + 14);
    const ly = cy + Math.sin(a) * (radius + 14);
    nodes.push({
      kind: 'text', x: lx, y: ly + 3.5,
      text: ellipsize(labels[i], 70, measure, LABEL_SIZE),
      fill: theme.muted, size: LABEL_SIZE,
      anchor: Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end',
    });
  }

  visible.forEach((s, si) => {
    const color = colorOf(s);
    const pts: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const v = Number.isFinite(s.values[i]) ? s.values[i] : scale.min;
      const rr = rOf(v);
      pts.push({ x: cx + Math.cos(at(i)) * rr, y: cy + Math.sin(at(i)) * rr });
    }
    const d = polylinePath(pts) + 'Z';
    nodes.push({ kind: 'path', d, fill: withAlpha(color, 0.22) });
    nodes.push({ kind: 'path', d, stroke: color, strokeWidth: 2 });

    pts.forEach((p, i) => {
      nodes.push({ kind: 'circle', cx: p.x, cy: p.y, r: 3, fill: color });
      hits.push({
        area: { shape: 'rect', x: p.x - 9, y: p.y - 9, w: 18, h: 18 },
        seriesIndex: si, pointIndex: i,
        seriesName: s.name, label: labels[i], value: s.values[i] ?? 0, color,
        anchorX: p.x, anchorY: p.y,
      });
    });
  });
}

// ── Scatter ─────────────────────────────────────────────────────────────────

/**
 * A real XY scatter. The old implementation spread points evenly by row index,
 * which is a line chart without lines — the X axis carried no information.
 *
 * X comes from, in order of preference: numeric category labels, the first
 * series (classic two-column XY), or the row index as a last resort.
 */
function drawScatter(
  scene: Scene, visible: Series[], labels: string[], options: ChartOptions,
  plot: Rect, theme: Theme, measure: TextMeasurer, colorOf: (s: Series) => string,
) {
  const { nodes, hits } = scene;
  const n = labels.length;

  const numericLabels = labels.map(l => {
    const v = Number(String(l).replace(/[^\d.\-+eE]/g, ''));
    return Number.isFinite(v) && String(l).trim() !== '' ? v : null;
  });
  const labelsAreNumeric = numericLabels.filter(v => v !== null).length >= n * 0.8;

  let xs: number[];
  let ySeries: Series[];
  let xTitle: string;

  if (labelsAreNumeric) {
    xs = numericLabels.map(v => v ?? 0);
    ySeries = visible;
    xTitle = '';
  } else if (visible.length >= 2) {
    xs = visible[0].values;
    ySeries = visible.slice(1);
    xTitle = visible[0].name;
  } else {
    xs = labels.map((_, i) => i + 1);
    ySeries = visible;
    xTitle = '';
  }
  if (ySeries.length === 0) return;

  let xMin = Infinity, xMax = -Infinity;
  for (const v of xs) {
    if (!Number.isFinite(v)) continue;
    if (v < xMin) xMin = v;
    if (v > xMax) xMax = v;
  }
  if (xMin === Infinity) return;

  const yExt = extent(ySeries);
  const yScale = niceScale(yExt.min, yExt.max);
  const xScale = niceScale(Math.min(xMin, 0), xMax, 6);

  const yTickLabels = yScale.ticks.map(t => formatValue(t, options.numberFormat, options.valueSuffix));
  const gutterLeft = Math.max(...yTickLabels.map(s => measure(s, TICK_SIZE))) + 12;
  const gutterBottom = xTitle ? 34 : 22;

  const area = {
    x: plot.x + gutterLeft, y: plot.y + 6,
    w: plot.w - gutterLeft - 8, h: plot.h - gutterBottom - 6,
  };
  if (area.w <= 10 || area.h <= 10) return;

  const xSpan = xScale.max - xScale.min || 1;
  const ySpan = yScale.max - yScale.min || 1;
  const px = (v: number) => area.x + ((v - xScale.min) / xSpan) * area.w;
  const py = (v: number) => area.y + area.h - ((v - yScale.min) / ySpan) * area.h;

  if (options.showGrid) {
    for (const t of yScale.ticks) {
      nodes.push({
        kind: 'path', d: `M${area.x} ${py(t)}H${area.x + area.w}`,
        stroke: t === 0 ? theme.axisLine : theme.gridLine, strokeWidth: 1,
      });
    }
    for (const t of xScale.ticks) {
      nodes.push({
        kind: 'path', d: `M${px(t)} ${area.y}V${area.y + area.h}`,
        stroke: t === 0 ? theme.axisLine : theme.gridLine, strokeWidth: 1,
      });
    }
  }

  yScale.ticks.forEach((t, i) => {
    nodes.push({
      kind: 'text', x: area.x - 8, y: py(t) + 3.5, text: yTickLabels[i],
      fill: theme.muted, size: TICK_SIZE, anchor: 'end',
    });
  });
  for (const t of xScale.ticks) {
    nodes.push({
      kind: 'text', x: px(t), y: area.y + area.h + 15,
      text: formatValue(t, options.numberFormat), fill: theme.muted,
      size: TICK_SIZE, anchor: 'middle',
    });
  }
  if (xTitle) {
    nodes.push({
      kind: 'text', x: area.x + area.w / 2, y: area.y + area.h + 30,
      text: xTitle, fill: theme.muted, size: 10, weight: 700, anchor: 'middle',
    });
  }

  ySeries.forEach((s, si) => {
    const color = colorOf(s);
    for (let i = 0; i < n; i++) {
      const xv = xs[i];
      const yv = s.values[i];
      if (!Number.isFinite(xv) || !Number.isFinite(yv)) continue;
      const cx = px(xv);
      const cy = py(yv);
      nodes.push({
        kind: 'circle', cx, cy, r: 5,
        fill: withAlpha(color, 0.8), stroke: color, strokeWidth: 1.6,
      });
      hits.push({
        area: { shape: 'rect', x: cx - 8, y: cy - 8, w: 16, h: 16 },
        seriesIndex: si, pointIndex: i,
        seriesName: s.name, label: labelsAreNumeric ? formatValue(xv, options.numberFormat) : labels[i],
        value: yv, color, anchorX: cx, anchorY: cy,
      });
      if (options.showValues) {
        nodes.push({
          kind: 'text', x: cx, y: cy - 10,
          text: formatValue(yv, options.numberFormat, options.valueSuffix),
          fill: theme.muted, size: 9, weight: 600, anchor: 'middle',
        });
      }
    }
  });
}

// ── Hit testing ─────────────────────────────────────────────────────────────

/** Topmost region under the cursor, in scene coordinates. */
export function hitTest(scene: Scene, x: number, y: number): HitRegion | null {
  for (let i = scene.hits.length - 1; i >= 0; i--) {
    const h = scene.hits[i];
    if (h.area.shape === 'rect') {
      const a = h.area;
      // Zero-height bars (value 0) still deserve a grabbable band.
      const pad = a.h < 4 ? 4 : 0;
      if (x >= a.x && x <= a.x + a.w && y >= a.y - pad && y <= a.y + a.h + pad) return h;
    } else {
      const a = h.area;
      const dx = x - a.cx;
      const dy = y - a.cy;
      const r = Math.hypot(dx, dy);
      if (r < a.r0 || r > a.r1) continue;
      // Normalise both the wedge and the cursor to [-PI/2, 3PI/2) so the
      // wedge that crosses the 12 o'clock seam still matches.
      let ang = Math.atan2(dy, dx);
      while (ang < -Math.PI / 2) ang += Math.PI * 2;
      while (ang >= Math.PI * 1.5) ang -= Math.PI * 2;
      if (ang >= a.a0 && ang <= a.a1) return h;
    }
  }
  return null;
}
