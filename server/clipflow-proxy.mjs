// Local dev CORS proxy for ClipFlow, mirroring cloudflare-worker/clipflow-proxy.php.
// usher.ttvnw.net sends CORS headers and is fetched directly from the browser, but the
// video segment CDN (CloudFront/S3) does not, so segment/media-playlist downloads need
// this relay. Run with `npm run proxy`; used automatically in dev via twitchVodService.ts
// (import.meta.env.DEV). Production still uses clipflow-proxy.php on Hostinger.
import { createServer } from 'node:http';

const PORT = process.env.PORT || 8787;

const ALLOWED_HOST_SUFFIXES = [
  'usher.ttvnw.net',
  '.hls.ttvnw.net',
  'ttvnw.net',
  'video-weaver.',
  'cloudfront.net',
];

const isAllowedHost = (hostname) =>
  ALLOWED_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(suffix) || hostname.includes(suffix));

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Accept-Ranges',
};

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  const target = requestUrl.searchParams.get('url');
  if (!target) {
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Missing "url" query parameter');
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch {
    res.writeHead(400, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end('Invalid target URL');
    return;
  }

  if (!isAllowedHost(targetUrl.hostname)) {
    res.writeHead(403, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end(`Host not allowed: ${targetUrl.hostname}`);
    return;
  }

  const forwardHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  };
  const range = req.headers['range'];
  if (range) forwardHeaders['Range'] = range;

  try {
    const upstream = await fetch(targetUrl.toString(), { headers: forwardHeaders });
    const headers = { ...CORS_HEADERS };
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(key);
      if (value) headers[key] = value;
    }
    res.writeHead(upstream.status, headers);
    res.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (e) {
    res.writeHead(502, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
    res.end(`Upstream fetch failed: ${e.message}`);
  }
});

server.listen(PORT, () => {
  console.log(`ClipFlow local proxy listening on http://localhost:${PORT}`);
});
