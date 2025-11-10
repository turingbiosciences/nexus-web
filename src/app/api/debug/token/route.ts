/**
 * Debug endpoint to test access token retrieval
 *
 * This endpoint attempts to:
 * 1. Check if user is authenticated
 * 2. Get access token for the API resource
 * 3. Decode and analyze the token
 * 4. Provide suggestions if token retrieval fails
 *
 * Usage:
 * 1. Sign in to your app (browser or API)
 * 2. Call: GET http://localhost:3000/api/debug/token
 */

import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logtoConfig } from "@/lib/auth";

// Use centralized config to ensure debug endpoint tests the same authentication flow as production
const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  console.log("\n=== Token Debug Endpoint ===");

  try {
    const apiResource = process.env.NEXT_PUBLIC_TURING_API!;
    console.log("Expected API resource:", apiResource);

    // Step 1: Check user authentication status
    console.log("Step 1: Checking authentication...");
    const userHandler = logto.handleUser();
    const userResponse = await userHandler(req);
    const userData = (await userResponse.json()) as {
      isAuthenticated?: boolean;
      claims?: Record<string, unknown>;
    };

    console.log("User authenticated:", userData.isAuthenticated);
    if (userData.claims) {
      const sub = (userData.claims as { sub?: string }).sub;
      console.log("User ID (sub):", sub);
    }

    // Step 2: Inspect cookies
    const cookies = req.cookies.getAll();
    console.log("\nStep 2: Cookie inspection");
    console.log("Total cookies:", cookies.length);

    const logtoCookies = cookies.filter(
      (c) =>
        c.name.includes("logto") ||
        c.name.includes("session") ||
        c.name.includes("token") ||
        c.name.includes("access")
    );

    console.log("Logto-related cookies found:", logtoCookies.length);
    logtoCookies.forEach((c) => {
      console.log(`  Cookie: ${c.name} (length: ${c.value.length})`);
    });

    const cookieInfo = logtoCookies.map((c) => ({
      name: c.name,
      valueLength: c.value.length,
      valuePreview: c.value.slice(0, 50) + (c.value.length > 50 ? "..." : ""),
      looksLikeJWT: c.value.split(".").length === 3,
    }));

    // Build response
    if (!userData.isAuthenticated) {
      return NextResponse.json({
        success: false,
        hasToken: false,
        isAuthenticated: false,
        apiResource,
        totalCookies: cookies.length,
        logtoCookies: cookieInfo,
        message: "❌ User is not authenticated",
        suggestions: [
          "Sign in to the application first",
          "Open http://localhost:3000 in a browser",
          "Click 'Sign In' and complete authentication",
          "Then access this endpoint again",
        ],
      });
    }

    // User is authenticated - check if we can find token-like data
    const hasJWTCookie = cookieInfo.some((c) => c.looksLikeJWT);

    return NextResponse.json({
      success: hasJWTCookie,
      hasToken: hasJWTCookie,
      isAuthenticated: true,
      apiResource,
      totalCookies: cookies.length,
      logtoCookies: cookieInfo,
      userInfo: {
        sub: (userData.claims as { sub?: string })?.sub,
        email: (userData.claims as { email?: string })?.email,
      },
      message: hasJWTCookie
        ? "✅ User is authenticated and JWT-like cookies found"
        : "⚠️ User is authenticated but no JWT-like cookies found",
      note:
        "This endpoint shows authentication status and cookies. " +
        "For actual token retrieval test, check browser console logs from TokenProvider.",
      suggestions: hasJWTCookie
        ? []
        : [
            "API resource may not be configured in Logto Console",
            `Create API resource with identifier: ${apiResource}`,
            "Assign the API resource to your application",
            "Sign out and sign back in after configuring the API resource",
          ],
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      {
        error: "Internal error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
};
