// ============================================================================
// Token → segments, with a reason when it fails.
// ----------------------------------------------------------------------------
// The old decoder was `atob(...)` inside a try/catch that threw away the
// error and printed one generic sentence. Everything a person actually needs
// to fix a broken token — which segment, whether it is the base64url or the
// JSON or the UTF-8 — was in the exception it discarded.
//
// It also crashed outright on a payload that is valid JSON but not an object
// (`'iss' in "hello"` throws), so `payload.value` is typed as `unknown` here
// and every reader has to check.
// ============================================================================

import type { Algorithm, DecodeIssue, DecodedToken, Segment } from '../types';

const BASE64URL = /^[A-Za-z0-9_-]*$/;

export const KNOWN_ALGS: Algorithm[] = [
  'HS256', 'HS384', 'HS512',
  'RS256', 'RS384', 'RS512',
  'PS256', 'PS384', 'PS512',
  'ES256', 'ES384', 'ES512',
  'EdDSA',
];

const EMPTY_SEGMENT: Segment = { raw: '', text: '', value: undefined };

export function base64UrlToBytes(segment: string): Uint8Array {
  let s = segment.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const binary = atob(s);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function utf8ToBase64Url(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

interface SegmentOutcome {
  segment: Segment;
  issues: DecodeIssue[];
}

function readSegment(raw: string, where: 'header' | 'payload'): SegmentOutcome {
  const issues: DecodeIssue[] = [];
  const segment: Segment = { raw, text: '', value: undefined };

  if (!BASE64URL.test(raw)) {
    // The most common cause by far: a token pasted from a URL where `+` and
    // `/` survived, or one that still carries `=` padding.
    const offenders = Array.from(new Set(raw.replace(/[A-Za-z0-9_-]/g, '').split(''))).join(' ');
    issues.push({ level: 'error', code: 'not-base64url', where, detail: offenders });
    return { segment, issues };
  }

  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(raw);
  } catch {
    issues.push({ level: 'error', code: 'not-base64url', where });
    return { segment, issues };
  }

  try {
    // `fatal: true` on purpose: the default replaces broken sequences with
    // U+FFFD, so a corrupted token used to render as text full of question
    // marks instead of reporting an error.
    segment.text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    issues.push({ level: 'error', code: 'bad-utf8', where });
    return { segment, issues };
  }

  try {
    segment.value = JSON.parse(segment.text);
  } catch (error) {
    issues.push({
      level: 'error',
      code: 'not-json',
      where,
      detail: error instanceof Error ? error.message : undefined,
    });
    return { segment, issues };
  }

  if (typeof segment.value !== 'object' || segment.value === null || Array.isArray(segment.value)) {
    // Legal JSON, illegal JWT. The old UI reached for `'iss' in payload` here
    // and threw a TypeError that blanked the page.
    issues.push({ level: 'error', code: 'not-object', where });
  }

  return { segment, issues };
}

export function decodeToken(raw: string): DecodedToken {
  const trimmed = raw.trim();
  const base: DecodedToken = {
    ok: false,
    header: EMPTY_SEGMENT,
    payload: EMPTY_SEGMENT,
    signature: '',
    signingInput: '',
    alg: null,
    issues: [],
  };

  if (!trimmed) return { ...base, issues: [{ level: 'error', code: 'empty', where: 'token' }] };

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return {
      ...base,
      issues: [{ level: 'error', code: 'segment-count', where: 'token', detail: String(parts.length) }],
    };
  }

  const [headerRaw, payloadRaw, signature] = parts;
  const head = readSegment(headerRaw, 'header');
  const body = readSegment(payloadRaw, 'payload');
  const issues = [...head.issues, ...body.issues];

  const headerObject =
    head.segment.value && typeof head.segment.value === 'object' && !Array.isArray(head.segment.value)
      ? (head.segment.value as Record<string, unknown>)
      : null;

  let alg: Algorithm | null = null;
  if (headerObject) {
    const rawAlg = headerObject.alg;
    if (typeof rawAlg !== 'string') {
      issues.push({ level: 'error', code: 'alg-missing', where: 'header' });
    } else if (rawAlg.toLowerCase() === 'none') {
      // An unsigned token is the oldest JWT attack there is, and the previous
      // version rendered it exactly like a signed one.
      alg = 'none';
      issues.push({ level: 'warning', code: 'alg-none', where: 'header' });
    } else if ((KNOWN_ALGS as string[]).includes(rawAlg)) {
      alg = rawAlg as Algorithm;
    } else {
      issues.push({ level: 'warning', code: 'alg-unknown', where: 'header', detail: rawAlg });
    }

    if (typeof headerObject.typ === 'string' && !/^jwt$/i.test(headerObject.typ) && !headerObject.typ.includes('+jwt')) {
      issues.push({ level: 'warning', code: 'typ-mismatch', where: 'header', detail: headerObject.typ });
    }
    if (Array.isArray(headerObject.crit) && headerObject.crit.length > 0) {
      issues.push({
        level: 'warning',
        code: 'crit-unsupported',
        where: 'header',
        detail: headerObject.crit.join(', '),
      });
    }
    if (typeof headerObject.cty === 'string' && /jwt/i.test(headerObject.cty)) {
      issues.push({ level: 'warning', code: 'nested-jwt', where: 'header', detail: headerObject.cty });
    }
  }

  if (!signature && alg !== 'none') {
    issues.push({ level: 'warning', code: 'empty-signature', where: 'signature' });
  }

  return {
    ok: !issues.some(i => i.level === 'error'),
    header: head.segment,
    payload: body.segment,
    signature,
    signingInput: `${headerRaw}.${payloadRaw}`,
    alg,
    issues,
  };
}

/** Safe accessor: the payload is only an object when the token is well formed. */
export function claimsOf(token: DecodedToken): Record<string, unknown> {
  const value = token.payload.value;
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

export function headerOf(token: DecodedToken): Record<string, unknown> {
  const value = token.header.value;
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}
