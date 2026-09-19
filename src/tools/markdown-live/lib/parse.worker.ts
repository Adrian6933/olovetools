/// <reference lib="webworker" />
// ============================================================================
// Parsing runs off the main thread.
// ----------------------------------------------------------------------------
// The old parser ran its whole regex chain synchronously inside render, on
// every keystroke, over the entire document — and then again whenever the theme
// or the tab changed, because nothing was memoised. On a long README that is a
// caret that stutters while you type.
//
// Syntax highlighting is deliberately *not* done here: Prism runs against the
// DOM nodes once the HTML is on screen, so a worker round trip never carries a
// grammar bundle with it.
// ============================================================================

import { parse } from './parser';
import { render } from './render';
import type { WorkerRequest, WorkerResponse } from '../types';

const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, text, anchorLabel } = event.data;
  const doc = parse(text);
  const message: WorkerResponse = {
    id,
    html: render(doc.blocks, { anchors: true, anchorLabel }),
    toc: doc.toc,
    stats: doc.stats,
    frontMatter: doc.frontMatter,
  };
  scope.postMessage(message);
};
