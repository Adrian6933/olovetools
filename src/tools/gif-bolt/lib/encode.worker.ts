/// <reference lib="webworker" />
// ============================================================================
// One slice of the GIF encode, off the main thread.
//
// The pool splits the animation into contiguous chunks and hands each worker
// its own frames. A chunk works in two phases so the palette can be global:
//
//   'load'   → keep the frames, return this chunk's colour histogram
//   'encode' → map, dither, diff and LZW every frame against the merged palette
//
// The frames stay in the worker between the two phases; sending 40 MB of RGBA
// twice would cost more than the encode itself.
// ============================================================================

import { LZWEncoder, addFrameToHistogram, createHistogram, encodeChunk, type Palette } from './gif';

interface LoadMessage {
  cmd: 'load';
  frames: ArrayBuffer[];
  /**
   * Source RGBA of the frame right before this chunk, used to seed the diff.
   * Null on the first chunk. It is the *source* frame rather than what the
   * previous chunk left on screen, which is what keeps the chunks independent:
   * the two differ by at most `tolerance` per channel.
   */
  lead: ArrayBuffer | null;
  width: number;
  height: number;
  alphaThreshold: number;
  sampleStride: number;
}

interface EncodeMessage {
  cmd: 'encode';
  palette: { rgb: Uint8Array; count: number };
  transparentIndex: number;
  diff: boolean;
  dither: boolean;
  ditherStrength: number;
  tolerance: number;
  alphaThreshold: number;
}

type Incoming = LoadMessage | EncodeMessage;

const scope = self as unknown as DedicatedWorkerGlobalScope;

let frames: Uint8Array[] = [];
let lead: Uint8Array | null = null;
let width = 0;
let height = 0;

// Reused across frames so the LZW dictionary is allocated exactly once.
const lzw = new LZWEncoder();

scope.onmessage = (event: MessageEvent<Incoming>) => {
  const message = event.data;

  if (message.cmd === 'load') {
    frames = message.frames.map(buffer => new Uint8Array(buffer));
    lead = message.lead ? new Uint8Array(message.lead) : null;
    width = message.width;
    height = message.height;

    const histogram = createHistogram();
    for (const frame of frames) {
      addFrameToHistogram(histogram, frame, message.sampleStride, message.alphaThreshold);
    }

    scope.postMessage(
      { type: 'histogram', counts: histogram.counts, sums: histogram.sums, transparent: histogram.transparent },
      [histogram.counts.buffer, histogram.sums.buffer]
    );
    return;
  }

  const palette: Palette = { rgb: new Uint8Array(message.palette.rgb), count: message.palette.count };

  const results = encodeChunk(
    frames,
    lead,
    palette,
    {
      width,
      height,
      diff: message.diff,
      dither: message.dither,
      ditherStrength: message.ditherStrength,
      tolerance: message.tolerance,
      alphaThreshold: message.alphaThreshold,
      transparentIndex: message.transparentIndex,
    },
    () => scope.postMessage({ type: 'progress' }),
    lzw
  );

  scope.postMessage(
    { type: 'encoded', frames: results },
    results.map(frame => frame.data.buffer)
  );

  // The frames are only good for one encode; drop them so a worker that stays
  // warm between runs is not sitting on tens of megabytes of RGBA.
  frames = [];
  lead = null;
};

export {};
