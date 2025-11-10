"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useGlobalAuth } from "./global-auth-provider";

interface TokenContextValue {
  accessToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: () => Promise<void>;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use GlobalAuth for authentication state (server-side, more reliable)
  const { isAuthenticated, isLoading: authLoading } = useGlobalAuth();
  // Note: useLogto().getAccessToken() not used due to client/server sync issues

  console.log("[TokenProvider] Component render", {
    isAuthenticated,
    authLoading,
    accessToken: accessToken ? "present" : "null",
  });

  const fetchToken = useCallback(async () => {
    console.log("[TokenProvider] fetchToken called", {
      isAuthenticated,
      authLoading,
    });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log("[TokenProvider] Auth still loading, skipping token fetch");
      return;
    }

    // Clear token if not authenticated
    if (!isAuthenticated) {
      console.log("[TokenProvider] Not authenticated, clearing token");
      setAccessToken(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[TokenProvider] Fetching access token from server...");

      // Fetch token from server-side API route
      // This route will use @logto/next to get the token from the server session
      const response = await fetch("/api/logto/token");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to fetch token: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.accessToken) {
        throw new Error(
          "No access token returned. API resource may not be configured in Logto Console."
        );
      }

      console.log("[TokenProvider] ✅ Access token obtained from server");
      setAccessToken(data.accessToken);
    } catch (err) {
      console.error("[TokenProvider] ❌ Token fetch failed:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Fetch token when authentication state changes
  useEffect(() => {
    console.log("[TokenProvider] useEffect triggered - calling fetchToken");
    fetchToken();
  }, [fetchToken]);

  const refreshToken = useCallback(async () => {
    await fetchToken();
  }, [fetchToken]);

  const value: TokenContextValue = {
    accessToken,
    isLoading,
    error,
    refreshToken,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
};

export function useAccessToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) {
    throw new Error("useAccessToken must be used within a TokenProvider");
  }
  return ctx;
}
