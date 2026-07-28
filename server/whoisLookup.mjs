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
    let data = '';
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      fn(value);
    };
    socket.setTimeout(CONNECT_TIMEOUT_MS);
    socket.on('connect', () => socket.write(query + '\r\n'));
    socket.on('data', (chunk) => { data += chunk.toString('utf8'); });
    socket.on('end', () => finish(resolve, data));
    socket.on('close', () => finish(resolve, data));
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
