import LogtoClient from "@logto/next/edge";
import { logtoConfig } from "@/lib/auth";

const logto = new LogtoClient(logtoConfig);

export const GET = logto.handleSignInCallback();
