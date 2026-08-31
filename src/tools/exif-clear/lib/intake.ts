// ============================================================================
// File intake
// ----------------------------------------------------------------------------
// The old input accepted `image/jpeg` and `image/png` and silently ignored
// everything else — including the HEIC every recent iPhone produces, which is
// precisely the file most likely to be carrying coordinates.
// ============================================================================

import { detectFormat, type ImageFormat } from './containers';

export type IntakeError = 'size' | 'format' | 'heic' | 'read';

/** 64 MB. Above that a phone tab starts to struggle holding the buffer. */
export const MAX_BYTES = 64 * 1024 * 1024;

export const ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';

export interface LoadedImage {
  name: string;
  bytes: Uint8Array;
  format: ImageFormat;
  /** True when we had to re-encode (HEIC), which is not byte-for-byte lossless. */
  converted: boolean;
  originalBytes: number;
}

function isHeic(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

function swapExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf('.');
  return `${dot > 0 ? name.slice(0, dot) : name}.${ext}`;
}

/** Plain result pair rather than a discriminated union: this project compiles
 *  without `strictNullChecks`, where narrowing on a boolean discriminant does
 *  not hold and every caller ends up casting. */
export interface IntakeResult {
  value: LoadedImage | null;
  error: IntakeError | null;
}

const failed = (error: IntakeError): IntakeResult => ({ value: null, error });

export async function loadFile(file: File): Promise<IntakeResult> {
  if (file.size > MAX_BYTES) return failed('size');

  let working: Blob = file;
  let name = file.name;
  let converted = false;

  if (isHeic(file)) {
    try {
      const heic2any = (await import('heic2any')).default;
      const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.94 });
      working = Array.isArray(out) ? out[0] : (out as Blob);
      name = swapExtension(name, 'jpg');
      converted = true;
    } catch {
      return failed('heic');
    }
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await working.arrayBuffer());
  } catch {
    return failed('read');
  }

  const format = detectFormat(bytes);
  if (!format) return failed('format');

  return { value: { name, bytes, format, converted, originalBytes: file.size }, error: null };
}

/** Appends a suffix before the extension: photo.jpg → photo_clean.jpg */
export function cleanedName(name: string, suffix = '_clean'): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return `${name}${suffix}`;
  return `${name.slice(0, dot)}${suffix}${name.slice(dot)}`;
}

export const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
