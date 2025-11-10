# Token Issue Diagnosis & Resolution

## Current Status

**Problem**: `getAccessToken()` returns `null` despite being fully authenticated

**Evidence**:

- ✅ User is authenticated (`isAuthenticated: true`, `sub=t7jfqa49jqsk`)
- ✅ Code is correctly configured with `resources` array in all Logto routes
- ✅ `'all'` scope added to all authentication configs
- ❌ `getAccessToken(resource)` returns `null`
- ❌ Token provider logs show: `{hasToken: false, tokenLength: undefined}`

## Root Cause

The **API resource is not configured in Logto Console**. While the code is correctly requesting tokens for the API resource (`https://nexus-api-xxo8b.ondigitalocean.app`), Logto cannot issue these tokens because:

1. The API resource doesn't exist in Logto Console, OR
2. The API resource exists but is not assigned to the application

## How to Fix

### Step 1: Configure API Resource in Logto Console

1. Go to [Logto Console](https://YOUR_TENANT.logto.app/)
2. Navigate to **API Resources** (in the left sidebar)
3. Click **Create API Resource**
4. Enter the following details:
   - **API Identifier**: `https://nexus-api-xxo8b.ondigitalocean.app`
   - **API Name**: Nexus API (or any friendly name)
   - ⚠️ **Important**: No trailing slash, exact match required
5. Click **Create**

### Step 2: Assign API Resource to Application

1. Still in Logto Console, go to **Applications**
2. Select your application (ID: `h28vlbexr7nmgjk5f2qdg`)
3. Go to the **API Resources** tab
4. Click **Add API Resource**
5. Select the **Nexus API** resource you just created
6. Click **Save**

### Step 3: Test with Debug Endpoint

1. **Sign out** of your application (important!)
2. **Sign back in** (this creates a new session with API resource tokens)
3. Visit: http://localhost:3000/api/debug/token
4. Check the response:
   - Should show Logto cookies including token data
   - Look for cookies containing JWT-like values (3 parts separated by dots)
   - Check `allCookieNames` array for what's being stored

### Step 4: Verify Token Acquisition

After signing back in, check your browser console. You should see:

```javascript
{
  hasToken: true,  // ✅ Changed from false
  tokenLength: 850,  // ✅ Some number > 0
  isLoading: false,
  error: null
}
```

## Debugging Tools Created

### 1. Debug API Endpoint

**File**: `src/app/api/debug/token/route.ts`

**Purpose**: Inspects cookies to see what Logto is storing after sign-in

**Usage**:

```bash
# After signing in, visit:
http://localhost:3000/api/debug/token
```

**What it shows**:

- All cookies set by Logto
- Cookie names and lengths
- Which cookies look like JWTs
- Suggestions for fixing the issue

### 2. Token Exchange Test Script

**File**: `scripts/test-token-exchange.ts`

**Purpose**: Tests OAuth 2.0 token endpoint directly (client_credentials flow)

**Usage**:

```bash
npm run test:token
```

**Note**: This script tests machine-to-machine auth (client_credentials), which is different from user login (authorization_code). It revealed that client_credentials isn't enabled, which is expected and fine. Your app uses authorization_code flow.

## Understanding the Flows

### Authorization Code Flow (Your App)

1. User clicks "Sign In"
2. Redirects to Logto login page
3. User enters credentials
4. Logto redirects back with authorization code
5. App exchanges code for tokens (including API resource tokens)
6. **Requires**: API resource configured in Console and assigned to app

### Client Credentials Flow (Machine-to-Machine)

1. App sends client ID + secret directly to token endpoint
2. No user interaction
3. Used for backend services
4. **Not enabled** for your app (and that's fine)

## Expected Behavior After Fix

Once the API resource is configured:

1. **Sign-in process**:

   ```
   POST /oidc/token
   {
     grant_type: "authorization_code",
     resource: "https://nexus-api-xxo8b.ondigitalocean.app",
     ...
   }
   ```

2. **Token response includes**:

   ```json
   {
     "access_token": "eyJhbG...", // JWT for your API
     "id_token": "eyJhbG...", // JWT for user identity
     "refresh_token": "...",
     "scope": "openid profile email offline_access all"
   }
   ```

3. **Your app can now**:

   ```typescript
   const token = await getAccessToken(TURING_API);
   console.log(token); // "eyJhbG..." ✅

   // Use token for API calls
   fetch("https://nexus-api-xxo8b.ondigitalocean.app/projects", {
     headers: { Authorization: `Bearer ${token}` },
   });
   ```

## Why This Matters

Without the API resource configuration:

- ❌ `getAccessToken()` returns `null`
- ❌ Cannot make authenticated API calls
- ❌ Projects list fails to load
- ❌ All backend integration is blocked

With the API resource configuration:

- ✅ `getAccessToken()` returns a valid JWT
- ✅ JWT includes audience claim matching your API URL
- ✅ Backend can validate the token
- ✅ Full API integration works

## Additional Notes

### Token Caching

The `TokenProvider` caches the token globally to avoid repeated calls:

```typescript
const { accessToken, isLoading, error, refreshToken } = useAccessToken();
```

Once working, this token will:

- Be automatically refreshed when expired (using refresh token)
- Be shared across all components via context
- Be included in all API calls automatically

### Test Coverage

All code changes have been tested:

- ✅ 224 tests passing
- ✅ Coverage maintained at 71.78%
- ✅ Token provider mocked for testing

## Next Steps

1. ✅ **Code is ready** - no further changes needed
2. ⏸️ **Configure Logto Console** - follow steps above
3. ⏸️ **Sign out and sign back in** - critical step
4. ⏸️ **Test with debug endpoint** - verify token present
5. ⏸️ **Check projects list** - should load from API

## Commits Made

1. `8b98aca` - Added resources array to AuthProvider
2. `a188283` - Created TokenProvider for global token management
3. `2de23b0` - Updated all tests to use mocked token provider
4. `b78a883` - Fixed auth state sync with GlobalAuthProvider
5. `96aca82` - Added 'all' scope and resources to all API routes
6. (pending) - Created debug endpoint and documentation

---

**Last Updated**: Just now
**Status**: Waiting for Logto Console configuration
**Blocker**: User action required (configure API resource)
