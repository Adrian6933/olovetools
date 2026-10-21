// Capa de red de SocialBolt.
//
// Regla de oro aquí: el navegador descarga DIRECTO del CDN siempre que el CDN
// mande CORS (TikTok y Twitter lo hacen), y solo cae a nuestra función
// serverless cuando no. Así la mayoría de las descargas no gastan ni un byte
// de ancho de banda del despliegue, que es el recurso caro del plan gratis.

import type { Asset, Platform, ResolvedMedia, ResolveOptions } from '../types';

const API = '/api/social';

/** Espejo ligero de la detección del servidor, para pintar la UI al teclear. */
export function detectPlatform(rawUrl: string): Platform {
  const value = rawUrl.trim();
  if (!value) return 'unknown';
  let host: string;
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || (parsed.port && !['80', '443'].includes(parsed.port))) return 'unknown';
    host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
  if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'tiktok';
  if (host === 'instagram.com' || host.endsWith('.instagram.com') || host === 'instagr.am') return 'instagram';
  if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'youtube';
  if (host === 'twitter.com' || host.endsWith('.twitter.com') || host === 'x.com' || host.endsWith('.x.com')) return 'twitter';
  if (isDirectMediaUrl(value)) return 'direct';
  return 'unknown';
}

/** Los mismos sufijos que acepta el relay del servidor (server/socialResolve.mjs). */
const MEDIA_HOST_SUFFIXES = [
  'tikwm.com', 'tiktokcdn.com', 'tiktokcdn-us.com', 'tiktokcdn-eu.com', 'tiktokv.com',
  'byteoversea.com', 'ibyteimg.com', 'muscdn.com', 'ttwstatic.com',
  'twimg.com', 'ytimg.com', 'googlevideo.com', 'cdninstagram.com', 'fbcdn.net',
];

export function isDirectMediaUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return MEDIA_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export class ResolveError extends Error {
  /** Clave del diccionario; el componente decide el texto. */
  key: string;
  constructor(key: string, message?: string) {
    super(message || key);
    this.key = key;
  }
}

export async function resolveLink(url: string, signal?: AbortSignal, options?: ResolveOptions): Promise<ResolvedMedia> {
  let res: Response;
  try {
    const query = new URLSearchParams({ action: 'resolve', url, mode: options?.mode || 'auto', quality: options?.quality || '1080' });
    res = await fetch(`${API}?${query}`, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60_000)]) : AbortSignal.timeout(60_000) });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ResolveError('network');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.error) {
    throw new ResolveError(data?.error || 'resolve_failed', data?.message);
  }
  return data as ResolvedMedia;
}

/** URL del relay propio, con el nombre de archivo ya puesto. */
export function proxyUrl(mediaUrl: string, filename: string): string {
  return `${API}?action=media&url=${encodeURIComponent(mediaUrl)}&name=${encodeURIComponent(filename)}`;
}

/** Modo manual: una URL de CDN pegada a mano se convierte en un resultado sin resolver nada. */
export function directResult(url: string): ResolvedMedia {
  let ext = '';
  try {
    const parsed = new URL(url);
    ext = (parsed.searchParams.get('format') || parsed.pathname.match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase();
  } catch {
    /* ya validado por isDirectMediaUrl */
  }
  const mimes: Record<string, string> = {mp4:'video/mp4', mov:'video/quicktime', webm:'video/webm', m4v:'video/mp4', mp3:'audio/mpeg', m4a:'audio/mp4', aac:'audio/aac', wav:'audio/wav', ogg:'audio/ogg', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif', heic:'image/heic', avif:'image/avif'};
  if (!mimes[ext]) ext = 'mp4';
  const kind: Asset['kind'] = /^(mp4|mov|webm|m4v)$/.test(ext)
    ? 'video'
    : /^(mp3|m4a|aac|wav|ogg)$/.test(ext)
      ? 'audio'
      : /^(jpg|jpeg|png|webp|gif|heic|avif)$/.test(ext)
        ? 'image'
        : 'video';

  return {
    platform: 'direct',
    id: 'direct',
    title: '',
    baseName: 'socialbolt-media',
    author: { name: '', handle: '', avatar: '' },
    thumbnail: kind === 'image' ? url : '',
    duration: 0,
    stats: { views: null, likes: null, comments: null, shares: null },
    assets: [
      {
        id: 'direct',
        kind,
        labelKey: 'assetDirect',
        url,
        ext,
        mime: mimes[ext],
        primary: true,
      },
    ],
    warnings: [],
  };
}

export function filenameFor(result: ResolvedMedia, asset: Asset): string {
  const suffix = asset.id.replace(/^(video|photo|audio|thumb)-?/, '') || asset.kind;
  const parts = [result.platform, result.baseName || result.id, suffix].filter(Boolean);
  return `${parts.join('-')}.${asset.ext}`.replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase();
}

export interface FetchOptions {
  onProgress?: (received: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Descarga un asset a memoria. Intenta el CDN directo (rápido y gratis) y solo
 * si CORS lo impide vuelve a intentarlo por el relay propio.
 */
export async function fetchAsset(asset: Asset, filename: string, opts: FetchOptions = {}): Promise<Blob> {
  opts.signal?.throwIfAborted();
  const attempts = asset.external ? [proxyUrl(asset.url, filename)] : [asset.url, proxyUrl(asset.url, filename)];

  let lastError: unknown;
  for (const [index, href] of attempts.entries()) {
    try {
      const res = await fetch(href, { signal: opts.signal, mode: index === 0 && href === asset.url ? 'cors' : undefined });
      if (!res.ok) throw new ResolveError('download_failed', `http ${res.status}`);
      if (/text\/html|application\/json/i.test(res.headers.get('content-type') || '')) {
        await res.body?.cancel();
        throw new ResolveError('download_failed', 'Upstream returned a page instead of media');
      }
      return await readWithProgress(res, opts.onProgress);
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new ResolveError('download_failed');
}

async function readWithProgress(res: Response, onProgress?: FetchOptions['onProgress']): Promise<Blob> {
  const total = Number(res.headers.get('content-length') || 0);
  const type = res.headers.get('content-type') || 'application/octet-stream';
  if (!res.body || !onProgress) {
    const blob = await res.blob();
    if (!blob.size) throw new ResolveError('download_failed', 'Empty media response');
    onProgress?.(blob.size, blob.size);
    return blob;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try { for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress(received, total);
    }
  } } finally { reader.releaseLock(); }
  if (!received) throw new ResolveError('download_failed', 'Empty media response');
  onProgress(received, received);
  return new Blob(chunks as BlobPart[], { type });
}

/** Guarda un Blob revocando siempre la object URL (el fallo clásico de fuga). */
export function saveBlob(blob: Blob, filename: string): void {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // El click es síncrono pero la descarga la arranca el navegador después;
  // revocar en el mismo tick la aborta en Firefox.
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

export async function zipFiles(files: { name: string; blob: Blob }[], zipName: string): Promise<void> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const used = new Set<string>();
  for (const file of files) {
    let name = file.name;
    let n = 2;
    while (used.has(name)) {
      const dot = file.name.lastIndexOf('.');
      name = dot > 0 ? `${file.name.slice(0, dot)}-${n}${file.name.slice(dot)}` : `${file.name}-${n}`;
      n += 1;
    }
    used.add(name);
    zip.file(name, file.blob);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  saveBlob(blob, zipName);
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

/** Separa un pegado multilínea en enlaces individuales. */
export function splitLinks(raw: string): string[] {
  return inspectLinks(raw).links;
}

/** Preserve commas in signed URLs; discard tracking parameters only on post URLs. */
export function canonicalLink(raw: string): string {
  try {
    const u = new URL(raw);
    const platform = detectPlatform(raw);
    if (platform === 'youtube') {
      const id = u.hostname === 'youtu.be' ? u.pathname.slice(1).split('/')[0] : u.searchParams.get('v') || u.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]+)/)?.[1];
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube.com/watch?v=${id}`;
    }
    if (platform === 'twitter') {
      const id = u.pathname.match(/\/status(?:es)?\/(\d+)/)?.[1];
      if (id) return `https://x.com/i/status/${id}`;
    }
    if (platform !== 'direct' && platform !== 'unknown') {
      u.hash = '';
      for (const key of [...u.searchParams.keys()]) {
        if (/^(utm_|si$|feature$|igsh$)/.test(key)) u.searchParams.delete(key);
      }
    }
    return u.href;
  } catch { return raw; }
}

export function inspectLinks(raw: string): { links: string[]; invalid: string[]; duplicates: number } {
  const links: string[] = [], invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;
  for (const line of raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
    const candidates = line.match(/https?:\/\/[^\s<>"\u201c\u201d]+/gi) || [];
    if (!candidates.length) { invalid.push(line); continue; }
    for (const candidate of candidates) {
      const value = candidate.replace(/[)\].;]+$/, '');
      if (detectPlatform(value) === 'unknown') { invalid.push(value); continue; }
      const url = canonicalLink(value);
      if (seen.has(url)) { duplicates++; continue; }
      seen.add(url); links.push(url);
    }
  }
  return { links, invalid, duplicates };
}
