/**
 * ClipFlow CORS proxy — deploy this as a Cloudflare Worker.
 *
 * Why this exists: usher.ttvnw.net itself sends CORS headers and can be fetched
 * directly, but the actual video segment CDN (CloudFront/S3) does not, so
 * segment/media-playlist downloads need a proxy.
 *
 * Usage from the browser:
 *   https://<your-worker>.workers.dev/?url=<encodeURIComponent(targetUrl)>
 *
 * Deploy (no local setup needed):
 *   1. https://dash.cloudflare.com -> Workers & Pages -> Create -> Create Worker
 *   2. Give it any name (e.g. "clipflow-proxy") -> Deploy
 *   3. Click "Edit code", delete the placeholder, paste this whole file, click "Deploy"
 *   4. Copy the resulting URL (looks like https://clipflow-proxy.<you>.workers.dev)
 */

const ALLOWED_HOST_SUFFIXES = [
  'usher.ttvnw.net',
  '.hls.ttvnw.net',
  'ttvnw.net',
  'video-weaver.',
  'cloudfront.net',
];

function isAllowedHost(hostname) {
  return ALLOWED_HOST_SUFFIXES.some((suffix) =>
    hostname === suffix || hostname.endsWith(suffix) || hostname.includes(suffix)
  );
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
  };
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('Missing "url" query parameter', { status: 400 });
    }

    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return new Response('Invalid target URL', { status: 400 });
    }

    if (!isAllowedHost(targetUrl.hostname)) {
      return new Response(`Host not allowed: ${targetUrl.hostname}`, { status: 403 });
    }

    const forwardHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    };
    const range = request.headers.get('Range');
    if (range) forwardHeaders['Range'] = range;

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: forwardHeaders,
      });
    } catch (e) {
      return new Response(`Upstream fetch failed: ${e.message}`, { status: 502 });
    }

    const headers = new Headers(upstreamResponse.headers);
    const cors = corsHeaders();
    for (const [key, value] of Object.entries(cors)) headers.set(key, value);
    headers.delete('content-security-policy');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers,
    });
  },
};
