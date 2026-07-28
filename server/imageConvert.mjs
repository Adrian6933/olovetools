// FormatFlow server-side conversion — Node-only (unlike core.mjs, this uses the
// native `sharp` binary, so it cannot run on Cloudflare Workers/edge runtimes).
// Deploys as a Vercel Node serverless function via src/pages/api/convert.ts,
// exactly like the standalone self-hosted Node server would use it directly.
//
// Why this exists: canvas.toBlob() in the browser can't produce real AVIF on
// most engines and has no quality/compression controls for TIFF/WebP. sharp
// (libvips) gives genuine server-grade encoding for those formats. HEIC output
// and true RAW/EPS conversion are NOT possible here — HEVC encoding is patent
// licensed and isn't bundled in the open-source libheif build, and RAW/EPS need
// Ghostscript/dcraw binaries that don't run in a serverless function. Those
// three stay as the existing honest client-side fallbacks.

import sharp from 'sharp';

// Formats this endpoint can genuinely produce server-side.
export const SUPPORTED_OUTPUT_FORMATS = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/tiff',
]);

const clampQuality = (q) => Math.min(100, Math.max(1, Math.round(q)));

// Serverless function body-size ceiling (Vercel's default Node function limit
// is ~4.5MB per request); reject early with a clear reason instead of a raw 413.
export const MAX_INPUT_BYTES = 4.5 * 1024 * 1024;

export async function convertImageBuffer({ buffer, format, quality = 90, width, height }) {
  if (!SUPPORTED_OUTPUT_FORMATS.has(format)) {
    throw Object.assign(new Error(`Server conversion not available for ${format}`), { code: 'unsupported_format' });
  }

  let pipeline = sharp(buffer, { failOn: 'none' });
  if (width && height) {
    pipeline = pipeline.resize(Math.round(width), Math.round(height), { fit: 'fill' });
  }

  const q = clampQuality(quality);
  switch (format) {
    case 'image/avif':
      return { buffer: await pipeline.avif({ quality: q }).toBuffer(), mime: 'image/avif' };
    case 'image/webp':
      return { buffer: await pipeline.webp({ quality: q }).toBuffer(), mime: 'image/webp' };
    case 'image/tiff':
      return { buffer: await pipeline.tiff({ quality: q, compression: 'lzw' }).toBuffer(), mime: 'image/tiff' };
    case 'image/png':
      return { buffer: await pipeline.png().toBuffer(), mime: 'image/png' };
    case 'image/jpeg':
      return { buffer: await pipeline.flatten({ background: '#ffffff' }).jpeg({ quality: q }).toBuffer(), mime: 'image/jpeg' };
    case 'image/gif':
      return { buffer: await pipeline.gif().toBuffer(), mime: 'image/gif' };
    default:
      throw Object.assign(new Error(`Unhandled format ${format}`), { code: 'unsupported_format' });
  }
}
