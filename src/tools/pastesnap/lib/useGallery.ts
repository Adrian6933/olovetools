// ============================================================================
// Estado de la galería
// ----------------------------------------------------------------------------
// Concentra el ciclo de vida de los object URL, que antes se creaban en
// `processFile` y solo se liberaban al borrar o vaciar: al desmontar la isla
// quedaban vivos. Y sobre todo concentra la regla de que CONVERTIR ES LA
// OPERACIÓN CARA y solo ocurre cuando el usuario pulsa el botón.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeFile, isSupportedImage } from './decode';
import { encodeBitmap, disposeEncoder } from './encode';
import { getFormat, outputName, type FormatId } from './formats';

export interface GalleryItem {
  id: string;
  /** El archivo original, tal cual entró. */
  file: File;
  /** Object URL del original, para la miniatura. */
  url: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  /** Necesitó heic2any/utif para poder leerse. */
  converted: boolean;
  /** Resultado de la última conversión, si se ha ejecutado. */
  output?: {
    blob: Blob;
    url: string;
    name: string;
    size: number;
    width: number;
    height: number;
    format: FormatId;
  };
}

export interface RejectedFile {
  name: string;
  reason: 'unsupported' | 'decode-failed' | 'too-big';
}

const MAX_BYTES = 40 * 1024 * 1024;
const newId = () => `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function useGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Se liberan al desmontar: el efecto lee de una ref para no re-suscribirse
  // en cada cambio de la lista.
  const itemsRef = useRef<GalleryItem[]>(items);
  itemsRef.current = items;

  useEffect(
    () => () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.url);
        if (item.output) URL.revokeObjectURL(item.output.url);
      }
      disposeEncoder();
    },
    []
  );

  /**
   * Añade archivos. Decodifica para VALIDAR y para leer las dimensiones reales,
   * y descarta el bitmap acto seguido: no es la operación cara, y evita que
   * entre en la galería un archivo que luego no se pueda convertir.
   */
  const addFiles = useCallback(async (files: File[] | FileList) => {
    const list = Array.from(files);
    const accepted: GalleryItem[] = [];
    const failed: RejectedFile[] = [];

    for (const file of list) {
      if (!isSupportedImage(file)) {
        failed.push({ name: file.name, reason: 'unsupported' });
        continue;
      }
      if (file.size > MAX_BYTES) {
        failed.push({ name: file.name, reason: 'too-big' });
        continue;
      }
      try {
        const decoded = await decodeFile(file);
        const width = decoded.bitmap.width;
        const height = decoded.bitmap.height;
        decoded.bitmap.close();
        accepted.push({
          id: newId(),
          file,
          url: URL.createObjectURL(file),
          name: file.name || `pastesnap-${Date.now()}.png`,
          size: file.size,
          type: decoded.mime,
          width,
          height,
          converted: decoded.converted,
        });
      } catch {
        failed.push({ name: file.name, reason: 'decode-failed' });
      }
    }

    if (accepted.length) {
      setItems(prev => [...prev, ...accepted]);
      setSelected(prev => {
        const next = new Set(prev);
        for (const item of accepted) next.add(item.id);
        return next;
      });
    }
    if (failed.length) setRejected(prev => [...prev, ...failed]);
    return { accepted: accepted.length, failed: failed.length };
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => {
      const target = prev.find(item => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
        if (target.output) URL.revokeObjectURL(target.output.url);
      }
      return prev.filter(item => item.id !== id);
    });
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(prev => {
      for (const item of prev) {
        URL.revokeObjectURL(item.url);
        if (item.output) URL.revokeObjectURL(item.output.url);
      }
      return [];
    });
    setSelected(new Set());
    setRejected([]);
    setProgress({ done: 0, total: 0 });
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setSelected(new Set(itemsRef.current.map(i => i.id))), []);
  const selectNone = useCallback(() => setSelected(new Set()), []);
  const rename = useCallback((id: string, name: string) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, name } : item)));
  }, []);
  const dismissRejected = useCallback(() => setRejected([]), []);

  /**
   * LA operación cara, y por eso solo se dispara desde un botón. Decodifica de
   * nuevo cada archivo porque `encodeBitmap` consume el bitmap al transferirlo
   * al worker.
   */
  const convert = useCallback(
    async (options: { format: FormatId; quality: number; maxDimension: number; background: string }) => {
      const targets = itemsRef.current.filter(item => selected.has(item.id));
      if (!targets.length || busy) return;

      setBusy(true);
      setProgress({ done: 0, total: targets.length });
      const format = getFormat(options.format);

      for (let index = 0; index < targets.length; index++) {
        const item = targets[index];
        try {
          const decoded = await decodeFile(item.file);
          const result = await encodeBitmap(decoded.bitmap, options);
          const url = URL.createObjectURL(result.blob);
          setItems(prev =>
            prev.map(current => {
              if (current.id !== item.id) return current;
              if (current.output) URL.revokeObjectURL(current.output.url);
              return {
                ...current,
                output: {
                  blob: result.blob,
                  url,
                  name: outputName(current.name, format),
                  size: result.blob.size,
                  width: result.width,
                  height: result.height,
                  format: options.format,
                },
              };
            })
          );
        } catch {
          /* una imagen que falla no debe abortar el lote */
        }
        setProgress({ done: index + 1, total: targets.length });
      }

      setBusy(false);
    },
    [busy, selected]
  );

  return {
    items,
    selected,
    rejected,
    busy,
    progress,
    addFiles,
    remove,
    clear,
    toggle,
    selectAll,
    selectNone,
    rename,
    dismissRejected,
    convert,
  };
}
