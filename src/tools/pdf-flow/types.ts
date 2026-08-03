export interface PdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  pageCount?: number;
  processedUrl?: string;
  error?: string;
  rotation?: number; // for organise mode: 0, 90, 180, 270 degrees
}

/**
 * `organize` replaces the old `rotate`: rotating, reordering and deleting pages
 * are the same gesture on the same grid, and splitting them into separate modes
 * meant re-uploading the file to do the next one.
 */
export type ToolMode =
  | 'view'
  | 'merge'
  | 'split'
  | 'organize'
  | 'compress'
  | 'pdf2img'
  | 'jpg2pdf'
  | 'watermark'
  | 'pagenum'
  | 'extract';

/** A finished operation, kept on screen instead of auto-downloaded and forgotten. */
export interface PdfResult {
  blob: Blob;
  url: string;
  filename: string;
  size: number;
  /** Size of the input, when the comparison is meaningful (compress). */
  originalSize?: number;
  /** Set when the result is a single PDF we can preview. */
  previewUrl?: string;
  kind: 'pdf' | 'zip' | 'image' | 'text';
}
