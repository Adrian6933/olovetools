// ============================================================================
// Text metrics and wrapping
// ----------------------------------------------------------------------------
// The old version never called measureText: it guessed the selection box
// (80% of the canvas width, always) and drew one single unbreakable line that
// ran off the image. Everything here exists so the caption wraps like a real
// meme caption and so the handles sit on the actual glyphs.
// ============================================================================

import type { TextLayer } from '../types';

/** Families offered in the picker. `stack` is what actually reaches the canvas. */
export interface FontOption {
  id: string;
  label: string;
  /** Weight used for this family — Impact is already heavy, faux-bolding it smears the outline. */
  weight: number;
  stack: string;
  /** First real family name, used for the availability probe. */
  probe: string;
}

export const FONTS: FontOption[] = [
  { id: 'impact', label: 'Impact', weight: 400, probe: 'Impact', stack: "Impact, Haettenschweiler, 'Arial Narrow Bold', 'Anton', sans-serif" },
  { id: 'arial-black', label: 'Arial Black', weight: 400, probe: 'Arial Black', stack: "'Arial Black', 'Arial Bold', Gadget, sans-serif" },
  { id: 'sans', label: 'Sans', weight: 800, probe: 'Helvetica', stack: "Helvetica, Arial, sans-serif" },
  { id: 'serif', label: 'Serif', weight: 700, probe: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
  { id: 'mono', label: 'Mono', weight: 700, probe: 'Courier New', stack: "'Courier New', monospace" },
  { id: 'comic', label: 'Comic', weight: 700, probe: 'Comic Sans MS', stack: "'Comic Sans MS', 'Chalkboard SE', cursive" },
];

export const getFont = (id: string): FontOption => FONTS.find(f => f.id === id) || FONTS[0];

// ---------------------------------------------------------------------------
// Scratch context, shared by every measurement. Creating one per call is what
// turns a slider drag into a stutter.
// ---------------------------------------------------------------------------
let scratch: CanvasRenderingContext2D | null = null;
function measureCtx(): CanvasRenderingContext2D {
  if (!scratch) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 8;
    scratch = canvas.getContext('2d')!;
  }
  return scratch;
}

/** True when the browser can honour `ctx.letterSpacing` (Chromium 99+, Safari 17+). */
export const SUPPORTS_LETTER_SPACING = (() => {
  if (typeof document === 'undefined') return false;
  try {
    return 'letterSpacing' in measureCtx();
  } catch {
    return false;
  }
})();

/**
 * Font availability probe by width comparison: `document.fonts.check()` answers
 * "is this font *loaded*", which is always true for a local family the machine
 * does not actually have. Impact ships with Windows and macOS but not with
 * Android or most Linux distros, and silently falling back to Arial is exactly
 * the kind of thing that makes an export look nothing like the preview.
 */
const availability = new Map<string, boolean>();
export function isFontAvailable(name: string): boolean {
  if (typeof document === 'undefined') return true;
  const cached = availability.get(name);
  if (cached !== undefined) return cached;

  const ctx = measureCtx();
  const sample = 'MWQ@#mwil1—';
  const widthIn = (family: string) => {
    ctx.font = `72px ${family}`;
    return ctx.measureText(sample).width;
  };

  const generics = ['monospace', 'serif', 'sans-serif'];
  const ok = generics.some(g => Math.abs(widthIn(`"${name}", ${g}`) - widthIn(g)) > 0.5);
  availability.set(name, ok);
  return ok;
}

export function fontString(layer: TextLayer, fontPx: number): string {
  const font = getFont(layer.fontFamily);
  return `${font.weight} ${fontPx}px ${font.stack}`;
}

export interface TextLayout {
  lines: string[];
  /** Widest line, in canvas pixels. */
  width: number;
  /** Total block height, in canvas pixels. */
  height: number;
  fontPx: number;
  lineHeightPx: number;
}

function applyFont(ctx: CanvasRenderingContext2D, layer: TextLayer, fontPx: number): void {
  ctx.font = fontString(layer, fontPx);
  if (SUPPORTS_LETTER_SPACING) {
    (ctx as any).letterSpacing = `${layer.letterSpacing}em`;
  }
}

/** Greedy wrap, honouring explicit newlines and breaking words that cannot fit. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      out.push('');
      continue;
    }

    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        // A single word wider than the box still has to go somewhere: split it.
        if (!line && ctx.measureText(word).width > maxWidth && word.length > 1) {
          let chunk = '';
          for (const char of word) {
            if (chunk && ctx.measureText(chunk + char).width > maxWidth) {
              out.push(chunk);
              chunk = char;
            } else {
              chunk += char;
            }
          }
          line = chunk;
          continue;
        }
        line = candidate;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }

  return out.length ? out : [''];
}

/**
 * Lays a text layer out in canvas pixels.
 * `canvasW`/`canvasH` are the full canvas box (caption bar included).
 */
export function layoutText(layer: TextLayer, canvasW: number, canvasH: number): TextLayout {
  const ctx = measureCtx();
  const fontPx = Math.max(1, (layer.fontSize / 100) * canvasH);
  const maxWidth = Math.max(fontPx * 0.6, (layer.boxWidth / 100) * canvasW);

  applyFont(ctx, layer, fontPx);

  const raw = layer.uppercase ? layer.text.toUpperCase() : layer.text;
  const lines = wrapLines(ctx, raw, maxWidth);
  const width = lines.reduce((max, l) => Math.max(max, ctx.measureText(l).width), 0);
  const lineHeightPx = fontPx * layer.lineHeight;

  return {
    lines,
    width: Math.max(width, fontPx * 0.4),
    height: lineHeightPx * lines.length,
    fontPx,
    lineHeightPx,
  };
}

/** Sets up a context exactly as `layoutText` measured it. */
export function prepareContext(ctx: CanvasRenderingContext2D, layer: TextLayer, fontPx: number): void {
  applyFont(ctx, layer, fontPx);
  ctx.textBaseline = 'middle';
  ctx.textAlign = layer.align === 'left' ? 'left' : layer.align === 'right' ? 'right' : 'center';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
}
