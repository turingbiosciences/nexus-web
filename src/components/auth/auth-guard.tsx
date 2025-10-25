"use client";

import { createContext, useContext } from "react";
import { useLogto } from "@logto/react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  getAccessToken: (resource?: string) => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  getAccessToken: async () => "",
});

export const useAuth = () => useContext(AuthContext);

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, getAccessToken } = useLogto();

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}
