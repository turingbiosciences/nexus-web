/**
 * Centralized environment variable validation using Zod
 * 
 * This ensures all required environment variables are present and valid
 * at application startup, preventing runtime errors.
 */

import { z } from "zod";

// Server-side environment variables (not exposed to client)
const serverEnvSchema = z.object({
  // Logto Authentication
  LOGTO_ENDPOINT: z.string().url(),
  LOGTO_APP_ID: z.string().min(1),
  LOGTO_APP_SECRET: z.string().min(1),
  
  // Logto M2M (Machine-to-Machine)
  LOGTO_M2M_APP_ID: z.string().min(1),
  LOGTO_M2M_APP_SECRET: z.string().min(1),
  LOGTO_M2M_ENDPOINT: z.string().url(),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Sentry (optional in development)
  SENTRY_AUTH_TOKEN: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Client-side environment variables (exposed via NEXT_PUBLIC_ prefix)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_TURING_API: z.string().url(),
  NEXT_PUBLIC_LOGTO_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_LOGTO_APP_ID: z.string().min(1),
});

/**
 * Validate and parse server environment variables
 * Only call this on the server side (API routes, server components, etc.)
 */
export function getServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() can only be called on the server side");
  }
  
  try {
    return serverEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
      throw new Error(
        `❌ Invalid or missing server environment variables:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Validate and parse client environment variables
 * Safe to call on both client and server
 */
export function getClientEnv() {
  try {
    return clientEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
      throw new Error(
        `❌ Invalid or missing client environment variables:\n${missingVars}\n\nPlease check your .env.local file.`
      );
    }
    throw error;
  }
}

/**
 * Merged type for type-safe environment variable access
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
