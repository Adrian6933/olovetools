// ============================================================================
// AudioSnap — audio engine
// ----------------------------------------------------------------------------
// Everything here is the plain Web Audio API, no dependency and no network.
// The one design rule: the decoded AudioBuffer is treated as read-only. Every
// edit is a description (see EditState) that gets applied by an
// OfflineAudioContext render at export time, so the user can undo anything and
// the source never degrades through repeated round trips.
// ============================================================================

import type { ChannelMode, EditState, LevelStats, PeakMip, SourceInfo } from '../types';

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

/**
 * `decodeAudioData` resamples to the context's own rate, and a plain
 * `AudioContext` runs at whatever the output device wants (usually 48 kHz).
 * Feeding it a 44.1 kHz file therefore costs a resample before the user has
 * done anything. When the container tells us the real rate we can build an
 * OfflineAudioContext at that rate instead and decode bit-exact.
 */
function sniffSampleRate(bytes: ArrayBuffer): number | null {
  const view = new DataView(bytes);
  if (view.byteLength < 64) return null;

  const tag = (offset: number) =>
    String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );

  // RIFF/WAVE: walk the chunk list to "fmt " rather than assuming offset 12,
  // because files written by some recorders carry a JUNK chunk first.
  if (tag(0) === 'RIFF' && tag(8) === 'WAVE') {
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
      const id = tag(offset);
      const size = view.getUint32(offset + 4, true);
      if (id === 'fmt ' && offset + 12 <= view.byteLength) {
        const rate = view.getUint32(offset + 12, true);
        return rate >= 3000 && rate <= 384000 ? rate : null;
      }
      offset += 8 + size + (size % 2);
    }
    return null;
  }

  // FLAC: STREAMINFO is always the first metadata block, and its sample rate
  // is the 20 bits starting at byte 18 of the block payload.
  if (tag(0) === 'fLaC' && view.byteLength > 30) {
    const rate = (view.getUint8(18) << 12) | (view.getUint8(19) << 4) | (view.getUint8(20) >> 4);
    return rate >= 3000 && rate <= 384000 ? rate : null;
  }

  return null;
}

const AudioCtx: typeof AudioContext =
  typeof window !== 'undefined'
    ? (window.AudioContext || (window as any).webkitAudioContext)
    : (undefined as any);

/**
 * Decodes any container the browser can read (mp3, m4a, ogg, opus, flac, wav,
 * webm — including the audio track of a video file) into an AudioBuffer.
 */
export async function decodeAudioFile(file: File): Promise<{ buffer: AudioBuffer; info: SourceInfo }> {
  const bytes = await file.arrayBuffer();
  const nativeRate = sniffSampleRate(bytes);

  let buffer: AudioBuffer | null = null;
  let resampled = false;

  if (nativeRate) {
    try {
      // 1 frame is enough: decodeAudioData ignores the context length.
      const offline = new OfflineAudioContext(1, 1, nativeRate);
      buffer = await offline.decodeAudioData(bytes.slice(0));
    } catch {
      buffer = null;
    }
  }

  if (!buffer) {
    const ctx = new AudioCtx();
    try {
      buffer = await ctx.decodeAudioData(bytes.slice(0));
      resampled = nativeRate !== null && nativeRate !== buffer.sampleRate;
    } finally {
      ctx.close().catch(() => {});
    }
  }

  return {
    buffer,
    info: {
      name: file.name,
      origin: file.type || 'audio',
      sizeBytes: file.size,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      duration: buffer.duration,
      resampled,
    },
  };
}

/** Same decode path for a Blob straight out of MediaRecorder. */
export async function decodeRecording(blob: Blob, name: string): Promise<{ buffer: AudioBuffer; info: SourceInfo }> {
  const file = new File([blob], name, { type: blob.type || 'audio/webm' });
  const result = await decodeAudioFile(file);
  return { buffer: result.buffer, info: { ...result.info, origin: 'mic' } };
}

// ---------------------------------------------------------------------------
// Waveform envelope
// ---------------------------------------------------------------------------

/**
 * Builds the min/max/RMS mip used by the waveform canvas. Runs once per
 * decoded buffer; every later zoom, pan and drag reads from this.
 */
export function buildPeakMip(buffer: AudioBuffer, samplesPerBucket = 256): PeakMip {
  const buckets = Math.max(1, Math.ceil(buffer.length / samplesPerBucket));
  const min = new Float32Array(buckets);
  const max = new Float32Array(buckets);
  const rms = new Float32Array(buckets);

  const channels: Float32Array[] = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));

  for (let b = 0; b < buckets; b++) {
    const start = b * samplesPerBucket;
    const end = Math.min(start + samplesPerBucket, buffer.length);
    let lo = 0;
    let hi = 0;
    let sum = 0;
    let count = 0;

    for (let ch = 0; ch < channels.length; ch++) {
      const data = channels[ch];
      for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        sum += v * v;
        count++;
      }
    }

    min[b] = lo;
    max[b] = hi;
    rms[b] = count ? Math.sqrt(sum / count) : 0;
  }

  return {
    min,
    max,
    rms,
    samplesPerBucket,
    buckets,
    sampleRate: buffer.sampleRate,
    duration: buffer.duration,
  };
}

export interface EnvelopeSlice {
  min: Float32Array;
  max: Float32Array;
  rms: Float32Array;
}

/**
 * Collapses the mip down to `width` columns covering [fromSec, toSec]. Cheap
 * enough to run on every pointermove while dragging a handle.
 */
export function sliceEnvelope(mip: PeakMip, fromSec: number, toSec: number, width: number): EnvelopeSlice {
  const cols = Math.max(1, Math.floor(width));
  const min = new Float32Array(cols);
  const max = new Float32Array(cols);
  const rms = new Float32Array(cols);

  const bucketsPerSecond = mip.sampleRate / mip.samplesPerBucket;
  const fromBucket = Math.max(0, fromSec * bucketsPerSecond);
  const toBucket = Math.min(mip.buckets, toSec * bucketsPerSecond);
  const span = Math.max(1e-9, toBucket - fromBucket);

  for (let x = 0; x < cols; x++) {
    const a = fromBucket + (span * x) / cols;
    const b = fromBucket + (span * (x + 1)) / cols;
    const startBucket = Math.floor(a);
    const endBucket = Math.max(startBucket + 1, Math.ceil(b));

    let lo = 0;
    let hi = 0;
    let peakRms = 0;
    for (let i = startBucket; i < endBucket && i < mip.buckets; i++) {
      if (mip.min[i] < lo) lo = mip.min[i];
      if (mip.max[i] > hi) hi = mip.max[i];
      if (mip.rms[i] > peakRms) peakRms = mip.rms[i];
    }
    min[x] = lo;
    max[x] = hi;
    rms[x] = peakRms;
  }

  return { min, max, rms };
}

// ---------------------------------------------------------------------------
// Measurement
// ---------------------------------------------------------------------------

const toDb = (amplitude: number) => (amplitude <= 0 ? -Infinity : 20 * Math.log10(amplitude));
export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Peak and RMS of a range of the source, in dBFS. */
export function measure(buffer: AudioBuffer, fromSec: number, toSec: number): LevelStats {
  const start = Math.max(0, Math.floor(fromSec * buffer.sampleRate));
  const end = Math.min(buffer.length, Math.ceil(toSec * buffer.sampleRate));
  let peak = 0;
  let sum = 0;
  let count = 0;
  let clipping = false;

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = start; i < end; i++) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
      if (v >= 0.999) clipping = true;
      sum += data[i] * data[i];
      count++;
    }
  }

  return {
    peakDb: toDb(peak),
    rmsDb: count ? toDb(Math.sqrt(sum / count)) : -Infinity,
    clipping,
  };
}

/** Mean sample value of a range — the DC offset some USB mics introduce. */
export function measureDcOffset(buffer: AudioBuffer, fromSec: number, toSec: number): number {
  const start = Math.max(0, Math.floor(fromSec * buffer.sampleRate));
  const end = Math.min(buffer.length, Math.ceil(toSec * buffer.sampleRate));
  let sum = 0;
  let count = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = start; i < end; i++) {
      sum += data[i];
      count++;
    }
  }
  return count ? sum / count : 0;
}

/**
 * Finds the first and last moment louder than `thresholdDb`, so the selection
 * can snap past the "click record, then walk to the mic" silence at both ends.
 * Reads the mip, not the samples, so it is instant even on long files.
 */
export function findSpeechBounds(
  mip: PeakMip,
  thresholdDb: number,
  paddingSec: number
): { inSec: number; outSec: number } | null {
  const threshold = dbToGain(thresholdDb);
  let first = -1;
  let last = -1;

  for (let b = 0; b < mip.buckets; b++) {
    const level = Math.max(Math.abs(mip.min[b]), mip.max[b]);
    if (level >= threshold) {
      if (first < 0) first = b;
      last = b;
    }
  }

  if (first < 0) return null;

  const secondsPerBucket = mip.samplesPerBucket / mip.sampleRate;
  const inSec = Math.max(0, first * secondsPerBucket - paddingSec);
  const outSec = Math.min(mip.duration, (last + 1) * secondsPerBucket + paddingSec);
  return outSec - inSec < 0.05 ? null : { inSec, outSec };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function channelsFor(mode: ChannelMode, source: number): number {
  if (mode === 'mono') return 1;
  if (mode === 'stereo') return 2;
  return source;
}

/** Length in seconds the render will produce for a given edit. */
export function renderedDuration(edit: EditState): number {
  return Math.max(0, (edit.outSec - edit.inSec) / edit.speed);
}

/**
 * Applies the edit to the source and hands back a fresh AudioBuffer.
 *
 * The chain is source → (DC removal) → gain (trim + normaliser + fades) →
 * destination, all inside an OfflineAudioContext, which renders faster than
 * real time and lets us pick both the channel count and the output sample
 * rate. Down/up-mixing is left to the graph's own speaker mixing rules rather
 * than hand-rolled arithmetic.
 */
export async function renderEdit(
  source: AudioBuffer,
  edit: EditState,
  onProgress?: (ratio: number) => void
): Promise<AudioBuffer> {
  const rate = edit.sampleRate || source.sampleRate;
  const outChannels = channelsFor(edit.channelMode, source.numberOfChannels);
  const seconds = renderedDuration(edit);
  const length = Math.max(1, Math.round(seconds * rate));

  const ctx = new OfflineAudioContext(outChannels, length, rate);

  let input: AudioBuffer = source;
  if (edit.removeDc) {
    const offset = measureDcOffset(source, edit.inSec, edit.outSec);
    if (Math.abs(offset) > 0.0005) {
      input = subtractOffset(source, offset);
    }
  }

  const node = ctx.createBufferSource();
  node.buffer = input;
  node.playbackRate.value = edit.speed;

  const gain = ctx.createGain();

  // Normaliser first, so the manual trim stays a predictable "+3 dB on top of
  // whatever I chose" instead of fighting the automatic level.
  let linear = dbToGain(edit.gainDb);
  if (edit.normalize) {
    const stats = measure(input, edit.inSec, edit.outSec);
    if (Number.isFinite(stats.peakDb)) {
      linear *= dbToGain(edit.normalizeTargetDb - stats.peakDb);
    }
  }

  const fadeIn = Math.max(0, Math.min(edit.fadeInSec, seconds / 2));
  const fadeOut = Math.max(0, Math.min(edit.fadeOutSec, seconds / 2));

  gain.gain.setValueAtTime(fadeIn > 0 ? 0.0001 : linear, 0);
  if (fadeIn > 0) gain.gain.exponentialRampToValueAtTime(linear, fadeIn);
  if (fadeOut > 0) {
    gain.gain.setValueAtTime(linear, Math.max(fadeIn, seconds - fadeOut));
    gain.gain.exponentialRampToValueAtTime(0.0001, seconds);
  }

  node.connect(gain);
  gain.connect(ctx.destination);
  node.start(0, edit.inSec, edit.outSec - edit.inSec);

  onProgress?.(0.1);
  const rendered = await ctx.startRendering();
  onProgress?.(1);
  return rendered;
}

/** Copy of the buffer with a constant offset removed from every channel. */
function subtractOffset(buffer: AudioBuffer, offset: number): AudioBuffer {
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const copy = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = copy.getChannelData(c);
    for (let i = 0; i < src.length; i++) dst[i] = src[i] - offset;
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Encoding
// ---------------------------------------------------------------------------

function writeAscii(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

/**
 * RIFF/WAVE writer for 16, 24 and 32-bit output.
 *
 * 16-bit gets TPDF dither: rounding a float render straight to 16 bits leaves
 * correlated quantisation error that is audible as crunch on fades and quiet
 * tails, and one LSB of triangular noise trades it for an inaudible hiss.
 * 24-bit and 32-bit float have headroom to spare, so they are written clean.
 */
export function encodeWav(buffer: AudioBuffer, bitDepth: 16 | 24 | 32): Blob {
  const channels = buffer.numberOfChannels;
  const frames = buffer.length;
  const isFloat = bitDepth === 32;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const dataSize = frames * blockAlign;

  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, isFloat ? 3 : 1, true); // 3 = IEEE float, 1 = PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const data: Float32Array[] = [];
  for (let c = 0; c < channels; c++) data.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      let sample = data[c][i];

      if (isFloat) {
        view.setFloat32(offset, sample, true);
        offset += 4;
        continue;
      }

      if (bitDepth === 16) {
        // TPDF dither: two independent uniform draws, ±1 LSB peak.
        sample += (Math.random() + Math.random() - 1) / 32768;
      }

      if (sample > 1) sample = 1;
      else if (sample < -1) sample = -1;

      if (bitDepth === 16) {
        view.setInt16(offset, Math.round(sample < 0 ? sample * 0x8000 : sample * 0x7fff), true);
        offset += 2;
      } else {
        const value = Math.round(sample < 0 ? sample * 0x800000 : sample * 0x7fffff);
        view.setUint8(offset, value & 0xff);
        view.setUint8(offset + 1, (value >> 8) & 0xff);
        view.setUint8(offset + 2, (value >> 16) & 0xff);
        offset += 3;
      }
    }
  }

  return new Blob([out], { type: 'audio/wav' });
}

/** Picks the best compressed container MediaRecorder will actually accept. */
export function pickCompressedType(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates: { mime: string; ext: string }[] = [
    { mime: 'audio/webm;codecs=opus', ext: 'webm' },
    { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
    { mime: 'audio/webm', ext: 'webm' },
    { mime: 'audio/mp4', ext: 'm4a' },
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate.mime)) return candidate;
  }
  return null;
}

/**
 * Re-encodes a rendered buffer to Opus/AAC by playing it into a
 * MediaStreamDestination and recording that.
 *
 * There is no offline encoder in the platform, so this runs at 1× wall-clock —
 * the caller is expected to say so and show progress. It is the only way to
 * produce a small file without shipping a WASM encoder, which would mean a
 * multi-megabyte download and, in practice, a CDN.
 */
export function encodeCompressed(
  buffer: AudioBuffer,
  bitsPerSecond: number,
  onProgress?: (ratio: number) => void
): Promise<{ blob: Blob; mime: string; ext: string }> {
  return new Promise((resolve, reject) => {
    const type = pickCompressedType();
    if (!type) {
      reject(new Error('no-encoder'));
      return;
    }

    const ctx = new AudioCtx({ sampleRate: buffer.sampleRate });
    const destination = ctx.createMediaStreamDestination();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(destination);

    const chunks: Blob[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(destination.stream, {
        mimeType: type.mime,
        audioBitsPerSecond: bitsPerSecond,
      });
    } catch (err) {
      ctx.close().catch(() => {});
      reject(err);
      return;
    }

    let progressTimer: ReturnType<typeof setInterval> | undefined;
    const cleanUp = () => {
      clearInterval(progressTimer);
      destination.stream.getTracks().forEach(track => track.stop());
      ctx.close().catch(() => {});
    };

    recorder.ondataavailable = event => {
      if (event.data && event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      cleanUp();
      reject(new Error('encoder-failed'));
    };
    recorder.onstop = () => {
      cleanUp();
      resolve({ blob: new Blob(chunks, { type: type.mime }), mime: type.mime, ext: type.ext });
    };

    const startedAt = ctx.currentTime;
    source.onended = () => {
      // A beat of slack so the encoder flushes its last packet.
      setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), 120);
    };

    recorder.start(250);
    source.start();

    progressTimer = setInterval(() => {
      onProgress?.(Math.min(0.99, (ctx.currentTime - startedAt) / buffer.duration));
    }, 200);
  });
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatClock(seconds: number, withTenths = true): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const base = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return withTenths ? `${base}.${Math.floor((seconds % 1) * 10)}` : base;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDb(db: number): string {
  if (!Number.isFinite(db)) return '−∞ dB';
  return `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
}

/** Byte size a WAV export will have, without rendering it. */
export function estimateWavBytes(edit: EditState, sourceChannels: number, sourceRate: number, bitDepth: number): number {
  const rate = edit.sampleRate || sourceRate;
  const channels = channelsFor(edit.channelMode, sourceChannels);
  return 44 + Math.round(renderedDuration(edit) * rate) * channels * (bitDepth / 8);
}
