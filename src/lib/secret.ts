/**
 * Reads a secret that may be supplied either directly or as a file path.
 *
 * SERVER ONLY — imports node:fs. Never import this from a client component or
 * from a module a client component imports; Next.js will fail the browser
 * bundle, and the point of file-based secrets is that they stay on the server.
 *
 * Production mounts Docker secrets under /run/secrets and points <NAME>_FILE at
 * them, so the value never enters the environment and never appears in
 * `docker inspect` or /proc/<pid>/environ. Local development keeps using plain
 * env vars from .env, so both forms are supported.
 */

import { readFileSync } from 'node:fs';

if (typeof window !== 'undefined') {
  throw new TypeError(
    'secret.ts is server-only and must not be imported by client code'
  );
}

/** Cache so repeated reads do not hit the filesystem on every request. */
const cache = new Map<string, string>();

/**
 * @param name Base variable name, e.g. 'NEXTAUTH_SECRET'. Checks
 *             `${name}_FILE` first, then `name`.
 * @param required Throw when neither form is present. Default true — a silently
 *             empty secret usually surfaces later as a confusing 401.
 */
export function readSecret(name: string, required = true): string {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const file = process.env[`${name}_FILE`];
  let value = '';

  if (file) {
    try {
      // Trailing newlines are the classic failure here — a secret written with
      // `echo` instead of `printf` breaks connection strings and HMAC compares.
      value = readFileSync(file, 'utf8').trim();
    } catch (err) {
      throw new Error(`Could not read ${name} from ${file}: ${String(err)}`);
    }
  } else {
    value = process.env[name]?.trim() ?? '';
  }

  if (!value && required) {
    throw new Error(`Missing required secret: set ${name} or ${name}_FILE`);
  }

  cache.set(name, value);
  return value;
}

/** Test seam. */
export function clearSecretCache(): void {
  cache.clear();
}
