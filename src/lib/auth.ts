import { LogtoNextConfig } from "@logto/next";

export const logtoScopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "all",
];

// Determine resource from environment variables
const turingApiResource = process.env.NEXT_PUBLIC_TURING_API || process.env.TURING_API;

// Build resources array - only include if resource is configured
export const logtoResources = turingApiResource ? [turingApiResource] : [];

// Log configuration state for debugging
if (typeof window === "undefined") {
  // Server-side only logging
  console.log("[auth:config]", {
    hasResource: !!turingApiResource,
    resourceValue: turingApiResource || "(not set)",
    resourcesArray: logtoResources,
    nodeEnv: process.env.NODE_ENV,
  });
}

export const logtoConfig: LogtoNextConfig = {
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  endpoint: process.env.LOGTO_ENDPOINT!,
  baseUrl: process.env.NEXTAUTH_URL!,
  cookieSecret: process.env.NEXTAUTH_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: logtoScopes,
  // NOTE: Do NOT include resources in user authentication config
  // Resources are only for M2M token exchange (see /api/logto/token)
  // Including resources here causes "invalid_target" errors in production
};

export const logtoClientConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  scopes: logtoScopes,
  // NOTE: Do NOT include resources in client auth config
  // Client uses this only for auth state, not for API tokens
  // API tokens are obtained server-side via M2M flow (see /api/logto/token)
};
