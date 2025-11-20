/**
 * Shared logging utilities for API routes
 */

export function logRequest(label: string, req: Request): void {
  console.log(`[logto:${label}] URL=${req.url}`);
}

export function logResponse(label: string, status: number): void {
  console.log(`[logto:${label}] Status=${status}`);
}

export function logRequestWithResponse(
  label: string,
  req: Request,
  res: Response
): void {
  logRequest(label, req);
  console.log(`[logto:${label}] Status=${res.status}`);
}
