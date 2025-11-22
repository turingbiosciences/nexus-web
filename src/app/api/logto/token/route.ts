import { NextRequest, NextResponse } from "next/server";
import LogtoClient from "@logto/next/edge";
import { logtoConfig } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logger.debug("M2M token request received");

  // Rate limiting: 10 requests per minute per IP
  const identifier = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitResult = checkRateLimit(identifier, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    prefix: "token",
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  // CRITICAL SECURITY: Verify user is authenticated before issuing tokens
  try {
    const { isAuthenticated } = await logto.getLogtoContext(req);

    if (!isAuthenticated) {
      logger.warn("Unauthorized token request - user not authenticated");
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
    }

    logger.debug("User authenticated, proceeding with M2M token fetch");
  } catch (authError) {
    logger.error({ error: authError }, "Authentication check failed");
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
    logger.error({ missingVars }, "Missing required environment variables");
    return NextResponse.json(
      {
        error:
          "Server misconfiguration: Missing required environment variables",
        details:
          process.env.NODE_ENV === "development"
            ? `Missing: ${missingVars.join(", ")}`
            : undefined,
      },
      { status: 500 }
    );
  }

  // Only log config in development to avoid exposing sensitive info
  if (process.env.NODE_ENV === "development") {
    logger.debug(
      {
        endpoint: requiredEnvVars.LOGTO_ENDPOINT,
        m2mAppId: requiredEnvVars.LOGTO_M2M_APP_ID,
        resource: requiredEnvVars.LOGTO_M2M_ENDPOINT,
      },
      "M2M config validated"
    );
  }

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
      logger.error(
        { status: tokenResponse.status, errorText },
        "Token fetch failed"
      );
      throw new Error(
        `Token fetch failed: ${tokenResponse.status} - ${errorText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
      token_type: string;
    };

    logger.info("M2M token obtained successfully");

    // Decode the JWT to inspect claims (just for debugging) for debugging)
    if (
      process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_TBIO_DEBUG === "true"
    ) {
      try {
        const [, payload] = tokenData.access_token.split(".");
        const decodedPayload = JSON.parse(
          Buffer.from(payload, "base64url").toString()
        );
        logger.debug(
          {
            aud: decodedPayload.aud,
            scope: decodedPayload.scope,
            iss: decodedPayload.iss,
            exp: new Date(decodedPayload.exp * 1000).toISOString(),
          },
          "Token claims decoded"
        );
      } catch {
        logger.debug("Could not decode token for debugging");
      }
    }

    return NextResponse.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    logger.error({ error }, "M2M token request failed");
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
};
