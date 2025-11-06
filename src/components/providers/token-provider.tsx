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

export function TokenProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const {
    isAuthenticated,
    isLoading: authLoading,
    getAccessToken,
  } = useGlobalAuth();

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
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resource = process.env.NEXT_PUBLIC_TURING_API;
      console.log("[TokenProvider] Fetching access token...", {
        resource,
        hasResource: !!resource,
      });

      const token = await getAccessToken(resource);

      console.log("[TokenProvider] getAccessToken result:", {
        hasToken: !!token,
        tokenLength: token?.length,
      });

      if (!token) {
        throw new Error(
          "Failed to obtain access token. Please sign out and sign back in. Make sure the API resource is configured in Logto Console."
        );
      }

      console.log("[TokenProvider] Access token obtained successfully");
      setAccessToken(token);
    } catch (err) {
      console.error("[TokenProvider] Failed to fetch access token:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, getAccessToken]);

  // Fetch token when authentication state changes
  useEffect(() => {
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
}

export function useAccessToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) {
    throw new Error("useAccessToken must be used within a TokenProvider");
  }
  return ctx;
}
