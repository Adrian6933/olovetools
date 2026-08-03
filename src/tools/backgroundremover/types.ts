import type { Quality } from './lib/engine';

export type { Quality };

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  processedSize: number | null;
  originalUrl: string;
  /** Flattened PNG of the current editor state — used for the queue, download and handoff. */
  processedUrl: string | null;
  /**
   * `ready` = loaded and waiting for the user to press "remove background".
   * `idle`  = queued for inference.
   */
  status: 'ready' | 'idle' | 'loading_model' | 'processing' | 'done' | 'error';
  error?: string;

  /** AI alpha mask, one byte per pixel at the original resolution. */
  mask?: Uint8ClampedArray;
  /** Bumped on every re-run so the editor knows to reload its working copy. */
  maskVersion?: number;
  width?: number;
  height?: number;
  /** Device the inference actually ran on. */
  device?: 'gpu' | 'cpu';
  quality?: Quality;
}
