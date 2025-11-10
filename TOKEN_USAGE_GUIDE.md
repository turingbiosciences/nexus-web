# Token Provider Usage Guide

## Overview

The `TokenProvider` centralizes access token management throughout your application. It fetches the token once when the user authenticates and makes it available globally via the `useAccessToken()` hook.

## Architecture

```
AuthProvider (Logto authentication)
  └── TokenProvider (Token caching & management)
        └── Your app components
```

## Basic Usage

### In any component or provider:

```typescript
import { useAccessToken } from "@/components/providers/token-provider";

function MyComponent() {
  const { accessToken, isLoading, error, refreshToken } = useAccessToken();

  if (isLoading) return <div>Loading authentication...</div>;
  if (error) return <div>Auth error: {error.message}</div>;
  if (!accessToken) return <div>Please sign in</div>;

  // Use the token for API calls
  const fetchData = async () => {
    const response = await fetch(`${API_URL}/endpoint`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  };

  return <div>Authenticated content</div>;
}
```

## API Reference

### `useAccessToken()` Hook

Returns an object with:

- **`accessToken`**: `string | null` - The JWT access token for your API resource
- **`isLoading`**: `boolean` - True while fetching the token
- **`error`**: `Error | null` - Any error that occurred during token fetch
- **`refreshToken`**: `() => Promise<void>` - Function to manually refresh the token

## Examples

### Example 1: Making API Calls

```typescript
import { useAccessToken } from "@/components/providers/token-provider";

function DataFetcher() {
  const { accessToken } = useAccessToken();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!accessToken) return;

    fetch(`${process.env.NEXT_PUBLIC_TURING_API}/data`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then(setData);
  }, [accessToken]);

  return <div>{JSON.stringify(data)}</div>;
}
```

### Example 2: File Upload with Token

```typescript
import { useAccessToken } from "@/components/providers/token-provider";
import * as tus from "tus-js-client";

function FileUploader() {
  const { accessToken } = useAccessToken();

  const uploadFile = (file: File) => {
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const upload = new tus.Upload(file, {
      endpoint: `${process.env.NEXT_PUBLIC_TURING_API}/uploads`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      metadata: {
        filename: file.name,
        filetype: file.type,
      },
      onSuccess: () => {
        console.log("Upload complete!");
      },
    });

    upload.start();
  };

  return <input type="file" onChange={(e) => uploadFile(e.target.files[0])} />;
}
```

### Example 3: Handling Token Refresh

```typescript
import { useAccessToken } from "@/components/providers/token-provider";

function DataManager() {
  const { accessToken, refreshToken } = useAccessToken();

  const saveData = async (data: any) => {
    try {
      const response = await fetch(`${API_URL}/save`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status === 401) {
        // Token might be expired, try refreshing
        await refreshToken();
        // Retry the request
        return saveData(data);
      }

      return response.json();
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  };

  return <button onClick={() => saveData({ foo: "bar" })}>Save</button>;
}
```

## Important Notes

### Token Lifecycle

1. **On Sign In**: `TokenProvider` automatically fetches the token
2. **On Sign Out**: Token is cleared (`accessToken` becomes `null`)
3. **On Expiry**: Logto SDK automatically handles refresh tokens
4. **Manual Refresh**: Call `refreshToken()` if needed

### Error Handling

The token provider will set an error if:

- User is not authenticated
- Token fetch fails
- Logto configuration is incorrect

Always check for `error` before using `accessToken`:

```typescript
const { accessToken, error } = useAccessToken();

if (error) {
  // Handle error: show message, redirect to sign in, etc.
  return <ErrorMessage error={error} />;
}
```

### Testing

When testing components that use `useAccessToken()`, mock it:

```typescript
jest.mock("@/components/providers/token-provider", () => ({
  useAccessToken: () => ({
    accessToken: "mock-token",
    isLoading: false,
    error: null,
    refreshToken: jest.fn(),
  }),
}));
```

## Benefits Over Direct `getAccessToken()` Calls

1. **Single Fetch**: Token fetched once and cached globally
2. **No Prop Drilling**: Available via hook anywhere in the app
3. **Simpler Code**: No need to handle token fetching in every component
4. **Better Performance**: Reduces redundant API calls to Logto
5. **Centralized Error Handling**: All token errors in one place

## Migration from Direct Logto Usage

**Before** (using `useLogto()` directly):

```typescript
const { getAccessToken } = useLogto();
const token = await getAccessToken(resource);
// ... use token
```

**After** (using `TokenProvider`):

```typescript
const { accessToken } = useAccessToken();
// ... use accessToken directly
```

## Configuration

The `TokenProvider` is already configured in your app layout:

```typescript
// src/app/layout.tsx
<AuthProvider>
  <TokenProvider>{/* Your app */}</TokenProvider>
</AuthProvider>
```

The API resource is configured in `AuthProvider`:

```typescript
// src/components/auth/auth-provider.tsx
const config = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  scopes: ["openid", "profile", "email", "offline_access"],
  resources: [process.env.NEXT_PUBLIC_TURING_API!], // ← API resource
};
```

## Troubleshooting

### Token is `null` even when signed in

1. Check that `resources` array is configured in `AuthProvider`
2. Verify API resource exists in Logto Console
3. Sign out and sign back in (existing sessions don't have the token)

### Token expires quickly

Logto SDK automatically handles token refresh using the refresh token. If issues persist:

1. Check `offline_access` scope is included
2. Verify refresh token settings in Logto Console

### Multiple token fetches

The `TokenProvider` should prevent this, but if you see multiple fetches:

1. Ensure `TokenProvider` is at the correct level (below `AuthProvider`, above consumers)
2. Check that you're not creating multiple `TokenProvider` instances
