// ============================================================================
// Información del sistema
// ----------------------------------------------------------------------------
// Lo anterior era una cadena de `indexOf` sobre el user agent, y se calculaba
// una sola vez al montar. Dos consecuencias: Brave y Vivaldi salían como
// Chrome, Chrome en iOS (que se identifica como `CriOS`) no se detectaba, y si
// girabas el móvil o movías la ventana a otro monitor la resolución seguía
// diciendo la de antes.
//
// Aquí se usa `navigator.userAgentData` cuando existe —que es la API pensada
// justo para esto— con el user agent como respaldo, y todo se vuelve a leer
// cuando cambia algo.
// ============================================================================

import type { SystemInfo } from './types';

function detectBrowser(unknown: string): { browser: string; engine: string } {
  const nav = navigator as any;
  const data = nav.userAgentData;
  if (data && Array.isArray(data.brands)) {
    // La lista lleva marcas señuelo a propósito, y el relleno cambia en cada
    // versión: "Not?A_Brand", "Not/A)Brand", "Not_A Brand"... Por eso se
    // comparan sólo las letras, sin puntuación: cualquier patrón que enumere
    // los separadores se queda corto a la siguiente versión de Chromium.
    const isDecoy = (brand: string) => brand.replace(/[^a-z]/gi, '').toLowerCase() === 'notabrand';
    const real = data.brands.find(
      (entry: any) => entry.brand && !isDecoy(entry.brand) && entry.brand !== 'Chromium'
    );
    const chromium = data.brands.find((entry: any) => entry.brand === 'Chromium');
    if (real) return { browser: `${real.brand} ${real.version}`, engine: 'Blink' };
    if (chromium) return { browser: `Chromium ${chromium.version}`, engine: 'Blink' };
  }

  const ua = navigator.userAgent;
  const match = (pattern: RegExp) => {
    const found = ua.match(pattern);
    return found ? found[1] : '';
  };
  if (/Edg\//.test(ua)) return { browser: `Microsoft Edge ${match(/Edg\/([\d.]+)/)}`, engine: 'Blink' };
  if (/OPR\//.test(ua)) return { browser: `Opera ${match(/OPR\/([\d.]+)/)}`, engine: 'Blink' };
  if (/CriOS\//.test(ua)) return { browser: `Chrome (iOS) ${match(/CriOS\/([\d.]+)/)}`, engine: 'WebKit' };
  if (/FxiOS\//.test(ua)) return { browser: `Firefox (iOS) ${match(/FxiOS\/([\d.]+)/)}`, engine: 'WebKit' };
  if (/Firefox\//.test(ua)) return { browser: `Mozilla Firefox ${match(/Firefox\/([\d.]+)/)}`, engine: 'Gecko' };
  if (/Chrome\//.test(ua)) return { browser: `Google Chrome ${match(/Chrome\/([\d.]+)/)}`, engine: 'Blink' };
  if (/Safari\//.test(ua)) return { browser: `Safari ${match(/Version\/([\d.]+)/)}`, engine: 'WebKit' };
  return { browser: unknown, engine: unknown };
}

function detectOs(unknown: string): string {
  const nav = navigator as any;
  if (nav.userAgentData && nav.userAgentData.platform) return nav.userAgentData.platform;
  const ua = navigator.userAgent;
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS / iPadOS';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return unknown;
}

/**
 * Modelo de la tarjeta gráfica. Sale de una extensión de WebGL que hay que
 * pedir explícitamente; algunos navegadores la esconden por huella digital, y
 * entonces devuelve la cadena genérica, que también es un dato.
 */
function detectGpu(unknown: string): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return unknown;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info
      ? (gl.getParameter((info as any).UNMASKED_RENDERER_WEBGL) as string)
      : (gl.getParameter(gl.RENDERER) as string);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
    return renderer || unknown;
  } catch {
    return unknown;
  }
}

function detectGamut(unknown: string): string {
  if (typeof matchMedia !== 'function') return unknown;
  if (matchMedia('(color-gamut: rec2020)').matches) return 'Rec. 2020';
  if (matchMedia('(color-gamut: p3)').matches) return 'Display-P3';
  if (matchMedia('(color-gamut: srgb)').matches) return 'sRGB';
  return unknown;
}

function detectPointer(unknown: string): string {
  if (typeof matchMedia !== 'function') return unknown;
  if (matchMedia('(pointer: fine)').matches) return 'fine';
  if (matchMedia('(pointer: coarse)').matches) return 'coarse';
  return 'none';
}

export function readSystemInfo(unknown: string, yes: string, no: string): SystemInfo {
  const nav = navigator as any;
  const { browser, engine } = detectBrowser(unknown);
  const connection = nav.connection;

  return {
    // El signo de multiplicar va como carácter, no pegado a mano: en el archivo
    // anterior estaba guardado en Latin-1 y salía en pantalla como "1920 Ã— 1080".
    //
    // `screen.width` puede ser 0 en contextos sin pantalla real (navegadores
    // headless, algunos webviews). Enseñar "0 × 0" no informa de nada, así que
    // en ese caso se dice que no se sabe.
    screen: screen.width && screen.height ? `${screen.width} × ${screen.height}` : unknown,
    viewport: `${document.documentElement.clientWidth} × ${document.documentElement.clientHeight}`,
    pixelRatio: `${window.devicePixelRatio || 1}×`,
    colorDepth: `${screen.colorDepth}-bit`,
    colorGamut: detectGamut(unknown),
    browser,
    engine,
    os: detectOs(unknown),
    cpuCores: navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : unknown,
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : unknown,
    gpu: detectGpu(unknown),
    touchPoints: String(navigator.maxTouchPoints || 0),
    pointer: detectPointer(unknown),
    languages: (navigator.languages || [navigator.language]).join(', '),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || unknown,
    online: navigator.onLine ? yes : no,
    connection: connection && connection.effectiveType ? connection.effectiveType : unknown,
    reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? yes : no,
    cookiesEnabled: navigator.cookieEnabled ? yes : no,
  };
}

/**
 * Se vuelve a leer con cada cambio que puede alterar los datos. La versión
 * anterior sólo leía al montar, así que girar el teléfono o mover la ventana a
 * otra pantalla dejaba la ficha mintiendo.
 */
export function watchSystemInfo(onChange: () => void): () => void {
  const events: [EventTarget, string][] = [
    [window, 'resize'],
    [window, 'orientationchange'],
    [window, 'online'],
    [window, 'offline'],
  ];
  events.forEach(([target, type]) => target.addEventListener(type, onChange));
  const media = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  if (media && media.addEventListener) media.addEventListener('change', onChange);
  return () => {
    events.forEach(([target, type]) => target.removeEventListener(type, onChange));
    if (media && media.removeEventListener) media.removeEventListener('change', onChange);
  };
}
