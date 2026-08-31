// SSIM y su etiqueta viven en src/lib/imageMetrics.ts desde que FormatFlow
// necesita la misma medida: es código puro sin dependencias, y tener dos copias
// derivando por su cuenta era la única alternativa. Este archivo se queda como
// puerta de entrada para no tocar los imports de CompressSnap.
export { compareSsim, ssimBand } from '../../../lib/imageMetrics';
export type { QualityBand } from '../../../lib/imageMetrics';
