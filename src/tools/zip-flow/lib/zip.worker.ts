// ============================================================================
// ZipFlow worker
// ----------------------------------------------------------------------------
// Deflating 200 MB on the main thread freezes the tab: no scrolling, no
// cancel button, no progress repaint. All of it happens here instead, and the
// UI only ever receives numbers and finished Blobs.
// ============================================================================

/// <reference lib="webworker" />

import { classifyError, createArchive, ZipSession } from './zipCore';
import type { BenchRow, WorkerRequest, WorkerResponse } from '../types';

const session = new ZipSession();

function post(message: WorkerResponse) {
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(message);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  const progress = (percent: number, current: string | null) =>
    post({ id: req.id, type: 'progress', percent, current });

  try {
    switch (req.type) {
      case 'create': {
        const started = performance.now();
        const blob = await createArchive(req.files, req.preset, req.comment, progress);
        post({ id: req.id, type: 'done', result: { blob, ms: performance.now() - started } });
        break;
      }

      case 'bench': {
        // Same input packed with every preset, so the numbers on screen are
        // measured on the user's own files, not a table of averages.
        const rows: BenchRow[] = [];
        for (let i = 0; i < req.presets.length; i++) {
          const preset = req.presets[i];
          const started = performance.now();
          const blob = await createArchive(req.files, preset, '', p =>
            progress((i * 100 + p) / req.presets.length, preset)
          );
          rows.push({ preset, size: blob.size, ms: performance.now() - started });
        }
        post({ id: req.id, type: 'done', result: rows });
        break;
      }

      case 'open': {
        const entries = await session.open(req.file, req.checkCrc);
        post({ id: req.id, type: 'done', result: entries });
        break;
      }

      case 'read': {
        const blob = await session.read(req.path, progress);
        post({ id: req.id, type: 'done', result: blob });
        break;
      }

      case 'repack': {
        const blob = await session.repack(req.paths, req.preset, progress);
        post({ id: req.id, type: 'done', result: blob });
        break;
      }

      case 'close': {
        session.close();
        post({ id: req.id, type: 'done', result: null });
        break;
      }
    }
  } catch (err) {
    const { code, message } = classifyError(err);
    post({ id: req.id, type: 'error', code, message });
  }
};
