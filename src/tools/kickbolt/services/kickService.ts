import { ClipData, Resolution } from "../types";
import { noteRoute, usableProxies } from "./route";

// Backend at the same origin (src/pages/api/kick.ts, src/pages/proxy.ts, run
// as Vercel serverless functions): /api/kick?action=clip fetches clip info
// with browser-like headers server-side, and /proxy relays the clip CDN with
// CORS. Public proxies below remain as fallback.
export const DOWNLOAD_PROXIES = [
  (url: string) => `/proxy?url=${encodeURIComponent(url)}`,
  (url: string) => url, // Then direct
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://proxy.cors.sh/${url}`
];

const getClipSlug = (url: string): string | null => {
  try {
    const cleanUrl = url.trim();
    if (!cleanUrl) return null;
    
    const parsedUrl = new URL(cleanUrl);
    
    // Format: kick.com/username?clip=clip_id
    const clipParam = parsedUrl.searchParams.get('clip');
    if (clipParam) return clipParam;
    
    // Format: kick.com/clips/clip_id OR kick.com/username/clips/clip_id
    const match = parsedUrl.pathname.match(/\/clips\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
        return match[1];
    }
    
    return null;
  } catch (e) { return null; }
};

export const fetchClipInfo = async (url: string): Promise<ClipData> => {
  const slug = getClipSlug(url);
  if (!slug) throw new Error("Invalid URL. Make sure it contains a clip ID.");
  
  const apiUrl = `https://kick.com/api/v2/clips/${slug}`;
  let responseData: any = null;

  // The Node backend fetches kick.com's Cloudflare-protected API server-side.
  try {
      const res = await fetch(`/api/kick?action=clip&slug=${encodeURIComponent(slug)}`, {
          headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
          const json = await res.json();
          if (json && json.clip) responseData = json.clip;
      }
  } catch (e) {}

  if (!responseData) {
      for (const makeProxyUrl of usableProxies(DOWNLOAD_PROXIES.slice(1))) {
          try {
              const res = await fetch(makeProxyUrl(apiUrl), {
                  method: 'GET',
                  headers: { 'Accept': 'application/json' }
              });
              if (res.ok) {
                  const json = await res.json();
                  if (json && json.clip) {
                      responseData = json.clip;
                      break;
                  }
              }
          } catch (e) {}
      }
  }

  if (!responseData) throw new Error("Clip not found.");

  const videoUrl = responseData.video_url;
  if (!videoUrl) throw new Error("No video source found.");

  let resolutions: Resolution[] = [];

  if (videoUrl.includes('.m3u8')) {
    let masterPlaylistText = "";
    let masterUrl = videoUrl;
    if (videoUrl.includes('/index.m3u8')) {
        const parts = videoUrl.split('/');
        parts.splice(parts.length - 2, 2, 'master.m3u8');
        masterUrl = parts.join('/');
    }

    let activeUrl = masterUrl;

    for (const makeProxyUrl of usableProxies(DOWNLOAD_PROXIES)) {
        try {
            const res = await fetch(makeProxyUrl(masterUrl));
            if (res.ok) {
                const text = await res.text();
                if (text.includes('#EXT-X-STREAM-INF')) {
                    masterPlaylistText = text;
                    activeUrl = masterUrl;
                    break;
                }
            }
        } catch (e) {}
    }

    if (!masterPlaylistText) {
        for (const makeProxyUrl of usableProxies(DOWNLOAD_PROXIES)) {
            try {
                const res = await fetch(makeProxyUrl(videoUrl));
                if (res.ok) {
                    masterPlaylistText = await res.text();
                    activeUrl = videoUrl;
                    break;
                }
            } catch (e) {}
        }
    }

    let baseUrl = activeUrl.substring(0, activeUrl.lastIndexOf('/') + 1);

    if (masterPlaylistText && masterPlaylistText.includes('#EXT-X-STREAM-INF')) {
        const lines = masterPlaylistText.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);
                const fpsMatch = line.match(/FRAME-RATE=([\d.]+)/);

                let nextLine = "";
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim() && !lines[j].trim().startsWith('#')) {
                        nextLine = lines[j].trim();
                        break;
                    }
                }

                if (nextLine) {
                    const qualityUrl = nextLine.startsWith('http') ? nextLine : baseUrl + nextLine;
                    let resolutionName = "Source";
                    let fps = 30;

                    if (resolutionMatch) {
                        const height = resolutionMatch[1].split('x')[1];
                        resolutionName = `${height}p`;
                    }
                    if (fpsMatch) {
                        fps = Math.round(parseFloat(fpsMatch[1]));
                    } else {
                        if (line.includes('p60') || nextLine.includes('p60')) {
                            fps = 60;
                        }
                    }

                    resolutions.push({
                        quality: resolutionName,
                        fps,
                        url: qualityUrl,
                        size: 'Auto'
                    });
                }
            }
        }
    }
  }

  if (resolutions.length === 0) {
      resolutions.push({
          quality: 'Source',
          fps: 60,
          url: videoUrl,
          size: 'Auto'
      });
  } else {
      resolutions.sort((a, b) => {
          const aHeight = parseInt(a.quality) || 9999;
          const bHeight = parseInt(b.quality) || 9999;
          return bHeight - aHeight;
      });
  }

  return {
    id: responseData.id || slug,
    title: responseData.title || "Kick Clip",
    broadcaster: responseData.channel?.slug || "Streamer",
    broadcasterImg: responseData.channel?.profile_picture || "",
    thumbnail: responseData.thumbnail_url || "",
    duration: responseData.duration || 0,
    date: new Date(responseData.created_at || Date.now()).toLocaleDateString(),
    views: responseData.views || 0,
    resolutions,
  };
};

interface HLSSegment {
    url: string;
    byteRange?: {
        length: number;
        offset: number;
    };
}

const fetchHLSBlob = async (url: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<Blob> => {
    let playlistText = "";
    
    for (const makeUrl of usableProxies(DOWNLOAD_PROXIES)) {
        if (signal?.aborted) throw new Error("AbortError");
        try {
            const res = await fetch(makeUrl(url), { signal });
            if (!res.ok) continue;
            playlistText = await res.text();
            break;
        } catch(e: any) {
            if (e.message === "AbortError" || e.name === "AbortError") throw e;
        }
    }
    
    if (!playlistText) throw new Error("Failed to fetch m3u8 playlist");
    
    const lines = playlistText.split('\n');
    const segments: HLSSegment[] = [];
    const nextOffsets: { [uri: string]: number } = {};
    let currentByteRange: { length: number; offset?: number } | undefined = undefined;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        if (line.startsWith('#EXT-X-BYTERANGE:')) {
            const rangeStr = line.substring('#EXT-X-BYTERANGE:'.length).trim();
            const parts = rangeStr.split('@');
            const length = parseInt(parts[0], 10);
            if (parts.length > 1) {
                currentByteRange = { length, offset: parseInt(parts[1], 10) };
            } else {
                currentByteRange = { length };
            }
        } else if (!line.startsWith('#')) {
            // HLS playlists may use root-relative (`/seg.ts`), path-relative
            // or absolute segment URIs. String concatenation broke the first
            // two whenever the playlist lived below the origin root.
            let segmentUrl: string;
            try {
                segmentUrl = new URL(line, url).toString();
            } catch {
                continue;
            }
            let finalByteRange: { length: number; offset: number } | undefined = undefined;
            if (currentByteRange) {
                let offset = currentByteRange.offset;
                if (offset === undefined) {
                    offset = nextOffsets[segmentUrl] || 0;
                }
                finalByteRange = { length: currentByteRange.length, offset };
                nextOffsets[segmentUrl] = offset + currentByteRange.length;
            }
            
            segments.push({
                url: segmentUrl,
                byteRange: finalByteRange
            });
            currentByteRange = undefined;
        }
    }
    
    if (segments.length === 0) throw new Error("No video segments found in playlist");
    
    const buffers: ArrayBuffer[] = new Array(segments.length);
    let loadedBytes = 0;
    let completedSegments = 0;
    
    const CONCURRENCY = 5;
    let currentIndex = 0;
    
    const downloadSegment = async (index: number) => {
        const segment = segments[index];
        const segUrl = segment.url;
        const byteRange = segment.byteRange;
        
        const headers: HeadersInit = {};
        if (byteRange) {
            headers['Range'] = `bytes=${byteRange.offset}-${byteRange.offset + byteRange.length - 1}`;
        }
        
        for (const makeUrl of usableProxies(DOWNLOAD_PROXIES)) {
            if (signal?.aborted) throw new Error("AbortError");
            try {
                const res = await fetch(makeUrl(segUrl), { 
                    signal,
                    headers
                });
                if (!res.ok) continue;
                
                let buffer = await res.arrayBuffer();
                
                if (byteRange && buffer.byteLength > byteRange.length) {
                    buffer = buffer.slice(byteRange.offset, byteRange.offset + byteRange.length);
                }
                
                buffers[index] = buffer;
                loadedBytes += buffer.byteLength;
                completedSegments++;
                
                const avgSize = loadedBytes / completedSegments;
                const estimatedTotal = avgSize * segments.length;
                onProgress(loadedBytes, estimatedTotal);
                return;
            } catch (e: any) {
                if (e.message === "AbortError" || e.name === "AbortError") throw e;
            }
        }
        throw new Error("Failed to download segment " + index);
    };
    
    const workers = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push((async () => {
            while (currentIndex < segments.length) {
                if (signal?.aborted) throw new Error("AbortError");
                const idx = currentIndex++;
                await downloadSegment(idx);
            }
        })());
    }
    
    await Promise.all(workers);
    return new Blob(buffers, { type: 'video/mp2t' });
};

export const fetchMovieBlob = async (url: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<Blob> => {
  if (url.includes('.m3u8')) {
    return fetchHLSBlob(url, onProgress, signal);
  }

  for (const makeUrl of usableProxies(DOWNLOAD_PROXIES)) {
    if (signal?.aborted) throw new Error("AbortError");

    try {
      let finalTotal = 0;
      
      // Try to get Content-Length first via HEAD request if possible
      try {
        const headRes = await fetch(makeUrl(url), { method: 'HEAD', signal });
        const cl = headRes.headers.get('content-length');
        if (cl) finalTotal = parseInt(cl, 10);
      } catch (e) {
        // Ignore HEAD errors, we will try to get it from GET
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', makeUrl(url), true);
        xhr.responseType = 'blob';
        xhr.timeout = 120000; 
        
        const onAbort = () => {
          xhr.abort();
          reject(new Error("AbortError"));
        };
        
        if (signal) signal.addEventListener('abort', onAbort);

        xhr.onprogress = (e) => { 
          let total = e.lengthComputable ? e.total : finalTotal;
          if (total === 0) {
            const contentLength = xhr.getResponseHeader('Content-Length');
            if (contentLength) {
              total = parseInt(contentLength, 10);
              finalTotal = total; // Save it for future progress events
            }
          }
          onProgress(e.loaded, total); 
        };
        
        xhr.onload = () => { 
          if (signal) signal.removeEventListener('abort', onAbort);
          if (xhr.status === 200 && xhr.response && xhr.response.size > 5000) {
            // Noted on success only: the UI reports who actually handled the
            // video, not who was tried and failed.
            noteRoute(makeUrl(url));
            resolve(xhr.response); 
          } else {
            reject(new Error(`Status ${xhr.status} or small file`));
          }
        };
        
        xhr.onerror = () => {
          if (signal) signal.removeEventListener('abort', onAbort);
          reject(new Error("Network error"));
        }
        xhr.ontimeout = () => {
          if (signal) signal.removeEventListener('abort', onAbort);
          reject(new Error("Timeout"));
        }
        xhr.send();
      });
      return blob;
    } catch (e: any) {
      if (e.message === "AbortError") throw e;
      console.warn("Proxy failed, trying next...", e);
    }
  }
  throw new Error("Could not download clip after trying all proxies.");
};

export const downloadBlob = async (url: string, filename: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<void> => {
  const blob = await fetchMovieBlob(url, onProgress, signal);
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoked on a timer, not in the same tick as the click: Safari cancels an
  // in-flight download when the object URL disappears underneath it, and a clip
  // pack here is large enough for that to be the normal case, not the edge one.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};
