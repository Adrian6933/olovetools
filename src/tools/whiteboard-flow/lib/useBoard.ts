import { useCallback, useEffect, useRef, useState } from 'react';
import type { BoardDoc, Command, Viewport } from '../types';
import { apply, clearV1, emptyDoc, migrateV1 } from './board';
import { clearBoard, loadBoard, saveBoard } from './store';

/** Deep enough for a working session without letting the log grow unbounded. */
const HISTORY_CAP = 200;
/** Typing produces one command per commit, so this only debounces disk writes. */
const SAVE_DELAY = 400;

export interface BoardApi {
  doc: BoardDoc;
  ready: boolean;
  canUndo: boolean;
  canRedo: boolean;
  commit: (cmd: Command) => void;
  undo: () => void;
  redo: () => void;
  setViewport: (v: Viewport) => void;
  /** Replaces the whole board (import, template, reset). Undoable as one step. */
  replace: (next: BoardDoc) => void;
  reset: () => void;
}

export function useBoard(): BoardApi {
  const [doc, setDoc] = useState<BoardDoc>(emptyDoc);
  const [ready, setReady] = useState(false);
  const [past, setPast] = useState<Command[]>([]);
  const [future, setFuture] = useState<Command[]>([]);
  const docRef = useRef(doc);
  docRef.current = doc;
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // --- load ----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    loadBoard().then(stored => {
      if (cancelled) return;
      if (stored) {
        setDoc(stored);
      } else {
        // Boards made before this rewrite lived in localStorage as a flat list.
        const migrated = migrateV1();
        if (migrated) {
          setDoc(migrated);
          saveBoard(migrated).then(clearV1);
        }
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // --- persist -------------------------------------------------------------
  useEffect(() => {
    if (!ready) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveBoard(docRef.current), SAVE_DELAY);
    return () => clearTimeout(saveTimer.current);
  }, [doc, ready]);

  // A debounced save loses the last few hundred milliseconds when the tab is
  // closed mid-edit, so the pending write is flushed on the way out.
  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      clearTimeout(saveTimer.current);
      saveBoard(docRef.current);
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [ready]);

  // --- history -------------------------------------------------------------
  const commit = useCallback((cmd: Command) => {
    setDoc(d => apply(d, cmd, 1));
    setPast(p => (p.length >= HISTORY_CAP ? p.slice(1) : p).concat(cmd));
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const cmd = p[p.length - 1];
      setDoc(d => apply(d, cmd, -1));
      setFuture(f => [cmd].concat(f));
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const cmd = f[0];
      setDoc(d => apply(d, cmd, 1));
      setPast(p => p.concat(cmd));
      return f.slice(1);
    });
  }, []);

  const setViewport = useCallback((v: Viewport) => {
    // Panning is not an edit: it never enters the undo log.
    setDoc(d => ({ ...d, viewport: v }));
  }, []);

  const replace = useCallback((next: BoardDoc) => {
    setDoc(current => {
      const cmd: Command = {
        t: 'batch',
        cmds: [
          { t: 'del', nodes: current.nodes, edges: current.edges },
          { t: 'add', nodes: next.nodes, edges: next.edges },
        ],
      };
      setPast(p => (p.length >= HISTORY_CAP ? p.slice(1) : p).concat(cmd));
      setFuture([]);
      return { ...next, viewport: current.viewport };
    });
  }, []);

  const reset = useCallback(() => {
    setDoc(current => {
      // Undoable on purpose: v1 wiped the board with no way back.
      const cmd: Command = { t: 'del', nodes: current.nodes, edges: current.edges };
      setPast(p => (p.length >= HISTORY_CAP ? p.slice(1) : p).concat(cmd));
      setFuture([]);
      return { ...emptyDoc(), layout: current.layout, viewport: current.viewport };
    });
    clearBoard();
  }, []);

  return {
    doc,
    ready,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    commit,
    undo,
    redo,
    setViewport,
    replace,
    reset,
  };
}
