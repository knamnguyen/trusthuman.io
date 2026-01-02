import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import type { DataHistory, DataSnapshot } from "./data-collector";
import {
  commentsCollector,
  postsCollector,
  type CommentsData,
  type PostsData,
} from "./dashboard-activity-collectors";

interface UsePostsHistoryReturn {
  snapshots: DataSnapshot<PostsData>[];
  latest: DataSnapshot<PostsData> | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCommentsHistoryReturn {
  snapshots: DataSnapshot<CommentsData>[];
  latest: DataSnapshot<CommentsData> | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React hook to access posts history from storage
 * - Loads history on mount
 * - Watches for storage changes
 * - Provides manual refetch function
 */
export function usePostsHistory(): UsePostsHistoryReturn {
  const [history, setHistory] = useState<DataHistory<PostsData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage
  useEffect(() => {
    postsCollector.getHistory().then((h) => setHistory(h));
  }, []);

  // Watch for storage changes
  useEffect(() => {
    const unwatch = storage.watch<DataHistory<PostsData>>(
      "local:dashboard-posts",
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
      const data = await postsCollector.manualFetch();
      if (!data) {
        setError("Failed to fetch posts data");
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

/**
 * React hook to access comments history from storage
 * - Loads history on mount
 * - Watches for storage changes
 * - Provides manual refetch function
 */
export function useCommentsHistory(): UseCommentsHistoryReturn {
  const [history, setHistory] = useState<DataHistory<CommentsData>>({
    snapshots: [],
    lastFetchTime: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial history from storage
  useEffect(() => {
    commentsCollector.getHistory().then((h) => setHistory(h));
  }, []);

  // Watch for storage changes
  useEffect(() => {
    const unwatch = storage.watch<DataHistory<CommentsData>>(
      "local:dashboard-comments",
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
      const data = await commentsCollector.manualFetch();
      if (!data) {
        setError("Failed to fetch comments data");
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
