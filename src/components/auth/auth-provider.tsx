"use client";

import { LogtoProvider } from "@logto/react";
import { ReactNode } from "react";
import { logtoClientConfig } from "@/lib/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  console.log("Logto config:", logtoClientConfig);

  return <LogtoProvider config={logtoClientConfig}>{children}</LogtoProvider>;
}
