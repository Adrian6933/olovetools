// ============================================================================
// FormatFlow — tipos del motor
// ----------------------------------------------------------------------------
// El enum de formatos anterior mezclaba dos cosas distintas: lo que el canvas
// del navegador sabe codificar (jpeg/png/webp/avif) y lo que hay que envolver
// a mano (ico/pdf/tiff/svg). Al tratarlos igual, la herramienta ofrecía GIF,
// HEIC, EPS y RAW como si existieran, y `canvas.toBlob` devolvía un PNG
// silenciosamente para todos ellos. Aquí van separados, y el catálogo se
// contrasta contra el navegador real antes de enseñarse.
// ============================================================================

/** Formatos que el codificador del navegador puede escribir directamente. */
export type RasterMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

/** Salidas que no son un `toBlob`: se construyen envolviendo un ráster. */
export type ContainerId = 'ico' | 'pdf' | 'tiff' | 'svg';

export type OutputId = RasterMime | ContainerId;

export interface FormatInfo {
  id: OutputId;
  /** Etiqueta corta del botón. */
  label: string;
  /** Extensión del archivo resultante, sin punto. */
  ext: string;
  /** true si el formato admite transparencia. */
  alpha: boolean;
  /** true si el deslizador de calidad hace algo. */
  lossy: boolean;
  /** Se rellena en runtime: false cuando el navegador no lo codifica. */
  available: boolean;
  /** Motivo cuando `available` es false, para poder decirlo en pantalla. */
  reason?: 'no-encoder';
}

// ----------------------------------------------------------------------------
// Ajustes
// ----------------------------------------------------------------------------

export type ResizeMode = 'none' | 'scale' | 'longEdge' | 'dimensions';
export type FitMode = 'contain' | 'cover' | 'stretch';

export interface Settings {
  format: OutputId;
  /** 1–100. Ignorado en formatos sin pérdida. */
  quality: number;
  resizeMode: ResizeMode;
  /** Porcentaje para `scale` (10–400). */
  scale: number;
  /** Píxeles del lado largo para `longEdge`. */
  longEdge: number;
  width: number;
  height: number;
  lockAspect: boolean;
  fit: FitMode;
  /** Giro en grados, siempre múltiplo de 90. */
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  /**
   * Color bajo la imagen cuando el destino no admite alfa. El blanco fijo del
   * motor anterior convertía cualquier PNG transparente en un PNG con marco
   * blanco sin decirlo.
   */
  background: string;
  /** Nitidez tras reducir, 0–100. Un enmascarado de desenfoque clásico. */
  sharpen: number;
  /** Peso objetivo en bytes; 0 = sin objetivo. Busca la calidad por bisección. */
  targetBytes: number;
  /** Calcula el SSIM del resultado contra el original. */
  measureQuality: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  format: 'image/webp',
  quality: 82,
  resizeMode: 'none',
  scale: 100,
  longEdge: 1920,
  width: 1920,
  height: 1080,
  lockAspect: true,
  fit: 'contain',
  rotate: 0,
  flipH: false,
  flipV: false,
  background: '#ffffff',
  sharpen: 0,
  targetBytes: 0,
  measureQuality: true,
};

// ----------------------------------------------------------------------------
// Cola
// ----------------------------------------------------------------------------

export interface QueueItem {
  id: string;
  file: File;
  /** Blob ya decodificable: el HEIC del iPhone llega aquí convertido. */
  source: Blob;
  /** MIME real de la fuente, después de resolver HEIC/TIFF. */
  sourceMime: string;
  /** objectURL de la miniatura. Se revoca al quitar la imagen. */
  thumbUrl: string;
  width: number;
  height: number;
  originalSize: number;
  /** Ajustes propios de esta imagen; `null` = usa los globales. */
  settings: Settings | null;
  /** Índice del worker que guarda su bitmap decodificado. */
  slot: number;
  result: ConversionResult | null;
  /** true cuando los ajustes cambiaron después de convertir. */
  stale: boolean;
  error: string | null;
}

export interface ConversionResult {
  url: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  mime: string;
  ext: string;
  /** Calidad realmente empleada (tras la bisección por peso). */
  quality: number;
  /** SSIM contra el original, o null si no se midió. */
  ssim: number | null;
  ms: number;
  /** Número de codificaciones que costó (1 salvo con peso objetivo). */
  attempts: number;
  /** true si había peso objetivo y no se pudo cumplir. */
  missedTarget: boolean;
  /** Matiz que la interfaz traduce (p. ej. que el ICO lleva varios tamaños). */
  detail: 'ico-multisize' | null;
}
