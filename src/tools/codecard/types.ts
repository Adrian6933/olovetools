export type CodeTheme = 'one-dark' | 'dracula' | 'vs-code' | 'night-owl' | 'synthwave' | 'github-light';

export type WindowStyle = 'mac' | 'windows' | 'simple' | 'none';

export type FontFamily = 'fira-code' | 'jetbrains-mono' | 'source-code-pro' | 'geist-mono';

export type ShadowStyle = 'soft' | 'heavy' | 'neon' | 'none';

export type GradientTheme = 'sunset' | 'cosmic' | 'aurora' | 'midnight' | 'emerald' | 'glass';

export interface CodecardConfig {
  code: string;
  language: string;
  theme: CodeTheme;
  showLineNumbers: boolean;
  fileName: string;
  gradientTheme: GradientTheme;
  padding: number;
  borderRadius: number;
  shadow: ShadowStyle;
  fontSize: number;
  windowStyle: WindowStyle;
  showWatermark: boolean;
  exportScale: number;
  fontFamily: FontFamily;
}
