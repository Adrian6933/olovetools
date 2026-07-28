// TTSBolt server-side speech synthesis — Node-only (WebSocket client to
// Microsoft's Edge Read Aloud service via `msedge-tts`), so like imageConvert.mjs
// this only runs on Vercel/self-hosted Node, never on Cloudflare Workers/edge.
//
// Why this exists: the previous "Download MP3" flow proxied
// translate.google.com/translate_tts through a random third-party CORS relay
// (api.allorigins.win) — an undocumented endpoint, rate-limited, robotic voice,
// AND a different voice than what "Listen" played via the browser's
// speechSynthesis. This gives real Microsoft neural voices (the same ones
// Edge's Read Aloud feature uses) for both playback and download, so they
// finally match, with no third-party proxy involved.

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Generous but bounded — keeps a single serverless invocation fast and caps
// abuse of a free, unauthenticated synthesis endpoint.
export const MAX_TEXT_LENGTH = 5000;

let voicesCache = { voices: null, fetchedAt: 0 };
const VOICES_TTL_MS = 6 * 60 * 60 * 1000; // voice list changes rarely

export async function listVoices() {
  if (voicesCache.voices && Date.now() - voicesCache.fetchedAt < VOICES_TTL_MS) {
    return voicesCache.voices;
  }
  const tts = new MsEdgeTTS();
  const raw = await tts.getVoices();
  const voices = raw.map((v) => ({
    shortName: v.ShortName,
    friendlyName: v.FriendlyName || v.Name,
    gender: v.Gender,
    locale: v.Locale,
  }));
  voicesCache = { voices, fetchedAt: Date.now() };
  return voices;
}

// pitch/rate sliders in the UI are 0.5–2.0 multipliers (matches the old
// speechSynthesis.rate/pitch semantics). `rate` maps directly to Edge TTS's
// numeric relative-rate option; `pitch` needs converting to a relative percent
// since Edge TTS has no raw-multiplier pitch input.
export async function synthesizeSpeech({ text, voice, rate = 1, pitch = 1, volume = 100 }) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    throw Object.assign(new Error('Text is required'), { code: 'missing_text' });
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw Object.assign(new Error(`Text too long (max ${MAX_TEXT_LENGTH} characters)`), { code: 'text_too_long' });
  }
  if (!voice) {
    throw Object.assign(new Error('voice is required'), { code: 'missing_voice' });
  }

  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    const pitchPercent = Math.round((pitch - 1) * 100);
    const { audioStream } = tts.toStream(trimmed, {
      rate,
      pitch: `${pitchPercent >= 0 ? '+' : ''}${pitchPercent}%`,
      volume,
    });

    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    return Buffer.concat(chunks);
  } finally {
    tts.close();
  }
}
