"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

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
  console.log(
    "[TokenProvider] 🔥 FUNCTION BODY EXECUTING - typeof window:",
    typeof window
  );

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  console.log("[TokenProvider] Component render", {
    window: typeof window,
    isAuthenticated,
    authLoading,
    accessToken: accessToken ? "present" : "null",
  });

  // Check authentication by calling the server-side API
  // This ensures client state syncs with server session after callback
  useEffect(() => {
    let cancelled = false;

    async function checkAuthStatus() {
      console.log(
        "[TokenProvider] 🌐 CLIENT: useEffect running, checking auth status..."
      );

      try {
        const res = await fetch("/api/logto/user", { credentials: "include" });
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          const authenticated = Boolean(data?.isAuthenticated);
          console.log("[TokenProvider] 🌐 CLIENT: Auth status received:", {
            authenticated,
          });
          setIsAuthenticated(authenticated);
        } else {
          console.log(
            "[TokenProvider] 🌐 CLIENT: Auth check failed, status:",
            res.status
          );
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[TokenProvider] 🌐 CLIENT: Auth check error:", err);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          console.log(
            "[TokenProvider] 🌐 CLIENT: Setting authLoading to false"
          );
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
    console.log("[TokenProvider] fetchToken called", {
      isAuthenticated,
      authLoading,
    });

    // Wait for auth to finish loading
    if (authLoading) {
      console.log("[TokenProvider] Auth still loading, skipping token fetch");
      return null;
    }

    // Clear token if not authenticated
    if (!isAuthenticated) {
      console.log("[TokenProvider] Not authenticated, clearing token");
      setAccessToken(null);
      setError(null);
      setIsLoading(false);
      return null;
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
          "No access token returned. This may be due to either: (1) the M2M application not being configured correctly, or (2) the API resource not being assigned to the M2M app in Logto Console. Please check both settings."
        );
      }

      console.log("[TokenProvider] ✅ Access token obtained from server");
      setAccessToken(data.accessToken);
      return data.accessToken;
    } catch (err) {
      console.error("[TokenProvider] ❌ Token fetch failed:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setAccessToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // Fetch token when authentication state changes
  useEffect(() => {
    console.log("[TokenProvider] useEffect triggered - calling fetchToken");
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
