import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import { useAccountStore } from "../../stores/account-store";
import type { DataHistory, DataSnapshot } from "./data-collector";
import { inviteCountCollector } from "./invite-count-collector";
import type { InviteCountData } from "./linkedin-invite-count-fetcher";

interface UseInviteCountHistoryReturn {
  snapshots: DataSnapshot<InviteCountData>[];
  latest: DataSnapshot<InviteCountData> | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to access invite count history from storage
 * - Loads history on mount
 * - Watches for storage changes
 * - Account-specific data (tied to current LinkedIn account)
 * - Provides manual refetch function
 */
export function useInviteCountHistory(): UseInviteCountHistoryReturn {
  const accountId = useAccountStore((state) => state.currentLinkedIn.miniProfileId);
  const [history, setHistory] = useState<DataHistory<InviteCountData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage and reload when account changes
  useEffect(() => {
    inviteCountCollector.getHistory(accountId).then((h) => setHistory(h));
  }, [accountId]);

  // Watch for storage changes (account-specific key)
  useEffect(() => {
    if (!accountId) return;

    const storageKey = `local:invite-count-${accountId}` as `local:${string}`;
    const unwatch = storage.watch<DataHistory<InviteCountData>>(
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
      const data = await inviteCountCollector.manualFetch(accountId);
      if (!data) {
        setError("Failed to fetch invite count data");
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
