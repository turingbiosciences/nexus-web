import LogtoClient from '@logto/next/edge';
import type { NextRequest } from 'next/server';
import { logtoConfig } from '@/lib/auth';
import { logRequestWithResponse } from '@/lib/api-logger';
import { NO_CACHE_HEADERS } from '@/lib/http-headers';

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  const handler = logto.handleSignOut();
  const res = await handler(req);
  // Add Cache-Control headers to prevent caching of this state-changing GET request
  Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
    res.headers.set(key, value);
  });
  logRequestWithResponse('sign-out', req, res);
  return res;
};
