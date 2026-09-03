// oLoveTools backend — platform-agnostic core logic, shared by:
//   - Astro API routes (src/pages/proxy.ts, src/pages/api/kick.ts, src/pages/api/twitch/token.ts)
//     used when deployed to Vercel (or any Astro SSR adapter) — same origin as the site.
//   - The standalone Node server (server/index.mjs, via server/app.mjs) for
//     self-hosting outside Vercel.
//   - cloudflare-worker/worker.js is a separate self-contained copy (Workers
//     can't easily import local Node modules without a bundler) for static-only
//     hosting that isn't Vercel.
//
// Every handler here returns a plain { status, headers, body } descriptor —
// callers translate that into whatever response type their platform needs.
// Uses only Web-standard fetch/URLSearchParams/AbortSignal, no Node APIs, so
// the same file works unmodified under Vercel's Node runtime, plain Node, and
// (if ever bundled) edge runtimes.

if (typeof process !== 'undefined' && typeof process.loadEnvFile === 'function') {
  // Local dev convenience: load a gitignored .env file if present. Real hosts
  // (Vercel, a VPS, Cloudflare Worker secrets…) set these directly, so a
  // missing .env here is not an error.
  try { process.loadEnvFile(); } catch { /* no .env file — fine */ }
}

const env = (name) => (typeof process !== 'undefined' ? process.env[name] : undefined);

export const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Hosts the /proxy relay may fetch. Twitch VOD/clip infra + Kick clip CDN only,
// so the relay can't be used as an open proxy for arbitrary sites.
const ALLOWED_HOST_SUFFIXES = [
  'usher.ttvnw.net',
  '.hls.ttvnw.net',
  'ttvnw.net',
  'video-weaver.',
  'cloudfront.net',
  'clips.kick.com',
  'twitchcdn.net',
  'clips-media-assets2.twitch.tv',
];

export const isAllowedProxyHost = (hostname) =>
  ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(suffix) || hostname.includes(suffix));

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Accept-Ranges',
};

const json = (status, data, cacheSeconds = 0) => ({
  status,
  headers: {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
    ...(cacheSeconds > 0 ? { 'Cache-Control': `public, max-age=${cacheSeconds}` } : {}),
  },
  body: typeof data === 'string' ? data : JSON.stringify(data),
});

const text = (status, body) => ({ status, headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' }, body });

export const OPTIONS_RESPONSE = { status: 204, headers: CORS_HEADERS, body: null };

// ---- Token caches (in-memory, per warm process/isolate) ----
let kickToken = { token: null, exp: 0 };
let twitchToken = { token: null, exp: 0 };

async function getKickAppToken() {
  const clientId = env('KICK_CLIENT_ID');
  const clientSecret = env('KICK_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('Missing KICK_CLIENT_ID / KICK_CLIENT_SECRET environment variables — see server/README.md');
  }
  if (kickToken.token && kickToken.exp > Date.now()) return kickToken.token;
  const res = await fetch('https://id.kick.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  const data = await res.json().catch(() => null);
  const token = data?.access_token || null;
  if (token) kickToken = { token, exp: Date.now() + 50 * 60 * 1000 };
  return token;
}

async function getTwitchAppToken() {
  const clientId = env('TWITCH_CLIENT_ID');
  const clientSecret = env('TWITCH_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET environment variables — see server/README.md');
  }
  if (twitchToken.token && twitchToken.exp > Date.now()) return { ...twitchToken, clientId };
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  });
  const data = await res.json().catch(() => null);
  if (data?.access_token) {
    // expires_in is in seconds; refresh 5 minutes early
    const ttlMs = Math.max((data.expires_in || 3600) - 300, 60) * 1000;
    twitchToken = { token: data.access_token, exp: Date.now() + ttlMs };
  }
  return { ...twitchToken, clientId };
}

async function kickFetch(url, headers) {
  try {
    const res = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(20000) });
    return [res.status, await res.text()];
  } catch {
    return [0, null];
  }
}

// ---- /proxy — CORS relay for the video CDN hosts above ----
// Streams the upstream body straight through instead of buffering it in
// memory first: buffering added a full extra round-trip of latency (wait for
// the whole clip to land on the serverless function, then re-send it) and
// collapsed the client's download progress into one or two big jumps instead
// of many small ones, since no bytes reached the browser until the entire
// file had already been fetched server-side.
export async function handleProxy(url, rangeHeader, method = 'GET') {
  const target = url.searchParams.get('url');
  if (!target) return text(400, 'Missing "url" query parameter');

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return text(400, 'Invalid target URL');
  }
  if (!isAllowedProxyHost(targetUrl.hostname)) return text(403, `Host not allowed: ${targetUrl.hostname}`);

  const forwardHeaders = { 'User-Agent': BROWSER_UA };
  if (rangeHeader) forwardHeaders['Range'] = rangeHeader;

  const isHead = method === 'HEAD';

  let upstream;
  try {
    // Forward HEAD as a real upstream HEAD — otherwise we'd fetch the whole
    // clip body just to answer a headers-only request.
    upstream = await fetch(targetUrl.toString(), { method: isHead ? 'HEAD' : 'GET', headers: forwardHeaders });
  } catch (e) {
    return text(502, `Upstream fetch failed: ${e.message}`);
  }

  const headers = { ...CORS_HEADERS };
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(key);
    if (value) headers[key] = value;
  }
  return { status: upstream.status, headers, body: isHead ? null : upstream.body, isBinary: true };
}

// ---- /api/kick — categories, livestreams, clips, single clip ----
export async function handleKick(url) {
  const params = url.searchParams;
  const action = params.get('action') || '';

  // Categorias ordenadas por espectadores de verdad. La API publica de Kick no
  // tiene un "top de categorias": /categories es una BUSQUEDA DE TEXTO y con la
  // consulta vacia habia que mandarle "a", asi que devolvia los juegos cuyo
  // nombre lleva una a ("A Short Hike", "A Gracewind Tale"...) y la interfaz los
  // pintaba como si fueran un ranking. Aqui se suman los espectadores de los
  // directos por categoria, que es lo que hace la propia pagina de Kick.
  if (action === 'top-categories') {
    const token = await getKickAppToken();
    if (!token) return json(502, { error: 'token_failed' });
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const [code, body] = await kickFetch(
      'https://api.kick.com/public/v1/livestreams?limit=100&sort=viewer_count',
      headers
    );
    // kickFetch devuelve el cuerpo SIN parsear, como texto.
    let emisiones = null;
    try { emisiones = JSON.parse(body || 'null')?.data; } catch { /* respuesta no JSON */ }
    if (!Array.isArray(emisiones)) return json(code || 502, { data: [] }, 120);

    const porCategoria = new Map();
    for (const emision of emisiones) {
      const cat = emision?.category;
      if (!cat?.id) continue;
      const actual = porCategoria.get(cat.id) || {
        id: String(cat.id),
        name: cat.name || '',
        thumbnail: cat.thumbnail || '',
        viewers: 0,
        channels: 0,
      };
      actual.viewers += Number(emision.viewer_count) || 0;
      actual.channels += 1;
      porCategoria.set(cat.id, actual);
    }
    const data = [...porCategoria.values()].sort((a, b) => b.viewers - a.viewers);
    return json(200, { data }, 120);
  }

  if (action === 'categories' || action === 'livestreams') {
    const token = await getKickAppToken();
    if (!token) return json(502, { error: 'token_failed' });
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

    let target;
    if (action === 'categories') {
      // q is required by the API; "a" returns a broad popular set
      const q = (params.get('q') || '').trim() || 'a';
      target = `https://api.kick.com/public/v1/categories?q=${encodeURIComponent(q)}`;
    } else {
      const cat = parseInt(params.get('category_id') || '0', 10);
      target = `https://api.kick.com/public/v1/livestreams?limit=${Math.min(100, parseInt(params.get('limit') || '50', 10) || 50)}&sort=viewer_count${cat > 0 ? `&category_id=${cat}` : ''}`;
    }
    const [code, body] = await kickFetch(target, headers);
    return json(code || 502, body ?? { data: [] }, 60);
  }

  const browserHeaders = {
    Accept: 'application/json',
    'User-Agent': BROWSER_UA,
    Referer: 'https://kick.com/',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  if (action === 'clips') {
    const sort = (params.get('sort') || 'view').toLowerCase().replace(/[^a-z]/g, '') || 'view';
    const time = (params.get('time') || 'week').toLowerCase().replace(/[^a-z]/g, '') || 'week';

    let target;
    if (params.get('category_id')) {
      target = `https://kick.com/api/v2/categories/${parseInt(params.get('category_id'), 10)}/clips`;
    } else if (params.get('channel')) {
      const slug = params.get('channel').replace(/[^a-zA-Z0-9_-]/g, '');
      target = `https://kick.com/api/v2/channels/${slug}/clips`;
    } else {
      return json(400, { error: 'missing_target' });
    }
    target += `?sort=${sort}&time=${time}`;
    if (params.get('cursor')) target += `&cursor=${encodeURIComponent(params.get('cursor'))}`;

    const [code, body] = await kickFetch(target, browserHeaders);
    return json(code || 502, body ?? { clips: [] }, 120);
  }

  if (action === 'clip') {
    const slug = (params.get('slug') || '').replace(/[^a-zA-Z0-9_-]/g, '');
    if (!slug) return json(400, { error: 'missing_slug' });
    const [code, body] = await kickFetch(`https://kick.com/api/v2/clips/${slug}`, browserHeaders);
    return json(code || 502, body ?? { clip: null }, 300);
  }

  return json(400, { error: 'unknown_action' });
}

// ---- /api/twitch/token — app access token for Clipy ----
export async function handleTwitchToken() {
  try {
    const { token, exp, clientId } = await getTwitchAppToken();
    if (!token) return json(502, { error: 'token_failed' });
    return json(200, { access_token: token, client_id: clientId, expires_at: exp });
  } catch (e) {
    return json(502, { error: 'token_failed', message: e.message });
  }
}

export const errorResponse = (e) => json(500, { error: 'internal_error', message: e.message });
