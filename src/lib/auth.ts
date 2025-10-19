// Logto configuration constants
export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.NEXTAUTH_URL!,
  cookieSecret: process.env.NEXTAUTH_SECRET!,
  cookieSecure: process.env.NODE_ENV === 'production',
};

export const logtoScopes = [
  'openid',
  'profile',
  'email',
  'offline_access',
];
