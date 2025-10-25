# Sign-Out Button Fix

## Problem
The sign-out button was not functioning properly due to:
1. Incorrect redirect URL (pointing to localhost:3000 instead of 3001)
2. Missing or incorrect `NEXTAUTH_URL` environment variable
3. Potential issues with Logto session handling

## Solution Implemented

### 1. **Fixed API Routes**
- Reverted to simple Logto client configuration
- Added fallback for `NEXTAUTH_URL` environment variable
- Simplified the sign-out and sign-in API routes

### 2. **Enhanced Auth Button**
- Added robust error handling for sign-out
- Implemented fallback mechanism with manual sign-out
- Improved user experience with immediate state clearing

### 3. **Manual Sign-Out Fallback**
- Created `/api/logto/manual-sign-out` endpoint
- Clears all authentication cookies manually
- Provides backup when standard Logto sign-out fails

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Logto Configuration
NEXT_PUBLIC_LOGTO_ENDPOINT=https://q98adz.logto.app/
NEXT_PUBLIC_LOGTO_APP_ID=h28vlbexr7nmgjk5f2qdg
LOGTO_ENDPOINT=https://q98adz.logto.app/
LOGTO_APP_ID=h28vlbexr7nmgjk5f2qdg
LOGTO_APP_SECRET=your-app-secret
NEXTAUTH_SECRET=your-random-secret-key

# IMPORTANT: Set this to your current development URL
NEXTAUTH_URL=http://localhost:3001

# Debug (optional)
NEXT_PUBLIC_TBIO_DEBUG=true
```

## How the Sign-Out Works Now

1. **Primary Method**: Tries standard Logto sign-out API
2. **Fallback Method**: If primary fails, uses manual cookie clearing
3. **Last Resort**: Reloads the page to clear any remaining state

## Testing

1. Start the development server: `npm run dev`
2. Sign in to the application
3. Click the "Sign Out" button
4. You should be redirected to the sign-in page or see the authentication prompt

## Troubleshooting

If sign-out still doesn't work:

1. **Check Environment Variables**: Ensure `NEXTAUTH_URL` is set to the correct port
2. **Clear Browser Data**: Clear cookies and local storage
3. **Check Console**: Look for any error messages in browser console
4. **Manual Clear**: If needed, manually clear all cookies containing "logto" or "auth"

## Files Modified

- `src/components/auth/auth-button.tsx` - Enhanced sign-out logic
- `src/app/api/logto/sign-out/route.ts` - Simplified API route
- `src/app/api/logto/sign-in/route.ts` - Simplified API route  
- `src/app/api/logto/manual-sign-out/route.ts` - New fallback endpoint
