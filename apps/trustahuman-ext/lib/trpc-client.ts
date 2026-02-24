/**
 * tRPC Client for TrustHuman Chrome Extension
 *
 * Authentication is handled automatically by getClientCookies() in the background worker.
 * The background worker intercepts fetch requests and injects the Authorization header.
 * See: https://clerk.com/docs/references/chrome-extension/add-react-router
 *
 * DO NOT manually add Authorization header here - it will conflict with getClientCookies().
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@sassy/api";

import { getApiUrl } from "./get-sync-host-url";

const API_URL = getApiUrl();
console.log("TrustAHuman tRPC: Server URL:", `${API_URL}/api/trpc`);

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      headers() {
        // Authorization header is automatically injected by getClientCookies() in background worker
        return {
          "x-trpc-source": "chrome-extension",
          // Skip ngrok browser warning page
          "ngrok-skip-browser-warning": "true",
        };
      },
    }),
  ],
});
