import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../trpc/react";
import { useBackgroundAuth } from "./use-background-auth";

/**
 * Custom hook to fetch user data using tRPC with React Query
 * Uses local storage for immediate display and background sync for accuracy
 * Now uses background authentication service instead of Clerk directly
 */
export const useUserData = () => {
  const { isSignedIn, isLoaded, user } = useBackgroundAuth();
  const userId = user?.id;
  const trpc = useTRPC();
  const [cachedAccessType, setCachedAccessType] = useState<string | null>(null);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  // Load cached access type from storage immediately on mount (synchronous pattern)
  useEffect(() => {
    if (userId) {
      const storageKey = `user_access_type_${userId}`;
      chrome.storage.local.get([storageKey], (result) => {
        if (result[storageKey]) {
          setCachedAccessType(result[storageKey]);
        }
        setIsLoadingFromStorage(false);
      });
    } else {
      setIsLoadingFromStorage(false);
    }
  }, [userId]);

  // tRPC query for fresh data - only enabled after we've checked storage
  const queryResult = useQuery({
    ...trpc.user.me.queryOptions(),
    enabled: isLoaded && isSignedIn && !isLoadingFromStorage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Update local storage when fresh data arrives
  useEffect(() => {
    if (queryResult.data?.accessType && userId) {
      const newAccessType = queryResult.data.accessType;
      const storageKey = `user_access_type_${userId}`;

      // Update local storage
      chrome.storage.local.set({ [storageKey]: newAccessType });

      // Update cached state if it's different
      if (cachedAccessType !== newAccessType) {
        setCachedAccessType(newAccessType);
      }
    }
  }, [queryResult.data?.accessType, userId, cachedAccessType]);

  // Return combined state with immediate cached data and background sync
  return {
    ...queryResult,
    data:
      queryResult.data ||
      (cachedAccessType ? { accessType: cachedAccessType } : null),
    isLoading:
      isLoadingFromStorage || (queryResult.isLoading && !cachedAccessType), // Only show loading if still loading from storage or no cached data
    hasCachedData: !!cachedAccessType,
    isFetching: queryResult.isFetching,
  };
};

/**
 * Helper function to format access type for display
 */
export const formatAccessType = (accessType: string): string => {
  switch (accessType) {
    case "FREE":
      return "Free Plan";
    case "WEEKLY":
      return "Weekly Plan";
    case "MONTHLY":
      return "Monthly Plan";
    case "YEARLY":
      return "Yearly Plan";
    default:
      return "Unknown Plan";
  }
};

/**
 * Utility function to clear cached user data from local storage
 * Useful when user signs out or when cache needs to be invalidated
 */
export const clearCachedUserData = (userId?: string) => {
  if (userId) {
    const storageKey = `user_access_type_${userId}`;
    chrome.storage.local.remove([storageKey]);
  } else {
    // Clear all user access type caches if no specific user ID
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = Object.keys(items).filter((key) =>
        key.startsWith("user_access_type_"),
      );
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove);
      }
    });
  }
};
