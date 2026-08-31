// ============================================================================
// Medición de audio
// ----------------------------------------------------------------------------
// El medidor anterior era `fftSize = 64` —32 bandas para 24 barras— y pintaba
// la altura de unos divs con `getByteFrequencyData`. Eso enseña que "algo
// suena", pero no responde a la única pregunta por la que se abre esta página:
// ¿me está cogiendo el micrófono, y a qué nivel?
//
// Para eso hace falta el dominio del tiempo, no el de la frecuencia: valor
// eficaz (RMS) y pico, ambos en dBFS, con retención de pico, detección de
// saturación y de silencio. Es lo que trae cualquier medidor de verdad y son
// treinta líneas.
// ============================================================================

import type { AudioLevels } from './types';

/** Por debajo de esto se considera que no entra señal. */
export const SILENCE_DBFS = -60;
/** A partir de aquí el micro está pegado al techo. */
export const CLIP_DBFS = -0.5;

const MIN_DBFS = -100;

function toDb(amplitude: number): number {
  if (amplitude <= 0) return MIN_DBFS;
  return Math.max(MIN_DBFS, 20 * Math.log10(amplitude));
}

export interface MeterHandle {
  read: () => AudioLevels;
  sampleRate: number;
  /** Retardo de entrada declarado por el navegador, en ms, o null. */
  baseLatencyMs: number | null;
  close: () => Promise<void>;
}

export async function createMeter(stream: MediaStream, bandCount = 32): Promise<MeterHandle> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const context: AudioContext = new AudioContextClass();
  if (context.state === 'suspended') await context.resume();

  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  // 2048 da resolución de sobra en el tiempo para un RMS estable y, de paso,
  // 1024 bandas de espectro. Con las 32 de antes no había ni una cosa ni otra.
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.75;
  source.connect(analyser);

  // Buffers reservados UNA vez. El medidor anterior creaba un Uint8Array nuevo
  // en cada fotograma, sesenta veces por segundo.
  const timeData = new Float32Array(analyser.fftSize);
  const freqData = new Float32Array(analyser.frequencyBinCount);
  const bands = new Float32Array(bandCount);

  let hold = MIN_DBFS;
  let lastRead = 0;

  const read = (): AudioLevels => {
    analyser.getFloatTimeDomainData(timeData);

    let sumSquares = 0;
    let peakAmplitude = 0;
    for (let i = 0; i < timeData.length; i++) {
      const value = timeData[i];
      sumSquares += value * value;
      const magnitude = value < 0 ? -value : value;
      if (magnitude > peakAmplitude) peakAmplitude = magnitude;
    }
    const rms = toDb(Math.sqrt(sumSquares / timeData.length));
    const peak = toDb(peakAmplitude);

    // Retención de pico con caída: sube al instante y baja despacio, que es lo
    // que permite ver un chasquido que dura tres milisegundos.
    const now = performance.now();
    const elapsed = lastRead ? (now - lastRead) / 1000 : 0;
    lastRead = now;
    hold = peak > hold ? peak : Math.max(MIN_DBFS, hold - elapsed * 20);

    analyser.getFloatFrequencyData(freqData);
    // Bandas repartidas en escala logarítmica: con el reparto lineal de antes,
    // media pantalla se iba en frecuencias donde la voz no tiene nada.
    const bins = freqData.length;
    for (let i = 0; i < bandCount; i++) {
      const from = Math.floor(Math.pow(bins, i / bandCount));
      const to = Math.max(from + 1, Math.floor(Math.pow(bins, (i + 1) / bandCount)));
      let sum = 0;
      let count = 0;
      for (let j = from; j < to && j < bins; j++) {
        sum += freqData[j];
        count++;
      }
      const db = count > 0 ? sum / count : MIN_DBFS;
      bands[i] = Math.max(0, Math.min(1, (db + 90) / 90));
    }

    return { rms, peak, hold, clipping: peak >= CLIP_DBFS, bands };
  };

  return {
    read,
    sampleRate: context.sampleRate,
    baseLatencyMs: typeof context.baseLatency === 'number' ? Math.round(context.baseLatency * 1000) : null,
    close: async () => {
      try {
        source.disconnect();
        analyser.disconnect();
        await context.close();
      } catch {
        /* cerrar dos veces no es un error que merezca contarse */
      }
    },
  };
}

// ----------------------------------------------------------------------------
// Prueba de altavoces
// ----------------------------------------------------------------------------

export interface ToneHandle {
  stop: () => void;
}

/**
 * Tono en un canal concreto, para comprobar que suenan los dos altavoces y que
 * no están cambiados. La versión anterior no tenía ninguna prueba de salida.
 *
 * `channel` es 'left', 'right' o 'both'. El envolvente de ataque y caída no es
 * un adorno: arrancar y parar una onda seca produce un chasquido que en unos
 * auriculares se oye más que el propio tono.
 */
export async function playTone(
  frequency: number,
  channel: 'left' | 'right' | 'both',
  seconds: number,
  deviceId?: string
): Promise<ToneHandle> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const context: AudioContext = new AudioContextClass();
  if (context.state === 'suspended') await context.resume();

  // Encaminar a un altavoz concreto sólo es posible a través de un elemento de
  // audio con setSinkId; el destino del AudioContext no se puede redirigir en
  // todos los navegadores.
  if (deviceId && typeof (context as any).setSinkId === 'function') {
    try { await (context as any).setSinkId(deviceId); } catch { /* sin soporte */ }
  }

  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, context.currentTime + 0.02);
  gain.gain.setValueAtTime(0.25, context.currentTime + seconds - 0.05);
  gain.gain.linearRampToValueAtTime(0, context.currentTime + seconds);

  oscillator.connect(gain);

  if (channel === 'both') {
    gain.connect(context.destination);
  } else {
    const merger = context.createChannelMerger(2);
    gain.connect(merger, 0, channel === 'left' ? 0 : 1);
    merger.connect(context.destination);
  }

  oscillator.start();
  oscillator.stop(context.currentTime + seconds);

  let closed = false;
  const shutdown = () => {
    if (closed) return;
    closed = true;
    try { oscillator.disconnect(); } catch { /* ya desconectado */ }
    context.close().catch(() => {});
  };
  oscillator.onended = shutdown;

  return { stop: shutdown };
}
