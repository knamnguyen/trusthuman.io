import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import { contentImpressionsCollector } from "./content-impressions-collector";
import type { DataHistory, DataSnapshot } from "./data-collector";
import type { ContentImpressionsData } from "./linkedin-content-impressions-fetcher";

interface UseContentImpressionsHistoryReturn {
  snapshots: DataSnapshot<ContentImpressionsData>[];
  latest: DataSnapshot<ContentImpressionsData> | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to access content impressions history from storage
 * - Loads history on mount
 * - Watches for storage changes
 * - Provides manual refetch function
 */
export function useContentImpressionsHistory(): UseContentImpressionsHistoryReturn {
  const [history, setHistory] = useState<DataHistory<ContentImpressionsData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage
  useEffect(() => {
    contentImpressionsCollector.getHistory().then((h) => setHistory(h));
  }, []);

  // Watch for storage changes
  useEffect(() => {
    const unwatch = storage.watch<DataHistory<ContentImpressionsData>>(
      "local:content-impressions",
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
      const data = await contentImpressionsCollector.manualFetch();
      if (!data) {
        setError("Failed to fetch content impressions data");
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
