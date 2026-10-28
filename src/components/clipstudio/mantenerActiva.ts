// ============================================================================
// Que la exportación siga a buen ritmo con la pestaña oculta o minimizada
// ----------------------------------------------------------------------------
// El bucle de exportOffline no depende de temporizadores (y los de mediabunny
// van por un worker sin freno), pero Chrome trata una pestaña en segundo plano
// como poco importante: baja la prioridad de su proceso (en Windows 11 lo pasa
// a "modo eficiencia", a los núcleos lentos), con el Ahorro de energía puede
// congelarla si gasta mucha CPU y con el Ahorro de memoria descartarla.
//
// La excepción que respetan todas esas medidas es la pestaña que suena. Así
// que mientras se exporta suena un tono de 30 Hz a -57 dBFS: por encima del
// umbral con el que Chrome decide que hay audio (-72 dBFS), y muy por debajo
// de lo que el oído percibe a esa frecuencia (el umbral a 30 Hz anda por los
// 60 dB SPL). Efecto visible: el altavoz en la pestaña mientras dura.
// Además se coge un Web Lock, que también evita que se congele o descarte.
//
// Lleva la cuenta: con varias exportaciones a la vez (lotes.ts hace 2-3) el
// tono se apaga al terminar la última.
// ============================================================================

let usos = 0;
let audio: AudioContext | null = null;
let soltarCerrojo: (() => void) | null = null;

const encender = () => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      const ac: AudioContext = new Ctx();
      const tono = ac.createOscillator();
      tono.frequency.value = 30;
      const volumen = ac.createGain();
      volumen.gain.value = 0.002;
      tono.connect(volumen).connect(ac.destination);
      tono.start();
      // Sin un clic reciente puede nacer suspendido; si no arranca, se
      // exporta igual (solo que sin la ayuda).
      ac.resume().catch(() => { /* sin audio */ });
      audio = ac;
    }
  } catch { /* sin audio */ }
  try {
    if (navigator.locks) {
      navigator.locks.request('clipstudio-export', () => new Promise<void>(r => { soltarCerrojo = r; })).catch(() => { /* sin cerrojo */ });
    }
  } catch { /* sin cerrojo */ }
};

const apagar = () => {
  audio?.close().catch(() => { /* ya cerrado */ });
  audio = null;
  soltarCerrojo?.();
  soltarCerrojo = null;
};

/** Mantiene la pestaña "activa" hasta que se llame a lo que devuelve (una vez). */
export const mantenerPestanaActiva = (): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  if (usos++ === 0) encender();
  let suelto = false;
  return () => {
    if (suelto) return;
    suelto = true;
    if (--usos === 0) apagar();
  };
};
