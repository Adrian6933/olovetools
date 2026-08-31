import type { BackgroundState } from './lib/backgrounds';

export type WindowStyle = 'mac' | 'windows' | 'simple' | 'none';
export type FontFamily = 'jetbrains-mono' | 'fira-code' | 'source-code-pro' | 'ibm-plex-mono' | 'system';
export type ShadowStyle = 'soft' | 'heavy' | 'neon' | 'none';
export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

/**
 * Todo lo que define el aspecto de la tarjeta, EXCEPTO el código. Se separa a
 * propósito: el historial de deshacer guarda este objeto (unos cientos de
 * bytes) más la referencia a la cadena del código, nunca un bitmap. Cincuenta
 * pasos de historial ocupan menos que una sola captura de 2x.
 */
export interface CardSettings {
  language: string;
  theme: string;
  fileName: string;
  showLineNumbers: boolean;
  startLine: number;
  wordWrap: boolean;
  /** Ancho fijo del editor en px. Solo se aplica con `wordWrap` activo: sin
   *  ajuste de línea la tarjeta crece hasta la línea más larga, que es la única
   *  forma de garantizar que la exportación no recorte nada. */
  cardWidth: number;
  tabSize: number;
  background: BackgroundState;
  padding: number;
  borderRadius: number;
  shadow: ShadowStyle;
  fontSize: number;
  lineHeight: number;
  fontFamily: FontFamily;
  fontLigatures: boolean;
  windowStyle: WindowStyle;
  showWatermark: boolean;
  aspect: string;
  /** Líneas resaltadas (1-indexadas). El resto se atenúa si `dimOthers`. */
  highlightedLines: number[];
  dimOthers: boolean;
}

export interface ExportSettings {
  format: ExportFormat;
  scale: number;
  quality: number;
}

/** Un paso del historial: ajustes + el código de ese momento. */
export interface HistoryEntry {
  code: string;
  settings: CardSettings;
}

/** Archivo soltado por el usuario, en espera de que él pulse "cargar". */
export interface PendingFile {
  file: File;
  name: string;
  size: number;
  lines: number;
  language: string | null;
  text: string;
}

export type Status = 'idle' | 'loading-grammar' | 'exporting' | 'copied' | 'error';
