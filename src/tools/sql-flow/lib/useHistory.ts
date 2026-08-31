// ============================================================================
// Undo/redo barato.
// ----------------------------------------------------------------------------
// Sólo se guardan cadenas, y las pulsaciones seguidas se funden en una entrada
// (si no, cada tecla sería un paso de undo y la pila crecería sin control).
// El tope está en caracteres totales, no en número de entradas: 40 versiones de
// un volcado de 2 MB serían 80 MB de RAM.
// ============================================================================

import { useCallback, useRef, useState } from 'react';

const MAX_ENTRIES = 60;
const MAX_CHARS = 4_000_000;
/** Escrituras separadas por menos de esto se consideran la misma edición. */
const COALESCE_MS = 500;

interface HistoryState {
  past: string[];
  present: string;
  future: string[];
}

export function useHistory(initial = '') {
  const [state, setState] = useState<HistoryState>({ past: [], present: initial, future: [] });
  const lastPush = useRef(0);

  const set = useCallback((next: string, options?: { checkpoint?: boolean }) => {
    const now = Date.now();
    const checkpoint = options?.checkpoint ?? false;
    setState(prev => {
      if (next === prev.present) return prev;
      const coalesce = !checkpoint && now - lastPush.current < COALESCE_MS && prev.past.length > 0;
      lastPush.current = now;
      if (coalesce) return { past: prev.past, present: next, future: [] };

      let past = [...prev.past, prev.present];
      let chars = past.reduce((sum, entry) => sum + entry.length, 0);
      while (past.length > MAX_ENTRIES || (chars > MAX_CHARS && past.length > 1)) {
        chars -= past[0].length;
        past = past.slice(1);
      }
      return { past, present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (!prev.past.length) return prev;
      const present = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present,
        future: [prev.present, ...prev.future].slice(0, MAX_ENTRIES),
      };
    });
    lastPush.current = 0;
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (!prev.future.length) return prev;
      return {
        past: [...prev.past, prev.present],
        present: prev.future[0],
        future: prev.future.slice(1),
      };
    });
    lastPush.current = 0;
  }, []);

  const reset = useCallback((value = '') => {
    setState({ past: [], present: value, future: [] });
    lastPush.current = 0;
  }, []);

  return {
    text: state.present,
    setText: set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    depth: state.past.length,
  };
}
