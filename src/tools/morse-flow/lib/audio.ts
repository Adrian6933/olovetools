// ============================================================================
// The tone.
// ----------------------------------------------------------------------------
// One oscillator for the whole message, gated by one gain node whose envelope
// is scheduled up front. The old player built an OscillatorNode and a GainNode
// per dit and per dah — eight hundred nodes for a paragraph — and created a
// fresh AudioContext for every press of play, which browsers cap and Safari
// eventually refuses outright.
//
// The envelope ramps matter more than they look. A square gate on a sine wave
// produces key clicks: broadband splatter either side of the tone, which is
// exactly what a real keyer's shaping circuit exists to avoid. A 5 ms raised
// cosine is the usual compromise between a soft edge and a crisp one.
// ============================================================================

import type { Schedule } from './timing';

/** Seconds of rise and fall on each element. */
const RAMP = 0.005;
/** Peak gain. Well below 1 so a long dah does not clip on cheap laptop DACs. */
const PEAK = 0.28;

let shared: AudioContext | null = null;

function contextClass(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || null;
}

/** One context for the tab, resumed rather than recreated. */
export async function getContext(): Promise<AudioContext | null> {
  const Ctor = contextClass();
  if (!Ctor) return null;
  if (!shared || shared.state === 'closed') shared = new Ctor();
  if (shared.state === 'suspended') {
    try {
      await shared.resume();
    } catch {
      return null;
    }
  }
  return shared;
}

export interface PlaybackHandle {
  stop: () => void;
  /** Seconds of context time at which the message started. */
  startedAt: number;
  duration: number;
}

export interface ToneOptions {
  frequency: number;
  /** 0..1, applied on top of the peak. */
  volume: number;
  waveform: OscillatorType;
}

export const DEFAULT_TONE: ToneOptions = { frequency: 600, volume: 1, waveform: 'sine' };

/**
 * Schedules the whole message on one oscillator. Returns immediately; the
 * caller polls `context.currentTime` for progress rather than being called
 * back, because a timer per element is the other half of the old design.
 */
export async function play(
  plan: Schedule,
  tone: ToneOptions,
  onEnded: () => void
): Promise<PlaybackHandle | null> {
  const context = await getContext();
  if (!context) return null;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = tone.waveform;
  oscillator.frequency.value = tone.frequency;
  gain.gain.value = 0;
  oscillator.connect(gain).connect(context.destination);

  const start = context.currentTime + 0.06;
  const peak = PEAK * Math.max(0, Math.min(1, tone.volume));

  for (const event of plan.events) {
    if (event.symbol.kind !== 'dit' && event.symbol.kind !== 'dah') continue;
    const on = start + event.start;
    // Ramps are clamped so a very fast dit (50 wpm is 24 ms) still gets an
    // envelope instead of a ramp longer than the element itself.
    const ramp = Math.min(RAMP, event.duration / 3);
    gain.gain.setValueAtTime(0, on);
    gain.gain.linearRampToValueAtTime(peak, on + ramp);
    gain.gain.setValueAtTime(peak, on + event.duration - ramp);
    gain.gain.linearRampToValueAtTime(0, on + event.duration);
  }

  const finish = start + plan.total + 0.05;
  oscillator.start(start);
  oscillator.stop(finish);

  let stopped = false;
  oscillator.onended = () => {
    if (!stopped) onEnded();
    try {
      oscillator.disconnect();
      gain.disconnect();
    } catch {
      /* already torn down */
    }
  };

  return {
    startedAt: start,
    duration: plan.total,
    stop: () => {
      stopped = true;
      try {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
        gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.01);
        oscillator.stop(context.currentTime + 0.02);
      } catch {
        /* stopping an oscillator twice is not an error worth surfacing */
      }
      onEnded();
    },
  };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Renders the message offline and returns a WAV, so it can leave the page. */
export async function renderWav(plan: Schedule, tone: ToneOptions, sampleRate = 44100): Promise<Blob | null> {
  const Offline =
    typeof OfflineAudioContext !== 'undefined'
      ? OfflineAudioContext
      : (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Offline) return null;

  const length = Math.max(1, Math.ceil((plan.total + 0.2) * sampleRate));
  const context = new Offline(1, length, sampleRate);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = tone.waveform;
  oscillator.frequency.value = tone.frequency;
  gain.gain.value = 0;
  oscillator.connect(gain).connect(context.destination);

  const peak = PEAK * Math.max(0, Math.min(1, tone.volume));
  for (const event of plan.events) {
    if (event.symbol.kind !== 'dit' && event.symbol.kind !== 'dah') continue;
    const on = 0.05 + event.start;
    const ramp = Math.min(RAMP, event.duration / 3);
    gain.gain.setValueAtTime(0, on);
    gain.gain.linearRampToValueAtTime(peak, on + ramp);
    gain.gain.setValueAtTime(peak, on + event.duration - ramp);
    gain.gain.linearRampToValueAtTime(0, on + event.duration);
  }
  oscillator.start(0);
  oscillator.stop(plan.total + 0.15);

  const rendered = await context.startRendering();
  return encodeWav(rendered);
}

function encodeWav(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0);
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);

  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([bytes], { type: 'audio/wav' });
}
