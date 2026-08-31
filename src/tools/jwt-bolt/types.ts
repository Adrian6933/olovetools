// ============================================================================
// JWTBolt — shared types.
// ----------------------------------------------------------------------------
// The tool used to stop at "split on dots, base64-decode, JSON.parse". Every
// type below exists because the interesting half of a JWT is what happens
// after that: is the signature real, is the token inside its validity window,
// does it say what the consumer expects it to say.
// ============================================================================

export type Algorithm =
  | 'HS256' | 'HS384' | 'HS512'
  | 'RS256' | 'RS384' | 'RS512'
  | 'PS256' | 'PS384' | 'PS512'
  | 'ES256' | 'ES384' | 'ES512'
  | 'EdDSA'
  | 'none';

export type AlgFamily = 'HMAC' | 'RSA' | 'RSA-PSS' | 'ECDSA' | 'EdDSA' | 'none';

/** Everything `crypto.subtle` needs, derived from the `alg` header. */
export interface AlgSpec {
  family: AlgFamily;
  /** Import/verify parameters for SubtleCrypto. */
  importParams: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams;
  signParams: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
  /** Which key formats make sense for this algorithm. */
  secretBased: boolean;
  /** Bytes of the raw signature, when it is fixed (ECDSA). */
  signatureBytes?: number;
}

// ---------------------------------------------------------------------------
// Decoding
// ---------------------------------------------------------------------------

export type DecodeIssueCode =
  | 'empty'
  | 'segment-count'
  | 'not-base64url'
  | 'bad-utf8'
  | 'not-json'
  | 'not-object'
  | 'alg-none'
  | 'alg-missing'
  | 'alg-unknown'
  | 'empty-signature'
  | 'typ-mismatch'
  | 'crit-unsupported'
  | 'nested-jwt';

export interface DecodeIssue {
  level: 'error' | 'warning';
  code: DecodeIssueCode;
  /** header | payload | signature | token */
  where: 'header' | 'payload' | 'signature' | 'token';
  detail?: string;
}

export interface Segment {
  /** The base64url text exactly as it appears in the token. */
  raw: string;
  /** Decoded UTF-8, when it decoded. */
  text: string;
  /** Parsed JSON, when it parsed. */
  value: unknown;
}

export interface DecodedToken {
  ok: boolean;
  header: Segment;
  payload: Segment;
  /** The signature stays base64url: it is bytes, not text. */
  signature: string;
  /** `header.payload`, the exact bytes the signature covers. */
  signingInput: string;
  alg: Algorithm | null;
  issues: DecodeIssue[];
}

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

export type KeyKind = 'secret-utf8' | 'secret-base64' | 'secret-hex' | 'pem' | 'jwk' | 'jwks';

export interface KeyInput {
  kind: KeyKind;
  text: string;
}

export type VerifyState = 'idle' | 'running' | 'valid' | 'invalid' | 'error';

export interface VerifyResult {
  state: VerifyState;
  /** Stable reason code, translated in the UI. */
  reason:
    | null
    | 'no-key'
    | 'no-token'
    | 'alg-none'
    | 'alg-unsupported'
    | 'bad-key'
    | 'key-alg-mismatch'
    | 'no-matching-kid'
    | 'signature-mismatch'
    | 'unavailable';
  /** Which JWKS entry was used, when a set was supplied. */
  usedKid?: string;
  detail?: string;
  ms: number;
}

// ---------------------------------------------------------------------------
// Claim validation
// ---------------------------------------------------------------------------

export interface ClaimExpectations {
  /** Seconds of clock skew tolerated on exp / nbf / iat. */
  leeway: number;
  issuer: string;
  audience: string;
  subject: string;
  /** Reject a token older than this many seconds, by `iat`. 0 disables it. */
  maxAge: number;
  requireExp: boolean;
  requireTyp: boolean;
}

export const DEFAULT_EXPECTATIONS: ClaimExpectations = {
  leeway: 0,
  issuer: '',
  audience: '',
  subject: '',
  maxAge: 0,
  requireExp: false,
  requireTyp: false,
};

export type CheckCode =
  | 'exp'
  | 'nbf'
  | 'iat'
  | 'max-age'
  | 'iss'
  | 'aud'
  | 'sub'
  | 'typ'
  | 'exp-required'
  | 'exp-type'
  | 'nbf-type'
  | 'iat-type';

export interface ClaimCheck {
  code: CheckCode;
  status: 'pass' | 'fail' | 'skip';
  /** Human-facing extra, e.g. the offending value or the remaining time. */
  detail?: string;
}

export interface ClaimReport {
  checks: ClaimCheck[];
  failures: number;
  /** ms until exp (negative once expired); null when there is no exp. */
  expiresIn: number | null;
  /** ms until nbf; null when there is no nbf or it already passed. */
  activeIn: number | null;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export interface BuilderState {
  headerText: string;
  payloadText: string;
  alg: Algorithm;
}
