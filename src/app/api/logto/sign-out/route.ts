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
  res.headers.set('Cache-Control', NO_CACHE_HEADERS);
  logRequestWithResponse('sign-out', req, res);
  return res;
};
