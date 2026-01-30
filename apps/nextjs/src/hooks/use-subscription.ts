// apps/nextjs/src/hooks/use-subscription.ts
"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

/**
 * @deprecated Use `useOrgSubscription` from `~/hooks/use-org-subscription` instead.
 * This hook uses user-based billing (User.accessType) which is deprecated.
 * The new hook uses organization-based billing (Organization.subscriptionTier).
 *
 * React hook to check if user has access
 * Uses tRPC with React Query for caching
 */
export function useSubscription() {
  const trpc = useTRPC();

  // // Query with caching using standard useQuery + queryOptions directly from stripe
  // const { data, isLoading, error } = useQuery(
  //   trpc.stripe.checkAccess.queryOptions(),
  // );

  const { data, isPending, error } = useQuery({
    ...trpc.user.me.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  let hasAccess = false;
  if (data?.accessType !== "FREE") hasAccess = true;

  return {
    hasAccess: hasAccess,
    accessType: data?.accessType ?? "FREE",
    isLoading: isPending,
    error,
  };
}
