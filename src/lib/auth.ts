import { LogtoNextConfig } from "@logto/next";

export const logtoScopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "all",
];

export const logtoResources = [
  process.env.NEXT_PUBLIC_TURING_API || process.env.TURING_API || "",
].filter(Boolean);

export const logtoConfig: LogtoNextConfig = {
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  endpoint: process.env.LOGTO_ENDPOINT!,
  baseUrl: process.env.NEXTAUTH_URL!,
  cookieSecret: process.env.NEXTAUTH_SECRET!,
  cookieSecure: process.env.NODE_ENV === "production",
  scopes: logtoScopes,
  resources: logtoResources,
};

export const logtoClientConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT!,
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID!,
  scopes: logtoScopes,
  resources: logtoResources,
};
