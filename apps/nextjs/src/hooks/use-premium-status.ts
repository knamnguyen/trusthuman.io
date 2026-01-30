import { useSubscription } from "./use-subscription";

/**
 * @deprecated Use `useOrgSubscription` from `~/hooks/use-org-subscription` instead.
 * This hook uses user-based billing which is deprecated.
 * The new hook uses organization-based billing with quota checks.
 */
export const usePremiumStatus = () => {
  const { isLoading, accessType } = useSubscription();

  // During loading with no cached data, return null to prevent incorrect UI flash
  // Only return false when we're certain the user is on a free plan
  const isPremium = isLoading ? null : !["FREE"].includes(accessType);

  return {
    isPremium,
    isLoading,
    accessType,
  };
};
