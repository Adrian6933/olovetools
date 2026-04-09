
export enum ImageFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  AVIF = 'image/avif',
  GIF = 'image/gif',
  HEIC = 'image/heic',
  SVG = 'image/svg+xml',
  EPS = 'application/postscript',
  PDF = 'application/pdf',
  ICO = 'image/x-icon',
  TIFF = 'image/tiff',
  RAW = 'image/x-raw',
}

export interface ConversionSettings {
  format: ImageFormat;
  quality: number; // 0 to 1
  scale: number; // 0.1 to 3 (300%)
}

export interface BatchImageItem {
  id: string;
  file: File;
  sourceBlob: Blob; // Used for processing (e.g. converted HEIC->JPEG blob)
  previewUrl: string;
  width: number;
  height: number;
  originalSize: number;
  settings?: ConversionSettings;
}

export interface ConversionResult {
  url: string;
  blob: Blob;
  size: number;
}

