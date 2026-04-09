
export interface Resolution {
  quality: string;
  fps: number;
  url: string;
  size: string; // e.g., "25.4 MB" or "High"
}

export interface ClipData {
  id: string;
  title: string;
  broadcaster: string;
  broadcasterImg: string;
  thumbnail: string;
  duration: number; // seconds
  date: string;
  views: number;
  resolutions: Resolution[];
}

export interface ClipItem {
  id: string; // url
  url: string;
  status: 'loading' | 'success' | 'error';
  data?: ClipData;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
