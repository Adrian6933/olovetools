// ============================================================================
// Catálogo de formatos y sondeo del navegador
// ----------------------------------------------------------------------------
// El navegador NO avisa cuando no sabe escribir un formato: `toBlob` devuelve
// un PNG con el tipo cambiado y todo el mundo tan contento. Medido en Chromium
// 2026: gif, heic, bmp, tiff y (en esta compilación) avif devuelven todos
// `image/png`. La única prueba fiable es codificar dos píxeles y mirar el
// `blob.type` que sale, así que eso es lo que hacemos una vez al arrancar.
// ============================================================================

import type { FormatInfo, OutputId, RasterMime } from './types';

export const RASTER_MIMES: RasterMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/** Catálogo completo. `available` se corrige con el sondeo. */
const CATALOG: Omit<FormatInfo, 'available'>[] = [
  { id: 'image/jpeg', label: 'JPG', ext: 'jpg', alpha: false, lossy: true },
  { id: 'image/png', label: 'PNG', ext: 'png', alpha: true, lossy: false },
  { id: 'image/webp', label: 'WEBP', ext: 'webp', alpha: true, lossy: true },
  { id: 'image/avif', label: 'AVIF', ext: 'avif', alpha: true, lossy: true },
  { id: 'ico', label: 'ICO', ext: 'ico', alpha: true, lossy: false },
  { id: 'pdf', label: 'PDF', ext: 'pdf', alpha: false, lossy: true },
  { id: 'tiff', label: 'TIFF', ext: 'tiff', alpha: true, lossy: false },
  { id: 'svg', label: 'SVG', ext: 'svg', alpha: true, lossy: false },
];

export function formatInfo(id: OutputId): Omit<FormatInfo, 'available'> {
  return CATALOG.find(f => f.id === id) || CATALOG[0];
}

export function extensionFor(id: OutputId): string {
  return formatInfo(id).ext;
}

export function isRaster(id: OutputId): id is RasterMime {
  return id.indexOf('/') !== -1;
}

/**
 * El ráster intermedio de cada contenedor. ICO y SVG incrustan un PNG porque
 * necesitan alfa; el PDF incrusta un JPEG porque un PDF con un PNG de 24 MP
 * dentro pesa una barbaridad y nadie quiere transparencia en un PDF.
 */
export function carrierMime(id: OutputId): RasterMime {
  if (id === 'pdf') return 'image/jpeg';
  if (isRaster(id)) return id;
  return 'image/png';
}

// ----------------------------------------------------------------------------
// Sondeo
// ----------------------------------------------------------------------------

let probeCache: Promise<FormatInfo[]> | null = null;

async function probeRaster(mime: RasterMime): Promise<boolean> {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(2, 2);
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      ctx.fillStyle = '#123456';
      ctx.fillRect(0, 0, 2, 2);
      const blob = await canvas.convertToBlob({ type: mime, quality: 0.8 });
      return !!blob && blob.type === mime;
    }
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#123456';
    ctx.fillRect(0, 0, 2, 2);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.8));
    return !!blob && blob.type === mime;
  } catch {
    return false;
  }
}

/**
 * Devuelve el catálogo con la disponibilidad real. Los contenedores los
 * escribimos nosotros (ICO y SVG a mano, TIFF con utif, PDF con jspdf), así
 * que solo dependen de que su ráster portador exista.
 */
export function probeFormats(): Promise<FormatInfo[]> {
  if (probeCache) return probeCache;
  probeCache = (async () => {
    const support: Record<string, boolean> = {};
    for (const mime of RASTER_MIMES) support[mime] = await probeRaster(mime);
    return CATALOG.map(entry => {
      const carrier = carrierMime(entry.id);
      const available = isRaster(entry.id) ? support[entry.id] : support[carrier];
      return {
        ...entry,
        available,
        reason: available ? undefined : ('no-encoder' as const),
      };
    });
  })();
  return probeCache;
}
