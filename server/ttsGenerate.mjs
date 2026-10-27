// TTSBolt server-side speech synthesis — a WebSocket client to Microsoft's Edge
// Read Aloud service, opened with the Workers `fetch` + `Upgrade: websocket`
// handshake so it runs inside the Cloudflare Worker. The message framing
// follows msedge-tts 2.1.0, which this replaced because it depends on Node's
// `ws` and streams; the endpoint, headers and v2 Sec-MS-GEC token follow the
// Python edge-tts 7.3.1, since Microsoft retired the v1 token in October 2026.
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
const READALOUD_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud';
const VOICES_URL = `${READALOUD_URL}/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`;
// fetch() only upgrades http(s) URLs; this is the wss:// endpoint Edge uses.
const SYNTH_URL = `${READALOUD_URL}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0];
const GEC_VERSION = `2-${CHROMIUM_FULL_VERSION}`;
const EDGE_HEADERS = {
  'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
};
const WSS_HEADERS = {
  ...EDGE_HEADERS,
  Pragma: 'no-cache',
  'Cache-Control': 'no-cache',
  Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
  'Sec-WebSocket-Version': '13',
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

// Sec-MS-GEC v2 (Edge 143, "2-" version prefix), ported from edge-tts 7.3.1's
// drm.py. The token is "<CS64 hex>-<SHA-256 hex>" of the 5-minute Windows-ticks
// window + client token, but the SHA-256 is a keyed one: it resumes from a
// precomputed mid-block state (a hidden 57-byte prefix), so Web Crypto cannot
// produce it and it is computed here by hand. Same input for 5 minutes, so the
// last result is cached.

const U32 = (x) => x >>> 0;
const rotr = (x, n) => (x >>> n) | (x << (32 - n));
const rol16 = (x) => U32((x << 16) | (x >>> 16));
const sigma0 = (x) => U32(rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3));
const sigma1 = (x) => U32(rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10));

const SHA256_INITIAL = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const SHA256_STATE = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const SHA256_SCHEDULE = [
  0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0,
  0xF9E70AB6, 0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564,
];
const SHA256_K = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2,
];
const SHA256_ADJUSTMENT = 0xC9DC06A7;
const SHA256_BLOCK_K = SHA256_K.map((k, i) => (i === 14 ? SHA256_ADJUSTMENT : k));
const SHA256_SIGMA0_ADJUSTMENT = 0x059C0B80;
const SHA256_SIGMA1_ADJUSTMENT = 0x000B92C0;

const CS64_COEFFICIENTS = [
  [0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF],
  [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C], [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB],
  [0x06064CF3, 0xFA51A3DA], [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167],
];
const CS64_FACTOR = 0x82893933;
const CS64_ADJUSTMENT0 = 0xF2F90B1A;
const CS64_ADJUSTMENT1 = 0x0B1A0000;

/** Standard SHA-256 message expansion, in place, from `first` to 64 words. */
function expandSchedule(w, first = 16) {
  for (let i = first; i < 64; i++) w.push(U32(sigma1(w[i - 2]) + w[i - 7] + sigma0(w[i - 15]) + w[i - 16]));
}

/** Standard SHA-256 compression rounds, optionally resuming at round `first`. */
function sha256Rounds(state, w, first = 0, k = SHA256_K) {
  let [a, b, c, d, e, f, g, h] = state;
  for (let i = first; i < 64; i++) {
    const t1 = h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + (g ^ (e & (f ^ g))) + k[i] + w[i];
    const t2 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) | (c & (a | b)));
    h = g; g = f; f = e; e = U32(d + t1); d = c; c = b; b = a; a = U32(t1 + t2);
  }
  return [a, b, c, d, e, f, g, h];
}

/** The state after the hidden prefix + the first 7 bytes of `data`. */
function sha256Init(data) {
  const w = new Array(14).fill(0);
  w.push((data[0] << 16) | (data[1] << 8) | data[2]);
  w.push(U32((data[3] << 24) | (data[4] << 16) | (data[5] << 8) | data[6]));
  for (let i = 16; i < 30; i++) {
    let v = SHA256_SCHEDULE[i - 16];
    if (i - 2 >= 14) v += i === 16 ? U32(sigma1(w[i - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) : sigma1(w[i - 2]);
    if (i - 7 >= 14) v += w[i - 7];
    if (i - 15 >= 14) v += i === 29 ? U32(sigma0(w[i - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) : sigma0(w[i - 15]);
    w.push(U32(v));
  }
  w.push(U32(sigma1(w[28]) + w[23] + sigma0(w[15]) + w[14] + SHA256_ADJUSTMENT - SHA256_K[14]));
  expandSchedule(w, 31);
  const working = sha256Rounds(SHA256_STATE, w, 14, SHA256_BLOCK_K);
  return SHA256_INITIAL.map((x, i) => U32(x + working[i]));
}

function sha256Digest(data) {
  const length = 57 + data.length;
  const tail = data.length - 7;
  const total = tail + 1 + ((((55 - length) % 64) + 64) % 64) + 8;
  const padded = new Uint8Array(total);
  padded.set(data.subarray(7));
  padded[tail] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(total - 4, length * 8);
  let state = sha256Init(data);
  for (let offset = 0; offset < total; offset += 64) {
    const w = [];
    for (let i = 0; i < 16; i++) w.push(view.getUint32(offset + i * 4));
    expandSchedule(w);
    const working = sha256Rounds(state, w);
    state = state.map((x, i) => U32(x + working[i]));
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  state.forEach((x, i) => outView.setUint32(i * 4, x));
  return out;
}

function cs64Digest(data, digest) {
  const digestView = new DataView(digest.buffer);
  const keyA = U32(digestView.getUint32(0, true) | 1);
  const keyB = U32(digestView.getUint32(4, true) | 1);
  const factors = [U32(Math.imul(keyA, CS64_FACTOR)), U32(Math.imul(keyB, CS64_FACTOR))];
  const terms = CS64_COEFFICIENTS.map(([coefficient], i) => U32(Math.imul(coefficient, factors[i % 2])));
  const offsets = CS64_COEFFICIENTS.map(([, offset]) => offset);

  // Little-endian 32-bit words of 0x00 + data, zero-padded to an even count.
  const wordCount = Math.ceil((data.length + 1) / 4);
  const bytes = new Uint8Array((wordCount + (wordCount % 2)) * 4);
  bytes.set(data, 1);
  const wordsView = new DataView(bytes.buffer);
  for (let i = 0; i < bytes.length / 4; i++) {
    const word = wordsView.getUint32(i * 4, true);
    let term = Math.imul(word, i % 2 === 0 ? keyA : keyB);
    let offset = Math.imul(rol16(word), i % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (i === 0) {
      term += Math.imul(CS64_ADJUSTMENT0, factors[0]);
      offset += CS64_ADJUSTMENT1;
    }
    terms.push(U32(term));
    offsets.push(U32(offset));
  }

  let swapAcc = 0, swapLast = 0, state = 0, acc = 0;
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i], y = terms[i + 1];
    let q = U32(Math.imul(rol16(U32(offsets[i] + x)), 0x76F50F34));
    swapAcc = U32(swapAcc + U32(Math.imul(rol16(q), 0xC3EFEA97) + q));
    q = U32(Math.imul(rol16(U32(offsets[i + 1] + y)), 0x1881CE3C));
    swapLast = U32(Math.imul(rol16(q), 0x35BD1EC9) + q);
    swapAcc = U32(swapAcc + swapLast);

    state = U32(Math.imul(state, keyA) + x);
    state = U32(Math.imul(rol16(state), 0xCF98B111));
    state = U32(Math.imul(rol16(state), 0x87085B9F));
    state = U32(Math.imul(rol16(state), 0x12CEB96D));
    state = U32(Math.imul(rol16(state), 0x257E1D83));
    acc = U32(acc + state);
    let t = U32(Math.imul(state, keyB) + y);
    t = U32(Math.imul(rol16(t), 0xA27416F5));
    t = U32(Math.imul(rol16(t), 0xD38396FF));
    state = U32(Math.imul(rol16(U32(Math.imul(rol16(t), 0x7C932B89))), 0xBFA49F69));
    acc = U32(acc + state);
  }
  return [U32(swapLast ^ state), U32(swapAcc ^ acc)];
}

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

/** Server clock minus ours, learnt from a 403's Date header (Sec-MS-GEC is time-based). */
let clockOffsetMs = 0;
let gecCache = { input: '', token: '' };

function secMsGec() {
  const seconds = Math.floor((Date.now() + clockOffsetMs) / 1000) + 11644473600;
  const input = `${BigInt(seconds - (seconds % 300)) * 10000000n}${TRUSTED_CLIENT_TOKEN}`;
  if (gecCache.input !== input) {
    const data = new TextEncoder().encode(input);
    const digest = sha256Digest(data);
    const cs64 = new Uint8Array(8);
    const cs64View = new DataView(cs64.buffer);
    const [lo, hi] = cs64Digest(data, digest);
    cs64View.setUint32(0, lo, true);
    cs64View.setUint32(4, hi, true);
    gecCache = { input, token: `${toHex(cs64)}-${toHex(digest)}` };
  }
  return gecCache.token;
}

const randomHex = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

async function openSocket(retryClock = true) {
  const url = `${SYNTH_URL}&ConnectionId=${randomHex()}&Sec-MS-GEC=${secMsGec()}&Sec-MS-GEC-Version=${GEC_VERSION}`;
  const headers = { ...WSS_HEADERS, Cookie: `muid=${randomHex().toUpperCase()};`, Upgrade: 'websocket' };
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS) });
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
  const binaryFrames = [];
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
        // The Workers runtime hands binary frames over as Blobs (ArrayBuffers
        // elsewhere); reading a Blob is async, so frames are kept in arrival
        // order as promises and parsed once turn.end arrives.
        binaryFrames.push(event.data instanceof Blob ? event.data.arrayBuffer() : event.data);
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

  const audioChunks = [];
  for (const frame of await Promise.all(binaryFrames)) {
    // Binary frame: 2-byte big-endian header length, the headers, then audio.
    const bytes = new Uint8Array(frame);
    const headerLength = (bytes[0] << 8) | bytes[1];
    const headers = decoder.decode(bytes.subarray(2, 2 + headerLength));
    if (!headers.includes(`X-RequestId:${requestId}`) || !headers.includes('Path:audio')) continue;
    const audio = bytes.subarray(2 + headerLength);
    if (audio.length) audioChunks.push(audio);
  }

  let size = 0;
  for (const c of audioChunks) size += c.length;
  if (!size) throw Object.assign(new Error('Speech provider returned no audio'), { code: 'synthesis_failed' });
  const audio = new Uint8Array(size);
  let at = 0;
  for (const c of audioChunks) { audio.set(c, at); at += c.length; }
  return { audio, marks: parseMarks(metaMessages) };
}
