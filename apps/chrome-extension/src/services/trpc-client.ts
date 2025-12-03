import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@sassy/api";

/**
 * tRPC Client for Chrome Extension with Clerk Authentication
 *
 * This client properly integrates with Clerk's Chrome extension authentication
 * by using the global Clerk object instead of manually extracting tokens from storage
 */

/**
 * Get the server URL based on environment
 */
const getServerUrl = (): string => {
  let url: string;

  // For development with ngrok - check both VITE_NGROK_URL and NEXTJS_URL
  if (import.meta.env.VITE_NGROK_URL) {
    url = `${import.meta.env.VITE_NGROK_URL}/api/trpc`;
  } else if (import.meta.env.VITE_NEXTJS_URL) {
    url = `${import.meta.env.VITE_NEXTJS_URL}/api/trpc`;
  } else if (import.meta.env.DEV) {
    // For development with localhost
    url = "http://localhost:3000/api/trpc";
  } else {
    // For production
    url = "https://engagekit.io/api/trpc";
  }

  console.log("tRPC Client: Connecting to server URL:", url);
  return url;
};

/**
 * Cached Clerk session token - set once when commenting starts
 */
let cachedClerkToken: string | null = null;

/**
 * Set the cached Clerk token (called when starting commenting process)
 */
export const setCachedClerkToken = (token: string | null) => {
  cachedClerkToken = token;
  console.log("tRPC Client: Cached token set, length:", token?.length || 0);
  if (token) {
    console.log("tRPC Client: Cached token parts:", token.split(".").length);
    console.log(
      "tRPC Client: Cached token (first 50 chars):",
      token.substring(0, 50) + "...",
    );
  }
};

/**
 * Get Clerk session token - uses cached token for efficiency
 */
const getClerkToken = async (): Promise<string | null> => {
  if (cachedClerkToken) {
    console.log("tRPC Client: Using cached token");
    return cachedClerkToken;
  } else {
    console.warn("tRPC Client: No cached token available");
    return null;
  }
};

/**
 * Create tRPC client instance
 */
export const createExtensionTRPCClient = (opts?: {
  assumedUserToken?: string;
}) => {
  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: getServerUrl(),
        transformer: superjson,
        async headers() {
          const clerkToken = await getClerkToken();
          const headers: Record<string, string> = {
            "x-trpc-source": "chrome-extension",
            // Add ngrok headers to bypass browser warning page
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json",
          };

          if (opts?.assumedUserToken) {
            const assumedJwt = opts.assumedUserToken;
            if (assumedJwt !== null) {
              headers["x-assumed-user-token"] = assumedJwt;
              console.log(
                "tRPC Client: Adding x-assumed-user-jwt header, length:",
                assumedJwt.length,
              );
            }
          }

          if (clerkToken) {
            headers.Authorization = `Bearer ${clerkToken}`;
            console.log(
              "tRPC Client: Adding Authorization header with session token",
            );
          } else {
            console.warn(
              "tRPC Client: No token available - request will be unauthenticated",
            );
          }

          console.log("tRPC Client: Headers being sent:", headers);
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
};

/**
 * Singleton instance of the tRPC client
 */

const trpcClientCache = new Map<
  string,
  ReturnType<typeof createExtensionTRPCClient>
>();

/**
 * Get or create the tRPC client instance
 */
export const getTRPCClient = (opts?: { assumedUserToken?: string }) => {
  const cacheKey = JSON.stringify(opts ?? {});

  if (trpcClientCache.has(cacheKey)) {
    return trpcClientCache.get(cacheKey)!;
  }

  const client = createExtensionTRPCClient(opts);
  trpcClientCache.set(cacheKey, client);
  return client;
};

/**
 * Reset the tRPC client (useful for auth state changes)
 */
export const resetTRPCClient = () => {
  trpcClientCache.clear();
};
