import LogtoClient from '@logto/next/edge';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logtoConfig } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { logRequest } from '@/lib/api-logger';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest('user', req);

  // Rate limiting
  const identifier = getClientIp(req);

  const rateLimitResult = checkRateLimit(identifier, {
    maxRequests: 60,
    windowMs: 60 * 1000,
    prefix: 'user',
  });

  if (!rateLimitResult.success) {
    logger.warn({ ip: identifier }, 'User endpoint rate limit exceeded');
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }
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
    {
      label: 'user',
      status: res.status,
      authenticated,
      sub,
    },
    '[logto:user] Request completed'
  );

  const responseData: Record<string, unknown> = { ...(data || {}) };

  if (process.env.NODE_ENV === 'development') {
    responseData._debug = {
      status: res.status,
      authenticated,
      hasClaims: Boolean(claims),
      sub,
    };
  }

  return NextResponse.json(responseData, {
    status: res.status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
};
