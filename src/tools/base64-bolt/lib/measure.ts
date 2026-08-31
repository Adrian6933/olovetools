// ============================================================================
// The two measurements that make the result *measurable* rather than merely
// produced: how much the payload actually costs on the wire, and whether the
// bytes are the bytes you started with.
//
// Both are native and both work identically on the main thread and inside a
// worker, so this module is imported by each — there is no second copy of the
// logic to drift.
// ============================================================================

export interface Extras {
  /** Size after gzip, in bytes. -1 when the browser has no CompressionStream. */
  gzipBytes: number;
  /** Lowercase hex SHA-256 of the payload. Empty when unavailable. */
  sha256: string;
}

export const NO_EXTRAS: Extras = { gzipBytes: -1, sha256: '' };

/**
 * Gzipped size, streamed. This is the number that decides whether embedding as
 * a data URL is actually cheaper than a second request: Base64 adds 33%, but
 * gzip claws most of that back on text-like payloads and almost none of it on
 * an already-compressed PNG. Saying "+33%" without this is only half true.
 */
export async function gzipSize(bytes: Uint8Array): Promise<number> {
  const Ctor = (globalThis as { CompressionStream?: typeof CompressionStream }).CompressionStream;
  if (!Ctor) return -1;
  try {
    const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new Ctor('gzip'));
    const reader = stream.getReader();
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) total += (value as Uint8Array).length;
    }
    return total;
  } catch {
    return -1;
  }
}

/** SHA-256 of the payload, so a decode can be checked against the original. */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Insecure context (plain http on a LAN address) has no crypto.subtle.
    return '';
  }
}

export async function measure(bytes: Uint8Array, wanted: boolean): Promise<Extras> {
  if (!wanted || !bytes.length) return NO_EXTRAS;
  const [gzipBytes, sha256] = await Promise.all([gzipSize(bytes), sha256Hex(bytes)]);
  return { gzipBytes, sha256 };
}
