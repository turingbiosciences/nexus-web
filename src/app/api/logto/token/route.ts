import { NextRequest, NextResponse } from "next/server";
import LogtoClient from "@logto/next/edge";
import { logtoConfig } from "@/lib/auth";

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  console.log("[logto:token] M2M token request received");

  // CRITICAL SECURITY: Verify user is authenticated before issuing tokens
  try {
    const { isAuthenticated } = await logto.getLogtoContext(req);

    if (!isAuthenticated) {
      console.warn("[logto:token] ❌ Unauthorized token request - user not authenticated");
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    console.log("[logto:token] ✅ User authenticated, proceeding with M2M token fetch");
  } catch (authError) {
    console.error("[logto:token] ❌ Authentication check failed:", authError);
    return NextResponse.json(
      { error: "Authentication verification failed" },
      { status: 401 }
    );
  }

  // Validate required M2M environment variables
  const requiredEnvVars = {
    LOGTO_ENDPOINT: process.env.LOGTO_ENDPOINT,
    LOGTO_M2M_APP_ID: process.env.LOGTO_M2M_APP_ID,
    LOGTO_M2M_APP_SECRET: process.env.LOGTO_M2M_APP_SECRET,
    LOGTO_M2M_ENDPOINT: process.env.LOGTO_M2M_ENDPOINT,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error(
      "[logto:token] ❌ Missing required environment variables:",
      missingVars.join(", ")
    );
    return NextResponse.json(
      {
        error: "Server misconfiguration: Missing required environment variables",
        details:
          process.env.NODE_ENV === "development"
            ? `Missing: ${missingVars.join(", ")}`
            : undefined,
      },
      { status: 500 }
    );
  }

  console.log("[logto:token] Config validated:", {
    endpoint: requiredEnvVars.LOGTO_ENDPOINT,
    m2mAppId: requiredEnvVars.LOGTO_M2M_APP_ID,
    resource: requiredEnvVars.LOGTO_M2M_ENDPOINT,
  });

  try {
    // Fetch M2M token from Logto (variables validated above, safe to assert)
    const tokenResponse = await fetch(
      `${requiredEnvVars.LOGTO_ENDPOINT}/oidc/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: requiredEnvVars.LOGTO_M2M_APP_ID!,
          client_secret: requiredEnvVars.LOGTO_M2M_APP_SECRET!,
          resource: requiredEnvVars.LOGTO_M2M_ENDPOINT!,
          scope: "all",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[logto:token] Token fetch failed:", errorText);
      throw new Error(
        `Token fetch failed: ${tokenResponse.status} - ${errorText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    console.log("[logto:token] ✅ M2M token obtained successfully");

    // Decode the JWT to inspect claims (just for debugging)
    if (process.env.NEXT_PUBLIC_TBIO_DEBUG === "true") {
      try {
        const [, payload] = tokenData.access_token.split(".");
        const decodedPayload = JSON.parse(
          Buffer.from(payload, "base64url").toString()
        );
        console.log("[logto:token] Token claims:", {
          aud: decodedPayload.aud,
          scope: decodedPayload.scope,
          iss: decodedPayload.iss,
          exp: new Date(decodedPayload.exp * 1000).toISOString(),
        });
      } catch {
        console.log("[logto:token] Could not decode token for debugging");
      }
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    console.error("[logto:token] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
