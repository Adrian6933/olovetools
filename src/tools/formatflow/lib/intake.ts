// ============================================================================
// Entrada: normalizar lo que el navegador no descodifica
// ----------------------------------------------------------------------------
// `createImageBitmap` sabe leer JPG, PNG, WEBP, GIF, BMP, SVG y AVIF. No sabe
// leer HEIC (el formato por defecto del iPhone) ni TIFF. La herramienta decía
// aceptar los dos, más EPS y RAW; en realidad sólo convertía el HEIC.
//
// Aquí HEIC y TIFF se traducen a algo decodificable antes de entrar al motor.
// EPS y RAW no: son formatos que exigen un intérprete PostScript y una tabla
// por modelo de cámara respectivamente, no hay forma honesta de hacerlo en el
// navegador, y ahora se rechazan con un mensaje en vez de devolver un PNG.
// ============================================================================

export interface NormalizedSource {
  blob: Blob;
  /** MIME real del origen, ya resuelto. */
  mime: string;
  /** true si hizo falta traducirlo antes de decodificar. */
  transcoded: boolean;
}

const HEIC_EXT = /\.(heic|heif)$/i;
const TIFF_EXT = /\.(tif|tiff)$/i;
const REJECTED_EXT = /\.(eps|ai|ps|raw|cr2|cr3|nef|arw|dng|orf|rw2|raf|srw)$/i;

export function isRejected(file: File): boolean {
  return REJECTED_EXT.test(file.name);
}

export function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  return type === 'image/heic' || type === 'image/heif' || HEIC_EXT.test(file.name);
}

export function isTiff(file: File): boolean {
  const type = file.type.toLowerCase();
  return type === 'image/tiff' || type === 'image/tif' || TIFF_EXT.test(file.name);
}

/** Formatos que aceptamos como entrada, para el `accept` del input y los textos. */
export const ACCEPTED_INPUT = 'JPG, PNG, WEBP, AVIF, GIF, BMP, SVG, TIFF, HEIC';
export const ACCEPT_ATTR = 'image/*,.heic,.heif,.tif,.tiff';

export async function normalizeSource(file: File): Promise<NormalizedSource> {
  if (isRejected(file)) {
    throw new Error('unsupported-input');
  }

  if (isHeic(file)) {
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({ blob: file, toType: 'image/png' });
    const blob = Array.isArray(result) ? result[0] : result;
    return { blob, mime: 'image/png', transcoded: true };
  }

  if (isTiff(file)) {
    // Sólo si el navegador no lo descodifica ya por su cuenta: Safari sí lee
    // TIFF, y su decodificador es mejor que el nuestro.
    if (await canDecode(file)) return { blob: file, mime: 'image/tiff', transcoded: false };
    const blob = await tiffToPng(file);
    return { blob, mime: 'image/png', transcoded: true };
  }

  return { blob: file, mime: file.type || 'image/*', transcoded: false };
}

async function canDecode(blob: Blob): Promise<boolean> {
  try {
    const bitmap = await createImageBitmap(blob);
    bitmap.close();
    return true;
  } catch {
    return false;
  }
}

/** utif es CommonJS y pesa: sólo se carga si aparece un TIFF de verdad. */
async function tiffToPng(file: File): Promise<Blob> {
  const module = await import('utif');
  const UTIF: any = (module as any).default || module;
  const buffer = await file.arrayBuffer();
  const pages = UTIF.decode(buffer);
  if (!pages || pages.length === 0) throw new Error('tiff-decode-failed');
  UTIF.decodeImage(buffer, pages[0]);
  const rgba = UTIF.toRGBA8(pages[0]);
  const width = pages[0].width;
  const height = pages[0].height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas-2d-unavailable');
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('tiff-decode-failed');
  return blob;
}
