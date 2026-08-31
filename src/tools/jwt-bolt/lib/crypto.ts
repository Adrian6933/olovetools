// ============================================================================
// Signatures, with the browser's own crypto.
// ----------------------------------------------------------------------------
// `crypto.subtle` is a complete implementation of every algorithm a JWT can
// use — HMAC, RSASSA-PKCS1-v1_5, RSA-PSS and ECDSA — and it ships in every
// browser at zero cost. The tool ignored it entirely and told users in its own
// FAQ that verifying locally was impossible. It is not.
//
// Nothing here touches the network. A secret typed into this page is used by
// `crypto.subtle.verify` in the same tab and then dropped.
// ============================================================================

import type { AlgSpec, Algorithm, KeyInput, VerifyResult } from '../types';
import { base64UrlToBytes, bytesToBase64Url } from './decode';

const subtle = (): SubtleCrypto | null =>
  typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle ? globalThis.crypto.subtle : null;

const SHA: Record<string, string> = { '256': 'SHA-256', '384': 'SHA-384', '512': 'SHA-512' };
/** ES512 is P-521, not P-512. Getting this wrong is the classic ECDSA bug. */
const CURVES: Record<string, string> = { ES256: 'P-256', ES384: 'P-384', ES512: 'P-521' };
const ECDSA_BYTES: Record<string, number> = { ES256: 64, ES384: 96, ES512: 132 };

export function specFor(alg: Algorithm): AlgSpec | null {
  const bits = alg.slice(2);
  const hash = SHA[bits];

  if (alg.startsWith('HS') && hash) {
    return {
      family: 'HMAC',
      importParams: { name: 'HMAC', hash: { name: hash } },
      signParams: { name: 'HMAC' },
      secretBased: true,
    };
  }
  if (alg.startsWith('RS') && hash) {
    return {
      family: 'RSA',
      importParams: { name: 'RSASSA-PKCS1-v1_5', hash: { name: hash } },
      signParams: { name: 'RSASSA-PKCS1-v1_5' },
      secretBased: false,
    };
  }
  if (alg.startsWith('PS') && hash) {
    return {
      family: 'RSA-PSS',
      importParams: { name: 'RSA-PSS', hash: { name: hash } },
      // PSS salt length equals the digest length, per RFC 7518 §3.5.
      signParams: { name: 'RSA-PSS', saltLength: Number(bits) / 8 },
      secretBased: false,
    };
  }
  if (alg.startsWith('ES') && CURVES[alg]) {
    return {
      family: 'ECDSA',
      importParams: { name: 'ECDSA', namedCurve: CURVES[alg] },
      signParams: { name: 'ECDSA', hash: { name: hash } },
      secretBased: false,
      signatureBytes: ECDSA_BYTES[alg],
    };
  }
  if (alg === 'EdDSA') {
    // Ed25519 landed in browsers recently; import simply rejects where it has not.
    return { family: 'EdDSA', importParams: { name: 'Ed25519' }, signParams: { name: 'Ed25519' }, secretBased: false };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Key material
// ---------------------------------------------------------------------------

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/[\s:]/g, '');
  if (clean.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(clean)) throw new Error('bad-hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function base64ToBytes(text: string): Uint8Array {
  const clean = text.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(clean.padEnd(Math.ceil(clean.length / 4) * 4, '='));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

const PEM_BODY = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/;

interface PemParts {
  label: string;
  bytes: Uint8Array;
}

export function readPem(text: string): PemParts | null {
  const match = PEM_BODY.exec(text.trim());
  if (!match) return null;
  return { label: match[1].trim(), bytes: base64ToBytes(match[2]) };
}

/** Picks the JWK that matches this token out of a key, a set, or a bare array. */
export function selectJwk(parsed: unknown, kid: string | undefined, alg: Algorithm): { jwk: any; kid?: string } | null {
  const list: any[] = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as any).keys)
      ? (parsed as any).keys
      : parsed && typeof parsed === 'object'
        ? [parsed]
        : [];

  if (list.length === 0) return null;
  if (kid) {
    const byKid = list.find(k => k && k.kid === kid);
    if (byKid) return { jwk: byKid, kid };
    // A set that does not contain the token's kid is a real, nameable failure,
    // not "signature mismatch".
    if (list.some(k => k && typeof k.kid === 'string')) return null;
  }
  const byAlg = list.find(k => k && (k.alg === alg || !k.alg));
  return byAlg ? { jwk: byAlg, kid: byAlg.kid } : { jwk: list[0], kid: list[0]?.kid };
}

export interface ImportedKey {
  key: CryptoKey;
  kid?: string;
}

async function importVerifyKey(input: KeyInput, alg: Algorithm, spec: AlgSpec, kid?: string): Promise<ImportedKey> {
  const api = subtle();
  if (!api) throw new Error('unavailable');

  switch (input.kind) {
    case 'secret-utf8':
    case 'secret-base64':
    case 'secret-hex': {
      if (!spec.secretBased) throw new Error('key-alg-mismatch');
      const bytes =
        input.kind === 'secret-utf8'
          ? new TextEncoder().encode(input.text)
          : input.kind === 'secret-hex'
            ? hexToBytes(input.text)
            : base64ToBytes(input.text);
      return { key: await api.importKey('raw', bytes as BufferSource, spec.importParams as HmacImportParams, false, ['verify']) };
    }
    case 'pem': {
      if (spec.secretBased) throw new Error('key-alg-mismatch');
      const pem = readPem(input.text);
      if (!pem) throw new Error('bad-key');
      // A public key is SPKI; a private key is PKCS8. Accepting the private
      // one for verification is a convenience: people paste what they have.
      const format = pem.label.includes('PRIVATE') ? 'pkcs8' : 'spki';
      const key = await api.importKey(format, pem.bytes as BufferSource, spec.importParams as RsaHashedImportParams, false, [
        format === 'pkcs8' ? 'sign' : 'verify',
      ]);
      if (format === 'pkcs8') throw new Error('private-for-verify');
      return { key };
    }
    case 'jwk':
    case 'jwks': {
      const parsed = JSON.parse(input.text);
      const picked = selectJwk(parsed, kid, alg);
      if (!picked) throw new Error('no-matching-kid');
      const { d, key_ops, ext, use, ...rest } = picked.jwk;
      if (spec.secretBased && rest.kty !== 'oct') throw new Error('key-alg-mismatch');
      if (!spec.secretBased && rest.kty === 'oct') throw new Error('key-alg-mismatch');
      const key = await api.importKey('jwk', rest, spec.importParams as RsaHashedImportParams, false, ['verify']);
      return { key, kid: picked.kid };
    }
    default:
      throw new Error('bad-key');
  }
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------

export async function verifySignature(
  signingInput: string,
  signature: string,
  alg: Algorithm | null,
  key: KeyInput,
  kid?: string
): Promise<VerifyResult> {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const done = (state: VerifyResult['state'], reason: VerifyResult['reason'], extra?: Partial<VerifyResult>): VerifyResult => ({
    state,
    reason,
    ms: Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - started) * 10) / 10,
    ...extra,
  });

  if (!signingInput) return done('idle', 'no-token');
  if (alg === 'none') return done('invalid', 'alg-none');
  if (!alg) return done('error', 'alg-unsupported');
  if (!key.text.trim()) return done('idle', 'no-key');

  const spec = specFor(alg);
  if (!spec) return done('error', 'alg-unsupported', { detail: alg });

  const api = subtle();
  if (!api) return done('error', 'unavailable');

  let imported: ImportedKey;
  try {
    imported = await importVerifyKey(key, alg, spec, kid);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    const reason: VerifyResult['reason'] =
      message === 'key-alg-mismatch' || message === 'private-for-verify'
        ? 'key-alg-mismatch'
        : message === 'no-matching-kid'
          ? 'no-matching-kid'
          : message === 'unavailable'
            ? 'unavailable'
            : 'bad-key';
    return done('error', reason, { detail: message === 'private-for-verify' ? 'private-for-verify' : undefined });
  }

  try {
    const bytes = base64UrlToBytes(signature);
    if (spec.signatureBytes && bytes.length !== spec.signatureBytes) {
      // ECDSA in JWS is the raw r||s pair, never the DER wrapper OpenSSL emits.
      return done('invalid', 'signature-mismatch', { detail: `${bytes.length}/${spec.signatureBytes}` });
    }
    const ok = await api.verify(
      spec.signParams as AlgorithmIdentifier,
      imported.key,
      bytes as BufferSource,
      new TextEncoder().encode(signingInput) as BufferSource
    );
    return done(ok ? 'valid' : 'invalid', ok ? null : 'signature-mismatch', { usedKid: imported.kid });
  } catch {
    return done('invalid', 'signature-mismatch');
  }
}

// ---------------------------------------------------------------------------
// Sign
// ---------------------------------------------------------------------------

async function importSignKey(input: KeyInput, alg: Algorithm, spec: AlgSpec): Promise<CryptoKey> {
  const api = subtle();
  if (!api) throw new Error('unavailable');

  if (spec.secretBased) {
    const bytes =
      input.kind === 'secret-hex'
        ? hexToBytes(input.text)
        : input.kind === 'secret-base64'
          ? base64ToBytes(input.text)
          : new TextEncoder().encode(input.text);
    return api.importKey('raw', bytes as BufferSource, spec.importParams as HmacImportParams, false, ['sign']);
  }

  if (input.kind === 'pem') {
    const pem = readPem(input.text);
    if (!pem || !pem.label.includes('PRIVATE')) throw new Error('need-private');
    return api.importKey('pkcs8', pem.bytes as BufferSource, spec.importParams as RsaHashedImportParams, false, ['sign']);
  }

  const parsed = JSON.parse(input.text);
  const picked = selectJwk(parsed, undefined, alg);
  if (!picked || !picked.jwk.d) throw new Error('need-private');
  const { key_ops, ext, use, ...rest } = picked.jwk;
  return api.importKey('jwk', rest, spec.importParams as RsaHashedImportParams, false, ['sign']);
}

export interface SignOutcome {
  token: string | null;
  error: 'bad-json' | 'bad-key' | 'need-private' | 'alg-unsupported' | 'unavailable' | null;
}

export async function signToken(
  headerText: string,
  payloadText: string,
  alg: Algorithm,
  key: KeyInput
): Promise<SignOutcome> {
  let header: Record<string, unknown>;
  let payload: unknown;
  try {
    header = JSON.parse(headerText);
    payload = JSON.parse(payloadText);
  } catch {
    return { token: null, error: 'bad-json' };
  }

  if (alg === 'none') {
    // Legal per the spec and useful for testing a verifier, so it is offered —
    // with the empty signature the format requires.
    const unsigned = `${b64(JSON.stringify({ ...header, alg: 'none' }))}.${b64(JSON.stringify(payload))}.`;
    return { token: unsigned, error: null };
  }

  const spec = specFor(alg);
  if (!spec) return { token: null, error: 'alg-unsupported' };

  const api = subtle();
  if (!api) return { token: null, error: 'unavailable' };

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await importSignKey(key, alg, spec);
  } catch (error) {
    return { token: null, error: (error instanceof Error && error.message === 'need-private' ? 'need-private' : 'bad-key') };
  }

  const signingInput = `${b64(JSON.stringify({ ...header, alg }))}.${b64(JSON.stringify(payload))}`;
  try {
    const signature = await api.sign(
      spec.signParams as AlgorithmIdentifier,
      cryptoKey,
      new TextEncoder().encode(signingInput) as BufferSource
    );
    return { token: `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`, error: null };
  } catch {
    return { token: null, error: 'bad-key' };
  }
}

function b64(text: string): string {
  return bytesToBase64Url(new TextEncoder().encode(text));
}

// ---------------------------------------------------------------------------
// Key generation — so the builder is usable without hunting for a key first
// ---------------------------------------------------------------------------

export interface GeneratedKeys {
  privatePem: string;
  publicPem: string;
}

function toPem(label: string, bytes: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

export async function generateKeyPair(alg: Algorithm): Promise<GeneratedKeys | null> {
  const api = subtle();
  const spec = specFor(alg);
  if (!api || !spec || spec.secretBased) return null;

  const params: any =
    spec.family === 'ECDSA'
      ? spec.importParams
      : spec.family === 'EdDSA'
        ? { name: 'Ed25519' }
        : { ...(spec.importParams as RsaHashedImportParams), modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) };

  const pair = (await api.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair;
  const [priv, pub] = await Promise.all([
    api.exportKey('pkcs8', pair.privateKey),
    api.exportKey('spki', pair.publicKey),
  ]);
  return { privatePem: toPem('PRIVATE KEY', priv), publicPem: toPem('PUBLIC KEY', pub) };
}

/** A random HMAC secret, base64url, for the HS* algorithms. */
export function randomSecret(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buf);
  return bytesToBase64Url(buf);
}
