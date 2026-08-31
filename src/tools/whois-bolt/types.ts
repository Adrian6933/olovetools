// ============================================================================
// WhoisBolt - DNS lookup model
// ----------------------------------------------------------------------------
// Despite the name this is a DNS tool, not a WHOIS one: it asks public
// DNS-over-HTTPS resolvers for records. That means it does leave the browser,
// and the UI says so plainly rather than claiming to be fully local.
// ============================================================================

export type RecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'TXT'
  | 'SOA'
  | 'CAA'
  | 'SRV'
  | 'PTR'
  | 'HTTPS';

export const TYPE_ORDER: RecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'SOA', 'CAA', 'SRV', 'HTTPS'];

/** Numeric codes as they appear in a DNS answer. */
export const TYPE_CODES: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  HTTPS: 65,
  CAA: 257,
};

export const CODE_TO_TYPE: Record<number, RecordType> = Object.entries(TYPE_CODES).reduce(
  (acc, [name, code]) => {
    acc[code] = name as RecordType;
    return acc;
  },
  {} as Record<number, RecordType>
);

export interface Answer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

/**
 * DNS response codes worth telling apart.
 *
 * The old version folded NXDOMAIN into "nothing found", so a typo in the domain
 * looked exactly like a domain with no MX record. They mean very different
 * things to whoever is debugging.
 */
export type Status = 'ok' | 'nxdomain' | 'servfail' | 'refused' | 'error' | 'empty';

export interface TypeResult {
  type: RecordType;
  status: Status;
  answers: Answer[];
  /** DNSSEC: the resolver says this answer was cryptographically validated. */
  authenticated: boolean;
}

export interface Resolver {
  id: string;
  label: string;
  /** Builds the query URL; all three speak the same JSON dialect. */
  url: (name: string, type: RecordType) => string;
  /** Who ends up seeing the query, stated for the person about to send it. */
  operator: string;
}

export const RESOLVERS: Resolver[] = [
  {
    id: 'google',
    label: 'Google',
    operator: 'Google LLC',
    url: (n, t) => `https://dns.google/resolve?name=${encodeURIComponent(n)}&type=${t}`,
  },
  {
    id: 'cloudflare',
    label: 'Cloudflare',
    operator: 'Cloudflare, Inc.',
    url: (n, t) => `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(n)}&type=${t}`,
  },
  {
    // Quad9 was the obvious third choice and had to be dropped: its JSON
    // endpoint sends no Access-Control-Allow-Origin, so a browser fetch to it
    // fails every time. Verified before shipping it.
    id: 'dnssb',
    label: 'DNS.SB',
    operator: 'xTom GmbH',
    url: (n, t) => `https://doh.sb/dns-query?name=${encodeURIComponent(n)}&type=${t}`,
  },
];

export type LookupResults = Partial<Record<RecordType, TypeResult>>;

/** One resolver's view of a single record type, for the comparison. */
export interface ResolverView {
  resolverId: string;
  status: Status;
  values: string[];
}
