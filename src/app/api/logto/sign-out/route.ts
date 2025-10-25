import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";

function logRequest(label: string, req: Request) {
  console.log(`[logto:${label}] URL=${req.url}`);
}

const logto = new LogtoClient({
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
  cookieSecret: process.env.NEXTAUTH_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: ["openid", "profile", "email", "offline_access"],
});

export const GET = async (req: NextRequest) => {
  logRequest("sign-out", req);
  const handler = logto.handleSignOut();
  const res = await handler(req);
  console.log(`[logto:sign-out] Status=${res.status}`);
  return res;
};
