'use client';

import { LogtoProvider } from '@logto/react';
import { ReactNode } from 'react';
// Imports from auth-client, not auth: auth.ts is server-only (it reads secrets
// via node:fs) and importing it here would fail the browser bundle.
import { logtoClientConfig } from '@/lib/auth-client';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Client-side auth provider - config logged server-side in auth.ts
  return <LogtoProvider config={logtoClientConfig}>{children}</LogtoProvider>;
}
