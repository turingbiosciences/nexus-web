"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useLogto } from "@logto/react";

export type GlobalAuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  claims: Record<string, unknown> | null;
  error: Error | null;
  refreshAuth: () => Promise<void>;
  signIn: typeof useLogto.prototype.signIn;
  signOut: typeof useLogto.prototype.signOut;
  fetchUserInfo: typeof useLogto.prototype.fetchUserInfo;
  getIdTokenClaims: typeof useLogto.prototype.getIdTokenClaims;
  getAccessToken: typeof useLogto.prototype.getAccessToken;
};

const GlobalAuthContext = createContext<GlobalAuthContextType | undefined>(
  undefined
);

export function GlobalAuthProvider({ children }: { children: ReactNode }) {
  const logto = useLogto();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from server-side /api/logto/user to check real auth state
      const response = await fetch("/api/logto/user", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const authenticated = Boolean(data?.isAuthenticated);
        setIsAuthenticated(authenticated);

        if (authenticated && data?.claims) {
          setClaims(data.claims);
        } else {
          setClaims(null);
        }
      } else {
        setIsAuthenticated(false);
        setClaims(null);
      }
    } catch (err) {
      console.error("[GlobalAuthProvider] Failed to fetch auth state:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsAuthenticated(false);
      setClaims(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial auth check and periodic refresh
  useEffect(() => {
    refreshAuth();

    // Also refresh when Logto SDK detects changes
    if (logto.isAuthenticated !== isAuthenticated) {
      refreshAuth();
    }
  }, [logto.isAuthenticated, refreshAuth, isAuthenticated]);

  const value: GlobalAuthContextType = {
    isAuthenticated,
    isLoading,
    claims,
    error,
    refreshAuth,
    signIn: logto.signIn,
    signOut: logto.signOut,
    fetchUserInfo: logto.fetchUserInfo,
    getIdTokenClaims: logto.getIdTokenClaims,
    getAccessToken: logto.getAccessToken,
  };

  return (
    <GlobalAuthContext.Provider value={value}>
      {children}
    </GlobalAuthContext.Provider>
  );
}

export function useGlobalAuth() {
  const ctx = useContext(GlobalAuthContext);
  if (!ctx)
    throw new Error("useGlobalAuth must be used within GlobalAuthProvider");
  return ctx;
}
