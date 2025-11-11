"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * Global error handler for React Query.
 * Checks for 401 errors with expired token messages and redirects to sign-out.
 */
function handleQueryError(error: unknown) {
  if (error instanceof Error) {
    const is401Error =
      error.message.includes("401") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("Signature has expired") ||
      error.message.includes("token expired") ||
      error.message.includes("Invalid token");

    if (is401Error) {
      console.error("[ReactQuery] Token expired, redirecting to sign out");
      window.location.href = "/api/logto/sign-out";
    }
  }
}

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 401 errors
              if (error instanceof Error) {
                const is401 =
                  error.message.includes("401") ||
                  error.message.includes("Unauthorized") ||
                  error.message.includes("Signature has expired") ||
                  error.message.includes("token expired") ||
                  error.message.includes("Invalid token");

                if (is401) {
                  return false; // Don't retry, let onError handle it
                }
              }
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false, // Don't retry mutations by default
            onError: handleQueryError,
          },
        },
        queryCache: undefined,
        mutationCache: undefined,
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
