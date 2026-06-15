export interface CompressSettings {
  quality: number; // 1 to 100
  format: 'original' | 'image/jpeg' | 'image/png' | 'image/webp';
  scale: number; // 10 to 100 (percentage of original size)
  resizeMode: 'none' | 'scale' | 'dimensions';
  width: number;
  height: number;
  maintainAspectRatio: boolean;
}

export interface CompressedImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize: number | null;
  originalUrl: string;
  compressedUrl: string | null;
  width: number | null;
  height: number | null;
  compressedWidth: number | null;
  compressedHeight: number | null;
  status: 'idle' | 'compressing' | 'done' | 'error';
  savings: number | null;
  error?: string;
  settings?: CompressSettings; // Individual settings override
}
