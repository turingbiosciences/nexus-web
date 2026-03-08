# Sentinel Journal

## 2025-05-23 - Exposed Debug Endpoints in Production

**Vulnerability:** Debug endpoints (`/api/debug/token`, `/api/logto/debug-cookies`) were accessible in production, exposing user claims and cookie metadata.
**Learning:** Next.js API routes are deployed to production by default unless explicitly guarded. "Debug" folders don't automatically exclude themselves.
**Prevention:** Always add a `if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });` guard to debug-only routes, or use a middleware to block paths starting with `/debug` in production.

## 2025-05-24 - Rate Limiting & IP Spoofing Risks

**Vulnerability:** The public sign-in endpoint (`/api/logto/sign-in`) lacked rate limiting, allowing potential DoS or abuse. Additionally, reliance on `x-forwarded-for` without parsing can be spoofed.
**Learning:** Next.js `NextRequest.ip` is the most reliable way to get client IP in Vercel/Edge environments. If falling back to headers, always take the _first_ IP from `x-forwarded-for` (client IP) rather than the whole string, as proxies append to it.
**Prevention:** Use `req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'` for robust IP identification in rate limiters.

## 2025-05-25 - Rate Limiting Authenticated Endpoints

**Vulnerability:** The heavily accessed authenticated endpoint (`/api/logto/user`) lacked rate limiting, potentially allowing resource exhaustion attacks.
**Learning:** Rate limiting is not just for public routes (like sign-in); heavily polled or frequently accessed authenticated endpoints also require rate limits to prevent DoS attacks that could degrade performance for all users.
**Prevention:** Apply rate limiting (e.g., using `checkRateLimit` and robust IP resolution via `req.ip` falling back to `x-forwarded-for`) to all sensitive or high-traffic API routes.
