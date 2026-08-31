/// <reference lib="webworker" />
import { traceImageData, type TraceOptions } from './trace';

// Tracing a 900 px photo at five levels is ~250 ms of tight loops. On the main
// thread that is a visibly frozen page, so it runs here instead.
self.onmessage = (event: MessageEvent<{ image: ImageData; opts: TraceOptions }>) => {
  try {
    const paths = traceImageData(event.data.image, event.data.opts);
    (self as unknown as Worker).postMessage({ ok: true, paths });
  } catch (error) {
    (self as unknown as Worker).postMessage({ ok: false, error: String(error) });
  }
};
