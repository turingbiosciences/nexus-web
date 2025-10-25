import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";

function logRequest(label: string, req: Request) {
  console.log(`[logto:${label}] URL=${req.url}`);
}

const logto = new LogtoClient({
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.NEXTAUTH_URL!,
  cookieSecret: process.env.NEXTAUTH_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: ["openid", "profile", "email", "offline_access"],
});

export const GET = async (req: NextRequest) => {
  logRequest("sign-in-callback", req);
  const handler = logto.handleSignInCallback();
  const res = await handler(req);

  // Log cookies being set for session persistence diagnostics
  const setCookies = res.headers.getSetCookie?.() || [];
  console.log(
    `[logto:sign-in-callback] Status=${res.status} Set-Cookie count=${setCookies.length}`
  );
  if (setCookies.length > 0) {
    setCookies.forEach((cookie, idx) => {
      const nameMatch = cookie.match(/^([^=]+)=/);
      console.log(
        `[logto:sign-in-callback] Cookie[${idx}]: ${
          nameMatch?.[1] || "unknown"
        }`
      );
    });
  } else {
    console.warn(
      "[logto:sign-in-callback] WARNING: No Set-Cookie headers found!"
    );
  }

  return res;
};
