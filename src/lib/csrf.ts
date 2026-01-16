import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Validates CSRF by checking the Origin and Referer headers
 * against the Host header.
 *
 * This is a basic CSRF protection mechanism for API routes that
 * perform state-changing operations (POST, PUT, DELETE, PATCH).
 *
 * @param req The incoming request
 * @returns A response if validation fails, or null if it passes
 */
export function validateCSRF(req: NextRequest): NextResponse | null {
  // Only check state-changing methods
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return null;
  }

  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');

  if (!host) {
    logger.warn('CSRF check failed: Missing Host header');
    return NextResponse.json(
      { error: 'Invalid request: Missing Host header' },
      { status: 403 }
    );
  }

  // Check Origin if present (preferred)
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        logger.warn(
          { origin, host },
          'CSRF check failed: Origin does not match Host'
        );
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
      return null;
    } catch {
      logger.warn({ origin }, 'CSRF check failed: Invalid origin URL');
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
    }
  }

  // Fallback to Referer if Origin is missing
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        logger.warn(
          { referer, host },
          'CSRF check failed: Referer does not match Host'
        );
        return NextResponse.json({ error: 'Invalid referer' }, { status: 403 });
      }
      return null;
    } catch {
      logger.warn({ referer }, 'CSRF check failed: Invalid referer URL');
      return NextResponse.json({ error: 'Invalid referer' }, { status: 403 });
    }
  }

  // If neither header is present, block the request
  // (Strict mode: require at least one of them for state-changing requests)
  logger.warn('CSRF check failed: Missing Origin and Referer headers');
  return NextResponse.json(
    { error: 'Missing origin or referer header' },
    { status: 403 }
  );
}
