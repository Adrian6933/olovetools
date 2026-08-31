// ============================================================================
// The pipeline: source text + ordered steps → items + per-step numbers.
// ----------------------------------------------------------------------------
// This is the whole reason the tool stopped overwriting its own output. The
// document is `{ source, pipeline }`; the visible list is derived from it. That
// makes every edit non-destructive (disable a step, drag it earlier, change its
// options) and makes undo/redo cost a few hundred bytes instead of a copy of the
// text per level.
// ============================================================================

import { runStep, type OpContext } from './ops';
import { splitText } from './parse';
import type { InputFormat, RunResult, Step, StepStat } from '../types';

/**
 * A rough cost model in "items processed". Above the worker threshold the run
 * is handed off; below it, going through postMessage would cost more than the
 * work itself.
 */
export function estimateCost(itemCount: number, pipeline: Step[]): number {
  const active = pipeline.filter(step => step.enabled).length;
  return itemCount * Math.max(1, active);
}

/** Beyond this many items the main thread stutters visibly, so the worker runs. */
export const WORKER_THRESHOLD = 20000;

/**
 * Beyond this many characters the pipeline stops running by itself and waits for
 * the button — the same "you press it, the paste does not" rule the rest of the
 * suite follows for the expensive operation.
 */
export const AUTO_LIMIT = 400000;

export function runPipeline(
  source: string,
  listBText: string,
  input: InputFormat,
  pipeline: Step[],
  locale: string
): RunResult {
  const started = now();
  const parsed = splitText(source, input);
  const parsedB = splitText(listBText, input);

  const ctx: OpContext = { locale, listB: parsedB.items };
  const stats: StepStat[] = [];
  let items = parsed.items;

  for (const step of pipeline) {
    if (!step.enabled) {
      stats.push({ id: step.id, itemsIn: items.length, itemsOut: items.length, edited: 0, ms: 0, error: '' });
      continue;
    }
    const stepStart = now();
    const itemsIn = items.length;
    const outcome = runStep(items, step, ctx);
    items = outcome.items;
    stats.push({
      id: step.id,
      itemsIn,
      itemsOut: items.length,
      edited: outcome.edited,
      ms: now() - stepStart,
      error: outcome.error,
    });
  }

  return { items, stats, itemsIn: parsed.items.length, ms: now() - started };
}

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}
