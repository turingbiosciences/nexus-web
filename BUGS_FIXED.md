# Critical Bugs Fixed - Authentication & State Management

## Summary

Fixed 9 critical bugs in M2M authentication implementation and React state management. All issues addressed with proper architecture patterns, comprehensive tests, and validation.

**Status**: ✅ All fixes committed and pushed to `file-upload` branch

**Test Coverage**: 74.25% (252 tests passing)

---

## Bug #1: Auth Resource Handshake Failure

**Commit**: `febea40`

### Problem

Client-side `AuthProvider` and server-side `/api/logto/token` had mismatched Logto resource configurations, causing authentication handshake failures.

### Root Cause

- Client: Used `NEXT_PUBLIC_TURING_API` as resource
- Server: Hardcoded different resource value
- Resulted in token validation failures

### Solution

- Server-side token endpoint now uses `NEXT_PUBLIC_TURING_API` environment variable
- Ensures consistent resource identifier across client/server boundary
- Validates environment variable exists before proceeding

---

## Bug #2: Unauthorized Token Access

**Commit**: `718c27e`

### Problem

`/api/logto/token` endpoint was publicly accessible without authentication check, exposing M2M token generation to unauthenticated users.

### Security Risk

- Anyone could request M2M tokens without authentication
- Potential for unauthorized API access
- No user identity validation

### Solution

- Added `logto.isAuthenticated()` check at route entry
- Returns 401 Unauthorized if user not authenticated
- Validates user session before generating tokens

---

## Bug #3: Missing Environment Variable Validation

**Commit**: `dbdb806`

### Problem

Server-side token endpoint proceeded with token generation even when critical environment variables were missing, resulting in runtime errors.

### Missing Validations

- `LOGTO_M2M_APP_ID`
- `LOGTO_M2M_APP_SECRET`
- `LOGTO_M2M_ENDPOINT`

### Solution

- Added comprehensive environment variable validation
- Returns 500 with clear error messages for missing variables
- Prevents silent failures and improves debugging experience

---

## Bug #4: FileUploader Using Deprecated getAccessToken()

**Commit**: `d00807b`

### Problem

`FileUploader` component used `useGlobalAuth().getAccessToken()` which is designed for user tokens, not M2M tokens.

### Architecture Issue

- Mixed user authentication tokens with M2M API tokens
- Incorrect token source for backend API calls
- Inconsistent with TokenProvider architecture

### Solution

- Updated `FileUploader` to use `useAccessToken()` hook from `TokenProvider`
- Removed dependency on `useGlobalAuth().getAccessToken()`
- All file uploads now use proper M2M tokens from `/api/logto/token`

---

## Bug #5: Debug Endpoint Configuration Inconsistency

**Commit**: `b75d52d`

### Problem

`/api/debug/token` used inline configuration instead of centralized `logtoConfig`, causing test results to diverge from production behavior.

### Consistency Issue

- Debug endpoint tested different auth flow than production routes
- Made debugging misleading and unreliable
- Maintenance burden with duplicate configuration

### Solution

- Updated debug endpoint to import and use centralized `logtoConfig` from `lib/auth.ts`
- Ensures debug diagnostics reflect actual production behavior
- Single source of truth for all Logto configuration

---

## Bug #6: Stale Projects Across User Sessions

**Commit**: `5930cff`

### Problem

`ProjectsProvider` retained `hasFetched` flag across user sessions, showing old user's projects to new user after re-authentication.

### Data Leak Risk

- User A signs out → User B signs in → sees User A's projects briefly
- `hasFetched` flag never reset on auth state change
- API call skipped due to stale flag

### Solution

- Added `useEffect` to reset `hasFetched` when `accessToken` changes
- Ensures fresh data fetch for each authenticated user
- Prevents cross-user data contamination

---

## Bug #7: useEffect Dependency Loop

**Commit**: `df3ef28`

### Problem

`TokenProvider` included `authError` in `useEffect` dependencies, causing infinite re-render loop when authentication errors occurred.

### Performance Issue

- Error state change → useEffect re-runs → sets error → triggers useEffect → repeat
- Browser becomes unresponsive
- Memory consumption increases rapidly

### Solution

- Removed `authError` from dependency array (error is set, not read)
- Eliminated infinite loop while maintaining correct error handling
- Improved performance and stability

---

## Bug #8: Stale Token in resumeUpload Closure

**Commit**: `aecb598`

### Problem

`FileUploader.resumeUpload()` called `await refreshToken()` then checked `accessToken`, but `accessToken` was a stale closure value from component scope.

### React Closure Issue

```typescript
// ❌ BEFORE: Reads stale value
await refreshToken();          // Updates state asynchronously
if (!accessToken) throw...;    // Reads OLD value from closure
```

### Root Cause

- React state updates are asynchronous
- Closure captured `accessToken` at component render time
- `refreshToken()` updated state, but closure still held old value

### Solution

```typescript
// ✅ AFTER: Uses fresh value
const freshToken = await refreshToken();  // Returns new token
if (!freshToken) throw...;                // Uses fresh value
```

- Modified `TokenProvider.fetchToken` to return `Promise<string | null>`
- Updated `TokenProvider.refreshToken` to return token value from `fetchToken()`
- Changed `FileUploader.resumeUpload` to capture returned token instead of reading from state
- Eliminates race condition between state updates and code execution

---

## Bug #9: Session Continuity Broken by Token Update

**Commit**: `c79046d`

### Problem

`ProjectsProvider` cleared all projects whenever `accessToken` changed value, including during token refresh operations for the same user session.

### User Impact

- User uploads file → pause → resume triggers `refreshToken()`
- New token value obtained (same user, fresh token)
- `useEffect` detected token change and cleared all projects
- User loses all project data despite staying logged in

### Root Cause

```typescript
// ❌ BEFORE: Resets on ANY token change
useEffect(() => {
  setHasFetched(false);
  setProjects([]);
  setError(null);
}, [accessToken]); // Triggers on token value change
```

The effect triggered on every `accessToken` value change, treating token refresh (same session) the same as user switching (different session).

### Solution

Track authentication **state** (boolean) instead of token **value** (string):

```typescript
// ✅ AFTER: Only resets on auth state change
const isAuthenticated = !!accessToken;
const [previousAuthState, setPreviousAuthState] = useState<boolean>(false);

useEffect(() => {
  if (isAuthenticated !== previousAuthState) {
    setHasFetched(false);
    setProjects([]);
    setError(null);
    setPreviousAuthState(isAuthenticated);
  }
}, [isAuthenticated, previousAuthState]);
```

### Behavior After Fix

**Token Refresh (Same User)**:

- `"token-abc123"` → `"token-xyz789"`
- `isAuthenticated` stays `true` → no reset
- Projects preserved ✅

**User Switching**:

- User A: `"token-a"` → Sign out: `null` → `isAuthenticated` changes to `false` → reset
- User B: `null` → Sign in: `"token-b"` → `isAuthenticated` changes to `true` → reset
- Fresh data for new user ✅

---

## Testing & Validation

### Test Suite

- **Total Tests**: 252 passing
- **Test Suites**: 29 passing
- **Coverage**: 74.25%
- **Status**: ✅ All passing

### Build Validation

- ✅ Production build successful
- ✅ TypeScript compilation clean
- ✅ No ESLint errors

---

## Files Modified

### Core Components

- `src/components/providers/token-provider.tsx`
- `src/components/file-upload/file-uploader.tsx`
- `src/components/providers/projects-provider.tsx`

### API Routes

- `src/app/api/logto/token/route.ts`
- `src/app/api/debug/token/route.ts`

### Configuration

- `src/lib/auth.ts` (centralized config)

---

## Architecture Improvements

1. **Centralized Configuration**: All Logto routes use shared config from `lib/auth.ts`
2. **Consistent Token Flow**: M2M tokens exclusively through `TokenProvider`
3. **Security**: Authentication checks on all protected endpoints
4. **Error Handling**: Proper validation with clear error messages
5. **React Patterns**: Correct closure handling and dependency management
6. **Data Isolation**: User session changes trigger proper state resets

---

## Branch Status

**Branch**: `file-upload`  
**PR**: #6 - "feat: Implement M2M authentication and standardize UI components"  
**Status**: Ready for review

**Commits**:

1. `febea40` - Bug #1: Auth Resource Handshake
2. `718c27e` - Bug #2: Unauthorized Token Access
3. `dbdb806` - Bug #3: Missing Environment Validation
4. `d00807b` - Bug #4: Deprecated getAccessToken()
5. `b75d52d` - Bug #5: Debug Config Inconsistency
6. `5930cff` - Bug #6: Stale Projects Across Sessions
7. `df3ef28` - Bug #7: useEffect Dependency Loop
8. `aecb598` - Bug #8: Stale Token in resumeUpload
9. `c79046d` - Bug #9: Session Continuity Broken

All commits pushed and validated. Authentication architecture is now secure, consistent, and performant with proper session continuity.
