/**
 * tRPC Client for TrustHuman Chrome Extension
 *
 * Uses authService to get JWT tokens from background worker (Clerk).
 * Content scripts cannot access Clerk directly, so we use message passing.
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";

import type { AppRouter } from "@sassy/api";

import { authService } from "./auth-service";
import { getApiUrl } from "./get-sync-host-url";

const API_URL = getApiUrl();
console.log("TrustAHuman tRPC: Server URL:", `${API_URL}/api/trpc`);

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
      async headers() {
        const token = await authService.getToken();
        const headers: Record<string, string> = {
          "x-trpc-source": "chrome-extension",
          // Skip ngrok browser warning page
          "ngrok-skip-browser-warning": "true",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        return headers;
      },
    }),
  ],
});
