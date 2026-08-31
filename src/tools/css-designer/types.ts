// ============================================================================
// CSS Designer — data model
// ----------------------------------------------------------------------------
// Every panel edits one slice of `Design`. The whole object is a few hundred
// bytes of plain JSON, which is what makes undo/redo, the permalink and the
// autosave affordable: we snapshot the description of the style, never a
// rendered bitmap.
// ============================================================================

export type TabId = 'glass' | 'shadow' | 'gradient' | 'radius' | 'filter';

export type CodeFormat = 'css' | 'tailwind' | 'variables' | 'scss';

/** Output notation for every colour the generator prints. */
export type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'oklch';

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ---------------------------------------------------------------------------
// Glassmorphism
// ---------------------------------------------------------------------------
export interface GlassState {
  blur: number;
  opacity: number;
  saturation: number;
  brightness: number;
  borderWidth: number;
  borderOpacity: number;
  bgColor: string;
  borderColor: string;
  radius: number;
  /** Adds the 1px inner light line that sells the "pane of glass" look. */
  innerHighlight: boolean;
  /** Drop shadow under the pane, 0 disables it. */
  shadowStrength: number;
}

// ---------------------------------------------------------------------------
// Box shadow — a stack of layers, which is what separates a real shadow from
// the flat single-layer blur every free generator produces.
// ---------------------------------------------------------------------------
export interface ShadowLayer {
  id: string;
  enabled: boolean;
  inset: boolean;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
}

export interface ShadowState {
  layers: ShadowLayer[];
  cardBg: string;
  radius: number;
}

// ---------------------------------------------------------------------------
// Gradient
// ---------------------------------------------------------------------------
export type GradientKind = 'linear' | 'radial' | 'conic';
export type RadialShape = 'circle' | 'ellipse';
export type RadialSize = 'farthest-corner' | 'farthest-side' | 'closest-corner' | 'closest-side';
/** Colour space the browser interpolates in. `srgb` means "omit the hint". */
export type Interpolation = 'srgb' | 'oklab' | 'oklch' | 'hsl' | 'srgb-linear';

export interface GradientStop {
  id: string;
  color: string;
  /** 0–100 %. */
  position: number;
  opacity: number;
}

export interface GradientState {
  kind: GradientKind;
  repeating: boolean;
  /** Degrees, used by linear and conic. */
  angle: number;
  shape: RadialShape;
  size: RadialSize;
  /** Centre of radial/conic gradients, in %. */
  posX: number;
  posY: number;
  interpolation: Interpolation;
  stops: GradientStop[];
}

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------
export interface RadiusState {
  /** One slider drives all four corners. */
  linked: boolean;
  tl: number;
  tr: number;
  br: number;
  bl: number;
  unit: 'px' | '%';
  /** Free-form 8-value blob shape, edited by text or by the preset grid. */
  organic: boolean;
  organicValue: string;
  /** Card colour behind the shape so the silhouette is readable. */
  fill: string;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
export interface FilterState {
  /** When true the stack is emitted as `backdrop-filter` instead of `filter`. */
  backdrop: boolean;
  blur: number;
  brightness: number;
  contrast: number;
  saturate: number;
  hueRotate: number;
  grayscale: number;
  sepia: number;
  invert: number;
  opacity: number;
  dropShadowOn: boolean;
  dropShadowX: number;
  dropShadowY: number;
  dropShadowBlur: number;
  dropShadowColor: string;
}

// ---------------------------------------------------------------------------
export interface Design {
  glass: GlassState;
  shadow: ShadowState;
  gradient: GradientState;
  radius: RadiusState;
  filter: FilterState;
}

/** What the preview and the exporter need beyond the design itself. */
export type PreviewBackdrop = 'darkGrid' | 'lightGrid' | 'mesh' | 'vibrant' | 'photo';

export interface ParseResult {
  /** Which tab the pasted declaration belongs to, or null when unrecognised. */
  tab: TabId | null;
  patch: Partial<Design>;
  /** Human-readable list of what was applied, for the confirmation line. */
  applied: string[];
}
