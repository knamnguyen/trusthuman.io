/**
 * tRPC Client for WXT Extension - Content Script
 *
 * This client runs in content scripts (linkedin.com origin) and gets auth tokens
 * from the background worker via message passing.
 *
 * Pattern:
 * 1. Content script needs to make API call
 * 2. tRPC client calls authService.getToken() before each request
 * 3. authService messages background worker for fresh token
 * 4. Token is added to Authorization header
 * 5. API request is made with authentication
 */

import React from "react";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@sassy/api";

import { authService } from "../auth-service";
import { getSyncHostUrl } from "../get-sync-host";

/**
 * tRPC React client for type-safe API calls
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the tRPC server URL based on environment
 */
const getServerUrl = (): string => {
  // Use getSyncHostUrl which reads VITE_APP_URL from .env/.env.local
  // Examples:
  // - Main repo: http://localhost:3000/api/trpc
  // - Worktree: http://localhost:3010/api/trpc
  // - Production: https://engagekit.io/api/trpc
  const baseUrl = getSyncHostUrl();
  return `${baseUrl}/api/trpc`;
};

/**
 * Create tRPC client with React Query integration
 *
 * This client automatically gets fresh tokens from the background worker
 * before each request.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getServerUrl(),
        transformer: superjson,
        async headers() {
          // Get fresh token from background worker via message passing
          const token = await authService.getToken();

          const headers: Record<string, string> = {
            "x-trpc-source": "wxt-extension",
            // Bypass ngrok browser warning (for development)
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          };

          if (token) {
            headers.Authorization = `Bearer ${token}`;
            console.log(
              "tRPC Client: Adding Authorization header with token from background worker"
            );
          } else {
            console.warn(
              "tRPC Client: No token available - request will be unauthenticated"
            );
          }

          return headers;
        },
        // Handle network timeouts
        fetch: async (input, init) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

          try {
            const response = await fetch(input, {
              ...init,
              signal: AbortSignal.timeout(30000),
            });
            clearTimeout(timeoutId);
            return response;
          } catch (error) {
            clearTimeout(timeoutId);
            throw error;
          }
        },
      }),
    ],
  });
}

/**
 * TRPCReactProvider component
 *
 * Wraps the app with tRPC and React Query providers.
 * Use in content script (NO ClerkProvider needed).
 */
interface TRPCReactProviderProps {
  children: React.ReactNode;
}

export function TRPCReactProvider({ children }: TRPCReactProviderProps) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Disable automatic refetching in extension context
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // 5 minutes cache time
        staleTime: 5 * 60 * 1000,
        // Keep data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Don't retry failed requests automatically
        retry: 1,
      },
    },
  }));

  const [trpcClient] = React.useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}
