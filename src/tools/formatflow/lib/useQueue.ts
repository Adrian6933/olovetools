// ============================================================================
// Estado de la cola
// ----------------------------------------------------------------------------
// Regla de oro: soltar un archivo NO convierte nada. Al entrar se descodifica
// una vez y se saca una miniatura; la conversión espera al botón. Cambiar un
// ajuste marca el resultado como caducado en vez de relanzar el trabajo, salvo
// que el usuario active la vista previa en vivo a sabiendas.
//
// El historial guarda objetos de ajustes, no imágenes. Cincuenta pasos de
// deshacer son unos pocos kilobytes; guardando bitmaps serían gigabytes.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { extensionFor } from './formats';
import { finishContainer } from './finish';
import { normalizeSource } from './intake';
import { useConverter } from './useConverter';
import { DEFAULT_SETTINGS } from './types';
import type { ConversionResult, QueueItem, Settings } from './types';

export const MAX_FILES = 50;
/** Pasos de deshacer. Son objetos planos: el tope es por cordura, no por RAM. */
const HISTORY_LIMIT = 50;

export interface BatchProgress {
  current: number;
  total: number;
}

let idCounter = 0;
const nextId = () => `img${idCounter++}${Date.now().toString(36)}`;

export function useQueue() {
  const { load, convert, release, poolSize } = useConverter();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [settings, setSettingsRaw] = useState<Settings>(DEFAULT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [livePreview, setLivePreview] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const history = useRef<Settings[]>([DEFAULT_SETTINGS]);
  const historyAt = useRef(0);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });

  // Espejo del estado para los callbacks asíncronos: leer `items` de una
  // closure durante una conversión por lotes daba la lista de hace tres
  // imágenes, que es de donde salía el `pushState` equivocado del motor viejo.
  const itemsRef = useRef<QueueItem[]>([]);
  itemsRef.current = items;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const syncHistoryState = () => {
    setHistoryState({
      canUndo: historyAt.current > 0,
      canRedo: historyAt.current < history.current.length - 1,
    });
  };

  // --- Ajustes --------------------------------------------------------------

  const markStale = useCallback(() => {
    setItems(prev => prev.map(item => (item.result ? { ...item, stale: true } : item)));
  }, []);

  const setSettings = useCallback(
    (next: Settings, record = true) => {
      setSettingsRaw(next);
      if (record) {
        // Se corta la rama de rehacer al escribir encima, como cualquier
        // historial lineal.
        history.current = history.current.slice(0, historyAt.current + 1);
        history.current.push(next);
        if (history.current.length > HISTORY_LIMIT) history.current.shift();
        historyAt.current = history.current.length - 1;
        syncHistoryState();
      }
      markStale();
    },
    [markStale]
  );

  const undo = useCallback(() => {
    if (historyAt.current <= 0) return;
    historyAt.current--;
    setSettingsRaw(history.current[historyAt.current]);
    syncHistoryState();
    markStale();
  }, [markStale]);

  const redo = useCallback(() => {
    if (historyAt.current >= history.current.length - 1) return;
    historyAt.current++;
    setSettingsRaw(history.current[historyAt.current]);
    syncHistoryState();
    markStale();
  }, [markStale]);

  const setItemSettings = useCallback((id: string, next: Settings | null) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, settings: next, stale: !!item.result } : item))
    );
  }, []);

  // --- Entrada --------------------------------------------------------------

  const addFiles = useCallback(
    async (files: File[]) => {
      const room = MAX_FILES - itemsRef.current.length;
      if (room <= 0) {
        setNotice('full');
        return;
      }
      const accepted = files.slice(0, room);
      if (files.length > room) setNotice('tooMany');
      setBusy(true);
      setProgress({ current: 0, total: accepted.length });

      for (let index = 0; index < accepted.length; index++) {
        const file = accepted[index];
        setProgress({ current: index + 1, total: accepted.length });
        const id = nextId();
        try {
          const source = await normalizeSource(file);
          const outcome = await load(id, source.blob, 256);
          const thumbUrl = outcome.thumb ? URL.createObjectURL(outcome.thumb) : '';
          const item: QueueItem = {
            id, file, source: source.blob, sourceMime: source.mime, thumbUrl,
            width: outcome.width, height: outcome.height, originalSize: file.size,
            settings: null, slot: outcome.slot, result: null, stale: false, error: null,
          };
          setItems(prev => (prev.length >= MAX_FILES ? prev : [...prev, item]));
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'decode-failed';
          setNotice(reason === 'unsupported-input' ? 'unsupported' : 'decodeFailed');
        }
      }

      setBusy(false);
      setProgress(null);
    },
    [load]
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems(prev => {
        const target = prev.find(item => item.id === id);
        if (target) {
          if (target.thumbUrl) URL.revokeObjectURL(target.thumbUrl);
          if (target.result) URL.revokeObjectURL(target.result.url);
          release(target.id, target.slot);
        }
        const next = prev.filter(item => item.id !== id);
        setSelected(current => Math.max(0, Math.min(current, next.length - 1)));
        return next;
      });
    },
    [release]
  );

  const clearAll = useCallback(() => {
    itemsRef.current.forEach(item => {
      if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
      if (item.result) URL.revokeObjectURL(item.result.url);
      release(item.id, item.slot);
    });
    setItems([]);
    setSelected(0);
    setProgress(null);
  }, [release]);

  // --- Conversión -----------------------------------------------------------

  /** Contador de generación: un resultado de una tanda anterior se descarta. */
  const generation = useRef(0);

  const convertOne = useCallback(
    async (item: QueueItem, gen: number): Promise<ConversionResult | null> => {
      const effective = item.settings || settingsRef.current;
      try {
        const outcome = await convert(item.id, item.slot, effective);
        const blob = await finishContainer(effective.format, outcome);
        if (gen !== generation.current) return null;
        return {
          url: URL.createObjectURL(blob),
          blob,
          size: blob.size,
          width: outcome.width,
          height: outcome.height,
          mime: blob.type,
          ext: extensionFor(effective.format),
          quality: outcome.quality,
          ssim: outcome.ssim,
          ms: outcome.ms,
          attempts: outcome.attempts,
          missedTarget: outcome.missedTarget,
          detail: outcome.detail,
        };
      } catch {
        return null;
      }
    },
    [convert]
  );

  const applyResult = useCallback((id: string, result: ConversionResult | null, error: string | null) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        // La URL anterior se revoca aquí y sólo aquí: es el único punto que ve
        // a la vez el resultado viejo y el nuevo.
        if (item.result) URL.revokeObjectURL(item.result.url);
        return { ...item, result, stale: false, error };
      })
    );
  }, []);

  const convertSelected = useCallback(async () => {
    const item = itemsRef.current[selected];
    if (!item) return;
    const gen = ++generation.current;
    setBusy(true);
    const result = await convertOne(item, gen);
    if (gen === generation.current) applyResult(item.id, result, result ? null : 'failed');
    setBusy(false);
  }, [selected, convertOne, applyResult]);

  const convertAll = useCallback(async () => {
    const queue = itemsRef.current;
    if (queue.length === 0) return;
    const gen = ++generation.current;
    setBusy(true);
    setProgress({ current: 0, total: queue.length });

    // Tantas a la vez como workers: cada imagen ya vive en un worker concreto,
    // así que lanzar más en paralelo sólo llenaría la cola de uno de ellos.
    let done = 0;
    let cursor = 0;
    const runners = Array.from({ length: Math.min(poolSize, queue.length) }, async () => {
      while (cursor < queue.length) {
        const item = queue[cursor++];
        const result = await convertOne(item, gen);
        if (gen !== generation.current) return;
        applyResult(item.id, result, result ? null : 'failed');
        done++;
        setProgress({ current: done, total: queue.length });
      }
    });
    await Promise.all(runners);

    if (gen === generation.current) {
      setBusy(false);
      setProgress(null);
    }
  }, [convertOne, applyResult, poolSize]);

  // --- Vista previa en vivo (desactivada por defecto) ------------------------

  useEffect(() => {
    if (!livePreview) return;
    const item = itemsRef.current[selected];
    if (!item) return;
    const timer = setTimeout(() => { convertSelected(); }, 350);
    return () => clearTimeout(timer);
  }, [livePreview, selected, settings, items.length, convertSelected]);

  // --- Limpieza -------------------------------------------------------------

  useEffect(() => {
    return () => {
      itemsRef.current.forEach(item => {
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
        if (item.result) URL.revokeObjectURL(item.result.url);
      });
    };
  }, []);

  const active = items[selected] || null;
  const effectiveSettings = (active && active.settings) || settings;

  return {
    items, selected, setSelected, active, settings, effectiveSettings,
    setSettings, setItemSettings, undo, redo, ...historyState,
    addFiles, removeItem, clearAll,
    convertSelected, convertAll, busy, progress,
    livePreview, setLivePreview,
    notice, setNotice, poolSize,
  };
}
