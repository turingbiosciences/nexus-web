/**
 * Logto configuration that is safe to load in the browser.
 *
 * This was split out of src/lib/auth.ts so that auth.ts could become server-only
 * and read its secrets from files (see src/lib/secret.ts). Client components
 * import from here; anything touching a secret stays in auth.ts.
 *
 * Nothing in this file may reference a secret or a non-NEXT_PUBLIC_ env var —
 * it is inlined into the client bundle.
 */

export const logtoScopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'all',
];

export const logtoClientConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  scopes: logtoScopes,
  // NOTE: Do NOT include resources in client auth config
  // Client uses this only for auth state, not for API tokens
  // API tokens are attached server-side by the /api/turing/* proxy
};
