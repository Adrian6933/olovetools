// ============================================================================
// ZipFlow — shared types
// ============================================================================

/** Compression presets offered in the UI. `smart` decides per file. */
export type Preset = 'store' | 'fast' | 'balanced' | 'max' | 'smart';

/** Per-file override. `auto` means "follow the preset". */
export type Method = 'auto' | 'store' | 'deflate';

/** One staged file waiting to be packed. */
export interface QueueItem {
  id: string;
  file: File;
  /** Path inside the archive. Editable — this is what ends up in the ZIP. */
  path: string;
  method: Method;
}

/**
 * Metadata read straight from the ZIP central directory: available without
 * decompressing a single byte, which is why the explorer can show sizes and
 * ratios instantly on archives of any size.
 */
export interface EntryMeta {
  path: string;
  dir: boolean;
  /** Uncompressed size in bytes. */
  size: number;
  /** Stored (compressed) size in bytes. */
  packed: number;
  crc32: number | null;
  /** Last-modified timestamp in ms. */
  date: number;
}

/** A node of the rendered directory tree. Sizes are aggregated for folders. */
export interface TreeNode {
  name: string;
  path: string;
  dir: boolean;
  size: number;
  packed: number;
  entry: EntryMeta | null;
  children: TreeNode[];
}

/** Result of packing an archive, with the numbers the stats panel shows. */
export interface BuildResult {
  blob: Blob;
  /** Sum of the input file sizes. */
  original: number;
  /** Milliseconds the worker spent packing. */
  ms: number;
  /** How many files were stored raw because deflating them was pointless. */
  stored: number;
  /** Total number of files packed. */
  total: number;
}

export interface BenchRow {
  preset: Preset;
  size: number;
  ms: number;
}

// ---------------------------------------------------------------------------
// Worker protocol
// ---------------------------------------------------------------------------

export interface PackFile {
  path: string;
  blob: Blob;
  method: Method;
}

export type WorkerRequest =
  | { id: number; type: 'create'; files: PackFile[]; preset: Preset; comment: string }
  | { id: number; type: 'bench'; files: PackFile[]; presets: Preset[] }
  | { id: number; type: 'open'; file: File; checkCrc: boolean }
  | { id: number; type: 'read'; path: string }
  | { id: number; type: 'repack'; paths: string[]; preset: Preset }
  | { id: number; type: 'close' };

/**
 * A request before the engine stamps its correlation id on it. Written as a
 * conditional type so it distributes over the union: a plain
 * `Omit<WorkerRequest, 'id'>` collapses to the shared keys and loses every
 * per-message field.
 */
export type WorkerRequestPayload = WorkerRequest extends infer T
  ? T extends { id: number }
    ? Omit<T, 'id'>
    : never
  : never;

export type WorkerResponse =
  | { id: number; type: 'progress'; percent: number; current: string | null }
  | { id: number; type: 'done'; result: unknown }
  | { id: number; type: 'error'; code: ZipErrorCode; message: string };

/** Distinguishes the failures worth showing a different message for. */
export type ZipErrorCode = 'encrypted' | 'corrupt' | 'memory' | 'unknown';
