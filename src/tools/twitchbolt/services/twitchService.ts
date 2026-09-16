import { ClipData, Resolution } from "../types";
import { noteRoute, usableProxies } from "./route";

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

// /proxy (src/pages/proxy.ts, same origin — Vercel serverless function) adds
// CORS headers for Twitch's clip CDNs; public proxies below remain as fallback.
const DOWNLOAD_PROXIES = [
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
    const path = parsedUrl.pathname;
    let slug: string | null = null;
    if (parsedUrl.hostname.includes('clips.twitch.tv')) {
      slug = path.substring(1);
    } else if (path.includes('/clip/')) {
      const parts = path.split('/clip/');
      if (parts.length > 1) slug = parts[1].split('/')[0];
    } else if (path.length > 1 && !path.includes('/videos/')) {
        slug = path.substring(1);
    }
    if (slug) slug = slug.replace(/\/$/, '');
    return slug;
  } catch (e) { return null; }
};

const signUrl = (url: string, sig?: string, token?: string) => {
  if (!sig || !token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}sig=${sig}&token=${encodeURIComponent(token)}`;
};

export const fetchClipInfo = async (url: string): Promise<ClipData> => {
  const slug = getClipSlug(url);
  if (!slug) throw new Error("Invalid URL.");
  const query = `query GetClip($slug: ID!) { clip(slug: $slug) { id slug title createdAt viewCount durationSeconds thumbnailURL broadcaster { displayName profileImageURL(width: 50) } playbackAccessToken(params: { platform: "web", playerBackend: "mediaplayer", playerType: "site" }) { signature value } videoQualities { frameRate quality sourceURL } } }`;

  let responseData: any = null;
  for (const makeProxyUrl of usableProxies(GQL_PROXIES)) {
      for (const clientId of CLIENT_IDS) {
          try {
              const res = await fetch(makeProxyUrl(GQL_ENDPOINT), {
                  method: 'POST',
                  headers: { 'Client-ID': clientId, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query, variables: { slug } }),
              });
              if (res.ok) {
                  const json = await res.json();
                  const data = json.contents ? JSON.parse(json.contents) : json;
                  if (data.data?.clip) { responseData = data.data.clip; break; }
              }
          } catch (e) {}
      }
      if (responseData) break;
  }

  if (!responseData) throw new Error("Clip not found.");

  const sig = responseData.playbackAccessToken?.signature;
  const token = responseData.playbackAccessToken?.value;
  const resolutions: Resolution[] = (responseData.videoQualities || []).map((q: any) => ({
      quality: q.quality + 'p',
      fps: Math.round(q.frameRate),
      url: signUrl(q.sourceURL, sig, token),
      size: 'Auto',
  }));

  if (resolutions.length === 0) throw new Error("No video source.");
  resolutions.sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

  return {
    id: responseData.id,
    title: responseData.title,
    broadcaster: responseData.broadcaster?.displayName || "Streamer",
    broadcasterImg: responseData.broadcaster?.profileImageURL,
    thumbnail: responseData.thumbnailURL,
    duration: responseData.durationSeconds,
    date: new Date(responseData.createdAt).toLocaleDateString(),
    views: responseData.viewCount,
    resolutions,
  };
};

export const fetchMovieBlob = async (url: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<Blob> => {
  for (const makeUrl of usableProxies(DOWNLOAD_PROXIES)) {
    if (signal?.aborted) throw new Error("AbortError");

    try {
      // No HEAD pre-flight here: the GET response below already carries
      // Content-Length (our /proxy forwards it), and a separate HEAD request
      // used to make the serverless proxy fetch the entire clip a second
      // time just to read its headers — doubling both latency and bandwidth
      // per clip.
      let finalTotal = 0;

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
            // Noted on success only: the UI reports who actually handled
            // the video, not who was tried and failed.
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
      // Browsers surface an aborted XHR as either our sentinel message or a
      // DOMException named AbortError. Preserve cancellation instead of
      // needlessly trying every remaining proxy.
      if (e.message === "AbortError" || e.name === "AbortError") throw e;
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
  // here is large enough for that to be the normal case, not the edge one.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
};
