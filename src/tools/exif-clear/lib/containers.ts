// ============================================================================
// Container layer: where metadata hides inside JPEG, PNG and WebP
// ----------------------------------------------------------------------------
// Each format is scanned into a flat list of blocks with byte ranges. Nothing
// is decoded here beyond the signature needed to name a block, and the pixel
// stream is never touched: rebuilding is a copy of the blocks we keep.
// ============================================================================

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export type BlockKind =
  | 'exif'
  | 'xmp'
  | 'iptc'
  | 'icc'
  | 'comment'
  | 'time'
  | 'other'
  | 'structural';

export interface Block {
  id: string;
  kind: BlockKind;
  /** Technical name, shown verbatim: "APP1 · Exif", "iTXt · XML:com.adobe.xmp". */
  label: string;
  /** Total bytes the block occupies in the file, marker/header included. */
  size: number;
  offset: number;
  payloadOffset: number;
  payloadSize: number;
  /** Structural blocks (pixels, headers) are never offered for removal. */
  removable: boolean;
  /** Short excerpt for text-ish blocks, so the user sees what is in there. */
  preview?: string;
}

export interface Container {
  format: ImageFormat;
  bytes: Uint8Array;
  blocks: Block[];
  /** False when the byte scan hit something it could not follow. */
  ok: boolean;
}

const ascii = (bytes: Uint8Array, from: number, len: number): string => {
  let out = '';
  const end = Math.min(from + len, bytes.length);
  for (let i = from; i < end; i++) out += String.fromCharCode(bytes[i]);
  return out;
};

/** Printable excerpt of a text block, with the binary noise collapsed. */
function excerpt(bytes: Uint8Array, from: number, len: number, max = 160): string {
  let out = '';
  const end = Math.min(from + len, bytes.length);
  for (let i = from; i < end && out.length < max; i++) {
    const c = bytes[i];
    if (c === 0) {
      out += ' ';
    } else if (c >= 32 && c < 127) {
      out += String.fromCharCode(c);
    } else if (c === 10 || c === 13 || c === 9) {
      out += ' ';
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return 'png';
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP')
    return 'webp';
  return null;
}

// ---------------------------------------------------------------------------
// JPEG
// ---------------------------------------------------------------------------

const APP_NAMES: Record<number, string> = {
  0xffe0: 'APP0',
  0xffe1: 'APP1',
  0xffe2: 'APP2',
  0xffe3: 'APP3',
  0xffe4: 'APP4',
  0xffe5: 'APP5',
  0xffe6: 'APP6',
  0xffe7: 'APP7',
  0xffe8: 'APP8',
  0xffe9: 'APP9',
  0xffea: 'APP10',
  0xffeb: 'APP11',
  0xffec: 'APP12',
  0xffed: 'APP13',
  0xffee: 'APP14',
  0xffef: 'APP15',
};

function classifyJpegApp(bytes: Uint8Array, marker: number, payloadOffset: number, payloadSize: number) {
  const sig = ascii(bytes, payloadOffset, Math.min(34, payloadSize));
  const app = APP_NAMES[marker] || `0x${marker.toString(16)}`;

  if (marker === 0xffe1 && sig.startsWith('Exif\0\0')) {
    return { kind: 'exif' as BlockKind, label: `${app} · Exif`, removable: true, skip: 6 };
  }
  if (marker === 0xffe1 && sig.startsWith('http://ns.adobe.com/xap/1.0/')) {
    return { kind: 'xmp' as BlockKind, label: `${app} · XMP`, removable: true, skip: 29 };
  }
  if (marker === 0xffe1 && sig.startsWith('http://ns.adobe.com/xmp/extension/')) {
    return { kind: 'xmp' as BlockKind, label: `${app} · XMP (extended)`, removable: true, skip: 35 };
  }
  if (marker === 0xffed && sig.startsWith('Photoshop 3.0')) {
    return { kind: 'iptc' as BlockKind, label: `${app} · Photoshop / IPTC`, removable: true, skip: 14 };
  }
  if (marker === 0xffe2 && sig.startsWith('ICC_PROFILE')) {
    return { kind: 'icc' as BlockKind, label: `${app} · ICC colour profile`, removable: true, skip: 12 };
  }
  if (marker === 0xffe2 && sig.startsWith('MPF')) {
    return { kind: 'other' as BlockKind, label: `${app} · MPF (multi-picture)`, removable: true, skip: 4 };
  }
  if (marker === 0xffe0) {
    // JFIF only carries pixel density. Harmless, and removing it can change how
    // some viewers scale the image, so it is not offered.
    return { kind: 'structural' as BlockKind, label: `${app} · JFIF`, removable: false, skip: 5 };
  }
  if (marker === 0xffee && sig.startsWith('Adobe')) {
    // The Adobe APP14 transform byte tells decoders whether the data is YCCK or
    // CMYK. Dropping it turns some CMYK JPEGs into colour soup.
    return { kind: 'structural' as BlockKind, label: `${app} · Adobe`, removable: false, skip: 5 };
  }
  if (marker === 0xffec) {
    return { kind: 'other' as BlockKind, label: `${app} · Ducky`, removable: true, skip: 5 };
  }
  return { kind: 'other' as BlockKind, label: `${app}`, removable: true, skip: 0 };
}

/** Markers that stand alone: no length word follows them. */
const STANDALONE = new Set([0xff01, 0xffd0, 0xffd1, 0xffd2, 0xffd3, 0xffd4, 0xffd5, 0xffd6, 0xffd7]);

export function scanJpeg(bytes: Uint8Array): Container {
  const blocks: Block[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let ok = true;

  blocks.push({
    id: 'soi',
    kind: 'structural',
    label: 'SOI',
    offset: 0,
    size: 2,
    payloadOffset: 2,
    payloadSize: 0,
    removable: false,
  });

  let offset = 2;
  let n = 0;
  while (offset + 4 <= bytes.length) {
    const marker = view.getUint16(offset, false);
    if ((marker & 0xff00) !== 0xff00) {
      ok = false;
      break;
    }
    if (marker === 0xffda) break; // start of scan: the rest is entropy-coded data
    if (STANDALONE.has(marker)) {
      offset += 2;
      continue;
    }

    const length = view.getUint16(offset + 2, false);
    if (length < 2 || offset + 2 + length > bytes.length) {
      ok = false;
      break;
    }
    const payloadOffset = offset + 4;
    const payloadSize = length - 2;

    if (marker === 0xfffe) {
      blocks.push({
        id: `b${n++}`,
        kind: 'comment',
        label: 'COM · comment',
        offset,
        size: length + 2,
        payloadOffset,
        payloadSize,
        removable: true,
        preview: excerpt(bytes, payloadOffset, payloadSize),
      });
    } else if (marker >= 0xffe0 && marker <= 0xffef) {
      const info = classifyJpegApp(bytes, marker, payloadOffset, payloadSize);
      blocks.push({
        id: `b${n++}`,
        kind: info.kind,
        label: info.label,
        offset,
        size: length + 2,
        payloadOffset: payloadOffset + info.skip,
        payloadSize: Math.max(0, payloadSize - info.skip),
        removable: info.removable,
        preview:
          info.kind === 'xmp' || info.kind === 'iptc'
            ? excerpt(bytes, payloadOffset + info.skip, payloadSize - info.skip)
            : undefined,
      });
    } else {
      blocks.push({
        id: `b${n++}`,
        kind: 'structural',
        label: `0x${marker.toString(16).toUpperCase()}`,
        offset,
        size: length + 2,
        payloadOffset,
        payloadSize,
        removable: false,
      });
    }

    offset += length + 2;
  }

  // Everything from SOS onwards (scan data, any trailing bytes) travels as one
  // opaque block: we never rewrite pixels.
  if (offset < bytes.length) {
    blocks.push({
      id: 'scan',
      kind: 'structural',
      label: 'SOS · image data',
      offset,
      size: bytes.length - offset,
      payloadOffset: offset,
      payloadSize: bytes.length - offset,
      removable: false,
    });
  }

  return { format: 'jpeg', bytes, blocks, ok };
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const PNG_STRUCTURAL = new Set([
  'IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'bKGD',
  'pHYs', 'sBIT', 'hIST', 'sPLT', 'acTL', 'fcTL', 'fdAT', 'cICP', 'mDCv', 'cLLi',
]);

export function scanPng(bytes: Uint8Array): Container {
  const blocks: Block[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let ok = true;

  blocks.push({
    id: 'sig',
    kind: 'structural',
    label: 'PNG signature',
    offset: 0,
    size: 8,
    payloadOffset: 8,
    payloadSize: 0,
    removable: false,
  });

  let offset = 8;
  let n = 0;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset, false);
    const type = ascii(bytes, offset + 4, 4);
    const size = 12 + length;
    if (length > bytes.length || offset + size > bytes.length) {
      ok = false;
      break;
    }
    const payloadOffset = offset + 8;

    let kind: BlockKind = 'structural';
    let label = `${type}`;
    let removable = false;
    let preview: string | undefined;

    if (type === 'eXIf') {
      kind = 'exif';
      label = 'eXIf · Exif';
      removable = true;
    } else if (type === 'iCCP') {
      kind = 'icc';
      label = 'iCCP · ICC colour profile';
      removable = true;
    } else if (type === 'tIME') {
      kind = 'time';
      label = 'tIME · last modified';
      removable = true;
    } else if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
      const keyword = excerpt(bytes, payloadOffset, Math.min(80, length)).split(' ')[0] || '';
      const isXmp = /xmp/i.test(keyword);
      kind = isXmp ? 'xmp' : 'comment';
      label = `${type} · ${keyword || 'text'}`;
      removable = true;
      // zTXt/iTXt payloads may be deflated, so the excerpt is best-effort.
      preview = excerpt(bytes, payloadOffset, Math.min(400, length));
    } else if (!PNG_STRUCTURAL.has(type)) {
      kind = 'other';
      removable = true;
    }

    blocks.push({
      id: `p${n++}`,
      kind,
      label,
      offset,
      size,
      payloadOffset,
      payloadSize: length,
      removable,
      preview,
    });

    offset += size;
    if (type === 'IEND') break;
  }

  if (offset < bytes.length) {
    blocks.push({
      id: 'tail',
      kind: 'other',
      label: 'Trailing bytes after IEND',
      offset,
      size: bytes.length - offset,
      payloadOffset: offset,
      payloadSize: bytes.length - offset,
      removable: true,
    });
  }

  return { format: 'png', bytes, blocks, ok };
}

// ---------------------------------------------------------------------------
// WebP (RIFF)
// ---------------------------------------------------------------------------

/** Bit flags in the first byte of a VP8X payload. */
const VP8X_ICC = 0x20;
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

export function scanWebp(bytes: Uint8Array): Container {
  const blocks: Block[] = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let ok = true;

  blocks.push({
    id: 'riff',
    kind: 'structural',
    label: 'RIFF/WEBP header',
    offset: 0,
    size: 12,
    payloadOffset: 12,
    payloadSize: 0,
    removable: false,
  });

  let offset = 12;
  let n = 0;
  while (offset + 8 <= bytes.length) {
    const fourcc = ascii(bytes, offset, 4);
    const length = view.getUint32(offset + 4, true);
    const size = 8 + length + (length % 2);
    if (offset + size > bytes.length + 1) {
      ok = false;
      break;
    }
    const payloadOffset = offset + 8;

    let kind: BlockKind = 'structural';
    let label = fourcc;
    let removable = false;
    let preview: string | undefined;

    if (fourcc === 'EXIF') {
      kind = 'exif';
      label = 'EXIF chunk';
      removable = true;
    } else if (fourcc === 'XMP ') {
      kind = 'xmp';
      label = 'XMP chunk';
      removable = true;
      preview = excerpt(bytes, payloadOffset, Math.min(400, length));
    } else if (fourcc === 'ICCP') {
      kind = 'icc';
      label = 'ICCP · ICC colour profile';
      removable = true;
    }

    blocks.push({
      id: `w${n++}`,
      kind,
      label,
      offset,
      size,
      payloadOffset,
      payloadSize: length,
      removable,
      preview,
    });

    offset += size;
  }

  return { format: 'webp', bytes, blocks, ok };
}

export function scanContainer(bytes: Uint8Array): Container | null {
  const format = detectFormat(bytes);
  if (format === 'jpeg') return scanJpeg(bytes);
  if (format === 'png') return scanPng(bytes);
  if (format === 'webp') return scanWebp(bytes);
  return null;
}

// ---------------------------------------------------------------------------
// Rebuilding
// ---------------------------------------------------------------------------

export interface RebuildPlan {
  /** Ids of blocks to drop entirely. */
  remove: Set<string>;
  /**
   * New TIFF bytes for the Exif block. When present, the Exif block is kept but
   * replaced by this payload — that is how "GPS only" and "keep orientation"
   * work. An empty array means: drop the Exif block after all.
   */
  exifPayload?: Uint8Array | null;
}

function concat(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const part of parts) total += part.byteLength;
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.byteLength;
  }
  return out;
}

const EXIF_SIG = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"

function buildJpeg(container: Container, plan: RebuildPlan): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const block of container.blocks) {
    if (block.removable && plan.remove.has(block.id)) continue;

    if (block.kind === 'exif' && plan.exifPayload !== undefined) {
      const payload = plan.exifPayload;
      if (!payload || payload.byteLength === 0) continue;
      const length = 2 + EXIF_SIG.byteLength + payload.byteLength;
      if (length > 0xffff) {
        // Too big for one APP1: keep the original rather than produce a broken file.
        parts.push(container.bytes.subarray(block.offset, block.offset + block.size));
        continue;
      }
      const header = new Uint8Array(4);
      const view = new DataView(header.buffer);
      view.setUint16(0, 0xffe1, false);
      view.setUint16(2, length, false);
      parts.push(header, EXIF_SIG, payload);
      continue;
    }

    parts.push(container.bytes.subarray(block.offset, block.offset + block.size));
  }
  return concat(parts);
}

function pngChunk(type: string, payload: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + payload.byteLength);
  const view = new DataView(out.buffer);
  view.setUint32(0, payload.byteLength, false);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(payload, 8);
  const body = out.subarray(4, 8 + payload.byteLength);
  view.setUint32(8 + payload.byteLength, crc32(body), false);
  return out;
}

function buildPng(container: Container, plan: RebuildPlan): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const block of container.blocks) {
    if (block.removable && plan.remove.has(block.id)) continue;

    if (block.kind === 'exif' && plan.exifPayload !== undefined) {
      const payload = plan.exifPayload;
      if (!payload || payload.byteLength === 0) continue;
      parts.push(pngChunk('eXIf', payload));
      continue;
    }

    parts.push(container.bytes.subarray(block.offset, block.offset + block.size));
  }
  return concat(parts);
}

function buildWebp(container: Container, plan: RebuildPlan): Uint8Array {
  const parts: Uint8Array[] = [];
  let droppedExif = false;
  let droppedXmp = false;
  let droppedIcc = false;

  for (const block of container.blocks) {
    if (block.id === 'riff') continue; // rewritten at the end

    const dropping = block.removable && plan.remove.has(block.id);
    let payload: Uint8Array | null = null;

    if (block.kind === 'exif' && plan.exifPayload !== undefined && !dropping) {
      payload = plan.exifPayload && plan.exifPayload.byteLength ? plan.exifPayload : null;
      if (!payload) {
        droppedExif = true;
        continue;
      }
    } else if (dropping) {
      if (block.kind === 'exif') droppedExif = true;
      if (block.kind === 'xmp') droppedXmp = true;
      if (block.kind === 'icc') droppedIcc = true;
      continue;
    }

    if (payload) {
      const header = new Uint8Array(8);
      const view = new DataView(header.buffer);
      for (let i = 0; i < 4; i++) header[i] = 'EXIF'.charCodeAt(i);
      view.setUint32(4, payload.byteLength, true);
      parts.push(header, payload);
      if (payload.byteLength % 2) parts.push(new Uint8Array(1));
    } else {
      parts.push(container.bytes.subarray(block.offset, block.offset + block.size));
    }
  }

  // The VP8X flag byte must agree with the chunks that are actually present,
  // or decoders go looking for a chunk that is no longer there.
  const body = concat(parts);
  if (body.byteLength >= 9 && ascii(body, 0, 4) === 'VP8X') {
    let flags = body[8];
    if (droppedExif) flags &= ~VP8X_EXIF;
    if (droppedXmp) flags &= ~VP8X_XMP;
    if (droppedIcc) flags &= ~VP8X_ICC;
    body[8] = flags & 0xff;
  }

  const head = new Uint8Array(12);
  const headView = new DataView(head.buffer);
  for (let i = 0; i < 4; i++) head[i] = 'RIFF'.charCodeAt(i);
  headView.setUint32(4, 4 + body.byteLength, true);
  for (let i = 0; i < 4; i++) head[8 + i] = 'WEBP'.charCodeAt(i);

  return concat([head, body]);
}

export function rebuild(container: Container, plan: RebuildPlan): Uint8Array {
  if (container.format === 'jpeg') return buildJpeg(container, plan);
  if (container.format === 'png') return buildPng(container, plan);
  return buildWebp(container, plan);
}
