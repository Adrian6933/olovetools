// ============================================================================
// Fondos de la tarjeta
// ----------------------------------------------------------------------------
// Antes solo había 6 degradados fijos y ninguna forma de poner un color plano,
// un hex propio o nada en absoluto (que es lo que hace falta para incrustar la
// ventana sobre el fondo de una diapositiva).
// ============================================================================

export type BackgroundMode = 'gradient' | 'solid' | 'none';

export interface GradientDef {
  id: string;
  css: string;
  /** Color representativo, para rellenar el alfa al exportar a JPEG/WebP. */
  flat: string;
}

export const GRADIENTS: GradientDef[] = [
  { id: 'sunset', css: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)', flat: '#ff9a6f' },
  { id: 'cosmic', css: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', flat: '#4643e3' },
  { id: 'aurora', css: 'linear-gradient(135deg, #0575e6 0%, #00f260 100%)', flat: '#03b4a3' },
  { id: 'midnight', css: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', flat: '#1d3743' },
  { id: 'emerald', css: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', flat: '#25c485' },
  { id: 'glass', css: 'linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)', flat: '#59546c' },
  { id: 'candy', css: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', flat: '#fb577f' },
  { id: 'mono', css: 'linear-gradient(135deg, #232526 0%, #414345 100%)', flat: '#32343e' },
  { id: 'peach', css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', flat: '#fed1b8' },
];

const BY_ID = new Map(GRADIENTS.map(g => [g.id, g]));
export const getGradient = (id: string): GradientDef => BY_ID.get(id) || GRADIENTS[1];

export interface BackgroundState {
  mode: BackgroundMode;
  gradient: string;
  /** Hex del color plano cuando mode === 'solid'. */
  color: string;
}

/** Valor de `background` en CSS. `none` deja el nodo transparente a propósito. */
export function backgroundCss(bg: BackgroundState): string {
  if (bg.mode === 'none') return 'transparent';
  if (bg.mode === 'solid') return bg.color;
  return getGradient(bg.gradient).css;
}

/** Color opaco con el que rellenar al exportar a un formato sin canal alfa. */
export function backgroundFlat(bg: BackgroundState): string {
  if (bg.mode === 'solid') return bg.color;
  if (bg.mode === 'none') return '#0b0b12';
  return getGradient(bg.gradient).flat;
}

export const SHADOWS: Record<string, string> = {
  soft: '0 20px 40px rgba(0, 0, 0, 0.25)',
  heavy: '0 30px 60px rgba(0, 0, 0, 0.5)',
  neon: '0 0 40px rgba(99, 102, 241, 0.45)',
  none: 'none',
};

export const FONTS: Record<string, string> = {
  'jetbrains-mono': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  'fira-code': '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  'source-code-pro': '"Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  'ibm-plex-mono': '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  system: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

/**
 * Relaciones de aspecto para encuadrar la tarjeta. `auto` deja que la imagen
 * mida lo que mida el código, que es lo que quiere quien la pega en un blog;
 * las demás sirven para redes, donde un recorte automático te parte el código.
 */
export const ASPECTS: { id: string; ratio: number | null }[] = [
  { id: 'auto', ratio: null },
  { id: 'square', ratio: 1 },
  { id: 'wide', ratio: 16 / 9 },
  { id: 'social', ratio: 1.91 },
  { id: 'portrait', ratio: 4 / 5 },
];

export const getAspectRatio = (id: string): number | null =>
  ASPECTS.find(a => a.id === id)?.ratio ?? null;
