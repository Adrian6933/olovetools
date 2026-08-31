// TTSBolt real speech synthesis — Vercel Node serverless function.
// See server/ttsGenerate.mjs for why this replaces the old Google-Translate-
// via-third-party-proxy download hack.
import type { APIRoute } from 'astro';
import { listVoices, synthesizeSpeech, MAX_TEXT_LENGTH } from '../../../server/ttsGenerate.mjs';

export const prerender = false;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status: number, data: unknown, cacheSeconds = 0) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      ...(cacheSeconds > 0 ? { 'Cache-Control': `public, max-age=${cacheSeconds}` } : {}),
    },
  });
}

export const GET: APIRoute = async ({ url }) => {
  const action = url.searchParams.get('action');
  if (action !== 'voices') return json(400, { error: 'unknown_action' });

  try {
    const voices = await listVoices();
    return json(200, { voices }, 3600);
  } catch (e: any) {
    return json(502, { error: 'voices_failed', message: e?.message });
  }
};

/**
 * One request renders one block of the script and answers with a two-part
 * envelope: a JSON header, a single `\n`, then the raw MP3 bytes.
 *
 * The header carries the word/sentence boundary marks, and they are far too
 * large for a response header (a 3000-character block yields tens of KB of
 * JSON, past what most proxies allow). Base64-ing the audio into JSON instead
 * would inflate every render by a third. `JSON.stringify` never emits a literal
 * newline, so the first `\n` in the body is always the exact split point.
 */
function envelope(header: unknown, audio: Uint8Array): Response {
  const headerBytes = new TextEncoder().encode(JSON.stringify(header) + '\n');
  const body = new Uint8Array(headerBytes.length + audio.length);
  body.set(headerBytes, 0);
  body.set(audio, headerBytes.length);
  return new Response(body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'no-store',
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const { text, voice, rate, pitch, volume, format, boundaries } = body || {};

  try {
    const { audio, marks } = await synthesizeSpeech({
      text,
      voice,
      rate: typeof rate === 'number' ? rate : 1,
      pitch: typeof pitch === 'number' ? pitch : 1,
      volume: typeof volume === 'number' ? volume : 100,
      format: typeof format === 'string' ? format : 'mp3-96',
      boundaries: boundaries !== false,
    });
    return envelope({ marks, voice, bytes: audio.length }, audio);
  } catch (e: any) {
    const status = ['missing_text', 'missing_voice', 'text_too_long'].includes(e?.code) ? 400 : 502;
    return json(status, { error: e?.code || 'synthesis_failed', message: e?.message, maxLength: MAX_TEXT_LENGTH });
  }
};

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS_HEADERS });
