// SocialBolt — resolución de enlaces sociales y relay de medios.
//
// Por qué existe: la versión anterior de la herramienta hacía todo desde el
// navegador a través de proxies CORS públicos de terceros (corsproxy.io,
// codetabs), a los que había que entregarles la URL del usuario, y contra
// instancias de Cobalt que ya no existen o exigen JWT. Aquí se resuelve todo
// desde nuestra propia función serverless: sin terceros de por medio, sin
// claves de pago y con errores honestos cuando una plataforma no se puede
// servir gratis.
//
// Solo usa fetch/URL/URLSearchParams estándar (sin APIs de Node), igual que
// server/core.mjs, para que corra tal cual en el Worker de Cloudflare y en Node.

import { BROWSER_UA } from './core.mjs';

const env = (name) => (typeof process !== 'undefined' ? process.env[name] : undefined);

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
  body: JSON.stringify(data),
});

const text = (status, body) => ({ status, headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' }, body });

// ---------------------------------------------------------------------------
// Allowlist de CDNs. El relay NO es un proxy abierto: solo sirve los hosts
// desde los que estas plataformas entregan medios. Sin esto, /api/social se
// convertiría en un proxy anónimo gratuito para cualquiera.
// ---------------------------------------------------------------------------
const MEDIA_HOST_SUFFIXES = [
  // TikTok (tikwm reenvía a estos hosts firmados)
  'tikwm.com',
  'tiktokcdn.com',
  'tiktokcdn-us.com',
  'tiktokcdn-eu.com',
  'tiktokv.com',
  'byteoversea.com',
  'ibyteimg.com',
  'muscdn.com',
  'ttwstatic.com',
  // X / Twitter
  'twimg.com',
  // YouTube
  'ytimg.com',
  'googlevideo.com',
  // Instagram / Meta
  'cdninstagram.com',
  'fbcdn.net',
];

export const isAllowedMediaHost = (hostname) => {
  const host = String(hostname).toLowerCase();
  return MEDIA_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
};

/** Algunos CDNs de TikTok devuelven 403 sin un Referer creíble. */
function refererFor(hostname) {
  const host = hostname.toLowerCase();
  if (host.includes('tiktok') || host.includes('byteoversea') || host.includes('muscdn') || host.includes('ibyteimg')) {
    return 'https://www.tiktok.com/';
  }
  if (host.endsWith('twimg.com')) return 'https://x.com/';
  if (host.endsWith('cdninstagram.com') || host.endsWith('fbcdn.net')) return 'https://www.instagram.com/';
  if (host.endsWith('ytimg.com') || host.endsWith('googlevideo.com')) return 'https://www.youtube.com/';
  return undefined;
}

// ---------------------------------------------------------------------------
// Detección y normalización de URL
// ---------------------------------------------------------------------------

export function detectPlatform(rawUrl) {
  let host;
  try {
    const parsed = new URL(rawUrl.trim());
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || (parsed.port && !['80', '443'].includes(parsed.port))) return 'unknown';
    host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  if (host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am') return 'instagram';
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube';
  if (host === 'twitter.com' || host.endsWith('.twitter.com') || host === 'x.com' || host.endsWith('.x.com')) return 'twitter';
  return 'unknown';
}

const sanitizeName = (name, fallback = 'socialbolt') => {
  const clean = String(name || '')
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const ext = clean.match(/\.[a-z0-9]{1,5}$/i)?.[0] || '';
  return (clean.length > 70 ? clean.slice(0, 70 - ext.length).trimEnd() + ext : clean) || fallback;
};

// ---------------------------------------------------------------------------
// TikTok — vía TikWM. Es lo único de las cuatro plataformas que funciona
// entero y gratis, así que se exprime al máximo: hd=1 para pedir la pista sin
// recomprimir, más audio, portada original, avatar y carruseles de fotos.
// ---------------------------------------------------------------------------
async function resolveTikTok(url) {
  const endpoint = `https://www.tikwm.com/api/?hd=1&url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw Object.assign(new Error(`tikwm http ${res.status}`), { code: 'resolver_unavailable' });

  const payload = await res.json().catch(() => null);
  if (!payload || payload.code !== 0 || !payload.data) {
    // TikWM limita a ~1 petición/segundo por IP y contesta con code -1.
    const busy = payload && /limit|frequen/i.test(String(payload.msg || ''));
    throw Object.assign(new Error(payload?.msg || 'tikwm rejected the URL'), {
      code: busy ? 'rate_limited' : 'not_found',
    });
  }

  const d = payload.data;
  const base = sanitizeName(d.title, `tiktok-${d.id || 'media'}`);
  const assets = [];

  if (d.hdplay) {
    assets.push({
      id: 'video-hd',
      kind: 'video',
      labelKey: 'assetVideoHd',
      url: d.hdplay,
      ext: 'mp4',
      mime: 'video/mp4',
      bytes: d.hd_size || undefined,
      badge: 'HD',
      primary: true,
    });
  }
  if (d.play) {
    assets.push({
      id: 'video-sd',
      kind: 'video',
      labelKey: 'assetVideoNoWatermark',
      url: d.play,
      ext: 'mp4',
      mime: 'video/mp4',
      bytes: d.size || undefined,
      primary: !d.hdplay,
    });
  }
  if (d.wmplay) {
    assets.push({
      id: 'video-wm',
      kind: 'video',
      labelKey: 'assetVideoWatermark',
      url: d.wmplay,
      ext: 'mp4',
      mime: 'video/mp4',
      bytes: d.wm_size || undefined,
    });
  }
  const musicUrl = d.music || d.music_info?.play;
  if (musicUrl) {
    assets.push({
      id: 'audio',
      kind: 'audio',
      labelKey: 'assetAudio',
      url: musicUrl,
      ext: 'mp3',
      mime: 'audio/mpeg',
      note: d.music_info?.title || undefined,
    });
  }
  if (d.origin_cover || d.cover) {
    assets.push({
      id: 'cover',
      kind: 'image',
      labelKey: 'assetCover',
      url: d.origin_cover || d.cover,
      ext: 'jpg',
      mime: 'image/jpeg',
    });
  }
  if (d.author?.avatar) {
    assets.push({
      id: 'avatar',
      kind: 'image',
      labelKey: 'assetAvatar',
      url: d.author.avatar,
      ext: 'jpg',
      mime: 'image/jpeg',
    });
  }
  if (Array.isArray(d.images)) {
    d.images.forEach((img, i) => {
      assets.push({
        id: `photo-${i + 1}`,
        kind: 'image',
        labelKey: 'assetSlide',
        labelIndex: i + 1,
        url: img,
        ext: 'jpg',
        mime: 'image/jpeg',
        primary: i === 0,
      });
    });
  }

  return {
    platform: 'tiktok',
    id: String(d.id || ''),
    title: d.title || '',
    baseName: base,
    author: {
      name: d.author?.nickname || '',
      handle: d.author?.unique_id ? `@${d.author.unique_id}` : '',
      avatar: d.author?.avatar || '',
    },
    thumbnail: d.origin_cover || d.cover || '',
    duration: d.duration || 0,
    stats: {
      views: d.play_count ?? null,
      likes: d.digg_count ?? null,
      comments: d.comment_count ?? null,
      shares: d.share_count ?? null,
    },
    assets,
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// X / Twitter — API de sindicación (la que alimenta los tweets embebidos).
// Pública, sin clave y con TODAS las variantes de bitrate del vídeo, así que
// el usuario elige calidad de verdad en vez de tragarse una fija.
// ---------------------------------------------------------------------------
function tweetIdFrom(url) {
  const match = String(url).match(/(?:status(?:es)?|i\/web\/status)\/(\d{1,25})/);
  return match ? match[1] : null;
}

/** Token que exige cdn.syndication.twimg.com; derivado del propio id. */
function syndicationToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

/** Las URLs de vídeo de Twitter llevan la resolución en la ruta: /720x1280/ */
function dimsFromTwitterUrl(url) {
  const m = String(url).match(/\/(\d{2,4})x(\d{2,4})\//);
  return m ? { width: Number(m[1]), height: Number(m[2]) } : {};
}

async function resolveTwitter(url) {
  const id = tweetIdFrom(url);
  if (!id) throw Object.assign(new Error('no tweet id'), { code: 'bad_url' });

  const endpoint = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}&lang=en`;
  const res = await fetch(endpoint, {
    headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 404) throw Object.assign(new Error('tweet not found'), { code: 'not_found' });
  if (!res.ok) throw Object.assign(new Error(`syndication http ${res.status}`), { code: 'resolver_unavailable' });

  const d = await res.json().catch(() => null);
  if (!d || d.__typename === 'TweetTombstone') {
    throw Object.assign(new Error('tweet unavailable'), { code: 'not_found' });
  }

  const media = d.mediaDetails || [];
  const base = sanitizeName(d.text, `x-${id}`);
  const assets = [];
  let thumbnail = '';
  let videoIndex = 0;
  let photoIndex = 0;

  for (const item of media) {
    if (!thumbnail && item.media_url_https) thumbnail = item.media_url_https;

    if (item.type === 'video' || item.type === 'animated_gif') {
      videoIndex += 1;
      const variants = (item.video_info?.variants || [])
        .filter((v) => v.content_type === 'video/mp4' && v.url)
        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      variants.forEach((variant, i) => {
        const dims = dimsFromTwitterUrl(variant.url);
        assets.push({
          id: `video-${videoIndex}-${i}`,
          kind: 'video',
          labelKey: item.type === 'animated_gif' ? 'assetGif' : 'assetVideo',
          labelIndex: media.length > 1 ? videoIndex : undefined,
          url: variant.url,
          ext: 'mp4',
          mime: 'video/mp4',
          badge: dims.height ? `${dims.height}p` : undefined,
          width: dims.width,
          height: dims.height,
          primary: i === 0,
          thumb: item.media_url_https || undefined,
        });
      });
      if (item.media_url_https) {
        assets.push({
          id: `poster-${videoIndex}`,
          kind: 'image',
          labelKey: 'assetPoster',
          url: `${item.media_url_https}?name=orig`,
          ext: 'jpg',
          mime: 'image/jpeg',
        });
      }
    } else if (item.type === 'photo' && item.media_url_https) {
      photoIndex += 1;
      assets.push({
        id: `photo-${photoIndex}`,
        kind: 'image',
        labelKey: 'assetPhoto',
        labelIndex: media.length > 1 ? photoIndex : undefined,
        // ?name=orig devuelve el original sin la recompresión del timeline.
        url: `${item.media_url_https}?name=orig`,
        ext: (item.media_url_https.split('.').pop() || 'jpg').toLowerCase(),
        mime: 'image/jpeg',
        primary: photoIndex === 1,
        thumb: `${item.media_url_https}?name=small`,
      });
    }
  }

  if (d.user?.profile_image_url_https) {
    assets.push({
      id: 'avatar',
      kind: 'image',
      labelKey: 'assetAvatar',
      // _normal → _400x400: la miniatura del avatar viene a 48px por defecto.
      url: d.user.profile_image_url_https.replace(/_normal(\.\w+)$/, '_400x400$1'),
      ext: 'jpg',
      mime: 'image/jpeg',
    });
  }

  return {
    platform: 'twitter',
    id,
    title: d.text || '',
    baseName: base,
    author: {
      name: d.user?.name || '',
      handle: d.user?.screen_name ? `@${d.user.screen_name}` : '',
      avatar: d.user?.profile_image_url_https || '',
    },
    thumbnail,
    duration: media[0]?.video_info?.duration_millis ? Math.round(media[0].video_info.duration_millis / 1000) : 0,
    stats: {
      views: null,
      likes: d.favorite_count ?? null,
      comments: d.conversation_count ?? null,
      shares: null,
    },
    assets,
    warnings: assets.some((a) => a.kind === 'video') ? [] : media.length ? [] : ['no_media'],
  };
}

// ---------------------------------------------------------------------------
// YouTube — oEmbed (público, sin clave) para metadatos y miniaturas.
//
// El vídeo en sí NO se puede resolver gratis desde aquí: hace falta descifrar
// la firma de los streams, que cambia cada pocos días y exige ejecutar el
// player.js de YouTube. Así que se sirve lo que sí es real (título, autor,
// miniaturas en todas las resoluciones) y se avisa con `youtube_video`; si el
// que despliega tiene una instancia propia de Cobalt, COBALT_API_URL la usa.
// ---------------------------------------------------------------------------
export function youtubeIdFrom(url) {
  try {
    const u = new URL(url);
    const id = u.hostname.replace(/^www\./, '') === 'youtu.be' ? u.pathname.slice(1).split('/')[0]
      : u.searchParams.get('v') || u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]+)/)?.[2];
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Solo existe maxresdefault si el vídeo se subió en HD; se comprueba de verdad. */
async function bestYoutubeThumb(id) {
  for (const name of ['maxresdefault', 'sddefault', 'hqdefault']) {
    const url = `https://i.ytimg.com/vi/${id}/${name}.jpg`;
    try {
      const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': BROWSER_UA }, signal: AbortSignal.timeout(8000) });
      if (res.ok) return { url, name };
    } catch {
      /* siguiente resolución */
    }
  }
  return { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, name: 'hqdefault' };
}

async function resolveYouTube(url, options) {
  const id = youtubeIdFrom(url);
  if (!id) throw Object.assign(new Error('no video id'), { code: 'bad_url' });

  const [metaRes, thumb] = await Promise.all([
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(15000),
    }).catch(() => null),
    bestYoutubeThumb(id),
  ]);

  const meta = metaRes && metaRes.ok ? await metaRes.json().catch(() => null) : null;
  if (!meta && metaRes && metaRes.status === 404) {
    throw Object.assign(new Error('video not found'), { code: 'not_found' });
  }

  const assets = [
    {
      id: 'thumb-max',
      kind: 'image',
      labelKey: 'assetThumbnail',
      url: thumb.url,
      ext: 'jpg',
      mime: 'image/jpeg',
      badge: thumb.name === 'maxresdefault' ? 'MAX' : thumb.name === 'sddefault' ? 'SD' : 'HQ',
      primary: true,
    },
  ];
  // No duplicate HQ when the video has no larger cover. Every additional
  // resolution is checked: ytimg can return a 120x90 placeholder with 404.
  const alternatives = await Promise.all([
    ['thumb-hq', 'hqdefault', 480, 360],
    ['thumb-mq', 'mqdefault', 320, 180],
    ['thumb-sd', 'default', 120, 90],
  ].filter(([, name]) => name !== thumb.name).map(async ([assetId, name, width, height]) => {
    const href = `https://i.ytimg.com/vi/${id}/${name}.jpg`;
    try {
      const check = await fetch(href, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      if (!check.ok) return null;
      return { id: assetId, kind: 'image', labelKey: 'assetThumbnailAlt', url: href, ext: 'jpg', mime: 'image/jpeg', width, height, badge: `${width}×${height}` };
    } catch { return null; }
  }));
  assets.push(...alternatives.filter(Boolean));

  const warnings = [];
  if (options.mode !== 'metadata') {
    const tunnel = await tryCobalt(`https://www.youtube.com/watch?v=${id}`, 'youtube', options);
    if (tunnel.length) { assets[0].primary = false; assets.unshift(...tunnel); }
    else warnings.push('youtube_video');
  }

  return {
    platform: 'youtube',
    id,
    title: meta?.title || '',
    baseName: sanitizeName(meta?.title, `youtube-${id}`),
    author: { name: meta?.author_name || '', handle: '', avatar: '' },
    thumbnail: thumb.url,
    duration: 0,
    stats: { views: null, likes: null, comments: null, shares: null },
    assets,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Instagram — mejor esfuerzo declarado.
//
// Instagram cerró sus endpoints públicos: `?__a=1` exige sesión y la API
// interna rechaza las IP de datacenter (probado: devuelve el muro de login en
// HTML). Se intenta el HTML del embed público, que aún funciona para parte de
// los posts, y si hay instancia de Cobalt configurada se usa. Si no sale, se
// dice claramente en vez de fingir.
// ---------------------------------------------------------------------------
function instagramCodeFrom(url) {
  const m = String(url).match(/instagr(?:am\.com|\.am)\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]{5,20})/);
  return m ? m[1] : null;
}

async function resolveInstagram(url) {
  const code = instagramCodeFrom(url);
  if (!code) throw Object.assign(new Error('no shortcode'), { code: 'bad_url' });

  const assets = [];
  const warnings = [];
  let title = '';
  let author = { name: '', handle: '', avatar: '' };

  try {
    const res = await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, {
      headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const html = await res.text();
      // El embed serializa el post dentro de un string JSON escapado, así que
      // los campos aparecen con barras dobles.
      const unescaped = html.replace(/\\"/g, '"').replace(/\\u0026/g, '&').replace(/\\\//g, '/');
      const video = unescaped.match(/"video_url":"(https:[^"]+)"/);
      const display = unescaped.match(/"display_url":"(https:[^"]+)"/);
      const owner = unescaped.match(/"owner":\{[^}]*"username":"([^"]+)"/);
      const caption = unescaped.match(/"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"([^"]*)"/);

      if (video) {
        assets.push({
          id: 'video',
          kind: 'video',
          labelKey: 'assetVideo',
          url: video[1],
          ext: 'mp4',
          mime: 'video/mp4',
          primary: true,
        });
      }
      if (display) {
        assets.push({
          id: 'image',
          kind: 'image',
          labelKey: video ? 'assetPoster' : 'assetPhoto',
          url: display[1],
          ext: 'jpg',
          mime: 'image/jpeg',
          primary: !video,
        });
      }
      if (owner) author = { name: owner[1], handle: `@${owner[1]}`, avatar: '' };
      if (caption) title = caption[1].slice(0, 300);
    }
  } catch {
    /* el fallback de Cobalt sigue debajo */
  }

  if (!assets.length) {
    const tunnel = await tryCobalt(url, 'instagram');
    assets.push(...tunnel);
  }
  if (!assets.length) {
    throw Object.assign(new Error('instagram blocked'), { code: 'instagram_blocked' });
  }

  return {
    platform: 'instagram',
    id: code,
    title,
    baseName: sanitizeName(title, `instagram-${code}`),
    author,
    thumbnail: assets.find((a) => a.kind === 'image')?.url || '',
    duration: 0,
    stats: { views: null, likes: null, comments: null, shares: null },
    assets,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Cobalt opcional (self-host). Sin COBALT_API_URL esto no hace ni una
// petición: no tiene sentido machacar instancias públicas que hoy exigen JWT.
// Formato de petición de la API v10 (la v7 que usaba la versión anterior de
// SocialBolt lleva años retirada).
// ---------------------------------------------------------------------------
async function tryCobalt(url, platform, options = { mode: 'auto', quality: '1080' }) {
  const base = env('COBALT_API_URL');
  if (!base) return [];

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const key = env('COBALT_API_KEY');
  if (key) headers.Authorization = `Api-Key ${key}`;

  try {
    const res = await fetch(base.replace(/\/+$/, '') + '/', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        videoQuality: options.quality,
        downloadMode: options.mode === 'audio' ? 'audio' : 'auto',
        audioFormat: 'mp3',
        youtubeVideoCodec: 'h264',
        filenameStyle: 'basic',
        twitterGif: true,
      }),
      signal: AbortSignal.timeout(25000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return [];

    if ((data.status === 'tunnel' || data.status === 'redirect') && data.url) {
      return [
        {
          id: 'cobalt-video',
          kind: options.mode === 'audio' ? 'audio' : 'video',
          labelKey: options.mode === 'audio' ? 'assetAudio' : 'assetVideo',
          url: data.url,
          ext: options.mode === 'audio' ? 'mp3' : 'mp4',
          mime: options.mode === 'audio' ? 'audio/mpeg' : 'video/mp4',
          primary: true,
          external: true,
        },
      ];
    }
    if (data.status === 'picker' && Array.isArray(data.picker)) {
      return data.picker.map((item, i) => ({
        id: `cobalt-${i + 1}`,
        kind: item.type === 'photo' ? 'image' : 'video',
        labelKey: item.type === 'photo' ? 'assetPhoto' : 'assetVideo',
        labelIndex: i + 1,
        url: item.url,
        ext: item.type === 'photo' ? 'jpg' : 'mp4',
        mime: item.type === 'photo' ? 'image/jpeg' : 'video/mp4',
        primary: i === 0,
        thumb: item.thumb,
        external: true,
      }));
    }
  } catch {
    /* instancia caída: se trata como "no hay assets" */
  }
  return [];
}

// ---------------------------------------------------------------------------
// Handlers públicos
// ---------------------------------------------------------------------------

export async function handleSocialResolve(url) {
  const target = (url.searchParams.get('url') || '').trim();
  if (!target) return json(400, { error: 'missing_url' });
  if (target.length > 2048) return json(400, { error: 'bad_url' });

  const platform = detectPlatform(target);
  if (platform === 'unknown') return json(400, { error: 'unsupported_platform' });

  try {
    let result;
    if (platform === 'tiktok') result = await resolveTikTok(target);
    else if (platform === 'twitter') result = await resolveTwitter(target);
    else if (platform === 'youtube') result = await resolveYouTube(target, {
      mode: ['auto', 'audio', 'metadata'].includes(url.searchParams.get('mode')) ? url.searchParams.get('mode') : 'auto',
      quality: ['max', '2160', '1080', '720', '480', '360'].includes(url.searchParams.get('quality')) ? url.searchParams.get('quality') : '1080',
    });
    else result = await resolveInstagram(target);

    if (!result.assets.length) return json(404, { error: 'no_media', platform });
    // Cache corta: las URLs de los CDN vienen firmadas y caducan.
    return json(200, result, 60);
  } catch (e) {
    const code = e?.code || 'resolve_failed';
    const status = code === 'bad_url' || code === 'unsupported_platform' ? 400 : code === 'not_found' ? 404 : 502;
    return json(status, { error: code, platform, message: e?.message });
  }
}

/**
 * Relay de medios. Solo se usa cuando el CDN no manda CORS (el cliente
 * descarga directo siempre que puede, para no gastar ancho de banda de la
 * función). Fuerza Content-Disposition: attachment porque `<a download>` se
 * ignora en cross-origin y ese era justo el bug por el que los botones de
 * descarga abrían pestañas en vez de descargar.
 */
export async function handleSocialMedia(url, rangeHeader, method = 'GET') {
  const target = url.searchParams.get('url');
  if (!target) return text(400, 'Missing "url" query parameter');

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    return text(400, 'Invalid target URL');
  }
  if (targetUrl.protocol !== 'https:') return text(400, 'Only https targets are allowed');
  if (!isAllowedRelayUrl(targetUrl)) return text(403, 'Host not allowed');

  const forwardHeaders = { 'User-Agent': BROWSER_UA };
  const referer = refererFor(targetUrl.hostname);
  if (referer) forwardHeaders.Referer = referer;
  if (rangeHeader) forwardHeaders.Range = rangeHeader;

  const isHead = method === 'HEAD';
  let upstream;
  try {
    // Validate every redirect too; a CDN redirect must not turn this into an
    // arbitrary fetch endpoint. Cobalt tunnels use the configured origin only.
    for (let hop = 0; hop < 5; hop++) {
      upstream = await fetch(targetUrl.toString(), { method: isHead ? 'HEAD' : 'GET', headers: forwardHeaders, redirect: 'manual', signal: AbortSignal.timeout(45_000) });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get('location');
      await upstream.body?.cancel();
      if (!location) return text(502, 'Missing redirect destination');
      targetUrl = new URL(location, targetUrl);
      if (!isAllowedRelayUrl(targetUrl)) return text(403, 'Redirect host not allowed');
      if (hop === 4) return text(502, 'Too many redirects');
    }
  } catch (e) {
    return text(502, `Upstream fetch failed: ${e.message}`);
  }

  const headers = { ...CORS_HEADERS };
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(key);
    if (value) headers[key] = value;
  }
  const name = sanitizeName(url.searchParams.get('name'), 'socialbolt-media');
  headers['Content-Disposition'] = `attachment; filename="${name.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16))}`;

  return { status: upstream.status, headers, body: isHead ? null : upstream.body, isBinary: true };
}

export async function handleSocial(url, rangeHeader, method = 'GET') {
  const action = url.searchParams.get('action') || 'resolve';
  if (action === 'media') return handleSocialMedia(url, rangeHeader, method);
  if (action === 'resolve') return handleSocialResolve(url);
  if (action === 'capabilities') return json(200, { youtubeMedia: Boolean(env('COBALT_API_URL')) });
  return json(400, { error: 'unknown_action' });
}

export function isAllowedRelayUrl(value) {
  try {
    const u = value instanceof URL ? value : new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443')) return false;
    if (isAllowedMediaHost(u.hostname)) return true;
    const base = env('COBALT_API_URL');
    // The tunnel endpoint is the only extra host/path permitted. Never allow
    // arbitrary paths on the extractor host (admin APIs, fetch endpoints…).
    return Boolean(base && u.origin === new URL(base).origin && /^\/tunnel\/?$/.test(u.pathname));
  } catch { return false; }
}
