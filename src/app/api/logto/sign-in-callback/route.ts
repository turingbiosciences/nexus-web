import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";
import { logtoConfig } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { logRequest } from "@/lib/api-logger";

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest("sign-in-callback", req);

  // Log error parameters if present
  const url = new URL(req.url);
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    logger.error(
      {
        error,
        errorDescription,
        configuredResources: logtoConfig.resources,
        state: url.searchParams.get("state"),
      },
      "Logto sign-in callback error"
    );
  }

  const handler = logto.handleSignInCallback();
  const res = await handler(req);

  // Log cookies being set for session persistence diagnostics
  const setCookies = res.headers.getSetCookie?.() || [];
  logger.debug(
    {
      status: res.status,
      setCookieCount: setCookies.length,
    },
    "Sign-in callback response"
  );
  if (setCookies.length > 0) {
    const cookieNames = setCookies.map((cookie, idx) => {
      const nameMatch = cookie.match(/^([^=]+)=/);
      return nameMatch?.[1] || "unknown";
    });
    logger.debug({ cookieNames }, "Session cookies set");
  } else {
    logger.warn("No Set-Cookie headers found in sign-in callback response");
  }

  return res;
};
