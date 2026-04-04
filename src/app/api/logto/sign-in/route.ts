import LogtoClient from '@logto/next/edge';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logtoConfig } from '@/lib/auth';
import { logRequestWithResponse } from '@/lib/api-logger';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/ip';
import { NO_CACHE_HEADERS } from '@/lib/http-headers';

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  // Use req.ip if available (Next.js populates this), otherwise fallback to headers
  // specific Next.js versions might not have ip in the type definition
  const identifier = getClientIp(req) ?? 'unknown';

  const rateLimitResult = checkRateLimit(identifier, {
    maxRequests: 20,
    windowMs: 60 * 1000,
    prefix: 'sign-in',
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Cache-Control': NO_CACHE_HEADERS,
          ...getRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  const handler = logto.handleSignIn();
  const res = await handler(req);

  // Add Cache-Control headers to prevent caching of this state-changing GET request
  res.headers.set('Cache-Control', NO_CACHE_HEADERS);

  logRequestWithResponse('sign-in', req, res);
  return res;
};
