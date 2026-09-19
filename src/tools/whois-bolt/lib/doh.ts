import {
  CODE_TO_TYPE,
  RESOLVERS,
  TYPE_CODES,
  type Answer,
  type LookupResults,
  type RecordType,
  type Resolver,
  type ResolverView,
  type Status,
  type TypeResult,
} from '../types';

// ============================================================================
// DNS over HTTPS
// ----------------------------------------------------------------------------
// Google, Cloudflare and Quad9 all answer the same JSON dialect, which is what
// makes comparing them possible — and comparing them is the whole point when
// you have just changed a record and want to know whether it has landed.
// ============================================================================

interface DohResponse {
  Status: number;
  /** Authenticated Data: the answer was validated with DNSSEC. */
  AD?: boolean;
  Answer?: Answer[];
  Authority?: Answer[];
}

/** RCODE -> something a person can act on. */
function statusFor(code: number, answerCount: number): Status {
  if (code === 3) return 'nxdomain';
  if (code === 2) return 'servfail';
  if (code === 5) return 'refused';
  if (code !== 0) return 'error';
  return answerCount > 0 ? 'ok' : 'empty';
}

export function resolverById(id: string): Resolver {
  return RESOLVERS.find(r => r.id === id) || RESOLVERS[0];
}

/** One record type from one resolver. */
export async function queryType(
  domain: string,
  type: RecordType,
  resolver: Resolver,
  signal?: AbortSignal
): Promise<TypeResult> {
  try {
    const res = await fetch(resolver.url(domain, type), {
      headers: { Accept: 'application/dns-json' },
      signal,
    });
    if (!res.ok) return { type, status: 'error', answers: [], authenticated: false };
    const json: DohResponse = await res.json();
    const wanted = TYPE_CODES[type];
    const answers = (json.Answer || []).filter(a => a.type === wanted);
    return {
      type,
      status: statusFor(json.Status, answers.length),
      answers,
      authenticated: json.AD === true,
    };
  } catch (err) {
    // An aborted request is a new search superseding this one, not a failure.
    if (signal?.aborted) return { type, status: 'error', answers: [], authenticated: false };
    return { type, status: 'error', answers: [], authenticated: false };
  }
}

/** Every requested type from one resolver, in parallel. */
export async function lookup(
  domain: string,
  types: RecordType[],
  resolver: Resolver,
  signal?: AbortSignal
): Promise<LookupResults> {
  const settled = await Promise.all(types.map(t => queryType(domain, t, resolver, signal)));
  const out: LookupResults = {};
  settled.forEach(r => {
    out[r.type] = r;
  });
  return out;
}

/**
 * The same record type asked of every resolver at once.
 *
 * After changing a record, "has it propagated?" is really "do the big resolvers
 * agree yet?", and that question needs more than one answer to be meaningful.
 */
export async function compareResolvers(
  domain: string,
  type: RecordType,
  signal?: AbortSignal
): Promise<ResolverView[]> {
  const settled = await Promise.all(
    RESOLVERS.map(async r => {
      const result = await queryType(domain, type, r, signal);
      return {
        resolverId: r.id,
        status: result.status,
        values: result.answers.map(a => a.data).sort(),
      };
    })
  );
  return settled;
}

/** True when every resolver that answered returned the same set of values. */
export function resolversAgree(views: ResolverView[]): boolean {
  const answered = views.filter(v => v.status === 'ok' || v.status === 'empty');
  if (answered.length < 2) return true;
  const first = answered[0].values.join('|');
  return answered.every(v => v.values.join('|') === first);
}

/**
 * Turns "https://user@www.example.com:8080/path?x=1" into "www.example.com".
 *
 * El `www.` ya no se quita: esto es una consulta DNS y `www.example.com` es
 * otro nombre, a menudo un CNAME hacia una CDN con registros distintos de los
 * del dominio desnudo. Quitarlo respondia sobre algo que no se habia preguntado.
 */
export function sanitizeDomain(input: string): string {
  let v = input.trim().toLowerCase();
  v = v.replace(/^[a-z]+:\/\//, '');
  v = v.split(/[/?#]/)[0];
  v = v.replace(/^[^@]*@/, '');
  v = v.replace(/:\d+$/, '');
  // A trailing dot is legal in DNS but confuses the display.
  return v.replace(/\.$/, '');
}

/** Rough check that this could be a hostname at all. */
export function looksLikeDomain(v: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(v);
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** Reverse-lookup name for an IPv4 address, or null when it is not one. */
export function reverseName(input: string): string | null {
  const m = input.trim().match(IPV4);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some(p => p > 255)) return null;
  return `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;
}

export { CODE_TO_TYPE };
