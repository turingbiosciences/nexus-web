import { NextRequest } from 'next/server';

/**
 * Extracts the client IP address from a NextRequest object securely.
 * Prioritizes `req.ip` (populated by Next.js on Vercel/Edge).
 * Falls back to the first entry of `x-forwarded-for` (client IP) or `x-real-ip`.
 */
export function getClientIp(req: NextRequest): string {
  // Use req.ip if available (Next.js populates this)
  const ip = (req as unknown as { ip?: string }).ip;
  if (ip) {
    return ip;
  }

  // Fallback to x-forwarded-for, taking only the first IP and trimming it
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  // Fallback to x-real-ip
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  return 'unknown';
}
