'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { logger } from '@/lib/logger';

interface ReactQueryProviderProps {
  children: ReactNode;
}

/**
 * Global error handler for React Query.
 *
 * This used to redirect to sign-out whenever an error message merely mentioned
 * 401 or "Unauthorized". That is a string match on arbitrary error text, and it
 * was one of three separate places that could independently end the session —
 * which is how a single transient 401 turned into a sign-out loop.
 *
 * Sign-out now belongs to authFetch alone, which confirms with the server that
 * the session is actually gone before acting. Here we only record the error.
 */
function handleQueryError(error: unknown) {
  if (error instanceof Error) {
    logger.error({ error: error.message }, 'ReactQuery: query error');
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
                  error.message.includes('401') ||
                  error.message.includes('Unauthorized') ||
                  error.message.includes('Signature has expired') ||
                  error.message.includes('token expired') ||
                  error.message.includes('Invalid token');

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
