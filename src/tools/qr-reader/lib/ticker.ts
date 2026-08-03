export interface Ticker {
  stop(): void;
}

/**
 * `requestAnimationFrame` stops firing the moment the tab is hidden, and
 * `setInterval` is clamped to about 1 Hz there. Worker timers are not throttled,
 * so the camera keeps being sampled at a usable rate even when the page is not
 * the frontmost thing on screen.
 */
export function createTicker(ms: number, onTick: () => void): Ticker {
  try {
    const src = `let id=0;onmessage=e=>{clearInterval(id);if(e.data>0)id=setInterval(()=>postMessage(0),e.data)}`;
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = () => onTick();
    worker.postMessage(ms);
    return {
      stop() {
        worker.postMessage(0);
        worker.terminate();
      },
    };
  } catch {
    const id = window.setInterval(onTick, ms);
    return {
      stop() {
        window.clearInterval(id);
      },
    };
  }
}
