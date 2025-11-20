# Logging & Monitoring Guide

## Overview

This project uses a dual approach for logging and error tracking:

- **Pino** for structured application logging
- **Sentry** for error tracking, performance monitoring, and session replay

## Pino Logger

### Usage

```typescript
import { logger } from "@/lib/logger";

// Info logs (general application flow)
logger.info({ userId: "123", action: "upload" }, "User uploaded file");

// Warning logs (non-critical issues)
logger.warn({ projectId: "abc" }, "Project approaching storage limit");

// Error logs (critical issues - automatically sent to Sentry)
logger.error({ error, userId, context }, "Failed to process dataset");

// Debug logs (development only)
logger.debug({ data }, "Processing intermediate results");
```

### Helper Functions

```typescript
import { logApiRequest, logComponentError } from "@/lib/logger";

// Log API calls with timing
logApiRequest("POST", "/api/datasets", {
  status: 200,
  duration: 1250,
});

// Log React component errors
logComponentError("FileUploader", error, errorInfo);
```

### Log Levels

- **trace**: Very verbose (dev only)
- **debug**: Debugging info (dev only)
- **info**: General application flow
- **warn**: Non-critical issues
- **error**: Critical errors (sent to Sentry)

### Environment Variables

```bash
# Set log level (default: "info" in production, "debug" in development)
LOG_LEVEL=debug
```

## Sentry Integration

### Automatic Error Tracking

Sentry automatically captures:

- Uncaught exceptions
- Unhandled promise rejections
- React component errors (via Error Boundaries)
- API errors (>= 400 status codes)

### Manual Error Tracking

```typescript
import * as Sentry from "@sentry/nextjs";

// Capture exception with context
try {
  await processDataset(data);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: "dataset-processor" },
    contexts: {
      dataset: { id: datasetId, size: data.length },
    },
  });
  throw error;
}

// Capture message
Sentry.captureMessage("User completed onboarding", "info");

// Add breadcrumbs
Sentry.addBreadcrumb({
  category: "upload",
  message: "Started file upload",
  level: "info",
  data: { fileSize: file.size },
});
```

### Performance Monitoring

```typescript
import * as Sentry from "@sentry/nextjs";

// Trace a long-running operation
const transaction = Sentry.startTransaction({
  op: "process-dataset",
  name: "Dataset Processing Pipeline",
});

try {
  await processDataset();
  transaction.setStatus("ok");
} catch (error) {
  transaction.setStatus("internal_error");
  throw error;
} finally {
  transaction.finish();
}
```

### User Context

```typescript
import * as Sentry from "@sentry/nextjs";

// Set user context after authentication
Sentry.setUser({
  id: userId,
  email: userEmail,
  username: userName,
});

// Clear user context on sign-out
Sentry.setUser(null);
```

## Testing Sentry Setup

After deployment, visit `/sentry-example-page` to test:

1. Client-side error capture
2. Server-side error capture
3. API route error capture

Delete this page in production:

- `src/app/sentry-example-page/page.tsx`
- `src/app/api/sentry-example-api/route.ts`

## Configuration Files

### Sentry Config Files

- `sentry.client.config.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration
- `src/instrumentation.ts` - Server instrumentation
- `src/instrumentation-client.ts` - Client instrumentation

### Environment Variables (Required)

```bash
# Public DSN for client-side error reporting
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# For uploading source maps (CI/CD only, DO NOT commit)
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=turing-biosciences
SENTRY_PROJECT=javascript-nextjs
```

## Best Practices

### 1. Use Structured Logging

❌ **Bad:**

```typescript
console.log("User uploaded file with size:", fileSize);
```

✅ **Good:**

```typescript
logger.info(
  {
    userId,
    projectId,
    fileName: file.name,
    fileSize: file.size,
  },
  "User uploaded file"
);
```

### 2. Add Context to Errors

❌ **Bad:**

```typescript
catch (error) {
  logger.error(error);
}
```

✅ **Good:**

```typescript
catch (error) {
  logger.error({
    error,
    userId,
    projectId,
    operation: "dataset-upload"
  }, "Failed to upload dataset");
}
```

### 3. Use Appropriate Log Levels

- **Debug**: Development debugging only
- **Info**: Normal application flow
- **Warn**: Recoverable issues (retry needed, deprecated API used)
- **Error**: Unrecoverable errors that need attention

### 4. Never Log Sensitive Data

❌ **Never log:**

- Passwords
- API keys
- Auth tokens
- PII (unless necessary and anonymized)

### 5. Use Sentry User Context

```typescript
// Set after successful login
Sentry.setUser({ id: userId, email: userEmail });

// Clear on logout
Sentry.setUser(null);
```

## Cost Management

### Sentry Free Tier Limits

- **5,000 errors/month**
- **10,000 performance transactions/month**
- **30-day retention**

### Tips to Stay Within Limits

1. **Filter noisy errors** in Sentry dashboard
2. **Sample performance monitoring** (default: 10%)
3. **Use rate limiting** for high-frequency errors
4. **Enable beforeSend filter** to drop low-priority errors

```typescript
// In sentry.*.config.ts
Sentry.init({
  beforeSend(event, hint) {
    // Drop errors from bots
    if (event.request?.headers?.["user-agent"]?.includes("bot")) {
      return null;
    }
    return event;
  },

  // Sample 10% of transactions
  tracesSampleRate: 0.1,
});
```

## Monitoring Dashboard

### Sentry Dashboard

1. Go to https://sentry.io
2. Select your project
3. View:
   - **Issues**: All captured errors
   - **Performance**: API response times, database queries
   - **Replays**: Session recordings (when enabled)
   - **Releases**: Track errors by deployment

### Log Analysis (Development)

Logs are output to console in development with pretty formatting:

```
[12:34:56] INFO: User uploaded file
  userId: "123"
  projectId: "abc-456"
  fileName: "dataset.csv"
  fileSize: 5000000
```

### Log Analysis (Production)

In production, logs are structured JSON:

```json
{
  "level": 30,
  "time": "2025-11-13T12:34:56.789Z",
  "msg": "User uploaded file",
  "userId": "123",
  "projectId": "abc-456",
  "fileName": "dataset.csv",
  "fileSize": 5000000
}
```

For production log aggregation, consider:

- **Vercel Logs** (if hosting on Vercel)
- **Better Stack** (Logtail)
- **Axiom**
- **Datadog** (larger scale)

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify you're not in test environment (logs disabled)
3. Check browser console for client-side logs

### Sentry Not Capturing Errors

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set
2. Check Sentry dashboard for rate limits
3. Verify error isn't filtered by `beforeSend`
4. Check network tab for Sentry requests

### Source Maps Not Uploading

1. Verify `SENTRY_AUTH_TOKEN` is set in CI/CD
2. Check build logs for upload errors
3. Ensure `@sentry/nextjs` is in dependencies (not devDependencies)

## Further Reading

- [Pino Documentation](https://getpino.io)
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)
