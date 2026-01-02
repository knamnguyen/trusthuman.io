import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

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
 * - Provides manual refetch function
 */
export function useFollowersHistory(): UseFollowersHistoryReturn {
  const [history, setHistory] = useState<DataHistory<FollowersData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage
  useEffect(() => {
    followersCollector.getHistory().then((h) => setHistory(h));
  }, []);

  // Watch for storage changes
  useEffect(() => {
    const unwatch = storage.watch<DataHistory<FollowersData>>(
      "local:followers-count",
      (newValue) => {
        if (newValue) setHistory(newValue);
      },
    );
    return () => unwatch();
  }, []);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await followersCollector.manualFetch();
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
