// ============================================================================
// Exportación de la tarjeta
// ----------------------------------------------------------------------------
// El bug que arregla este módulo: html-to-image serializa el nodo TAL COMO ESTÁ
// MAQUETADO. El `<pre>` del código lleva `overflow-x: auto`, así que todo lo que
// no cupiera en el ancho visible desaparecía del PNG sin avisar (medido: a
// 375px de ventana el `<pre>` tenía 447px de contenido en 145px visibles, o sea
// que el 68% del código no llegaba a la imagen).
//
// La solución es despegar el nodo del ancho de la ventana durante la captura:
// `.codecard-exporting` pone el `<pre>` en `width: max-content; overflow:
// visible`, forzamos un reflow, medimos el tamaño REAL y capturamos con esas
// dimensiones explícitas. Luego se restaura todo.
// ============================================================================

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export interface ExportOptions {
  format: ExportFormat;
  /** Multiplicador de resolución (1, 2, 3, 4). */
  scale: number;
  /** 0-1, solo para jpeg/webp. */
  quality: number;
  /** Color de respaldo para formatos sin canal alfa. */
  background?: string;
}

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
}

/** Extensión de archivo por formato. */
export const EXTENSION: Record<ExportFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  svg: 'svg',
};

/**
 * Empotrar las fuentes cuesta lo mismo la primera vez que la décima, así que se
 * calcula una sola vez por sesión. Sin esto, un PNG exportado en un equipo sin
 * JetBrains Mono instalada saldría con la mono del sistema.
 */
let fontEmbedCache: Promise<string> | null = null;

async function getFontCss(node: HTMLElement): Promise<string> {
  if (!fontEmbedCache) {
    fontEmbedCache = import('html-to-image')
      .then(m => m.getFontEmbedCSS(node))
      .catch(() => '');
  }
  return fontEmbedCache;
}

/** Tamaño real del nodo una vez desatado del ancho de la ventana. */
function measureUnclipped(node: HTMLElement): { width: number; height: number } {
  node.classList.add('codecard-exporting');
  // Lectura de layout: fuerza el reflow síncrono antes de medir. Deliberado, y
  // deliberadamente no dentro de un requestAnimationFrame: en una pestaña en
  // segundo plano rAF no dispara y la exportación se quedaría colgada.
  const width = Math.ceil(node.scrollWidth);
  const height = Math.ceil(node.scrollHeight);
  return { width, height };
}

function restore(node: HTMLElement): void {
  node.classList.remove('codecard-exporting');
}

/**
 * Renderiza el nodo a un Blob. Devuelve también el tamaño en píxeles reales
 * para poder enseñárselo al usuario antes de descargar.
 */

/** Tope de lado y de área de un canvas antes de que el navegador lo dé por nulo. */
const MAX_CANVAS_SIDE = 16384;
const MAX_CANVAS_AREA = 64 * 1024 * 1024;

/** Escala real utilizable: 4x sobre una tarjeta enorme excede el canvas. */
function usableScale(width: number, height: number, wanted: number): number {
  let scale = wanted;
  while (
    scale > 1 &&
    (width * scale > MAX_CANVAS_SIDE ||
      height * scale > MAX_CANVAS_SIDE ||
      width * scale * height * scale > MAX_CANVAS_AREA)
  ) {
    scale -= 1;
  }
  return scale;
}

/**
 * Rasteriza el SVG serializado a mano en vez de usar `toBlob`/`toCanvas`.
 * Motivo: html-to-image resuelve su carga de imagen dentro de un
 * `requestAnimationFrame`, y rAF NO se ejecuta en una pestaña en segundo plano.
 * Con su implementación, un export lanzado y luego minimizado se queda colgado
 * para siempre. `img.decode()` sí resuelve con la pestaña oculta.
 */
async function rasterize(
  dataUrl: string,
  width: number,
  height: number,
  scale: number,
  background: string | undefined,
  mime: string,
  quality: number
): Promise<Blob> {
  const img = new Image();
  img.decoding = 'async';
  img.src = dataUrl;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no-2d-context');

  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mime, quality));
  if (!blob) throw new Error('empty-render');
  return blob;
}

export async function renderCard(node: HTMLElement, options: ExportOptions): Promise<ExportResult> {
  const htmlToImage = await import('html-to-image');
  const { width, height } = measureUnclipped(node);

  try {
    const fontEmbedCSS = await getFontCss(node);
    const dataUrl = await htmlToImage.toSvg(node, {
      width,
      height,
      fontEmbedCSS,
      // cacheBust añade un query param a cada recurso, lo que dinamita la
      // caché del navegador en cada export. Aquí todo es local y estable.
      cacheBust: false,
      style: {
        // El nodo se serializa con su propio tamaño: sin esto html-to-image
        // hereda el ancho visible del contenedor y vuelve a recortar.
        width: `${width}px`,
        height: `${height}px`,
        margin: '0',
        transform: 'none',
      },
    });

    if (options.format === 'svg') {
      const text = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(',') + 1));
      return {
        blob: new Blob([text], { type: 'image/svg+xml' }),
        width,
        height,
      };
    }

    const scale = usableScale(width, height, options.scale);
    // jpeg y webp no tienen canal alfa: sin fondo, todo lo transparente (las
    // esquinas redondeadas, la sombra) saldría negro. El PNG sí lo conserva,
    // que es lo que hace útil el fondo "ninguno".
    const background = options.format === 'png' ? undefined : options.background || '#0b0b12';
    const mime = options.format === 'jpeg' ? 'image/jpeg' : options.format === 'webp' ? 'image/webp' : 'image/png';
    const blob = await rasterize(dataUrl, width, height, scale, background, mime, options.quality);

    return { blob, width: Math.round(width * scale), height: Math.round(height * scale) };
  } finally {
    restore(node);
  }
}

/** Dispara la descarga y revoca la URL: sin revoke el blob se queda en memoria. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // El click es síncrono pero la descarga la arranca el navegador después;
  // revocar en el mismo tick la cancela en Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Copia la imagen al portapapeles. Solo PNG: es lo único que aceptan los SO. */
export async function copyToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Nombre de archivo seguro a partir del nombre que el usuario escribió. */
export function safeFileName(base: string, format: ExportFormat): string {
  const stem = base.replace(/\.[^.]*$/, '').replace(/[^\w.-]+/g, '_') || 'code-snippet';
  return `CodeCard-${stem}.${EXTENSION[format]}`;
}
