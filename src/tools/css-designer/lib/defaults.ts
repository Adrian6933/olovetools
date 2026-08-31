// ============================================================================
// Starting values and preset libraries.
// ============================================================================

import type { Design, ShadowLayer, GradientStop, TabId } from '../types';

let seq = 0;
/** Ids only need to be unique inside one session, and stable across renders. */
export const nextId = (prefix = 'x'): string => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

export const DEFAULT_DESIGN: Design = {
  glass: {
    blur: 16,
    opacity: 0.14,
    saturation: 140,
    brightness: 105,
    borderWidth: 1,
    borderOpacity: 0.22,
    bgColor: '#ffffff',
    borderColor: '#ffffff',
    radius: 24,
    innerHighlight: true,
    shadowStrength: 0.35,
  },
  shadow: {
    layers: [
      { id: 'l1', enabled: true, inset: false, x: 0, y: 1, blur: 2, spread: 0, color: '#0b0716', opacity: 0.28 },
      { id: 'l2', enabled: true, inset: false, x: 0, y: 8, blur: 16, spread: -4, color: '#0b0716', opacity: 0.32 },
      { id: 'l3', enabled: true, inset: false, x: 0, y: 24, blur: 48, spread: -12, color: '#0b0716', opacity: 0.4 },
    ],
    cardBg: '#1e1b4b',
    radius: 24,
  },
  gradient: {
    kind: 'linear',
    repeating: false,
    angle: 135,
    shape: 'circle',
    size: 'farthest-corner',
    posX: 50,
    posY: 50,
    interpolation: 'oklab',
    stops: [
      { id: 'g1', color: '#8b5cf6', position: 0, opacity: 1 },
      { id: 'g2', color: '#ec4899', position: 100, opacity: 1 },
    ],
  },
  radius: {
    linked: true,
    tl: 24,
    tr: 24,
    br: 24,
    bl: 24,
    unit: 'px',
    organic: false,
    organicValue: '30% 70% 70% 30% / 30% 30% 70% 70%',
    fill: '#6366f1',
  },
  filter: {
    backdrop: false,
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    opacity: 100,
    dropShadowOn: false,
    dropShadowX: 0,
    dropShadowY: 8,
    dropShadowBlur: 16,
    dropShadowColor: '#8b5cf6',
  },
};

export const TAB_ORDER: TabId[] = ['glass', 'shadow', 'gradient', 'radius', 'filter'];

// ---------------------------------------------------------------------------
// Shadow presets. `key` is a dictionary key; `fallback` is the English label.
// ---------------------------------------------------------------------------

const layer = (
  y: number,
  blur: number,
  spread: number,
  opacity: number,
  color = '#0b0716',
  inset = false
): Omit<ShadowLayer, 'id'> => ({ enabled: true, inset, x: 0, y, blur, spread, color, opacity });

export interface ShadowPreset {
  id: string;
  key: string;
  fallback: string;
  layers: Omit<ShadowLayer, 'id'>[];
  cardBg?: string;
}

export const SHADOW_PRESETS: ShadowPreset[] = [
  {
    id: 'soft',
    key: 'preset_shadow_soft',
    fallback: 'Soft lift',
    layers: [layer(1, 2, 0, 0.24), layer(0, 8, -2, 0.18)],
  },
  {
    id: 'elevated',
    key: 'preset_shadow_elevated',
    fallback: 'Elevated card',
    layers: [layer(1, 2, 0, 0.28), layer(8, 16, -4, 0.32), layer(24, 48, -12, 0.4)],
  },
  {
    id: 'floating',
    key: 'preset_shadow_floating',
    fallback: 'Floating',
    layers: [layer(2, 6, -1, 0.2), layer(12, 24, -6, 0.28), layer(40, 80, -20, 0.45)],
  },
  {
    id: 'hardLong',
    key: 'preset_shadow_hard',
    fallback: 'Hard offset',
    layers: [{ ...layer(0, 0, 0, 1, '#8b5cf6'), x: 8, y: 8 }],
  },
  {
    id: 'glow',
    key: 'preset_shadow_glow',
    fallback: 'Neon glow',
    layers: [layer(0, 12, -2, 0.55, '#a855f7'), layer(0, 40, 0, 0.35, '#7c3aed')],
  },
  {
    id: 'neuOut',
    key: 'preset_shadow_neu_out',
    fallback: 'Neumorphic raised',
    cardBg: '#e0e5ec',
    layers: [
      { ...layer(0, 20, 0, 0.55, '#a3b1c6'), x: 10, y: 10 },
      { ...layer(0, 20, 0, 0.9, '#ffffff'), x: -10, y: -10 },
    ],
  },
  {
    id: 'neuIn',
    key: 'preset_shadow_neu_in',
    fallback: 'Neumorphic pressed',
    cardBg: '#e0e5ec',
    layers: [
      { ...layer(0, 16, 0, 0.55, '#a3b1c6', true), x: 8, y: 8 },
      { ...layer(0, 16, 0, 0.9, '#ffffff', true), x: -8, y: -8 },
    ],
  },
  {
    id: 'inner',
    key: 'preset_shadow_inner',
    fallback: 'Inner depth',
    layers: [layer(2, 6, 0, 0.5, '#000000', true), layer(0, 24, -6, 0.35, '#000000', true)],
  },
];

// ---------------------------------------------------------------------------
// Gradient presets
// ---------------------------------------------------------------------------

const stops = (...pairs: [string, number][]): Omit<GradientStop, 'id'>[] =>
  pairs.map(([color, position]) => ({ color, position, opacity: 1 }));

export interface GradientPreset {
  id: string;
  key: string;
  fallback: string;
  angle: number;
  kind?: 'linear' | 'radial' | 'conic';
  stops: Omit<GradientStop, 'id'>[];
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'violet', key: 'preset_grad_violet', fallback: 'Violet dusk', angle: 135, stops: stops(['#8b5cf6', 0], ['#ec4899', 100]) },
  { id: 'sunrise', key: 'preset_grad_sunrise', fallback: 'Sunrise', angle: 120, stops: stops(['#f97316', 0], ['#fbbf24', 50], ['#fde68a', 100]) },
  { id: 'ocean', key: 'preset_grad_ocean', fallback: 'Deep ocean', angle: 160, stops: stops(['#0ea5e9', 0], ['#1e3a8a', 100]) },
  { id: 'mint', key: 'preset_grad_mint', fallback: 'Mint glass', angle: 100, stops: stops(['#34d399', 0], ['#06b6d4', 100]) },
  { id: 'ember', key: 'preset_grad_ember', fallback: 'Ember', angle: 45, stops: stops(['#7f1d1d', 0], ['#ef4444', 55], ['#fca5a5', 100]) },
  { id: 'aurora', key: 'preset_grad_aurora', fallback: 'Aurora', angle: 210, stops: stops(['#22d3ee', 0], ['#a78bfa', 45], ['#f472b6', 100]) },
  { id: 'spotlight', key: 'preset_grad_spotlight', fallback: 'Spotlight', angle: 0, kind: 'radial', stops: stops(['#fef3c7', 0], ['#78350f', 100]) },
  { id: 'wheel', key: 'preset_grad_wheel', fallback: 'Colour wheel', angle: 0, kind: 'conic', stops: stops(['#ef4444', 0], ['#eab308', 25], ['#22c55e', 50], ['#3b82f6', 75], ['#ef4444', 100]) },
];

// ---------------------------------------------------------------------------
// Organic border-radius presets
// ---------------------------------------------------------------------------

export interface RadiusPreset {
  id: string;
  key: string;
  fallback: string;
  value: string;
}

export const RADIUS_PRESETS: RadiusPreset[] = [
  { id: 'oval', key: 'preset_radius_oval', fallback: 'Organic oval', value: '30% 70% 70% 30% / 30% 30% 70% 70%' },
  { id: 'leaf', key: 'preset_radius_leaf', fallback: 'Curved leaf', value: '60% 40% 30% 70% / 60% 30% 70% 40%' },
  { id: 'drop', key: 'preset_radius_drop', fallback: 'Water drop', value: '50% 50% 50% 50% / 10% 90% 10% 90%' },
  { id: 'pebble', key: 'preset_radius_pebble', fallback: 'Smooth pebble', value: '69% 31% 66% 34% / 21% 30% 70% 79%' },
  { id: 'egg', key: 'preset_radius_egg', fallback: 'Egg', value: '50% 50% 50% 50% / 30% 30% 70% 70%' },
  { id: 'blob', key: 'preset_radius_blob', fallback: 'Lava blob', value: '38% 62% 55% 45% / 46% 34% 66% 54%' },
  { id: 'petal', key: 'preset_radius_petal', fallback: 'Petal', value: '80% 20% 80% 20% / 20% 80% 20% 80%' },
  { id: 'capsule', key: 'preset_radius_capsule', fallback: 'Capsule', value: '999px' },
];

// ---------------------------------------------------------------------------
// Filter presets
// ---------------------------------------------------------------------------

export interface FilterPreset {
  id: string;
  key: string;
  fallback: string;
  patch: Partial<Design['filter']>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'none', key: 'preset_filter_none', fallback: 'None', patch: { blur: 0, brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, grayscale: 0, sepia: 0, invert: 0, opacity: 100 } },
  { id: 'vivid', key: 'preset_filter_vivid', fallback: 'Vivid', patch: { saturate: 150, contrast: 115, brightness: 104 } },
  { id: 'faded', key: 'preset_filter_faded', fallback: 'Faded film', patch: { saturate: 72, contrast: 88, brightness: 108, sepia: 18 } },
  { id: 'noir', key: 'preset_filter_noir', fallback: 'Noir', patch: { grayscale: 100, contrast: 128, brightness: 96 } },
  { id: 'duotone', key: 'preset_filter_duotone', fallback: 'Hue shift', patch: { hueRotate: 190, saturate: 130 } },
  { id: 'frost', key: 'preset_filter_frost', fallback: 'Frosted', patch: { blur: 6, brightness: 112, saturate: 130 } },
];
