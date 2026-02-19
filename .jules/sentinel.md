# Sentinel Journal

## 2025-05-23 - Exposed Debug Endpoints in Production

**Vulnerability:** Debug endpoints (`/api/debug/token`, `/api/logto/debug-cookies`) were accessible in production, exposing user claims and cookie metadata.
**Learning:** Next.js API routes are deployed to production by default unless explicitly guarded. "Debug" folders don't automatically exclude themselves.
**Prevention:** Always add a `if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });` guard to debug-only routes, or use a middleware to block paths starting with `/debug` in production.

## 2025-05-24 - Rate Limiting & IP Spoofing Risks

**Vulnerability:** The public sign-in endpoint (`/api/logto/sign-in`) lacked rate limiting, allowing potential DoS or abuse. Additionally, reliance on `x-forwarded-for` without parsing can be spoofed.
**Learning:** Next.js `NextRequest.ip` is the most reliable way to get client IP in Vercel/Edge environments. If falling back to headers, always take the _first_ IP from `x-forwarded-for` (client IP) rather than the whole string, as proxies append to it.
**Prevention:** Use `req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'` for robust IP identification in rate limiters.

## 2025-05-25 - Information Leakage in API Errors

**Vulnerability:** Upstream error details (potentially containing secrets or stack traces) were being exposed in the `Error` message thrown in `src/app/api/logto/token/route.ts`. Even though the response was sanitized for clients in production, the thrown error object was logged with its full message. If the message itself contained secrets (from `tokenResponse.text()`), they would be written to logs unredacted because Pino redacts specific object paths but not strings within `error.message`.
**Learning:** `logger.error({ error })` logs the error object. While Pino redacts properties like `password` or `token` in the log object, it does _not_ parse and redact the `message` string of an Error object. Including raw API responses in Error messages is dangerous.
**Prevention:** Always sanitize Error messages before throwing. Log the raw/detailed error separately with `logger.error({ rawError }, 'Message')` so redaction rules apply to the `rawError` object properties, but keep the thrown `Error.message` generic (e.g., "Upstream service failed").
