// ============================================================================
// A dónde van los bytes del ZIP.
// ----------------------------------------------------------------------------
// Dos destinos, y la diferencia entre ellos es el techo real de la herramienta:
//
//   * disco: showSaveFilePicker da un flujo de escritura al fichero que elija
//     la persona, así que los bytes salen de la pestaña según se generan y no
//     hay techo ninguno más allá del disco duro.
//   * memoria: cuando el navegador no tiene esa API (Firefox y Safari a día de
//     hoy) se acumula y se descarga al final. Ni siquiera aquí se guarda todo
//     en el heap: cada pocos megas se cierra un Blob, y un Blob lo puede
//     respaldar el navegador en disco. Eso es lo que separa "se me murió la
//     pestaña a los 500 fotogramas" de "van 9.000 y sigue".
// ============================================================================

export type SinkKind = 'disk' | 'memory';

export interface ZipSink {
  readonly kind: SinkKind;
  write(chunk: Uint8Array): Promise<void>;
  /** Cierra y, en memoria, devuelve el archivo terminado. */
  close(): Promise<Blob | null>;
  /** Tira lo escrito. Para cuando la persona cancela a medias. */
  abort(): Promise<void>;
}

type SaveFilePicker = (options: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{
  createWritable: () => Promise<{
    write: (data: BufferSource | Blob) => Promise<void>;
    close: () => Promise<void>;
    abort?: () => Promise<void>;
  }>;
}>;

export function canSaveToDisk(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).showSaveFilePicker === 'function';
}

/**
 * Pide el fichero de destino. Devuelve null si la persona cierra el diálogo,
 * que no es un error: es un "mejor no".
 */
export async function createDiskSink(suggestedName: string): Promise<ZipSink | null> {
  const picker = (window as any).showSaveFilePicker as SaveFilePicker | undefined;
  if (!picker) return null;

  let handle;
  try {
    handle = await picker({
      suggestedName,
      types: [{ description: 'ZIP', accept: { 'application/zip': ['.zip'] } }],
    });
  } catch {
    return null;
  }

  const stream = await handle.createWritable();
  return {
    kind: 'disk',
    async write(chunk) {
      // Copia: el flujo escribe de forma asíncrona y el buffer de origen se
      // reutiliza en el siguiente fotograma. Sin la copia se escriben bytes de
      // otra imagen y el ZIP sale con las entradas mezcladas.
      await stream.write(chunk.slice());
    },
    async close() {
      await stream.close();
      return null;
    },
    async abort() {
      try {
        if (stream.abort) await stream.abort();
        else await stream.close();
      } catch {
        // El fichero ya está en el disco a medio escribir; no hay nada más que
        // hacer desde aquí, y reventar ahora taparía el motivo real de la parada.
      }
    },
  };
}

const FLUSH_BYTES = 8 * 1024 * 1024;

/** Destino de reserva: junta en Blobs y entrega uno solo al final. */
export function createMemorySink(): ZipSink {
  let parts: BlobPart[] = [];
  let buffer: Uint8Array[] = [];
  let buffered = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    parts.push(new Blob(buffer));
    buffer = [];
    buffered = 0;
  };

  return {
    kind: 'memory',
    async write(chunk) {
      buffer.push(chunk.slice());
      buffered += chunk.length;
      if (buffered >= FLUSH_BYTES) flush();
    },
    async close() {
      flush();
      const blob = new Blob(parts, { type: 'application/zip' });
      parts = [];
      return blob;
    },
    async abort() {
      parts = [];
      buffer = [];
      buffered = 0;
    },
  };
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // Con retardo: Safari cancela la descarga en curso si la object URL
  // desaparece en el mismo tick que el click.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
