import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export const GET = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse(null, { status: 404 });
  }

  const store = await cookies();
  const allCookies = store.getAll();
  const names = allCookies.map((c) => c.name);

  logger.debug({ names }, '[logto:debug-cookies] Cookie names');

  return NextResponse.json({
    cookieNames: names,
    count: names.length,
    cookies: allCookies.map((c) => ({
      name: c.name,
      hasValue: Boolean(c.value),
      valueLength: c.value?.length || 0,
    })),
  });
};
