/**
 * Server-side Logto M2M token acquisition, with in-process caching.
 *
 * This exists so the M2M access token never reaches the browser. The previous
 * flow had the client GET /api/logto/token and attach the token itself, which
 * meant any authenticated user could read a `scope: 'all'` credential out of
 * devtools and call the API directly with it.
 *
 * SERVER ONLY. Importing this from a client component will leak the secret into
 * the bundle — the guard below turns that into a loud failure instead.
 */

import { readSecret } from '@/lib/secret';

if (typeof window !== 'undefined') {
  throw new TypeError(
    'm2m-token.ts is server-only and must not be imported by client code'
  );
}

interface CachedToken {
  token: string;
  /** Epoch ms at which we stop trusting this token. */
  expiresAt: number;
}

let cache: CachedToken | null = null;
let inFlight: Promise<string> | null = null;

/** Refresh this many ms before actual expiry, to avoid racing the boundary. */
const EXPIRY_SKEW_MS = 60_000;

async function fetchToken(): Promise<string> {
  const endpoint = process.env.LOGTO_ENDPOINT;
  const appId = process.env.LOGTO_M2M_APP_ID;
  // required=false so a missing value is reported by the aggregated check below
  // rather than throwing a less informative error here.
  const appSecret = readSecret('LOGTO_M2M_APP_SECRET', false);
  const resource = process.env.LOGTO_M2M_ENDPOINT;

  const missing = Object.entries({
    LOGTO_ENDPOINT: endpoint,
    LOGTO_M2M_APP_ID: appId,
    LOGTO_M2M_APP_SECRET: appSecret,
    LOGTO_M2M_ENDPOINT: resource,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(`Missing M2M configuration: ${missing.join(', ')}`);
  }

  const res = await fetch(`${endpoint}/oidc/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: appId!,
      client_secret: appSecret,
      resource: resource!,
      scope: 'all',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    // Deliberately not including the response body — it can echo credentials.
    throw new Error(`Logto token request failed with status ${res.status}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - EXPIRY_SKEW_MS,
  };
  return data.access_token;
}

/**
 * Returns a valid M2M access token, reusing the cached one when possible.
 *
 * Concurrent callers share a single in-flight request rather than each opening
 * their own — the old per-browser-request flow hit Logto on every API call.
 */
export async function getM2MToken(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.token;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = fetchToken().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

/** Test seam — drops the cached token. */
export function clearM2MTokenCache(): void {
  cache = null;
  inFlight = null;
}
