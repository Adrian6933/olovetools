// SocialBolt: resolución de enlaces + relay de medios. Sustituye a los proxies
// CORS públicos de terceros que usaba la herramienta (corsproxy.io, codetabs),
// a los que había que entregarles la URL del usuario. Ver server/socialResolve.mjs.
import type { APIRoute } from 'astro';
import { handleSocial } from '../../../server/socialResolve.mjs';
import { errorResponse } from '../../../server/core.mjs';

export const prerender = false;

function toResponse({ status, headers, body, isBinary }: { status: number; headers: Record<string, string>; body: any; isBinary?: boolean }) {
  if (body === null || body === undefined) return new Response(null, { status, headers });
  return new Response(isBinary ? body : body, { status, headers });
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  try {
    return toResponse(await handleSocial(url, request.headers.get('range'), request.method));
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
