// CORS relay for Twitch VOD/clip CDNs and the Kick clip CDN. Used by ClipFlow,
// TwitchBolt and KickBolt. Runs as a real serverless function on Vercel (this
// route is excluded from prerendering below); the equivalent Node-http and
// Cloudflare Worker versions share the same logic in server/core.mjs.
import type { APIRoute } from 'astro';
import { handleProxy, errorResponse } from '../../server/core.mjs';

export const prerender = false;

function toResponse({ status, headers, body, isBinary }: { status: number; headers: Record<string, string>; body: any; isBinary?: boolean }) {
  if (body === null || body === undefined) return new Response(null, { status, headers });
  return new Response(isBinary ? body : body, { status, headers });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  try {
    return toResponse(await handleProxy(url, request.headers.get('range'), request.method));
  } catch (e: any) {
    return toResponse(errorResponse(e));
  }
};

export const HEAD = GET;

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
