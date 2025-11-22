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

### 1. **Sensitive Data in Console Logs**
**Severity:** HIGH  
**Files Affected:**
- `src/app/api/logto/token/route.ts` (lines 65, 104, 113, 120)

**Issue:**
Debug logging may expose sensitive token information in production environments:
```typescript
console.log("[logto:token] Config validated:", {
  endpoint: requiredEnvVars.LOGTO_ENDPOINT,
  m2mAppId: requiredEnvVars.LOGTO_M2M_APP_ID,
  resource: requiredEnvVars.LOGTO_M2M_ENDPOINT,
});

console.log("[logto:token] ✅ M2M token obtained successfully");

// JWT decoding in debug mode
console.log("[logto:token] Token claims:", { ... });
```

**Risk:**  
- Token claims and configuration exposed in browser/server logs
- Potential information disclosure if logs are compromised
- JWT structure reveals internal API design

**Recommendation:**
```typescript
// Use logger instead of console.log with appropriate levels
import { logger } from "@/lib/logger";

// Only log in development
if (process.env.NODE_ENV === "development") {
  logger.debug({ 
    endpoint: requiredEnvVars.LOGTO_ENDPOINT,
    m2mAppId: requiredEnvVars.LOGTO_M2M_APP_ID,
  }, "M2M config validated");
}

// Remove token claims logging entirely or make it admin-only
// Never log actual token values
```

---

## Medium Priority Issues

### 2. **Missing Rate Limiting on Token Endpoint**
**Severity:** MEDIUM  
**File:** `src/app/api/logto/token/route.ts`

**Issue:**  
The `/api/logto/token` endpoint has authentication but no rate limiting. An authenticated user could potentially abuse this endpoint to generate excessive M2M tokens.

**Recommendation:**
```typescript
// Add rate limiting middleware or use a library like next-rate-limit
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

export const GET = async (req: NextRequest) => {
  const ip = req.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
  
  // ... rest of handler
};
```

### 3. **Environment Variable Validation Not Centralized**
**Severity:** MEDIUM  
**Files:** Multiple API and lib files

**Issue:**  
Environment variables are validated ad-hoc throughout the codebase. Missing or invalid values could cause runtime errors.

**Current State:**
- `src/lib/api/utils.ts` validates `NEXT_PUBLIC_TURING_API`
- `src/app/api/logto/token/route.ts` validates M2M variables
- Other files may assume variables exist

**Recommendation:**
```typescript
// src/lib/env-validation.ts
import { z } from "zod";

const envSchema = z.object({
  LOGTO_ENDPOINT: z.string().url(),
  LOGTO_APP_ID: z.string().min(1),
  LOGTO_APP_SECRET: z.string().min(1),
  LOGTO_M2M_APP_ID: z.string().min(1),
  LOGTO_M2M_APP_SECRET: z.string().min(1),
  LOGTO_M2M_ENDPOINT: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_TURING_API: z.string().url(),
  NEXT_PUBLIC_LOGTO_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_LOGTO_APP_ID: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]),
});

export const env = envSchema.parse(process.env);
```

### 4. **No Content Security Policy (CSP)**
**Severity:** MEDIUM  
**File:** Missing

**Issue:**  
No Content Security Policy headers are configured, which could allow XSS attacks if any vulnerabilities are introduced.

**Recommendation:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-inline needed for Next.js
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.logto.io https://api.turingbio.com",
              "frame-ancestors 'none'",
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
};
```

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
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  
  if (origin && !origin.includes(host)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403 }
    );
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
  return NextResponse.json(
    { error: "Token fetch failed" },
    { status: 500 }
  );
} else {
  return NextResponse.json(
    { error: `Token fetch failed: ${tokenResponse.status} - ${errorText}` },
    { status: 500 }
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
1. Replace `console.log` with `logger` in token route
2. Remove or guard token claims logging
3. Add rate limiting to token endpoint

### Short Term (Medium Priority)
4. Implement centralized environment variable validation
5. Add Content Security Policy headers
6. Add security headers (X-Frame-Options, etc.)

### Long Term (Low Priority)
7. Verify backend file size validation
8. Document CSRF protection strategy
9. Sanitize production error messages
10. Consider adding request logging for audit trail

---

## Conclusion

The application demonstrates strong security fundamentals with proper authentication, secure token handling, and no critical vulnerabilities. The main areas for improvement are around production logging practices, rate limiting, and defense-in-depth headers.

**Overall Risk Level:** LOW ✅

The recommendations above will further strengthen the security posture and align with industry best practices for production web applications.
