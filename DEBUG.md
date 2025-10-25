# Debug Panel

The application includes a debug panel that displays authentication information when enabled.

## Enabling Debug Mode

To enable the debug panel, set the `NEXT_PUBLIC_TBIO_DEBUG` environment variable to `'true'` in your `.env.local` file:

```env
NEXT_PUBLIC_TBIO_DEBUG=true
```

## What the Debug Panel Shows

When enabled, the debug panel displays:

### Authentication Status
- Whether the user is authenticated
- Loading state
- Any authentication errors

### User Data
- User ID
- Username
- Primary email
- Display name
- Email verification status

### Complete User Data (JSON)
- Full user object from Logto with all available properties

### Environment Information
- Current environment (development/production)
- Logto endpoint URL
- Logto application ID

## Usage

1. Add `NEXT_PUBLIC_TBIO_DEBUG=true` to your `.env.local` file
2. Restart your development server
3. The debug panel will appear at the bottom of the page when you're authenticated

## Security Note

**Important**: Only enable debug mode in development environments. The debug panel exposes sensitive authentication information that should not be visible in production.

To disable debug mode, either:
- Remove the `NEXT_PUBLIC_TBIO_DEBUG` environment variable
- Set it to `'false'` or any value other than `'true'`
