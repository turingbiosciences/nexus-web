#!/usr/bin/env node
/**
 * Test script to verify Logto M2M (machine-to-machine) configuration
 *
 * This script tests the OAuth 2.0 client_credentials flow (NOT used by the main app).
 * It's useful for verifying that the Logto endpoint is accessible and configured correctly.
 *
 * NOTE: Your app uses authorization_code flow (user login), not client_credentials.
 * This script will show "grant type not allowed" error, which is EXPECTED and NORMAL.
 *
 * For testing actual user token retrieval, use: npm run test:token
 *
 * Usage: npm run test:token:m2m
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

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

async function testTokenExchange() {
  const endpoint = process.env.LOGTO_ENDPOINT;
  const appId = process.env.LOGTO_APP_ID;
  const appSecret = process.env.LOGTO_APP_SECRET;
  const apiResource = process.env.NEXT_PUBLIC_TURING_API;

  console.log("=== Logto Token Exchange Test ===\n");
  console.log("Configuration:");
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  App ID: ${appId}`);
  console.log(
    `  App Secret: ${appSecret ? "***" + appSecret.slice(-4) : "NOT SET"}`
  );
  console.log(`  API Resource: ${apiResource}`);
  console.log("\n");

  if (!endpoint || !appId || !appSecret || !apiResource) {
    console.error("❌ ERROR: Missing required environment variables");
    console.error(
      "   Required: LOGTO_ENDPOINT, LOGTO_APP_ID, LOGTO_APP_SECRET, NEXT_PUBLIC_TURING_API"
    );
    process.exit(1);
  }

  const tokenUrl = `${endpoint}/oidc/token`;
  const credentials = Buffer.from(`${appId}:${appSecret}`).toString("base64");

  console.log("Request Details:");
  console.log(`  URL: ${tokenUrl}`);
  console.log(`  Method: POST`);
  console.log(`  Authorization: Basic ${credentials.slice(0, 20)}...`);
  console.log(`  Content-Type: application/x-www-form-urlencoded`);
  console.log("\n");

  // Prepare request body
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    resource: apiResource,
    scope: "all",
  });

  console.log("Request Body:");
  console.log(`  grant_type: client_credentials`);
  console.log(`  resource: ${apiResource}`);
  console.log(`  scope: all`);
  console.log("\n");

  console.log("Sending request...\n");

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: body.toString(),
    });

    console.log(`Response Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();

    if (response.ok) {
      const tokenData = data as TokenResponse;
      console.log("✅ SUCCESS! Token obtained:\n");
      console.log("Response:");
      console.log(`  access_token: ${tokenData.access_token.slice(0, 50)}...`);
      console.log(`  token_type: ${tokenData.token_type}`);
      console.log(
        `  expires_in: ${tokenData.expires_in} seconds (${Math.floor(
          tokenData.expires_in / 60
        )} minutes)`
      );
      if (tokenData.scope) {
        console.log(`  scope: ${tokenData.scope}`);
      }
      console.log("\n");

      // Decode JWT (without verification, just for inspection)
      try {
        const [, payload] = tokenData.access_token.split(".");
        const decodedPayload = JSON.parse(
          Buffer.from(payload, "base64url").toString("utf-8")
        );
        console.log("Token Payload (decoded):");
        console.log(JSON.stringify(decodedPayload, null, 2));
        console.log("\n");

        console.log("Token Analysis:");
        console.log(`  Audience (aud): ${decodedPayload.aud || "N/A"}`);
        console.log(`  Issuer (iss): ${decodedPayload.iss || "N/A"}`);
        console.log(`  Subject (sub): ${decodedPayload.sub || "N/A"}`);
        console.log(`  Scopes: ${decodedPayload.scope || "N/A"}`);
        console.log(
          `  Expires: ${
            decodedPayload.exp
              ? new Date(decodedPayload.exp * 1000).toISOString()
              : "N/A"
          }`
        );
        console.log("\n");

        // Verify audience matches our API resource
        if (decodedPayload.aud === apiResource) {
          console.log("✅ Token audience matches API resource!");
        } else {
          console.log(
            `⚠️  WARNING: Token audience (${decodedPayload.aud}) does not match API resource (${apiResource})`
          );
        }
      } catch {
        console.log("⚠️  Could not decode JWT token payload");
      }

      console.log("\n=== Test Successful ===");
      console.log("Your Logto configuration is correct!");
      console.log(
        "The application can obtain access tokens for the API resource."
      );
    } else {
      const errorData = data as ErrorResponse;
      console.log("❌ ERROR: Token exchange failed\n");
      console.log("Error Response:");
      console.log(`  error: ${errorData.error}`);
      if (errorData.error_description) {
        console.log(`  error_description: ${errorData.error_description}`);
      }
      console.log("\n");
      console.log("Full Response:");
      console.log(JSON.stringify(data, null, 2));
      console.log("\n");

      console.log("Common Issues:");
      if (errorData.error === "invalid_client") {
        console.log(
          "  • Invalid client credentials (check LOGTO_APP_ID and LOGTO_APP_SECRET)"
        );
      } else if (
        errorData.error === "invalid_request" &&
        errorData.error_description?.includes("grant type is not allowed")
      ) {
        console.log("  ℹ️  This is EXPECTED for user-facing applications!");
        console.log(
          "  • client_credentials is for machine-to-machine (M2M) authentication"
        );
        console.log(
          "  • Your app uses authorization_code flow (user login) instead"
        );
        console.log(
          "  • This test verifies the API resource exists but cannot get tokens this way"
        );
        console.log("\n");
        console.log("To enable client_credentials (optional):");
        console.log("  1. Go to Logto Console → Applications → Your App");
        console.log("  2. Navigate to Machine-to-Machine tab");
        console.log("  3. Enable client_credentials grant type");
        console.log("\n");
        console.log(
          "However, your main app uses authorization_code flow, which is correct!"
        );
      } else if (errorData.error === "invalid_target") {
        console.log(
          "  • API resource not found or not assigned to this application"
        );
        console.log(
          `  • Verify API resource "${apiResource}" exists in Logto Console`
        );
        console.log(
          "  • Verify the API resource is assigned to your application"
        );
      } else if (errorData.error === "invalid_scope") {
        console.log(
          "  • The requested scope is not available for this resource"
        );
        console.log(
          "  • Check the permissions/scopes configured for the API resource"
        );
      }

      process.exit(1);
    }
  } catch (error) {
    console.log("❌ NETWORK ERROR\n");
    console.error("Failed to connect to Logto endpoint:");
    console.error(error);
    console.log("\n");
    console.log("Possible Issues:");
    console.log("  • Network connectivity problems");
    console.log("  • Invalid LOGTO_ENDPOINT URL");
    console.log("  • Firewall blocking the request");
    process.exit(1);
  }
}

// Run the test
testTokenExchange().catch(console.error);
