// ============================================================================
// Ajustes: valores por defecto, presets y deshacer/rehacer
// ----------------------------------------------------------------------------
// El historial guarda `{ code, settings }`, nunca imágenes. `code` es una
// referencia a la MISMA cadena que ya está en el estado de React (JS no copia
// cadenas al asignarlas), y `settings` es un objeto plano de ~30 campos. Por eso
// 60 pasos de historial caben en unos pocos KB en vez de en los cientos de MB
// que costaría guardar el bitmap de cada paso.
// ============================================================================

import type { CardSettings, ExportSettings, HistoryEntry } from '../types';

export const DEFAULT_CODE = `// Pega aquí tu fragmento de código
export async function fetchUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
}`;

export const DEFAULT_SETTINGS: CardSettings = {
  language: 'typescript',
  theme: 'one-dark',
  fileName: 'fetch-user.ts',
  showLineNumbers: true,
  startLine: 1,
  wordWrap: false,
  cardWidth: 680,
  tabSize: 2,
  background: { mode: 'gradient', gradient: 'cosmic', color: '#1e1b4b' },
  padding: 48,
  borderRadius: 16,
  shadow: 'heavy',
  fontSize: 14,
  lineHeight: 1.6,
  fontFamily: 'jetbrains-mono',
  fontLigatures: true,
  windowStyle: 'mac',
  showWatermark: false,
  aspect: 'auto',
  highlightedLines: [],
  dimOthers: true,
};

export const DEFAULT_EXPORT: ExportSettings = {
  format: 'png',
  scale: 2,
  quality: 0.92,
};

/** Copia profunda barata: `background` es el único objeto anidado. */
export function cloneSettings(s: CardSettings): CardSettings {
  return { ...s, background: { ...s.background }, highlightedLines: [...s.highlightedLines] };
}

// ---------------------------------------------------------------------------
// Historial
// ---------------------------------------------------------------------------

const MAX_HISTORY = 60;

export interface History {
  entries: HistoryEntry[];
  /** Índice del estado actual dentro de `entries`. */
  index: number;
}

export const emptyHistory = (code: string, settings: CardSettings): History => ({
  entries: [{ code, settings: cloneSettings(settings) }],
  index: 0,
});

/**
 * Añade un paso. Si el usuario había deshecho, la rama futura se descarta
 * (comportamiento lineal, el que espera cualquiera que use Ctrl+Z).
 */
export function pushHistory(history: History, entry: HistoryEntry): History {
  const kept = history.entries.slice(0, history.index + 1);
  kept.push({ code: entry.code, settings: cloneSettings(entry.settings) });
  const trimmed = kept.length > MAX_HISTORY ? kept.slice(kept.length - MAX_HISTORY) : kept;
  return { entries: trimmed, index: trimmed.length - 1 };
}

export const canUndo = (h: History): boolean => h.index > 0;
export const canRedo = (h: History): boolean => h.index < h.entries.length - 1;

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

const PRESET_KEY = 'olovetools:codecard:presets';
const LAST_KEY = 'olovetools:codecard:last';

export interface Preset {
  name: string;
  settings: CardSettings;
}

/**
 * localStorage puede lanzar entero (Safari privado, navegadores endurecidos),
 * no solo devolver null, así que todo va envuelto. Sin presets la tool sigue
 * funcionando; con una excepción sin capturar, no.
 */
export function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(p => p && typeof p.name === 'string' && p.settings)
      .map(p => ({ name: String(p.name).slice(0, 40), settings: { ...DEFAULT_SETTINGS, ...p.settings } }))
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]): void {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets.slice(0, 12)));
  } catch {
    /* sin almacenamiento el preset simplemente no persiste */
  }
}

/** Últimos ajustes usados, para que volver a la tool no empiece de cero. */
export function loadLastSettings(): CardSettings | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      background: { ...DEFAULT_SETTINGS.background, ...(parsed.background || {}) },
      highlightedLines: Array.isArray(parsed.highlightedLines) ? parsed.highlightedLines : [],
    };
  } catch {
    return null;
  }
}

export function saveLastSettings(settings: CardSettings): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(settings));
  } catch {
    /* idem */
  }
}
