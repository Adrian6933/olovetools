// ============================================================================
// Validation worker.
// ----------------------------------------------------------------------------
// Only the *validation* pass runs here, and only the verdict crosses back:
// issues, repair list, timings and stats. The AST itself stays on the main
// thread — structured-cloning a million-node tree costs more than parsing it,
// so shipping it back would undo the win.
//
// The split is what keeps typing smooth on a large paste: the "is this valid,
// and where exactly does it break" feedback is off-thread, while building the
// tree (the part the user explicitly asks for) happens once, on demand.
// ============================================================================

import { parseJson } from './parse';
import { computeStats } from './stats';
import type { DocStats, ParseIssue, IssueCode } from '../types';

export interface WorkerRequest {
  id: number;
  text: string;
  tolerant: boolean;
}

export interface WorkerResponse {
  id: number;
  ok: boolean;
  issues: ParseIssue[];
  repairs: IssueCode[];
  ms: number;
  stats: DocStats;
  /** True when a strict parse failed but a tolerant one would succeed. */
  repairable: boolean;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, text, tolerant } = event.data;

  const strict = parseJson(text, { tolerant });
  let repairable = false;
  let result = strict;

  if (!strict.ok && !tolerant) {
    const relaxed = parseJson(text, { tolerant: true });
    repairable = relaxed.ok;
    // Keep the strict error (that is what the user must fix) but surface the
    // tolerant parser's findings so the repair button can explain itself.
    if (relaxed.ok) result = { ...strict, repairs: relaxed.repairs };
  }

  const stats = computeStats(result.ok ? result.root : null, text);

  const response: WorkerResponse = {
    id,
    ok: result.ok,
    issues: result.issues,
    repairs: result.repairs,
    ms: result.ms,
    stats,
    repairable,
  };

  (self as unknown as Worker).postMessage(response);
};
