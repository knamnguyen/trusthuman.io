"use client";

import type { QueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpBatchStreamLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@sassy/api";

import { env } from "~/env";
import {
  useCurrentLinkedInAccountId,
  useLinkedInAccountStore,
} from "~/stores/linkedin-account-store";
import { createQueryClient } from "./query-client";

let clientQueryClientSingleton: QueryClient | undefined = undefined;
const getQueryClient = () => {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

// Export the context for backward compatibility
export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

type TRPCClient = ReturnType<typeof createTRPCClient<AppRouter>>;

// Create a singleton trpc client that will be used in the global provider
let _trpcClient: TRPCClient | undefined;

export const getTrpcClient = (configGetter?: () => { accountId?: string }) => {
  if (typeof window === "undefined") {
    return createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (op) =>
            env.NODE_ENV === "development" ||
            (op.direction === "down" && op.result instanceof Error),
        }),
        httpBatchStreamLink({
          transformer: SuperJSON,
          url: getBaseUrl() + "/api/trpc",
          headers() {
            const headers = new Headers();
            headers.set("x-trpc-source", "nextjs-ssr");

            const config = configGetter?.();

            if (config?.accountId !== undefined) {
              headers.set("x-account-id", config.accountId);
            }

            return headers;
          },
        }),
      ],
    });
  }

  // Browser: use singleton pattern
  return (_trpcClient ??= createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          env.NODE_ENV === "development" ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchStreamLink({
        transformer: SuperJSON,
        url: getBaseUrl() + "/api/trpc",
        headers() {
          const headers = new Headers();
          headers.set("x-trpc-source", "nextjs-react");

          const config = configGetter?.();

          if (config?.accountId !== undefined) {
            headers.set("x-account-id", config.accountId);
          }

          return headers;
        },
      }),
    ],
  }));
};

const TRPCClientContext = createContext<TRPCClient | null>(null);

export function TRPCClientProvider(props: {
  client: TRPCClient;
  children: React.ReactNode;
}) {
  return (
    <TRPCClientContext.Provider value={props.client}>
      {props.children}
    </TRPCClientContext.Provider>
  );
}

export function useTRPCClient() {
  const context = useContext(TRPCClientContext);
  if (context === null) {
    throw new Error("useTrpcClient must be used within a TRPCClientProvider");
  }
  return context;
}

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const store = useLinkedInAccountStore();

  const [trpcClient] = useState(() =>
    getTrpcClient(() => ({
      accountId: store.state.accountId ?? undefined,
    })),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCClientProvider client={trpcClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <AssumedUserTokenRefresher />
          {props.children}
        </TRPCProvider>
      </TRPCClientProvider>
    </QueryClientProvider>
  );
}

function AssumedUserTokenRefresher() {
  const store = useLinkedInAccountStore();

  const trpc = useTRPC();

  const accountId = useCurrentLinkedInAccountId();

  const { data: token } = useQuery(
    trpc.account.token.queryOptions(
      {
        id: accountId ?? "",
      },
      {
        enabled: !!accountId,
        refetchInterval: 5 * 60_000, // every 5 minutes
      },
    ),
  );

  useEffect(() => {
    if (token !== undefined) {
      store.setAssumedUserToken(token);
    }
  }, [token, store]);

  return null;
}
