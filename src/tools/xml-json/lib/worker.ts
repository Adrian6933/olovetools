// ============================================================================
// Conversion worker.
// ----------------------------------------------------------------------------
// Only strings cross the boundary — the source in, the converted text plus the
// counters out. The AST stays here and dies with the message: structured
// cloning a tree with a hundred thousand nodes costs more than building it.
//
// The whole conversion module is pure, so the main thread can run the exact
// same call when the worker cannot be created (older Safari, blocked blob
// workers, SSR). Same code, same result, one less thread.
// ============================================================================

import type { ConversionResult, Direction, ToJsonOptions, ToXmlOptions } from '../types';
import { jsonToXml, xmlToJson } from './convert';

export interface WorkerRequest {
  id: number;
  direction: Direction;
  source: string;
  jsonOptions: ToJsonOptions;
  xmlOptions: ToXmlOptions;
  roundTrip: boolean;
}

export interface WorkerResponse extends ConversionResult {
  id: number;
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, direction, source, jsonOptions, xmlOptions, roundTrip } = event.data;
  const result =
    direction === 'xml-to-json'
      ? xmlToJson(source, jsonOptions, roundTrip)
      : jsonToXml(source, xmlOptions, roundTrip);

  const response: WorkerResponse = { ...result, id, stats: { ...result.stats, offThread: true } };
  (self as unknown as Worker).postMessage(response);
};
