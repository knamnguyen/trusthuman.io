import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "../trpc/react";
import { useBackgroundAuth } from "./use-background-auth";

export const useDailyCommentCount = () => {
  const { isSignedIn, isLoaded, user } = useBackgroundAuth();
  const userId = user?.id;
  const trpc = useTRPC();
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(true);

  const getStorageKey = () => {
    if (!userId) return null;
    const today = new Date().toDateString();
    return `daily_comment_count_${userId}_${today}`;
  };

  // Load from storage on mount
  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      chrome.storage.local.get([storageKey], (result) => {
        if (result[storageKey] !== undefined) {
          setCachedCount(result[storageKey]);
        }
        setIsLoadingFromStorage(false);
      });
    } else {
      setIsLoadingFromStorage(false);
    }
  }, [userId]);

  // tRPC query for fresh data
  const queryResult = useQuery({
    ...trpc.user.getDailyCommentCount.queryOptions(),
    enabled: isLoaded && isSignedIn && !isLoadingFromStorage,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Save fresh data to storage
  useEffect(() => {
    const storageKey = getStorageKey();
    if (queryResult.data !== undefined && storageKey) {
      const newCount = queryResult.data;
      chrome.storage.local.set({ [storageKey]: newCount });
      if (cachedCount !== newCount) {
        setCachedCount(newCount);
      }
    }
  }, [queryResult.data, userId, cachedCount]);

  const data = queryResult.data ?? cachedCount;

  return {
    ...queryResult,
    data: data,
    isLoading: isLoadingFromStorage || (queryResult.isLoading && data === null),
  };
};
