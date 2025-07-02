import type { QueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@sassy/api";

import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient());
};

// Export the context for tRPC hooks
export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

/**
 * Get the server URL based on environment
 */
const getServerUrl = (): string => {
  // For development with ngrok - check both VITE_NGROK_URL and NEXTJS_URL
  if (import.meta.env.VITE_NGROK_URL) {
    return `${import.meta.env.VITE_NGROK_URL}/api/trpc`;
  } else if (import.meta.env.VITE_NEXTJS_URL) {
    return `${import.meta.env.VITE_NEXTJS_URL}/api/trpc`;
  } else if (import.meta.env.DEV) {
    // For development with localhost
    return "http://localhost:3000/api/trpc";
  } else {
    // For production
    return "https://engagekit.io/api/trpc";
  }
};

/**
 * Cached Clerk session token - set once when needed
 */
let cachedClerkToken: string | null = null;

/**
 * Set the cached Clerk token (called when needed)
 */
export const setCachedClerkToken = (token: string | null) => {
  cachedClerkToken = token;
};

/**
 * Get Clerk session token - uses cached token for efficiency
 */
const getClerkToken = async (): Promise<string | null> => {
  if (cachedClerkToken) {
    return cachedClerkToken;
  } else {
    // Try to get token from Clerk if available
    if (typeof window !== "undefined" && (window as any).Clerk?.session) {
      try {
        const token = await (window as any).Clerk.session.getToken();
        setCachedClerkToken(token);
        return token;
      } catch (error) {
        console.warn("Failed to get Clerk token:", error);
      }
    }
    return null;
  }
};

// Create a singleton trpc client
let _trpcClient: ReturnType<typeof createTRPCClient<AppRouter>> | undefined;
const getTrpcClient = () => {
  return (_trpcClient ??= createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          import.meta.env.DEV ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: getServerUrl(),
        transformer: SuperJSON,
        async headers() {
          const clerkToken = await getClerkToken();
          const headers: Record<string, string> = {
            "x-trpc-source": "chrome-extension",
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          };

          if (clerkToken) {
            headers.Authorization = `Bearer ${clerkToken}`;
          }

          return headers;
        },
      }),
    ],
  }));
};

/**
 * Get standalone tRPC client for use outside React context
 * This is useful for services that need to make tRPC calls without React Query
 */
export const getStandaloneTRPCClient = () => {
  return getTrpcClient();
};

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(getTrpcClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
