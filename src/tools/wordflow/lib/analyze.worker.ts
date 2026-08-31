/// <reference lib="webworker" />
// ============================================================================
// The analysis runs off the main thread.
// ----------------------------------------------------------------------------
// Segmenting a 200 KB document, grading every sentence and building three
// n-gram tables is 100–300 ms of pure CPU. On the main thread that is a visibly
// stuttering caret on every keystroke, which is the one thing a writing tool
// cannot do. The module has no DOM dependency precisely so it can live here.
// ============================================================================

import { analyze } from './analyze';
import type { WorkerRequest, WorkerResponse } from '../types';

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, text, lang } = event.data;
  const analysis = analyze(text, lang);
  const message: WorkerResponse = { id, analysis };
  scope.postMessage(message);
};
