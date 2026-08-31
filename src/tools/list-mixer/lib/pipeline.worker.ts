// ============================================================================
// Pipeline worker.
// ----------------------------------------------------------------------------
// Only the module below is pulled in here — no React, no lucide, no library —
// so this bundle stays a couple of kilobytes and the main thread keeps its own
// synchronous copy for small lists (and for browsers that refuse Workers)
// without duplicating anything heavy.
// ============================================================================

import { runPipeline } from './pipeline';
import type { RunRequest, RunResponse } from '../types';

self.onmessage = (event: MessageEvent<RunRequest>) => {
  const request = event.data;
  const result = runPipeline(request.source, request.listB, request.input, request.pipeline, request.locale);
  const response: RunResponse = { token: request.token, result };
  (self as unknown as Worker).postMessage(response);
};
