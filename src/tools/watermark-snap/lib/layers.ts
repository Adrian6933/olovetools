// ============================================================================
// Fábricas de capas, presets rápidos y persistencia local.
// ============================================================================

import type { Anchor, BlendMode, Layer, LogoLayer, TextLayer } from '../types';

export const ANCHORS: Anchor[] = [
  'top-left', 'top-center', 'top-right',
  'mid-left', 'center', 'mid-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

export const BLEND_MODES: BlendMode[] = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'difference', 'luminosity',
];

/**
 * Las dos primeras son las tipografías que la propia página ya carga de Google
 * Fonts; el resto salen de la máquina del usuario. `ensureFonts()` espera a las
 * web antes de dibujar, porque si no el canvas rasteriza Arial sin avisar.
 */
export const FONT_OPTIONS: { value: string; label: string; web?: boolean }[] = [
  { value: "'Outfit', sans-serif", label: 'Outfit', web: true },
  { value: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta Sans', web: true },
  { value: 'system-ui, sans-serif', label: 'System Sans' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Times New Roman', serif", label: 'Times New Roman' },
  { value: "'Courier New', monospace", label: 'Courier New' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: "'Trebuchet MS', sans-serif", label: 'Trebuchet MS' },
];

export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

let counter = 0;
export function newId(prefix = 'l'): string {
  counter += 1;
  return `${prefix}${Date.now().toString(36)}${counter.toString(36)}`;
}

const commonDefaults = {
  visible: true,
  opacity: 0.45,
  rotation: 0,
  blend: 'normal' as BlendMode,
  anchor: 'bottom-right' as Anchor,
  margin: 4,
  pos: { x: 0.5, y: 0.5 },
  tile: { gapX: 60, gapY: 120, angle: -30, stagger: true },
};

export function createTextLayer(text: string, overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    ...commonDefaults,
    id: newId('t'),
    kind: 'text',
    placement: 'anchor',
    scale: 6,
    text,
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    italic: false,
    letterSpacing: 0,
    color: '#ffffff',
    stroke: { enabled: false, width: 6, color: '#000000' },
    shadow: { enabled: true, blur: 12, offset: 2, color: 'rgba(0,0,0,0.55)' },
    plate: { enabled: false, color: 'rgba(0,0,0,0.45)', padX: 30, padY: 18, radius: 30 },
    ...overrides,
  };
}

export function createLogoLayer(assetId: string, overrides: Partial<LogoLayer> = {}): LogoLayer {
  return {
    ...commonDefaults,
    id: newId('g'),
    kind: 'logo',
    placement: 'anchor',
    scale: 18,
    opacity: 0.8,
    assetId,
    ...overrides,
  };
}

export function duplicateLayer(layer: Layer): Layer {
  return JSON.parse(JSON.stringify({ ...layer, id: newId(layer.kind === 'text' ? 't' : 'g') }));
}

// ---------------------------------------------------------------------------
// Presets de un clic
// ---------------------------------------------------------------------------

export type PresetId = 'corner' | 'tiled' | 'banner' | 'stamp';

export const PRESET_IDS: PresetId[] = ['corner', 'tiled', 'banner', 'stamp'];

/** Reajusta una capa de texto existente al preset elegido, conservando el texto. */
export function applyPreset(layer: TextLayer, preset: PresetId): TextLayer {
  const base: TextLayer = { ...layer };
  switch (preset) {
    case 'corner':
      return {
        ...base,
        placement: 'anchor',
        anchor: 'bottom-right',
        margin: 4,
        scale: 5,
        rotation: 0,
        opacity: 0.6,
        blend: 'normal',
        color: '#ffffff',
        shadow: { ...base.shadow, enabled: true, blur: 12, offset: 2 },
        stroke: { ...base.stroke, enabled: false },
        plate: { ...base.plate, enabled: false },
      };
    case 'tiled':
      return {
        ...base,
        placement: 'tile',
        scale: 4,
        rotation: 0,
        opacity: 0.16,
        blend: 'overlay',
        color: '#ffffff',
        tile: { gapX: 70, gapY: 160, angle: -30, stagger: true },
        shadow: { ...base.shadow, enabled: false },
        stroke: { ...base.stroke, enabled: false },
        plate: { ...base.plate, enabled: false },
      };
    case 'banner':
      return {
        ...base,
        placement: 'anchor',
        anchor: 'bottom-center',
        margin: 3,
        scale: 5,
        rotation: 0,
        opacity: 0.95,
        blend: 'normal',
        color: '#ffffff',
        plate: { ...base.plate, enabled: true, color: 'rgba(0,0,0,0.55)', padX: 40, padY: 22, radius: 40 },
        shadow: { ...base.shadow, enabled: false },
        stroke: { ...base.stroke, enabled: false },
      };
    case 'stamp':
    default:
      return {
        ...base,
        placement: 'anchor',
        anchor: 'center',
        margin: 6,
        scale: 12,
        rotation: -22,
        opacity: 0.3,
        blend: 'normal',
        color: '#ffffff',
        stroke: { ...base.stroke, enabled: true, width: 5, color: 'rgba(0,0,0,0.6)' },
        shadow: { ...base.shadow, enabled: false },
        plate: { ...base.plate, enabled: false },
      };
  }
}

// ---------------------------------------------------------------------------
// Persistencia
// ---------------------------------------------------------------------------

const STORE_KEY = 'olovetools:watermark-snap:presets';

export interface SavedPreset {
  name: string;
  /** Solo capas de texto: un logo no se puede serializar en localStorage. */
  layers: TextLayer[];
}

export function loadSavedPresets(): SavedPreset[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function storeSavedPresets(presets: SavedPreset[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(presets.slice(0, 12)));
  } catch {
    /* modo privado o cuota llena: el preset simplemente no persiste */
  }
}
