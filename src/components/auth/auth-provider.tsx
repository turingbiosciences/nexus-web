"use client";

import { LogtoProvider } from "@logto/react";
import { ReactNode } from "react";
import { logtoClientConfig } from "@/lib/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Client-side auth provider - config logged server-side in auth.ts
  return <LogtoProvider config={logtoClientConfig}>{children}</LogtoProvider>;
}
