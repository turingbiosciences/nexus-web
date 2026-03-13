import LogtoClient from '@logto/next/edge';
import type { NextRequest } from 'next/server';
import { logtoConfig } from '@/lib/auth';
import { logRequestWithResponse } from '@/lib/api-logger';
import { isSafeUrl } from '@/lib/security';

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  const redirect = req.nextUrl.searchParams.get('redirect');
  const redirectUri = isSafeUrl(redirect)
    ? redirect!
    : process.env.NEXTAUTH_URL;

  const handler = logto.handleSignOut(redirectUri);
  const res = await handler(req);
  logRequestWithResponse('sign-out', req, res);
  return res;
};
