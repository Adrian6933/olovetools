// ============================================================================
// MD5 and SHA-1 from hash-wasm, kept in their own module.
// ----------------------------------------------------------------------------
// Why a separate file: the worker imports this statically (Vite builds workers
// as IIFE, which cannot code-split, so a dynamic import inside the worker graph
// breaks the build), while the main thread reaches it through `await import()`
// so the wasm payload never lands in the island's eager chunk.
//
// hash-wasm embeds its WebAssembly as base64 inside the JS bundle: no CDN
// fetch, no network access, and v3 still works with the network switched off.
// ============================================================================

import { md5, sha1 } from 'hash-wasm';
import { hexToBytes, subtleDigest, type Digest } from './engine';

export const wasmDigest: Digest = async (algo, data) =>
  hexToBytes(await (algo === 'md5' ? md5(data) : sha1(data)))!;

/** Native SHA-1 when the origin allows it, wasm otherwise (and always for MD5). */
export const preferNativeDigest: Digest = async (algo, data) => {
  try {
    return await subtleDigest(algo, data);
  } catch {
    return wasmDigest(algo, data);
  }
};
