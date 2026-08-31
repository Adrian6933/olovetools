/// <reference lib="webworker" />
// ============================================================================
// The regex runs off the main thread — and this is not a performance nicety.
// ----------------------------------------------------------------------------
// A regex tester is the one tool whose whole purpose is to run code the user
// is still getting wrong, and getting it wrong can mean `(a+)+$`, which on this
// machine took 245,932 ms against a 31-character string. On the main thread
// that is a tab the user cannot close cleanly, with their pattern in it.
//
// Inside a worker the same run is a thread the page can terminate. The hook
// starts a watchdog, and when it fires the worker is killed and replaced. The
// user loses the run; they do not lose the tab.
// ============================================================================

import { run } from './engine';
import type { RunRequest, RunResult } from '../types';

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<RunRequest>) => {
  const result: RunResult = run(event.data);
  scope.postMessage(result);
};
