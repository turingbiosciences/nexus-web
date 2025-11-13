"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { logger } from "@/lib/logger";

interface TokenContextValue {
  accessToken: string | null;
  isLoading: boolean;
  error: Error | null;
  refreshToken: () => Promise<string | null>;
  // Add auth state so components can check authentication
  isAuthenticated: boolean;
  authLoading: boolean;
}

const TokenContext = createContext<TokenContextValue | undefined>(undefined);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  logger.debug(
    { windowType: typeof window },
    "TokenProvider function body executing"
  );

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  logger.debug(
    {
      windowType: typeof window,
      isAuthenticated,
      authLoading,
      hasAccessToken: !!accessToken,
    },
    "TokenProvider component render"
  );

  // Check authentication by calling the server-side API
  // This ensures client state syncs with server session after callback
  useEffect(() => {
    let cancelled = false;

    async function checkAuthStatus() {
      logger.debug("CLIENT: Checking auth status");

      try {
        const res = await fetch("/api/logto/user", { credentials: "include" });
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          const authenticated = Boolean(data?.isAuthenticated);
          logger.debug({ authenticated }, "CLIENT: Auth status received");
          setIsAuthenticated(authenticated);
        } else {
          logger.warn({ status: res.status }, "CLIENT: Auth check failed");
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (cancelled) return;
        logger.error({ error: err }, "CLIENT: Auth check error");
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          logger.debug("CLIENT: Setting authLoading to false");
          setAuthLoading(false);
        }
      }
    }

    checkAuthStatus();

    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount

  const fetchToken = useCallback(async (): Promise<string | null> => {
    logger.debug({ isAuthenticated, authLoading }, "fetchToken called");

    // Wait for auth to finish loading
    if (authLoading) {
      logger.debug("Auth still loading, skipping token fetch");
      return null;
    }

    // Clear token if not authenticated
    if (!isAuthenticated) {
      logger.debug("Not authenticated, clearing token");
      setAccessToken(null);
      setError(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.debug("Fetching access token from server");

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
          "No access token returned. This may be due to either: (1) the M2M application not being configured correctly, or (2) the API resource not being assigned to the M2M app in Logto Console. Please check both settings."
        );
      }

      logger.info("Access token obtained from server");
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (err) {
      logger.error({ error: err }, "Token fetch failed");
      setError(err instanceof Error ? err : new Error(String(err)));
      setAccessToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Fetch token when authentication state changes
  useEffect(() => {
    logger.debug("useEffect triggered - calling fetchToken");
    fetchToken();
  }, [fetchToken]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    return await fetchToken();
  }, [fetchToken]);

  const value: TokenContextValue = {
    accessToken,
    isLoading,
    error,
    refreshToken,
    isAuthenticated,
    authLoading,
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
