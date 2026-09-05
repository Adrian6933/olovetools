export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

export const FORMAT_EXT: Record<ImageFormat, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Lo que el propio vídeo dice de sí mismo, no lo que nadie supone. */
export interface VideoInfo {
  name: string;
  width: number;
  height: number;
  duration: number;
  bytes: number;
  /** Medidos a partir de fotogramas presentados de verdad. Null si no se pudo. */
  fps: number | null;
  /** Si el navegador tiene requestVideoFrameCallback. Sin él todo va a ciegas. */
  exact: boolean;
}

/** Qué fotogramas se quieren. */
export type PickMode = 'all' | 'every-n' | 'interval' | 'count';

export interface PickOptions {
  mode: PickMode;
  /** Para 'every-n': se guarda 1 de cada N. */
  everyN: number;
  /** Para 'interval': segundos entre capturas. */
  interval: number;
  /** Para 'count': cuántos repartidos por el rango. */
  count: number;
  from: number;
  /** 0 = hasta el final. */
  to: number;
}

export interface OutputOptions {
  format: ImageFormat;
  /** 1..100. El PNG no la usa. */
  quality: number;
  /** Ancho máximo en píxeles; 0 = tamaño original. */
  maxWidth: number;
  /** Plantilla del nombre: {n}, {t}, {name}. */
  pattern: string;
}

export interface FilterOptions {
  /** Descartar el fotograma si es casi igual al último guardado. */
  skipDuplicates: boolean;
  /** 0..1. Por debajo de esta diferencia media cuenta como repetido. */
  duplicateThreshold: number;
  /** Descartar fundidos a negro y fotogramas en blanco. */
  skipBlank: boolean;
}

export const DEFAULT_PICK: PickOptions = {
  mode: 'all',
  everyN: 2,
  interval: 1,
  count: 24,
  from: 0,
  to: 0,
};

export const DEFAULT_OUTPUT: OutputOptions = {
  format: 'image/jpeg',
  quality: 92,
  maxWidth: 0,
  pattern: '{name}_{n}_{t}',
};

export const DEFAULT_FILTERS: FilterOptions = {
  skipDuplicates: false,
  duplicateThreshold: 0.02,
  skipBlank: false,
};

export interface RunProgress {
  /** Fotogramas mirados, incluidos los descartados por los filtros. */
  seen: number;
  /** Fotogramas escritos en el ZIP. */
  written: number;
  /** Descartados por repetidos o por estar en negro. */
  skipped: number;
  /** Bytes que lleva el ZIP. */
  bytes: number;
  /** Segundo del vídeo por el que va. */
  at: number;
  /** Total previsto, cuando se puede saber. -1 si no. */
  total: number;
  startedAt: number;
  /**
   * En pausa esperando a que la pestaña vuelva a primer plano. El navegador no
   * presenta fotogramas de un vídeo que nadie está mirando, así que el motor de
   * reproducción no puede avanzar mientras tanto.
   */
  waiting: boolean;
}

export interface RunResult {
  progress: RunProgress;
  cancelled: boolean;
  /** Sólo cuando el destino fue la memoria. */
  blob: Blob | null;
  filename: string;
  /**
   * El ZIP está bien cerrado y se puede abrir, pero no lleva todos los
   * fotogramas del tramo pedido. Se entrega igual, con el aviso: tirar 8.000
   * fotogramas buenos porque el 8.001 falló no le sirve a nadie.
   */
  partial?: boolean;
  error?: string;
}
