/// <reference lib="webworker" />
// ============================================================================
// Encoding, off the main thread.
// ----------------------------------------------------------------------------
// A batch of thirty phone photos is thirty decodes, thirty resamples and — with
// a byte budget — up to eight encodes each. On the main thread that is fifteen
// seconds of a frozen tab; the old build did exactly that, so the page stopped
// responding the moment you dropped a folder on it.
//
// The ImageBitmap arrives as a transferable, so a 24 MP frame is moved rather
// than copied, and the Blob goes back the same way. Every import here is
// static: a dynamic `import()` inside a worker breaks the bundled worker build,
// which is why the HEIC and TIFF converters live on the main thread instead.
// ============================================================================

import { encode, supportedFormats } from './encode';
import type { CompressSettings, OutputFormat } from './types';

const scope = self as unknown as DedicatedWorkerGlobalScope;

export interface WorkerRequest {
  id: string;
  kind: 'encode' | 'formats';
  bitmap?: ImageBitmap;
  settings?: CompressSettings;
  sourceMime?: string;
}

export interface WorkerResponse {
  id: string;
  ok: boolean;
  error?: string;
  formats?: OutputFormat[];
  blob?: Blob;
  width?: number;
  height?: number;
  mime?: string;
  quality?: number;
  ssim?: number | null;
  ms?: number;
  attempts?: number;
}

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  if (request.kind === 'formats') {
    try {
      scope.postMessage({ id: request.id, ok: true, formats: await supportedFormats() } as WorkerResponse);
    } catch (error) {
      scope.postMessage({ id: request.id, ok: false, error: String(error) } as WorkerResponse);
    }
    return;
  }

  try {
    const result = await encode(request.bitmap, request.settings, request.sourceMime);
    // The source bitmap was transferred in and is ours to release; leaving it
    // alive is how a batch of thirty photos ends up holding a gigabyte.
    request.bitmap.close();
    scope.postMessage({
      id: request.id,
      ok: true,
      blob: result.blob,
      width: result.width,
      height: result.height,
      mime: result.mime,
      quality: result.quality,
      ssim: result.ssim,
      ms: result.ms,
      attempts: result.attempts,
    } as WorkerResponse);
  } catch (error) {
    try {
      request.bitmap && request.bitmap.close();
    } catch {
      /* Already closed or never valid. */
    }
    scope.postMessage({ id: request.id, ok: false, error: String(error) } as WorkerResponse);
  }
};
