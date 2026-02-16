import LogtoClient from '@logto/next/edge';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logtoConfig } from '@/lib/auth';
import { logRequest } from '@/lib/api-logger';
import { logger } from '@/lib/logger';

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest('user', req);
  const handler = logto.handleUser();
  const res = await handler(req);

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // non-JSON response
  }

  const data =
    parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  const authenticated = Boolean(
    (data as Record<string, unknown>)?.isAuthenticated
  );
  const claims = (data as Record<string, unknown>)?.claims ?? null;
  const sub =
    claims &&
    typeof claims === 'object' &&
    'sub' in claims &&
    typeof claims.sub === 'string'
      ? claims.sub
      : null;

  logger.info(
    { status: res.status, authenticated, sub },
    '[logto:user] User check completed'
  );

  const responseBody: Record<string, unknown> = {
    ...(data || {}),
  };

  if (process.env.NODE_ENV === 'development') {
    responseBody._debug = {
      status: res.status,
      authenticated,
      hasClaims: Boolean(claims),
      sub,
    };
  }

  return NextResponse.json(responseBody, { status: res.status });
};
