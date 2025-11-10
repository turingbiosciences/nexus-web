# Testing Scripts

This directory contains diagnostic scripts for testing authentication and token retrieval.

## User Token Test (Primary)

**Command**: `npm run test:token`

**Purpose**: Tests the actual user authentication flow used by your app

**What it does**:

- Checks if a user is signed in via browser cookies
- Verifies access token can be obtained for the API resource
- Analyzes token contents (audience, scopes, expiration)
- Provides actionable suggestions if token retrieval fails

**Prerequisites**:

1. Dev server must be running (`npm run dev`)
2. You must be signed in at http://localhost:3000

**Example Success Output**:

```
✅ User is authenticated!
✅ SUCCESS! Access token is available

Token Information:
  Length: 850 bytes
  Audience: https://nexus-api-xxo8b.ondigitalocean.app
  Audience Match: ✅ YES
```

**Example Failure Output**:

```
❌ FAILED: No access token available

Common Causes:
  1. API resource not configured in Logto Console
  2. API resource not assigned to application
  3. Current session created before API resource was configured
```

**When to use**:

- After configuring API resource in Logto Console
- After signing out and signing back in
- When debugging token acquisition issues
- To verify your setup before deploying

---

## M2M Token Test (Diagnostic)

**Command**: `npm run test:token:m2m`

**Purpose**: Tests machine-to-machine (M2M) OAuth flow

**What it does**:

- Tests client_credentials grant type
- Verifies Logto endpoint is accessible
- Checks if M2M authentication is enabled

**Expected Result**: ❌ "Grant type not allowed" error

**Why it fails**: Your app uses `authorization_code` flow (user login), not `client_credentials` (M2M). This is correct and expected!

**Example Output**:

```
❌ ERROR: Token exchange failed
error: invalid_request
error_description: requested grant type is not allowed for this client

ℹ️  This is EXPECTED for user-facing applications!
• client_credentials is for machine-to-machine (M2M) authentication
• Your app uses authorization_code flow (user login) instead
```

**When to use**:

- Verifying Logto endpoint connectivity
- Testing if M2M is configured (if you need it for backend services)
- Troubleshooting basic Logto connection issues

**To enable M2M** (optional, only if you need backend-to-backend auth):

1. Logto Console → Applications → Your App
2. Machine-to-Machine tab
3. Enable client_credentials grant type

---

## Quick Reference

| Command                  | OAuth Flow                | Expected Result      | Use Case        |
| ------------------------ | ------------------------- | -------------------- | --------------- |
| `npm run test:token`     | authorization_code (user) | ✅ Token obtained    | Primary testing |
| `npm run test:token:m2m` | client_credentials (M2M)  | ❌ Grant not allowed | Diagnostic only |

## Troubleshooting

### "Dev server is not running"

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run test
npm run test:token
```

### "User is not authenticated"

1. Open http://localhost:3000
2. Click "Sign In"
3. Complete authentication
4. Run test again

### "No access token available"

This is the main issue! Follow the suggestions in the test output:

1. **Configure API Resource in Logto Console**

   - Go to https://q98adz.logto.app/
   - Navigate to API Resources
   - Create resource: `https://nexus-api-xxo8b.ondigitalocean.app`

2. **Assign to Application**

   - Go to Applications → Your App
   - API Resources tab
   - Add the resource

3. **Refresh Session**
   - Sign out
   - Sign back in
   - Run test again

## Files

- `test-user-token.ts` - Tests user authentication flow (main)
- `test-token-exchange.ts` - Tests M2M flow (diagnostic)
- `README.md` - This file
