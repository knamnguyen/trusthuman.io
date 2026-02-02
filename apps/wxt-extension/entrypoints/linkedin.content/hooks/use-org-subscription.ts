/**
 * useOrgSubscription Hook
 *
 * Fetches organization subscription status from tRPC.
 * Returns isPremium, premiumSource, isOverQuota, and other subscription details.
 * Supports both paid premium (Stripe subscription) and earned premium (social referral).
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
          isActive: boolean;
          premiumSource: "paid" | "earned" | "none";
          subscriptionTier: "FREE" | "PREMIUM";
          expiresAt?: Date | null;
          earnedPremiumExpiresAt?: Date | null;
          usedSlots: number;
          purchasedSlots: number;
        }) => {
          const isOverQuota = data.usedSlots > data.purchasedSlots;

          return {
            isPremium: data.isActive,
            premiumSource: data.premiumSource,
            isOverQuota,
            purchasedSlots: data.purchasedSlots,
            usedSlots: data.usedSlots,
            subscriptionTier: data.subscriptionTier,
            expiresAt: data.expiresAt,
            earnedPremiumExpiresAt: data.earnedPremiumExpiresAt,
          };
        },
        [],
      ),
      staleTime: 5 * 60 * 1000,
      retry: 2,
    }),
  );
}
