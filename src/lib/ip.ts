import type { NextRequest } from 'next/server';

export function getClientIp(req: NextRequest): string | null {
  const ip = (req as unknown as { ip?: string }).ip;
  if (ip) {
    return ip;
  }

  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return null;
}
