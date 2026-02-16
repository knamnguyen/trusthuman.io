import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@sassy/api";

const API_URL = import.meta.env.VITE_NGROK_URL || import.meta.env.VITE_APP_URL || "http://localhost:8030";
console.log("TrustAHuman tRPC: Server URL:", `${API_URL}/api/trpc`);

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
