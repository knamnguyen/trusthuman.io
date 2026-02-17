import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { useAuth } from "@clerk/clerk-expo";
import SuperJSON from "superjson";
import { TRPCProvider } from "./trpc";
import type { AppRouter } from "@sassy/api";
import { useAccountStore } from "../stores/account-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => makeQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          transformer: SuperJSON,
          url: `${API_URL}/api/trpc`,
          async headers() {
            const headers: Record<string, string> = {
              "x-trpc-source": "expo-react-native",
            };
            const token = await getToken();
            if (token) {
              headers["Authorization"] = `Bearer ${token}`;
            }

            const accountId = useAccountStore.getState().accountId;
            if (accountId) {
              headers["x-account-id"] = accountId;
            }

            // DEBUG: Remove after verifying
            console.log("[tRPC Headers]", {
              hasToken: !!token,
              accountId: accountId ?? "none",
              url: `${API_URL}/api/trpc`,
            });

            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
