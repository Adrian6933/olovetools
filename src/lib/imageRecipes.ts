import type { CompressSettings } from '../tools/compresssnap/lib/types';
import type { Settings } from '../tools/formatflow/lib/types';
const number = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const bool = (v: unknown) => typeof v === 'boolean';
function common(s: any): boolean {
  return s !== null && typeof s === 'object' && !Array.isArray(s)
    && number(s.quality, 1, 100) && number(s.scale, 1, 400)
    && ['none', 'scale', 'dimensions', 'longEdge'].includes(s.resizeMode)
    && ['width', 'height', 'longEdge'].every(k => number(s[k], 1, 16384)) && bool(s.measureQuality);
}
export function isCompressRecipe(v: unknown): v is CompressSettings {
  const s = v as CompressSettings;
  return common(s) && ['original', 'image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(s.format)
    && (s.targetBytes === null || number(s.targetBytes, 1, 512 * 1024 * 1024))
    && (s.pngColors === 0 || number(s.pngColors, 2, 256)) && Number.isInteger(s.pngColors)
    && bool(s.dither) && bool(s.maintainAspectRatio);
}
export function isFormatRecipe(v: unknown): v is Settings {
  const s = v as Settings;
  return common(s) && ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'ico', 'pdf', 'tiff', 'svg'].includes(s.format)
    && number(s.targetBytes, 0, 512 * 1024 * 1024) && number(s.sharpen, 0, 100)
    && ['contain', 'cover', 'stretch'].includes(s.fit) && [0, 90, 180, 270].includes(s.rotate)
    && [s.flipH, s.flipV, s.lockAspect].every(bool)
    && typeof s.background === 'string' && /^#[\da-f]{6}$/i.test(s.background);
}
