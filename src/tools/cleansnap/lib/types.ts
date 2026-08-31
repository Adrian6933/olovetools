// ============================================================================
// CleanSnap — tipos del motor
// ----------------------------------------------------------------------------
// El motor anterior tenía dos "modos" (manual e IA) que llamaban al MISMO
// algoritmo de difusión con distinto número de iteraciones. Aquí no hay modos:
// hay métodos, y cada uno dice lo que hace de verdad. Dos de ellos ni siquiera
// borran nada — tapan —, y por eso están en su propio grupo.
// ============================================================================

/**
 * `patch` reconstruye copiando trozos de la propia imagen (propagación de
 * parches): es el único que devuelve textura. `smooth` difunde los bordes hacia
 * dentro: correcto para cielos y degradados, un borrón para todo lo demás.
 * `blur` y `pixelate` NO reconstruyen: ocultan.
 */
export type FillMethod = 'patch' | 'smooth' | 'blur' | 'pixelate';

export type Tool = 'brush' | 'eraser' | 'rect' | 'circle' | 'pan';

export interface FillSettings {
  method: FillMethod;
  /**
   * Lado del parche en píxeles, siempre impar. Manda en el resultado: pequeño
   * sigue mejor los detalles finos, grande copia textura más coherente.
   */
  patchSize: number;
  /**
   * Radio de búsqueda alrededor del hueco, en píxeles. 0 = toda la imagen.
   * Acotarlo es lo que hace que esto termine en menos de un segundo.
   */
  searchRadius: number;
  /** Píxeles que se ensancha la máscara antes de rellenar. Puede ser negativo. */
  grow: number;
  /** Radio del degradado del borde de la máscara, para que no se vea el corte. */
  feather: number;
  /** Fuerza del pixelado/desenfoque, 1–100. */
  strength: number;
}

export const DEFAULT_FILL: FillSettings = {
  method: 'patch',
  patchSize: 9,
  searchRadius: 220,
  grow: 2,
  feather: 2,
  strength: 50,
};

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export interface FillProgress {
  /** 0–1. En `patch` es la fracción de píxeles del hueco ya rellenados. */
  done: number;
  /** Píxeles que quedan por rellenar. */
  remaining: number;
}

/**
 * Lo que se guarda para deshacer: sólo el rectángulo que cambió, no el
 * fotograma entero. Una marca de agua de 300x80 son 96 KB en vez de los 8,3 MB
 * que ocupaba un `ImageData` de 1920x1080 en el historial anterior.
 */
export interface Patch {
  x: number;
  y: number;
  width: number;
  height: number;
  before: Uint8ClampedArray;
  after: Uint8ClampedArray;
}
