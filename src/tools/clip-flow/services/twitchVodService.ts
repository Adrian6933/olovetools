import { VodInfo, VodQuality, HlsSegment, SegmentIndex } from '../types';

const CLIENT_IDS = [
  "ue6666qo983sx6so1c0vnaz41db287",
  "kd1unb4r3yd4g17k2488dbw3v89usf",
  "kimne78kx3ncx6brgo4mv6wki5h1ko",
  "jzkbprff40iqj646a697cyrvl0zt2m6",
  "7tk7hk3hyx098935r20s880r66e92b"
];

const GQL_ENDPOINT = "https://gql.twitch.tv/gql";

const GQL_PROXIES = [
  (url: string) => url, // Direct first, often works for GQL
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

// usher.ttvnw.net (VOD master playlist) sends CORS headers and works with a direct
// fetch, but the actual video segment CDN (CloudFront/S3) does not, so segment and
// media-playlist downloads need a proxy. In dev this points at the local Node proxy
// (server/clipflow-proxy.mjs, run via `npm run proxy`); production uses clipflow-proxy.php
// deployed alongside the site on Hostinger. Leave empty to fall back to public proxies.
const WORKER_PROXY_URL = import.meta.env.DEV ? 'http://localhost:8787' : 'https://olovetools.com/clipflow-proxy.php';

export const DOWNLOAD_PROXIES = [
  ...(WORKER_PROXY_URL ? [(url: string) => `${WORKER_PROXY_URL}?url=${encodeURIComponent(url)}`] : []),
  (url: string) => url, // Try direct first
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://proxy.cors.sh/${url}`
];

class VodError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

// ---- GQL helper: tries every proxy x client-id combo, returns first successful `data` payload ----
const gqlRequest = async (query: string, variables: Record<string, any>): Promise<any> => {
  for (const makeProxyUrl of GQL_PROXIES) {
    for (const clientId of CLIENT_IDS) {
      try {
        const res = await fetch(makeProxyUrl(GQL_ENDPOINT), {
          method: 'POST',
          headers: { 'Client-ID': clientId, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables }),
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.contents ? JSON.parse(json.contents) : json;
          if (data.data) return data.data;
        }
      } catch (e) { /* try next */ }
    }
  }
  return null;
};

// ---- Input parsing ----
export type ParsedInput =
  | { kind: 'vod'; videoId: string; startTime?: number }
  | { kind: 'channel'; login: string; startTime?: number };

const RESERVED_PATH_SEGMENTS = new Set(['videos', 'clip', 'clips', 'directory', 'p', 'downloads', 'settings', 'subscriptions', 'wallet', 'jobs', 'turbo', 'friends', 'inventory', 'drops']);

// Parses Twitch's "?t=1h50m36s" timestamp query param into seconds.
const parseTwitchTimestamp = (raw: string | null): number | undefined => {
  if (!raw) return undefined;
  const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match || !(match[1] || match[2] || match[3])) return undefined;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

export const parseInput = (raw: string): ParsedInput | null => {
  const input = raw.trim();
  if (!input) return null;

  // Bare numeric id -> treat as VOD id directly
  if (/^\d{5,}$/.test(input)) return { kind: 'vod', videoId: input };

  // Bare channel name (no slashes, no dots that would suggest a domain)
  if (/^[a-zA-Z0-9_]{3,25}$/.test(input)) return { kind: 'channel', login: input.toLowerCase() };

  let url: URL;
  try {
    url = new URL(input.includes('://') ? input : `https://${input}`);
  } catch {
    return null;
  }

  if (!/twitch\.tv$/.test(url.hostname.replace(/^(m|www|player)\./, ''))) return null;

  const startTime = parseTwitchTimestamp(url.searchParams.get('t'));

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const videosIdx = segments.indexOf('videos');
  if (videosIdx !== -1 && segments[videosIdx + 1] && /^\d+$/.test(segments[videosIdx + 1])) {
    return { kind: 'vod', videoId: segments[videosIdx + 1], startTime };
  }

  if (segments.length === 1 && !RESERVED_PATH_SEGMENTS.has(segments[0].toLowerCase())) {
    return { kind: 'channel', login: segments[0].toLowerCase(), startTime };
  }

  return null;
};

// ---- Resolve a live channel (or any channel) to its most recent archived VOD ----
export const resolveChannelVideoId = async (login: string): Promise<{ videoId: string; isLive: boolean }> => {
  const query = `query($login: String!) { user(login: $login) { id stream { id } videos(first: 1, type: ARCHIVE, sort: TIME) { edges { node { id } } } } }`;
  const data = await gqlRequest(query, { login });
  const user = data?.user;
  if (!user) throw new VodError('errorChannelNotFound', 'Channel not found.');
  const edges = user.videos?.edges || [];
  if (edges.length === 0) throw new VodError('errorVodsDisabled', 'This channel has no VODs available.');
  return { videoId: edges[0].node.id, isLive: !!user.stream };
};

// ---- Fetch VOD metadata + signed playback token in a single round trip ----
export const fetchVodInfoAndToken = async (videoId: string): Promise<{ info: VodInfo; token: { signature: string; value: string } }> => {
  const query = `query($id: ID!) {
    videoPlaybackAccessToken(id: $id, params: { platform: "web", playerBackend: "mediaplayer", playerType: "site" }) { signature value }
    video(id: $id) { id title lengthSeconds createdAt previewThumbnailURL(width: 640, height: 360) owner { login displayName profileImageURL(width: 50) } }
  }`;
  const data = await gqlRequest(query, { id: videoId });
  const video = data?.video;
  const tokenData = data?.videoPlaybackAccessToken;
  if (!video || !tokenData) throw new VodError('errorVodNotFound', 'VOD not found.');

  return {
    info: {
      videoId: video.id,
      title: video.title || 'Untitled broadcast',
      broadcaster: video.owner?.displayName || video.owner?.login || 'Streamer',
      broadcasterImg: video.owner?.profileImageURL || '',
      thumbnail: (video.previewThumbnailURL || '').replace('%{width}', '640').replace('%{height}', '360'),
      lengthSeconds: video.lengthSeconds || 0,
      createdAt: video.createdAt,
    },
    token: { signature: tokenData.signature, value: tokenData.value },
  };
};

// ---- usher.ttvnw.net master playlist -> list of quality variants ----
export const fetchMasterPlaylist = async (videoId: string, token: { signature: string; value: string }): Promise<VodQuality[]> => {
  const usherUrl = `https://usher.ttvnw.net/vod/${videoId}.m3u8?sig=${token.signature}&token=${encodeURIComponent(token.value)}&allow_source=true&allow_audio_only=false&player=twitchweb`;

  let playlistText = '';
  for (const makeUrl of DOWNLOAD_PROXIES) {
    try {
      const res = await fetch(makeUrl(usherUrl));
      if (res.ok) {
        const text = await res.text();
        if (text.includes('#EXT-X-STREAM-INF')) { playlistText = text; break; }
      }
    } catch (e) { /* try next proxy */ }
  }
  if (!playlistText) throw new VodError('errorPlaylist', 'Could not load the video stream.');

  const baseUrl = usherUrl.substring(0, usherUrl.lastIndexOf('/') + 1);
  const lines = playlistText.split('\n');
  const qualities: VodQuality[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#EXT-X-STREAM-INF:')) continue;

    const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
    const fpsMatch = line.match(/FRAME-RATE=([\d.]+)/);
    const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
    const videoMatch = line.match(/VIDEO="([^"]+)"/);

    let nextLine = '';
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim() && !lines[j].trim().startsWith('#')) { nextLine = lines[j].trim(); break; }
    }
    if (!nextLine) continue;

    const qualityUrl = nextLine.startsWith('http') ? nextLine : baseUrl + nextLine;
    const isSource = /chunked/i.test(videoMatch?.[1] || '') || /chunked/i.test(nextLine);
    let quality = isSource ? 'Source' : (resolutionMatch ? `${resolutionMatch[1].split('x')[1]}p` : (videoMatch?.[1] || 'Auto'));
    const fps = fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : (line.includes('60') ? 60 : 30);
    if (fps === 60 && !quality.includes('60') && quality !== 'Source') quality = `${quality}60`;

    qualities.push({ quality, fps, bandwidth: bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0, url: qualityUrl });
  }

  if (qualities.length === 0) throw new VodError('errorPlaylist', 'No playable video streams found.');
  qualities.sort((a, b) => b.bandwidth - a.bandwidth);
  return qualities;
};

// ---- Media playlist -> ordered segment index with cumulative timing offsets ----
export const fetchSegmentIndex = async (mediaPlaylistUrl: string): Promise<SegmentIndex> => {
  let playlistText = '';
  for (const makeUrl of DOWNLOAD_PROXIES) {
    try {
      const res = await fetch(makeUrl(mediaPlaylistUrl));
      if (res.ok) { playlistText = await res.text(); break; }
    } catch (e) { /* try next proxy */ }
  }
  if (!playlistText) throw new VodError('errorPlaylist', 'Could not load the video stream.');

  const baseUrl = mediaPlaylistUrl.substring(0, mediaPlaylistUrl.lastIndexOf('/') + 1);
  const lines = playlistText.split('\n');
  const segments: HlsSegment[] = [];
  let cumulative = 0;
  let pendingDuration = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      pendingDuration = parseFloat(line.substring('#EXTINF:'.length).split(',')[0]) || 0;
    } else if (!line.startsWith('#')) {
      const url = line.startsWith('http') ? line : baseUrl + line;
      segments.push({ url, duration: pendingDuration, start: cumulative });
      cumulative += pendingDuration;
      pendingDuration = 0;
    }
  }

  if (segments.length === 0) throw new VodError('errorPlaylist', 'No video segments found.');
  return { segments, totalDuration: cumulative, baseUrl };
};

// ---- Pure helper: slice the segments covering [start, end) ----
export const computeSegmentWindow = (index: SegmentIndex, start: number, end: number): { segments: HlsSegment[]; windowStart: number } => {
  const segments = index.segments.filter(seg => seg.start + seg.duration > start && seg.start < end);
  return { segments, windowStart: segments.length > 0 ? segments[0].start : start };
};

// ---- Concurrent segment downloader (5 workers), matches kickService.ts pattern ----
export const downloadSegments = async (segments: HlsSegment[], onProgress: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<Blob> => {
  if (segments.length === 0) throw new VodError('errorPlaylist', 'No segments to download.');

  const buffers: ArrayBuffer[] = new Array(segments.length);
  let loadedBytes = 0;
  let completedSegments = 0;
  const CONCURRENCY = 5;
  let currentIndex = 0;

  const downloadSegment = async (index: number) => {
    const segUrl = segments[index].url;
    for (const makeUrl of DOWNLOAD_PROXIES) {
      if (signal?.aborted) throw new Error('AbortError');
      try {
        const res = await fetch(makeUrl(segUrl), { signal });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        buffers[index] = buffer;
        loadedBytes += buffer.byteLength;
        completedSegments++;
        const avgSize = loadedBytes / completedSegments;
        onProgress(loadedBytes, avgSize * segments.length);
        return;
      } catch (e: any) {
        if (e.name === 'AbortError' || e.message === 'AbortError') throw e;
      }
    }
    throw new Error(`Failed to download segment ${index}`);
  };

  const workers = Array.from({ length: CONCURRENCY }, () => (async () => {
    while (currentIndex < segments.length) {
      if (signal?.aborted) throw new Error('AbortError');
      const idx = currentIndex++;
      await downloadSegment(idx);
    }
  })());

  await Promise.all(workers);
  return new Blob(buffers, { type: 'video/mp2t' });
};

// ---- Rough byte estimate for a cut at a given quality, used for memory warnings ----
export const estimateCutBytes = (quality: VodQuality | null, durationSec: number): number => {
  if (!quality || !quality.bandwidth) return 0;
  return (quality.bandwidth / 8) * durationSec;
};

export { VodError };
