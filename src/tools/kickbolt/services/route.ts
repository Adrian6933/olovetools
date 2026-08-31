// ============================================================================
// Where the clip actually travels
// ----------------------------------------------------------------------------
// Kick's clip API sits behind Cloudflare and its CDN sends no CORS headers, so
// the browser cannot fetch either one straight. The code has always relayed the
// request — first through this site's own serverless function, then, if that
// fails, through a list of public third-party proxies — but nothing in the
// interface ever said so, and the privacy copy only promised that *our* servers
// keep no log, which is true and beside the point when five other hosts are in
// the path.
//
// This module makes the route observable so the UI can state it, and lets the
// visitor refuse the third-party hop. Same shape as clip-flow's route.ts: the
// two tools have the same problem, so they get the same answer.
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
  if (builtUrl.startsWith('/proxy') || builtUrl.startsWith('/api/kick')) {
    return { kind: 'own', host: 'olovetools.com' };
  }
  try {
    const host = new URL(builtUrl, 'https://placeholder.invalid').host;
    if (host.endsWith('kick.com') || host.endsWith('kick-cdn.com') || host.endsWith('cloudfront.net')) {
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
 *
 * The probe URL has to look like a real clip URL: with a made-up host the
 * pass-through entry (url => url) classifies as third-party and gets dropped,
 * which would remove the most private route of all.
 */
export function usableProxies(all: ((url: string) => string)[]): ((url: string) => string)[] {
  if (allowThirdParty) return all;
  const probeUrl = 'https://clips.kick.com/probe/clip.mp4';
  return all.filter(make => classifyRoute(make(probeUrl)).kind !== 'thirdParty');
}
