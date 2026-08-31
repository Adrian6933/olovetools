/// <reference lib="webworker" />
// ============================================================================
// The hashing engine, off the main thread.
// ----------------------------------------------------------------------------
// Two things matter here and neither was possible with the old approach
// (`FileReader.readAsArrayBuffer` + `crypto.subtle.digest`):
//
//  1. Streaming. `crypto.subtle.digest` is one-shot: the entire file has to sit
//     in RAM as an ArrayBuffer, and FileReader keeps a second copy while it
//     reads. A 3 GB ISO simply throws. Here the file is consumed through
//     `File.stream()` in ~64 KB chunks, so peak memory is a chunk, not a file,
//     and the progress bar reflects bytes actually hashed instead of bytes
//     read off the disk.
//
//  2. One pass, many digests. The incremental API means MD5, SHA-256 and
//     BLAKE3 can all be fed the same chunk. Reading a 4 GB file once and
//     updating three hashers is dramatically cheaper than reading it three
//     times, which is what a per-algorithm one-shot digest forces.
//
// hash-wasm embeds its WebAssembly as base64 inside the JS bundle, so there is
// no CDN fetch and no network access of any kind — the "100% local" claim on
// the page stays literally true, including offline.
// ============================================================================

import {
  createBLAKE2b,
  createBLAKE3,
  createCRC32,
  createHMAC,
  createMD5,
  createRIPEMD160,
  createSHA1,
  createSHA256,
  createSHA3,
  createSHA384,
  createSHA512,
  createXXHash64,
} from 'hash-wasm';
import type { AlgoId } from './algorithms';

const scope = self as unknown as DedicatedWorkerGlobalScope;

export interface HashRequestFile {
  type: 'file';
  id: string;
  file: File;
  algos: AlgoId[];
  hmacKey?: string;
}

export interface HashRequestBytes {
  type: 'bytes';
  id: string;
  bytes: Uint8Array;
  algos: AlgoId[];
  hmacKey?: string;
}

export interface HashCancel {
  type: 'cancel';
  id: string;
}

export type HashRequest = HashRequestFile | HashRequestBytes | HashCancel;

export interface HashProgress {
  type: 'progress';
  id: string;
  loaded: number;
  total: number;
  bytesPerSecond: number;
}

export interface HashDone {
  type: 'done';
  id: string;
  digests: Partial<Record<AlgoId, string>>;
  ms: number;
  bytes: number;
}

export interface HashFailed {
  type: 'error';
  id: string;
  message: string;
}

export interface HashCancelled {
  type: 'cancelled';
  id: string;
}

export type HashResponse = HashProgress | HashDone | HashFailed | HashCancelled;

// ---------------------------------------------------------------------------
// Hasher factories. Imported statically: a dynamic import here would force
// code splitting inside the worker bundle, which Vite cannot do with its
// default IIFE worker format. Only the algorithms actually ticked get
// instantiated, so an unused module never compiles its WebAssembly.
// ---------------------------------------------------------------------------
type Hasher = {
  init: () => unknown;
  update: (data: Uint8Array) => unknown;
  digest: (outputType?: 'hex') => string;
};

async function createHasher(algo: AlgoId, hmacKey?: string): Promise<Hasher> {
  const base = (): Promise<Hasher> => {
    switch (algo) {
      case 'md5':
        return createMD5() as Promise<Hasher>;
      case 'sha1':
        return createSHA1() as Promise<Hasher>;
      case 'sha256':
        return createSHA256() as Promise<Hasher>;
      case 'sha384':
        return createSHA384() as Promise<Hasher>;
      case 'sha512':
        return createSHA512() as Promise<Hasher>;
      case 'sha3-256':
        return createSHA3(256) as Promise<Hasher>;
      case 'sha3-512':
        return createSHA3(512) as Promise<Hasher>;
      case 'blake2b-256':
        return createBLAKE2b(256) as Promise<Hasher>;
      case 'blake3':
        return createBLAKE3(256) as Promise<Hasher>;
      case 'ripemd160':
        return createRIPEMD160() as Promise<Hasher>;
      case 'crc32':
        return createCRC32() as Promise<Hasher>;
      case 'xxhash64':
        return createXXHash64() as Promise<Hasher>;
      default:
        return createSHA256() as Promise<Hasher>;
    }
  };

  if (hmacKey) {
    return (await createHMAC(base() as any, hmacKey)) as unknown as Hasher;
  }
  return base();
}

// ---------------------------------------------------------------------------
// Run bookkeeping
// ---------------------------------------------------------------------------
const cancelled = new Set<string>();

/** Progress is posted at most every 120 ms: a 4 GB file produces ~60k chunks. */
const PROGRESS_INTERVAL_MS = 120;

/**
 * Streams a Blob. `File.stream()` is the cheap path (the browser hands out
 * chunks without ever materialising the whole file); the slice fallback exists
 * for the Safari versions that predate it, and reads 8 MB at a time.
 */
async function* readBlob(blob: Blob): AsyncGenerator<Uint8Array> {
  if (typeof blob.stream === 'function') {
    const reader = blob.stream().getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) yield value as Uint8Array;
      }
    } finally {
      reader.releaseLock?.();
    }
    return;
  }

  const CHUNK = 8 * 1024 * 1024;
  for (let offset = 0; offset < blob.size; offset += CHUNK) {
    const slice = blob.slice(offset, Math.min(offset + CHUNK, blob.size));
    yield new Uint8Array(await slice.arrayBuffer());
  }
}

async function run(request: HashRequestFile | HashRequestBytes): Promise<void> {
  const { id, algos } = request;
  const total = request.type === 'file' ? request.file.size : request.bytes.length;

  try {
    const hashers = await Promise.all(
      algos.map(async algo => ({ algo, hasher: await createHasher(algo, request.hmacKey) }))
    );
    for (const entry of hashers) entry.hasher.init();

    const started = performance.now();
    let loaded = 0;
    let lastPost = started;

    if (request.type === 'bytes') {
      for (const entry of hashers) entry.hasher.update(request.bytes);
      loaded = total;
    } else {
      for await (const chunk of readBlob(request.file)) {
        if (cancelled.has(id)) {
          cancelled.delete(id);
          scope.postMessage({ type: 'cancelled', id } as HashCancelled);
          return;
        }
        for (const entry of hashers) entry.hasher.update(chunk);
        loaded += chunk.length;

        const now = performance.now();
        if (now - lastPost >= PROGRESS_INTERVAL_MS) {
          lastPost = now;
          scope.postMessage({
            type: 'progress',
            id,
            loaded,
            total,
            bytesPerSecond: loaded / Math.max(0.001, (now - started) / 1000),
          } as HashProgress);

          // Hand the event loop back for one turn. `for await` only drains
          // microtasks, and a Blob that is already in memory resolves its
          // stream reads in a microtask too — so without this the worker never
          // gets round to dispatching the incoming 'cancel' message and Stop
          // did nothing at all until the whole file had been read.
          await new Promise(resolve => setTimeout(resolve, 0));
          if (cancelled.has(id)) {
            cancelled.delete(id);
            scope.postMessage({ type: 'cancelled', id } as HashCancelled);
            return;
          }
        }
      }
    }

    const digests: Partial<Record<AlgoId, string>> = {};
    for (const entry of hashers) digests[entry.algo] = entry.hasher.digest('hex');

    const ms = performance.now() - started;
    scope.postMessage({ type: 'done', id, digests, ms, bytes: loaded } as HashDone);
  } catch (error) {
    cancelled.delete(id);
    scope.postMessage({
      type: 'error',
      id,
      message: error instanceof Error ? error.message : String(error),
    } as HashFailed);
  }
}

// Requests are queued: two 4 GB files hashing at once would fight for the same
// disk and report meaningless throughput for both.
let queue: Promise<void> = Promise.resolve();

scope.onmessage = (event: MessageEvent<HashRequest>) => {
  const request = event.data;
  if (request.type === 'cancel') {
    cancelled.add(request.id);
    return;
  }
  queue = queue.then(() => {
    if (cancelled.has(request.id)) {
      cancelled.delete(request.id);
      scope.postMessage({ type: 'cancelled', id: request.id } as HashCancelled);
      return;
    }
    return run(request);
  });
};
