// Capa de red de SocialBolt.
//
// Regla de oro aquí: el navegador descarga DIRECTO del CDN siempre que el CDN
// mande CORS (TikTok y Twitter lo hacen), y solo cae a nuestra función
// serverless cuando no. Así la mayoría de las descargas no gastan ni un byte
// de ancho de banda del despliegue, que es el recurso caro del plan gratis.

import type { Asset, Platform, ResolvedMedia } from '../types';

const API = '/api/social';

/** Espejo ligero de la detección del servidor, para pintar la UI al teclear. */
export function detectPlatform(rawUrl: string): Platform {
  const value = rawUrl.trim();
  if (!value) return 'unknown';
  let host: string;
  try {
    host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
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

export async function resolveLink(url: string, signal?: AbortSignal): Promise<ResolvedMedia> {
  let res: Response;
  try {
    res = await fetch(`${API}?action=resolve&url=${encodeURIComponent(url)}`, { signal });
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
  let path = '';
  try {
    path = new URL(url).pathname;
  } catch {
    /* ya validado por isDirectMediaUrl */
  }
  const ext = (path.split('.').pop() || '').toLowerCase().slice(0, 5);
  const kind: Asset['kind'] = /^(mp4|mov|webm|m4v)$/.test(ext)
    ? 'video'
    : /^(mp3|m4a|aac|wav|ogg)$/.test(ext)
      ? 'audio'
      : /^(jpg|jpeg|png|webp|gif|heic)$/.test(ext)
        ? 'image'
        : 'video';
  const finalExt = ext && /^[a-z0-9]{2,5}$/.test(ext) ? ext : kind === 'video' ? 'mp4' : kind === 'audio' ? 'mp3' : 'jpg';

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
        ext: finalExt,
        mime: kind === 'video' ? 'video/mp4' : kind === 'audio' ? 'audio/mpeg' : 'image/jpeg',
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
  const attempts = asset.external ? [proxyUrl(asset.url, filename)] : [asset.url, proxyUrl(asset.url, filename)];

  let lastError: unknown;
  for (const [index, href] of attempts.entries()) {
    try {
      const res = await fetch(href, { signal: opts.signal, mode: index === 0 && href === asset.url ? 'cors' : undefined });
      if (!res.ok) throw new ResolveError('download_failed', `http ${res.status}`);
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
    onProgress?.(blob.size, blob.size);
    return blob;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress(received, total);
    }
  }
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
  return raw
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => /^https?:\/\//i.test(s));
}
