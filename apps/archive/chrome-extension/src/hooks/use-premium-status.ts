import { useUserData } from "./use-user-data";

export const usePremiumStatus = () => {
  const { data: userData, isLoading, hasCachedData, status } = useUserData();

  const accessType = userData?.accessType ?? null;

  // During loading with no cached data, return null to prevent incorrect UI flash
  // Only return false when we're certain the user is on a free plan
  const isPremium =
    isLoading && !hasCachedData
      ? null
      : accessType
        ? !["FREE"].includes(accessType)
        : false;

  // We're loading if useUserData is loading OR if we don't have any data yet
  const isPremiumLoading = isLoading || (!hasCachedData && !userData);

  console.log("usePremiumStatus:", {
    accessType,
    isPremium,
    isPremiumLoading,
    isLoading,
    hasCachedData,
    hasUserData: !!userData,
  });

  return {
    isPremium,
    isLoading: isPremiumLoading,
    accessType,
    status,
  };
};
