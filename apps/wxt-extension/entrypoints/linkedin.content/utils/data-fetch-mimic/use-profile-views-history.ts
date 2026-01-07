import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import { useAccountStore } from "../../stores/account-store";
import type { DataHistory, DataSnapshot } from "./data-collector";
import type { ProfileViewData } from "./linkedin-personal-profile-view-fetcher";
import { profileViewsCollector } from "./profile-views-collector";

export interface UseProfileViewsHistoryReturn {
  /** All snapshots from newest to oldest */
  snapshots: DataSnapshot<ProfileViewData>[];
  /** Most recent snapshot (if any) */
  latest: DataSnapshot<ProfileViewData> | null;
  /** Timestamp of last fetch (ms) */
  lastFetchTime: number | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  /** Manually trigger a new fetch (ignores rate limit) */
  refetch: () => Promise<void>;
}

/**
 * React hook for accessing LinkedIn profile views history
 *
 * Features:
 * - Loads history from storage on mount
 * - Watches for storage changes and updates automatically
 * - Account-specific data (tied to current LinkedIn account)
 * - Provides manual refetch function
 * - Returns latest snapshot for easy access
 */
export function useProfileViewsHistory(): UseProfileViewsHistoryReturn {
  const accountId = useAccountStore((state) => state.currentLinkedIn.profileUrn);
  const [history, setHistory] = useState<DataHistory<ProfileViewData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial history and reload when account changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await profileViewsCollector.getHistory(accountId);
        setHistory(data);
        setError(null);
      } catch (err) {
        console.error("Error loading profile views history:", err);
        setError("Failed to load history");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [accountId]);

  // Watch for storage changes (account-specific key)
  useEffect(() => {
    if (!accountId) return;

    const storageKey = `local:profile-views-${accountId}` as `local:${string}`;
    const unwatch = storage.watch<DataHistory<ProfileViewData>>(
      storageKey,
      (newValue) => {
        if (newValue) {
          setHistory(newValue);
        }
      },
    );

    return () => unwatch();
  }, [accountId]);

  // Manual refetch function
  const refetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await profileViewsCollector.manualFetch(accountId);
      if (!data) {
        setError("Failed to fetch profile views");
      }
    } catch (err) {
      console.error("Error during manual refetch:", err);
      setError("Failed to refetch data");
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
