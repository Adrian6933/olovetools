// ============================================================================
// The diff, off the main thread.
// ----------------------------------------------------------------------------
// Even at O(ND), comparing two multi-megabyte files takes long enough to drop
// frames. Anything past the threshold in useDiffSnap is handed to this worker
// so the editors keep responding while it runs — and so a runaway comparison
// can be terminated instead of freezing the tab.
// ============================================================================

import { runDiff } from './diff';
import type { Anchor, CompareOptions, DiffResult } from '../types';

export interface WorkerRequest {
  id: number;
  textA: string;
  textB: string;
  options: CompareOptions;
  anchors: Anchor[];
}

export interface WorkerResponse {
  id: number;
  result?: DiffResult;
  error?: string;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, textA, textB, options, anchors } = event.data;
  try {
    const result = runDiff(textA, textB, options, anchors);
    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      error: error instanceof Error ? error.message : 'diff-failed',
    };
    self.postMessage(response);
  }
};
