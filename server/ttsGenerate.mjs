// TTSBolt server-side speech synthesis — a WebSocket client to Microsoft's Edge
// Read Aloud service, opened with the Workers `fetch` + `Upgrade: websocket`
// handshake so it runs inside the Cloudflare Worker. The protocol (token,
// Sec-MS-GEC, message framing) follows msedge-tts 2.1.0, which this replaced
// because it depends on Node's `ws` and streams.
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

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`;
// fetch() only upgrades http(s) URLs; this is the wss:// endpoint Edge uses.
const SYNTH_URL = 'https://api.msedgeservices.com/tts/cognitiveservices/websocket/v1';
const GEC_VERSION = '1-143.0.3650.96';
const EDGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
  Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
};
const CONNECT_TIMEOUT_MS = 10000;
const SYNTHESIS_TIMEOUT_MS = 45000;

/**
 * Per-request cap. The client splits long scripts into blocks and synthesises
 * them one at a time, so this bounds a single serverless invocation instead of
 * bounding what the user can narrate.
 */
export const MAX_TEXT_LENGTH = 3000;

/** Edge reports offsets and durations in 100-nanosecond ticks. */
const TICKS_PER_MS = 10000;

export const FORMATS = {
  'mp3-96': 'audio-24khz-96kbitrate-mono-mp3',
  'mp3-48': 'audio-24khz-48kbitrate-mono-mp3',
};

let voicesCache = { voices: null, fetchedAt: 0 };
const VOICES_TTL_MS = 6 * 60 * 60 * 1000; // voice list changes rarely

export async function listVoices() {
  if (voicesCache.voices && Date.now() - voicesCache.fetchedAt < VOICES_TTL_MS) {
    return voicesCache.voices;
  }
  const res = await fetch(VOICES_URL, { headers: EDGE_HEADERS });
  if (!res.ok) throw new Error(`Voice list responded ${res.status}`);
  const raw = await res.json();
  const voices = raw.map((v) => ({
    shortName: v.ShortName,
    friendlyName: v.FriendlyName || v.Name,
    gender: v.Gender,
    locale: v.Locale,
  }));
  voicesCache = { voices, fetchedAt: Date.now() };
  return voices;
}

/** Server clock minus ours, learnt from a 403's Date header (Sec-MS-GEC is time-based). */
let clockOffsetMs = 0;

/** The anti-abuse token Edge expects: SHA-256 of the 5-minute Windows-ticks window + client token. */
async function secMsGec() {
  const seconds = Math.floor((Date.now() + clockOffsetMs) / 1000) + 11644473600;
  const ticks = BigInt(seconds - (seconds % 300)) * 10000000n;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${ticks}${TRUSTED_CLIENT_TOKEN}`));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

const randomHex = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

async function openSocket(retryClock = true) {
  const url = `${SYNTH_URL}?Ocp-Apim-Subscription-Key=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${await secMsGec()}&Sec-MS-GEC-Version=${GEC_VERSION}&ConnectionId=${randomHex()}`;
  const res = await fetch(url, { headers: { ...EDGE_HEADERS, Upgrade: 'websocket' }, signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS) });
  if (!res.webSocket) {
    const serverTime = Date.parse(res.headers.get('date') || '');
    if (retryClock && res.status === 403 && Number.isFinite(serverTime)) {
      clockOffsetMs = serverTime - Date.now();
      return openSocket(false);
    }
    throw new Error(`Unexpected server response: ${res.status}`);
  }
  res.webSocket.accept();
  return res.webSocket;
}

/**
 * The text goes straight into an SSML document, so a single `&` or `<` in the script produced an XML parse error
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
 * @returns {Promise<{audio: Uint8Array, marks: Array}>}
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
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) {
    throw Object.assign(new Error('Text is required'), { code: 'missing_text' });
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw Object.assign(new Error(`Text too long (max ${MAX_TEXT_LENGTH} characters)`), { code: 'text_too_long' });
  }
  if (!voice) {
    throw Object.assign(new Error('voice is required'), { code: 'missing_voice' });
  }
  if (typeof voice !== 'string' || !/^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9-]{1,100}$/.test(voice)) {
    throw Object.assign(new Error('Invalid voice identifier'), { code: 'invalid_voice' });
  }
  if (!Number.isFinite(rate) || rate < .5 || rate > 2 || !Number.isFinite(pitch) || pitch < .5 || pitch > 2 || !Number.isFinite(volume) || volume < 0 || volume > 100) {
    throw Object.assign(new Error('Invalid voice settings'), { code: 'invalid_settings' });
  }
  const outputFormat = Object.hasOwn(FORMATS, format) ? FORMATS[format] : FORMATS['mp3-96'];

  // Only <prosody> survives here: the free Read Aloud endpoint drops the
  // connection ("no turn.end received") on any other SSML element, <break/>
  // included, whether or not boundary metadata is on. So the text goes in
  // escaped and nothing else — which is also what keeps the downloaded MP3
  // byte-identical to what the player renders.
  const pitchPercent = Math.round((pitch - 1) * 100);
  const locale = /\b[a-z]{2,}-[A-Z]{2}\b/.exec(voice)[0];
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${locale}">`
    + `<voice name="${voice}"><prosody pitch="${pitchPercent >= 0 ? '+' : ''}${pitchPercent}%" rate="${rate}" volume="${volume}">`
    + `${escapeXml(trimmed)}</prosody></voice></speak>`;

  const ws = await openSocket();
  const requestId = randomHex();
  const audioChunks = [];
  const metaMessages = [];
  const decoder = new TextDecoder();

  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Speech synthesis timed out')), SYNTHESIS_TIMEOUT_MS);
      const done = (fn, value) => { clearTimeout(timer); fn(value); };

      ws.addEventListener('message', (event) => {
        if (typeof event.data === 'string') {
          const message = event.data;
          if (!message.includes(`X-RequestId:${requestId}`)) return;
          if (message.includes('Path:turn.end')) done(resolve);
          else if (message.includes('Path:audio.metadata')) {
            metaMessages.push(message.slice(message.indexOf('\r\n\r\n') + 4));
          }
          return;
        }
        // Binary frame: 2-byte big-endian header length, the headers, then audio.
        const bytes = new Uint8Array(event.data);
        const headerLength = (bytes[0] << 8) | bytes[1];
        const headers = decoder.decode(bytes.subarray(2, 2 + headerLength));
        if (!headers.includes(`X-RequestId:${requestId}`) || !headers.includes('Path:audio')) return;
        const audio = bytes.subarray(2 + headerLength);
        if (audio.length) audioChunks.push(audio);
      });
      ws.addEventListener('close', () => done(reject, new Error('Stream closed before the synthesis completed (no turn.end received). The audio is likely truncated.')));
      ws.addEventListener('error', (event) => done(reject, new Error(`Edge TTS WebSocket error: ${event?.message || 'unknown'}`)));

      ws.send(`Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify({
        context: { synthesis: { audio: {
          metadataoptions: { sentenceBoundaryEnabled: String(!!boundaries), wordBoundaryEnabled: String(!!boundaries) },
          outputFormat,
        } } },
      })}`);
      ws.send(`X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`);
    });
  } finally {
    try { ws.close(); } catch {}
  }

  let size = 0;
  for (const c of audioChunks) size += c.length;
  if (!size) throw Object.assign(new Error('Speech provider returned no audio'), { code: 'synthesis_failed' });
  const audio = new Uint8Array(size);
  let at = 0;
  for (const c of audioChunks) { audio.set(c, at); at += c.length; }
  return { audio, marks: parseMarks(metaMessages) };
}
