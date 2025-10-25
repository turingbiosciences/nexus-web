# Copilot Instructions for Turing Biosciences Nexus Web

## Project Overview

Next.js 15 (App Router) application with Logto authentication and TUS-protocol file upload. Built for biosciences data management with resumable uploads up to 5GB.

## Architecture Pattern

### Authentication Flow (Logto OIDC)

- **Server-side auth**: All routes in `src/app/api/logto/` use `@logto/next/edge` with consistent config
- **Client-side**: `AuthProvider` wraps app in `layout.tsx`, `AuthGuard` provides auth context
- **Auth Context**: `AuthGuard` exports `useAuth()` hook for authentication state in child components
- **No Auto-Redirect**: `AuthGuard` does NOT automatically redirect - pages/components decide how to handle unauthenticated users
- **Auth Pattern**: Pages use `useAuth()` to check `isAuthenticated` and conditionally render sign-in prompts or protected content
- **API Resource Authentication**: `AuthProvider` includes `resources` array with `NEXT_PUBLIC_TURING_API` for API access tokens
- **Critical**: Each API route instantiates its own `LogtoClient` with identical config (no shared instance)
- **Port consistency**: `NEXTAUTH_URL` must match actual dev server port (historically caused sign-out bugs - see `LOGOUT_SOLUTION.md`)

```typescript
// Pattern used in ALL /api/logto/* routes
const logto = new LogtoClient({
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.NEXTAUTH_URL!,
  cookieSecret: process.env.NEXTAUTH_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: ["openid", "profile", "email", "offline_access"],
});

// Client-side auth provider pattern
const config = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  scopes: ["openid", "profile", "email", "offline_access"],
  resources: [process.env.NEXT_PUBLIC_TURING_API!], // Required for API access tokens
};
```

### Client Component Structure

- Top-level pages are RSC shells (e.g., `page.tsx` → `HomePageClient`)
- Business logic lives in `*-client.tsx` components marked `"use client"`
- `AuthButton` handles sign-in/out with fallback manual logout endpoint
- Components check `useAuth().isAuthenticated` to conditionally render protected content
- Pages show sign-in prompts for unauthenticated users instead of automatic redirects
- File uploads use `useAuth().getAccessToken(resource)` for API authentication tokens

### File Upload Architecture

- `FileUploader` uses `react-dropzone` for file selection with `tus-js-client` for resumable uploads
- Upload state: `pending` → `uploading` → `paused`/`completed`/`error`
- **TUS Integration**: Fully implemented with Logto authentication
  - Uploads to `NEXT_PUBLIC_TURING_API/uploads` endpoint
  - Passes Logto access token via Authorization header
  - Supports pause/resume via `tusUpload.abort()` and `tusUpload.start()`
  - Automatic retry with exponential backoff: `[0, 3000, 5000, 10000, 20000]ms`

## Development Commands

```bash
npm run dev         # Start dev server with Turbopack (default port: 3000)
npm run build       # Production build with Turbopack
npm run lint        # ESLint with Next.js TypeScript rules
```

**Important**: If dev server runs on non-3000 port, update `NEXTAUTH_URL` in `.env.local` immediately.

## Environment Variables

Required variables (see `.env.example`):

- **Client-side**: `AuthProvider` wraps app in `layout.tsx` with `LogtoProvider` from `@logto/react`
- **Auth Pattern**: Components use `useLogto()` hook directly to check `isAuthenticated` and conditionally render sign-in prompts or protected content
- **No Auth Guards**: No global redirect logic - pages/components decide how to handle unauthenticated users

### Styling

- Tailwind CSS v4 with PostCSS plugin (`@tailwindcss/postcss`)
- No `tailwind.config.js` - uses inline `@theme` in `globals.css`
- Utility-first approach with `cn()` helper from `lib/utils.ts` (clsx + tailwind-merge)

### TypeScript

- Path alias: `@/*` → `src/*`
- Strict mode enabled
- Component props: Always define explicit interfaces

### Component Patterns

```typescript
// Auth-aware components
- **Client-side**: `AuthProvider` wraps app in `layout.tsx` with `LogtoProvider` from `@logto/react`
- **Auth Pattern**: Components use `useLogto()` hook directly to check `isAuthenticated` and conditionally render sign-in prompts or protected content
- **No Auth Guards**: No global redirect logic - pages/components decide how to handle unauthenticated users
// UI components use shadcn/ui pattern
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
```

- Components use `useLogto()` hook directly to check authentication and get tokens
- File uploads use `useLogto().getAccessToken(resource)` for API authentication tokens

1. Update `NEXTAUTH_URL` in `.env.local`
2. Add to Logto dashboard → Redirect URIs: `{baseUrl}/api/logto/callback`, `{baseUrl}/api/logto/sign-in-callback`

3. In Logto Console → API Resources → Create API Resource
4. Set API Identifier to your backend URL (e.g., `https://api.turingbio.com`)
5. Add to your application's API Resources
6. This allows `getAccessToken(resource)` to obtain tokens for backend authentication

### File Upload Extension

TUS protocol is fully integrated. The `FileUploader` component:

1. Gets Logto access token via `useLogto().getAccessToken(resource)` with API resource parameter
2. Creates TUS upload with authenticated headers: `Authorization: Bearer ${token}`
   // Component usage pattern
   import { useLogto } from "@logto/react";

const { isAuthenticated, isLoading, getAccessToken } = useLogto(); 3. Uploads to `${NEXT_PUBLIC_TURING_API}/uploads` endpoint 4. Handles pause/resume by storing `tusUpload` instance in component state 5. Automatically retries with exponential backoff on network errors

Key implementation details:

```typescript
const { getAccessToken, isAuthenticated } = useLogto();

// Check authentication first
if (!isAuthenticated) {
  throw new Error("Authentication required. Please sign in.");
}

// Get access token with API resource parameter
const token = await getAccessToken(process.env.NEXT_PUBLIC_TURING_API);

const tusUpload = new tus.Upload(file, {
  endpoint: `${process.env.NEXT_PUBLIC_TURING_API}/uploads`,
  retryDelays: [0, 3000, 5000, 10000, 20000],
  headers: { Authorization: `Bearer ${token}` },
  metadata: { filename: file.name, filetype: file.type },
  onProgress: (bytesUploaded, bytesTotal) => {
    // Update UI with progress percentage
  },
  onSuccess: () => {
    // Handle completion
  },
});
```

### Backend API Integration

- **Authentication**: Custom backend validates Logto JWT tokens
- **Data Format**: Backend accepts processed CSV data (biosciences datasets)
- **File Size**: Backend must support files up to 5GB via TUS protocol chunks
- **Token Flow**: Frontend → Logto access token → Backend validates via Logto OIDC

## Common Tasks

**Add new authenticated page**: Create RSC page → import `HomePageClient` pattern → use `useLogto()` to check authentication

**Add new API route**: Use App Router conventions (`route.ts`), return `Response` objects

**Add backend API call**: Use `@tanstack/react-query` for data fetching, include Logto access token in headers

**Style new component**: Use Tailwind utilities, extract to `components/ui/` if reusable, follow button/slot pattern from `ui/button.tsx`

## Known Issues & Fixes

- **Auth check**: Components use `useLogto()` directly - no intermediate wrappers needed

## Testing Approach

- **Current State**: No automated tests configured yet
- **Planned**: Unit tests for components and API integration tests
- **Manual Testing**: Sign in → Upload file → Verify progress → Sign out
- **Debugging**: Use browser DevTools → Network tab for auth redirects and API calls

When adding tests:

- Use Jest + React Testing Library for component tests
- Mock Logto auth context with `@logto/react` test utilities
- Test file upload state transitions (pending → uploading → completed/error)
- Use MSW (Mock Service Worker) for API request mocking

## Deployment

**Target Platform**: Digital Ocean

- Deploy as Docker container or use App Platform
- Set all environment variables in DigitalOcean dashboard
- Update `NEXTAUTH_URL` to production domain (e.g., `https://nexus.turingbio.com`)
- Update Logto dashboard with production redirect URIs
- Ensure `NODE_ENV=production` for secure cookies

Production checklist:

1. Add production domain to Logto Redirect URIs and Post Sign-out URIs
2. Set `NEXTAUTH_URL` to production URL
3. Generate new production `NEXTAUTH_SECRET`
4. Configure backend API URL environment variable
5. Test authentication flow end-to-end in production

## Dependencies to Know

- `@logto/next` (edge runtime) - used in API routes
- `@logto/react` - used in client components
- `react-dropzone` - file selection UI
- `tus-js-client` - resumable upload protocol (installed and integrated)
- `@tanstack/react-query` - wraps app via `ReactQueryProvider` (ready for data fetching)
