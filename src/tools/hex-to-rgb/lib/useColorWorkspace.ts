// ============================================================================
// Estado del banco de trabajo: la paleta, el color activo, el fondo de
// contraste y el historial.
//
// El historial guarda instantáneas de CADENAS hex, no objetos de color ni
// nada renderizado: una instantánea completa de una paleta de ocho colores
// ocupa unos 90 bytes, así que cien pasos de deshacer caben en 9 KB.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatHex, parseColor, type Rgb } from './color';
import { decodeStateFromSearch, encodeStateToHash } from './export';

export interface Snapshot {
  /** hex de 8 dígitos, en minúsculas y sin `#`. */
  colors: string[];
  active: number;
  bg: string;
}

const HISTORY_LIMIT = 100;
export const MAX_COLORS = 8;

const DEFAULT_SNAPSHOT: Snapshot = {
  colors: ['ff6347ff'],
  active: 0,
  bg: 'ffffffff',
};

const toKey = (rgb: Rgb): string => {
  const h = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0');
  return (h(rgb.r) + h(rgb.g) + h(rgb.b) + h(rgb.a * 255)).toLowerCase();
};

const fromKey = (key: string): Rgb => {
  const n = (i: number) => parseInt(key.slice(i, i + 2), 16);
  return { r: n(0), g: n(2), b: n(4), a: key.length >= 8 ? n(6) / 255 : 1 };
};

export const rgbToKey = toKey;
export const keyToRgb = fromKey;

const sameSnapshot = (a: Snapshot, b: Snapshot) =>
  a.active === b.active && a.bg === b.bg && a.colors.join() === b.colors.join();

export interface Workspace {
  snapshot: Snapshot;
  colors: Rgb[];
  active: Rgb;
  activeIndex: number;
  bg: Rgb;
  canUndo: boolean;
  canRedo: boolean;
  /** Color de referencia para el "mantén pulsado para comparar": el que había
   *  antes de la última tanda de ajustes derivados (rampa, armonía, mezcla). */
  baseline: Rgb | null;

  setActiveColor: (rgb: Rgb, options?: { baseline?: boolean }) => void;
  setActiveIndex: (index: number) => void;
  setBg: (rgb: Rgb) => void;
  addColor: (rgb: Rgb) => void;
  addColors: (list: Rgb[]) => void;
  removeColor: (index: number) => void;
  replaceAll: (list: Rgb[]) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const useColorWorkspace = (): Workspace => {
  const [history, setHistory] = useState<Snapshot[]>([DEFAULT_SNAPSHOT]);
  const [cursor, setCursor] = useState(0);
  const [baselineKey, setBaselineKey] = useState<string | null>(null);

  const snapshot = history[cursor] ?? DEFAULT_SNAPSHOT;

  // La URL se lee una sola vez, ya montado: `window` no existe en el render de
  // servidor y leerlo durante la hidratación desemparejaría el árbol.
  useEffect(() => {
    const decoded = decodeStateFromSearch(window.location.search);
    if (!decoded) return;
    setHistory([
      {
        colors: decoded.colors.slice(0, MAX_COLORS).map(toKey),
        active: 0,
        bg: decoded.bg ? toKey(decoded.bg) : DEFAULT_SNAPSHOT.bg,
      },
    ]);
    setCursor(0);
  }, []);

  // Y se reescribe con `replaceState` (no `pushState`): el botón atrás del
  // navegador debe sacarte de la herramienta, no recorrer tus cincuenta
  // últimos toques al deslizador de croma.
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const query = encodeStateToHash(snapshot.colors.map(fromKey), fromKey(snapshot.bg));
      window.history.replaceState({}, '', `${window.location.pathname}?${query}`);
    }, 400);
    return () => clearTimeout(urlTimer.current);
  }, [snapshot]);

  const commit = useCallback(
    (next: Snapshot) => {
      setHistory((prev) => {
        const current = prev[cursor];
        if (current && sameSnapshot(current, next)) return prev;
        const trimmed = prev.slice(0, cursor + 1);
        trimmed.push(next);
        const overflow = Math.max(0, trimmed.length - HISTORY_LIMIT);
        const sliced = trimmed.slice(overflow);
        // El cursor se recalcula aquí y no en un setState anidado dentro de
        // este updater: encadenar setState dentro de otro updater hace que
        // React lo ejecute dos veces en modo estricto y el historial se duplica.
        setCursor(sliced.length - 1);
        return sliced;
      });
    },
    [cursor]
  );

  const colors = useMemo(() => snapshot.colors.map(fromKey), [snapshot.colors]);
  const bg = useMemo(() => fromKey(snapshot.bg), [snapshot.bg]);
  const activeIndex = Math.min(snapshot.active, snapshot.colors.length - 1);
  const active = colors[activeIndex] ?? fromKey(DEFAULT_SNAPSHOT.colors[0]);

  const setActiveColor = useCallback(
    (rgb: Rgb, options?: { baseline?: boolean }) => {
      const next = { ...snapshot, colors: [...snapshot.colors] };
      next.colors[activeIndex] = toKey(rgb);
      if (options?.baseline) setBaselineKey(toKey(rgb));
      commit(next);
    },
    [snapshot, activeIndex, commit]
  );

  const setActiveIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= snapshot.colors.length) return;
      setBaselineKey(snapshot.colors[index]);
      commit({ ...snapshot, active: index });
    },
    [snapshot, commit]
  );

  const setBg = useCallback((rgb: Rgb) => commit({ ...snapshot, bg: toKey(rgb) }), [snapshot, commit]);

  const addColor = useCallback(
    (rgb: Rgb) => {
      if (snapshot.colors.length >= MAX_COLORS) return;
      const colorsNext = [...snapshot.colors, toKey(rgb)];
      commit({ ...snapshot, colors: colorsNext, active: colorsNext.length - 1 });
    },
    [snapshot, commit]
  );

  const addColors = useCallback(
    (list: Rgb[]) => {
      if (!list.length) return;
      const room = MAX_COLORS - snapshot.colors.length;
      if (room <= 0) return;
      const colorsNext = [...snapshot.colors, ...list.slice(0, room).map(toKey)];
      commit({ ...snapshot, colors: colorsNext, active: snapshot.colors.length });
    },
    [snapshot, commit]
  );

  const removeColor = useCallback(
    (index: number) => {
      if (snapshot.colors.length <= 1) return;
      const colorsNext = snapshot.colors.filter((_, i) => i !== index);
      commit({
        ...snapshot,
        colors: colorsNext,
        active: Math.min(snapshot.active, colorsNext.length - 1),
      });
    },
    [snapshot, commit]
  );

  const replaceAll = useCallback(
    (list: Rgb[]) => {
      if (!list.length) return;
      commit({ ...snapshot, colors: list.slice(0, MAX_COLORS).map(toKey), active: 0 });
    },
    [snapshot, commit]
  );

  const undo = useCallback(() => setCursor((c) => Math.max(0, c - 1)), []);
  const redo = useCallback(
    () => setCursor((c) => Math.min(history.length - 1, c + 1)),
    [history.length]
  );
  const reset = useCallback(() => {
    setHistory([DEFAULT_SNAPSHOT]);
    setCursor(0);
    setBaselineKey(null);
  }, []);

  return {
    snapshot,
    colors,
    active,
    activeIndex,
    bg,
    canUndo: cursor > 0,
    canRedo: cursor < history.length - 1,
    baseline: baselineKey ? fromKey(baselineKey) : null,
    setActiveColor,
    setActiveIndex,
    setBg,
    addColor,
    addColors,
    removeColor,
    replaceAll,
    undo,
    redo,
    reset,
  };
};

/** `#RRGGBB` listo para un `<input type="color">`, que no admite alfa. */
export const toPickerValue = (rgb: Rgb) => formatHex(rgb);

/** Normaliza cualquier entrada del usuario a un color, o null. */
export const readColor = (input: string): Rgb | null => parseColor(input).rgb;
