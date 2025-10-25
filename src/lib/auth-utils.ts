// Global authentication utilities integrating directly with the Logto React SDK.
// Provides a global context + module-level cache for non-React consumers.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useLogto } from "@logto/react";

export interface GlobalAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  claims?: Record<string, unknown>;
  getAccessToken: (resource?: string) => Promise<string | undefined>;
  refreshAuth: () => Promise<void>;
}

// Module-level mutable cache (updated by provider)
let cachedAuthState: Pick<
  GlobalAuthState,
  "isAuthenticated" | "isLoading" | "claims"
> = {
  isAuthenticated: false,
  isLoading: true,
  claims: undefined,
};

const GlobalAuthContext = createContext<GlobalAuthState | undefined>(undefined);

/**
 * Provider that bridges Logto SDK state into a global context and module cache.
 * Wrap this inside your existing `AuthProvider` (LogtoProvider) in `layout.tsx`.
 */
export function GlobalAuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, getAccessToken } = useLogto();
  const [claims, setClaims] = useState<Record<string, unknown> | undefined>();
  const fetchingRef = useRef(false);

  // Update module cache whenever primary flags change
  useEffect(() => {
    cachedAuthState = { isAuthenticated, isLoading, claims };
  }, [isAuthenticated, isLoading, claims]);

  // Lazy fetch server claims once authenticated
  useEffect(() => {
    if (!isAuthenticated || fetchingRef.current) return;
    fetchingRef.current = true;
    (async () => {
      try {
        const resp = await fetch("/api/logto/user", {
          credentials: "include",
          headers: { "cache-control": "no-store" },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data && typeof data === "object") {
            setClaims((prev) => ({ ...prev, ...data.claims }));
          }
        }
      } catch (e) {
        // Non-fatal; keep going without claims.
        console.warn("GlobalAuthProvider claims fetch failed", e);
      }
    })();
  }, [isAuthenticated]);

  const refreshAuth = useCallback(async () => {
    try {
      const resp = await fetch("/api/logto/user", {
        credentials: "include",
        headers: { "cache-control": "no-store" },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && typeof data === "object") {
          setClaims(data.claims);
          cachedAuthState = {
            isAuthenticated: true,
            isLoading: false,
            claims: data.claims,
          };
        } else {
          cachedAuthState = {
            isAuthenticated: true,
            isLoading: false,
            claims: undefined,
          };
        }
      } else {
        cachedAuthState = {
          isAuthenticated: false,
          isLoading: false,
          claims: undefined,
        };
      }
    } catch (error) {
      console.error("refreshAuth error", error);
    }
  }, []);

  const value: GlobalAuthState = {
    isAuthenticated,
    isLoading,
    claims,
    getAccessToken,
    refreshAuth,
  };

  // Use React.createElement to avoid requiring .tsx extension rename.
  return React.createElement(GlobalAuthContext.Provider, { value }, children);
}

/** Access global auth context inside React components */
export function useGlobalAuth(): GlobalAuthState {
  const ctx = useContext(GlobalAuthContext);
  if (!ctx) {
    throw new Error("useGlobalAuth must be used within <GlobalAuthProvider>");
  }
  return ctx;
}

/** Non-React access to last known auth flags (may be initial defaults before provider mounts). */
export function getAuthStateSnapshot() {
  return { ...cachedAuthState };
}

/**
 * checkAuth now prefers cached state; falls back to network only if still loading.
 */
export async function checkAuth(): Promise<boolean> {
  if (!cachedAuthState.isLoading) {
    return cachedAuthState.isAuthenticated;
  }
  try {
    const response = await fetch("/api/logto/user", {
      credentials: "include",
      headers: { "cache-control": "no-store" },
    });
    if (!response.ok) return false;
    return true;
  } catch (error) {
    console.error("checkAuth fallback error:", error);
    return false;
  }
}
