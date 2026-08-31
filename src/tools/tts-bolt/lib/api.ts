// ============================================================================
// Client for /api/tts — the neural engine.
// ============================================================================
import type { Mark, NeuralVoice } from '../types';

export interface SynthesisRequest {
  text: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  format?: 'mp3-96' | 'mp3-48';
  signal?: AbortSignal;
}

export class TTSError extends Error {
  constructor(
    message: string,
    /** Machine-readable: 'text_too_long' | 'offline' | 'synthesis_failed'… */
    readonly code: string,
    readonly maxLength?: number
  ) {
    super(message);
  }
}

/** Longest single request the server accepts; mirrors MAX_TEXT_LENGTH. */
export const MAX_BLOCK_CHARS = 3000;

// ---------------------------------------------------------------------------
// Voice catalogue
// ---------------------------------------------------------------------------

/**
 * "Microsoft Aria Online (Natural) - English (United States)" → "Aria".
 * Falls back to the short name's middle segment, which is always the given
 * name for Microsoft's catalogue ("en-US-AriaNeural").
 */
function displayNameOf(friendlyName: string, shortName: string): string {
  const match = /^Microsoft\s+(.+?)\s+Online/i.exec(friendlyName);
  if (match) return match[1].replace(/\s*\(.*?\)\s*/g, '').trim();
  const parts = shortName.split('-');
  return (parts[2] || shortName).replace(/Neural$/, '');
}

export async function fetchVoices(signal?: AbortSignal): Promise<NeuralVoice[]> {
  const res = await fetch('/api/tts?action=voices', { signal });
  if (!res.ok) throw new TTSError('Voice list unavailable', 'voices_failed');
  const data = (await res.json()) as { voices?: Omit<NeuralVoice, 'displayName' | 'language' | 'multilingual'>[] };
  return (data.voices || []).map(v => ({
    ...v,
    displayName: displayNameOf(v.friendlyName, v.shortName),
    language: v.locale.split('-')[0].toLowerCase(),
    multilingual: /multilingual/i.test(v.shortName),
  }));
}

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

/**
 * Renders one block. The response is a two-part envelope (JSON header, a single
 * `\n`, then the MP3 bytes) — see the route for why the marks cannot ride in a
 * response header. Returns the MP3 untouched so the download is bit-for-bit
 * what the engine produced.
 */
export async function synthesize(req: SynthesisRequest): Promise<{ mp3: Uint8Array; marks: Mark[] }> {
  let res: Response;
  try {
    res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: req.text,
        voice: req.voice,
        rate: req.rate,
        pitch: req.pitch,
        volume: req.volume,
        format: req.format || 'mp3-96',
      }),
      signal: req.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    throw new TTSError('Network unreachable', 'offline');
  }

  if (!res.ok) {
    let payload: any = {};
    try {
      payload = await res.json();
    } catch {
      /* non-JSON error body: keep the generic code below */
    }
    throw new TTSError(payload.message || 'Synthesis failed', payload.error || 'synthesis_failed', payload.maxLength);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());
  const split = bytes.indexOf(0x0a);
  if (split < 0) throw new TTSError('Malformed response', 'synthesis_failed');

  const header = JSON.parse(new TextDecoder().decode(bytes.subarray(0, split))) as { marks?: Mark[] };
  const mp3 = bytes.subarray(split + 1);
  if (mp3.length === 0) throw new TTSError('Empty audio', 'synthesis_failed');

  return { mp3, marks: header.marks || [] };
}
