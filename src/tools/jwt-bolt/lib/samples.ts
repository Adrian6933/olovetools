// ============================================================================
// Sample tokens.
// ----------------------------------------------------------------------------
// One per situation the tool is actually used in, instead of the single HS256
// token the old version shipped. The HS256 ones verify against the secret
// below, so "does verification really work" is one click away.
// ============================================================================

export const SAMPLE_SECRET = 'a-string-secret-at-least-256-bits-long';

export interface Sample {
  id: string;
  key: string;
  token: string;
  /** Secret that verifies this sample, when there is one. */
  secret?: string;
}

export const SAMPLES: Sample[] = [
  {
    id: 'valid',
    key: 'sampleValid',
    // HS256 over {"sub":"1234567890","name":"Jane Doe","iat":1516239022,
    // "exp":4102444800,"iss":"https://auth.example.com","aud":"api"}
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjQxMDI0NDQ4MDAsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6ImFwaSJ9.BsZcTjmBLApD84ndoMjdzxkwALdfipgHibd1HW83dmk',
    secret: SAMPLE_SECRET,
  },
  {
    id: 'expired',
    key: 'sampleExpired',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9.uzW97Wp0l1ttXeguOBg1J3MeAP4Qaj9Vz20suYbKYwo',
    secret: SAMPLE_SECRET,
  },
  {
    id: 'tampered',
    key: 'sampleTampered',
    // Same header and payload as the valid one with `admin: true` spliced in
    // and the original signature left behind: the case verification exists for.
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjQxMDI0NDQ4MDAsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6ImFwaSIsImFkbWluIjp0cnVlfQ.BsZcTjmBLApD84ndoMjdzxkwALdfipgHibd1HW83dmk',
    secret: SAMPLE_SECRET,
  },
  {
    id: 'none',
    key: 'sampleNone',
    // The unsecured-token attack: `alg: none`, empty signature.
    token:
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiYWRtaW4iOnRydWV9.',
  },
  {
    id: 'broken',
    key: 'sampleBroken',
    // Base64 with `+` and `=` that survived a copy out of a URL.
    token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhK2IifQ==.abc',
  },
];

export const DEFAULT_HEADER = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2);

export function defaultPayload(): string {
  const now = Math.floor(Date.now() / 1000);
  return JSON.stringify(
    { sub: '1234567890', name: 'Jane Doe', iat: now, exp: now + 3600 },
    null,
    2
  );
}
