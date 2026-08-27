/**
 * Liveness probe for the container healthcheck.
 *
 * Deliberately shallow: it reports that this process can serve HTTP, nothing
 * more. It must NOT check the database or the API — docker-compose gates
 * `caddy` on `web` being healthy, so a dependency blip here would take the
 * whole edge down instead of degrading one feature.
 *
 * It must also stay unauthenticated and leak nothing: no version numbers, no
 * environment details, no dependency status.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
