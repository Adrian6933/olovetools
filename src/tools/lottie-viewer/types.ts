// ============================================================================
// Shared types for the Lottie Viewer.
// ============================================================================

/** A Lottie document. Deliberately loose: we accept anything the player accepts. */
export interface LottieJson {
  v?: string;
  fr?: number;
  ip?: number;
  op?: number;
  w?: number;
  h?: number;
  nm?: string;
  ddd?: number;
  assets?: any[];
  layers?: any[];
  markers?: any[];
  [key: string]: any;
}

/** Where a colour lives and how it has to be written back. */
export type ColorWriteMode =
  /** `k` is a plain `[r,g,b]`/`[r,g,b,a]` array (static fill/stroke). */
  | 'rgbArray'
  /** A flat gradient stop table: `[offset,r,g,b, offset,r,g,b, …]`. */
  | 'gradientStop'
  /** A solid layer's `sc` field, a `#rrggbb` string. */
  | 'solidHex';

export type ColorKind = 'fill' | 'stroke' | 'gradient' | 'solid';

/**
 * One editable colour occurrence, addressed by its path from the document root.
 *
 * Storing paths instead of rebuilding the tree is the whole point: patching a
 * colour touches `refs.length` nodes rather than every node in a multi-megabyte
 * document, so dragging a colour picker stays interactive.
 */
export interface ColorRef {
  /** Path from the document root to the node that owns the value. */
  path: (string | number)[];
  mode: ColorWriteMode;
  /** The colour as authored, lowercase `#rrggbb`. */
  hex: string;
  kind: ColorKind;
  /** Name of the layer this colour belongs to, for the layer tree. */
  layerName: string;
  /** Index of the stop inside a flat gradient table (`gradientStop` only). */
  stopIndex?: number;
  /** True when the colour is part of an animated property (one ref per keyframe). */
  animated: boolean;
}

/** All occurrences of one distinct colour, as shown in the palette. */
export interface ColorSwatch {
  hex: string;
  refs: ColorRef[];
  kinds: ColorKind[];
  /** True when at least one occurrence is animated. */
  animated: boolean;
}

/** A top-level layer, for the layer tree / visibility toggles. */
export interface LayerInfo {
  index: number;
  name: string;
  /** Lottie layer type code (`ty`). */
  type: number;
  typeLabel: string;
  hidden: boolean;
  /** In/out points in frames. */
  ip: number;
  op: number;
  hasMatte: boolean;
  hasEffects: boolean;
  hasExpressions: boolean;
}

export type FindingLevel = 'info' | 'warn' | 'error';

/** One line of the compatibility report shown before the file is opened. */
export interface Finding {
  level: FindingLevel;
  /** i18n key suffix, resolved against the dictionary with an English fallback. */
  key: string;
  fallback: string;
  /** Interpolated into `{n}` in the message. */
  count?: number;
  detail?: string;
}

/** Everything we learn from a document without rendering it. */
export interface Diagnostics {
  bytes: number;
  layerCount: number;
  precompCount: number;
  assetImageCount: number;
  externalAssetCount: number;
  expressionCount: number;
  textLayerCount: number;
  effectCount: number;
  matteCount: number;
  mergePathCount: number;
  threeDLayerCount: number;
  findings: Finding[];
}

/** A file waiting for the user to press the button. Nothing renders until then. */
export interface StagedFile {
  json: LottieJson;
  name: string;
  /** Which container the animation arrived in. */
  source: 'json' | 'dotlottie' | 'tgs' | 'gzip' | 'paste' | 'handoff';
  diagnostics: Diagnostics;
}

export interface OptimizeOptions {
  /** Decimal places kept on every number. 2 is visually lossless for most files. */
  precision: number;
  dropHidden: boolean;
  dropNames: boolean;
  dropExpressions: boolean;
}

export interface OptimizeResult {
  json: LottieJson;
  bytesBefore: number;
  bytesAfter: number;
  removedLayers: number;
  removedExpressions: number;
}

/** The complete, undoable edit state. Tiny on purpose — no bitmaps, no JSON copies. */
export interface EditState {
  /** originalHex → newHex. Only entries that actually differ are kept. */
  colors: Record<string, string>;
  /** Layer indices the user hid by hand. */
  hiddenLayers: number[];
  /** Playback trim, in frames. `null` means "the document's own range". */
  trim: [number, number] | null;
  /** Frame rate override. `null` means "the document's own rate". */
  fps: number | null;
}
