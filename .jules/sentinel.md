# Sentinel Journal

## 2025-05-23 - Exposed Debug Endpoints in Production

**Vulnerability:** Debug endpoints (`/api/debug/token`, `/api/logto/debug-cookies`) were accessible in production, exposing user claims and cookie metadata.
**Learning:** Next.js API routes are deployed to production by default unless explicitly guarded. "Debug" folders don't automatically exclude themselves.
**Prevention:** Always add a `if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });` guard to debug-only routes, or use a middleware to block paths starting with `/debug` in production.

## 2025-05-24 - Rate Limiting & IP Spoofing Risks

**Vulnerability:** The public sign-in endpoint (`/api/logto/sign-in`) lacked rate limiting, allowing potential DoS or abuse. Additionally, reliance on `x-forwarded-for` without parsing can be spoofed.
**Learning:** Next.js `NextRequest.ip` is the most reliable way to get client IP in Vercel/Edge environments. If falling back to headers, always take the _first_ IP from `x-forwarded-for` (client IP) rather than the whole string, as proxies append to it.
**Prevention:** Use `req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'` for robust IP identification in rate limiters.

## 2026-02-06 - IP Spoofing Risk via Untrimmed Headers

**Vulnerability:** The rate limiter IP identification logic used `req.headers.get('x-forwarded-for')?.split(',')[0]` without `.trim()`, allowing attackers to spoof IPs by sending `X-Forwarded-For:  1.2.3.4` (with a space) and bypass rate limits. Some endpoints also incorrectly prioritized `x-real-ip` before `x-forwarded-for`.
**Learning:** IP addresses extracted from HTTP headers (especially CSV lists like `X-Forwarded-For`) can contain leading or trailing whitespace, which defeats string-based exact matching in rate limit stores. Additionally, `X-Forwarded-For` usually provides the client IP more reliably than `X-Real-IP` behind multiple proxies.
**Prevention:** Always append `.trim()` when extracting the first IP from `x-forwarded-for`, and ensure the precedence order is `req.ip` -> `x-forwarded-for` (trimmed) -> `x-real-ip` -> `'unknown'`.
