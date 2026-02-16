import { logger } from '@/lib/logger';

/**
 * Shared logging utilities for API routes
 */

export function logRequest(label: string, req: Request): void {
  logger.info({ label, url: req.url }, `[logto:${label}] Request`);
}

export function logResponse(label: string, status: number): void {
  logger.info({ label, status }, `[logto:${label}] Response status`);
}

export function logRequestWithResponse(
  label: string,
  req: Request,
  res: Response
): void {
  logRequest(label, req);
  logger.info(
    { label, status: res.status },
    `[logto:${label}] Response status`
  );
}
