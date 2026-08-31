// ============================================================================
// Document state + undo/redo
// ----------------------------------------------------------------------------
// The history stores whole documents because a document is JSON: ~250 bytes per
// layer. A 60-step stack of a busy meme is under 200 KB, versus the ~16 MB per
// step an editor pays when it snapshots the rendered bitmap instead.
//
// Drags and slider sweeps are "transient": they update the document without
// touching the history, and a single entry is pushed when the gesture ends.
// ============================================================================

import { useCallback, useReducer, useRef, useState } from 'react';
import type { Layer, MemeDoc } from '../types';

const MAX_HISTORY = 60;

export interface MemeDocApi {
  doc: MemeDoc;
  /** Applies a change without touching the history. */
  setDoc: (updater: (doc: MemeDoc) => MemeDoc) => void;
  /** Marks the start of a gesture; safe to call repeatedly. */
  begin: () => void;
  /** Closes the gesture and pushes one history entry. */
  commit: () => void;
  /** begin + setDoc + commit, for one-shot actions. */
  mutate: (updater: (doc: MemeDoc) => MemeDoc) => void;
  patchLayer: (id: string, patch: Partial<Layer>, transient?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Swaps the document and clears the history (new background, reset). */
  replace: (doc: MemeDoc, keepHistory?: boolean) => void;
  current: () => MemeDoc;
}

export function useMemeDoc(initial: MemeDoc): MemeDocApi {
  const [doc, setDocState] = useState<MemeDoc>(initial);

  // The ref is the source of truth for reads inside handlers: a pointermove
  // fires far more often than React re-renders, and reading `doc` from the
  // closure there hands you the position from the start of the drag.
  const docRef = useRef(doc);
  const pastRef = useRef<MemeDoc[]>([]);
  const futureRef = useRef<MemeDoc[]>([]);
  const stagedRef = useRef<MemeDoc | null>(null);
  const [, bump] = useReducer((n: number) => n + 1, 0);

  const setDoc = useCallback((updater: (doc: MemeDoc) => MemeDoc) => {
    const next = updater(docRef.current);
    if (next === docRef.current) return;
    docRef.current = next;
    setDocState(next);
  }, []);

  const begin = useCallback(() => {
    if (!stagedRef.current) stagedRef.current = docRef.current;
  }, []);

  const commit = useCallback(() => {
    const staged = stagedRef.current;
    stagedRef.current = null;
    if (!staged || staged === docRef.current) return;
    pastRef.current = [...pastRef.current, staged].slice(-MAX_HISTORY);
    futureRef.current = [];
    bump();
  }, []);

  const mutate = useCallback(
    (updater: (doc: MemeDoc) => MemeDoc) => {
      begin();
      setDoc(updater);
      commit();
    },
    [begin, setDoc, commit]
  );

  const patchLayer = useCallback(
    (id: string, patch: Partial<Layer>, transient = false) => {
      const apply = (d: MemeDoc): MemeDoc => ({
        ...d,
        layers: d.layers.map(l => (l.id === id ? ({ ...l, ...patch } as Layer) : l)),
      });
      if (transient) {
        begin();
        setDoc(apply);
      } else {
        mutate(apply);
      }
    },
    [begin, setDoc, mutate]
  );

  const undo = useCallback(() => {
    const previous = pastRef.current[pastRef.current.length - 1];
    if (!previous) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, docRef.current];
    stagedRef.current = null;
    docRef.current = previous;
    setDocState(previous);
    bump();
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current[futureRef.current.length - 1];
    if (!next) return;
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, docRef.current];
    stagedRef.current = null;
    docRef.current = next;
    setDocState(next);
    bump();
  }, []);

  const replace = useCallback((next: MemeDoc, keepHistory = false) => {
    if (keepHistory) {
      pastRef.current = [...pastRef.current, docRef.current].slice(-MAX_HISTORY);
    } else {
      pastRef.current = [];
    }
    futureRef.current = [];
    stagedRef.current = null;
    docRef.current = next;
    setDocState(next);
    bump();
  }, []);

  const current = useCallback(() => docRef.current, []);

  return {
    doc,
    setDoc,
    begin,
    commit,
    mutate,
    patchLayer,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    replace,
    current,
  };
}
