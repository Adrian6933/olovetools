// ============================================================================
// Format detection from the actual bytes.
// ----------------------------------------------------------------------------
// The old tool guessed the MIME type with `input.substring(0, 50).includes('/9j/')`
// — a search for a JPEG marker *anywhere* in the first fifty Base64 characters,
// which happily matched the middle of an unrelated payload and then saved every
// download as `.png` regardless.
//
// Having the decoded bytes means we can read the real magic numbers, which is
// both correct and free. It also lets the decode side offer a download with the
// right extension, and the encode side warn when a file's contents disagree
// with its name.
// ============================================================================

export interface Format {
  /** Canonical MIME type. */
  mime: string;
  /** Extension without the dot. */
  ext: string;
  /** Short human label for the UI. */
  label: string;
  /** True when a browser `<img>` can display it directly. */
  previewable: boolean;
}

const UNKNOWN: Format = { mime: 'application/octet-stream', ext: 'bin', label: 'Binary', previewable: false };

interface Signature {
  /** Byte offset the pattern starts at. */
  offset: number;
  /** Bytes to match; `-1` means "any byte here". */
  bytes: number[];
  format: Format;
  /** Extra check for containers whose brand lives further in (ISO-BMFF, RIFF). */
  refine?: (bytes: Uint8Array) => Format | null;
}

const ascii = (text: string): number[] => Array.from(text, c => c.charCodeAt(0));

/** RIFF containers all start the same way; the form type is at offset 8. */
function refineRiff(bytes: Uint8Array): Format | null {
  const form = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (form === 'WEBP') return { mime: 'image/webp', ext: 'webp', label: 'WebP image', previewable: true };
  if (form === 'WAVE') return { mime: 'audio/wav', ext: 'wav', label: 'WAV audio', previewable: false };
  if (form === 'AVI ') return { mime: 'video/x-msvideo', ext: 'avi', label: 'AVI video', previewable: false };
  return null;
}

/** ISO base media files declare their brand in the `ftyp` box at offset 8. */
function refineFtyp(bytes: Uint8Array): Format | null {
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
  if (brand.startsWith('avif') || brand === 'avis')
    return { mime: 'image/avif', ext: 'avif', label: 'AVIF image', previewable: true };
  if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'heim' || brand === 'heis')
    return { mime: 'image/heic', ext: 'heic', label: 'HEIC image', previewable: false };
  if (brand === 'mif1' || brand === 'msf1')
    return { mime: 'image/heif', ext: 'heif', label: 'HEIF image', previewable: false };
  if (brand.startsWith('m4a')) return { mime: 'audio/mp4', ext: 'm4a', label: 'M4A audio', previewable: false };
  if (brand === 'qt  ') return { mime: 'video/quicktime', ext: 'mov', label: 'QuickTime video', previewable: false };
  return { mime: 'video/mp4', ext: 'mp4', label: 'MP4 video', previewable: false };
}

/**
 * A ZIP container is also an OOXML document, an ODF document, a JAR, an EPUB…
 * The distinguishing member name sits right after the local file header.
 */
function refineZip(bytes: Uint8Array): Format | null {
  const head = String.fromCharCode.apply(
    null,
    bytes.subarray(0, Math.min(bytes.length, 4096)) as unknown as number[]
  );
  if (head.includes('word/')) return { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', label: 'Word document', previewable: false };
  if (head.includes('xl/')) return { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx', label: 'Excel workbook', previewable: false };
  if (head.includes('ppt/')) return { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx', label: 'PowerPoint deck', previewable: false };
  if (head.includes('mimetypeapplication/epub')) return { mime: 'application/epub+zip', ext: 'epub', label: 'EPUB book', previewable: false };
  if (head.includes('mimetypeapplication/vnd.oasis')) return { mime: 'application/vnd.oasis.opendocument.text', ext: 'odt', label: 'OpenDocument', previewable: false };
  return { mime: 'application/zip', ext: 'zip', label: 'ZIP archive', previewable: false };
}

const SIGNATURES: Signature[] = [
  { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], format: { mime: 'image/png', ext: 'png', label: 'PNG image', previewable: true } },
  { offset: 0, bytes: [0xff, 0xd8, 0xff], format: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG image', previewable: true } },
  { offset: 0, bytes: ascii('GIF8'), format: { mime: 'image/gif', ext: 'gif', label: 'GIF image', previewable: true } },
  { offset: 0, bytes: ascii('RIFF'), format: { mime: 'image/webp', ext: 'webp', label: 'WebP image', previewable: true }, refine: refineRiff },
  { offset: 4, bytes: ascii('ftyp'), format: { mime: 'video/mp4', ext: 'mp4', label: 'MP4 video', previewable: false }, refine: refineFtyp },
  { offset: 0, bytes: [0x42, 0x4d], format: { mime: 'image/bmp', ext: 'bmp', label: 'BMP image', previewable: true } },
  { offset: 0, bytes: [0x00, 0x00, 0x01, 0x00], format: { mime: 'image/x-icon', ext: 'ico', label: 'Icon', previewable: true } },
  { offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00], format: { mime: 'image/tiff', ext: 'tif', label: 'TIFF image', previewable: false } },
  { offset: 0, bytes: [0x4d, 0x4d, 0x00, 0x2a], format: { mime: 'image/tiff', ext: 'tif', label: 'TIFF image', previewable: false } },
  { offset: 0, bytes: ascii('%PDF-'), format: { mime: 'application/pdf', ext: 'pdf', label: 'PDF document', previewable: false } },
  { offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04], format: { mime: 'application/zip', ext: 'zip', label: 'ZIP archive', previewable: false }, refine: refineZip },
  { offset: 0, bytes: [0x1f, 0x8b], format: { mime: 'application/gzip', ext: 'gz', label: 'Gzip archive', previewable: false } },
  { offset: 0, bytes: ascii('BZh'), format: { mime: 'application/x-bzip2', ext: 'bz2', label: 'Bzip2 archive', previewable: false } },
  { offset: 0, bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a], format: { mime: 'application/x-xz', ext: 'xz', label: 'XZ archive', previewable: false } },
  { offset: 0, bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], format: { mime: 'application/x-7z-compressed', ext: '7z', label: '7-Zip archive', previewable: false } },
  { offset: 0, bytes: ascii('wOFF'), format: { mime: 'font/woff', ext: 'woff', label: 'WOFF font', previewable: false } },
  { offset: 0, bytes: ascii('wOF2'), format: { mime: 'font/woff2', ext: 'woff2', label: 'WOFF2 font', previewable: false } },
  { offset: 0, bytes: [0x00, 0x01, 0x00, 0x00, 0x00], format: { mime: 'font/ttf', ext: 'ttf', label: 'TrueType font', previewable: false } },
  { offset: 0, bytes: ascii('OTTO'), format: { mime: 'font/otf', ext: 'otf', label: 'OpenType font', previewable: false } },
  { offset: 0, bytes: [0x00, 0x61, 0x73, 0x6d], format: { mime: 'application/wasm', ext: 'wasm', label: 'WebAssembly', previewable: false } },
  { offset: 0, bytes: ascii('ID3'), format: { mime: 'audio/mpeg', ext: 'mp3', label: 'MP3 audio', previewable: false } },
  { offset: 0, bytes: [0xff, 0xfb], format: { mime: 'audio/mpeg', ext: 'mp3', label: 'MP3 audio', previewable: false } },
  { offset: 0, bytes: ascii('OggS'), format: { mime: 'audio/ogg', ext: 'ogg', label: 'Ogg audio', previewable: false } },
  { offset: 0, bytes: ascii('fLaC'), format: { mime: 'audio/flac', ext: 'flac', label: 'FLAC audio', previewable: false } },
  { offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3], format: { mime: 'video/webm', ext: 'webm', label: 'WebM video', previewable: false } },
  { offset: 0, bytes: [0x7f, 0x45, 0x4c, 0x46], format: { mime: 'application/x-elf', ext: 'elf', label: 'ELF binary', previewable: false } },
  { offset: 0, bytes: [0x4d, 0x5a], format: { mime: 'application/vnd.microsoft.portable-executable', ext: 'exe', label: 'Windows executable', previewable: false } },
  { offset: 0, bytes: ascii('SQLite format 3'), format: { mime: 'application/vnd.sqlite3', ext: 'sqlite', label: 'SQLite database', previewable: false } },
];

function matches(bytes: Uint8Array, signature: Signature): boolean {
  const { offset, bytes: pattern } = signature;
  if (bytes.length < offset + pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== -1 && bytes[offset + i] !== pattern[i]) return false;
  }
  return true;
}

/**
 * Identifies the payload. Falls back to a text sniff (XML/SVG/JSON/plain) and
 * finally to `application/octet-stream`, which is the honest answer for bytes
 * we do not recognise — not a guess of PNG.
 */
export function sniff(bytes: Uint8Array): Format {
  if (!bytes.length) return UNKNOWN;

  for (const signature of SIGNATURES) {
    if (!matches(bytes, signature)) continue;
    const refined = signature.refine ? signature.refine(bytes) : null;
    return refined || signature.format;
  }

  return sniffText(bytes);
}

/** Distinguishes the text formats, which have no magic number worth the name. */
function sniffText(bytes: Uint8Array): Format {
  const probe = bytes.subarray(0, Math.min(bytes.length, 1024));
  // A NUL in the first kilobyte is the classic "this is not text" tell.
  for (let i = 0; i < probe.length; i++) if (probe[i] === 0) return UNKNOWN;

  let head = '';
  for (let i = 0; i < probe.length; i++) head += String.fromCharCode(probe[i]);
  const trimmed = head.replace(/^﻿/, '').trimStart();

  if (/^<svg[\s>]/i.test(trimmed) || (/^<\?xml/i.test(trimmed) && trimmed.includes('<svg')))
    return { mime: 'image/svg+xml', ext: 'svg', label: 'SVG image', previewable: true };
  if (/^<\?xml/i.test(trimmed)) return { mime: 'application/xml', ext: 'xml', label: 'XML document', previewable: false };
  if (/^<!doctype html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed))
    return { mime: 'text/html', ext: 'html', label: 'HTML document', previewable: false };
  if (/^[[{]/.test(trimmed)) return { mime: 'application/json', ext: 'json', label: 'JSON', previewable: false };
  if (/^-----BEGIN /.test(trimmed)) return { mime: 'application/x-pem-file', ext: 'pem', label: 'PEM block', previewable: false };

  return { mime: 'text/plain', ext: 'txt', label: 'Plain text', previewable: false };
}

/** `image/png` → `png`, for MIME types we did not detect ourselves. */
export function extFromMime(mime: string): string {
  const known = SIGNATURES.find(s => s.format.mime === mime);
  if (known) return known.format.ext;
  const tail = (mime.split('/')[1] || '').split('+')[0];
  return tail || 'bin';
}

/** Whether an `<img>` will render this type; used to decide the preview pane. */
export function isPreviewableMime(mime: string): boolean {
  return /^image\/(png|jpeg|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon|svg\+xml)$/i.test(mime);
}
