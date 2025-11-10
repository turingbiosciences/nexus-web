import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";
import { logtoConfig } from "@/lib/auth";

function logRequest(label: string, req: Request) {
  console.log(`[logto:${label}] URL=${req.url}`);
}

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  logRequest("sign-out", req);
  const handler = logto.handleSignOut();
  const res = await handler(req);
  console.log(`[logto:sign-out] Status=${res.status}`);
  return res;
};
