"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { useTRPC } from "~/trpc/react";

type OrgSubStatus = 

/**
 * React hook to get organization subscription status.
 * Uses the org-centric billing system.
 */
export function useOrgSubscription() {
  const trpc = useTRPC();

  return useQuery(
    trpc.organization.subscription.status.queryOptions(undefined, {
      select: useCallback((data: {
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
      }, []),
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    }),
  );
}
