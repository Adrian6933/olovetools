// ============================================================================
// Claim validation.
// ----------------------------------------------------------------------------
// Decoding tells you what a token says. This tells you whether a verifier
// would accept it: the time window with a configurable skew, and the issuer /
// audience / subject the consumer expects. The old version only rendered exp
// and nbf as a countdown and left every other check to the reader.
// ============================================================================

import type { ClaimCheck, ClaimExpectations, ClaimReport } from '../types';

const SECOND = 1000;

function numeric(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** `aud` is either a string or an array of them, per RFC 7519 §4.1.3. */
function audienceList(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

export function validateClaims(
  claims: Record<string, unknown>,
  expect: ClaimExpectations,
  now: number
): ClaimReport {
  const checks: ClaimCheck[] = [];
  const leeway = Math.max(0, expect.leeway) * SECOND;

  // ---- exp ---------------------------------------------------------------
  let expiresIn: number | null = null;
  if ('exp' in claims) {
    const exp = numeric(claims.exp);
    if (exp === null) {
      checks.push({ code: 'exp-type', status: 'fail', detail: String(claims.exp) });
    } else {
      expiresIn = exp * SECOND - now;
      checks.push({
        code: 'exp',
        status: expiresIn + leeway > 0 ? 'pass' : 'fail',
        detail: String(exp),
      });
    }
  } else {
    checks.push({ code: expect.requireExp ? 'exp-required' : 'exp', status: expect.requireExp ? 'fail' : 'skip' });
  }

  // ---- nbf ---------------------------------------------------------------
  let activeIn: number | null = null;
  if ('nbf' in claims) {
    const nbf = numeric(claims.nbf);
    if (nbf === null) {
      checks.push({ code: 'nbf-type', status: 'fail', detail: String(claims.nbf) });
    } else {
      const delta = nbf * SECOND - now;
      if (delta > 0) activeIn = delta;
      checks.push({ code: 'nbf', status: delta - leeway <= 0 ? 'pass' : 'fail', detail: String(nbf) });
    }
  } else {
    checks.push({ code: 'nbf', status: 'skip' });
  }

  // ---- iat ---------------------------------------------------------------
  if ('iat' in claims) {
    const iat = numeric(claims.iat);
    if (iat === null) {
      checks.push({ code: 'iat-type', status: 'fail', detail: String(claims.iat) });
    } else {
      const issuedAhead = iat * SECOND - now;
      // A token issued in the future is either clock skew or a forgery.
      checks.push({ code: 'iat', status: issuedAhead - leeway <= 0 ? 'pass' : 'fail', detail: String(iat) });
      if (expect.maxAge > 0) {
        const age = (now - iat * SECOND) / SECOND;
        checks.push({
          code: 'max-age',
          status: age <= expect.maxAge + expect.leeway ? 'pass' : 'fail',
          detail: `${Math.round(age)}s`,
        });
      }
    }
  } else {
    checks.push({ code: 'iat', status: 'skip' });
    if (expect.maxAge > 0) checks.push({ code: 'max-age', status: 'fail', detail: 'iat' });
  }

  // ---- iss / sub ---------------------------------------------------------
  const stringMatch = (code: 'iss' | 'sub', expected: string) => {
    if (!expected) {
      checks.push({ code, status: 'skip' });
      return;
    }
    const actual = claims[code];
    checks.push({
      code,
      status: actual === expected ? 'pass' : 'fail',
      detail: typeof actual === 'string' ? actual : actual === undefined ? '—' : JSON.stringify(actual),
    });
  };
  stringMatch('iss', expect.issuer.trim());
  stringMatch('sub', expect.subject.trim());

  // ---- aud ---------------------------------------------------------------
  const wantedAudience = expect.audience.trim();
  if (!wantedAudience) {
    checks.push({ code: 'aud', status: 'skip' });
  } else {
    const list = audienceList(claims.aud);
    checks.push({
      code: 'aud',
      status: list.includes(wantedAudience) ? 'pass' : 'fail',
      detail: list.length > 0 ? list.join(', ') : '—',
    });
  }

  // ---- typ ---------------------------------------------------------------
  checks.push({ code: 'typ', status: expect.requireTyp ? 'skip' : 'skip' });

  return {
    checks: checks.filter(c => c.code !== 'typ' || expect.requireTyp),
    failures: checks.filter(c => c.status === 'fail').length,
    expiresIn,
    activeIn,
  };
}

/** "3d 4h 12m" / "45s". Sign is the caller's business. */
export function formatDuration(ms: number): string {
  const total = Math.floor(Math.abs(ms) / SECOND);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Where "now" sits between iat/nbf and exp, as 0..1, for the timeline bar.
 * Returns null when the token has no window to draw.
 */
export function lifetimeProgress(claims: Record<string, unknown>, now: number): number | null {
  const exp = numeric(claims.exp);
  if (exp === null) return null;
  const start = numeric(claims.nbf) ?? numeric(claims.iat);
  if (start === null) return null;
  const from = start * SECOND;
  const to = exp * SECOND;
  if (to <= from) return null;
  return Math.min(1, Math.max(0, (now - from) / (to - from)));
}
