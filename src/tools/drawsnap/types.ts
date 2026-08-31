// ============================================================================
// DrawSnap document model
// ----------------------------------------------------------------------------
// Everything lives in *board space*: a fixed-size document (like a sheet of
// paper) that the viewport zooms and pans over. The previous version stored
// screen pixels, so resizing the window silently clipped the drawing and the
// export resolution was whatever the container happened to measure.
// ============================================================================

export type ToolId =
  | 'select'
  | 'pencil'
  | 'marker'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'ellipse'
  | 'triangle'
  | 'text';

/** A sampled input point. `p` is pressure in 0..1 (pen) or a synthesised taper. */
export interface Pt {
  x: number;
  y: number;
  p: number;
}

interface ShapeBase {
  id: string;
  color: string;
  /** Stroke width in board units. */
  width: number;
  opacity: number;
}

export interface FreeShape extends ShapeBase {
  type: 'pencil' | 'marker' | 'eraser';
  points: Pt[];
}

export interface GeoShape extends ShapeBase {
  type: 'line' | 'arrow' | 'rect' | 'ellipse' | 'triangle';
  a: Pt;
  b: Pt;
  fill: boolean;
}

export interface TextShape extends ShapeBase {
  type: 'text';
  a: Pt;
  text: string;
  /** Font size in board units. */
  size: number;
}

export interface ImageShape extends ShapeBase {
  type: 'image';
  a: Pt;
  b: Pt;
  /** Registry key — the decoded bitmap lives in lib/images.ts, never in state. */
  src: string;
}

export type Shape = FreeShape | GeoShape | TextShape | ImageShape;

export const isFree = (s: Shape): s is FreeShape =>
  s.type === 'pencil' || s.type === 'marker' || s.type === 'eraser';
export const isGeo = (s: Shape): s is GeoShape =>
  s.type === 'line' || s.type === 'arrow' || s.type === 'rect' || s.type === 'ellipse' || s.type === 'triangle';

/** Background pattern painted under the artwork. Never baked into the shapes layer. */
export type BgPattern = 'dots' | 'grid' | 'lines' | 'none';

/** Paper colour. `transparent` is what makes a usable PNG overlay. */
export type Surface = 'dark' | 'light' | 'transparent';

export interface Board {
  w: number;
  h: number;
}

export interface Viewport {
  /** Board units → CSS pixels. */
  scale: number;
  /** Translation in CSS pixels. */
  tx: number;
  ty: number;
}

export interface DocState {
  board: Board;
  shapes: Shape[];
}

/** A file waiting for the user to decide what to do with it. Nothing runs on drop. */
export interface PendingImage {
  name: string;
  url: string;
  width: number;
  height: number;
  /** Where it came from, for the "handed over by X" hint. */
  from?: string;
}

export const BOARD_PRESETS: { id: string; label: string; w: number; h: number }[] = [
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'a4', label: 'A4', w: 1240, h: 1754 },
  { id: 'story', label: '1080 × 1920', w: 1080, h: 1920 },
];
