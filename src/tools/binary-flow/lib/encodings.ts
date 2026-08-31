import type { Encoding } from '../types';

// ============================================================================
// Text <-> bytes
// ----------------------------------------------------------------------------
// The old version only did UTF-8 and printed every non-printable byte as a
// middle dot, so a round trip quietly lost data. Here the bytes are the result
// and the readable rendering is clearly labelled as a rendering.
// ============================================================================

export function encodeText(text: string, encoding: Encoding): Uint8Array {
  if (encoding === 'utf-8') return new TextEncoder().encode(text);

  if (encoding === 'latin-1') {
    // Latin-1 is a byte-per-code-point map that only covers U+0000..U+00FF;
    // anything above becomes '?', the same substitution every legacy encoder
    // makes, rather than silently truncating the high bits.
    const out = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      out[i] = code <= 0xff ? code : 0x3f;
    }
    return out;
  }

  // UTF-16: two bytes per code unit, so surrogate pairs stay as two units.
  const little = encoding === 'utf-16le';
  const out = new Uint8Array(text.length * 2);
  const view = new DataView(out.buffer);
  for (let i = 0; i < text.length; i++) view.setUint16(i * 2, text.charCodeAt(i), little);
  return out;
}

export function decodeBytes(bytes: Uint8Array, encoding: Encoding): string {
  try {
    if (encoding === 'latin-1') return new TextDecoder('latin1').decode(bytes);
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    // A browser without that decoder, or bytes it refuses; the byte view still
    // works, only the text rendering is unavailable.
    return '';
  }
}

/** Printable rendering for a byte dump. Control bytes become a dot, and the
 *  UI says so instead of pretending the dot is the data. */
export function printable(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += b >= 32 && b <= 126 ? String.fromCharCode(b) : '.';
  return out;
}

const pad = (n: number, base: number, size: number) => n.toString(base).padStart(size, '0');

export const bytesToBinary = (b: Uint8Array) => Array.from(b, x => pad(x, 2, 8)).join(' ');
export const bytesToOctal = (b: Uint8Array) => Array.from(b, x => pad(x, 8, 3)).join(' ');
export const bytesToDecimal = (b: Uint8Array) => Array.from(b, x => String(x)).join(' ');
export const bytesToHex = (b: Uint8Array) => Array.from(b, x => pad(x, 16, 2)).join(' ').toUpperCase();

export interface DumpRow {
  offset: string;
  hex: string;
  text: string;
}

/** Classic 16-byte-per-row hex dump. */
export function hexDump(bytes: Uint8Array, perRow = 16): DumpRow[] {
  const rows: DumpRow[] = [];
  for (let i = 0; i < bytes.length; i += perRow) {
    const slice = bytes.subarray(i, i + perRow);
    rows.push({
      offset: i.toString(16).padStart(8, '0').toUpperCase(),
      hex: Array.from(slice, x => pad(x, 16, 2)).join(' ').toUpperCase().padEnd(perRow * 3 - 1, ' '),
      text: printable(slice),
    });
  }
  return rows;
}

/** Bytes of a value at a given width, in the requested byte order. */
export function valueToBytes(raw: bigint, widthBits: number, little: boolean): Uint8Array {
  const count = Math.max(1, Math.ceil(widthBits / 8));
  const out = new Uint8Array(count);
  let v = raw < 0n ? -raw : raw;
  for (let i = count - 1; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return little ? out.reverse() : out;
}

export const ENCODING_LABEL: Record<Encoding, string> = {
  'utf-8': 'UTF-8',
  'utf-16le': 'UTF-16 LE',
  'utf-16be': 'UTF-16 BE',
  'latin-1': 'Latin-1',
};
