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
 * Get fresh Clerk session token exclusively from background service
 * This follows Clerk's recommended pattern for Chrome extensions
 */
const getClerkToken = async (): Promise<string | null> => {
  try {
    console.log("tRPC: Requesting fresh token from background service...");

    const response = await chrome.runtime.sendMessage({
      action: "getFreshToken",
    });

    if (response?.token) {
      console.log("tRPC: Received fresh token, length:", response.token.length);
      return response.token;
    }

    console.warn("tRPC: No token received from background service");
    return null;
  } catch (error) {
    console.error("tRPC: Error getting token from background:", error);
    return null;
  }
};

const _trpcClientCache = new Map<
  string,
  ReturnType<typeof createTRPCClient<AppRouter>>
>();

// just cache based on config json stringification so we can have multiple clients if needed
const getTrpcClient = (opts?: { assumedUserToken?: string }) => {
  const cacheKey = JSON.stringify(opts ?? {});

  if (_trpcClientCache.has(cacheKey)) {
    return _trpcClientCache.get(cacheKey)!;
  }

  const client = createTRPCClient<AppRouter>({
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

          if (opts?.assumedUserToken !== undefined) {
            headers["x-assumed-user-token"] = opts.assumedUserToken;
          }

          console.info({ headers });

          if (clerkToken) {
            headers.Authorization = `Bearer ${clerkToken}`;
          }

          return headers;
        },
      }),
    ],
  });

  _trpcClientCache.set(cacheKey, client);

  return client;
};

/**
 * Get standalone tRPC client for use outside React context
 * This is useful for services that need to make tRPC calls without React Query
 */
export const getStandaloneTRPCClient = (config?: {
  assumedUserToken?: string;
}) => {
  return getTrpcClient(config);
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
