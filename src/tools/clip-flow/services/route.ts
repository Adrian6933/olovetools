// ============================================================================
// Where the video actually travels
// ----------------------------------------------------------------------------
// Segment downloads cannot go straight to Twitch's CDN: CloudFront sends no CORS
// headers, so the browser refuses the response. The code has always relayed them
// — first through this site's own serverless function, then through a list of
// public third-party proxies — but nothing in the interface ever said so, and
// the privacy copy claimed the video came "directly from Twitch's own servers".
//
// This module makes the route observable so the UI can state it, and lets the
// visitor refuse the third-party hop.
// ============================================================================

export type RouteKind = 'own' | 'direct' | 'thirdParty';

export interface RouteUse {
  kind: RouteKind;
  /** Host that handled it, for the "who saw this" line. */
  host: string;
}

let lastUse: RouteUse | null = null;
let allowThirdParty = true;

/** Whether the public third-party proxies may be used as a fallback. */
export function setAllowThirdParty(value: boolean) {
  allowThirdParty = value;
}

export function getAllowThirdParty(): boolean {
  return allowThirdParty;
}

export function classifyRoute(builtUrl: string): RouteUse {
  if (builtUrl.startsWith('/proxy')) return { kind: 'own', host: 'olovetools.com' };
  try {
    const host = new URL(builtUrl, 'https://placeholder.invalid').host;
    if (host.endsWith('ttvnw.net') || host.endsWith('twitch.tv') || host.endsWith('cloudfront.net')) {
      return { kind: 'direct', host };
    }
    return { kind: 'thirdParty', host };
  } catch {
    return { kind: 'direct', host: '' };
  }
}

export function noteRoute(builtUrl: string) {
  lastUse = classifyRoute(builtUrl);
}

export function getLastRoute(): RouteUse | null {
  return lastUse;
}

export function resetRoute() {
  lastUse = null;
}

/**
 * Filters the proxy list according to the visitor's choice.
 *
 * The own-origin relay and a direct fetch are always allowed; only the public
 * proxies are optional, because those are the ones run by people neither we nor
 * the visitor have any relationship with.
 */
export function usableProxies(all: ((url: string) => string)[]): ((url: string) => string)[] {
  if (allowThirdParty) return all;
  // The probe has to look like a real segment URL: with a made-up host the
  // pass-through entry (url => url) classified as third-party and got dropped,
  // which would have removed the most private route of all.
  const probeUrl = 'https://d2nvs31859zcd8.cloudfront.net/probe/1.ts';
  return all.filter(make => classifyRoute(make(probeUrl)).kind !== 'thirdParty');
}
