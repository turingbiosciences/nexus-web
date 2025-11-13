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
import { logger } from "@/lib/logger";

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

  logger.debug(
    {
      isAuthenticated,
      isLoading,
      logtoIsAuthenticated: logto.isAuthenticated,
      logtoIsLoading: logto.isLoading,
      hasClaims: !!claims,
    },
    "GlobalAuthProvider component render"
  );

  // Initial auth check - moved before refreshAuth to avoid circular dependency
  useEffect(() => {
    logger.debug(
      {
        logtoIsAuthenticated: logto.isAuthenticated,
        logtoIsLoading: logto.isLoading,
      },
      "GlobalAuthProvider useEffect triggered"
    );

    async function checkAuth() {
      logger.debug("GlobalAuthProvider checkAuth called");
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
          logger.debug(
            {
              authenticated,
              hasClaims: !!data?.claims,
            },
            "GlobalAuthProvider API response"
          );
          setIsAuthenticated(authenticated);

          if (authenticated && data?.claims) {
            setClaims(data.claims);
          } else {
            setClaims(null);
          }
        } else {
          logger.warn(
            { status: response.status },
            "GlobalAuthProvider API response not OK"
          );
          setIsAuthenticated(false);
          setClaims(null);
        }
      } catch (err) {
        logger.error(
          { error: err },
          "GlobalAuthProvider failed to fetch auth state"
        );
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAuthenticated(false);
        setClaims(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [logto.isAuthenticated, logto.isLoading]);

  const refreshAuth = useCallback(async () => {
    logger.debug("GlobalAuthProvider refreshAuth called manually");

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
        logger.debug(
          {
            authenticated,
            hasClaims: !!data?.claims,
          },
          "GlobalAuthProvider API response"
        );
        setIsAuthenticated(authenticated);

        if (authenticated && data?.claims) {
          setClaims(data.claims);
        } else {
          setClaims(null);
        }
      } else {
        logger.warn(
          { status: response.status },
          "GlobalAuthProvider API response not OK"
        );
        setIsAuthenticated(false);
        setClaims(null);
      }
    } catch (err) {
      logger.error(
        { error: err },
        "GlobalAuthProvider failed to fetch auth state"
      );
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsAuthenticated(false);
      setClaims(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
