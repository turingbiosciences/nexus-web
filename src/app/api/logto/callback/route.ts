import LogtoClient from '@logto/next/edge';
import { logtoConfig } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';
import { logRequest } from '@/lib/api-logger';
import { logger } from '@/lib/logger';

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest('callback', req);

  // Rate limiting to prevent DoS or abuse on the generic callback route
  const identifier = getClientIp(req) ?? 'unknown';

  const rateLimitResult = checkRateLimit(identifier, {
    maxRequests: 20,
    windowMs: 60 * 1000,
    prefix: 'callback',
  });

  if (!rateLimitResult.success) {
    logger.warn(
      { identifier },
      'Rate limit exceeded on generic callback route'
    );
    return new NextResponse(
      '<html><body><h1>429 Too Many Requests</h1><p>Please try again later.</p></body></html>',
      {
        status: 429,
        headers: {
          'Content-Type': 'text/html',
          ...getRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  const handler = logto.handleSignInCallback();
  return handler(req);
};
