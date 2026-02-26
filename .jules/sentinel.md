# Sentinel Journal

## 2025-05-23 - Exposed Debug Endpoints in Production

**Vulnerability:** Debug endpoints (`/api/debug/token`, `/api/logto/debug-cookies`) were accessible in production, exposing user claims and cookie metadata.
**Learning:** Next.js API routes are deployed to production by default unless explicitly guarded. "Debug" folders don't automatically exclude themselves.
**Prevention:** Always add a `if (process.env.NODE_ENV !== 'development') return new NextResponse(null, { status: 404 });` guard to debug-only routes, or use a middleware to block paths starting with `/debug` in production.

## 2025-05-24 - Rate Limiting & IP Spoofing Risks

**Vulnerability:** The public sign-in endpoint (`/api/logto/sign-in`) lacked rate limiting, allowing potential DoS or abuse. Additionally, reliance on `x-forwarded-for` without parsing can be spoofed.
**Learning:** Next.js `NextRequest.ip` is the most reliable way to get client IP in Vercel/Edge environments. If falling back to headers, always take the _first_ IP from `x-forwarded-for` (client IP) rather than the whole string, as proxies append to it.
**Prevention:** Use `req.ip ?? req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'` for robust IP identification in rate limiters.

## 2025-05-24 - Missing Security Utilities & Unsanitized Logging

**Vulnerability:** The central security utility file `src/lib/security.ts` was missing, leading to `sanitizeFilename` and `sanitizeUrl` not being available. Consequently, API logs were recording raw URLs (potentially exposing tokens in query params), and file uploads were using raw filenames (risk of path traversal/weird characters).
**Learning:** Referencing a security utility in documentation/memory doesn't guarantee its existence in the codebase. Always verify the existence of security controls before assuming they are active.
**Prevention:** Implement a "security health check" test that asserts the existence and export of critical security functions (`sanitizeUrl`, `sanitizeFilename`, etc.) and their usage in sensitive sinks (logging, file handling).

## 2025-05-24 - SonarCloud & Prettier Compliance

**Vulnerability:** Initial implementation of `sanitizeFilename` used a greedy regex (`replace(/^.*[\\/]/, '')`) which SonarCloud flagged as a ReDoS risk (Security Hotspot). Additionally, code formatting was not run, causing CI failure.
**Learning:** Security tools are sensitive to regex complexity. Always prefer simple string manipulation (like `split().pop()`) over complex regexes for parsing paths. Always run formatters before pushing.
**Prevention:** Use `split(/[\\/]/).pop()` for filename extraction. Add a pre-commit hook or manual step to run `pnpm format` and checks for regex safety.

## 2025-05-24 - Resolving SonarCloud Hotspots (Iterative)

**Vulnerability:** Initial attempts to fix SonarCloud hotspots in `sanitizeFilename` (greedy regex) and `sanitizeUrl` (http protocol) introduced new issues or didn't fully resolve them. Specifically, avoiding regex complexity while handling multiple dots safely required careful implementation using `split().filter(Boolean)`.
**Learning:** Security tools are very specific about regex safety. Simple, functional approaches (like split/filter/join) are often safer and clearer than complex regexes for string manipulation. Always verify changes locally with tests _and_ formatters.
**Prevention:** Adopt a pattern of "split, filter, join" for sanitizing delimited strings instead of regex replacements where possible. Use HTTPS by default in all URL handling.

## 2025-05-24 - Final Polish: Formatting & Tests

**Vulnerability:** A formatting error in  caused the "quality" check to fail.
**Learning:** Prettier checks EVERYTHING, including markdown files. Security documentation is part of the codebase.
**Prevention:** Include all file types in pre-commit formatting checks.

## 2025-05-24 - Final Polish: Formatting & Tests

**Vulnerability:** A formatting error in `.jules/sentinel.md` caused the "quality" check to fail.
**Learning:** Prettier checks EVERYTHING, including markdown files. Security documentation is part of the codebase.
**Prevention:** Include all file types in pre-commit formatting checks.
