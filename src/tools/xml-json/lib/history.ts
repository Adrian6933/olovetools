// ============================================================================
// Undo / redo for the editor.
// ----------------------------------------------------------------------------
// Snapshots are plain strings, capped by count *and* by total bytes. A history
// that keeps everything is how a text tool ends up holding a few hundred MB
// after an afternoon of edits on a large document.
// ============================================================================

import { useCallback, useRef, useState } from 'react';

const MAX_ENTRIES = 80;
const MAX_TOTAL_CHARS = 8 * 1024 * 1024;
/** Edits closer together than this are folded into one entry. */
const COALESCE_MS = 600;

export interface HistoryApi {
  push: (value: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  reset: (value: string) => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useTextHistory(initial: string): HistoryApi {
  const entries = useRef<string[]>([initial]);
  const index = useRef(0);
  const lastPush = useRef(0);
  const [, bump] = useState(0);

  const trim = () => {
    let total = entries.current.reduce((sum, entry) => sum + entry.length, 0);
    while (entries.current.length > MAX_ENTRIES || (total > MAX_TOTAL_CHARS && entries.current.length > 2)) {
      total -= entries.current[0].length;
      entries.current.shift();
      index.current = Math.max(0, index.current - 1);
    }
  };

  const push = useCallback((value: string) => {
    if (entries.current[index.current] === value) return;
    const now = Date.now();
    const coalesce = now - lastPush.current < COALESCE_MS && index.current === entries.current.length - 1;
    lastPush.current = now;

    if (coalesce) {
      entries.current[index.current] = value;
    } else {
      entries.current = entries.current.slice(0, index.current + 1);
      entries.current.push(value);
      index.current = entries.current.length - 1;
      trim();
    }
    bump(n => n + 1);
  }, []);

  const undo = useCallback(() => {
    if (index.current <= 0) return null;
    index.current -= 1;
    lastPush.current = 0;
    bump(n => n + 1);
    return entries.current[index.current];
  }, []);

  const redo = useCallback(() => {
    if (index.current >= entries.current.length - 1) return null;
    index.current += 1;
    lastPush.current = 0;
    bump(n => n + 1);
    return entries.current[index.current];
  }, []);

  const reset = useCallback((value: string) => {
    entries.current = [value];
    index.current = 0;
    lastPush.current = 0;
    bump(n => n + 1);
  }, []);

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: index.current > 0,
    canRedo: index.current < entries.current.length - 1,
  };
}
