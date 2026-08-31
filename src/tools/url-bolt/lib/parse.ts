// ============================================================================
// The editable URL model
// ----------------------------------------------------------------------------
// `new URL()` hands back a flattened, read-only view: you can look at
// `searchParams`, but the moment you want to rename a key, reorder two
// parameters or drop a tracker and get the *original* string back minus that
// one piece, the platform object is the wrong shape — re-serializing through
// URLSearchParams rewrites every escape in the URL (`%20` becomes `+`, lowercase
// hex becomes uppercase) and silently changes bytes the user never touched.
//
// So we keep the intermediate representation instead: every part carries both
// its raw text and its decoded text, and serialization re-encodes *only* the
// pieces that were edited. That is what makes the editor non-destructive.
// ============================================================================

import { decode, decodeDeep, encode, type EncodeProfile } from './codec';
import { hasMixedScriptLabel, isIdn, scriptsIn, toUnicodeHost } from './punycode';
import { classify, type TrackerGroup } from './tracking';

export interface QueryParam {
  /** Stable identity for React keys and reordering; never serialized. */
  id: string;
  /** Decoded key, what the user sees and edits. */
  key: string;
  /** Decoded value. */
  value: string;
  /** Original encoded key/value, kept byte-exact for untouched parameters. */
  rawKey: string;
  rawValue: string;
  /** `?flag` with no `=` at all round-trips as `?flag`, not `?flag=`. */
  hasValue: boolean;
  /** Set once the row is edited: from then on it is re-encoded on serialize. */
  dirty: boolean;
}

export interface ParsedUrl {
  valid: boolean;
  /** Why the parse failed, when it did. */
  error?: 'empty' | 'invalid';
  /** Scheme without the colon. */
  scheme: string;
  /** True when we prefixed a scheme the user did not type. */
  assumedScheme: boolean;
  /** Schemes with no authority component: mailto, data, magnet, tel… */
  opaque: boolean;
  username: string;
  password: string;
  /** ASCII/punycode host, exactly as the platform normalized it. */
  host: string;
  /** Same host, readable. */
  unicodeHost: string;
  port: string;
  /** Raw pathname, still encoded. */
  path: string;
  /** Decoded path segments. */
  segments: string[];
  params: QueryParam[];
  /** Raw fragment, without the `#`. */
  fragment: string;
  origin: string;
  /** For opaque URLs: everything between the scheme and the `?`. */
  body: string;
}

export const EMPTY_URL: ParsedUrl = {
  valid: false,
  error: 'empty',
  scheme: '',
  assumedScheme: false,
  opaque: false,
  username: '',
  password: '',
  host: '',
  unicodeHost: '',
  port: '',
  path: '',
  segments: [],
  params: [],
  fragment: '',
  origin: '',
  body: '',
};

/** Schemes that carry no `//authority` and therefore need their own handling. */
const OPAQUE_SCHEMES = new Set(['mailto', 'data', 'magnet', 'tel', 'sms', 'javascript', 'urn', 'bitcoin', 'geo']);

let idCounter = 0;
const nextId = () => `p${++idCounter}`;

/**
 * Splits a raw query string by hand rather than through URLSearchParams, which
 * would throw away the distinction between `%20` and `+` and normalize hex case
 * — the very details a URL inspector exists to show.
 */
function parseQuery(search: string, plusAsSpace: boolean): QueryParam[] {
  const body = search.startsWith('?') ? search.slice(1) : search;
  if (!body) return [];

  return body.split('&').map(pair => {
    const eq = pair.indexOf('=');
    const rawKey = eq === -1 ? pair : pair.slice(0, eq);
    const rawValue = eq === -1 ? '' : pair.slice(eq + 1);
    return {
      id: nextId(),
      key: decode(rawKey, { plusAsSpace }).value,
      value: decode(rawValue, { plusAsSpace }).value,
      rawKey,
      rawValue,
      hasValue: eq !== -1,
      dirty: false,
    };
  });
}

export interface ParseOptions {
  /** Treat `+` in the query as a space. True matches how servers read forms. */
  plusAsSpace?: boolean;
  /** Prefix `https://` when the input has no scheme at all. */
  assumeScheme?: boolean;
}

/**
 * Turns a URL string into the editable model.
 *
 * Never throws: an unparseable string comes back as `{ valid: false }` so the
 * caller can render an error instead of an empty panel.
 */
export function parseUrl(input: string, options: ParseOptions = {}): ParsedUrl {
  const { plusAsSpace = true, assumeScheme = true } = options;
  const trimmed = input.trim();
  if (!trimmed) return EMPTY_URL;

  // A scheme is `ALPHA *( ALPHA / DIGIT / "+" / "-" / "." ) ":"` per RFC 3986.
  // Matching that (rather than just `https?://`) is what lets ftp:, mailto: and
  // custom app schemes through instead of mangling them into `https://ftp//…`.
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  const assumedScheme = !schemeMatch && assumeScheme;
  const candidate = assumedScheme ? `https://${trimmed}` : trimmed;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ...EMPTY_URL, error: 'invalid' };
  }

  const scheme = url.protocol.replace(/:$/, '');
  const opaque = OPAQUE_SCHEMES.has(scheme) || !candidate.slice(scheme.length + 1).startsWith('//');
  const params = parseQuery(url.search, plusAsSpace);

  if (opaque) {
    // For these, `pathname` holds the whole payload (the address, the data
    // blob, the magnet hash). There is no host to speak of.
    return {
      valid: true,
      scheme,
      assumedScheme: false,
      opaque: true,
      username: '',
      password: '',
      host: '',
      unicodeHost: '',
      port: '',
      path: url.pathname,
      segments: [],
      params,
      fragment: url.hash.replace(/^#/, ''),
      origin: '',
      body: decode(url.pathname).value,
    };
  }

  const unicodeHost = toUnicodeHost(url.hostname);

  return {
    valid: true,
    scheme,
    assumedScheme,
    opaque: false,
    username: url.username,
    password: url.password,
    host: url.hostname,
    unicodeHost,
    port: url.port,
    path: url.pathname,
    segments: url.pathname
      .split('/')
      .filter(Boolean)
      .map(segment => decode(segment).value),
    params,
    fragment: url.hash.replace(/^#/, ''),
    origin: url.origin === 'null' ? '' : url.origin,
    body: '',
  };
}

export interface SerializeOptions {
  /** Profile used for parameters the user edited. */
  profile?: EncodeProfile;
  /** Encode spaces in edited parameters as `+`. */
  plusForSpace?: boolean;
  /** Print the host in Unicode instead of punycode (display only, not for use). */
  unicodeHost?: boolean;
}

/**
 * Rebuilds a URL string from the model.
 *
 * Untouched parameters are written back from their raw text, so a URL that goes
 * in and comes out without edits is byte-identical apart from the parts the
 * user deliberately changed.
 */
export function serialize(model: ParsedUrl, options: SerializeOptions = {}): string {
  const { profile = 'component', plusForSpace = false, unicodeHost = false } = options;
  if (!model.valid) return '';

  const encodePart = (text: string) => encode(text, { profile, plusForSpace }).value;

  const query = model.params
    .map(param => {
      if (!param.dirty) return param.hasValue ? `${param.rawKey}=${param.rawValue}` : param.rawKey;
      const key = encodePart(param.key);
      return param.hasValue ? `${key}=${encodePart(param.value)}` : key;
    })
    .join('&');

  const suffix = (query ? `?${query}` : '') + (model.fragment ? `#${model.fragment}` : '');

  if (model.opaque) return `${model.scheme}:${model.path}${suffix}`;

  const credentials = model.username
    ? `${model.username}${model.password ? `:${model.password}` : ''}@`
    : '';
  const host = unicodeHost ? model.unicodeHost : model.host;
  const port = model.port ? `:${model.port}` : '';

  return `${model.scheme}://${credentials}${host}${port}${model.path}${suffix}`;
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

export type FindingLevel = 'danger' | 'warn' | 'info';

export interface Finding {
  /** Dictionary key for the message, so the copy stays translatable. */
  key: string;
  level: FindingLevel;
  /** Interpolated into the message, e.g. the decoded hostname. */
  detail?: string;
}

export interface TrackerHit {
  param: QueryParam;
  group: TrackerGroup;
  aggressive: boolean;
}

/** Every query parameter the tracker catalogue recognises. */
export function findTrackers(model: ParsedUrl): TrackerHit[] {
  const hits: TrackerHit[] = [];
  for (const param of model.params) {
    const match = classify(param.key);
    if (match) hits.push({ param, group: match.group, aggressive: match.aggressive });
  }
  return hits;
}

/**
 * Removes tracking parameters and reports what it cost the URL, in bytes.
 * `aggressive` also drops the ambiguous keys (`ref`, `s`, `source`).
 */
export function stripTrackers(
  model: ParsedUrl,
  aggressive: boolean
): { model: ParsedUrl; removed: TrackerHit[] } {
  const hits = findTrackers(model).filter(hit => aggressive || !hit.aggressive);
  const removedIds = new Set(hits.map(hit => hit.param.id));
  return {
    model: { ...model, params: model.params.filter(param => !removedIds.has(param.id)) },
    removed: hits,
  };
}

/**
 * Everything worth telling the user about a URL, in one pass.
 *
 * This is the part a plain `new URL()` dump cannot give you: credentials nobody
 * noticed, a hostname that is not the brand it looks like, a parameter that is
 * itself a whole encoded URL.
 */
export function analyze(model: ParsedUrl): Finding[] {
  const findings: Finding[] = [];
  if (!model.valid) return findings;

  if (model.username || model.password) {
    findings.push({ key: 'riskCredentials', level: 'danger', detail: model.username });
  }

  if (model.scheme === 'javascript') {
    findings.push({ key: 'riskJavascript', level: 'danger' });
  }

  if (!model.opaque && isIdn(model.host)) {
    findings.push({ key: 'riskIdn', level: 'info', detail: model.unicodeHost });
    if (hasMixedScriptLabel(model.unicodeHost)) {
      findings.push({
        key: 'riskHomograph',
        level: 'danger',
        detail: scriptsIn(model.unicodeHost).join(' + '),
      });
    }
  }

  if (model.scheme === 'http') {
    findings.push({ key: 'riskInsecure', level: 'warn' });
  }

  // A raw IPv4 host where a domain is expected is a common phishing shape.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(model.host)) {
    findings.push({ key: 'riskIpHost', level: 'warn', detail: model.host });
  }

  const trackers = findTrackers(model).filter(hit => !hit.aggressive);
  if (trackers.length) {
    findings.push({ key: 'riskTrackers', level: 'warn', detail: String(trackers.length) });
  }

  // A parameter whose value is another URL is the redirect chain everyone has
  // to unwrap by hand; flag it so the user knows to expand it.
  const nested = model.params.filter(param => /^https?:\/\//i.test(param.value));
  if (nested.length) {
    findings.push({ key: 'riskNested', level: 'info', detail: nested[0].key });
  }

  const doubled = model.params.filter(param => {
    if (!param.rawValue.includes('%25')) return false;
    return decodeDeep(param.rawValue).rounds > 1;
  });
  if (doubled.length) {
    findings.push({ key: 'riskDoubleEncoded', level: 'warn', detail: doubled[0].key });
  }

  const seen = new Set<string>();
  const repeated = model.params.filter(param => {
    if (seen.has(param.key)) return true;
    seen.add(param.key);
    return false;
  });
  if (repeated.length) {
    findings.push({ key: 'riskRepeated', level: 'info', detail: repeated[0].key });
  }

  return findings;
}

/** Byte length of a URL string, for the size metrics the UI shows. */
export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}
