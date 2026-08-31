// ============================================================================
// WatermarkSnap — entrada de ficheros y salida de la exportación
// ============================================================================

import type { ExportSettings, Layer, LogoAsset, OutputFormat } from '../types';
import { renderToBitmap } from './render';

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

/** Extensiones que aceptamos además de lo que reporte `file.type`. */
const IMAGE_EXT = /\.(png|jpe?g|webp|avif|gif|bmp|svg|hei[cf])$/i;

export const ACCEPT_ATTRIBUTE = 'image/*,.heic,.heif,.avif';

/** Lado largo máximo del bitmap que se mantiene decodificado para el editor. */
export const PREVIEW_MAX_EDGE = 2560;

export type IntakeError = 'format' | 'decode' | 'empty';

export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export function looksLikeImage(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_EXT.test(file.name);
}

function isHeic(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/**
 * Las fotos del iPhone llegan en HEIC y ningún navegador las sabe dibujar en un
 * canvas. `heic2any` ya es dependencia del proyecto y se carga bajo demanda.
 */
export async function normaliseFile(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  const heic2any = (await import('heic2any')).default as (opts: {
    blob: Blob;
    toType: string;
    quality?: number;
  }) => Promise<Blob | Blob[]>;
  const converted = await heic2any({ blob: file, toType: 'image/png' });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.hei[cf]$/i, '.png'), { type: 'image/png' });
}

/**
 * Un SVG sin `width`/`height` intrínsecos se decodifica con tamaño 0 y la
 * versión anterior lo dejaba pasar dando una imagen rota. Le damos una caja de
 * referencia antes de rasterizarlo.
 */
async function decodeSvg(file: File, box: number): Promise<DecodedImage> {
  const text = await file.text();
  const hasSize = /<svg[^>]*\bwidth\s*=/.test(text) && /<svg[^>]*\bheight\s*=/.test(text);
  const viewBox = text.match(/viewBox\s*=\s*"([^"]+)"/i);

  let markup = text;
  if (!hasSize) {
    let w = box;
    let h = box;
    if (viewBox) {
      const parts = viewBox[1].trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        const ratio = parts[2] / parts[3];
        if (ratio >= 1) { w = box; h = Math.round(box / ratio); }
        else { h = box; w = Math.round(box * ratio); }
      }
    }
    markup = text.replace(/<svg\b/i, `<svg width="${w}" height="${h}"`);
  }

  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'sync';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('svg'));
      img.src = url;
    });
    const bitmap = await createImageBitmap(img);
    return { bitmap, width: bitmap.width, height: bitmap.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Decodifica a ImageBitmap. `imageOrientation: 'from-image'` es la corrección de
 * la orientación EXIF: sin ella las fotos verticales de móvil salían tumbadas,
 * porque `new Image()` en canvas ignora el flag de rotación.
 *
 * `maxEdge > 0` limita el lado largo (el bitmap del editor); la exportación
 * decodifica sin límite.
 */
export async function decodeImage(file: File, maxEdge = 0): Promise<DecodedImage> {
  if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) {
    return decodeSvg(file, maxEdge || 2048);
  }

  const probe = await createImageBitmap(file, { imageOrientation: 'from-image' });
  if (!probe.width || !probe.height) {
    probe.close();
    throw new Error('decode');
  }

  if (maxEdge <= 0 || Math.max(probe.width, probe.height) <= maxEdge) {
    return { bitmap: probe, width: probe.width, height: probe.height };
  }

  const ratio = maxEdge / Math.max(probe.width, probe.height);
  const scaled = await createImageBitmap(probe, {
    resizeWidth: Math.max(1, Math.round(probe.width * ratio)),
    resizeHeight: Math.max(1, Math.round(probe.height * ratio)),
    resizeQuality: 'high',
  });
  const width = probe.width;
  const height = probe.height;
  probe.close();
  return { bitmap: scaled, width, height };
}

// ---------------------------------------------------------------------------
// Salida
// ---------------------------------------------------------------------------

export const FORMAT_EXT: Record<OutputFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };

export function outputName(name: string, settings: ExportSettings): string {
  const base = name.replace(/\.[a-z0-9]+$/i, '') || name;
  return `${base}${settings.suffix}.${FORMAT_EXT[settings.format]}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1))} ${units[i]}`;
}

interface WorkerReply {
  type: 'encoded' | 'zipped' | 'failed';
  id?: string;
  size?: number;
  blob?: Blob;
  error?: string;
}

/**
 * Envoltorio del worker. Si el navegador no trae `OffscreenCanvas` (Safari
 * antiguo), cae a codificar en el hilo principal: más lento y con tirones,
 * pero funcional.
 */
export class Encoder {
  private worker: Worker | null = null;
  private pending = new Map<string, (reply: WorkerReply) => void>();
  private zipWaiter: ((reply: WorkerReply) => void) | null = null;

  readonly offscreen = typeof OffscreenCanvas !== 'undefined';

  private ensure(): Worker | null {
    if (!this.offscreen) return null;
    if (this.worker) return this.worker;
    try {
      this.worker = new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<WorkerReply>) => {
        const reply = event.data;
        if (reply.type === 'zipped') {
          this.zipWaiter?.(reply);
          this.zipWaiter = null;
          return;
        }
        if (reply.id) {
          this.pending.get(reply.id)?.(reply);
          this.pending.delete(reply.id);
        } else if (reply.type === 'failed') {
          this.zipWaiter?.(reply);
          this.zipWaiter = null;
        }
      };
      return this.worker;
    } catch {
      this.worker = null;
      return null;
    }
  }

  reset() {
    this.ensure()?.postMessage({ type: 'reset' });
  }

  /** Compone y codifica una imagen. Devuelve el tamaño y, si se pide, el Blob. */
  async add(opts: {
    id: string;
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
    const rendered = renderToBitmap(
      opts.source,
      opts.width,
      opts.height,
      opts.layers,
      opts.assets,
      opts.settings.maxSize
    );

    const worker = rendered ? this.ensure() : null;

    if (rendered && worker) {
      const reply = await new Promise<WorkerReply>(resolve => {
        this.pending.set(opts.id, resolve);
        worker.postMessage(
          {
            type: 'add',
            id: opts.id,
            name: opts.name,
            bitmap: rendered.bitmap,
            format: opts.settings.format,
            quality: opts.settings.quality,
            archive: opts.archive,
            wantBlob: opts.wantBlob,
          },
          [rendered.bitmap]
        );
      });
      if (reply.type === 'failed') throw new Error(reply.error || 'encode');
      return { size: reply.size || 0, blob: reply.blob };
    }

    // Sin OffscreenCanvas: todo en el hilo principal.
    const { fallbackEncode } = await import('./fallback');
    return fallbackEncode(opts);
  }

  /** Cierra el ZIP acumulado en el worker. */
  async zip(): Promise<Blob> {
    const worker = this.ensure();
    if (worker) {
      const reply = await new Promise<WorkerReply>(resolve => {
        this.zipWaiter = resolve;
        worker.postMessage({ type: 'zip' });
      });
      if (reply.type !== 'zipped' || !reply.blob) throw new Error(reply.error || 'zip');
      return reply.blob;
    }
    const { fallbackZip } = await import('./fallback');
    return fallbackZip();
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
    this.zipWaiter = null;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
