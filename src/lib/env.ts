/**
 * Centralized environment variable validation using Zod
 *
 * This ensures all required environment variables are present and valid
 * at application startup, preventing runtime errors.
 */

import { z } from 'zod';

/**
 * Secrets reach the app one of two ways:
 *
 *   - local development: a plain env var, from .env
 *   - production:        <NAME>_FILE holding a path to a Docker secret mounted
 *                        under /run/secrets, so the value never appears in the
 *                        environment or in `docker inspect`
 *
 * So each secret is validated as a PAIR — neither variant is required on its
 * own, but at least one must be present. Requiring the plaintext variant would
 * make the container fail to start in production.
 */
const SECRET_PAIRS = [
  'LOGTO_APP_SECRET',
  'LOGTO_M2M_APP_SECRET',
  'NEXTAUTH_SECRET',
] as const;

// Server-side environment variables (not exposed to client)
const serverEnvSchema = z
  .object({
    // Logto Authentication
    LOGTO_ENDPOINT: z.string().url(),
    LOGTO_APP_ID: z.string().min(1),
    LOGTO_APP_SECRET: z.string().min(1).optional(),
    LOGTO_APP_SECRET_FILE: z.string().min(1).optional(),

    // Logto M2M (Machine-to-Machine)
    LOGTO_M2M_APP_ID: z.string().min(1),
    LOGTO_M2M_APP_SECRET: z.string().min(1).optional(),
    LOGTO_M2M_APP_SECRET_FILE: z.string().min(1).optional(),
    LOGTO_M2M_ENDPOINT: z.string().url(),

    // NextAuth
    NEXTAUTH_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32).optional(),
    NEXTAUTH_SECRET_FILE: z.string().min(1).optional(),

    // Internal address of the API container, used by the same-origin proxy at
    // /api/turing/*. Not a NEXT_PUBLIC_ value on purpose — the browser must
    // never learn the API's address.
    TURING_API_INTERNAL_URL: z.string().url(),

    // Sentry (optional in development)
    SENTRY_AUTH_TOKEN: z.string().optional(),

    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  })
  .superRefine((env, ctx) => {
    for (const name of SECRET_PAIRS) {
      const direct = env[name];
      const viaFile = env[`${name}_FILE` as keyof typeof env];
      if (!direct && !viaFile) {
        ctx.addIssue({
          code: 'custom',
          path: [name],
          message: `${name} or ${name}_FILE must be set`,
        });
      }
    }
  });

// Client-side environment variables (exposed via NEXT_PUBLIC_ prefix)
const clientEnvSchema = z.object({
  // NEXT_PUBLIC_TURING_API is intentionally absent. The browser now calls the
  // same-origin /api/turing/* proxy, so no API address is inlined into the
  // client bundle. Re-adding it would republish the API's location and force
  // the CSP connect-src exception in next.config.ts back open.
  NEXT_PUBLIC_LOGTO_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_LOGTO_APP_ID: z.string().min(1),
});

/**
 * Validate and parse server environment variables
 * Only call this on the server side (API routes, server components, etc.)
 */
export function getServerEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() can only be called on the server side');
  }

  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(
        `❌ Invalid or missing server environment variables:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Validate and parse client environment variables
 * Safe to call on both client and server
 */
export function getClientEnv() {
  try {
    return clientEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(
        `❌ Invalid or missing client environment variables:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Merged type for type-safe environment variable access
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
