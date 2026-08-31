// ============================================================================
// FaviconBolt — shared types
// ============================================================================

export type IconMode = 'emoji' | 'text' | 'image';
export type ShapeKind = 'none' | 'circle' | 'square' | 'rounded' | 'squircle';
export type FillKind = 'solid' | 'gradient';

/**
 * Everything the renderer needs. Deliberately a flat plain object of scalars:
 * the undo history is an array of these, so a 60-step history costs a few KB
 * instead of 60 bitmaps.
 */
export interface IconSettings {
  mode: IconMode;

  // Emoji / text content
  emoji: string;
  text: string;
  textColor: string;
  fontFamily: string;
  fontWeight: number;
  /** Glyph size as a % of the padded content box. */
  fontScale: number;

  // Background plate
  shape: ShapeKind;
  fill: FillKind;
  bgColor: string;
  bgColor2: string;
  gradientAngle: number;

  // Geometry
  /** Inner margin as a % of the icon size. */
  padding: number;
  /** Stroke as a % of the icon size, drawn inside the plate. */
  borderWidth: number;
  borderColor: string;

  // Manual transform of the content inside the plate
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;

  // Source handling
  /** Crops the transparent margin off an uploaded logo before fitting it. */
  trim: boolean;
  /** Clips the artwork to the plate outline instead of letting it overflow. */
  clipToShape: boolean;

  // Export
  /** iOS ignores alpha on the home screen, so the touch icon gets flattened. */
  appleBg: string;
  sharpenSmall: boolean;
  appName: string;
  appShortName: string;
  themeColor: string;
}

export interface SourceImage {
  img: HTMLImageElement;
  url: string;
  name: string;
  width: number;
  height: number;
  /** Raw markup when the upload was an SVG — lets favicon.svg stay vector. */
  svgText: string | null;
}

/** One file in the generated pack. */
export interface AssetSpec {
  /** Stable id used by the checkbox list and the i18n keys. */
  id: AssetId;
  /** Filename inside the ZIP. */
  file: string;
}

export type AssetId =
  | 'ico'
  | 'png16'
  | 'png32'
  | 'png48'
  | 'svg'
  | 'apple'
  | 'android192'
  | 'android512'
  | 'maskable'
  | 'mstile'
  | 'manifest'
  | 'browserconfig'
  | 'snippet';

export interface QualityReport {
  /** Mean |Laplacian| of the luminance channel — higher means crisper edges. */
  before: number;
  after: number;
  /** after / before, as a percentage gain. */
  gainPct: number;
}
