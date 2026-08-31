// ============================================================================
// Shared types for the Aspect Ratio tool.
// ============================================================================

/** Which panel of the workspace is on screen. */
export type Tab = 'calculate' | 'resize' | 'fit' | 'presets';

/** Which of the two dimensions the user is pinning when resizing. */
export type ResizeTarget = 'width' | 'height';

/** How the source is placed inside the target frame. */
export type FitMode = 'cover' | 'contain';

/** A width/height pair in whole pixels. */
export interface Size {
  w: number;
  h: number;
}

/** A ratio expressed as two whole numbers, plus how exact that pair is. */
export interface RationalRatio {
  /** Numerator, e.g. 16. */
  w: number;
  /** Denominator, e.g. 9. */
  h: number;
  /** w / h. */
  decimal: number;
  /**
   * Relative error against the ratio it was derived from, as a fraction
   * (0.0004 = 0.04%). Exactly 0 when the pair divides the input evenly.
   */
  error: number;
  /** True when w/h reproduces the source dimensions exactly. */
  exact: boolean;
}

/** An entry of the known-ratio catalogue. */
export interface KnownRatio {
  id: string;
  /** Display label, e.g. "16:9". */
  name: string;
  w: number;
  h: number;
  /** Translation key for the human name ("Widescreen HD"). */
  labelKey: string;
  /** English fallback for `labelKey`. */
  label: string;
  /** Which group it belongs to in the presets grid. */
  group: 'screen' | 'cinema' | 'social' | 'print';
  /** Bespoke icon id, resolved by `Illustrations.tsx`. */
  icon: 'monitor' | 'ultrawide' | 'square' | 'phone' | 'camera' | 'film' | 'portrait';
  /** Well-known pixel sizes for this ratio. */
  resolutions?: Size[];
  /**
   * Some cinema ratios are conventionally written as a decimal ("2.39:1")
   * rather than as a whole-number pair. When set, this is shown instead.
   */
  cinemaLabel?: string;
}

/** Result of laying a source size inside a target frame. */
export interface FitResult {
  /** The frame the source is being placed into. */
  frame: Size;
  /** Size the source is drawn at, before cropping. */
  drawn: Size;
  /** Visible region of the source, in source pixels (cover crops, contain does not). */
  visible: Size;
  /** Bars added on the left+right (pillarbox), one side, in frame pixels. */
  barX: number;
  /** Bars added on top+bottom (letterbox), one side, in frame pixels. */
  barY: number;
  /** Fraction of the source area thrown away by the crop, 0..1. */
  cropped: number;
  /** Fraction of the frame area covered by bars, 0..1. */
  padded: number;
  /** Scale factor applied to the source. <1 means downscaling. */
  scale: number;
}

/** One step of the non-destructive edit history. Deliberately tiny. */
export interface EditState {
  /** Target ratio as w/h. */
  ratioW: number;
  ratioH: number;
  mode: FitMode;
  /** Pan offset of the source inside the frame, normalised to -1..1. */
  offsetX: number;
  offsetY: number;
  /** Extra zoom on top of the fit scale, 1 = exactly fitted. */
  zoom: number;
}

/** A file waiting for the user to press the button. Nothing runs on drop. */
export interface PendingSource {
  file: File;
  /** Object URL, owned by the component and revoked on replace/unmount. */
  url: string;
  kind: 'image' | 'video';
  /** Slug of the tool this arrived from, when it came through a handoff. */
  from?: string;
}

/** Intrinsic size of a loaded source, once the user asked for it to be read. */
export interface LoadedSource extends PendingSource {
  natural: Size;
  /** Decoded bitmap, kept for the canvas preview. Null for video sources. */
  bitmap: ImageBitmap | HTMLImageElement | null;
}
