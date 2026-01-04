"use client";

import type { Clerk } from "@clerk/clerk-js";
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
import { retry } from "~/lib/retry";
import { useLinkedInAccountStore } from "~/stores/linkedin-account-store";
import { createQueryClient } from "./query-client";

function getClerkToken() {
  return retry(
    () => {
      const clerk = window.Clerk;
      // checking if clerk loaded in window, else throw for retry
      if (clerk === undefined) {
        throw new Error("throwing for retry");
      }

      // this promise checks if session is loaded, and resolves the token or null
      return new Promise<string | null>((resolve, reject) => {
        // timeout if session loading takes too long
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error("Clerk session loading timed out"));
        }, 20_000);

        function cleanup() {
          clerk?.off("status", cb);
          clearTimeout(timeoutId);
        }

        // check if status is ready or degraded, then find the session token
        // if error just cleanup and reject;
        function cb(status: "ready" | "degraded" | "error" | (string | {})) {
          if (status === "error") {
            reject(new Error("Clerk session error"));
            cleanup();
          }

          if (status === "ready" || status === "degraded") {
            resolve(clerk?.session?.getToken() ?? null);
            cleanup();
          }
        }

        clerk.on("status", cb);
      });
    },
    {
      timeout: Infinity,
    },
  );
}

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

type TRPCClient = ReturnType<typeof createTRPCClient<AppRouter>>;

// Create a singleton trpc client that will be used in the global provider
let _trpcClient: TRPCClient | undefined;

export const getTrpcClient = (configGetter?: () => { accountId?: string }) => {
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
        url: env.NEXT_PUBLIC_API_URL + "/api/trpc",
        async headers() {
          const headers = new Headers();
          headers.set("x-trpc-source", "nextjs-react");

          const config = configGetter?.();

          const clerkToken = await getClerkToken();
          if (clerkToken !== null) {
            headers.set("Authorization", `Bearer ${clerkToken}`);
          }

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
          <DefaultAccountFetcher />
          {props.children}
        </TRPCProvider>
      </TRPCClientProvider>
    </QueryClientProvider>
  );
}

function DefaultAccountFetcher() {
  const trpc = useTRPC();
  const store = useLinkedInAccountStore();

  const defaultAccount = useQuery(
    trpc.account.getDefaultAccount.queryOptions(undefined, {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }),
  );

  useEffect(() => {
    // we only set default account id if none is set yet
    if (store.state.accountId === null && defaultAccount.data?.account.id) {
      store.setAccountId(defaultAccount.data.account.id);
    }
  }, [defaultAccount.data?.account.id, store]);

  return null;
}
