// ============================================================================
// Decodificación de la entrada
// ----------------------------------------------------------------------------
// Antes bastaba con `file.type.startsWith('image/')` para entrar en la galería,
// y nada comprobaba que el navegador supiera decodificar el archivo. Un .HEIC
// de iPhone pasa ese filtro (`image/heic` empieza por `image/`) y luego revienta
// —medido: `createImageBitmap` lanza InvalidStateError—, así que la miniatura
// quedaba rota y la conversión fallaba sin decir por qué.
//
// `heic2any` y `utif` ya eran dependencias del proyecto para otras
// herramientas, así que ese soporte estaba pagado y sin usar. Ambos se cargan
// con `import()` dinámico y se ejecutan AQUÍ, en el hilo principal, nunca dentro
// del worker: un `import()` dentro de un worker rompe el build IIFE, y
// estáticos meterían un megabyte de decodificador en el chunk inicial para el
// 95% de visitas que pegan un PNG.
// ============================================================================

export interface DecodedSource {
  bitmap: ImageBitmap;
  /** Lo que hemos conseguido leer, tras cualquier conversión. */
  mime: string;
  /** True cuando el archivo necesitó un conversor y no el decodificador nativo. */
  converted: boolean;
}

const HEIC_EXT = /\.(heic|heif)$/i;
const TIFF_EXT = /\.(tiff?)$/i;

/** Olfatea el contenedor, porque iOS entrega el `file.type` vacío a menudo. */
async function looksLikeHeic(file: File): Promise<boolean> {
  if (/^image\/hei[cf]/i.test(file.type)) return true;
  if (HEIC_EXT.test(file.name)) return true;
  // Caja de marca ISO-BMFF: los bytes 4-8 son "ftyp" y 8-12 la marca.
  try {
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const tag = String.fromCharCode(...head.slice(4, 8));
    const brand = String.fromCharCode(...head.slice(8, 12));
    return tag === 'ftyp' && /^(heic|heix|hevc|mif1|msf1|heim|hevm)/i.test(brand);
  } catch {
    return false;
  }
}

function looksLikeTiff(file: File): boolean {
  return /^image\/tiff/i.test(file.type) || TIFF_EXT.test(file.name);
}

async function decodeHeic(file: File): Promise<DecodedSource> {
  const heic2any = (await import('heic2any')).default as (options: {
    blob: Blob; toType?: string; quality?: number;
  }) => Promise<Blob | Blob[]>;
  // 0.94 en el intermedio: esto no es la salida, es la fuente sobre la que
  // trabajará la codificación real, así que tirar detalle aquí se pagaría dos veces.
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return { bitmap: await createImageBitmap(blob), mime: 'image/jpeg', converted: true };
}

async function decodeTiff(file: File): Promise<DecodedSource> {
  const UTIF = (await import('utif')).default as any;
  const buffer = await file.arrayBuffer();
  const pages = UTIF.decode(buffer);
  if (!pages || pages.length === 0) throw new Error('tiff-empty');
  UTIF.decodeImage(buffer, pages[0]);
  const rgba = UTIF.toRGBA8(pages[0]);
  const image = new ImageData(new Uint8ClampedArray(rgba), pages[0].width, pages[0].height);
  return { bitmap: await createImageBitmap(image), mime: 'image/png', converted: true };
}

/**
 * Un SVG no tiene tamaño intrínseco en píxeles, así que `createImageBitmap` lo
 * rechaza en casi todos los motores. Rasterizarlo por un <img> es la única vía,
 * y va topado a propósito: un SVG de veinte líneas puede declararse de 30000px.
 */
const SVG_FALLBACK = 1024;
const SVG_MAX = 4096;

async function decodeSvg(file: File): Promise<DecodedSource> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('svg-decode-failed'));
      element.src = url;
    });
    const width = Math.min(SVG_MAX, img.naturalWidth || SVG_FALLBACK);
    const height = Math.min(SVG_MAX, img.naturalHeight || SVG_FALLBACK);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas-2d-unavailable');
    ctx.drawImage(img, 0, 0, width, height);
    return { bitmap: await createImageBitmap(canvas), mime: 'image/png', converted: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * `imageOrientation: 'from-image'` es la razón de usar createImageBitmap en vez
 * de un <img>: una foto hecha en vertical lleva su rotación en EXIF, y dibujar
 * los píxeles crudos en un canvas la deja tumbada. La versión anterior llamaba
 * a `createImageBitmap(blob)` pelado, así que toda foto de móvil se convertía
 * girada.
 */
export async function decodeFile(file: File): Promise<DecodedSource> {
  if (await looksLikeHeic(file)) return decodeHeic(file);
  if (looksLikeTiff(file)) return decodeTiff(file);
  if (/^image\/svg/i.test(file.type) || /\.svg$/i.test(file.name)) return decodeSvg(file);

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { bitmap, mime: file.type || 'image/png', converted: false };
  } catch {
    // Safari antiguo rechaza el objeto de opciones en vez de ignorarlo.
    const bitmap = await createImageBitmap(file);
    return { bitmap, mime: file.type || 'image/png', converted: false };
  }
}

/** Todo lo que el selector debe ofrecer, incluido lo que necesita conversor. */
export const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp,image/tiff,image/heic,image/heif,image/svg+xml,.heic,.heif,.tif,.tiff,.avif';

/** True para todo aquello para lo que tenemos una ruta de decodificación. */
export function isSupportedImage(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  // iOS entrega HEIC con el type vacío lo bastante a menudo como para que la
  // extensión cuente como prueba por sí sola.
  return HEIC_EXT.test(file.name) || TIFF_EXT.test(file.name) || /\.avif$/i.test(file.name);
}
