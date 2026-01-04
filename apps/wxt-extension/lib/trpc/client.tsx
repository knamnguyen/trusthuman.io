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

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@sassy/api";

import { authService } from "../auth-service";
import { getSyncHostUrl } from "../get-sync-host-url";

/**
 * Create tRPC context with useTRPC hook (tRPC v11 pattern)
 */
export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

/**
 * Get the tRPC server URL based on environment
 */
const getServerUrl = (): string => {
  // Use getSyncHostUrl which reads VITE_APP_URL from .env/.env.local
  // Examples:
  // - Main repo: http://localhost:3000/api/trpc
  // - Worktree: http://localhost:3010/api/trpc
  // - Production: https://engagekit.io/api/trpc
  // const baseUrl = getSyncHostUrl();
  let baseUrl: string;

  if (import.meta.env.VITE_NGROK_URL) {
    baseUrl = import.meta.env.VITE_NGROK_URL;
  } else if (import.meta.env.VITE_APP_URL) {
    baseUrl = import.meta.env.VITE_APP_URL;
  } else {
    // TODO: to be changed to api.engagekit.io when we move to a vps
    baseUrl = "https://engagekit.io";
  }

  console.log("tRPC Client: Server base URL:", baseUrl);
  return `${baseUrl}/api/trpc`;
};

/**
 * Create tRPC client singleton for the extension
 */
let _trpcClient: ReturnType<typeof createTRPCClient<AppRouter>> | undefined;

export const getTrpcClient = () => {
  return (_trpcClient ??= createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getServerUrl(),
        transformer: superjson,
        async headers() {
          // Get fresh token from background worker via message passing
          const token = await authService.getToken();

          const headers: Record<string, string> = {
            // Must be "chrome-extension" to match server middleware Bearer token auth path
            "x-trpc-source": "chrome-extension",
            // Bypass ngrok browser warning (for development)
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          };

          if (token) {
            headers.Authorization = `Bearer ${token}`;
            console.log(
              "tRPC Client: Adding Authorization header with token from background worker",
            );
          } else {
            console.warn(
              "tRPC Client: No token available - request will be unauthenticated",
            );
          }

          return headers;
        },
      }),
    ],
  }));
};

/**
 * Create QueryClient with extension-specific defaults
 */
const createQueryClient = () =>
  new QueryClient({
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
  });

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
  const [queryClient] = useState(createQueryClient);
  const [trpcClient] = useState(getTrpcClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
