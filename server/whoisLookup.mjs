// WhoisBolt real WHOIS lookups — Node-only (raw TCP socket to port 43 via the
// `net` module), so like imageConvert.mjs/ttsGenerate.mjs this only runs on
// Vercel/self-hosted Node, never on Cloudflare Workers/edge.
//
// Why this exists: the tool is named "WhoisBolt" but only ever did DNS-over-
// HTTPS lookups (A/AAAA/MX/TXT/NS/CNAME/SOA) — genuinely useful, but not WHOIS
// (registrar, creation/expiry dates, domain status). WHOIS itself has no HTTP
// API; the only way to get it is the WHOIS protocol on TCP port 43, which a
// browser cannot open. This module does the real referral chain: ask IANA
// which registry server owns the TLD, ask that registry, then follow its
// "Registrar WHOIS Server" pointer (thin registries like .com/.net only hand
// out the full record at the registrar's own server).

import net from 'node:net';

const CONNECT_TIMEOUT_MS = 8000;

function queryRaw(server, query, port = 43) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: server, port });
    // Buffers, not strings: decoding chunk by chunk splits the multi-byte
    // characters of .cn/.jp records that fall on a packet boundary.
    const chunks = [];
    const text = () => Buffer.concat(chunks).toString('utf8');
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn(value);
    };
    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.on('connect', () => socket.write(query + '\r\n'));
    socket.on('data', (chunk) => { chunks.push(chunk); });
    socket.on('end', () => finish(resolve, text()));
    socket.on('close', () => finish(resolve, text()));
    socket.on('timeout', () => finish(reject, new Error(`WHOIS query to ${server} timed out`)));
    socket.on('error', (err) => finish(reject, err));
  });
}

// WHOIS text commonly indents field labels with leading spaces/tabs, so every
// pattern here tolerates leading whitespace instead of anchoring straight to `^`.
function extractReferralServer(text) {
  const match = /^[ \t]*(?:refer|whois):[ \t]*(\S+)/im.exec(text);
  return match ? match[1] : null;
}

function extractField(text, patterns) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match && match[1]) return match[1].trim();
  }
  return null;
}

function extractAll(text, pattern) {
  const values = [];
  const seen = new Set();
  let match;
  const re = new RegExp(pattern, 'gim');
  while ((match = re.exec(text))) {
    const value = match[1].trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      values.push(value);
    }
  }
  return values;
}

function parseWhoisText(raw) {
  return {
    domainName: extractField(raw, [/^[ \t]*Domain Name:[ \t]*(.+)$/im]),
    registrar: extractField(raw, [/^[ \t]*Registrar:[ \t]*(.+)$/im, /^[ \t]*Sponsoring Registrar:[ \t]*(.+)$/im]),
    creationDate: extractField(raw, [
      /^[ \t]*Creation Date:[ \t]*(.+)$/im,
      /^[ \t]*Created(?: On)?:[ \t]*(.+)$/im,
      /^[ \t]*Registered(?: On)?:[ \t]*(.+)$/im,
    ]),
    expiryDate: extractField(raw, [
      /^[ \t]*Registry Expiry Date:[ \t]*(.+)$/im,
      /^[ \t]*Registrar Registration Expiration Date:[ \t]*(.+)$/im,
      /^[ \t]*Expir(?:y|ation) Date:[ \t]*(.+)$/im,
      /^[ \t]*Expires(?: On)?:[ \t]*(.+)$/im,
    ]),
    updatedDate: extractField(raw, [/^[ \t]*Updated Date:[ \t]*(.+)$/im, /^[ \t]*Last Updated(?: On)?:[ \t]*(.+)$/im]),
    statuses: extractAll(raw, '^[ \\t]*Domain Status:[ \\t]*(.+)$'),
    nameServers: extractAll(raw, '^[ \\t]*Name Server:[ \\t]*(.+)$'),
  };
}

// ---------------------------------------------------------------------------
// Registration facts over port 43, for the extensions that publish no RDAP
// (.es, .de, .it, .jp, .ru, .cn, .io, .pt, .eu… — about half the ccTLDs).
// Returns the same shape as rdapLookup.mjs and nothing else: the raw text
// carries registrant names and e-mails (.cn, .co), and the panel promises to
// leave contact details out.
// ---------------------------------------------------------------------------

const ianaCache = new Map();

async function ianaFor(tld) {
  if (ianaCache.has(tld)) return ianaCache.get(tld);
  const text = await queryRaw('whois.iana.org', tld);
  const info = {
    // IANA left .uk with an empty "whois:" line although whois.nic.uk answers.
    server: extractReferralServer(text),
    // "remarks: Registration information: http://www.nic.es/" — the registry's
    // own web lookup, for the registries that refuse port-43 queries.
    registryUrl: /^[ \t]*remarks:[ \t]*Registration information:[ \t]*(https?:\/\/\S+)/im.exec(text)?.[1] || null,
  };
  ianaCache.set(tld, info);
  return info;
}

// JPRS answers in Japanese unless the query ends in /e; DENIC needs -T to
// return anything besides the status.
const QUERY_FORMAT = { jp: (d) => `${d}/e`, de: (d) => `-T dn,ace ${d}` };

/** Lines indented under a bare heading ("Nameservers", "Registrar:") in .it/.eu records. */
function blockLines(text, heading) {
  const match = new RegExp(`^${heading}:?[ \\t]*\\r?\\n((?:[ \\t]+\\S.*\\r?\\n?)+)`, 'im').exec(text);
  return match ? match[1].split(/\r?\n/).map((l) => l.trim()).filter(Boolean) : [];
}

function toIsoDate(value) {
  if (!value) return null;
  const v = value.trim();
  let m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(v); // 28/02/2027 (.pt)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = /^(\d{4})[/.-](\d{2})[/.-](\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?)?(Z|[+-]\d{2}:?\d{2})?)?/.exec(v);
  if (!m) return null;
  // With an explicit zone the instant is kept; otherwise only the calendar
  // date, which the panel shows in UTC — a bare "1999-12-10 00:00:00" is
  // read as local time and could slip a day.
  return m[4] && m[5] ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}${m[5].length === 5 ? m[5].slice(0, 3) + ':' + m[5].slice(3) : m[5]}` : `${m[1]}-${m[2]}-${m[3]}`;
}

export function parseRegistration(raw, domain, server) {
  const field = (labels) => extractField(raw, labels.map((l) => new RegExp(`^[ \\t]*(?:[a-z]\\.[ \\t]*)?${l}[ \\t]*(\\S.*)$`, 'im')));
  const host = (value) => value.split(/[\s|,]+/).map((t) => t.replace(/\.$/, '').toLowerCase()).find((t) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(t)) || '';

  const registrar = field(['Registrar:', 'Sponsoring Registrar:', 'Registrar Name:'])
    || blockLines(raw, 'Registrar').map((l) => /^(?:Organization|Name):[ \t]*(.+)$/i.exec(l)?.[1]).find(Boolean)
    || null;

  const state = field(['\\[State\\]']); // JPRS: "Connected (2027/03/31)"
  // "state:" is the domain status only in the .ru/.su records; elsewhere
  // (.mx, registrar records) "State:" is the registrant's province.
  const tld = domain.split('.').pop();
  const statusLabels = ['ru', 'su', 'xn--p1ai'].includes(tld) ? 'Domain Status|Status|state' : 'Domain Status|Status';
  const statuses = [
    ...extractAll(raw, `^[ \\t]*(?:${statusLabels}):[ \\t]*(\\S.*)$`),
    ...extractAll(raw, '^[ \\t]*(?:\\[State\\]|\\[Lock Status\\])[ \\t]+(\\S.*)$'),
  ].flatMap((s) => s.split(/,\s*/)).map((s) => s.replace(/\s*\(?https?:\/\/\S+\)?/, '').replace(/\s*\(.*\)$/, '').trim()).filter(Boolean);

  const nameservers = [
    ...extractAll(raw, '^[ \\t]*(?:[a-z]\\.[ \\t]*)?(?:Name Server|nserver|\\[Name Server\\]):?[ \\t]+(\\S.*)$'),
    ...blockLines(raw, 'Name ?servers'),
  ].map(host).filter(Boolean);

  const dnssec = field(['DNSSEC:']);
  return {
    domain: (field(['Domain Name:', 'Domain:', '\\[Domain Name\\]']) || domain).toLowerCase(),
    source: `whois://${server}`,
    checkedAt: new Date().toISOString(),
    registrar,
    created: toIsoDate(field(['Creation Date:', 'Created On:', 'Created:', 'Registration Time:', 'Registered on:', '\\[Registered Date\\]', 'Registered:'])),
    expires: toIsoDate(field(['Registry Expiry Date:', 'Registrar Registration Expiration Date:', 'Expiration Date:', 'Expiry Date:', 'Expire Date:', 'Expires On:', 'Expiration Time:', 'paid-till:', '\\[Expires on\\]'])
      || /\((\d{4}\/\d{2}\/\d{2})\)/.exec(state || '')?.[1]),
    updated: toIsoDate(field(['Updated Date:', 'Last Updated On:', 'Last Update:', 'Last Modified:', 'Changed:', '\\[Last Update\\]'])),
    statuses: [...new Set(statuses)],
    nameservers: [...new Set(nameservers)],
    dnssec: dnssec ? /^(yes|signed|signeddelegation)/i.test(dnssec) : null,
  };
}

export async function lookupRegistrationWhois(domain) {
  const tld = domain.split('.').pop();
  const iana = await ianaFor(tld);
  const servers = [iana.server, `whois.nic.${tld}`].filter((s, i, all) => s && all.indexOf(s) === i);
  for (const server of servers) {
    let text;
    try {
      text = await queryRaw(server, (QUERY_FORMAT[tld] || ((d) => d))(domain));
    } catch {
      continue; // .es only answers whitelisted IPs: the socket opens and stays silent
    }
    if (!text.trim()) continue;
    if (/^[ \t%#]*(no match|not found|no entries found|no data found|status:[ \t]*(?:free|available)|available for registration|object does not exist)/im.test(text)) {
      throw Object.assign(new Error('registration_not_found'), { code: 'registration_not_found' });
    }
    const parsed = parseRegistration(text, domain, server);
    if (parsed.registrar || parsed.created || parsed.expires || parsed.nameservers.length) return parsed;
  }
  throw Object.assign(new Error('registry_restricted'), { code: 'registry_restricted', registryUrl: iana.registryUrl });
}

export async function lookupWhois(domain) {
  const tld = domain.split('.').pop();
  if (!tld) {
    throw Object.assign(new Error('Could not determine the TLD for this domain'), { code: 'invalid_domain' });
  }

  const ianaText = await queryRaw('whois.iana.org', tld);
  const registryServer = extractReferralServer(ianaText);
  if (!registryServer) {
    throw Object.assign(
      new Error(`No WHOIS server is registered with IANA for .${tld}`),
      { code: 'tld_not_supported' }
    );
  }

  const registryText = await queryRaw(registryServer, domain);
  let finalText = registryText;
  let finalServer = registryServer;

  // Thin registries (most gTLDs) only expose full registrant/date data at the
  // sponsoring registrar's own WHOIS server — follow it once if present.
  const registrarServerMatch = /^[ \t]*Registrar WHOIS Server:[ \t]*(\S+)/im.exec(registryText);
  if (registrarServerMatch && registrarServerMatch[1] && registrarServerMatch[1] !== registryServer) {
    try {
      const registrarText = await queryRaw(registrarServerMatch[1], domain);
      if (registrarText && registrarText.trim().length > 0) {
        finalText = registrarText;
        finalServer = registrarServerMatch[1];
      }
    } catch {
      // Registrar server unreachable/rate-limited — the registry-level record we already have is still useful.
    }
  }

  return {
    domain,
    server: finalServer,
    raw: finalText.trim(),
    parsed: parseWhoisText(finalText),
  };
}
