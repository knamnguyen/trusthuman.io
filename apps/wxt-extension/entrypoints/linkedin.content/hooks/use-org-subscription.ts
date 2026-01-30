/**
 * useOrgSubscription Hook
 *
 * Fetches organization subscription status from tRPC.
 * Returns isPremium, isOverQuota, and other subscription details.
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../../../lib/trpc/client";

export function useOrgSubscription() {
  const trpc = useTRPC();

  return useQuery(
    trpc.organization.subscription.status.queryOptions(undefined, {
      select: useCallback(
        (data: {
          subscriptionTier: "FREE" | "PREMIUM";
          expiresAt?: Date | null;
          usedSlots: number;
          purchasedSlots: number;
        }) => {
          const isPremium =
            data.subscriptionTier === "PREMIUM" &&
            data.expiresAt &&
            new Date(data.expiresAt) > new Date();

          const isOverQuota = data.usedSlots > data.purchasedSlots;

          return {
            isPremium: isPremium && !isOverQuota,
            isOverQuota,
            purchasedSlots: data.purchasedSlots,
            usedSlots: data.usedSlots,
            subscriptionTier: data.subscriptionTier,
          };
        },
        [],
      ),
      staleTime: 5 * 60 * 1000,
      retry: 2,
    }),
  );
}
