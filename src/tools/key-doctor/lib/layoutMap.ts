import { useEffect, useState } from 'react';

// ============================================================================
// navigator.keyboard.getLayoutMap()
// ----------------------------------------------------------------------------
// The Keyboard Map API answers the question every other key tester gets wrong:
// what does THIS key print on THIS user's board? Without it a drawn keyboard is
// a US board with US legends, so a Spanish user sees ";" where their key says
// "Ñ" and a French user sees "Q" on the key that types "A".
//
// It is a real physical→logical mapping straight from the OS, not a guess from
// the interface language, and it is exactly the kind of intermediate data worth
// asking for instead of settling for the flattened result.
//
// Chromium-only today; Firefox and Safari fall back to the layout's own
// legends, which the UI states plainly rather than pretending otherwise.
// ============================================================================

export interface LayoutMapState {
  /** code -> the label this key actually produces, e.g. KeyQ -> "a" on AZERTY. */
  labels: Record<string, string>;
  /** The browser answered. False means we are showing fallback legends. */
  real: boolean;
  /** Still asking. */
  loading: boolean;
}

interface KeyboardWithMap {
  getLayoutMap?: () => Promise<Map<string, string>>;
}

export function useLayoutMap(): LayoutMapState {
  const [state, setState] = useState<LayoutMapState>({ labels: {}, real: false, loading: true });

  useEffect(() => {
    let cancelled = false;
    const kb = (navigator as Navigator & { keyboard?: KeyboardWithMap }).keyboard;

    if (!kb || typeof kb.getLayoutMap !== 'function') {
      setState({ labels: {}, real: false, loading: false });
      return;
    }

    kb.getLayoutMap()
      .then(map => {
        if (cancelled) return;
        const labels: Record<string, string> = {};
        map.forEach((value, code) => {
          labels[code] = value;
        });
        setState({ labels, real: Object.keys(labels).length > 0, loading: false });
      })
      .catch(() => {
        // Permissions-Policy can refuse it inside an iframe; not an app error.
        if (!cancelled) setState({ labels: {}, real: false, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

/**
 * Label for one key: the real one when the browser knows it, the layout's own
 * legend otherwise. Single characters are upper-cased because that is how they
 * are printed on the physical keycap.
 */
export function labelFor(code: string, labels: Record<string, string>, fallback: string): string {
  const real = labels[code];
  if (!real) return fallback;
  if (real.length === 1) return real.toUpperCase();
  // Long names ("Enter", "Backspace") read worse than the compact legends the
  // layout already carries.
  return fallback || real;
}
