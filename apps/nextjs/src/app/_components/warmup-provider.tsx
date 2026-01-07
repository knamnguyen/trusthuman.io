"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

const AUTH_CACHE_REFRESH_MS = 55_000;

export function WarmupProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { refetch } = useQuery(
    trpc.user.warmup.queryOptions(undefined, {
      enabled: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }),
  );

  useEffect(() => {
    if (!isSignedIn) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial warmup
    refetch();

    // Periodic warmup every 55s (before 60s server TTL expires)
    intervalRef.current = setInterval(() => {
      refetch();
    }, AUTH_CACHE_REFRESH_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSignedIn, refetch]);

  return <>{children}</>;
}
