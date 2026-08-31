// ============================================================================
// El pipeline
// ----------------------------------------------------------------------------
// Corre igual en un worker que en el hilo principal: sólo toca canvas, nunca
// `document`. Eso es lo que permite que el mismo código sea el cuerpo del
// worker y su propio plan B cuando `new Worker` falla (CSP sin `worker-src`).
//
// Ninguna etapa vuelve a leer el archivo: el `ImageBitmap` decodificado se
// guarda una vez y todas las conversiones parten de él. El motor anterior
// releía el File y lo redecodificaba en cada movimiento del deslizador.
// ============================================================================

import { compareSsim } from '../../../lib/imageMetrics';
import { carrierMime, isRaster } from './formats';
import { ICO_SIZES, encodeIco, encodeSvgWrapper } from './containers';
import { makeSurface, resampleTo, toBlob, unsharp } from './resample';
import type { Settings } from './types';

/** Límite de superficie del canvas. Pasado eso, el navegador falla la reserva. */
export const MAX_SIDE = 16384;
export const MAX_PIXELS = 40e6;

/** Codificaciones que se permite gastar la búsqueda por peso objetivo. */
const MAX_ATTEMPTS = 8;

// ----------------------------------------------------------------------------
// Geometría
// ----------------------------------------------------------------------------

/** Tamaño de la imagen tras el giro, antes de redimensionar. */
export function orientedSize(width: number, height: number, rotate: number) {
  return rotate === 90 || rotate === 270
    ? { width: height, height: width }
    : { width, height };
}

export function targetSize(
  sourceWidth: number,
  sourceHeight: number,
  settings: Settings
): { width: number; height: number } {
  const base = orientedSize(sourceWidth, sourceHeight, settings.rotate);
  let w = base.width;
  let h = base.height;

  if (settings.resizeMode === 'scale') {
    const factor = Math.max(1, Math.min(400, settings.scale)) / 100;
    w = Math.round(base.width * factor);
    h = Math.round(base.height * factor);
  } else if (settings.resizeMode === 'longEdge') {
    const longest = Math.max(base.width, base.height);
    if (settings.longEdge > 0 && longest !== settings.longEdge) {
      const factor = settings.longEdge / longest;
      w = Math.round(base.width * factor);
      h = Math.round(base.height * factor);
    }
  } else if (settings.resizeMode === 'dimensions') {
    const boxW = Math.max(1, settings.width);
    const boxH = Math.max(1, settings.height);
    if (!settings.lockAspect || settings.fit === 'stretch') {
      w = boxW;
      h = boxH;
    } else {
      const ratio = base.width / base.height;
      const boxRatio = boxW / boxH;
      // `contain` deja la imagen entera dentro de la caja; `cover` la llena y
      // recorta lo que sobra. Los dos respetan la proporción, que es de lo que
      // se trata: la caja es un límite, no un estirón.
      const fitWide = settings.fit === 'contain' ? boxRatio > ratio : boxRatio < ratio;
      if (fitWide) {
        h = boxH;
        w = Math.round(boxH * ratio);
      } else {
        w = boxW;
        h = Math.round(boxW / ratio);
      }
    }
  }

  w = Math.max(1, Math.min(MAX_SIDE, w));
  h = Math.max(1, Math.min(MAX_SIDE, h));
  if (w * h > MAX_PIXELS) {
    // Suelo y no redondeo: redondear los dos lados hacia arriba puede volver a
    // pasarse del tope, y el tope está justo para que la reserva no falle.
    const factor = Math.sqrt(MAX_PIXELS / (w * h));
    w = Math.max(1, Math.floor(w * factor));
    h = Math.max(1, Math.floor(h * factor));
  }
  return { width: w, height: h };
}

// ----------------------------------------------------------------------------
// Dibujo
// ----------------------------------------------------------------------------

/** Aplica giro y volteo. Devuelve un lienzo con la imagen ya orientada. */
function orient(bitmap: ImageBitmap, settings: Settings) {
  if (settings.rotate === 0 && !settings.flipH && !settings.flipV) return bitmap;
  const size = orientedSize(bitmap.width, bitmap.height, settings.rotate);
  const surface = makeSurface(size.width, size.height);
  const ctx = surface.ctx as CanvasRenderingContext2D;
  ctx.translate(size.width / 2, size.height / 2);
  ctx.rotate((settings.rotate * Math.PI) / 180);
  ctx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
  ctx.drawImage(bitmap as unknown as CanvasImageSource, -bitmap.width / 2, -bitmap.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return surface.canvas;
}

/**
 * Compone el fotograma final: orienta, remuestrea, recorta si el encaje es
 * `cover`, pinta el fondo cuando el destino no lleva alfa y afila.
 */
function compose(bitmap: ImageBitmap, settings: Settings, mime: string, hasAlpha: boolean) {
  const oriented = orient(bitmap, settings);
  const { width, height } = targetSize(bitmap.width, bitmap.height, settings);
  const scaled = resampleTo(oriented, width, height);

  // `cover` con caja fija: la imagen ya llena la caja o la sobrepasa, y lo que
  // sale del marco se recorta centrado.
  let frame = scaled;
  let outW = width;
  let outH = height;
  if (settings.resizeMode === 'dimensions' && settings.fit === 'cover' && settings.lockAspect) {
    outW = Math.max(1, Math.min(MAX_SIDE, settings.width));
    outH = Math.max(1, Math.min(MAX_SIDE, settings.height));
    const cropped = makeSurface(outW, outH);
    cropped.ctx.drawImage(
      scaled.canvas as CanvasImageSource,
      Math.round((width - outW) / 2), Math.round((height - outH) / 2), outW, outH,
      0, 0, outW, outH
    );
    frame = cropped;
  }

  // Sin alfa el fondo tiene que ir DEBAJO, así que se pinta en otro lienzo y
  // la imagen encima. Pintarlo antes del drawImage sobre el mismo lienzo es lo
  // que hacía el motor viejo, y funcionaba sólo porque no había remuestreo.
  if (!hasAlpha || mime === 'image/jpeg') {
    const filled = makeSurface(outW, outH);
    filled.ctx.fillStyle = settings.background || '#ffffff';
    filled.ctx.fillRect(0, 0, outW, outH);
    filled.ctx.drawImage(frame.canvas as CanvasImageSource, 0, 0);
    frame = filled;
  }

  if (settings.sharpen > 0) {
    const ctx = frame.ctx as CanvasRenderingContext2D;
    const image = ctx.getImageData(0, 0, outW, outH);
    unsharp(image, settings.sharpen);
    ctx.putImageData(image, 0, 0);
  }

  return { surface: frame, width: outW, height: outH };
}

// ----------------------------------------------------------------------------
// Codificación
// ----------------------------------------------------------------------------

/**
 * Píxeles sueltos en vez de un `ImageData`: al mandarlos por `postMessage` hay
 * que transferir el buffer para no copiar 4 bytes por píxel, y un ImageData
 * clonado con su buffer en la lista de transferencia es un DataCloneError.
 * Un array con sus medidas al lado viaja sin copia y se reconstruye igual.
 */
export interface RawPixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export interface EncodeOutcome {
  /** Resultado final, salvo en pdf/tiff donde es el ráster portador. */
  blob: Blob;
  /** Píxeles crudos: sólo se rellena para TIFF, que los necesita. */
  rgba: RawPixels | null;
  width: number;
  height: number;
  mime: string;
  quality: number;
  ssim: number | null;
  ms: number;
  attempts: number;
  missedTarget: boolean;
  /** Código de matiz para la interfaz; se traduce allí, no aquí. */
  detail: 'ico-multisize' | null;
}

export async function runEncode(bitmap: ImageBitmap, settings: Settings): Promise<EncodeOutcome> {
  const started = Date.now();
  const target = settings.format;
  const mime = carrierMime(target);
  const lossy = mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/avif';
  const hasAlpha = target === 'image/png' || target === 'image/webp' || target === 'image/avif'
    || target === 'ico' || target === 'svg' || target === 'tiff';

  const { surface, width, height } = compose(bitmap, settings, mime, hasAlpha);

  // --- ICO: su propio recorrido, no es un `toBlob` ---------------------------
  if (target === 'ico') {
    const blob = await encodeIco(surface.canvas);
    // Las medidas que se enseñan son las del icono más grande que hay DENTRO
    // del archivo, no las del fotograma compuesto: un .ico de una foto de
    // 1600x1200 no contiene ninguna imagen de 1600x1200.
    const largest = ICO_SIZES[ICO_SIZES.length - 1];
    return {
      blob, rgba: null, width: largest, height: largest, mime: 'image/vnd.microsoft.icon',
      quality: 100, ssim: null, ms: Date.now() - started, attempts: 1, missedTarget: false,
      detail: 'ico-multisize',
    };
  }

  let quality = Math.max(1, Math.min(100, settings.quality)) / 100;
  let attempts = 1;
  let blob: Blob;
  let missedTarget = false;

  if (settings.targetBytes > 0 && lossy) {
    // Bisección sobre la calidad. La relación calidad→bytes es monótona pero
    // muy poco lineal, así que buscar gana a cualquier fórmula, y ocho
    // codificaciones de un fotograma ya reducido no llegan al segundo.
    let low = 0.05;
    let high = 0.97;
    let best: Blob | null = null;
    let bestQuality = low;
    for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
      const mid = (low + high) / 2;
      const candidate = await toBlob(surface, mime, mid);
      if (candidate.size <= settings.targetBytes) {
        best = candidate;
        bestQuality = mid;
        low = mid;
      } else {
        high = mid;
      }
      if (high - low < 0.02) break;
    }
    if (best) {
      blob = best;
      quality = bestQuality;
    } else {
      // No entró en el presupuesto: devolvemos lo más pequeño que se pudo y la
      // interfaz lo dice, en vez de fingir que se cumplió.
      blob = await toBlob(surface, mime, low);
      quality = low;
      missedTarget = true;
    }
  } else {
    blob = await toBlob(surface, mime, lossy ? quality : 1);
  }

  // --- TIFF y SVG se rematan a partir del ráster -----------------------------
  let rgba: RawPixels | null = null;
  if (target === 'tiff') {
    const image = (surface.ctx as CanvasRenderingContext2D).getImageData(0, 0, width, height);
    rgba = { data: image.data, width: image.width, height: image.height };
  } else if (target === 'svg') {
    blob = await encodeSvgWrapper(blob, width, height);
  }

  // --- Cuánto costó ----------------------------------------------------------
  let ssim: number | null = null;
  if (settings.measureQuality && lossy && target !== 'svg') {
    try {
      const before = (surface.ctx as CanvasRenderingContext2D).getImageData(0, 0, width, height);
      const decoded = await createImageBitmap(blob);
      const check = makeSurface(decoded.width, decoded.height);
      check.ctx.drawImage(decoded as unknown as CanvasImageSource, 0, 0);
      const after = (check.ctx as CanvasRenderingContext2D).getImageData(0, 0, decoded.width, decoded.height);
      ssim = compareSsim(before, after);
      decoded.close();
    } catch {
      // Un navegador que no descodifica lo que acaba de codificar no es razón
      // para tirar una conversión perfectamente válida.
      ssim = null;
    }
  }

  return {
    blob, rgba, width, height,
    mime: blob.type || mime,
    quality: Math.round(quality * 100),
    ssim, ms: Date.now() - started, attempts, missedTarget, detail: null,
  };
}

/** Miniatura para la cola. Pequeña a propósito: 50 en pantalla a la vez. */
export async function makeThumbnail(bitmap: ImageBitmap, side = 256): Promise<Blob> {
  const ratio = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const surface = resampleTo(bitmap, w, h);
  return toBlob(surface, 'image/webp', 0.8).catch(() => toBlob(surface, 'image/png', 1));
}

export { isRaster };
