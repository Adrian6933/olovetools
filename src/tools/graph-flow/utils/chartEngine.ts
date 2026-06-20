import type { DataSet } from './dataParser';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'radar' | 'scatter' | 'horizontal-bar';

export interface ChartOptions {
  chartType: ChartType;
  title: string;
  showLegend: boolean;
  showGrid: boolean;
  showValues: boolean;
  animate: boolean;
  roundedBars: boolean;
  fillArea: boolean;
  doughnut: boolean;
  smoothLine: boolean;
  darkTheme: boolean;
  palette: string[];
}

// ── Color Palettes ──
export const COLOR_PALETTES: Record<string, string[]> = {
  vibrant:   ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'],
  pastel:    ['#fbbf24', '#fb7185', '#93c5fd', '#6ee7b7', '#c4b5fd', '#f9a8d4', '#67e8f9', '#bef264', '#fdba74', '#a5b4fc'],
  monochrome:['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', '#a16207'],
  ocean:     ['#0ea5e9', '#06b6d4', '#14b8a6', '#0d9488', '#0891b2', '#0284c7', '#0369a1', '#155e75', '#164e63', '#0e7490'],
  sunset:    ['#f97316', '#ef4444', '#ec4899', '#f59e0b', '#eab308', '#d946ef', '#f43f5e', '#fb923c', '#fbbf24', '#a855f7'],
  neon:      ['#22d3ee', '#a78bfa', '#fb7185', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#c084fc', '#4ade80', '#f87171'],
};

// ── Helpers ──
const PADDING = { top: 60, right: 30, bottom: 60, left: 70 };
const LEGEND_HEIGHT = 40;

function getThemeColors(dark: boolean) {
  return {
    bg: dark ? '#0f172a' : '#ffffff',
    text: dark ? '#e2e8f0' : '#1e293b',
    gridLine: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    axisLine: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
  };
}

function niceMax(val: number): number {
  if (val <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(val)));
  const normalized = val / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  if (h < 0) { y += h; h = -h; }
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Main Render ──
export function renderChart(
  canvas: HTMLCanvasElement,
  data: DataSet,
  options: ChartOptions
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const theme = getThemeColors(options.darkTheme);
  const colors = options.palette;

  // Background
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);

  // Title
  if (options.title) {
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(options.title, w / 2, 30);
  }

  const legendH = options.showLegend ? LEGEND_HEIGHT : 0;

  switch (options.chartType) {
    case 'bar':
      drawBarChart(ctx, data, options, colors, theme, w, h, legendH, false);
      break;
    case 'horizontal-bar':
      drawBarChart(ctx, data, options, colors, theme, w, h, legendH, true);
      break;
    case 'line':
      drawLineChart(ctx, data, options, colors, theme, w, h, legendH, false);
      break;
    case 'area':
      drawLineChart(ctx, data, options, colors, theme, w, h, legendH, true);
      break;
    case 'pie':
      drawPieChart(ctx, data, options, colors, theme, w, h, legendH);
      break;
    case 'radar':
      drawRadarChart(ctx, data, options, colors, theme, w, h, legendH);
      break;
    case 'scatter':
      drawScatterChart(ctx, data, options, colors, theme, w, h, legendH);
      break;
  }

  // Legend
  if (options.showLegend && data.series.length > 0) {
    const legendY = h - legendH + 10;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';

    const items = options.chartType === 'pie'
      ? data.labels.map((l, i) => ({ label: l, color: colors[i % colors.length] }))
      : data.series.map((s, i) => ({ label: s.name, color: colors[i % colors.length] }));

    let xOffset = PADDING.left;
    for (const item of items) {
      ctx.fillStyle = item.color;
      ctx.fillRect(xOffset, legendY, 12, 12);
      ctx.fillStyle = theme.text;
      ctx.fillText(item.label, xOffset + 16, legendY + 10);
      xOffset += ctx.measureText(item.label).width + 32;
      if (xOffset > w - 50) { break; }
    }
  }
}

// ── Bar Chart ──
function drawBarChart(
  ctx: CanvasRenderingContext2D, data: DataSet, options: ChartOptions,
  colors: string[], theme: ReturnType<typeof getThemeColors>,
  w: number, h: number, legendH: number, horizontal: boolean
) {
  const pad = { ...PADDING };
  if (horizontal) { pad.left = 100; pad.bottom = 40; }
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom - legendH;

  const allValues = data.series.flatMap(s => s.values);
  const maxVal = niceMax(Math.max(...allValues, 0));
  const n = data.labels.length;
  const seriesCount = data.series.length;

  // Grid + axis
  ctx.strokeStyle = theme.axisLine;
  ctx.lineWidth = 1;
  const gridSteps = 5;

  if (!horizontal) {
    // Vertical bars
    if (options.showGrid) {
      for (let i = 0; i <= gridSteps; i++) {
        const y = pad.top + chartH - (i / gridSteps) * chartH;
        ctx.strokeStyle = theme.gridLine;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + chartW, y);
        ctx.stroke();
        ctx.fillStyle = theme.text;
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round((i / gridSteps) * maxVal).toLocaleString(), pad.left - 8, y + 4);
      }
    }

    // X-axis labels
    const groupWidth = chartW / n;
    const barWidth = (groupWidth * 0.7) / seriesCount;
    const barGap = groupWidth * 0.3 / 2;

    for (let i = 0; i < n; i++) {
      const x = pad.left + i * groupWidth + groupWidth / 2;
      ctx.fillStyle = theme.text;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data.labels[i], x, pad.top + chartH + 18);

      for (let s = 0; s < seriesCount; s++) {
        const val = data.series[s].values[i] || 0;
        const barH = (val / maxVal) * chartH;
        const bx = pad.left + i * groupWidth + barGap + s * barWidth;
        const by = pad.top + chartH - barH;

        ctx.fillStyle = colors[s % colors.length];
        if (options.roundedBars) {
          drawRoundedRect(ctx, bx, by, barWidth - 2, barH, 4);
          ctx.fill();
        } else {
          ctx.fillRect(bx, by, barWidth - 2, barH);
        }

        if (options.showValues) {
          ctx.fillStyle = theme.text;
          ctx.font = '9px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(val.toLocaleString(), bx + (barWidth - 2) / 2, by - 4);
        }
      }
    }
  } else {
    // Horizontal bars
    if (options.showGrid) {
      for (let i = 0; i <= gridSteps; i++) {
        const x = pad.left + (i / gridSteps) * chartW;
        ctx.strokeStyle = theme.gridLine;
        ctx.beginPath();
        ctx.moveTo(x, pad.top);
        ctx.lineTo(x, pad.top + chartH);
        ctx.stroke();
        ctx.fillStyle = theme.text;
        ctx.font = '10px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round((i / gridSteps) * maxVal).toLocaleString(), x, pad.top + chartH + 16);
      }
    }

    const groupH = chartH / n;
    const barH = (groupH * 0.7) / seriesCount;
    const barGap = groupH * 0.3 / 2;

    for (let i = 0; i < n; i++) {
      ctx.fillStyle = theme.text;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(data.labels[i], pad.left - 8, pad.top + i * groupH + groupH / 2 + 4);

      for (let s = 0; s < seriesCount; s++) {
        const val = data.series[s].values[i] || 0;
        const barW = (val / maxVal) * chartW;
        const by = pad.top + i * groupH + barGap + s * barH;

        ctx.fillStyle = colors[s % colors.length];
        if (options.roundedBars) {
          drawRoundedRect(ctx, pad.left, by, barW, barH - 2, 4);
          ctx.fill();
        } else {
          ctx.fillRect(pad.left, by, barW, barH - 2);
        }

        if (options.showValues) {
          ctx.fillStyle = theme.text;
          ctx.font = '9px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(val.toLocaleString(), pad.left + barW + 4, by + (barH - 2) / 2 + 3);
        }
      }
    }
  }
}

// ── Line / Area Chart ──
function drawLineChart(
  ctx: CanvasRenderingContext2D, data: DataSet, options: ChartOptions,
  colors: string[], theme: ReturnType<typeof getThemeColors>,
  w: number, h: number, legendH: number, isArea: boolean
) {
  const chartW = w - PADDING.left - PADDING.right;
  const chartH = h - PADDING.top - PADDING.bottom - legendH;
  const allValues = data.series.flatMap(s => s.values);
  const maxVal = niceMax(Math.max(...allValues, 0));
  const n = data.labels.length;
  const gridSteps = 5;

  // Grid
  if (options.showGrid) {
    for (let i = 0; i <= gridSteps; i++) {
      const y = PADDING.top + chartH - (i / gridSteps) * chartH;
      ctx.strokeStyle = theme.gridLine;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = theme.text;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((i / gridSteps) * maxVal).toLocaleString(), PADDING.left - 8, y + 4);
    }
  }

  // X labels
  for (let i = 0; i < n; i++) {
    const x = PADDING.left + (i / (n - 1 || 1)) * chartW;
    ctx.fillStyle = theme.text;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.labels[i], x, PADDING.top + chartH + 18);
  }

  // Draw each series
  for (let s = 0; s < data.series.length; s++) {
    const points = data.series[s].values.map((v, i) => ({
      x: PADDING.left + (i / (n - 1 || 1)) * chartW,
      y: PADDING.top + chartH - (v / maxVal) * chartH,
    }));

    const color = colors[s % colors.length];

    // Area fill
    if (isArea || options.fillArea) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, PADDING.top + chartH);
      if (options.smoothLine && points.length > 2) {
        ctx.lineTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const cpx = (points[i].x + points[i + 1].x) / 2;
          ctx.bezierCurveTo(cpx, points[i].y, cpx, points[i + 1].y, points[i + 1].x, points[i + 1].y);
        }
      } else {
        points.forEach(p => ctx.lineTo(p.x, p.y));
      }
      ctx.lineTo(points[points.length - 1].x, PADDING.top + chartH);
      ctx.closePath();
      ctx.fillStyle = color + '30';
      ctx.fill();
    }

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (options.smoothLine && points.length > 2) {
      for (let i = 0; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2;
        ctx.bezierCurveTo(cpx, points[i].y, cpx, points[i + 1].y, points[i + 1].x, points[i + 1].y);
      }
    } else {
      points.forEach(p => ctx.lineTo(p.x, p.y));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dots + values
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = theme.bg;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (options.showValues) {
      ctx.fillStyle = theme.text;
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      data.series[s].values.forEach((v, i) => {
        ctx.fillText(v.toLocaleString(), points[i].x, points[i].y - 10);
      });
    }
  }
}

// ── Pie / Doughnut Chart ──
function drawPieChart(
  ctx: CanvasRenderingContext2D, data: DataSet, options: ChartOptions,
  colors: string[], theme: ReturnType<typeof getThemeColors>,
  w: number, h: number, legendH: number
) {
  const chartH = h - PADDING.top - legendH - 20;
  const cx = w / 2;
  const cy = PADDING.top + chartH / 2;
  const radius = Math.min(chartH, w - 80) / 2 - 10;

  const values = data.series[0]?.values || [];
  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;

  for (let i = 0; i < values.length; i++) {
    const slice = (values[i] / total) * Math.PI * 2;
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // Slice border
    ctx.strokeStyle = theme.bg;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Value label
    if (options.showValues && slice > 0.15) {
      const midAngle = startAngle + slice / 2;
      const labelR = radius * 0.65;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const pct = ((values[i] / total) * 100).toFixed(1) + '%';
      ctx.fillText(pct, lx, ly + 4);
    }

    startAngle = endAngle;
  }

  // Doughnut hole
  if (options.doughnut) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = theme.bg;
    ctx.fill();
  }
}

// ── Radar Chart ──
function drawRadarChart(
  ctx: CanvasRenderingContext2D, data: DataSet, options: ChartOptions,
  colors: string[], theme: ReturnType<typeof getThemeColors>,
  w: number, h: number, legendH: number
) {
  const chartH = h - PADDING.top - legendH - 20;
  const cx = w / 2;
  const cy = PADDING.top + chartH / 2;
  const radius = Math.min(chartH, w - 80) / 2 - 20;
  const n = data.labels.length;
  if (n < 3) return;

  const angleStep = (Math.PI * 2) / n;
  const allValues = data.series.flatMap(s => s.values);
  const maxVal = niceMax(Math.max(...allValues, 0));

  // Grid rings
  const rings = 5;
  for (let r = 1; r <= rings; r++) {
    const rr = (r / rings) * radius;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = cx + Math.cos(angle) * rr;
      const y = cy + Math.sin(angle) * rr;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Axis spokes + labels
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = theme.gridLine;
    ctx.stroke();

    const lx = cx + Math.cos(angle) * (radius + 16);
    const ly = cy + Math.sin(angle) * (radius + 16);
    ctx.fillStyle = theme.text;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.labels[i], lx, ly + 4);
  }

  // Data polygons
  for (let s = 0; s < data.series.length; s++) {
    const color = colors[s % colors.length];
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const val = (data.series[s].values[i] || 0) / maxVal;
      const x = cx + Math.cos(angle) * radius * val;
      const y = cy + Math.sin(angle) * radius * val;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color + '30';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// ── Scatter Chart ──
function drawScatterChart(
  ctx: CanvasRenderingContext2D, data: DataSet, options: ChartOptions,
  colors: string[], theme: ReturnType<typeof getThemeColors>,
  w: number, h: number, legendH: number
) {
  // Re-use line chart logic but only draw dots
  const chartW = w - PADDING.left - PADDING.right;
  const chartH = h - PADDING.top - PADDING.bottom - legendH;
  const allValues = data.series.flatMap(s => s.values);
  const maxVal = niceMax(Math.max(...allValues, 0));
  const n = data.labels.length;
  const gridSteps = 5;

  if (options.showGrid) {
    for (let i = 0; i <= gridSteps; i++) {
      const y = PADDING.top + chartH - (i / gridSteps) * chartH;
      ctx.strokeStyle = theme.gridLine;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartW, y);
      ctx.stroke();
      ctx.fillStyle = theme.text;
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round((i / gridSteps) * maxVal).toLocaleString(), PADDING.left - 8, y + 4);
    }
  }

  for (let i = 0; i < n; i++) {
    const x = PADDING.left + (i / (n - 1 || 1)) * chartW;
    ctx.fillStyle = theme.text;
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(data.labels[i], x, PADDING.top + chartH + 18);
  }

  for (let s = 0; s < data.series.length; s++) {
    const color = colors[s % colors.length];
    data.series[s].values.forEach((v, i) => {
      const x = PADDING.left + (i / (n - 1 || 1)) * chartW;
      const y = PADDING.top + chartH - (v / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color + 'cc';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (options.showValues) {
        ctx.fillStyle = theme.text;
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(v.toLocaleString(), x, y - 10);
      }
    });
  }
}

/**
 * Export canvas as PNG data URL
 */
export function canvasToPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Export canvas as downloadable PNG blob
 */
export function downloadCanvasPNG(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
