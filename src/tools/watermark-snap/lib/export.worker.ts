// ============================================================================
// WatermarkSnap — worker de codificación y empaquetado
// ----------------------------------------------------------------------------
// La composición se queda en el hilo principal a propósito: las fuentes web
// (Outfit, Jakarta) están registradas en el documento, no en el worker, y
// dibujar el texto aquí las sustituiría por una fuente del sistema sin avisar.
//
// Lo que sí bloquea de verdad la interfaz es el ENCODE — `convertToBlob` de un
// PNG de 12 MP tarda cientos de milisegundos y es CPU pura — y el empaquetado
// del ZIP. Eso es lo que se hace aquí, sobre ImageBitmaps transferidos (coste
// de copia cero).
// ============================================================================

import JSZip from 'jszip';

type Format = 'png' | 'jpeg' | 'webp';

interface AddMessage {
  type: 'add';
  id: string;
  /** Nombre del fichero dentro del ZIP. */
  name: string;
  bitmap: ImageBitmap;
  format: Format;
  quality: number;
  /** Guardar en el ZIP en curso. */
  archive: boolean;
  /** Devolver también el Blob (descarga individual). */
  wantBlob: boolean;
}

type InMessage = { type: 'reset' } | AddMessage | { type: 'zip' };

let zip: JSZip | null = null;

function ensureZip(): JSZip {
  if (!zip) zip = new JSZip();
  return zip;
}

async function encode(bitmap: ImageBitmap, format: Format, quality: number): Promise<Blob> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('bitmaprenderer');
  if (ctx) {
    // Ruta rápida: adopta el bitmap sin volver a rasterizar nada.
    ctx.transferFromImageBitmap(bitmap);
  } else {
    const ctx2d = canvas.getContext('2d')!;
    ctx2d.drawImage(bitmap, 0, 0);
    bitmap.close();
  }
  return canvas.convertToBlob({ type: `image/${format}`, quality });
}

self.onmessage = async (event: MessageEvent<InMessage>) => {
  const msg = event.data;

  if (msg.type === 'reset') {
    zip = null;
    return;
  }

  if (msg.type === 'zip') {
    try {
      // STORE, no DEFLATE: PNG/JPEG/WebP ya vienen comprimidos, así que
      // desinflarlos otra vez sólo gasta segundos de CPU para ahorrar un 1 %.
      const blob = await ensureZip().generateAsync({ type: 'blob', compression: 'STORE' });
      (self as unknown as Worker).postMessage({ type: 'zipped', blob });
    } catch (err) {
      (self as unknown as Worker).postMessage({ type: 'failed', error: String(err) });
    }
    zip = null;
    return;
  }

  if (msg.type === 'add') {
    try {
      const blob = await encode(msg.bitmap, msg.format, msg.quality);
      if (msg.archive) ensureZip().file(msg.name, blob);
      (self as unknown as Worker).postMessage({
        type: 'encoded',
        id: msg.id,
        size: blob.size,
        blob: msg.wantBlob ? blob : undefined,
      });
    } catch (err) {
      (self as unknown as Worker).postMessage({ type: 'failed', id: msg.id, error: String(err) });
    }
  }
};

export {};
