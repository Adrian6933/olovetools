// ============================================================================
// GraphFlow — shared types
// ----------------------------------------------------------------------------
// The dataset is the single source of truth. Everything the user can change
// (values, series names, colours, chart type) lives here, so undo/redo only has
// to snapshot this object — never the rendered bitmap.
// ============================================================================

/** Per-series override so a single chart can mix bars and lines. */
export type SeriesType = 'auto' | 'bar' | 'line';

export interface Series {
  name: string;
  values: number[];
  /** Overrides the palette colour for this series. */
  color?: string;
  /** `auto` follows the chart type; `bar`/`line` build a combo chart. */
  type?: SeriesType;
  /** Hidden series stay in the dataset but leave the chart. */
  hidden?: boolean;
}

export interface DataSet {
  labels: string[];
  series: Series[];
}

export type ChartType =
  | 'bar'
  | 'horizontal-bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'radar'
  | 'scatter';

/** Bars can sit side by side, stack, or stack normalised to 100%. */
export type StackMode = 'none' | 'stack' | 'percent';

/** Canvas aspect ratios offered in the export panel. */
export type CanvasPreset = 'auto' | 'square' | 'wide' | 'tall';

/**
 * Number rendering. Deliberately NOT `Intl.NumberFormat`: the chart is drawn
 * after mount but the data table is server-rendered, and a locale-dependent
 * format there desynchronises hydration.
 */
export type NumberFormat = 'plain' | 'thousands' | 'compact';

export interface ChartOptions {
  chartType: ChartType;
  title: string;
  stack: StackMode;
  showLegend: boolean;
  showGrid: boolean;
  showValues: boolean;
  roundedBars: boolean;
  fillArea: boolean;
  doughnut: boolean;
  smoothLine: boolean;
  darkTheme: boolean;
  /** Draws a horizontal reference line at this value. `null` disables it. */
  referenceLine: number | null;
  numberFormat: NumberFormat;
  /** Appended to every value label and axis tick, e.g. "%" or " €". */
  valueSuffix: string;
  palette: string[];
  paletteName: string;
  canvasPreset: CanvasPreset;
}

// ── Scene: the intermediate representation ──────────────────────────────────
// `buildScene` turns data + options into flat drawing primitives. The canvas
// backend and the SVG backend both consume this, so a chart exported as vector
// is pixel-for-pixel the same layout as the one on screen, and hit-testing for
// tooltips reads the same geometry instead of recomputing it.

export interface TextNode {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  fill: string;
  size: number;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  /** Degrees, rotated about (x, y). Used for cramped axis labels. */
  rotate?: number;
  opacity?: number;
}

export interface PathNode {
  kind: 'path';
  /** SVG path data — fed to `new Path2D(d)` on canvas and to `<path d>` in SVG. */
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  dash?: number[];
  closed?: boolean;
}

export interface CircleNode {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface RectNode {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export type SceneNode = TextNode | PathNode | CircleNode | RectNode;

/** A rectangular target (bar, point, legend swatch). */
export interface RectHit {
  shape: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A pie/doughnut wedge, tested in polar coordinates. */
export interface SliceHit {
  shape: 'slice';
  cx: number;
  cy: number;
  r0: number;
  r1: number;
  a0: number;
  a1: number;
}

export interface HitRegion {
  area: RectHit | SliceHit;
  seriesIndex: number;
  pointIndex: number;
  seriesName: string;
  label: string;
  value: number;
  color: string;
  /** Anchor for the tooltip, in scene coordinates. */
  anchorX: number;
  anchorY: number;
}

export interface Scene {
  width: number;
  height: number;
  background: string;
  nodes: SceneNode[];
  hits: HitRegion[];
  /** Non-fatal note surfaced in the UI, e.g. "showing the first 5,000 rows". */
  notice?: string;
}

/** Injected so layout can measure text identically for canvas and SVG. */
export type TextMeasurer = (text: string, size: number, weight?: number) => number;

export const CHART_FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
