/**
 * Server-side Logto configuration.
 *
 * SERVER ONLY. Reads secrets via src/lib/secret.ts, which imports node:fs.
 * Client components must import from '@/lib/auth-client' instead — importing
 * this module from the browser bundle will fail the build.
 */

import { LogtoNextConfig } from '@logto/next';
import { readSecret } from '@/lib/secret';
import { logtoScopes } from '@/lib/auth-client';

export { logtoScopes };

/**
 * Secrets are read through getters rather than at module scope on purpose.
 * Next.js evaluates route modules during `next build`, where /run/secrets does
 * not exist — eager reads would fail the build. Getters defer the read to the
 * first request, when the secret is mounted.
 */
export const logtoConfig: LogtoNextConfig = {
  appId: process.env.LOGTO_APP_ID!,
  endpoint: process.env.LOGTO_ENDPOINT!,
  baseUrl: process.env.NEXTAUTH_URL!,
  cookieSecure: process.env.NODE_ENV === 'production',
  scopes: logtoScopes,
  get appSecret() {
    return readSecret('LOGTO_APP_SECRET');
  },
  get cookieSecret() {
    return readSecret('NEXTAUTH_SECRET');
  },
  // NOTE: Do NOT include resources in user authentication config
  // Resources are only for M2M token exchange (see src/lib/api/m2m-token.ts)
  // Including resources here causes "invalid_target" errors in production
} as LogtoNextConfig;
