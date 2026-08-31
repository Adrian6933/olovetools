// ============================================================================
// Device Test — tipos
// ============================================================================

export type DeviceKind = 'videoinput' | 'audioinput' | 'audiooutput';

export interface DeviceEntry {
  deviceId: string;
  /** Nombre real del aparato, o '' si aún no hay permiso concedido. */
  label: string;
  kind: DeviceKind;
}

export interface DeviceLists {
  cameras: DeviceEntry[];
  microphones: DeviceEntry[];
  speakers: DeviceEntry[];
  /**
   * false mientras el navegador siga devolviendo etiquetas vacías. Sin permiso
   * `enumerateDevices` da los aparatos pero sin nombre, y la lista es inútil:
   * es la razón por la que el desplegable ponía "Camera 1".
   */
  labelled: boolean;
}

/** Lo que la cámara entrega de verdad, no lo que se le pidió. */
export interface CameraSettings {
  width: number;
  height: number;
  frameRate: number;
  facingMode: string;
  deviceLabel: string;
}

/** Resultado de pedirle a la cámara una resolución concreta. */
export interface ResolutionProbe {
  label: string;
  requested: { width: number; height: number };
  got: { width: number; height: number } | null;
  /** true si entregó exactamente lo pedido. */
  exact: boolean;
}

export interface AudioLevels {
  /** Nivel eficaz en dBFS (-100 a 0). Es el que se corresponde con el volumen. */
  rms: number;
  /** Pico instantáneo en dBFS. */
  peak: number;
  /** Pico retenido, con caída lenta, como en cualquier medidor de verdad. */
  hold: number;
  /** true si algún bloque tocó el techo: el micro está saturando. */
  clipping: boolean;
  /** Espectro ya reducido a las bandas que se pintan. */
  bands: Float32Array;
}

export interface SystemInfo {
  screen: string;
  viewport: string;
  pixelRatio: string;
  colorDepth: string;
  colorGamut: string;
  browser: string;
  engine: string;
  os: string;
  cpuCores: string;
  memory: string;
  gpu: string;
  touchPoints: string;
  pointer: string;
  languages: string;
  timezone: string;
  online: string;
  connection: string;
  reducedMotion: string;
  cookiesEnabled: string;
}

export type TestId = 'camera' | 'microphone' | 'speakers' | 'screen' | 'keyboard' | 'pointer';
