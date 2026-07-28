
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

export type PresetPositionId = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'center' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right' 
  | 'custom';

export interface PositionPreset {
  id: string;
  name: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  isDefault?: boolean;
}

export type EntryEffect = 
  | 'none' 
  | 'fade' 
  | 'slide-down' 
  | 'slide-up' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom'
  | 'bounce'
  | 'rotate-in'
  | 'pop-in'
  | 'flip-x'
  | 'typewriter';

export type ExitEffect = 
  | 'none' 
  | 'fade' 
  | 'slide-down' 
  | 'slide-up' 
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'rotate-out'
  | 'pop-out';

export type AnimationEasing = 'linear' | 'ease-out' | 'bounce' | 'elastic';

export type FontFamily = 
  | 'sans' 
  | 'montserrat' 
  | 'impact' 
  | 'bebas'
  | 'orbitron'
  | 'righteous'
  | 'pixel'
  | 'mono' 
  | 'serif' 
  | 'handwriting';

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type FontWeight = 'normal' | 'bold' | '900';

export interface WatermarkConfig {
  enabled: boolean;
  template: string;
  positionId: string;
  customX: number;
  customY: number;
  fontFamily: FontFamily;
  fontSize: number;
  textColor: string;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  shadow: boolean;
  shadowColor: string;
  showIcon: boolean;
  entryEffect: EntryEffect;
  entryDuration: number;
  exitEffect: ExitEffect;
  exitDuration: number;
  // Advanced text & shadow styling properties
  textTransform?: TextTransform;
  fontWeight?: FontWeight;
  fontStyle?: 'normal' | 'italic';
  letterSpacing?: number; // px
  stroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number; // px
  strokeOpacity?: number; // 0 - 1
  strokeJoin?: 'round' | 'miter' | 'bevel';
  shadowBlur?: number; // px
  shadowOffsetX?: number; // px
  shadowOffsetY?: number; // px
  glowMode?: boolean;
  boxBorder?: boolean;
  boxBorderColor?: string;
  boxBorderWidth?: number;
  // New animation properties
  entryDelay?: number; // seconds to delay entry animation
  animationEasing?: AnimationEasing;
}



