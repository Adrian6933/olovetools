// ============================================================================
// Enumeración y sondeo de cámaras
// ----------------------------------------------------------------------------
// Dos cosas que la versión anterior no hacía:
//
//   1. Enumerar micrófonos y altavoces. Sólo filtraba `videoinput`, así que no
//      se podía elegir micro y no existía prueba de altavoces — en una
//      herramienta que se llama "probador de dispositivos".
//
//   2. Enterarse de que `enumerateDevices()` SIN permiso concedido devuelve los
//      aparatos con `label` vacío. Como se llamaba al montar, el desplegable
//      mostraba "Camera 1" en vez del nombre real de la webcam (verificado en
//      pantalla). Aquí se vuelve a enumerar en cuanto hay permiso, y se avisa
//      mientras tanto.
// ============================================================================

import type { CameraSettings, DeviceEntry, DeviceLists, ResolutionProbe } from './types';

const EMPTY: DeviceLists = { cameras: [], microphones: [], speakers: [], labelled: false };

export async function enumerate(): Promise<DeviceLists> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return EMPTY;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const pick = (kind: string): DeviceEntry[] =>
      devices
        .filter(device => device.kind === kind)
        .map(device => ({ deviceId: device.deviceId, label: device.label, kind: kind as any }));

    const cameras = pick('videoinput');
    const microphones = pick('audioinput');
    const speakers = pick('audiooutput');
    const all = cameras.concat(microphones, speakers);
    return {
      cameras,
      microphones,
      speakers,
      labelled: all.length > 0 && all.some(device => device.label !== ''),
    };
  } catch {
    return EMPTY;
  }
}

/** Avisa cuando se enchufa o se quita un aparato. Devuelve el desenganche. */
export function onDeviceChange(handler: () => void): () => void {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return () => {};
  navigator.mediaDevices.addEventListener('devicechange', handler);
  return () => navigator.mediaDevices.removeEventListener('devicechange', handler);
}

// ----------------------------------------------------------------------------
// Lo que la cámara entrega de verdad
// ----------------------------------------------------------------------------

/**
 * `getSettings()` es la única fuente fiable: lo que se pide en las
 * restricciones es una petición, no una promesa. La herramienta anterior
 * pedía `video: true` y no miraba nunca qué había salido, así que no podía
 * decir a qué resolución ni a cuántos fotogramas estaba capturando.
 */
export function readCameraSettings(stream: MediaStream): CameraSettings | null {
  const track = stream.getVideoTracks()[0];
  if (!track) return null;
  const settings = track.getSettings();
  return {
    width: settings.width || 0,
    height: settings.height || 0,
    frameRate: settings.frameRate ? Math.round(settings.frameRate) : 0,
    facingMode: (settings as any).facingMode || '',
    deviceLabel: track.label || '',
  };
}

/** Rango que anuncia el propio aparato, cuando el navegador lo expone. */
export function readCameraCapabilities(stream: MediaStream): { maxWidth: number; maxHeight: number; maxFps: number } | null {
  const track = stream.getVideoTracks()[0];
  if (!track || typeof track.getCapabilities !== 'function') return null;
  try {
    const caps = track.getCapabilities();
    return {
      maxWidth: (caps.width && (caps.width as any).max) || 0,
      maxHeight: (caps.height && (caps.height as any).max) || 0,
      maxFps: (caps.frameRate && Math.round((caps.frameRate as any).max)) || 0,
    };
  } catch {
    return null;
  }
}

const LADDER = [
  { label: '4K', width: 3840, height: 2160 },
  { label: '1440p', width: 2560, height: 1440 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '480p', width: 640, height: 480 },
];

/**
 * Pide cada resolución de la escalera y mira qué entrega realmente.
 *
 * Es el mismo truco que el sondeo de codificadores de FormatFlow, y por la
 * misma razón: pedir no es obtener. Con `ideal` el navegador da lo más
 * parecido que puede sin fallar, así que la única manera de saber qué admite
 * una webcam es pedírselo y medir el resultado.
 */
export async function probeResolutions(
  deviceId: string,
  onStep?: (done: number, total: number) => void
): Promise<ResolutionProbe[]> {
  const results: ResolutionProbe[] = [];
  for (let index = 0; index < LADDER.length; index++) {
    const entry = LADDER[index];
    if (onStep) onStep(index, LADDER.length);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: entry.width },
          height: { ideal: entry.height },
        },
      });
      const settings = readCameraSettings(stream);
      const got = settings ? { width: settings.width, height: settings.height } : null;
      results.push({
        label: entry.label,
        requested: { width: entry.width, height: entry.height },
        got,
        exact: !!got && got.width === entry.width && got.height === entry.height,
      });
    } catch {
      results.push({
        label: entry.label,
        requested: { width: entry.width, height: entry.height },
        got: null,
        exact: false,
      });
    } finally {
      // Soltar SIEMPRE la cámara entre pruebas: dejar cinco flujos abiertos
      // bloquea el aparato y el resto de peticiones fallan sin motivo aparente.
      if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }
  if (onStep) onStep(LADDER.length, LADDER.length);
  return results;
}

/**
 * Captura un fotograma a la resolución REAL del flujo, no a la del elemento
 * de vídeo escalado en pantalla.
 */
export async function grabFrame(video: HTMLVideoElement): Promise<Blob | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}
