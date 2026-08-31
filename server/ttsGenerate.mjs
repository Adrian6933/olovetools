// TTSBolt server-side speech synthesis — Node-only (WebSocket client to
// Microsoft's Edge Read Aloud service via `msedge-tts`), so like imageConvert.mjs
// this only runs on Vercel/self-hosted Node, never on Cloudflare Workers/edge.
//
// Why this exists: the original "Download MP3" flow proxied
// translate.google.com/translate_tts through a random third-party CORS relay
// (api.allorigins.win) — an undocumented endpoint, rate-limited, robotic voice,
// it silently ignored the rate/pitch sliders, AND it was a different voice than
// what "Listen" played through the browser's speechSynthesis. This gives real
// Microsoft neural voices for both playback and download, so they finally
// match, with no third-party proxy involved.
//
// Beyond the audio, we also ask the service for word/sentence boundary
// metadata. That is the intermediate data that makes the tool more than a
// black box: it is what drives the karaoke-style word highlight in the player
// and the SRT/VTT caption export, both derived from the exact same render.

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * Per-request cap. The client splits long scripts into blocks and synthesises
 * them one at a time, so this bounds a single serverless invocation instead of
 * bounding what the user can narrate.
 */
export const MAX_TEXT_LENGTH = 3000;

/** Edge reports offsets and durations in 100-nanosecond ticks. */
const TICKS_PER_MS = 10000;

export const FORMATS = {
  'mp3-96': OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3,
  'mp3-48': OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
};

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

/**
 * msedge-tts drops the caller's text straight into an SSML document without
 * escaping it, so a single `&` or `<` in the script produced an XML parse error
 * on Microsoft's side and the socket closed mid-synthesis ("Stream closed
 * before the synthesis completed"). Everything user-provided goes through here.
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Boundary metadata echoes back the escaped text, so marks get un-escaped. */
function unescapeXml(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Parses the metadata messages into a flat, millisecond-based mark list.
 * Each message is a JSON document with a `Metadata` array; a truncated tail is
 * simply skipped rather than failing the whole render.
 */
function parseMarks(messages) {
  const marks = [];
  for (const raw of messages) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue;
    }
    for (const entry of parsed?.Metadata || []) {
      const data = entry?.Data;
      const text = data?.text?.Text;
      if (typeof text !== 'string' || typeof data?.Offset !== 'number') continue;
      marks.push({
        // "word" | "sentence" — anything else Edge may add later is ignored.
        k: entry.Type === 'SentenceBoundary' ? 's' : 'w',
        t: Math.round(data.Offset / TICKS_PER_MS),
        d: Math.round((data.Duration || 0) / TICKS_PER_MS),
        x: unescapeXml(text),
      });
    }
  }
  marks.sort((a, b) => a.t - b.t);
  return marks;
}

/**
 * Renders one block of the script.
 *
 * `rate`/`pitch` keep the 0.5–2.0 multiplier semantics the UI sliders have
 * always used (they match speechSynthesis, so switching engines does not move
 * the sliders). `pitch` needs converting to a relative percentage because SSML
 * has no raw-multiplier pitch input.
 *
 * @returns {Promise<{audio: Buffer, marks: Array}>}
 */
export async function synthesizeSpeech({
  text,
  voice,
  rate = 1,
  pitch = 1,
  volume = 100,
  format = 'mp3-96',
  boundaries = true,
}) {
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
  const outputFormat = FORMATS[format] || FORMATS['mp3-96'];

  const tts = new MsEdgeTTS();
  try {
    await tts.setMetadata(voice, outputFormat, {
      wordBoundaryEnabled: !!boundaries,
      sentenceBoundaryEnabled: !!boundaries,
    });

    // Only <prosody> survives here: the free Read Aloud endpoint drops the
    // connection ("no turn.end received") on any other SSML element, <break/>
    // included, whether or not boundary metadata is on. So the text goes in
    // escaped and nothing else — which is also what keeps the downloaded MP3
    // byte-identical to what the player renders.
    const pitchPercent = Math.round((pitch - 1) * 100);

    const { audioStream, metadataStream } = tts.toStream(escapeXml(trimmed), {
      rate,
      pitch: `${pitchPercent >= 0 ? '+' : ''}${pitchPercent}%`,
      volume,
    });

    // metadataStream is destroyed (never `push(null)`-ed) when the audio stream
    // closes, so `for await` over it always throws ERR_STREAM_PREMATURE_CLOSE.
    // Collect it passively and let the audio stream decide when we are done.
    const metaMessages = [];
    if (metadataStream) {
      metadataStream.on('data', (chunk) => metaMessages.push(chunk.toString()));
      metadataStream.on('error', () => {});
    }

    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);

    return { audio: Buffer.concat(chunks), marks: parseMarks(metaMessages) };
  } finally {
    tts.close();
  }
}
