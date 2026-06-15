export interface PdfItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'idle' | 'processing' | 'done' | 'error';
  pageCount?: number;
  processedUrl?: string;
  error?: string;
  rotation?: number; // for rotate mode: 0, 90, 180, 270 degrees
}

export type ToolMode = 'merge' | 'split' | 'rotate' | 'jpg2pdf';
