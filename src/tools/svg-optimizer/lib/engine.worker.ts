// ============================================================================
// The optimizer runs off the main thread.
// ----------------------------------------------------------------------------
// svgo's multipass over a detailed map or a full icon set is measured in
// seconds, not milliseconds, and it is pure CPU. On the main thread that is a
// frozen tab: no scroll, no cancel button, no spinner animation. Here the page
// stays responsive and the run can be abandoned by terminating the worker.
// ============================================================================

import { runOptimize } from './engine';
import type { OptimizeRequest, OptimizeResult } from './types';

self.onmessage = async (event: MessageEvent<OptimizeRequest>) => {
  const request = event.data;
  try {
    const result = await runOptimize(request);
    (self as unknown as Worker).postMessage(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const failure: OptimizeResult = {
      ok: false,
      id: request.id,
      reason: 'crash',
      detail: message,
      repairs: [],
    };
    (self as unknown as Worker).postMessage(failure);
  }
};
