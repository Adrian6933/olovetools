// ============================================================================
// Estado del conversor: historial barato, URL compartible y favoritos.
// ----------------------------------------------------------------------------
// El historial guarda instantáneas de CUATRO CADENAS (categoría, unidad origen,
// unidad destino y el texto tecleado). No guarda tablas ni resultados: todo eso
// se recalcula en microsegundos a partir de ahí, así que cien pasos de deshacer
// ocupan unos pocos kilobytes en vez de arrastrar el estado entero.
//
// Pasado, presente y futuro viven en UN SOLO useState. Tenerlos en tres estados
// separados obligaba a llamar a un setState dentro del updater de otro, que en
// StrictMode se ejecuta dos veces y dejaba el "deshacer" sin efecto.
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { CATEGORIES, CATEGORY_BY_ID, findUnit, type CategoryId } from './units';
import type { FormatOptions, Rational } from './rational';

export interface Snapshot {
  category: CategoryId;
  from: string;
  to: string;
  input: string;
  /**
   * Cantidad exacta en la unidad base, cuando el valor NO viene de interpretar
   * el texto. Al intercambiar unidades, el texto que se escribe en el campo ya
   * está redondeado; guardar aquí la fracción original hace que ir y volver
   * devuelva el número de partida en vez de degradarlo un dígito cada vez.
   * Se descarta en cuanto el usuario toca el texto o la unidad de entrada.
   */
  exact?: Rational | null;
}

const FIRST = CATEGORIES[0];

export const INITIAL: Snapshot = {
  category: FIRST.id,
  from: FIRST.defaults[0],
  to: FIRST.defaults[1],
  input: '1',
  exact: null,
};

/** Tope del historial. Cada entrada son cuatro cadenas cortas. */
const HISTORY_LIMIT = 200;

const FAVORITES_KEY = 'unitflow:favorites';
const FORMAT_KEY = 'unitflow:format';

interface History {
  past: Snapshot[];
  present: Snapshot;
  /** Última instantánea sellada: contra ella se mide si hay borrador pendiente. */
  sealed: Snapshot;
  future: Snapshot[];
}

export interface Converter {
  snapshot: Snapshot;
  /** Cambia el estado registrando un paso de historial. */
  commit: (patch: Partial<Snapshot>) => void;
  /** Cambia el estado SIN registrar historial (teclear letra a letra). */
  draft: (patch: Partial<Snapshot>) => void;
  /** Cierra el borrador actual: convierte lo tecleado en un paso deshacible. */
  seal: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;
  favorites: string[];
  toggleFavorite: (categoryId: string, unitId: string) => void;
  isFavorite: (categoryId: string, unitId: string) => boolean;
}

const same = (a: Snapshot, b: Snapshot): boolean =>
  a.category === b.category && a.from === b.from && a.to === b.to && a.input === b.input;

const trim = (stack: Snapshot[]): Snapshot[] =>
  stack.length > HISTORY_LIMIT ? stack.slice(stack.length - HISTORY_LIMIT) : stack;

/**
 * Aplica un parche descartando el valor exacto cuando deja de ser válido.
 * Tocar el texto o la unidad de entrada significa "reinterpreta lo escrito",
 * así que la fracción guardada ya no representa lo mismo.
 */
function apply(present: Snapshot, patch: Partial<Snapshot>): Snapshot {
  const invalidates = patch.input !== undefined || patch.from !== undefined || patch.category !== undefined;
  const exact = patch.exact !== undefined ? patch.exact : invalidates ? null : present.exact;
  return { ...present, ...patch, exact };
}

export function useConverter(defaultFormat: FormatOptions): {
  converter: Converter;
  fmt: FormatOptions;
  setFmt: (next: FormatOptions) => void;
} {
  const [history, setHistory] = useState<History>({
    past: [],
    present: INITIAL,
    sealed: INITIAL,
    future: [],
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [fmt, setFmtState] = useState<FormatOptions>(defaultFormat);

  const snapshot = history.present;

  // ---------------------------------------------------------------------
  // Arranque: URL, favoritos y preferencias de formato.
  // Todo en un efecto y no en el estado inicial, porque el HTML del servidor
  // no conoce ni la URL del cliente ni su localStorage: leerlos durante el
  // primer render rompería la hidratación de la isla.
  // ---------------------------------------------------------------------
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const categoryId = params.get('c') as CategoryId | null;
      const category = categoryId ? CATEGORY_BY_ID[categoryId] : null;
      if (category) {
        const from = params.get('f');
        const to = params.get('t');
        const value = params.get('v');
        const next: Snapshot = {
          category: category.id,
          from: from && findUnit(category, from) ? from : category.defaults[0],
          to: to && findUnit(category, to) ? to : category.defaults[1],
          input: value ?? '1',
          exact: null,
        };
        setHistory({ past: [], present: next, sealed: next, future: [] });
      }
      const notation = params.get('n');
      const digits = params.get('d');
      if (notation || digits) {
        setFmtState(current => ({
          ...current,
          notation: (['auto', 'fixed', 'significant', 'scientific', 'engineering'] as const).includes(
            notation as any
          )
            ? (notation as FormatOptions['notation'])
            : current.notation,
          digits:
            digits && Number.isFinite(Number(digits))
              ? Math.max(1, Math.min(20, Number(digits)))
              : current.digits,
        }));
      }
    } catch {
      // URL rara o bloqueada: el estado por defecto sigue siendo válido.
    }

    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setFavorites(parsed.filter((x: unknown) => typeof x === 'string'));
      }
      const storedFormat = localStorage.getItem(FORMAT_KEY);
      if (storedFormat) {
        const parsed = JSON.parse(storedFormat);
        if (parsed && typeof parsed === 'object') setFmtState(current => ({ ...current, ...parsed }));
      }
    } catch {
      // Modo privado o almacenamiento lleno: se sigue sin favoritos guardados.
    }
  }, []);

  // La URL se reescribe con replaceState y no con push: el botón "atrás" del
  // navegador debe sacarte de la herramienta, no recorrer cada tecla pulsada.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const params = new URLSearchParams();
        params.set('c', snapshot.category);
        params.set('f', snapshot.from);
        params.set('t', snapshot.to);
        if (snapshot.input) params.set('v', snapshot.input);
        if (fmt.notation !== 'auto') params.set('n', fmt.notation);
        if (fmt.digits !== 12) params.set('d', String(fmt.digits));
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      } catch {
        // Sin permiso para tocar el historial: no es un fallo de la conversión.
      }
    }, 400);
    return () => clearTimeout(id);
  }, [snapshot, fmt]);

  const setFmt = useCallback((next: FormatOptions) => {
    setFmtState(next);
    try {
      localStorage.setItem(FORMAT_KEY, JSON.stringify(next));
    } catch {
      // Sin almacenamiento: la preferencia dura lo que dure la pestaña.
    }
  }, []);

  const draft = useCallback((patch: Partial<Snapshot>) => {
    setHistory(h => {
      const next = apply(h.present, patch);
      return same(next, h.present) && next.exact === h.present.exact ? h : { ...h, present: next };
    });
  }, []);

  const commit = useCallback((patch: Partial<Snapshot>) => {
    setHistory(h => {
      const next = apply(h.present, patch);
      if (same(next, h.present) && next.exact === h.present.exact) return h;
      // Si había un borrador a medio teclear, se sella antes de apilar el paso
      // nuevo: así el "deshacer" vuelve a lo que el usuario veía, no a dos
      // cambios atrás.
      const pending = same(h.present, h.sealed) ? [h.sealed] : [h.sealed, h.present];
      return { past: trim([...h.past, ...pending]), present: next, sealed: next, future: [] };
    });
  }, []);

  const seal = useCallback(() => {
    setHistory(h => {
      if (same(h.present, h.sealed)) return h;
      return { past: trim([...h.past, h.sealed]), present: h.present, sealed: h.present, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      // Un borrador sin sellar cuenta como paso: deshacer lo devuelve primero.
      if (!same(h.present, h.sealed)) {
        return { past: h.past, present: h.sealed, sealed: h.sealed, future: [...h.future, h.present] };
      }
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return {
        past: h.past.slice(0, -1),
        present: previous,
        sealed: previous,
        future: [...h.future, h.present],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(h => {
      if (h.future.length === 0) return h;
      const next = h.future[h.future.length - 1];
      return {
        past: trim([...h.past, h.present]),
        present: next,
        sealed: next,
        future: h.future.slice(0, -1),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setHistory(h => {
      if (same(h.present, INITIAL) && !h.present.exact) return h;
      return { past: trim([...h.past, h.present]), present: INITIAL, sealed: INITIAL, future: [] };
    });
  }, []);

  const toggleFavorite = useCallback((categoryId: string, unitId: string) => {
    const key = `${categoryId}:${unitId}`;
    setFavorites(current => {
      const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Sin almacenamiento: los favoritos duran lo que dure la pestaña.
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (categoryId: string, unitId: string) => favorites.includes(`${categoryId}:${unitId}`),
    [favorites]
  );

  return {
    converter: {
      snapshot,
      commit,
      draft,
      seal,
      undo,
      redo,
      canUndo: history.past.length > 0 || !same(history.present, history.sealed),
      canRedo: history.future.length > 0,
      reset,
      favorites,
      toggleFavorite,
      isFavorite,
    },
    fmt,
    setFmt,
  };
}
