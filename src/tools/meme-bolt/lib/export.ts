// ============================================================================
// Exporter
// ----------------------------------------------------------------------------
// Re-renders the document from scratch at the requested scale instead of
// blowing up the preview bitmap: the SVG template and every sticker are
// rasterised at the final pixel size, so 4x is genuinely 4x.
// ============================================================================

import type { BackdropSource, ExportSettings, MemeDoc } from '../types';
import { canvasBox, layerSize, rasterizeSticker, renderDoc, resolveBackdrop } from './render';
import { STICKERS } from './stickers';

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
  name: string;
}

const EXTENSION: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function makeCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement | OffscreenCanvas, type: string, quality: number): Promise<Blob> {
  if ('convertToBlob' in canvas) {
    return (canvas as OffscreenCanvas).convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    (canvas as HTMLCanvasElement).toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('encode'))),
      type,
      quality
    );
  });
}

/** Highest scale that keeps the export under the browser's canvas area limits. */
export function maxScale(doc: MemeDoc): number {
  const box = canvasBox(doc);
  const byEdge = 8192 / Math.max(box.width, box.height);
  const byArea = Math.sqrt((60 * 1024 * 1024) / (box.width * box.height));
  return Math.max(1, Math.min(4, byEdge, byArea));
}

export async function exportMeme(
  doc: MemeDoc,
  source: BackdropSource,
  settings: ExportSettings,
  baseName = 'meme'
): Promise<ExportResult> {
  const scale = Math.min(settings.scale, maxScale(doc));
  const box = canvasBox(doc);
  const width = Math.round(box.width * scale);
  const height = Math.round(box.height * scale);

  const backdrop = await resolveBackdrop(source, width);

  // Exact-size sticker rasters, one per layer (two layers can share a sticker
  // at different sizes, so the key is the layer, not the sticker).
  const rasters = new Map<string, CanvasImageSource>();
  await Promise.all(
    doc.layers.map(async layer => {
      if (layer.kind !== 'sticker') return;
      const def = STICKERS[layer.sticker];
      if (!def) return;
      const size = layerSize(layer, box);
      try {
        rasters.set(
          layer.id,
          await rasterizeSticker(def, layer.color, size.width * scale, size.height * scale)
        );
      } catch {
        /* a sticker that will not rasterise is skipped, not fatal */
      }
    })
  );

  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error('context');
  ctx.imageSmoothingQuality = 'high';

  renderDoc(ctx, doc, backdrop, scale, { stickerRasters: rasters });

  const blob = await toBlob(canvas, settings.format, settings.quality);
  const ext = EXTENSION[settings.format] || 'png';
  const clean = baseName.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40) || 'meme';

  return { blob, width, height, name: `${clean}-${width}x${height}.${ext}` };
}
