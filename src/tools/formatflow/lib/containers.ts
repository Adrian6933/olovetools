// ============================================================================
// Contenedores: ICO y SVG
// ----------------------------------------------------------------------------
// Los dos son código puro sobre un PNG ya codificado, así que corren igual en
// el worker que en el hilo principal. TIFF (utif) y PDF (jspdf) se quedan
// fuera a propósito: son dependencias CommonJS pesadas, y un `import()`
// dinámico dentro de un worker rompe el build — el worker se empaqueta como
// IIFE. Esos dos se rematan en el hilo principal a partir del ráster que
// devuelve el worker.
// ============================================================================

import { makeSurface, resampleTo, toBlob } from './resample';

/** Tamaños que Windows busca dentro de un .ico, del más usado al más grande. */
export const ICO_SIZES = [16, 32, 48, 64, 128, 256];

/**
 * Escribe un .ico de verdad, con una entrada por tamaño.
 *
 * El generador anterior metía una sola imagen del tamaño que tuviera la foto:
 * un favicon de 1200x800 dentro de un .ico, que Windows escala como puede y
 * los navegadores muestran borroso. Un .ico es un contenedor pensado para
 * llevar varias resoluciones a la vez, y ésa es justo la razón de usarlo.
 */
export async function encodeIco(source: ImageBitmap | OffscreenCanvas | HTMLCanvasElement, sizes: number[] = ICO_SIZES): Promise<Blob> {
  const srcW = (source as ImageBitmap).width;
  const srcH = (source as ImageBitmap).height;
  const side = Math.min(srcW, srcH);

  const entries: { size: number; png: Uint8Array }[] = [];
  for (const size of sizes) {
    // Recorte centrado al cuadrado antes de reducir: un icono estirado se ve
    // peor que uno recortado, y los iconos son cuadrados por definición.
    const square = makeSurface(side, side);
    square.ctx.drawImage(
      source as CanvasImageSource,
      Math.floor((srcW - side) / 2), Math.floor((srcH - side) / 2), side, side,
      0, 0, side, side
    );
    const scaled = resampleTo(square.canvas, size, size);
    const blob = await toBlob(scaled, 'image/png', 1);
    entries.push({ size, png: new Uint8Array(await blob.arrayBuffer()) });
  }

  const HEADER = 6;
  const ENTRY = 16;
  const dirSize = HEADER + ENTRY * entries.length;
  const total = dirSize + entries.reduce((sum, e) => sum + e.png.length, 0);

  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint16(0, 0, true); // reservado
  view.setUint16(2, 1, true); // tipo 1 = icono
  view.setUint16(4, entries.length, true);

  let offset = dirSize;
  entries.forEach((entry, index) => {
    const at = HEADER + index * ENTRY;
    // 256 se codifica como 0: el campo es de un byte y 256 no cabe.
    view.setUint8(at, entry.size >= 256 ? 0 : entry.size);
    view.setUint8(at + 1, entry.size >= 256 ? 0 : entry.size);
    view.setUint8(at + 2, 0); // colores de la paleta (0 = sin paleta)
    view.setUint8(at + 3, 0); // reservado
    view.setUint16(at + 4, 1, true); // planos
    view.setUint16(at + 6, 32, true); // bits por píxel
    view.setUint32(at + 8, entry.png.length, true);
    view.setUint32(at + 12, offset, true);
    bytes.set(entry.png, offset);
    offset += entry.png.length;
  });

  return new Blob([buffer], { type: 'image/vnd.microsoft.icon' });
}

/**
 * Envuelve el ráster en un SVG. Que quede claro lo que es: NO vectoriza nada,
 * y por eso el texto de la herramienta ya no dice que sí. Sirve para meter una
 * imagen donde sólo se aceptan .svg, y para eso funciona perfectamente.
 */
export async function encodeSvgWrapper(png: Blob, width: number, height: number): Promise<Blob> {
  const dataUrl = await blobToDataUrl(png);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
    `width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<image width="${width}" height="${height}" xlink:href="${dataUrl}"/>` +
    `</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  // FileReader existe en workers; `readAsDataURL` es la vía sin copias
  // intermedias en JS (btoa sobre un array de 20 MB es notablemente más lento).
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
