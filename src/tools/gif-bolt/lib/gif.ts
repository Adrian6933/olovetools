// ============================================================================
// GIF89a encoder
// ----------------------------------------------------------------------------
// Written for this tool instead of leaning on gifshot, because the interesting
// part of making a small, good-looking GIF is everything gifshot does not do:
//
//   · one global palette built by median cut over the WHOLE animation, so the
//     colours do not swim from frame to frame;
//   · Floyd–Steinberg dithering (serpentine) to kill the banding a flat 256
//     colour map leaves on gradients;
//   · inter-frame differencing — pixels a frame shares with the one before it
//     are written as transparent and inherited, which is where the real size
//     reduction comes from on screen recordings;
//   · 1-bit transparency carried over from the source alpha channel.
//
// Everything here is pure and self-contained (no DOM), so the worker and the
// main thread can share it.
// ============================================================================

// ---------------------------------------------------------------------------
// Histogram
// ---------------------------------------------------------------------------

/** Bits per channel used to bucket colours while counting them. 5 → 32768 cells. */
const HIST_BITS = 5;
export const HIST_SIZE = 1 << (HIST_BITS * 3);

/** Bits per channel of the nearest-colour cache. Deliberately finer than the
 *  histogram: dithering asks for colours that fall between histogram cells, and
 *  a 5-bit cache visibly flattens the result. */
const LOOK_BITS = 6;
const LOOK_SIZE = 1 << (LOOK_BITS * 3);

export interface Histogram {
  /** Pixels that landed in each 15-bit cell. */
  counts: Uint32Array;
  /** Summed R, G and B of those pixels, so a box averages to its true colour. */
  sums: Float64Array;
  /** Pixels rejected for being below the alpha threshold. */
  transparent: number;
}

export function createHistogram(): Histogram {
  return { counts: new Uint32Array(HIST_SIZE), sums: new Float64Array(HIST_SIZE * 3), transparent: 0 };
}

/**
 * Counts one frame into a histogram. `stride` skips pixels — a palette does not
 * get better from looking at every single pixel of a 60-frame animation, and
 * the sampling is what keeps this instant.
 */
export function addFrameToHistogram(
  hist: Histogram,
  rgba: Uint8Array | Uint8ClampedArray,
  stride: number,
  alphaThreshold: number
): void {
  const { counts, sums } = hist;
  const step = 4 * Math.max(1, stride | 0);
  for (let i = 0; i < rgba.length; i += step) {
    if (rgba[i + 3] < alphaThreshold) {
      hist.transparent++;
      continue;
    }
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
    counts[key]++;
    const at = key * 3;
    sums[at] += r;
    sums[at + 1] += g;
    sums[at + 2] += b;
  }
}

export function mergeHistograms(target: Histogram, other: Histogram): void {
  for (let i = 0; i < HIST_SIZE; i++) target.counts[i] += other.counts[i];
  for (let i = 0; i < HIST_SIZE * 3; i++) target.sums[i] += other.sums[i];
  target.transparent += other.transparent;
}

// ---------------------------------------------------------------------------
// Median cut
// ---------------------------------------------------------------------------

export interface Palette {
  /** Flat RGB triplets: `count * 3` bytes. */
  rgb: Uint8Array;
  count: number;
}

interface Box {
  start: number;
  end: number;
  count: number;
  /** Extent of the box on each axis, in histogram cells. */
  spread: number;
  axis: 0 | 1 | 2;
}

const cellChannel = (key: number, axis: number) => (axis === 0 ? (key >> 10) & 31 : axis === 1 ? (key >> 5) & 31 : key & 31);

function measureBox(cells: Int32Array, counts: Uint32Array, start: number, end: number): Box {
  const min = [31, 31, 31];
  const max = [0, 0, 0];
  let count = 0;
  for (let i = start; i < end; i++) {
    const key = cells[i];
    count += counts[key];
    for (let axis = 0; axis < 3; axis++) {
      const v = cellChannel(key, axis);
      if (v < min[axis]) min[axis] = v;
      if (v > max[axis]) max[axis] = v;
    }
  }
  // Green is weighted up and blue down: the eye resolves them in that order, so
  // splitting on raw extents wastes palette entries on blue detail nobody sees.
  const weights = [1.0, 1.3, 0.7];
  let axis: 0 | 1 | 2 = 0;
  let spread = -1;
  for (let a = 0; a < 3; a++) {
    const s = (max[a] - min[a]) * weights[a];
    if (s > spread) {
      spread = s;
      axis = a as 0 | 1 | 2;
    }
  }
  return { start, end, count, spread, axis };
}

/**
 * Classic median cut: repeatedly split the box that would gain the most from
 * being split (population × colour spread) at its weighted median.
 */
export function buildPalette(hist: Histogram, maxColors: number): Palette {
  const { counts, sums } = hist;

  const used: number[] = [];
  for (let key = 0; key < HIST_SIZE; key++) if (counts[key]) used.push(key);

  const limit = Math.max(2, Math.min(256, maxColors | 0));
  const cells = Int32Array.from(used);

  const emit = (boxes: { start: number; end: number }[]): Palette => {
    const rgb = new Uint8Array(boxes.length * 3);
    boxes.forEach((box, i) => {
      let total = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let k = box.start; k < box.end; k++) {
        const key = cells[k];
        total += counts[key];
        r += sums[key * 3];
        g += sums[key * 3 + 1];
        b += sums[key * 3 + 2];
      }
      if (!total) total = 1;
      rgb[i * 3] = Math.round(r / total);
      rgb[i * 3 + 1] = Math.round(g / total);
      rgb[i * 3 + 2] = Math.round(b / total);
    });
    return { rgb, count: boxes.length };
  };

  if (!cells.length) return { rgb: new Uint8Array([0, 0, 0]), count: 1 };
  if (cells.length <= limit) return emit(Array.from(cells, (_, i) => ({ start: i, end: i + 1 })));

  const boxes: Box[] = [measureBox(cells, counts, 0, cells.length)];

  while (boxes.length < limit) {
    // Pick the box worth splitting. A box of one cell cannot be split at all.
    let pick = -1;
    let best = -1;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.end - box.start < 2 || box.spread <= 0) continue;
      const score = box.count * (box.spread + 1);
      if (score > best) {
        best = score;
        pick = i;
      }
    }
    if (pick < 0) break;

    const box = boxes[pick];
    const axis = box.axis;

    // Sort this box's cells along the split axis.
    const slice = Array.from(cells.subarray(box.start, box.end));
    slice.sort((a, b) => cellChannel(a, axis) - cellChannel(b, axis));
    cells.set(slice, box.start);

    // Walk to the population median, always leaving a cell on each side.
    const half = box.count / 2;
    let running = 0;
    let split = box.start + 1;
    for (let i = box.start; i < box.end - 1; i++) {
      running += counts[cells[i]];
      split = i + 1;
      if (running >= half) break;
    }

    boxes[pick] = measureBox(cells, counts, box.start, split);
    boxes.push(measureBox(cells, counts, split, box.end));
  }

  return emit(boxes);
}

// ---------------------------------------------------------------------------
// Nearest-colour lookup
// ---------------------------------------------------------------------------

/**
 * Nearest palette entry for an arbitrary RGB, memoised on a 18-bit grid. Filled
 * lazily: a photo touches a small slice of the cube, and pre-computing all
 * 262144 cells against 256 colours costs more than every lookup the encode
 * actually performs.
 */
export function createLookup(palette: Palette) {
  const cache = new Int32Array(LOOK_SIZE).fill(-1);
  const { rgb, count } = palette;

  return function nearest(r: number, g: number, b: number): number {
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    const hit = cache[key];
    if (hit >= 0) return hit;

    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < count; i++) {
      const dr = r - rgb[i * 3];
      const dg = g - rgb[i * 3 + 1];
      const db = b - rgb[i * 3 + 2];
      // Same perceptual weighting as the box split, so the dithering and the
      // palette agree on what "close" means.
      const distance = dr * dr * 3 + dg * dg * 4 + db * db * 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
        if (!distance) break;
      }
    }
    cache[key] = bestIndex;
    return bestIndex;
  };
}

// ---------------------------------------------------------------------------
// Frame → palette indices
// ---------------------------------------------------------------------------

export interface QuantizeOptions {
  width: number;
  height: number;
  dither: boolean;
  /** 0–1. How much of the quantisation error is diffused onward. */
  ditherStrength: number;
  /** Pixels below this alpha become the transparent index. 0 disables it. */
  alphaThreshold: number;
  /** Max per-channel difference for a pixel to count as "unchanged". */
  tolerance: number;
  /** Palette index reserved for transparency, or -1 when there is none. */
  transparentIndex: number;
}

export interface QuantizedFrame {
  indices: Uint8Array;
  /** Bounding box of the pixels that actually had to be written. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** True when at least one pixel uses the transparent index. */
  usesTransparency: boolean;
  /** Pixels inherited from the previous frame instead of being re-encoded. */
  reused: number;
}

/**
 * Maps one frame onto the palette, optionally dithering, optionally inheriting
 * unchanged pixels from what the viewer is already showing.
 *
 * `reference` is that "already showing" buffer, and it is UPDATED IN PLACE for
 * every pixel this frame actually writes. Comparing against the previous source
 * frame instead would let a pixel creeping by less than `tolerance` per frame
 * drift arbitrarily far from the original without ever being redrawn.
 *
 * The returned `indices` is already cropped to the bounding box — GIF lets a
 * frame cover a sub-rectangle of the canvas, and on a screen recording that
 * alone is most of the file size.
 */
export function quantizeFrame(
  rgba: Uint8Array | Uint8ClampedArray,
  reference: Uint8Array | null,
  palette: Palette,
  nearest: (r: number, g: number, b: number) => number,
  options: QuantizeOptions
): QuantizedFrame {
  const { width, height, dither, alphaThreshold, tolerance, transparentIndex } = options;
  const full = new Uint8Array(width * height);
  const transparent = transparentIndex >= 0 ? transparentIndex : 0;

  // Error rows for Floyd–Steinberg. Two rows of RGB is all the algorithm needs.
  const strength = dither ? Math.max(0, Math.min(1, options.ditherStrength)) : 0;
  const rowSize = (width + 2) * 3;
  let errorCurrent = strength ? new Float32Array(rowSize) : null;
  let errorNext = strength ? new Float32Array(rowSize) : null;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let usesTransparency = false;
  let reused = 0;

  for (let y = 0; y < height; y++) {
    // Serpentine: alternating direction stops the error from smearing into a
    // diagonal grain that reads as a texture of its own.
    const leftToRight = (y & 1) === 0;
    if (errorNext) errorNext.fill(0);

    for (let step = 0; step < width; step++) {
      const x = leftToRight ? step : width - 1 - step;
      const pixel = (y * width + x) * 4;
      const at = y * width + x;

      if (alphaThreshold > 0 && rgba[pixel + 3] < alphaThreshold) {
        full[at] = transparent;
        usesTransparency = true;
        if (reference) reference[pixel + 3] = 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        continue;
      }

      if (reference) {
        const wasVisible = alphaThreshold <= 0 || reference[pixel + 3] >= alphaThreshold;
        if (
          wasVisible &&
          Math.abs(rgba[pixel] - reference[pixel]) <= tolerance &&
          Math.abs(rgba[pixel + 1] - reference[pixel + 1]) <= tolerance &&
          Math.abs(rgba[pixel + 2] - reference[pixel + 2]) <= tolerance
        ) {
          full[at] = transparent;
          usesTransparency = true;
          reused++;
          continue;
        }
      }

      let r = rgba[pixel];
      let g = rgba[pixel + 1];
      let b = rgba[pixel + 2];

      if (errorCurrent) {
        const e = (x + 1) * 3;
        r = clamp255(r + errorCurrent[e]);
        g = clamp255(g + errorCurrent[e + 1]);
        b = clamp255(b + errorCurrent[e + 2]);
      }

      const index = nearest(r, g, b);
      full[at] = index;

      if (reference) {
        reference[pixel] = rgba[pixel];
        reference[pixel + 1] = rgba[pixel + 1];
        reference[pixel + 2] = rgba[pixel + 2];
        reference[pixel + 3] = rgba[pixel + 3];
      }

      if (errorCurrent && errorNext) {
        const dr = (r - palette.rgb[index * 3]) * strength;
        const dg = (g - palette.rgb[index * 3 + 1]) * strength;
        const db = (b - palette.rgb[index * 3 + 2]) * strength;
        const forward = leftToRight ? 1 : -1;
        const here = (x + 1) * 3;
        spread(errorCurrent, here + forward * 3, dr, dg, db, 7 / 16);
        spread(errorNext, here - forward * 3, dr, dg, db, 3 / 16);
        spread(errorNext, here, dr, dg, db, 5 / 16);
        spread(errorNext, here + forward * 3, dr, dg, db, 1 / 16);
      }

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    if (errorCurrent && errorNext) {
      const swap = errorCurrent;
      errorCurrent = errorNext;
      errorNext = swap;
    }
  }

  // A frame identical to the one before it still has to exist, or the timing
  // collapses — GIF has no "hold this frame longer" other than a real frame.
  if (maxX < 0) {
    return {
      indices: new Uint8Array([transparent]),
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      usesTransparency: transparentIndex >= 0,
      reused,
    };
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  if (w === width && h === height) {
    return { indices: full, x: 0, y: 0, w, h, usesTransparency, reused };
  }

  const cropped = new Uint8Array(w * h);
  for (let row = 0; row < h; row++) {
    cropped.set(full.subarray((minY + row) * width + minX, (minY + row) * width + minX + w), row * w);
  }
  return { indices: cropped, x: minX, y: minY, w, h, usesTransparency, reused };
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function spread(row: Float32Array, at: number, dr: number, dg: number, db: number, factor: number): void {
  if (at < 0 || at + 2 >= row.length) return;
  row[at] += dr * factor;
  row[at + 1] += dg * factor;
  row[at + 2] += db * factor;
}

// ---------------------------------------------------------------------------
// Byte writer
// ---------------------------------------------------------------------------

export class ByteWriter {
  private buffer: Uint8Array;
  private length = 0;

  constructor(initial = 1 << 16) {
    this.buffer = new Uint8Array(initial);
  }

  private ensure(extra: number): void {
    if (this.length + extra <= this.buffer.length) return;
    let size = this.buffer.length * 2;
    while (size < this.length + extra) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.buffer.subarray(0, this.length));
    this.buffer = next;
  }

  byte(value: number): void {
    this.ensure(1);
    this.buffer[this.length++] = value & 0xff;
  }

  /** Little-endian 16-bit, which is what every field in the GIF spec uses. */
  short(value: number): void {
    this.ensure(2);
    this.buffer[this.length++] = value & 0xff;
    this.buffer[this.length++] = (value >> 8) & 0xff;
  }

  bytes(values: ArrayLike<number>): void {
    this.ensure(values.length);
    this.buffer.set(values as any, this.length);
    this.length += values.length;
  }

  ascii(text: string): void {
    for (let i = 0; i < text.length; i++) this.byte(text.charCodeAt(i));
  }

  get size(): number {
    return this.length;
  }

  toUint8Array(): Uint8Array {
    return this.buffer.slice(0, this.length);
  }
}

// ---------------------------------------------------------------------------
// LZW
// ---------------------------------------------------------------------------

/**
 * GIF's variable-width LZW, written straight into sub-blocks.
 *
 * The dictionary is a flat Int32Array indexed by `prefix * 256 + suffix`. It is
 * allocated once per encoder and cleared by walking only the keys that were
 * actually claimed, so a clear code costs 4096 writes instead of a million.
 */
export class LZWEncoder {
  private dictionary = new Int32Array(4096 * 256).fill(-1);
  private claimed = new Int32Array(4096);

  encode(writer: ByteWriter, indices: Uint8Array, colorBits: number): void {
    const minCodeSize = Math.max(2, colorBits);
    writer.byte(minCodeSize);

    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;

    const block = new Uint8Array(255);
    let blockLength = 0;
    let bitBuffer = 0;
    let bitCount = 0;
    let codeSize = minCodeSize + 1;
    let nextCode = endCode + 1;
    let claimedCount = 0;

    const flushBlock = () => {
      if (!blockLength) return;
      writer.byte(blockLength);
      writer.bytes(block.subarray(0, blockLength));
      blockLength = 0;
    };

    const write = (code: number) => {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        block[blockLength++] = bitBuffer & 0xff;
        bitBuffer >>>= 8;
        bitCount -= 8;
        if (blockLength === 255) flushBlock();
      }
    };

    const resetDictionary = () => {
      for (let i = 0; i < claimedCount; i++) this.dictionary[this.claimed[i]] = -1;
      claimedCount = 0;
      codeSize = minCodeSize + 1;
      nextCode = endCode + 1;
    };

    write(clearCode);

    if (indices.length) {
      let prefix = indices[0];
      for (let i = 1; i < indices.length; i++) {
        const suffix = indices[i];
        const key = prefix * 256 + suffix;
        const existing = this.dictionary[key];
        if (existing >= 0) {
          prefix = existing;
          continue;
        }

        write(prefix);

        if (nextCode < 4096) {
          this.dictionary[key] = nextCode;
          this.claimed[claimedCount++] = key;
          if (nextCode === 1 << codeSize && codeSize < 12) codeSize++;
          nextCode++;
        } else {
          write(clearCode);
          resetDictionary();
        }
        prefix = suffix;
      }
      write(prefix);
    }

    write(endCode);

    // Flush the trailing partial byte.
    if (bitCount > 0) {
      block[blockLength++] = bitBuffer & 0xff;
      if (blockLength === 255) flushBlock();
    }
    flushBlock();
    writer.byte(0);

    resetDictionary();
  }
}

// ---------------------------------------------------------------------------
// Chunk encoding
// ---------------------------------------------------------------------------

export interface ChunkOptions {
  width: number;
  height: number;
  diff: boolean;
  dither: boolean;
  ditherStrength: number;
  tolerance: number;
  alphaThreshold: number;
  transparentIndex: number;
}

export interface ChunkFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  usesTransparency: boolean;
  reused: number;
  /** minCodeSize byte + LZW sub-blocks + terminator. */
  data: Uint8Array;
}

/**
 * Quantises and compresses a contiguous run of frames against a shared palette.
 * Lives here rather than in the worker so the main thread can run the exact
 * same code when workers are unavailable.
 *
 * `lead` is the source frame immediately before this run; it seeds the diff.
 */
export function encodeChunk(
  frames: Uint8Array[],
  lead: Uint8Array | null,
  palette: Palette,
  options: ChunkOptions,
  onFrame?: () => void,
  lzw: LZWEncoder = new LZWEncoder()
): ChunkFrame[] {
  const bits = paletteBits(palette.count + (options.transparentIndex >= 0 ? 1 : 0));
  const nearest = createLookup(palette);

  // Mutated as frames are written, so it has to be a copy the caller does not share.
  let reference: Uint8Array | null = options.diff && lead ? new Uint8Array(lead) : null;

  const results: ChunkFrame[] = [];

  for (const frame of frames) {
    const quantized = quantizeFrame(frame, reference, palette, nearest, {
      width: options.width,
      height: options.height,
      dither: options.dither,
      ditherStrength: options.ditherStrength,
      alphaThreshold: options.alphaThreshold,
      tolerance: options.tolerance,
      transparentIndex: options.transparentIndex,
    });

    const writer = new ByteWriter(Math.max(1 << 12, quantized.indices.length));
    lzw.encode(writer, quantized.indices, bits);

    results.push({
      x: quantized.x,
      y: quantized.y,
      w: quantized.w,
      h: quantized.h,
      usesTransparency: quantized.usesTransparency,
      reused: quantized.reused,
      data: writer.toUint8Array(),
    });

    // The first frame of the very first chunk seeds the reference itself.
    if (options.diff && !reference) reference = new Uint8Array(frame);

    onFrame?.();
  }

  return results;
}

// ---------------------------------------------------------------------------
// Container assembly
// ---------------------------------------------------------------------------

export interface EncodedFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Delay in hundredths of a second, which is the only unit GIF has. */
  delayCs: number;
  transparentIndex: number;
  /** 1 = leave the frame in place, 2 = clear it back to the background. */
  disposal: 1 | 2;
  /** minCodeSize byte + LZW sub-blocks + terminator, ready to be spliced in. */
  data: Uint8Array;
}

/** Palette entries always come in powers of two; this is the exponent. */
export function paletteBits(count: number): number {
  let bits = 1;
  while (1 << bits < count) bits++;
  return Math.max(1, Math.min(8, bits));
}

export function assembleGif(
  width: number,
  height: number,
  palette: Palette,
  frames: EncodedFrame[],
  /** 0 = forever, otherwise the number of extra passes. */
  loop: number,
  /** Index reserved for transparency, always one past the real colours, or -1. */
  transparentIndex: number
): Uint8Array {
  const bits = paletteBits(palette.count + (transparentIndex >= 0 ? 1 : 0));
  const tableSize = 1 << bits;
  const writer = new ByteWriter(1 << 18);

  writer.ascii('GIF89a');
  writer.short(width);
  writer.short(height);
  // Global colour table present, 8-bit colour resolution, table size exponent.
  writer.byte(0x80 | 0x70 | (bits - 1));
  writer.byte(0); // background colour index
  writer.byte(0); // pixel aspect ratio: none

  const table = new Uint8Array(tableSize * 3);
  table.set(palette.rgb.subarray(0, Math.min(palette.rgb.length, table.length)));
  writer.bytes(table);

  // The Netscape looping extension. Written even for a single pass so viewers
  // that default to infinite looping honour a finite count.
  writer.byte(0x21);
  writer.byte(0xff);
  writer.byte(11);
  writer.ascii('NETSCAPE2.0');
  writer.byte(3);
  writer.byte(1);
  writer.short(loop);
  writer.byte(0);

  for (const frame of frames) {
    const hasTransparency = frame.transparentIndex >= 0;

    writer.byte(0x21);
    writer.byte(0xf9);
    writer.byte(4);
    writer.byte((frame.disposal << 2) | (hasTransparency ? 1 : 0));
    writer.short(frame.delayCs);
    writer.byte(hasTransparency ? frame.transparentIndex : 0);
    writer.byte(0);

    writer.byte(0x2c);
    writer.short(frame.x);
    writer.short(frame.y);
    writer.short(frame.w);
    writer.short(frame.h);
    writer.byte(0); // no local colour table, not interlaced

    writer.bytes(frame.data);
  }

  writer.byte(0x3b);
  return writer.toUint8Array();
}

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------

/**
 * GIF stores delays in hundredths of a second, and browsers famously bump
 * anything under 2 cs up to 10. So the honest frame rate is never exactly the
 * one asked for, and the UI shows what came out of this rather than the input.
 */
export function msToDelayCs(ms: number): number {
  return Math.max(2, Math.round(ms / 10));
}

export function delayCsToMs(cs: number): number {
  return cs * 10;
}
