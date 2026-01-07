import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import { useAccountStore } from "../../stores/account-store";
import type { DataHistory, DataSnapshot } from "./data-collector";
import { followersCollector } from "./followers-collector";
import type { FollowersData } from "./linkedin-followers-fetcher";

interface UseFollowersHistoryReturn {
  snapshots: DataSnapshot<FollowersData>[];
  latest: DataSnapshot<FollowersData> | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to access followers history from storage
 * - Loads history on mount
 * - Watches for storage changes
 * - Account-specific data (tied to current LinkedIn account)
 * - Provides manual refetch function
 */
export function useFollowersHistory(): UseFollowersHistoryReturn {
  const accountId = useAccountStore((state) => state.currentLinkedIn.profileUrn);
  const [history, setHistory] = useState<DataHistory<FollowersData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage and reload when account changes
  useEffect(() => {
    followersCollector.getHistory(accountId).then((h) => setHistory(h));
  }, [accountId]);

  // Watch for storage changes (account-specific key)
  useEffect(() => {
    if (!accountId) return;

    const storageKey = `local:followers-count-${accountId}` as `local:${string}`;
    const unwatch = storage.watch<DataHistory<FollowersData>>(
      storageKey,
      (newValue) => {
        if (newValue) setHistory(newValue);
      },
    );
    return () => unwatch();
  }, [accountId]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await followersCollector.manualFetch(accountId);
      if (!data) {
        setError("Failed to fetch followers data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    snapshots: history.snapshots,
    latest: history.snapshots[0] || null,
    lastFetchTime: history.lastFetchTime,
    isLoading,
    error,
    refetch,
  };
}
