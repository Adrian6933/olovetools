// WhoisBolt real WHOIS lookups — Vercel Node serverless function. See
// server/whoisLookup.mjs for why this needs raw TCP sockets (impossible from
// a browser) rather than an HTTP API.
import type { APIRoute } from 'astro';
import { lookupWhois, lookupRegistrationWhois } from '../../../server/whoisLookup.mjs';
import { lookupRdap } from '../../../server/rdapLookup.mjs';

/** RDAP first; the extensions without it (or with it down) fall back to port 43. */
async function lookupRegistration(domain: string) {
  try {
    return await lookupRdap(domain);
  } catch (e: any) {
    if (e?.code !== 'tld_not_supported' && e?.code !== 'rdap_unavailable') throw e;
    return lookupRegistrationWhois(domain);
  }
}

export const prerender = false;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

const DOMAIN_PATTERN = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export const GET: APIRoute = async ({ url }) => {
  const domainParam = (url.searchParams.get('domain') || '').trim().toLowerCase();
  if (!domainParam || domainParam.length > 253 || !DOMAIN_PATTERN.test(domainParam)) {
    return json(400, { error: 'invalid_domain' });
  }

  try {
    const result = url.searchParams.get('mode') === 'rdap' ? await lookupRegistration(domainParam) : await lookupWhois(domainParam);
    return json(200, result);
  } catch (e: any) {
    const status = ['invalid_domain', 'tld_not_supported'].includes(e?.code) ? 400 : e?.code === 'registration_not_found' ? 404 : 502;
    return json(status, { error: e?.code || 'whois_failed', message: e?.message, registryUrl: e?.registryUrl || undefined });
  }
};

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS_HEADERS });
