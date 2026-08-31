// ============================================================================
// Driving the parser from React
// ----------------------------------------------------------------------------
// Two rules, the same ones the rest of the suite follows:
//
//  * Only the newest request counts. Every message carries an id and stale
//    answers are dropped, so a slow pass over a 200 KB paste can never overwrite
//    the fresh one for what is on screen now.
//  * The worker is an optimisation, never a requirement. Blocked by CSP, no
//    `Worker` at all, or an error inside it, and the exact same module runs
//    inline — the preview always renders.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parse } from './parser';
import { render } from './render';
import type { DocStats, TocEntry, WorkerRequest, WorkerResponse } from '../types';

const DEBOUNCE_MS = 160;

export const EMPTY_STATS: DocStats = {
  words: 0,
  chars: 0,
  charsNoSpaces: 0,
  lines: 0,
  readingMinutes: 1,
  headings: 0,
  links: 0,
  images: 0,
  codeBlocks: 0,
  tables: 0,
  tasks: { done: 0, total: 0 },
};

export interface Compiled {
  html: string;
  toc: TocEntry[];
  stats: DocStats;
  frontMatter: string;
  /** The text moved on and what is on screen no longer describes it. */
  stale: boolean;
}

function compileInline(text: string): Omit<Compiled, 'stale'> {
  const doc = parse(text);
  return {
    html: render(doc.blocks, { anchors: true }),
    toc: doc.toc,
    stats: doc.stats,
    frontMatter: doc.frontMatter,
  };
}

export function useCompiled(text: string): Compiled {
  // The first paint is synchronous on purpose: a preview that arrives one tick
  // later reads as a flash of empty panel on every navigation.
  const [result, setResult] = useState(() => ({ ...compileInline(text), forLength: text.length }));

  const workerRef = useRef<Worker | null>(null);
  const nextId = useRef(1);
  const pending = useRef(0);
  const broken = useRef(false);

  useEffect(() => {
    if (typeof Worker === 'undefined') {
      broken.current = true;
      return;
    }
    let worker: Worker;
    try {
      worker = new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' });
    } catch {
      broken.current = true;
      return;
    }
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id !== pending.current) return;
      const { html, toc, stats, frontMatter } = event.data;
      setResult({ html, toc, stats, frontMatter, forLength: stats.chars });
    };
    worker.onerror = () => {
      broken.current = true;
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = useCallback((value: string) => {
    const worker = workerRef.current;
    if (!worker || broken.current) {
      setResult({ ...compileInline(value), forLength: value.length });
      return;
    }
    const id = nextId.current++;
    pending.current = id;
    const message: WorkerRequest = { id, text: value };
    worker.postMessage(message);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => run(text), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, run]);

  return useMemo(
    () => ({
      html: result.html,
      toc: result.toc,
      stats: result.stats,
      frontMatter: result.frontMatter,
      stale: result.forLength !== text.length,
    }),
    [result, text.length]
  );
}
