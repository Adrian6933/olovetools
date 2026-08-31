// ============================================================================
// Worker de codificación
// ----------------------------------------------------------------------------
// Convertir la galería entera se hacía en el hilo principal con un <canvas>
// clásico, así que la pestaña se quedaba congelada durante todo el lote y no
// había forma de saber por dónde iba ni de pararlo.
//
// Aquí cada imagen llega como ImageBitmap TRANSFERIDO (sin copia), se dibuja en
// un OffscreenCanvas y se devuelve el blob. Sin `import()` dentro del worker a
// propósito: rompe el build IIFE. Por eso la decodificación de HEIC/TIFF, que
// sí necesita librerías, se queda en el hilo principal y aquí solo entran
// bitmaps ya decodificados.
// ============================================================================

export interface EncodeRequest {
  id: string;
  bitmap: ImageBitmap;
  mime: string;
  quality: number;
  /** Lado mayor máximo. 0 = tamaño original. */
  maxDimension: number;
  /** Color de fondo para formatos sin alfa. */
  flatten: string | null;
}

export interface EncodeResponse {
  id: string;
  ok: boolean;
  blob?: Blob;
  width?: number;
  height?: number;
  error?: string;
}

/** Escala manteniendo la proporción, sin ampliar nunca. */
function targetSize(width: number, height: number, maxDimension: number) {
  if (!maxDimension || Math.max(width, height) <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

self.onmessage = async (event: MessageEvent<EncodeRequest>) => {
  const { id, bitmap, mime, quality, maxDimension, flatten } = event.data;
  try {
    const size = targetSize(bitmap.width, bitmap.height, maxDimension);
    const canvas = new OffscreenCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-2d-context');

    if (flatten) {
      // JPEG no tiene canal alfa: sin esto, todo lo transparente sale negro.
      ctx.fillStyle = flatten;
      ctx.fillRect(0, 0, size.width, size.height);
    }
    // Interpolación buena al reducir; el valor por defecto deja bordes sucios.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();

    const blob = await canvas.convertToBlob({ type: mime, quality });
    const response: EncodeResponse = { id, ok: true, blob, width: size.width, height: size.height };
    (self as unknown as Worker).postMessage(response);
  } catch (error) {
    try {
      bitmap.close();
    } catch {
      /* ya cerrado */
    }
    const response: EncodeResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'encode-failed',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
