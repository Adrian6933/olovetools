# ClipFlow proxy

`usher.ttvnw.net` (VOD master playlist) sends CORS headers and works with a direct
`fetch()` from the browser — no proxy needed there. But the actual video segment CDN
(CloudFront/S3, e.g. `*.cloudfront.net`) does not send CORS headers, so downloading
media playlists and segments needs a small server-side proxy to add them.

**Currently deployed as `clipflow-proxy.php`**, uploaded alongside the site on
Hostinger at `https://olovetools.com/clipflow-proxy.php`. Ordinary shared hosting
works fine for this — no special setup beyond uploading the file to `public_html`.

`clipflow-proxy.js` in this folder is a Cloudflare Worker equivalent, kept as a
reference/alternative in case the PHP option ever needs replacing (e.g. moving off
Hostinger). Deploy it via https://dash.cloudflare.com → Workers & Pages → Create
Worker → paste its contents → Deploy, then update `WORKER_PROXY_URL` in
[`twitchVodService.ts`](../src/tools/clip-flow/services/twitchVodService.ts) to the
resulting `*.workers.dev` URL (note: unlike the PHP version, a Cloudflare Workers
account needs a one-time `workers.dev` subdomain registered under
Workers & Pages → Settings before it gets a public URL).

## Security notes

Both proxy versions only forward requests to Twitch's own VOD/segment domains
(`usher.ttvnw.net`, `*.ttvnw.net`, `video-weaver.*`, `*.cloudfront.net`) — they reject
any other target, so neither can be turned into an open proxy for arbitrary sites.
