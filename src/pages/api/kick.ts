// Kick API proxy: categories, livestreams (official API, server-side app
// token) and clips/clip (unofficial, Cloudflare-protected, best effort). Used
// by Klipy and KickBolt. Runs as a real serverless function on Vercel.
import type { APIRoute } from 'astro';
import { handleKick, errorResponse } from '../../../server/core.mjs';

export const prerender = false;

function toResponse({ status, headers, body }: { status: number; headers: Record<string, string>; body: any }) {
  return new Response(body, { status, headers });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  try {
    return toResponse(await handleKick(url));
  } catch (e: any) {
    return toResponse(errorResponse(e));
  }
};

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
