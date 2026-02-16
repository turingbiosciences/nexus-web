import { logger } from '@/lib/logger';

/**
 * Shared logging utilities for API routes
 */

export function logRequest(label: string, req: Request): void {
  logger.info({ url: req.url }, `[logto:${label}] Request received`);
}

export function logResponse(label: string, status: number): void {
  logger.info({ status }, `[logto:${label}] Response sent`);
}

export function logRequestWithResponse(
  label: string,
  req: Request,
  res: Response
): void {
  logRequest(label, req);
  logResponse(label, res.status);
}
