"use client";

import type { Clerk } from "@clerk/clerk-js";
import type { QueryClient } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
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
import { useAccountStore } from "~/stores/zustand-store";
import { createQueryClient } from "./query-client";

function getClerkTokenFactory() {
  let ready = false;
  let clerk: Clerk | undefined = undefined;

  return async () => {
    if (clerk !== undefined && ready === true) {
      // if we already have clerk and it's ready, return the token or null
      return (await clerk.session?.getToken()) ?? null;
    }

    return retry(
      async () => {
        clerk = window.Clerk;

        // checking if clerk loaded in window, else throw for retry
        if (clerk === undefined) {
          throw new Error("throwing for retry");
        }

        // if already ready, as previously checked, return the token or null
        if (ready === true) {
          return (await clerk.session?.getToken()) ?? null;
        }

        // Check if Clerk is ALREADY ready before waiting for status event
        // This fixes the bug where status event already fired before we added listener
        const currentStatus = clerk.status;
        if (currentStatus === "ready" || currentStatus === "degraded") {
          ready = true;
          return (await clerk.session?.getToken()) ?? null;
        }

        // this promise checks if session is loaded, and resolves the token or null
        return await new Promise<string | null>((resolve, reject) => {
          // timeout if session loading takes too long
          const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("Clerk session loading timed out"));
          }, 20_000);

          function cleanup() {
            clerk?.off("status", cb);
            clearTimeout(timeoutId);
          }

          // check if status is ready or degraded, then find the session token;
          // if we meet an error just cleanup and reject;
          // this messy ass type extraction is basically to extract the type of status callback param;
          function cb(
            status: Parameters<Parameters<NonNullable<Clerk["on"]>>[1]>[0],
          ) {
            if (status === "error") {
              reject(new Error("Clerk session error"));
              cleanup();
            }

            if (status === "ready" || status === "degraded") {
              ready = true;
              resolve(clerk?.session?.getToken() ?? null);
              cleanup();
            }
          }

          clerk?.on("status", cb);
        });
      },
      {
        timeout: Infinity,
      },
    );
  };
}

const getClerkToken = getClerkTokenFactory();

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
          console.log("[tRPC headers] Starting...");
          const headers = new Headers();
          headers.set("x-trpc-source", "nextjs-react");

          console.log("[tRPC headers] Getting Clerk token...");
          const clerkToken = await getClerkToken();
          console.log("[tRPC headers] Got token:", clerkToken ? "yes" : "no");
          if (clerkToken !== null) {
            headers.set("Authorization", `Bearer ${clerkToken}`);
          }

          // IMPORTANT: x-account-id is only set when Zustand store has an accountId.
          // The store is ONLY populated when user navigates to /[orgSlug]/[accountSlug]/... routes
          // (via AccountLayout's useEffect that calls setAccount).
          // When user is on org-level pages like /[orgSlug]/accounts, the store has accountId: null.
          // This ensures accountProcedure endpoints only receive the header when appropriate,
          // and orgProcedure endpoints work without requiring an account.
          //
          // Check Zustand store first (new dashboard), fallback to config getter (old dashboard)
          const zustandAccountId = useAccountStore.getState().accountId;
          const legacyAccountId = configGetter?.()?.accountId;
          const accountId = zustandAccountId ?? legacyAccountId;

          if (accountId !== undefined && accountId !== null) {
            headers.set("x-account-id", accountId);
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
          {props.children}
        </TRPCProvider>
      </TRPCClientProvider>
    </QueryClientProvider>
  );
}
