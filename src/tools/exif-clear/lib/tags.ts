// ============================================================================
// EXIF tag dictionary
// ----------------------------------------------------------------------------
// Tag names stay in English on purpose: they are the literal field names of the
// EXIF/TIFF specification, the same strings exiftool and every camera manual
// print. What gets translated is the *category* and the *risk*, which is the
// part a person actually needs to read.
// ============================================================================

import type { IfdName } from './tiff';

/** Buckets shown as headings in the inspector. */
export type TagCategory = 'location' | 'identity' | 'device' | 'capture' | 'time' | 'software' | 'image';

/**
 * How much of *you* the tag gives away.
 *  high   — points at a person or a place: coordinates, serial numbers, names.
 *  medium — points at your gear or your habits: model, software, timestamps.
 *  low    — describes the picture itself: size, colour space, exposure.
 */
export type TagRisk = 'high' | 'medium' | 'low';

export interface TagInfo {
  name: string;
  category: TagCategory;
  risk: TagRisk;
}

const T = (name: string, category: TagCategory, risk: TagRisk): TagInfo => ({ name, category, risk });

/** IFD0 and IFD1 (the thumbnail directory shares the tag space). */
export const IFD_TAGS: Record<number, TagInfo> = {
  0x010e: T('Image description', 'identity', 'medium'),
  0x010f: T('Make', 'device', 'medium'),
  0x0110: T('Model', 'device', 'medium'),
  0x0112: T('Orientation', 'image', 'low'),
  0x011a: T('X resolution', 'image', 'low'),
  0x011b: T('Y resolution', 'image', 'low'),
  0x0128: T('Resolution unit', 'image', 'low'),
  0x0131: T('Software', 'software', 'medium'),
  0x0132: T('Modify date', 'time', 'medium'),
  0x013b: T('Artist', 'identity', 'high'),
  0x013c: T('Host computer', 'identity', 'high'),
  0x013e: T('White point', 'image', 'low'),
  0x013f: T('Primary chromaticities', 'image', 'low'),
  0x0211: T('YCbCr coefficients', 'image', 'low'),
  0x0213: T('YCbCr positioning', 'image', 'low'),
  0x0214: T('Reference black/white', 'image', 'low'),
  0x8298: T('Copyright', 'identity', 'medium'),
  0x8769: T('Exif IFD pointer', 'image', 'low'),
  0x8825: T('GPS IFD pointer', 'location', 'high'),
  0x9c9b: T('XP title', 'identity', 'high'),
  0x9c9c: T('XP comment', 'identity', 'high'),
  0x9c9d: T('XP author', 'identity', 'high'),
  0x9c9e: T('XP keywords', 'identity', 'high'),
  0x9c9f: T('XP subject', 'identity', 'high'),
  0x0100: T('Image width', 'image', 'low'),
  0x0101: T('Image height', 'image', 'low'),
  0x0102: T('Bits per sample', 'image', 'low'),
  0x0103: T('Compression', 'image', 'low'),
  0x0106: T('Photometric interpretation', 'image', 'low'),
  0x0115: T('Samples per pixel', 'image', 'low'),
  0x011c: T('Planar configuration', 'image', 'low'),
  0x0201: T('Thumbnail offset', 'image', 'low'),
  0x0202: T('Thumbnail length', 'image', 'low'),
};

/** The Exif sub-IFD: everything the sensor recorded. */
export const EXIF_TAGS: Record<number, TagInfo> = {
  0x829a: T('Exposure time', 'capture', 'low'),
  0x829d: T('F number', 'capture', 'low'),
  0x8822: T('Exposure program', 'capture', 'low'),
  0x8824: T('Spectral sensitivity', 'capture', 'low'),
  0x8827: T('ISO', 'capture', 'low'),
  0x8830: T('Sensitivity type', 'capture', 'low'),
  0x8832: T('Recommended exposure index', 'capture', 'low'),
  0x9000: T('Exif version', 'image', 'low'),
  0x9003: T('Date taken', 'time', 'medium'),
  0x9004: T('Date digitised', 'time', 'medium'),
  0x9010: T('Offset time', 'time', 'medium'),
  0x9011: T('Offset time (original)', 'time', 'medium'),
  0x9012: T('Offset time (digitised)', 'time', 'medium'),
  0x9101: T('Components configuration', 'image', 'low'),
  0x9102: T('Compressed bits per pixel', 'image', 'low'),
  0x9201: T('Shutter speed', 'capture', 'low'),
  0x9202: T('Aperture', 'capture', 'low'),
  0x9203: T('Brightness', 'capture', 'low'),
  0x9204: T('Exposure compensation', 'capture', 'low'),
  0x9205: T('Max aperture', 'capture', 'low'),
  0x9206: T('Subject distance', 'capture', 'medium'),
  0x9207: T('Metering mode', 'capture', 'low'),
  0x9208: T('Light source', 'capture', 'low'),
  0x9209: T('Flash', 'capture', 'low'),
  0x920a: T('Focal length', 'capture', 'low'),
  0x9214: T('Subject area', 'capture', 'low'),
  0x927c: T('Maker note', 'identity', 'high'),
  0x9286: T('User comment', 'identity', 'high'),
  0x9290: T('Subsec time', 'time', 'medium'),
  0x9291: T('Subsec time (original)', 'time', 'medium'),
  0x9292: T('Subsec time (digitised)', 'time', 'medium'),
  0xa000: T('Flashpix version', 'image', 'low'),
  0xa001: T('Colour space', 'image', 'low'),
  0xa002: T('Pixel X dimension', 'image', 'low'),
  0xa003: T('Pixel Y dimension', 'image', 'low'),
  0xa004: T('Related sound file', 'identity', 'medium'),
  0xa005: T('Interoperability pointer', 'image', 'low'),
  0xa20e: T('Focal plane X resolution', 'device', 'low'),
  0xa20f: T('Focal plane Y resolution', 'device', 'low'),
  0xa210: T('Focal plane resolution unit', 'device', 'low'),
  0xa214: T('Subject location', 'capture', 'medium'),
  0xa215: T('Exposure index', 'capture', 'low'),
  0xa217: T('Sensing method', 'device', 'low'),
  0xa300: T('File source', 'device', 'low'),
  0xa301: T('Scene type', 'image', 'low'),
  0xa302: T('CFA pattern', 'device', 'low'),
  0xa401: T('Custom rendered', 'capture', 'low'),
  0xa402: T('Exposure mode', 'capture', 'low'),
  0xa403: T('White balance', 'capture', 'low'),
  0xa404: T('Digital zoom ratio', 'capture', 'low'),
  0xa405: T('Focal length (35mm)', 'capture', 'low'),
  0xa406: T('Scene capture type', 'capture', 'low'),
  0xa407: T('Gain control', 'capture', 'low'),
  0xa408: T('Contrast', 'capture', 'low'),
  0xa409: T('Saturation', 'capture', 'low'),
  0xa40a: T('Sharpness', 'capture', 'low'),
  0xa40b: T('Device setting description', 'device', 'medium'),
  0xa40c: T('Subject distance range', 'capture', 'medium'),
  0xa420: T('Image unique ID', 'identity', 'high'),
  0xa430: T('Camera owner name', 'identity', 'high'),
  0xa431: T('Body serial number', 'identity', 'high'),
  0xa432: T('Lens specification', 'device', 'medium'),
  0xa433: T('Lens make', 'device', 'medium'),
  0xa434: T('Lens model', 'device', 'medium'),
  0xa435: T('Lens serial number', 'identity', 'high'),
  0xa460: T('Composite image', 'image', 'low'),
  0xa500: T('Gamma', 'image', 'low'),
};

/** The GPS sub-IFD: every tag here is location data. */
export const GPS_TAGS: Record<number, TagInfo> = {
  0x0000: T('GPS version', 'location', 'high'),
  0x0001: T('Latitude ref', 'location', 'high'),
  0x0002: T('Latitude', 'location', 'high'),
  0x0003: T('Longitude ref', 'location', 'high'),
  0x0004: T('Longitude', 'location', 'high'),
  0x0005: T('Altitude ref', 'location', 'high'),
  0x0006: T('Altitude', 'location', 'high'),
  0x0007: T('GPS timestamp', 'location', 'high'),
  0x0008: T('GPS satellites', 'location', 'high'),
  0x0009: T('GPS status', 'location', 'high'),
  0x000a: T('Measure mode', 'location', 'high'),
  0x000b: T('GPS DOP', 'location', 'high'),
  0x000c: T('Speed ref', 'location', 'high'),
  0x000d: T('Speed', 'location', 'high'),
  0x000e: T('Track ref', 'location', 'high'),
  0x000f: T('Track', 'location', 'high'),
  0x0010: T('Image direction ref', 'location', 'high'),
  0x0011: T('Image direction', 'location', 'high'),
  0x0012: T('Map datum', 'location', 'high'),
  0x0013: T('Destination latitude ref', 'location', 'high'),
  0x0014: T('Destination latitude', 'location', 'high'),
  0x0015: T('Destination longitude ref', 'location', 'high'),
  0x0016: T('Destination longitude', 'location', 'high'),
  0x0017: T('Destination bearing ref', 'location', 'high'),
  0x0018: T('Destination bearing', 'location', 'high'),
  0x0019: T('Destination distance ref', 'location', 'high'),
  0x001a: T('Destination distance', 'location', 'high'),
  0x001b: T('Processing method', 'location', 'high'),
  0x001c: T('Area information', 'location', 'high'),
  0x001d: T('GPS date', 'location', 'high'),
  0x001e: T('Differential', 'location', 'high'),
  0x001f: T('Horizontal positioning error', 'location', 'high'),
};

export function tagInfo(ifd: IfdName, tag: number): TagInfo {
  if (ifd === 'gps') return GPS_TAGS[tag] || T(`GPS 0x${tag.toString(16)}`, 'location', 'high');
  if (ifd === 'exif') return EXIF_TAGS[tag] || T(`Unknown 0x${tag.toString(16)}`, 'image', 'medium');
  if (ifd === 'interop') return T(tag === 1 ? 'Interoperability index' : `Interop 0x${tag.toString(16)}`, 'image', 'low');
  return IFD_TAGS[tag] || T(`Unknown 0x${tag.toString(16)}`, 'image', 'medium');
}

// ---------------------------------------------------------------------------
// Human-readable values for the tags where the raw number means nothing
// ---------------------------------------------------------------------------

const ORIENTATION: Record<number, string> = {
  1: 'Normal',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored + rotated 90° CCW',
  6: 'Rotated 90° CW',
  7: 'Mirrored + rotated 90° CW',
  8: 'Rotated 90° CCW',
};

const EXPOSURE_PROGRAM = ['Not defined', 'Manual', 'Program', 'Aperture priority', 'Shutter priority', 'Creative', 'Action', 'Portrait', 'Landscape'];
const METERING = ['Unknown', 'Average', 'Centre-weighted', 'Spot', 'Multi-spot', 'Multi-segment', 'Partial'];
const WHITE_BALANCE = ['Auto', 'Manual'];
const EXPOSURE_MODE = ['Auto', 'Manual', 'Auto bracket'];
const COLOUR_SPACE: Record<number, string> = { 1: 'sRGB', 2: 'Adobe RGB', 0xffff: 'Uncalibrated' };
const RESOLUTION_UNIT: Record<number, string> = { 1: 'None', 2: 'inches', 3: 'cm' };

const pick = (list: string[], n: number) => list[n] ?? String(n);

/** Turns [deg, min, sec] plus a N/S/E/W reference into signed decimal degrees. */
export function dmsToDecimal(parts: number[], ref: string): number | null {
  if (!parts || parts.length < 2) return null;
  const [d = 0, m = 0, s = 0] = parts;
  const value = d + m / 60 + s / 3600;
  if (!Number.isFinite(value)) return null;
  const negative = ref === 'S' || ref === 'W';
  return negative ? -value : value;
}

export function formatDms(parts: number[], ref: string): string {
  const [d = 0, m = 0, s = 0] = parts;
  return `${Math.floor(d)}° ${Math.floor(m)}' ${s.toFixed(2)}" ${ref}`;
}

/**
 * Prettifies a decoded value. Falls back to the raw text whenever the tag has
 * no special meaning, so nothing is ever hidden from the user.
 */
export function formatValue(ifd: IfdName, tag: number, text: string, numbers: number[]): string {
  const n = numbers[0];
  if (ifd === 'ifd0' || ifd === 'ifd1') {
    if (tag === 0x0112 && n != null) return ORIENTATION[n] || String(n);
    if (tag === 0x0128 && n != null) return RESOLUTION_UNIT[n] || String(n);
  }
  if (ifd === 'exif') {
    if (tag === 0x829a && n) return n >= 1 ? `${n} s` : `1/${Math.round(1 / n)} s`;
    if (tag === 0x829d && n) return `f/${Math.round(n * 10) / 10}`;
    if (tag === 0x920a && n) return `${Math.round(n * 10) / 10} mm`;
    if (tag === 0xa405 && n) return `${n} mm (35mm equivalent)`;
    if (tag === 0x9204 && n != null) return `${n > 0 ? '+' : ''}${Math.round(n * 100) / 100} EV`;
    if (tag === 0x8822 && n != null) return pick(EXPOSURE_PROGRAM, n);
    if (tag === 0x9207 && n != null) return pick(METERING, n);
    if (tag === 0xa403 && n != null) return pick(WHITE_BALANCE, n);
    if (tag === 0xa402 && n != null) return pick(EXPOSURE_MODE, n);
    if (tag === 0xa001 && n != null) return COLOUR_SPACE[n] || String(n);
    if (tag === 0x9209 && n != null) return (n & 1) === 1 ? 'Fired' : 'Did not fire';
  }
  return text;
}
