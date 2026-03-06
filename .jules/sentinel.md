# Sentinel Journal

## 2025-05-23 - Exposed Debug Endpoints in Production

**Vulnerability:** Debug endpoints (`/api/debug/token`, `/api/logto/debug-cookies`) were accessible in production, exposing user claims and cookie metadata.
**Learning:** Next.js API routes are deployed to production by default unless explicitly guarded. "Debug" folders don't automatically exclude themselves.
**Prevention:** Always add a `if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });` guard to debug-only routes, or use a middleware to block paths starting with `/debug` in production.

## 2025-05-24 - Rate Limiting & IP Spoofing Risks

**Vulnerability:** The public sign-in endpoint (`/api/logto/sign-in`) lacked rate limiting, allowing potential DoS or abuse. Additionally, reliance on `x-forwarded-for` without parsing can be spoofed.
**Learning:** Next.js `NextRequest.ip` is the most reliable way to get client IP in Vercel/Edge environments. If falling back to headers, always take the _first_ IP from `x-forwarded-for` (client IP) rather than the whole string, as proxies append to it.
**Prevention:** Use `req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'` for robust IP identification in rate limiters.

## 2025-05-25 - Rate Limiting & DoS on Authenticated Endpoints

**Vulnerability:** The authenticated `/api/logto/user` endpoint lacked rate limiting, making it susceptible to DoS attacks even by authenticated users.
**Learning:** Authenticated endpoints are not immune to DoS attacks or excessive spamming which could degrade system performance.
**Prevention:** Always implement rate limiting on sensitive and heavily used endpoints like `/api/logto/user`. Ensure IP reading prioritizes `req.ip` and properly parses `x-forwarded-for` to prevent IP spoofing in the rate limiter key.
