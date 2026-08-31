// ============================================================================
// Design state: undo/redo, autosave and the shareable permalink.
//
// The history stores whole `Design` objects on purpose. They are a few hundred
// bytes of plain data, so 60 steps cost less than a single preview bitmap
// would — the opposite trade-off to an image editor's undo stack.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Design, TabId } from '../types';
import { DEFAULT_DESIGN } from './defaults';

const STORAGE_KEY = 'olovetools:css-designer:v1';
const MAX_HISTORY = 60;
/** Two edits to the same control inside this window collapse into one step. */
const COALESCE_MS = 600;

interface Snapshot {
  design: Design;
  tab: TabId;
}

// ---------------------------------------------------------------------------
// Permalink codec — JSON → UTF-8 → base64url, so the hash survives copy/paste
// through chat apps that mangle `+` and `/`.
// ---------------------------------------------------------------------------

export function encodeDesign(design: Design, tab: TabId): string {
  const json = JSON.stringify({ v: 1, tab, design });
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Deep-merges a stored design over the defaults, one level per slice, so a
 *  link made by an older version still opens after new fields are added. */
function mergeDesign(partial: any): Design {
  const out = { ...DEFAULT_DESIGN } as Design;
  for (const key of Object.keys(DEFAULT_DESIGN) as (keyof Design)[]) {
    if (partial?.[key] && typeof partial[key] === 'object') {
      out[key] = { ...(DEFAULT_DESIGN[key] as object), ...partial[key] } as never;
    }
  }
  return out;
}

export function decodeDesign(encoded: string): Snapshot | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed?.design) return null;
    return { tab: (parsed.tab as TabId) || 'glass', design: mergeDesign(parsed.design) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------

export interface DesignStore {
  design: Design;
  tab: TabId;
  setTab: (tab: TabId) => void;
  /** `group` collapses rapid edits of the same control into one history step. */
  update: (patch: (current: Design) => Design, group?: string) => void;
  /** Ends the current coalescing group, e.g. when a drag finishes. */
  commit: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: () => void;
  replace: (design: Design, tab?: TabId) => void;
  /** True once the initial URL/localStorage restore has run. */
  ready: boolean;
}

export function useDesignStore(): DesignStore {
  const [snapshot, setSnapshot] = useState<Snapshot>({ design: DEFAULT_DESIGN, tab: 'glass' });
  const [ready, setReady] = useState(false);
  const [flags, setFlags] = useState({ canUndo: false, canRedo: false });

  // The stack is the source of truth; `snapshot` is the rendered mirror of
  // stack[index]. Keeping it in a ref means `update` can read the current
  // design synchronously instead of nesting setState calls.
  const stack = useRef<Snapshot[]>([{ design: DEFAULT_DESIGN, tab: 'glass' }]);
  const index = useRef(0);
  const lastGroup = useRef<{ key: string; at: number } | null>(null);

  const sync = useCallback(() => {
    setSnapshot(stack.current[index.current]);
    setFlags({ canUndo: index.current > 0, canRedo: index.current < stack.current.length - 1 });
  }, []);

  // -- initial restore ------------------------------------------------------
  useEffect(() => {
    let initial: Snapshot | null = null;
    const hash = window.location.hash.match(/[#&]d=([A-Za-z0-9_-]+)/);
    if (hash) {
      initial = decodeDesign(hash[1]);
    }
    if (!initial) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.design) {
            initial = { design: mergeDesign(parsed.design), tab: parsed.tab || 'glass' };
          }
        }
      } catch {
        // Storage disabled (private mode, hardened browser): defaults are fine.
      }
    }
    if (initial) {
      stack.current = [initial];
      index.current = 0;
      sync();
    }
    setReady(true);
  }, [sync]);

  // -- autosave -------------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Quota or disabled storage — losing the autosave is not worth an error.
      }
    }, 400);
    return () => window.clearTimeout(id);
  }, [snapshot, ready]);

  const push = useCallback(
    (next: Snapshot, group?: string) => {
      const now = Date.now();
      const coalesce =
        !!group && lastGroup.current?.key === group && now - lastGroup.current.at < COALESCE_MS;

      if (coalesce) {
        stack.current[index.current] = next;
      } else {
        stack.current = stack.current.slice(0, index.current + 1);
        stack.current.push(next);
        if (stack.current.length > MAX_HISTORY) stack.current.shift();
        index.current = stack.current.length - 1;
      }
      lastGroup.current = group ? { key: group, at: now } : null;
      sync();
    },
    [sync]
  );

  const update = useCallback(
    (patch: (current: Design) => Design, group?: string) => {
      const current = stack.current[index.current];
      push({ design: patch(current.design), tab: current.tab }, group);
    },
    [push]
  );

  const setTab = useCallback(
    (tab: TabId) => {
      // Switching panels is navigation, not an edit: it must not land in history.
      lastGroup.current = null;
      stack.current[index.current] = { ...stack.current[index.current], tab };
      sync();
    },
    [sync]
  );

  const commit = useCallback(() => {
    lastGroup.current = null;
  }, []);

  const step = useCallback(
    (delta: number) => {
      const target = index.current + delta;
      if (target < 0 || target >= stack.current.length) return;
      index.current = target;
      lastGroup.current = null;
      sync();
    },
    [sync]
  );

  const undo = useCallback(() => step(-1), [step]);
  const redo = useCallback(() => step(1), [step]);

  const replace = useCallback(
    (design: Design, tab?: TabId) => {
      push({ design, tab: tab || stack.current[index.current].tab });
    },
    [push]
  );

  const reset = useCallback(() => {
    push({ design: DEFAULT_DESIGN, tab: stack.current[index.current].tab });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clear */
    }
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, [push]);

  return {
    design: snapshot.design,
    tab: snapshot.tab,
    setTab,
    update,
    commit,
    undo,
    redo,
    canUndo: flags.canUndo,
    canRedo: flags.canRedo,
    reset,
    replace,
    ready,
  };
}
