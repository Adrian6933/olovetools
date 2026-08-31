/// <reference lib="webworker" />
// ============================================================================
// Batch generation, off the main thread.
// ----------------------------------------------------------------------------
// A 100 000 item batch is ~1.6 MB of entropy plus a Set-based duplicate sweep.
// On the main thread that freezes the page for long enough to drop the caret
// out of an input; here the UI keeps painting and the buffer comes back as a
// transferable, so the 1.6 MB is moved, not copied.
// ============================================================================

import { generateBatch, type BatchRequest, type BatchResult } from './engine';
// Static on purpose — see the note in wasmDigest.ts.
import { preferNativeDigest } from './wasmDigest';

const scope = self as unknown as DedicatedWorkerGlobalScope;

export interface WorkerRequest extends BatchRequest {
  id: string;
}

export type WorkerResponse =
  | ({ type: 'done'; id: string } & Omit<BatchResult, 'bytes'> & { bytes: ArrayBuffer | null })
  | { type: 'error'; id: string; message: string };

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, ...request } = event.data;
  try {
    const result = await generateBatch(request, preferNativeDigest);
    const buffer = result.bytes ? result.bytes.buffer : null;
    const message: WorkerResponse = {
      type: 'done',
      id,
      kind: result.kind,
      bytes: buffer as ArrayBuffer | null,
      strings: result.strings,
      count: result.count,
      ms: result.ms,
      duplicates: result.duplicates,
    };
    scope.postMessage(message, buffer ? [buffer as ArrayBuffer] : []);
  } catch (error) {
    scope.postMessage({
      type: 'error',
      id,
      message: error instanceof Error ? error.message : 'UNKNOWN',
    } satisfies WorkerResponse);
  }
};
