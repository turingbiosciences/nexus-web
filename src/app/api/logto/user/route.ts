import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logtoConfig } from "@/lib/auth";
import { logRequest } from "@/lib/api-logger";

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest("user", req);
  const handler = logto.handleUser();
  const res = await handler(req);

  let parsed: unknown = null;
  try {
    parsed = await res.json();
  } catch {
    // non-JSON response
  }

  const data =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : null;
  const authenticated = Boolean(
    (data as Record<string, unknown>)?.isAuthenticated
  );
  const claims = (data as Record<string, unknown>)?.claims ?? null;
  const sub =
    claims &&
    typeof claims === "object" &&
    "sub" in claims &&
    typeof claims.sub === "string"
      ? claims.sub
      : null;

  console.log(
    `[logto:user] Status=${res.status} authenticated=${authenticated} sub=${sub}`
  );

  return NextResponse.json(
    {
      ...(data || {}),
      _debug: {
        status: res.status,
        authenticated,
        hasClaims: Boolean(claims),
        sub,
      },
    },
    { status: res.status }
  );
};
