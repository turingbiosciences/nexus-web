import LogtoClient from "@logto/next/edge";
import type { NextRequest } from "next/server";
import { logtoConfig } from "@/lib/auth";
import { logRequestWithResponse } from "@/lib/api-logger";

const logto = new LogtoClient(logtoConfig);

export const GET = async (req: NextRequest) => {
  const handler = logto.handleSignOut();
  const res = await handler(req);
  logRequestWithResponse("sign-out", req, res);
  return res;
};
