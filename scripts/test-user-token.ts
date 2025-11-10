#!/usr/bin/env node
/**
 * Test script to verify user token retrieval from an active session
 *
 * This script tests the authorization_code flow by:
 * 1. Checking if a user session exists (via cookies)
 * 2. Attempting to get an access token for the API resource
 * 3. Decoding and analyzing the token
 *
 * Prerequisites:
 * - User must be signed in to the app (http://localhost:3000)
 * - Dev server must be running
 *
 * Usage: npm run test:user-token
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Simple dotenv parser
function loadEnv(path: string) {
  try {
    const content = readFileSync(path, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, "");
        process.env[key] = value;
      }
    });
  } catch {
    console.warn("Could not load .env.local file");
  }
}

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv(join(__dirname, "../.env.local"));

interface DebugTokenResponse {
  success?: boolean;
  hasToken?: boolean;
  error?: string;
  message?: string;
  totalCookies?: number;
  tokenInfo?: {
    tokenLength: number;
    tokenPreview: string;
    audience?: string;
    scopes?: string;
  };
  suggestions?: string[];
  logtoCookies?: Array<{
    name: string;
    valueLength: number;
    looksLikeJWT: boolean;
  }>;
}

async function testUserToken() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const apiResource = process.env.NEXT_PUBLIC_TURING_API;

  console.log("=== User Token Retrieval Test ===\n");
  console.log("Configuration:");
  console.log(`  Base URL: ${baseUrl}`);
  console.log(`  API Resource: ${apiResource}`);
  console.log("\n");

  if (!apiResource) {
    console.error("❌ ERROR: NEXT_PUBLIC_TURING_API not set in .env.local");
    process.exit(1);
  }

  console.log("ℹ️  This script tests the /api/debug/token endpoint");
  console.log("   which checks authentication status and cookie storage.\n");
  console.log("Prerequisites:");
  console.log("  1. Dev server must be running (npm run dev)");
  console.log("  2. You must sign in via browser at the base URL");
  console.log(
    "  3. Browser cookies are sent automatically when you visit the debug endpoint"
  );
  console.log("\n");

  // Try to detect if server is running on a different port
  let actualUrl = baseUrl;
  try {
    const testResponse = await fetch(`${baseUrl}/api/debug/token`);
    if (!testResponse.ok && baseUrl.includes(":3000")) {
      console.log("⚠️  Port 3000 not responding, trying 3001...");
      actualUrl = baseUrl.replace(":3000", ":3001");
      const retryResponse = await fetch(`${actualUrl}/api/debug/token`);
      if (retryResponse.ok) {
        console.log(`✓ Found server on ${actualUrl}\n`);
      }
    }
  } catch {
    // Will handle connection error below
  }

  console.log("Testing endpoint...\n");

  try {
    const debugResponse = await fetch(`${actualUrl}/api/debug/token`);

    if (!debugResponse.ok) {
      console.error(
        `❌ ERROR: Debug endpoint failed (${debugResponse.status})`
      );
      console.error("   Is the dev server running?");
      console.error("   Run: npm run dev");
      process.exit(1);
    }

    const debugData = (await debugResponse.json()) as DebugTokenResponse;

    console.log("Cookie Analysis:");
    console.log(`  API Resource Expected: ${apiResource}`);
    console.log(`  Total Cookies: ${debugData.totalCookies || 0}`);

    if (debugData.logtoCookies && debugData.logtoCookies.length > 0) {
      console.log(`  Logto Cookies Found: ${debugData.logtoCookies.length}`);
      debugData.logtoCookies.forEach((cookie) => {
        const jwtIndicator = cookie.looksLikeJWT ? " [JWT-like]" : "";
        console.log(
          `    • ${cookie.name} (${cookie.valueLength} bytes)${jwtIndicator}`
        );
      });
    } else {
      console.log("  Logto Cookies Found: 0");
      console.log("  ⚠️  No Logto cookies detected");
    }
    console.log("\n");

    // Check if user needs to sign in
    if (!debugData.logtoCookies || debugData.logtoCookies.length === 0) {
      console.log("❌ No authentication session found\n");
      console.log("To create an authenticated session:");
      console.log("  1. Open your browser");
      console.log("  2. Navigate to: http://localhost:3000");
      console.log("  3. Click 'Sign In'");
      console.log("  4. Complete authentication");
      console.log("  5. The cookies will be stored in your browser");
      console.log("\n");
      console.log(
        "ℹ️  Note: This script tests the debug endpoint which inspects"
      );
      console.log(
        "   cookies set by the browser. It doesn't need to authenticate itself.\n"
      );
      process.exit(1);
    }

    console.log("✅ Authentication session detected!\n");

    // Step 2: Analyze token availability
    console.log("Step 2: Analyzing access token availability...\n");

    console.log("Token Status:");
    if (debugData.success && debugData.hasToken) {
      console.log("  ✅ SUCCESS! Access token is available\n");
      console.log("Token Information:");
      if (debugData.tokenInfo) {
        console.log(`    Length: ${debugData.tokenInfo.tokenLength} bytes`);
        console.log(`    Preview: ${debugData.tokenInfo.tokenPreview}`);
        if (debugData.tokenInfo.audience) {
          console.log(`    Audience: ${debugData.tokenInfo.audience}`);
          const audienceMatches = debugData.tokenInfo.audience === apiResource;
          console.log(
            `    Audience Match: ${audienceMatches ? "✅ YES" : "❌ NO"}`
          );

          if (!audienceMatches) {
            console.log(`\n    ⚠️  WARNING: Audience mismatch!`);
            console.log(`    Expected: ${apiResource}`);
            console.log(`    Got: ${debugData.tokenInfo.audience}`);
          }
        }
        if (debugData.tokenInfo.scopes) {
          console.log(`    Scopes: ${debugData.tokenInfo.scopes}`);
        }
      }
      console.log("\n");
      console.log("=== Test Successful ===");
      console.log("Your Logto configuration is working correctly!");
      console.log("The app can obtain access tokens for authenticated users.");
    } else {
      console.log("  ❌ FAILED: No access token available\n");

      if (debugData.message) {
        console.log(`Message: ${debugData.message}\n`);
      }

      if (debugData.suggestions && debugData.suggestions.length > 0) {
        console.log("Suggested Actions:");
        debugData.suggestions.forEach((suggestion) => {
          console.log(`  • ${suggestion}`);
        });
        console.log("\n");
      }

      console.log("Common Causes:");
      console.log("  1. API resource not configured in Logto Console");
      console.log("     → Go to https://q98adz.logto.app/");
      console.log("     → Navigate to API Resources");
      console.log(`     → Create resource: ${apiResource}`);
      console.log("     → Ensure no trailing slash");
      console.log("\n");
      console.log("  2. API resource not assigned to application");
      console.log("     → Go to Logto Console → Applications");
      console.log("     → Select your app (h28vlbexr7nmgjk5f2qdg)");
      console.log("     → API Resources tab → Add the resource");
      console.log("\n");
      console.log("  3. Session created before API resource was configured");
      console.log("     → Open http://localhost:3000 in browser");
      console.log("     → Sign out completely");
      console.log("     → Sign back in");
      console.log("     → Run this test again");
      console.log("\n");

      process.exit(1);
    }
  } catch (error) {
    console.log("❌ NETWORK ERROR\n");
    console.error("Failed to connect to local server:");
    console.error(error);
    console.log("\n");
    console.log("Possible Issues:");
    console.log("  • Dev server is not running");
    console.log("    → Run: npm run dev");
    console.log("  • Wrong port (check NEXTAUTH_URL in .env.local)");
    console.log("  • Network connectivity problems");
    process.exit(1);
  }
}

// Run the test
testUserToken().catch(console.error);
