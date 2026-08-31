// ============================================================================
// ICO writer
// ----------------------------------------------------------------------------
// The previous version stuffed PNG streams into every directory entry. That is
// legal *since Windows Vista* and only for the 256px frame in practice —
// Explorer on XP, a lot of RSS readers, and several icon parsers reject a
// PNG-compressed 16x16. So: frames up to 64px go in as 32bpp BMP/DIB with a
// real 1bpp AND mask, and only the 256px frame stays PNG (where a raw DIB
// would add 256 KB for nothing).
// ============================================================================

export interface IcoFrame {
  size: number;
  /** Straight-alpha RGBA, as produced by getImageData. */
  pixels: ImageData;
  /** Pre-encoded PNG, used for the 256px frame. */
  png?: Uint8Array;
}

/**
 * BITMAPINFOHEADER + bottom-up BGRA + 1bpp AND mask.
 * biHeight is doubled on purpose: the format stores XOR and AND stacked.
 */
function encodeDib(image: ImageData): Uint8Array {
  const w = image.width;
  const h = image.height;
  const src = image.data;

  const xorRow = w * 4; // 32bpp rows are always 4-byte aligned
  const xorSize = xorRow * h;
  const andRow = ((w + 31) >> 5) * 4;
  const andSize = andRow * h;

  const out = new Uint8Array(40 + xorSize + andSize);
  const view = new DataView(out.buffer);

  view.setUint32(0, 40, true); // biSize
  view.setInt32(4, w, true); // biWidth
  view.setInt32(8, h * 2, true); // biHeight (XOR + AND)
  view.setUint16(12, 1, true); // biPlanes
  view.setUint16(14, 32, true); // biBitCount
  view.setUint32(16, 0, true); // biCompression = BI_RGB
  view.setUint32(20, xorSize + andSize, true); // biSizeImage
  // biXPelsPerMeter / biYPelsPerMeter / biClrUsed / biClrImportant stay 0

  let p = 40;
  for (let y = h - 1; y >= 0; y--) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      out[p++] = src[i + 2]; // B
      out[p++] = src[i + 1]; // G
      out[p++] = src[i]; // R
      out[p++] = src[i + 3]; // A
    }
  }

  // AND mask: 1 = transparent. 32bpp readers use the alpha channel, but the
  // ones that do not (and Explorer's own small-icon path) fall back to this.
  const andStart = 40 + xorSize;
  for (let y = h - 1, row = 0; y >= 0; y--, row++) {
    const base = andStart + row * andRow;
    for (let x = 0; x < w; x++) {
      if (src[(y * w + x) * 4 + 3] < 128) {
        out[base + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }

  return out;
}

export function buildIco(frames: IcoFrame[]): Blob {
  const payloads = frames.map(f => (f.png ? f.png : encodeDib(f.pixels)));

  const headerSize = 6;
  const dirSize = 16;
  const dirTotal = headerSize + dirSize * frames.length;
  const total = payloads.reduce((n, p) => n + p.byteLength, dirTotal);

  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);

  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type 1 = icon
  view.setUint16(4, frames.length, true);

  let offset = dirTotal;
  frames.forEach((frame, i) => {
    const payload = payloads[i];
    const d = headerSize + i * dirSize;
    // 256 is stored as 0 — the field is a single byte.
    out[d] = frame.size >= 256 ? 0 : frame.size;
    out[d + 1] = frame.size >= 256 ? 0 : frame.size;
    out[d + 2] = 0; // palette entries
    out[d + 3] = 0; // reserved
    view.setUint16(d + 4, 1, true); // colour planes
    view.setUint16(d + 6, 32, true); // bits per pixel
    view.setUint32(d + 8, payload.byteLength, true);
    view.setUint32(d + 12, offset, true);
    out.set(payload, offset);
    offset += payload.byteLength;
  });

  return new Blob([out], { type: 'image/x-icon' });
}
