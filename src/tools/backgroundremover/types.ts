export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  processedSize: number | null;
  originalUrl: string;
  processedUrl: string | null;
  status: 'idle' | 'loading_model' | 'processing' | 'done' | 'error';
  error?: string;
}
