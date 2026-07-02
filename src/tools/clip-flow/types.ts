export interface VodInfo {
  videoId: string;
  title: string;
  broadcaster: string;
  broadcasterImg: string;
  thumbnail: string;
  lengthSeconds: number;
  createdAt: string;
  isLive?: boolean;
}

export interface VodQuality {
  quality: string; // "Source", "720p60", "480p"...
  fps: number;
  bandwidth: number;
  url: string; // media playlist URL
}

export interface HlsSegment {
  url: string;
  duration: number; // seconds, from #EXTINF
  start: number; // cumulative offset in seconds
}

export interface SegmentIndex {
  segments: HlsSegment[];
  totalDuration: number;
  baseUrl: string;
}

export interface Cut {
  id: string;
  start: number;
  end: number;
  label: string;
  color: string;
}

export type CutExportStatus = 'idle' | 'downloading' | 'processing' | 'done' | 'error';

export interface CutExportState {
  status: CutExportStatus;
  progress: number; // 0-100
  phaseLabel?: string;
  error?: string;
}

export type FfmpegLoadState = 'unloaded' | 'loading' | 'ready' | 'failed';

export type Phase = 'input' | 'loading' | 'editor';

export const CUT_COLORS = ['#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
