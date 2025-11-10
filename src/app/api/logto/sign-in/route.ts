import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";
import { logtoConfig } from "@/lib/auth";

// Instrumentation: log incoming sign-in requests
function logRequest(label: string, req: Request) {
  console.log(`[logto:${label}] URL=${req.url}`);
}

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest("sign-in", req);
  const handler = logto.handleSignIn();
  const res = await handler(req);
  console.log(`[logto:sign-in] Status=${res.status}`);
  return res;
};
