// ============================================================================
// Catálogo de formatos de salida
// ----------------------------------------------------------------------------
// El detalle que obliga a detectar en runtime: `canvas.toBlob(cb, 'image/avif')`
// NO falla en un navegador sin codificador AVIF. Devuelve un PNG con el tipo
// cambiado — medido en este proyecto: pedí AVIF y el blob resultante tenía
// `type: "image/png"`. Así que la única comprobación fiable es codificar un
// píxel y mirar qué sale.
// ============================================================================

export type FormatId = 'png' | 'jpeg' | 'webp' | 'avif';

export interface FormatDef {
  id: FormatId;
  mime: string;
  /** Extensión de archivo. */
  ext: string;
  /** Los formatos sin pérdida ignoran el parámetro de calidad. */
  lossy: boolean;
  /** Sin canal alfa: la transparencia hay que aplanarla contra un color. */
  needsFlatten: boolean;
}

export const FORMATS: FormatDef[] = [
  { id: 'png', mime: 'image/png', ext: 'png', lossy: false, needsFlatten: false },
  { id: 'jpeg', mime: 'image/jpeg', ext: 'jpg', lossy: true, needsFlatten: true },
  { id: 'webp', mime: 'image/webp', ext: 'webp', lossy: true, needsFlatten: false },
  { id: 'avif', mime: 'image/avif', ext: 'avif', lossy: true, needsFlatten: false },
];

export const getFormat = (id: FormatId): FormatDef => FORMATS.find(f => f.id === id) || FORMATS[0];

/** Cache de la detección: codificar un píxel por formato basta una vez. */
let supportPromise: Promise<Set<FormatId>> | null = null;

async function probe(mime: string): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, 0.5));
    // La comprobación real: no basta con que devuelva algo, tiene que devolver
    // el tipo pedido. Un fallback silencioso a PNG se detecta justo aquí.
    return !!blob && blob.type === mime;
  } catch {
    return false;
  }
}

/** Formatos que este navegador sabe CODIFICAR de verdad. */
export function supportedFormats(): Promise<Set<FormatId>> {
  if (!supportPromise) {
    supportPromise = (async () => {
      const supported = new Set<FormatId>(['png']); // png siempre
      for (const format of FORMATS) {
        if (format.id === 'png') continue;
        if (await probe(format.mime)) supported.add(format.id);
      }
      return supported;
    })();
  }
  return supportPromise;
}

/** Nombre de archivo de salida, respetando el nombre que puso el usuario. */
export function outputName(baseName: string, format: FormatDef): string {
  const stem = baseName.replace(/\.[a-z0-9]+$/i, '') || 'pastesnap';
  return `${stem}.${format.ext}`;
}

export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
