import { useEffect, useRef } from 'react';
import { hasPendingHandoff, takeHandoff } from './handoff';

/**
 * Picks up a file handed over by another tool ("compress this cutout") and
 * feeds it to the tool's normal intake path, then clears the `?handoff=1` flag
 * so a refresh behaves like a plain visit.
 *
 * Safe to call unconditionally: it no-ops when nothing is waiting.
 */
export function useHandoffIntake(onFile: (file: File, from: string) => void): void {
  const handler = useRef(onFile);
  handler.current = onFile;

  useEffect(() => {
    if (!hasPendingHandoff()) return;
    let cancelled = false;
    takeHandoff().then(result => {
      if (cancelled) return;
      if (result) handler.current(result.file, result.from);
      window.history.replaceState({}, '', window.location.pathname);
    });
    return () => {
      cancelled = true;
    };
  }, []);
}
