// Issues a Twitch app access token for Clipy. Keeps the client_secret on the
// server — it used to be hardcoded in the browser bundle. Runs as a real
// serverless function on Vercel.
import type { APIRoute } from 'astro';
import { handleTwitchToken, errorResponse } from '../../../../server/core.mjs';

export const prerender = false;

function toResponse({ status, headers, body }: { status: number; headers: Record<string, string>; body: any }) {
  return new Response(body, { status, headers });
}

export const GET: APIRoute = async () => {
  try {
    return toResponse(await handleTwitchToken());
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
