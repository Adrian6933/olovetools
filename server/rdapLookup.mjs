// Authoritative domain-registration lookup, bootstrapped through IANA (RFC 9224).
// Only registration facts are returned; registrant contact details are omitted.
let bootstrap = null;
let expiresAt = 0;
async function registryFor(domain) {
  if (!bootstrap || Date.now() > expiresAt) {
    const res = await fetch('https://data.iana.org/rdap/dns.json', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('bootstrap_unavailable');
    const data = await res.json();
    if (!Array.isArray(data.services)) throw new Error('bootstrap_unavailable');
    bootstrap = data.services;
    expiresAt = Date.now() + 86400_000;
  }
  const matches = bootstrap.flatMap(([names, urls]) => names.filter(name => domain === name || domain.endsWith('.' + name)).map(name => ({ name, urls })));
  matches.sort((a, b) => b.name.length - a.name.length);
  const base = matches[0]?.urls.find(url => url.startsWith('https://'));
  if (!base) throw Object.assign(new Error('rdap_not_supported'), { code: 'tld_not_supported' });
  return new URL(base);
}

export function parseRdap(data, source) {
  const event = action => data.events?.find(e => e.eventAction === action)?.eventDate || null;
  const registrar = data.entities?.find(e => e.roles?.includes('registrar'));
  const name = registrar?.vcardArray?.[1]?.find(row => row[0] === 'fn')?.[3];
  return {
    domain: data.unicodeName || data.ldhName || '',
    source,
    checkedAt: new Date().toISOString(),
    registrar: typeof name === 'string' ? name : registrar?.handle || null,
    created: event('registration'),
    expires: event('expiration'),
    updated: event('last changed'),
    statuses: Array.isArray(data.status) ? data.status.filter(s => typeof s === 'string') : [],
    nameservers: (data.nameservers || []).map(n => n.unicodeName || n.ldhName).filter(Boolean),
    dnssec: typeof data.secureDNS?.delegationSigned === 'boolean' ? data.secureDNS.delegationSigned : null,
  };
}

export async function lookupRdap(domain) {
  const base = await registryFor(domain);
  const endpoint = new URL(`domain/${encodeURIComponent(domain)}`, base.href.endsWith('/') ? base : base.href + '/');
  const res = await fetch(endpoint, { headers: { Accept: 'application/rdap+json, application/json' }, signal: AbortSignal.timeout(12000) });
  if (res.status === 404) throw Object.assign(new Error('registration_not_found'), { code: 'registration_not_found' });
  if (!res.ok) throw Object.assign(new Error('rdap_unavailable'), { code: 'rdap_unavailable' });
  const data = await res.json();
  if (data.objectClassName !== 'domain') throw new Error('invalid_rdap_response');
  return parseRdap(data, endpoint.href);
}
