import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import { useAccountStore } from "../../stores/account-store";
import type { DataHistory, DataSnapshot } from "./data-collector";
import type { ProfileImpressionsData } from "./linkedin-profile-impressions-fetcher";
import { profileImpressionsCollector } from "./profile-impressions-collector";

interface UseProfileImpressionsHistoryReturn {
  snapshots: DataSnapshot<ProfileImpressionsData>[];
  latest: DataSnapshot<ProfileImpressionsData> | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to access profile impressions history from storage
 * - Loads history on mount
 * - Watches for storage changes
 * - Account-specific data (tied to current LinkedIn account)
 * - Provides manual refetch function
 */
export function useProfileImpressionsHistory(): UseProfileImpressionsHistoryReturn {
  const accountId = useAccountStore((state) => state.currentLinkedIn.profileUrn);
  const [history, setHistory] = useState<DataHistory<ProfileImpressionsData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage and reload when account changes
  useEffect(() => {
    profileImpressionsCollector.getHistory(accountId).then((h) => setHistory(h));
  }, [accountId]);

  // Watch for storage changes (account-specific key)
  useEffect(() => {
    if (!accountId) return;

    const storageKey = `local:profile-impressions-${accountId}` as `local:${string}`;
    const unwatch = storage.watch<DataHistory<ProfileImpressionsData>>(
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
      const data = await profileImpressionsCollector.manualFetch(accountId);
      if (!data) {
        setError("Failed to fetch profile impressions data");
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
