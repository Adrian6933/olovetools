// ============================================================================
// Ruta de respaldo sin OffscreenCanvas (Safari < 16.4 y navegadores viejos).
// Se importa dinámicamente, así que en los navegadores modernos ni se descarga.
// ============================================================================

import JSZip from 'jszip';
import type { ExportSettings, Layer, LogoAsset } from '../types';
import { renderComposite } from './render';

let zip: JSZip | null = null;

export async function fallbackEncode(opts: {
  name: string;
  source: CanvasImageSource;
  width: number;
  height: number;
  layers: Layer[];
  assets: Map<string, LogoAsset>;
  settings: ExportSettings;
  archive: boolean;
  wantBlob: boolean;
}): Promise<{ size: number; blob?: Blob }> {
  let width = opts.width;
  let height = opts.height;
  const max = opts.settings.maxSize;
  if (max > 0 && Math.max(width, height) > max) {
    const ratio = max / Math.max(width, height);
    width = Math.max(1, Math.round(width * ratio));
    height = Math.max(1, Math.round(height * ratio));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  renderComposite(ctx, opts.source, width, height, opts.layers, opts.assets);

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, `image/${opts.settings.format}`, opts.settings.quality)
  );
  if (!blob) throw new Error('encode');

  if (opts.archive) {
    zip = zip || new JSZip();
    zip.file(opts.name, blob);
  }
  return { size: blob.size, blob: opts.wantBlob ? blob : undefined };
}

export async function fallbackZip(): Promise<Blob> {
  const out = await (zip || new JSZip()).generateAsync({ type: 'blob', compression: 'STORE' });
  zip = null;
  return out;
}
