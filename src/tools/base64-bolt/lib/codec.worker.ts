/// <reference lib="webworker" />
// ============================================================================
// The codec, off the main thread.
// ----------------------------------------------------------------------------
// Base64 is cheap per byte and ruinous in bulk: a 40 MB font becomes a 54
// million character string, and building that on the main thread freezes the
// tab for seconds with no way to cancel. Here:
//
//  * files are consumed in 3-byte-aligned chunks, so each chunk encodes to a
//    self-contained, unpadded quartet run and the pieces concatenate without
//    fixing up boundaries;
//  * progress is real (bytes encoded, not bytes read) and cancellation lands
//    between chunks;
//  * the extras that make the result *measurable* — the gzip size of the
//    payload and its SHA-256 — are computed here too, on the same bytes,
//    instead of forcing a second pass on the UI thread. `CompressionStream`
//    and `crypto.subtle` are both available to workers, both native, and
//    neither touches the network.
// ============================================================================

import { encodeBytes, decodeBase64, type EncodeOptions } from './base64';
import { measure, NO_EXTRAS, type Extras } from './measure';
import { sniff, type Format } from './sniff';

const scope = self as unknown as DedicatedWorkerGlobalScope;

/** 3 MB, a multiple of 3 so every chunk is a whole number of Base64 quartets. */
const CHUNK = 3 * 1024 * 1024;
const PROGRESS_MS = 100;

export type { Extras } from './measure';

export interface EncodeRequest {
  type: 'encode';
  id: string;
  /** Either a file (streamed) or bytes already in hand. */
  file?: File;
  bytes?: Uint8Array;
  options: EncodeOptions;
  /** Compute gzip size and SHA-256 as well. */
  extras: boolean;
}

export interface DecodeRequest {
  type: 'decode';
  id: string;
  text: string;
  extras: boolean;
}

export interface CancelRequest {
  type: 'cancel';
  id: string;
}

export type CodecRequest = EncodeRequest | DecodeRequest | CancelRequest;

export interface Progress {
  type: 'progress';
  id: string;
  loaded: number;
  total: number;
}

export interface EncodeDone {
  type: 'encoded';
  id: string;
  base64: string;
  rawBytes: number;
  /** Length before wrapping was applied. */
  encodedChars: number;
  format: Format;
  /** First 64 bytes, for the hex inspector — the whole payload is not sent back. */
  head: Uint8Array;
  extras: Extras;
  ms: number;
}

export interface DecodeDone {
  type: 'decoded';
  id: string;
  bytes: Uint8Array;
  format: Format;
  declaredMime: string;
  alphabet: 'base64' | 'base64url';
  issues: { kind: string; at?: number; detail?: string }[];
  extras: Extras;
  ms: number;
}

export interface Failed {
  type: 'error';
  id: string;
  /** Dictionary key, not a sentence: the UI owns the wording in nine languages. */
  code: string;
}

export interface Cancelled {
  type: 'cancelled';
  id: string;
}

export type CodecResponse = Progress | EncodeDone | DecodeDone | Failed | Cancelled;

const cancelled = new Set<string>();

// ---------------------------------------------------------------------------
// Encode
// ---------------------------------------------------------------------------

/** Reads a Blob in fixed, 3-aligned chunks. `Blob.slice` never copies the whole file. */
async function* readChunks(blob: Blob): AsyncGenerator<Uint8Array> {
  for (let offset = 0; offset < blob.size; offset += CHUNK) {
    const slice = blob.slice(offset, Math.min(offset + CHUNK, blob.size));
    yield new Uint8Array(await slice.arrayBuffer());
  }
}

async function runEncode(request: EncodeRequest): Promise<void> {
  const started = performance.now();
  const { id, options } = request;

  // The extras and the sniff both need the whole payload, and so does a
  // single-chunk file, so small inputs skip the chunk machinery entirely.
  if (request.bytes) {
    const bytes = request.bytes;
    const base64 = encodeBytes(bytes, options);
    scope.postMessage({
      type: 'encoded',
      id,
      base64,
      rawBytes: bytes.length,
      encodedChars: base64.replace(/[\r\n]/g, '').length,
      format: sniff(bytes),
      head: bytes.slice(0, 64),
      extras: await measure(bytes, request.extras),
      ms: performance.now() - started,
    } as EncodeDone);
    return;
  }

  const file = request.file;
  if (!file) {
    scope.postMessage({ type: 'error', id, code: 'no-input' } as Failed);
    return;
  }

  const pieces: string[] = [];
  let loaded = 0;
  let lastPost = started;
  // 4 KB, not 64: `sniff` needs room to find the member name that tells a .docx
  // from a plain .zip. Only the first 64 bytes are shipped to the UI.
  let probe: Uint8Array = new Uint8Array(0);
  for await (const chunk of readChunks(file)) {
    if (cancelled.has(id)) {
      cancelled.delete(id);
      scope.postMessage({ type: 'cancelled', id } as Cancelled);
      return;
    }
    if (!probe.length) probe = chunk.slice(0, 4096);

    loaded += chunk.length;
    const isLast = loaded >= file.size;
    pieces.push(
      encodeBytes(chunk, {
        ...options,
        // Wrapping is applied once, over the joined string: wrapping per chunk
        // would put a break at every 3 MB boundary regardless of column.
        wrap: 0,
        padding: isLast ? options.padding : true,
      })
    );

    const now = performance.now();
    if (now - lastPost >= PROGRESS_MS) {
      lastPost = now;
      scope.postMessage({ type: 'progress', id, loaded, total: file.size } as Progress);
      // `for await` only drains microtasks and an in-memory Blob resolves in
      // one, so without yielding the loop the incoming 'cancel' message is
      // never dispatched and Stop does nothing.
      await new Promise(resolve => setTimeout(resolve, 0));
      if (cancelled.has(id)) {
        cancelled.delete(id);
        scope.postMessage({ type: 'cancelled', id } as Cancelled);
        return;
      }
    }
  }

  const joined = pieces.join('');
  const wrapped = applyWrap(joined, options);

  // The extras need the bytes again. For a single chunk we still have them in
  // scope conceptually, but re-reading a Blob is cheap and keeps peak memory at
  // one copy rather than two.
  let extras: Extras = NO_EXTRAS;
  if (request.extras) {
    const all = new Uint8Array(await file.arrayBuffer());
    extras = await measure(all, true);
  }

  scope.postMessage({
    type: 'encoded',
    id,
    base64: wrapped,
    rawBytes: file.size,
    encodedChars: joined.length,
    format: sniff(probe),
    head: probe.slice(0, 64),
    extras,
    ms: performance.now() - started,
  } as EncodeDone);
}

function applyWrap(text: string, options: EncodeOptions): string {
  if (!options.wrap || options.wrap >= text.length) return text;
  const eol = options.crlf ? '\r\n' : '\n';
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += options.wrap) parts.push(text.slice(i, i + options.wrap));
  return parts.join(eol);
}

// ---------------------------------------------------------------------------
// Decode
// ---------------------------------------------------------------------------

async function runDecode(request: DecodeRequest): Promise<void> {
  const started = performance.now();
  const { id } = request;
  const { value, error } = decodeBase64(request.text);

  if (error) {
    scope.postMessage({ type: 'error', id, code: error } as Failed);
    return;
  }

  const bytes = value.bytes;
  const format = value.declaredMime
    ? { ...sniff(bytes), mime: value.declaredMime || sniff(bytes).mime }
    : sniff(bytes);

  scope.postMessage(
    {
      type: 'decoded',
      id,
      bytes,
      format,
      declaredMime: value.declaredMime,
      alphabet: value.alphabet,
      issues: value.issues,
      extras: await measure(bytes, request.extras),
      ms: performance.now() - started,
    } as DecodeDone,
    // Hand the buffer over instead of cloning it: a 60 MB payload would
    // otherwise exist twice for the duration of the postMessage.
    [bytes.buffer as ArrayBuffer]
  );
}

// ---------------------------------------------------------------------------
// Queue
// ---------------------------------------------------------------------------

let queue: Promise<void> = Promise.resolve();

scope.onmessage = (event: MessageEvent<CodecRequest>) => {
  const request = event.data;
  if (request.type === 'cancel') {
    cancelled.add(request.id);
    return;
  }
  queue = queue.then(async () => {
    if (cancelled.has(request.id)) {
      cancelled.delete(request.id);
      scope.postMessage({ type: 'cancelled', id: request.id } as Cancelled);
      return;
    }
    try {
      if (request.type === 'encode') await runEncode(request);
      else await runDecode(request);
    } catch (error) {
      scope.postMessage({
        type: 'error',
        id: request.id,
        code: error instanceof RangeError ? 'too-large' : 'crashed',
      } as Failed);
    }
  });
};
