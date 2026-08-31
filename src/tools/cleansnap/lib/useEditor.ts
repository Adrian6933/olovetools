// ============================================================================
// Estado del editor
// ----------------------------------------------------------------------------
// Tres lienzos fuera de pantalla: el original intacto, el de trabajo y el de la
// máscara. La máscara es el dato intermedio de todo esto: se puede repintar,
// ensanchar, invertir y volver a aplicar con otro método sin tocar la imagen,
// que es lo que hace que el proceso sea no destructivo de verdad.
//
// El historial guarda SÓLO el rectángulo que cambió. La versión anterior metía
// un `ImageData` completo por paso, con tope de 12: a 1920x1080 eso son 8,3 MB
// cada uno, hasta 100 MB de memoria para poder deshacer.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { boundingBox } from './inpaint';
import type { WorkerRequest, WorkerResponse } from './fill.worker';
import { DEFAULT_FILL } from './types';
import type { FillSettings, OutputFormat, Patch } from './types';

/** Pasos de deshacer. Como sólo se guarda el recorte, caben muchos más. */
const HISTORY_LIMIT = 40;

/**
 * Tope de píxeles a procesar. No es un recorte silencioso como el `MAX_DIM`
 * anterior: si la imagen lo supera se avisa en pantalla y se dice a qué tamaño
 * se está trabajando.
 */
export const MAX_PIXELS = 24e6;

export interface LoadedImage {
  name: string;
  width: number;
  height: number;
  /** Medidas del archivo original, antes de cualquier ajuste. */
  sourceWidth: number;
  sourceHeight: number;
  scaled: boolean;
}

export function useEditor() {
  const work = useRef<HTMLCanvasElement | null>(null);
  const mask = useRef<HTMLCanvasElement | null>(null);
  const original = useRef<HTMLCanvasElement | null>(null);

  const [image, setImage] = useState<LoadedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Sube en cada cambio de píxeles o de máscara: la vista se redibuja con él. */
  const [version, setVersion] = useState(0);

  const undoStack = useRef<Patch[]>([]);
  const redoStack = useRef<Patch[]>([]);
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });

  const worker = useRef<Worker | null>(null);
  const workerBroken = useRef(false);
  const pending = useRef<{ id: string; resolve: (r: WorkerResponse) => void } | null>(null);
  const jobId = useRef(0);

  const bump = useCallback(() => setVersion(v => v + 1), []);

  const syncHistory = useCallback(() => {
    setHistory({ canUndo: undoStack.current.length > 0, canRedo: redoStack.current.length > 0 });
  }, []);

  // --- Worker ---------------------------------------------------------------

  const getWorker = useCallback((): Worker | null => {
    if (workerBroken.current || typeof Worker === 'undefined') return null;
    if (worker.current) return worker.current;
    try {
      const instance = new Worker(new URL('./fill.worker.ts', import.meta.url), { type: 'module' });
      instance.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;
        if (message.kind === 'progress') {
          setProgress(message.done);
          return;
        }
        const waiting = pending.current;
        if (!waiting || waiting.id !== message.id) return;
        pending.current = null;
        waiting.resolve(message);
      };
      instance.onerror = () => {
        // `new Worker` sí construye bajo una CSP sin `worker-src`, pero falla
        // al cargar. Sin este rescate la herramienta se queda colgada para
        // siempre esperando una respuesta que no llega.
        workerBroken.current = true;
        worker.current = null;
        const waiting = pending.current;
        pending.current = null;
        if (waiting) waiting.resolve({ kind: 'error', id: waiting.id, error: 'worker-failed' });
      };
      worker.current = instance;
      return instance;
    } catch {
      workerBroken.current = true;
      return null;
    }
  }, []);

  // --- Carga ----------------------------------------------------------------

  const load = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        let blob: Blob = file;
        const name = file.name.toLowerCase();
        const isHeic =
          file.type === 'image/heic' || file.type === 'image/heif' ||
          name.endsWith('.heic') || name.endsWith('.heif');
        if (isHeic) {
          // El formato por defecto del iPhone. Antes, un HEIC no hacía
          // literalmente nada: el filtro `type.startsWith('image/')` lo
          // descartaba en silencio, sin cargar ni avisar.
          const heic2any = (await import('heic2any')).default;
          const converted = await heic2any({ blob: file, toType: 'image/png' });
          blob = Array.isArray(converted) ? converted[0] : converted;
        }

        const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        const sourceWidth = bitmap.width;
        const sourceHeight = bitmap.height;

        let width = sourceWidth;
        let height = sourceHeight;
        let scaled = false;
        if (width * height > MAX_PIXELS) {
          const factor = Math.sqrt(MAX_PIXELS / (width * height));
          width = Math.max(1, Math.floor(width * factor));
          height = Math.max(1, Math.floor(height * factor));
          scaled = true;
        }

        const make = () => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          return canvas;
        };

        const workCanvas = make();
        workCanvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
        work.current = workCanvas;

        const originalCanvas = make();
        originalCanvas.getContext('2d')!.drawImage(workCanvas, 0, 0);
        original.current = originalCanvas;

        mask.current = make();
        bitmap.close();

        undoStack.current = [];
        redoStack.current = [];
        syncHistory();
        setLastMs(null);
        setImage({ name: file.name, width, height, sourceWidth, sourceHeight, scaled });
        bump();
      } catch {
        setError('decode');
      } finally {
        setLoading(false);
      }
    },
    [bump, syncHistory]
  );

  const close = useCallback(() => {
    work.current = null;
    mask.current = null;
    original.current = null;
    undoStack.current = [];
    redoStack.current = [];
    syncHistory();
    setImage(null);
    setLastMs(null);
    setError(null);
    bump();
  }, [bump, syncHistory]);

  // --- Máscara --------------------------------------------------------------

  const readMask = useCallback((): { data: Uint8Array; any: boolean } | null => {
    const canvas = mask.current;
    if (!canvas) return null;
    const { width, height } = canvas;
    const alpha = canvas.getContext('2d')!.getImageData(0, 0, width, height).data;
    const out = new Uint8Array(width * height);
    let any = false;
    for (let i = 0; i < out.length; i++) {
      // Umbral bajo: el pincel tiene bordes suavizados y los píxeles a medias
      // también forman parte de lo que hay que quitar.
      if (alpha[i * 4 + 3] > 8) { out[i] = 1; any = true; }
    }
    return { data: out, any };
  }, []);

  const clearMask = useCallback(() => {
    const canvas = mask.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    bump();
  }, [bump]);

  const invertMask = useCallback(() => {
    const canvas = mask.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'xor';
    ctx.fillStyle = 'rgba(139,92,246,1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    bump();
  }, [bump]);

  // --- Aplicar --------------------------------------------------------------

  const cancel = useCallback(() => {
    const waiting = pending.current;
    const instance = worker.current;
    if (waiting && instance) {
      instance.postMessage({ kind: 'cancel', id: waiting.id } as WorkerRequest);
    }
  }, []);

  const apply = useCallback(
    async (settings: FillSettings = DEFAULT_FILL) => {
      const workCanvas = work.current;
      const maskCanvas = mask.current;
      if (!workCanvas || !maskCanvas || busy) return;

      const selection = readMask();
      if (!selection || !selection.any) {
        setError('nomask');
        return;
      }

      setBusy(true);
      setError(null);
      setProgress(0);

      const { width, height } = workCanvas;
      const ctx = workCanvas.getContext('2d')!;
      // Se lee una sola vez. La versión anterior llamaba a getImageData dos
      // veces por operación (una para trabajar y otra para el historial): 16 MB
      // de reservas por clic a 1920x1080.
      const frame = ctx.getImageData(0, 0, width, height);
      const before = new Uint8ClampedArray(frame.data);

      const id = `job${jobId.current++}`;
      const instance = getWorker();
      let pixels = frame.data;
      let ms = 0;

      if (instance) {
        const response = await new Promise<WorkerResponse>(resolve => {
          pending.current = { id, resolve };
          const request: FillRequestLike = {
            kind: 'fill', id, pixels: frame.data, mask: selection.data,
            width, height, settings,
          };
          instance.postMessage(request, [frame.data.buffer as ArrayBuffer]);
        });
        if (response.kind === 'done') {
          pixels = response.pixels;
          ms = response.ms;
        } else {
          // El worker se cayó: se rehace en el hilo principal con los píxeles
          // que aún tenemos aquí (el buffer transferido queda inservible, así
          // que se relee del lienzo).
          const retry = ctx.getImageData(0, 0, width, height);
          ms = await runOnMainThread(retry.data, selection.data, width, height, settings, setProgress);
          pixels = retry.data;
        }
      } else {
        ms = await runOnMainThread(frame.data, selection.data, width, height, settings, setProgress);
        pixels = frame.data;
      }

      ctx.putImageData(new ImageData(pixels, width, height), 0, 0);

      // Historial: sólo la caja tocada, más un margen por el difuminado.
      const box = boundingBox(selection.data, width, height);
      if (box.any) {
        const margin = Math.max(settings.feather, Math.abs(settings.grow)) + 2;
        const x = Math.max(0, box.minX - margin);
        const y = Math.max(0, box.minY - margin);
        const w = Math.min(width, box.maxX + margin + 1) - x;
        const h = Math.min(height, box.maxY + margin + 1) - y;
        undoStack.current.push({
          x, y, width: w, height: h,
          before: crop(before, width, x, y, w, h),
          after: crop(pixels, width, x, y, w, h),
        });
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
        syncHistory();
      }

      maskCanvas.getContext('2d')!.clearRect(0, 0, width, height);
      setLastMs(ms);
      setBusy(false);
      setProgress(0);
      bump();
    },
    [busy, readMask, getWorker, bump, syncHistory]
  );

  // --- Deshacer / rehacer ---------------------------------------------------

  const paste = useCallback((patch: Patch, which: 'before' | 'after') => {
    const canvas = work.current;
    if (!canvas) return;
    const source = which === 'before' ? patch.before : patch.after;
    const image = new ImageData(new Uint8ClampedArray(source), patch.width, patch.height);
    canvas.getContext('2d')!.putImageData(image, patch.x, patch.y);
  }, []);

  const undo = useCallback(() => {
    const patch = undoStack.current.pop();
    if (!patch) return;
    paste(patch, 'before');
    redoStack.current.push(patch);
    syncHistory();
    bump();
  }, [paste, syncHistory, bump]);

  const redo = useCallback(() => {
    const patch = redoStack.current.pop();
    if (!patch) return;
    paste(patch, 'after');
    undoStack.current.push(patch);
    syncHistory();
    bump();
  }, [paste, syncHistory, bump]);

  const reset = useCallback(() => {
    const canvas = work.current;
    const source = original.current;
    if (!canvas || !source) return;
    canvas.getContext('2d')!.drawImage(source, 0, 0);
    clearMask();
    undoStack.current = [];
    redoStack.current = [];
    syncHistory();
    setLastMs(null);
    bump();
  }, [clearMask, syncHistory, bump]);

  // --- Salida ---------------------------------------------------------------

  const toBlob = useCallback(
    (format: OutputFormat, quality: number): Promise<Blob | null> => {
      const canvas = work.current;
      if (!canvas) return Promise.resolve(null);
      return new Promise(resolve => {
        canvas.toBlob(resolve, format, format === 'image/png' ? undefined : quality / 100);
      });
    },
    []
  );

  useEffect(() => {
    return () => {
      if (worker.current) worker.current.terminate();
    };
  }, []);

  return {
    work, mask, original, image, version,
    load, close, apply, cancel, clearMask, invertMask,
    undo, redo, reset, toBlob, bump,
    busy, loading, progress, lastMs, error, setError,
    ...history,
  };
}

/** Igual que FillRequest, sin importar el tipo del worker en tiempo de ejecución. */
interface FillRequestLike {
  kind: 'fill';
  id: string;
  pixels: Uint8ClampedArray;
  mask: Uint8Array;
  width: number;
  height: number;
  settings: FillSettings;
}

function crop(
  source: Uint8ClampedArray, sourceWidth: number,
  x: number, y: number, width: number, height: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    const from = ((y + row) * sourceWidth + x) * 4;
    out.set(source.subarray(from, from + width * 4), row * width * 4);
  }
  return out;
}

/**
 * Plan B sin worker. Se trocea igual, con `setTimeout` entre tramos, para que
 * la barra de progreso avance y la pestaña siga respondiendo — que es
 * justamente lo que no hacía la versión anterior.
 */
async function runOnMainThread(
  pixels: Uint8ClampedArray, mask: Uint8Array, width: number, height: number,
  settings: FillSettings, onProgress: (value: number) => void
): Promise<number> {
  const started = Date.now();
  const engine = await import('./inpaint');
  const plane = { data: pixels, width, height };
  const grown = settings.grow !== 0 ? engine.growMask(mask, width, height, settings.grow) : mask;

  if (settings.method === 'patch') {
    const session = engine.createPatchSession(plane, grown, settings);
    if (session) {
      for (;;) {
        const step = engine.stepPatch(session, 40);
        onProgress(step.progress.done);
        if (step.done) break;
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  } else if (settings.method === 'smooth') {
    engine.smoothFill(plane, grown, p => onProgress(p.done));
  } else if (settings.method === 'blur') {
    engine.blurFill(plane, grown, settings.strength);
  } else {
    engine.pixelateFill(plane, grown, settings.strength);
  }

  if (settings.feather > 0 && (settings.method === 'patch' || settings.method === 'smooth')) {
    engine.featherEdges(plane, grown, settings.feather);
  }
  return Date.now() - started;
}
