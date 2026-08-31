// ============================================================================
// MemeBolt document model
// ----------------------------------------------------------------------------
// Everything the renderer needs lives in `MemeDoc`, and `MemeDoc` is plain JSON.
// That is deliberate: the undo stack stores whole documents, and a document is
// a few hundred bytes per layer instead of a full RGBA bitmap (a 2000x2000
// snapshot would be 16 MB — a hundred of those is a dead tab).
//
// The heavy part (the decoded background) is kept OUTSIDE the document, in
// `BackdropSource`, so it is never copied by the history.
// ============================================================================

export type LayerKind = 'text' | 'sticker';

export interface LayerCommon {
  id: string;
  kind: LayerKind;
  /** Centre of the layer, as a percentage of the canvas box (0-100). */
  x: number;
  y: number;
  /** Degrees, -180..180. */
  rotation: number;
  /** 0-1. */
  opacity: number;
  locked: boolean;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextLayer extends LayerCommon {
  kind: 'text';
  text: string;
  /** Font size as a percentage of the canvas height. */
  fontSize: number;
  /** Wrap width as a percentage of the canvas width. */
  boxWidth: number;
  /** Line height multiplier. */
  lineHeight: number;
  align: TextAlign;
  color: string;
  strokeColor: string;
  /** Outline thickness as a percentage of the font size. */
  strokeWidth: number;
  /** Drop-shadow blur as a percentage of the font size. 0 = off. */
  shadow: number;
  fontFamily: string;
  uppercase: boolean;
  /** Extra tracking, in em. */
  letterSpacing: number;
}

export interface StickerLayer extends LayerCommon {
  kind: 'sticker';
  /** Key in the STICKERS map. */
  sticker: string;
  /** Width as a percentage of the canvas width. */
  size: number;
  /** Overrides the sticker's own palette for the monochrome ones. */
  color: string;
  flipX: boolean;
}

export type Layer = TextLayer | StickerLayer;

export type BackdropFit = 'cover' | 'contain' | 'stretch';

export interface MemeDoc {
  /** Pixel width of the exported meme at 1x. */
  width: number;
  /** Pixel height of the picture area at 1x (the caption bar adds on top). */
  height: number;
  /** White meme bar above the picture, as a percentage of the picture height. */
  captionBar: number;
  /** Colour of the bar and of the letterboxing left by `contain`. */
  padColor: string;
  fit: BackdropFit;
  /** Bottom-most layer first. */
  layers: Layer[];
}

/** What is painted underneath the layers. Never enters the undo history. */
export type BackdropSource =
  | { kind: 'template'; id: string; name: string; svg: string; ratio: number }
  | { kind: 'image'; name: string; image: CanvasImageSource; width: number; height: number }
  | { kind: 'blank'; color: string };

export interface Selection {
  id: string;
}

export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface ExportSettings {
  format: ExportFormat;
  /** Multiplier over `doc.width`. */
  scale: number;
  /** 0-1, ignored for PNG. */
  quality: number;
}
