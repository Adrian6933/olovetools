// ============================================================================
// WatermarkSnap — modelo de datos
// ----------------------------------------------------------------------------
// La marca de agua NUNCA se hornea en un bitmap: se describe con estos objetos
// y los píxeles se derivan de ellos cada vez. Eso es lo que hace que la edición
// sea no destructiva, que el undo cueste ~400 bytes en vez de 90 MB, y que el
// mismo ajuste se aplique idéntico a un lote de imágenes de tamaños distintos
// (todas las medidas son relativas al ancho de la imagen, no píxeles absolutos).
// ============================================================================

export type LayerKind = 'text' | 'logo';

/** Cómo se coloca la capa sobre la imagen. */
export type Placement = 'anchor' | 'free' | 'tile';

/** Las 9 posiciones clásicas de anclaje. */
export type Anchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'mid-left' | 'center' | 'mid-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

/** Subconjunto de modos de fusión de Canvas que tienen sentido en una marca de agua. */
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'difference' | 'luminosity';

export interface TileOptions {
  /** Hueco horizontal, en % del ancho del motivo. */
  gapX: number;
  /** Hueco vertical, en % del alto del motivo. */
  gapY: number;
  /** Giro de TODA la rejilla, en grados (el clásico patrón diagonal). */
  angle: number;
  /** Desplaza media celda las filas impares (ladrillo). */
  stagger: boolean;
}

interface CommonLayer {
  id: string;
  visible: boolean;
  /** 0..1 */
  opacity: number;
  /** Giro del motivo en sí, en grados. */
  rotation: number;
  blend: BlendMode;
  placement: Placement;
  anchor: Anchor;
  /** Margen del anclaje, en % del lado corto de la imagen. */
  margin: number;
  /** Posición normalizada 0..1 para `placement: 'free'`. */
  pos: { x: number; y: number };
  tile: TileOptions;
  /** Tamaño en % del ancho de la imagen (cuerpo de la fuente / ancho del logo). */
  scale: number;
}

export interface TextStroke {
  enabled: boolean;
  /** Grosor en % del cuerpo de la fuente. */
  width: number;
  color: string;
}

export interface TextShadow {
  enabled: boolean;
  /** Desenfoque en % del cuerpo de la fuente. */
  blur: number;
  /** Desplazamiento en % del cuerpo de la fuente. */
  offset: number;
  color: string;
}

export interface TextPlate {
  enabled: boolean;
  color: string;
  /** Relleno horizontal y vertical, en % del cuerpo de la fuente. */
  padX: number;
  padY: number;
  /** Radio de esquina en % del alto de la placa. */
  radius: number;
}

export interface TextLayer extends CommonLayer {
  kind: 'text';
  text: string;
  fontFamily: string;
  fontWeight: number;
  italic: boolean;
  /** Interletraje en % del cuerpo de la fuente. */
  letterSpacing: number;
  color: string;
  stroke: TextStroke;
  shadow: TextShadow;
  plate: TextPlate;
}

export interface LogoLayer extends CommonLayer {
  kind: 'logo';
  /** Referencia a un `LogoAsset` cargado. */
  assetId: string;
}

export type Layer = TextLayer | LogoLayer;

/** Un logo subido por el usuario, ya decodificado. */
export interface LogoAsset {
  id: string;
  name: string;
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export type ItemStatus = 'ready' | 'exporting' | 'done' | 'error';

/**
 * Una imagen en la cola. Ojo: solo la imagen ACTIVA mantiene un `preview`
 * decodificado en memoria; las demás guardan únicamente el File y una URL para
 * la miniatura. Un lote de 40 fotos de 12 MP ocuparía 1,9 GB si se decodificaran
 * todas a la vez.
 */
export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  /** ObjectURL del fichero original, solo para la miniatura y el <img> de fallback. */
  url: string;
  status: ItemStatus;
  error?: string;
  /** Tamaño del fichero exportado, cuando ya se ha generado. */
  outputSize?: number;
}

export type OutputFormat = 'png' | 'jpeg' | 'webp';

export interface ExportSettings {
  format: OutputFormat;
  /** 0..1, solo para jpeg/webp. */
  quality: number;
  /** Lado largo máximo en px; 0 = conservar el original. */
  maxSize: number;
  /** Se añade al nombre base del fichero. */
  suffix: string;
}

/** Estado completo que entra en el historial de undo/redo (solo descripción, cero píxeles). */
export interface EditorSnapshot {
  layers: Layer[];
  selectedLayerId: string | null;
}
