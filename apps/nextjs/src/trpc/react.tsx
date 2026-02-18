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
import { createQueryClient } from "./query-client";

function getClerkTokenFactory() {
  let ready = false;
  let clerk: Clerk | undefined = undefined;

  return async () => {
    if (clerk !== undefined && ready === true) {
      return (await clerk.session?.getToken()) ?? null;
    }

    return retry(
      async () => {
        clerk = window.Clerk;

        if (clerk === undefined) {
          throw new Error("throwing for retry");
        }

        if (ready === true) {
          return (await clerk.session?.getToken()) ?? null;
        }

        const currentStatus = clerk.status;
        if (currentStatus === "ready" || currentStatus === "degraded") {
          ready = true;
          return (await clerk.session?.getToken()) ?? null;
        }

        return await new Promise<string | null>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error("Clerk session loading timed out"));
          }, 20_000);

          function cleanup() {
            clerk?.off("status", cb);
            clearTimeout(timeoutId);
          }

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
    return createQueryClient();
  } else {
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

type TRPCClient = ReturnType<typeof createTRPCClient<AppRouter>>;

let _trpcClient: TRPCClient | undefined;

export const getTrpcClient = () => {
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

          const clerkToken = await getClerkToken();
          if (clerkToken !== null) {
            headers.set("Authorization", `Bearer ${clerkToken}`);
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
  const [trpcClient] = useState(() => getTrpcClient());

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
