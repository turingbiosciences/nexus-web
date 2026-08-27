'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { logger } from '@/lib/logger';

/**
 * Client-side authentication state.
 *
 * This deliberately carries NO access token. It used to: the provider fetched
 * an M2M token from /api/logto/token and every data-layer call attached it as a
 * bearer header. That token carried `scope: 'all'`, so any signed-in user could
 * read it out of devtools and call the API directly with full machine
 * privileges.
 *
 * The token now lives entirely server-side. The browser calls same-origin
 * /api/turing/* and the proxy route attaches credentials before forwarding, so
 * there is nothing here for a client to steal and nothing for callers to
 * thread through. If you find yourself wanting to add a token back to this
 * context, add it to the proxy instead.
 */
interface AuthStateValue {
  isAuthenticated: boolean;
  authLoading: boolean;
}

const AuthStateContext = createContext<AuthStateValue | undefined>(undefined);

export const AuthStateProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication against the server session. This keeps client state in
  // sync with the server after the sign-in callback.
  useEffect(() => {
    let cancelled = false;

    async function checkAuthStatus() {
      try {
        const res = await fetch('/api/logto/user', { credentials: 'include' });
        if (cancelled) return;

        if (res.ok) {
          const data = await res.json();
          const authenticated = Boolean(data?.isAuthenticated);
          logger.debug({ authenticated }, 'CLIENT: Auth status received');
          setIsAuthenticated(authenticated);
        } else {
          logger.warn({ status: res.status }, 'CLIENT: Auth check failed');
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (cancelled) return;
        logger.error({ error: err }, 'CLIENT: Auth check error');
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    checkAuthStatus();

    return () => {
      cancelled = true;
    };
  }, []); // Run once on mount

  // Memoised: a fresh object literal here would be a new value on every render,
  // re-rendering every consumer of the context even when neither flag changed.
  const value = useMemo(
    () => ({ isAuthenticated, authLoading }),
    [isAuthenticated, authLoading]
  );

  return (
    <AuthStateContext.Provider value={value}>
      {children}
    </AuthStateContext.Provider>
  );
};

export function useAuthState() {
  const ctx = useContext(AuthStateContext);
  if (!ctx) {
    throw new Error('useAuthState must be used within an AuthStateProvider');
  }
  return ctx;
}
