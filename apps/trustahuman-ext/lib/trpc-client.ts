import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@sassy/api";

const getApiUrl = () => {
  if (import.meta.env.VITE_NGROK_URL) return import.meta.env.VITE_NGROK_URL;
  if (import.meta.env.VITE_APP_URL) return import.meta.env.VITE_APP_URL;
  if (import.meta.env.MODE === "production") return "https://trusthuman.io";
  return "https://dev.trusthuman.io";
};

const API_URL = getApiUrl();
console.log("TrustAHuman tRPC: Server URL:", `${API_URL}/api/trpc`);

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
