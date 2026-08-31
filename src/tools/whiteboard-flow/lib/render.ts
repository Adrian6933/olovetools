import { COLOR_INK, type BoardDoc, type BoardNode } from '../types';
import { contentBounds } from './board';

// ============================================================================
// Board renderers
// ----------------------------------------------------------------------------
// The board is drawn from the document, not screen-scraped. html-to-image is
// deliberately avoided: it stalls in hidden tabs and rasterises whatever the
// DOM happens to look like. Owning the drawing means a real vector SVG, a PNG
// at any scale, and identical output whether or not the tab is visible.
// ============================================================================

export const FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';

const PAD = 14;
const FONT_SIZE = 14;
const LINE_H = 20;

/**
 * Break opportunities for wrapping. Splitting on spaces silently fails for
 * Japanese and Chinese, which have none — the ICU segmenter gives real word
 * boundaries in every language the site ships.
 */
function pieces(line: string): string[] {
  const Seg = (Intl as any).Segmenter;
  if (typeof Seg === 'function') {
    try {
      const seg = new Seg(undefined, { granularity: 'word' });
      const out: string[] = [];
      for (const s of seg.segment(line)) out.push(s.segment);
      if (out.length > 0) return out;
    } catch {
      // Fall through to the space split below.
    }
  }
  return line.split(/(\s+)/).filter(Boolean);
}

/** Wraps `text` to `maxWidth` using the measuring function given. */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  text.split('\n').forEach(paragraph => {
    if (paragraph === '') {
      lines.push('');
      return;
    }
    let current = '';
    pieces(paragraph).forEach(piece => {
      const next = current + piece;
      if (current !== '' && measure(next.trimEnd()) > maxWidth) {
        lines.push(current.trimEnd());
        current = piece.trimStart();
      } else {
        current = next;
      }
    });
    lines.push(current.trimEnd());
  });
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const sorted = (nodes: BoardNode[]) => [...nodes].sort((a, b) => a.z - b.z);

function anchor(a: BoardNode, b: BoardNode) {
  return {
    x1: a.x + a.w / 2,
    y1: a.y + a.h / 2,
    x2: b.x + b.w / 2,
    y2: b.y + b.h / 2,
  };
}

export interface RenderOptions {
  /** 1, 2 or 3. Applied on top of the natural board size. */
  scale: number;
  /** Transparent PNG instead of the board background. */
  transparent: boolean;
  background: string;
}

/**
 * Rasterises the board. Fully synchronous apart from the image decodes, so it
 * behaves the same in a background tab (no requestAnimationFrame anywhere).
 */
export async function renderPNG(doc: BoardDoc, opts: RenderOptions): Promise<Blob | null> {
  const notes = doc.nodes;
  if (notes.length === 0) return null;
  const b = contentBounds(notes);
  const scale = Math.max(1, Math.min(3, opts.scale));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(b.w * scale));
  canvas.height = Math.max(1, Math.round(b.h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);
  ctx.translate(-b.x, -b.y);

  if (!opts.transparent) {
    ctx.save();
    ctx.fillStyle = opts.background;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.restore();
  }

  // Connectors first: they belong behind every note.
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.55)';
  ctx.lineWidth = 2;
  const byId = new Map(notes.map(n => [n.id, n]));
  doc.edges.forEach(e => {
    const a = byId.get(e.from);
    const c = byId.get(e.to);
    if (!a || !c) return;
    const p = anchor(a, c);
    ctx.beginPath();
    ctx.moveTo(p.x1, p.y1);
    ctx.bezierCurveTo((p.x1 + p.x2) / 2, p.y1, (p.x1 + p.x2) / 2, p.y2, p.x2, p.y2);
    ctx.stroke();
  });

  const images = sorted(notes).filter(n => n.kind === 'image' && n.blob);
  const bitmaps = new Map<string, CanvasImageSource>();
  await Promise.all(
    images.map(async n => {
      try {
        if (typeof createImageBitmap === 'function') {
          bitmaps.set(n.id, await createImageBitmap(n.blob as Blob));
          return;
        }
        const url = URL.createObjectURL(n.blob as Blob);
        const img = new Image();
        img.src = url;
        await img.decode();
        bitmaps.set(n.id, img);
        URL.revokeObjectURL(url);
      } catch {
        // A decode failure just leaves that node out of the export.
      }
    })
  );

  sorted(notes).forEach(n => {
    if (n.kind === 'image') {
      const bmp = bitmaps.get(n.id);
      if (bmp) {
        ctx.save();
        roundRect(ctx, n.x, n.y, n.w, n.h, 10);
        ctx.clip();
        ctx.drawImage(bmp, n.x, n.y, n.w, n.h);
        ctx.restore();
      }
      return;
    }

    const c = COLOR_INK[n.color] || COLOR_INK.yellow;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = c.fill;
    roundRect(ctx, n.x, n.y, n.w, n.h, 10);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = c.edge;
    ctx.lineWidth = 1;
    roundRect(ctx, n.x + 0.5, n.y + 0.5, n.w - 1, n.h - 1, 10);
    ctx.stroke();

    if (!n.text.trim()) return;
    ctx.fillStyle = c.ink;
    ctx.font = `500 ${FONT_SIZE}px ${FONT_STACK}`;
    ctx.textBaseline = 'top';
    const maxW = n.w - PAD * 2;
    const lines = wrapText(n.text, maxW, s => ctx.measureText(s).width);
    const maxLines = Math.max(1, Math.floor((n.h - PAD * 2) / LINE_H));
    lines.slice(0, maxLines).forEach((line, i) => {
      const last = i === maxLines - 1 && lines.length > maxLines;
      ctx.fillText(last ? line.slice(0, Math.max(0, line.length - 1)) + '…' : line, n.x + PAD, n.y + PAD + i * LINE_H);
    });
  });

  bitmaps.forEach(bmp => {
    if (typeof ImageBitmap !== 'undefined' && bmp instanceof ImageBitmap) bmp.close();
  });

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Real vector SVG: `<text>` elements, not a foreignObject (which most editors
 * and every rasteriser render as an empty box) and not an embedded bitmap.
 * Image nodes are inlined as data URIs so the file stands alone.
 */
export async function renderSVG(doc: BoardDoc, opts: { transparent: boolean; background: string }): Promise<string> {
  const notes = doc.nodes;
  const b = contentBounds(notes);

  // Text metrics need a canvas even for SVG output — the wrap has to match the
  // PNG exactly or the two exports disagree.
  const probe = document.createElement('canvas').getContext('2d');
  const measure = (s: string) => {
    if (!probe) return s.length * (FONT_SIZE * 0.55);
    probe.font = `500 ${FONT_SIZE}px ${FONT_STACK}`;
    return probe.measureText(s).width;
  };

  const dataUris = new Map<string, string>();
  await Promise.all(
    notes
      .filter(n => n.kind === 'image' && n.blob)
      .map(
        n =>
          new Promise<void>(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') dataUris.set(n.id, reader.result);
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsDataURL(n.blob as Blob);
          })
      )
  );

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(b.w)}" height="${Math.round(b.h)}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">`
  );
  if (!opts.transparent) {
    parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="${opts.background}"/>`);
  }

  const byId = new Map(notes.map(n => [n.id, n]));
  doc.edges.forEach(e => {
    const a = byId.get(e.from);
    const c = byId.get(e.to);
    if (!a || !c) return;
    const p = anchor(a, c);
    const mx = (p.x1 + p.x2) / 2;
    parts.push(
      `<path d="M ${p.x1} ${p.y1} C ${mx} ${p.y1}, ${mx} ${p.y2}, ${p.x2} ${p.y2}" fill="none" stroke="rgba(103,232,249,0.55)" stroke-width="2"/>`
    );
  });

  sorted(notes).forEach(n => {
    if (n.kind === 'image') {
      const href = dataUris.get(n.id);
      if (href) {
        parts.push(
          `<image x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" href="${href}" preserveAspectRatio="xMidYMid slice"/>`
        );
      }
      return;
    }
    const c = COLOR_INK[n.color] || COLOR_INK.yellow;
    parts.push(
      `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${c.fill}" stroke="${c.edge}"/>`
    );
    if (!n.text.trim()) return;
    const lines = wrapText(n.text, n.w - PAD * 2, measure);
    const maxLines = Math.max(1, Math.floor((n.h - PAD * 2) / LINE_H));
    parts.push(
      `<text font-family="${esc(FONT_STACK)}" font-size="${FONT_SIZE}" font-weight="500" fill="${c.ink}">`
    );
    lines.slice(0, maxLines).forEach((line, i) => {
      parts.push(
        `<tspan x="${n.x + PAD}" y="${n.y + PAD + i * LINE_H + FONT_SIZE}">${esc(line)}</tspan>`
      );
    });
    parts.push('</text>');
  });

  parts.push('</svg>');
  return parts.join('\n');
}
