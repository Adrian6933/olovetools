// ============================================================================
// TIFF / EXIF: parser and serialiser
// ----------------------------------------------------------------------------
// The old tool only ever *deleted whole segments*, which is why "GPS only"
// actually wiped every camera tag: there is no way to remove one tag from a
// binary blob you never decoded.
//
// So we go one level lower and keep the intermediate representation: the TIFF
// block is parsed into a tree of IFDs holding raw entries, the caller drops
// whatever it wants, and the tree is written back out. That makes per-tag
// removal, real GPS-only cleaning and orientation preservation all the same
// operation, and it never touches the pixel stream.
// ============================================================================

/** Bytes per TIFF value type, indexed by the type id. 0 = unknown. */
const TYPE_SIZES = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];

/** Sub-IFD pointers. They are rebuilt on write, never carried as plain tags. */
export const TAG_EXIF_IFD = 0x8769;
export const TAG_GPS_IFD = 0x8825;
export const TAG_INTEROP_IFD = 0xa005;
export const TAG_ORIENTATION = 0x0112;
export const TAG_THUMB_OFFSET = 0x0201;
export const TAG_THUMB_LENGTH = 0x0202;
export const TAG_MAKER_NOTE = 0x927c;

export type IfdName = 'ifd0' | 'exif' | 'gps' | 'interop' | 'ifd1';

export interface RawEntry {
  tag: number;
  type: number;
  count: number;
  /** The value bytes, already resolved from the offset when they lived apart. */
  data: Uint8Array;
}

export interface TiffBlock {
  littleEndian: boolean;
  ifd0: RawEntry[];
  exif: RawEntry[];
  gps: RawEntry[];
  interop: RawEntry[];
  ifd1: RawEntry[];
  /** Embedded preview JPEG. Frequently a copy of the shot before editing. */
  thumbnail: Uint8Array | null;
}

export function emptyBlock(littleEndian = true): TiffBlock {
  return { littleEndian, ifd0: [], exif: [], gps: [], interop: [], ifd1: [], thumbnail: null };
}

export function countEntries(block: TiffBlock): number {
  return (
    block.ifd0.length + block.exif.length + block.gps.length + block.interop.length + block.ifd1.length
  );
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Guards against a malformed file turning the parse into an infinite walk. */
const MAX_ENTRIES_PER_IFD = 512;

function readIfd(
  view: DataView,
  base: number,
  offset: number,
  le: boolean,
  seen: Set<number>
): { entries: RawEntry[]; next: number } | null {
  const start = base + offset;
  if (offset <= 0 || start + 2 > view.byteLength || seen.has(offset)) return null;
  seen.add(offset);

  const count = view.getUint16(start, le);
  if (count === 0 || count > MAX_ENTRIES_PER_IFD) {
    // A zero-entry IFD is legal but useless; an absurd count means we are not
    // actually looking at an IFD.
    if (count > MAX_ENTRIES_PER_IFD) return null;
  }
  if (start + 2 + count * 12 + 4 > view.byteLength) return null;

  const entries: RawEntry[] = [];
  for (let i = 0; i < count; i++) {
    const p = start + 2 + i * 12;
    const tag = view.getUint16(p, le);
    const type = view.getUint16(p + 2, le);
    const n = view.getUint32(p + 4, le);
    const unit = TYPE_SIZES[type] ?? 0;
    if (!unit) continue; // unknown type: we cannot size it, so we cannot carry it
    const bytes = unit * n;
    if (bytes > view.byteLength) continue;

    let data: Uint8Array;
    if (bytes <= 4) {
      data = new Uint8Array(view.buffer, view.byteOffset + p + 8, bytes).slice();
    } else {
      const valueOffset = base + view.getUint32(p + 8, le);
      if (valueOffset < 0 || valueOffset + bytes > view.byteLength) continue;
      data = new Uint8Array(view.buffer, view.byteOffset + valueOffset, bytes).slice();
    }
    entries.push({ tag, type, count: n, data });
  }

  const next = view.getUint32(start + 2 + count * 12, le);
  return { entries, next };
}

/** Reads a LONG/SHORT entry as a plain number (used for the sub-IFD pointers). */
function entryToNumber(entry: RawEntry, le: boolean): number {
  const view = new DataView(entry.data.buffer, entry.data.byteOffset, entry.data.byteLength);
  if (entry.type === 3 && entry.data.byteLength >= 2) return view.getUint16(0, le);
  if (entry.data.byteLength >= 4) return view.getUint32(0, le);
  return 0;
}

/**
 * Parses a bare TIFF block (no "Exif\0\0" prefix — the caller strips it).
 * Returns null when the bytes are not a TIFF header at all.
 */
export function parseTiff(bytes: Uint8Array): TiffBlock | null {
  if (bytes.byteLength < 8) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const order = view.getUint16(0, false);
  if (order !== 0x4949 && order !== 0x4d4d) return null;
  const le = order === 0x4949;
  if (view.getUint16(2, le) !== 0x002a) return null;

  const block = emptyBlock(le);
  const seen = new Set<number>();
  const first = readIfd(view, 0, view.getUint32(4, le), le, seen);
  if (!first) return null;

  let exifOffset = 0;
  let gpsOffset = 0;
  block.ifd0 = first.entries.filter(entry => {
    if (entry.tag === TAG_EXIF_IFD) {
      exifOffset = entryToNumber(entry, le);
      return false;
    }
    if (entry.tag === TAG_GPS_IFD) {
      gpsOffset = entryToNumber(entry, le);
      return false;
    }
    return true;
  });

  if (exifOffset) {
    const exif = readIfd(view, 0, exifOffset, le, seen);
    if (exif) {
      let interopOffset = 0;
      block.exif = exif.entries.filter(entry => {
        if (entry.tag === TAG_INTEROP_IFD) {
          interopOffset = entryToNumber(entry, le);
          return false;
        }
        return true;
      });
      if (interopOffset) {
        const interop = readIfd(view, 0, interopOffset, le, seen);
        if (interop) block.interop = interop.entries;
      }
    }
  }

  if (gpsOffset) {
    const gps = readIfd(view, 0, gpsOffset, le, seen);
    if (gps) block.gps = gps.entries;
  }

  // IFD1 holds the embedded preview. Its two pointer tags describe where the
  // JPEG lives; we lift the bytes out so the rebuild can place them anywhere.
  if (first.next) {
    const ifd1 = readIfd(view, 0, first.next, le, seen);
    if (ifd1) {
      let thumbOffset = 0;
      let thumbLength = 0;
      block.ifd1 = ifd1.entries.filter(entry => {
        if (entry.tag === TAG_THUMB_OFFSET) {
          thumbOffset = entryToNumber(entry, le);
          return false;
        }
        if (entry.tag === TAG_THUMB_LENGTH) {
          thumbLength = entryToNumber(entry, le);
          return false;
        }
        return true;
      });
      if (thumbOffset > 0 && thumbLength > 0 && thumbOffset + thumbLength <= bytes.byteLength) {
        block.thumbnail = bytes.slice(thumbOffset, thumbOffset + thumbLength);
      }
    }
  }

  return block;
}

// ---------------------------------------------------------------------------
// Serialising
// ---------------------------------------------------------------------------

const pad2 = (n: number) => n + (n % 2);

function ifdSize(entryCount: number): number {
  return 2 + entryCount * 12 + 4;
}

/**
 * Writes the tree back out as a standalone TIFF block, preserving the source
 * byte order so every raw value can be copied verbatim.
 */
export function serialiseTiff(block: TiffBlock): Uint8Array {
  const le = block.littleEndian;

  const sortByTag = (list: RawEntry[]) => [...list].sort((a, b) => a.tag - b.tag);
  const gps = sortByTag(block.gps);
  const interop = sortByTag(block.interop);
  const exif = sortByTag(block.exif);
  const ifd0 = sortByTag(block.ifd0);
  const keepThumb = !!block.thumbnail && block.ifd1.length > 0;
  const ifd1 = keepThumb ? sortByTag(block.ifd1) : [];

  const hasExif = exif.length > 0 || interop.length > 0;
  const hasGps = gps.length > 0;
  const hasInterop = interop.length > 0;

  // Synthesised pointer entries. Their 4-byte payload is patched once the
  // layout is known.
  const ifd0Count = ifd0.length + (hasExif ? 1 : 0) + (hasGps ? 1 : 0);
  const exifCount = exif.length + (hasInterop ? 1 : 0);
  const ifd1Count = keepThumb ? ifd1.length + 2 : 0; // + offset/length pair

  if (ifd0Count === 0 && exifCount === 0 && !hasGps && !keepThumb) {
    return new Uint8Array(0);
  }

  let pos = 8;
  const ifd0Off = pos;
  pos += ifdSize(ifd0Count);
  const ifd1Off = keepThumb ? pos : 0;
  if (keepThumb) pos += ifdSize(ifd1Count);
  const exifOff = hasExif ? pos : 0;
  if (hasExif) pos += ifdSize(exifCount);
  const gpsOff = hasGps ? pos : 0;
  if (hasGps) pos += ifdSize(gps.length);
  const interopOff = hasInterop ? pos : 0;
  if (hasInterop) pos += ifdSize(interop.length);

  // Data area: every value longer than 4 bytes.
  const dataOffsets = new Map<RawEntry, number>();
  const assign = (list: RawEntry[]) => {
    for (const entry of list) {
      if (entry.data.byteLength > 4) {
        dataOffsets.set(entry, pos);
        pos += pad2(entry.data.byteLength);
      }
    }
  };
  assign(ifd0);
  assign(ifd1);
  assign(exif);
  assign(gps);
  assign(interop);

  const thumbOff = keepThumb ? pos : 0;
  if (keepThumb) pos += pad2(block.thumbnail!.byteLength);

  const out = new Uint8Array(pos);
  const view = new DataView(out.buffer);

  view.setUint16(0, le ? 0x4949 : 0x4d4d, false);
  view.setUint16(2, 0x002a, le);
  view.setUint32(4, ifd0Off, le);

  const writeLong = (at: number, tag: number, value: number) => {
    view.setUint16(at, tag, le);
    view.setUint16(at + 2, 4, le); // LONG
    view.setUint32(at + 4, 1, le);
    view.setUint32(at + 8, value, le);
  };

  const writeList = (
    ifdOffset: number,
    list: RawEntry[],
    extras: { tag: number; value: number }[],
    next: number
  ) => {
    const all: { tag: number; write: (at: number) => void }[] = list.map(entry => ({
      tag: entry.tag,
      write: (at: number) => {
        view.setUint16(at, entry.tag, le);
        view.setUint16(at + 2, entry.type, le);
        view.setUint32(at + 4, entry.count, le);
        if (entry.data.byteLength > 4) {
          const off = dataOffsets.get(entry)!;
          view.setUint32(at + 8, off, le);
          out.set(entry.data, off);
        } else {
          out.set(entry.data, at + 8);
        }
      },
    }));
    for (const extra of extras) {
      all.push({ tag: extra.tag, write: (at: number) => writeLong(at, extra.tag, extra.value) });
    }
    all.sort((a, b) => a.tag - b.tag);

    view.setUint16(ifdOffset, all.length, le);
    all.forEach((item, i) => item.write(ifdOffset + 2 + i * 12));
    view.setUint32(ifdOffset + 2 + all.length * 12, next, le);
  };

  const ifd0Extras: { tag: number; value: number }[] = [];
  if (hasExif) ifd0Extras.push({ tag: TAG_EXIF_IFD, value: exifOff });
  if (hasGps) ifd0Extras.push({ tag: TAG_GPS_IFD, value: gpsOff });
  writeList(ifd0Off, ifd0, ifd0Extras, keepThumb ? ifd1Off : 0);

  if (keepThumb) {
    writeList(
      ifd1Off,
      ifd1,
      [
        { tag: TAG_THUMB_OFFSET, value: thumbOff },
        { tag: TAG_THUMB_LENGTH, value: block.thumbnail!.byteLength },
      ],
      0
    );
    out.set(block.thumbnail!, thumbOff);
  }

  if (hasExif) {
    writeList(exifOff, exif, hasInterop ? [{ tag: TAG_INTEROP_IFD, value: interopOff }] : [], 0);
  }
  if (hasGps) writeList(gpsOff, gps, [], 0);
  if (hasInterop) writeList(interopOff, interop, [], 0);

  return out;
}

// ---------------------------------------------------------------------------
// Value decoding (display only — the bytes we write back are never re-encoded)
// ---------------------------------------------------------------------------

export interface DecodedValue {
  text: string;
  numbers: number[];
}

const ascii = (data: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    if (c === 0) break;
    out += String.fromCharCode(c);
  }
  return out.trim();
};

/** Windows XP* tags store UTF-16LE in a BYTE array. */
const utf16le = (data: Uint8Array): string => {
  let out = '';
  for (let i = 0; i + 1 < data.length; i += 2) {
    const code = data[i] | (data[i + 1] << 8);
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out.trim();
};

export function decodeEntry(entry: RawEntry, le: boolean): DecodedValue {
  const { type, data } = entry;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const numbers: number[] = [];

  const readAt = (i: number): number => {
    switch (type) {
      case 1:
        return view.getUint8(i);
      case 6:
        return view.getInt8(i);
      case 3:
        return view.getUint16(i, le);
      case 8:
        return view.getInt16(i, le);
      case 4:
        return view.getUint32(i, le);
      case 9:
        return view.getInt32(i, le);
      case 11:
        return view.getFloat32(i, le);
      case 12:
        return view.getFloat64(i, le);
      case 5: {
        const num = view.getUint32(i, le);
        const den = view.getUint32(i + 4, le);
        return den === 0 ? 0 : num / den;
      }
      case 10: {
        const num = view.getInt32(i, le);
        const den = view.getInt32(i + 4, le);
        return den === 0 ? 0 : num / den;
      }
      default:
        return 0;
    }
  };

  if (type === 2) return { text: ascii(data), numbers };
  if (type === 7) {
    // UNDEFINED. UserComment carries an 8-byte character-code header.
    if (data.byteLength > 8 && ascii(data.slice(0, 8)).toUpperCase().startsWith('ASCII')) {
      return { text: ascii(data.slice(8)), numbers };
    }
    if (data.byteLength <= 4) return { text: Array.from(data).join(' '), numbers };
    return { text: `${data.byteLength} bytes`, numbers };
  }

  const unit = TYPE_SIZES[type] ?? 0;
  if (!unit) return { text: `${data.byteLength} bytes`, numbers };

  const max = Math.min(entry.count, Math.floor(data.byteLength / unit), 16);
  for (let i = 0; i < max; i++) numbers.push(readAt(i * unit));

  const text = numbers
    .map(n => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10000) / 10000)))
    .join(', ');
  return { text: entry.count > max ? `${text}…` : text, numbers };
}

export { ascii as decodeAscii, utf16le as decodeUtf16le };
