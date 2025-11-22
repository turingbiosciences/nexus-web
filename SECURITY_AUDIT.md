# Security Audit Report

**Date:** November 22, 2025  
**Project:** nexus-web (Turing Biosciences)  
**Branch:** fix-logger-and-ci

## Executive Summary

Overall security posture: **GOOD** ✅

The application demonstrates solid security practices with proper authentication, no obvious XSS vulnerabilities, and secure token handling. Several recommendations are provided to further strengthen security.

---

## Critical Issues

### None Found ✅

---

## High Priority Issues

### 1. ~~**Sensitive Data in Console Logs**~~ ✅ RESOLVED

**Severity:** HIGH → **FIXED**  
**Status:** ✅ Completed November 22, 2025  
**Commits:** 93b71de, e26be94

**Original Issue:**
Debug logging exposed sensitive token information in production environments via `console.log` calls in authentication-related code.

**Resolution Implemented:**
All console logging in authentication code has been replaced with structured logger:

**Files Updated:**

- ✅ `src/app/api/logto/token/route.ts` - 10+ console calls replaced with logger.debug/info/error
- ✅ `src/lib/global-fetch-handler.ts` - 4 console calls replaced with logger.warn/error/debug
- ✅ `src/lib/auth-utils.ts` - 3 console calls replaced with logger.warn/error
- ✅ `src/lib/auth.ts` - Config logging now uses logger.debug with NODE_ENV guard
- ✅ `src/app/api/logto/sign-in-callback/route.ts` - 4 console calls replaced with logger
- ✅ `src/app/api/logto/manual-sign-out/route.ts` - 1 console call replaced with logger.error
- ✅ `src/components/auth/auth-provider.tsx` - Client-side config logging removed

**Security Improvements:**

- Sensitive config only logged in development mode with `NODE_ENV === "development"` guards
- Token claims logging enhanced with double guards (NODE_ENV + DEBUG flag)
- Structured logging with context objects enables proper Sentry integration
- Error logging includes error objects for better debugging without exposing sensitive data
- All 501 unit tests passing after refactoring

---

## Medium Priority Issues

### 2. ~~**Missing Rate Limiting on Token Endpoint**~~ ✅ RESOLVED

**Severity:** MEDIUM → **FIXED**  
**Status:** ✅ Completed November 22, 2025

**Original Issue:**  
The `/api/logto/token` endpoint had authentication but no rate limiting. An authenticated user could potentially abuse this endpoint to generate excessive M2M tokens.

**Resolution Implemented:**
Created custom in-memory rate limiting system and applied to token endpoint:

**Files Created:**

- ✅ `src/lib/rate-limit.ts` - Rate limiting with Map storage, automatic cleanup, standard headers
- ✅ `src/lib/__tests__/rate-limit.test.ts` - Comprehensive test coverage (10 tests)

**Files Updated:**

- ✅ `src/app/api/logto/token/route.ts` - Added rate limiting: 10 requests/minute per IP

**Implementation Details:**

```typescript
// Rate limit check before authentication
const identifier = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
const rateLimitResult = checkRateLimit(identifier, {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  prefix: "token",
});

if (!rateLimitResult.success) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: getRateLimitHeaders(rateLimitResult),
    },
  );
}
```

**Features:**

- In-memory storage suitable for single-instance deployments (can upgrade to Redis if needed)
- Automatic cleanup every 5 minutes
- Standard rate limit headers (X-RateLimit-Limit, Remaining, Reset, Retry-After)
- Identifier-based isolation with optional prefixes
- Test coverage: 81.81% statements, 88.88% branches

### 3. ~~**Environment Variable Validation Not Centralized**~~ ✅ RESOLVED

**Severity:** MEDIUM → **FIXED**  
**Status:** ✅ Completed November 22, 2025

**Original Issue:**  
Environment variables were validated ad-hoc throughout the codebase. Missing or invalid values could cause runtime errors.

**Resolution Implemented:**
Created centralized environment variable validation using Zod schemas:

**Files Created:**

- ✅ `src/lib/env.ts` - Server and client env validation with Zod
- ✅ `src/lib/__tests__/env.test.ts` - Comprehensive test coverage (5 tests)

**Implementation Details:**

```typescript
// Server environment schema
const serverEnvSchema = z.object({
  LOGTO_ENDPOINT: z.string().url(),
  LOGTO_APP_ID: z.string().min(1),
  LOGTO_APP_SECRET: z.string().min(1),
  LOGTO_M2M_APP_ID: z.string().min(1),
  LOGTO_M2M_APP_SECRET: z.string().min(1),
  LOGTO_M2M_ENDPOINT: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
});

// Client environment schema
const clientEnvSchema = z.object({
  NEXT_PUBLIC_TURING_API: z.string().url(),
  NEXT_PUBLIC_LOGTO_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_LOGTO_APP_ID: z.string().min(1),
});

export function getServerEnv(): ServerEnv {
  /* validation */
}
export function getClientEnv(): ClientEnv {
  /* validation */
}
```

**Features:**

- Type-safe environment variable access with `ServerEnv` and `ClientEnv` types
- Server-side only enforcement (throws error if called on client)
- Helpful error messages showing which variables are missing/invalid
- URL validation for endpoints
- Minimum length validation for secrets (NEXTAUTH_SECRET ≥ 32 chars)
- Test coverage: 90.47% statements, 100% branches

### 4. ~~**No Content Security Policy (CSP)**~~ ✅ RESOLVED

**Severity:** MEDIUM → **FIXED**  
**Status:** ✅ Completed November 22, 2025

**Original Issue:**  
No Content Security Policy headers were configured, which could allow XSS attacks if any vulnerabilities are introduced.

**Resolution Implemented:**
Added comprehensive security headers to Next.js configuration:

**Files Updated:**

- ✅ `next.config.ts` - Added async headers() function with security headers

**Implementation Details:**

```typescript
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' https://*.logto.io https://api.turingbio.com",
            "frame-ancestors 'none'",
          ].join("; "),
        },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
      ],
    },
  ];
}
```

**Security Headers Added:**

- Content-Security-Policy with Next.js-compatible directives
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Restricts camera, microphone, geolocation
- X-XSS-Protection: 1; mode=block

---

## Low Priority Issues

### 5. **File Upload Size Validation Only on Client**

**Severity:** LOW  
**File:** `src/components/file-upload/file-uploader.tsx`

**Issue:**  
File size validation (5GB limit) is only enforced client-side via react-dropzone. A malicious user could bypass this by directly calling the upload API.

**Recommendation:**  
Ensure the backend API also validates file sizes and rejects oversized uploads. The TUS protocol should handle this, but verify backend enforcement.

### 6. **Missing CSRF Protection Documentation**

**Severity:** LOW

**Issue:**  
No explicit CSRF protection mentioned. Next.js API routes don't have built-in CSRF tokens.

**Current State:**  
Logto session cookies should provide some protection, but custom API routes may be vulnerable.

**Recommendation:**

```typescript
// For state-changing operations, verify origin header
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (origin && !origin.includes(host)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // ... rest of handler
}
```

### 7. **Error Messages May Leak Implementation Details**

**Severity:** LOW  
**Files:** Various API routes

**Issue:**  
Some error messages include stack traces or detailed error information that could help attackers.

**Example:**

```typescript
// src/app/api/logto/token/route.ts line 94
throw new Error(`Token fetch failed: ${tokenResponse.status} - ${errorText}`);
```

**Recommendation:**

```typescript
// In production, sanitize error messages
if (process.env.NODE_ENV === "production") {
  return NextResponse.json({ error: "Token fetch failed" }, { status: 500 });
} else {
  return NextResponse.json(
    { error: `Token fetch failed: ${tokenResponse.status} - ${errorText}` },
    { status: 500 },
  );
}
```

---

## Security Best Practices Already Implemented ✅

1. **Authentication Required for Token Endpoint**
   - `/api/logto/token` verifies user authentication before issuing tokens
   - Proper HTTP-only cookie usage via Logto

2. **No localStorage/sessionStorage for Tokens**
   - Tokens managed server-side and via secure context
   - No client-side token storage vulnerabilities

3. **No Obvious XSS Vulnerabilities**
   - No `dangerouslySetInnerHTML` usage found
   - No direct HTML injection patterns
   - React's automatic escaping provides protection

4. **Environment Variables Properly Namespaced**
   - Public variables prefixed with `NEXT_PUBLIC_`
   - Secrets properly separated from client code

5. **HTTPS-Only Cookies in Production**
   - `cookieSecure: process.env.NODE_ENV === "production"`

6. **Structured Logging with Sentry Integration**
   - Errors automatically tracked
   - Production logs structured as JSON

7. **Token Refresh Mechanism**
   - Proper token refresh flow implemented
   - Stale token handling

8. **Input Validation on File Uploads**
   - Accept specific file types only
   - Size limits enforced (client-side)

---

## Recommendations Summary

### Immediate Actions (High Priority)

1. ~~Replace `console.log` with `logger` in token route~~ ✅ **COMPLETED**
2. ~~Remove or guard token claims logging~~ ✅ **COMPLETED**

### Short Term (Medium Priority)

1. ~~Add rate limiting to token endpoint~~ ✅ **COMPLETED**
2. ~~Implement centralized environment variable validation~~ ✅ **COMPLETED**
3. ~~Add Content Security Policy headers~~ ✅ **COMPLETED**
4. ~~Add security headers (X-Frame-Options, etc.)~~ ✅ **COMPLETED**

### Long Term (Low Priority)

1. Verify backend file size validation
2. Document CSRF protection strategy
3. Sanitize production error messages
4. Consider adding request logging for audit trail

---

## Conclusion

The application demonstrates strong security fundamentals with proper authentication, secure token handling, and no critical vulnerabilities. The main areas for improvement are around production logging practices, rate limiting, and defense-in-depth headers.

**Overall Risk Level:** LOW ✅

The recommendations above will further strengthen the security posture and align with industry best practices for production web applications.
