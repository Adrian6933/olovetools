// ============================================================================
// Audio plumbing: decoding, stitching, waveform peaks and WAV export.
//
// Every block is decoded once, right after it is rendered. That single decode
// pays for three things at the same time — the waveform, gapless playback with
// real seeking, and the exact per-block duration that rebases caption offsets
// onto the full timeline. Guessing durations from the MP3 bitrate would drift.
// ============================================================================

/** The engine emits 24 kHz mono; decoding at that rate halves the RAM cost. */
const DECODE_SAMPLE_RATE = 24000;

let decodeCtx: OfflineAudioContext | null = null;

function getDecodeContext(): OfflineAudioContext {
  if (!decodeCtx) decodeCtx = new OfflineAudioContext(1, 1, DECODE_SAMPLE_RATE);
  return decodeCtx;
}

/**
 * Decodes MP3 bytes to samples. `decodeAudioData` detaches the ArrayBuffer it
 * is handed, which would leave the caller holding an empty view of the MP3 it
 * still needs for the download, so it always gets a copy.
 */
export function decodeAudio(mp3: Uint8Array): Promise<AudioBuffer> {
  const copy = mp3.slice().buffer as ArrayBuffer;
  const ctx = getDecodeContext();
  return new Promise((resolve, reject) => {
    // Safari only ever implemented the callback form.
    const maybePromise = ctx.decodeAudioData(copy, resolve, reject);
    if (maybePromise && typeof maybePromise.then === 'function') maybePromise.then(resolve, reject);
  });
}

/** Stitches decoded blocks into one buffer, in script order. */
export function concatBuffers(buffers: AudioBuffer[]): AudioBuffer {
  const ctx = getDecodeContext();
  const length = buffers.reduce((sum, b) => sum + b.length, 0);
  const out = ctx.createBuffer(1, Math.max(1, length), DECODE_SAMPLE_RATE);
  const channel = out.getChannelData(0);
  let offset = 0;
  for (const buffer of buffers) {
    channel.set(buffer.getChannelData(0), offset);
    offset += buffer.length;
  }
  return out;
}

/**
 * Downsamples to one absolute peak per column. Computed once per render, not
 * per paint — repainting the waveform on every seek would otherwise walk
 * millions of samples 60 times a second.
 */
export function computePeaks(buffer: AudioBuffer, columns = 900): Float32Array {
  const data = buffer.getChannelData(0);
  const peaks = new Float32Array(columns);
  const perColumn = data.length / columns;
  for (let c = 0; c < columns; c++) {
    const start = Math.floor(c * perColumn);
    const end = Math.min(data.length, Math.floor((c + 1) * perColumn));
    let peak = 0;
    for (let i = start; i < end; i++) {
      const value = data[i] < 0 ? -data[i] : data[i];
      if (value > peak) peak = value;
    }
    peaks[c] = peak;
  }
  return peaks;
}

/** Concatenated MP3 streams: no re-encode, so the download is the exact render. */
export function concatMp3(parts: Uint8Array[]): Blob {
  return new Blob(parts as BlobPart[], { type: 'audio/mpeg' });
}

/**
 * 16-bit PCM WAV of the stitched timeline. Offered next to the MP3 because
 * video and audio editors import WAV without a decode step, and it is the same
 * audio — not a second, differently-rendered take.
 */
export function encodeWav(buffer: AudioBuffer): Blob {
  const samples = buffer.getChannelData(0);
  const bytes = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bytes);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format: PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([bytes], { type: 'audio/wav' });
}

/** mm:ss for the transport readout. */
export function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
