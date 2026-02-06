import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

import { fetchMemberComments } from "../save-profile/linkedin-comments-fetcher";
import type { CommentData } from "../save-profile/saved-profile-store";
import { useAccountStore } from "../stores";

/** Helper to get YYYY-MM-DD from a Date object */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface CommentHistoryData {
  /** Daily counts: { "2026-02-06": 12, "2026-02-05": 8, ... } */
  dailyCounts: Record<string, number>;
  /** Total comments in the time window */
  totalComments: number;
  /** Start date (YYYY-MM-DD) */
  startDate: string;
  /** End date (YYYY-MM-DD) */
  endDate: string;
}

/** Cached comment data structure */
interface CachedCommentHistory {
  /** Profile URN this cache belongs to */
  profileUrn: string;
  /** Timestamp of last fetch */
  lastFetchTime: number;
  /** Oldest comment timestamp in cache */
  oldestCommentTime: number;
  /** Daily counts from cached data */
  dailyCounts: Record<string, number>;
  /** Total comments cached */
  totalComments: number;
}

const CACHE_KEY = "local:comment-history-cache";

interface UseCommentHistoryReturn {
  data: CommentHistoryData | null;
  isLoading: boolean;
  error: Error | null;
  fetch: () => Promise<void>;
  /** Last fetch timestamp */
  lastFetchTime: number | null;
  /** Whether data came from cache */
  fromCache: boolean;
}

export type DaysOption = 14 | 30 | 60;

/**
 * Hook to fetch and process comment history for the current LinkedIn profile.
 * Uses smart caching to minimize API calls:
 * - Stores fetched data in local storage
 * - On refetch, only fetches new data since last cache
 * - Merges new data with cached data
 */
export function useCommentHistory(): UseCommentHistoryReturn & {
  fetchWithDays: (days: DaysOption) => Promise<void>;
  clearCache: () => Promise<void>;
} {
  const [data, setData] = useState<CommentHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const { currentLinkedIn } = useAccountStore();

  // Load cached data on mount
  useEffect(() => {
    loadFromCache();
  }, [currentLinkedIn.profileUrn]);

  const loadFromCache = async () => {
    try {
      const cached = await storage.getItem<CachedCommentHistory>(CACHE_KEY);
      if (cached && cached.profileUrn === currentLinkedIn.profileUrn) {
        // Reconstruct data from cache
        const endDate = new Date();
        const result = buildHistoryData(cached.dailyCounts, 60, endDate);
        setData(result);
        setLastFetchTime(cached.lastFetchTime);
        setFromCache(true);
        console.log(
          `Loaded ${cached.totalComments} comments from cache (last fetch: ${new Date(cached.lastFetchTime).toLocaleString()})`,
        );
      }
    } catch (e) {
      console.error("Failed to load cache:", e);
    }
  };

  const fetchHistory = async (days: DaysOption = 14) => {
    setIsLoading(true);
    setError(null);
    setFromCache(false);

    try {
      const profileUrn = currentLinkedIn.profileUrn;
      if (!profileUrn) {
        throw new Error("No LinkedIn profile URN available");
      }

      // Load existing cache
      const cached = await storage.getItem<CachedCommentHistory>(CACHE_KEY);
      const isValidCache =
        cached && cached.profileUrn === profileUrn && cached.oldestCommentTime;

      // Calculate how many days we need to fetch
      const now = Date.now();
      const requestedCutoff = now - days * 24 * 60 * 60 * 1000;

      let daysToFetch = days;
      let shouldMergeWithCache = false;

      if (isValidCache) {
        // Check if cache covers the requested period
        const lastFetchAgo = (now - cached.lastFetchTime) / (24 * 60 * 60 * 1000);

        if (cached.oldestCommentTime <= requestedCutoff && lastFetchAgo < 1) {
          // Cache has enough history and was fetched recently
          // Just fetch the delta (new comments since last fetch)
          const daysSinceLastFetch = Math.ceil(lastFetchAgo) + 1; // +1 buffer
          daysToFetch = Math.max(daysSinceLastFetch, 3); // At least 3 days for safety
          shouldMergeWithCache = true;
          console.log(
            `Smart fetch: Only fetching ${daysToFetch} days (cache has ${days} days of history)`,
          );
        } else if (cached.oldestCommentTime <= requestedCutoff) {
          // Cache has enough history but is old, fetch more recent data
          const daysSinceLastFetch = Math.ceil(lastFetchAgo) + 2;
          daysToFetch = Math.min(daysSinceLastFetch, days);
          shouldMergeWithCache = true;
          console.log(
            `Refreshing cache: Fetching ${daysToFetch} days of new data`,
          );
        } else {
          // Cache doesn't have enough history, fetch full range
          console.log(
            `Cache insufficient: Fetching full ${days} days`,
          );
        }
      }

      // Fetch comments
      const comments = await fetchMemberComments(profileUrn, daysToFetch);
      const validComments = comments.filter((c) => c.time !== null);

      // Group by date
      const newDailyCounts: Record<string, number> = {};
      let oldestNewCommentTime = now;

      for (const comment of validComments) {
        const dateKey = toDateString(new Date(comment.time!));
        newDailyCounts[dateKey] = (newDailyCounts[dateKey] || 0) + 1;
        if (comment.time! < oldestNewCommentTime) {
          oldestNewCommentTime = comment.time!;
        }
      }

      // Merge with cache if applicable
      let finalDailyCounts: Record<string, number>;
      let finalOldestTime: number;
      let totalComments: number;

      if (shouldMergeWithCache && isValidCache) {
        // Merge: new data takes precedence for overlapping dates
        finalDailyCounts = { ...cached.dailyCounts };

        // Update with new data (overwrites overlapping dates)
        for (const [date, count] of Object.entries(newDailyCounts)) {
          finalDailyCounts[date] = count;
        }

        finalOldestTime = Math.min(cached.oldestCommentTime, oldestNewCommentTime);
        totalComments = Object.values(finalDailyCounts).reduce((a, b) => a + b, 0);

        console.log(
          `Merged: ${validComments.length} new comments with ${cached.totalComments} cached`,
        );
      } else {
        finalDailyCounts = newDailyCounts;
        finalOldestTime = oldestNewCommentTime;
        totalComments = validComments.length;
      }

      // Save to cache
      const newCache: CachedCommentHistory = {
        profileUrn,
        lastFetchTime: now,
        oldestCommentTime: finalOldestTime,
        dailyCounts: finalDailyCounts,
        totalComments,
      };
      await storage.setItem(CACHE_KEY, newCache);

      // Build result for requested days
      const endDate = new Date();
      const result = buildHistoryData(finalDailyCounts, days, endDate);

      setData(result);
      setLastFetchTime(now);

      console.log(
        `Fetched ${validComments.length} comments, total cached: ${totalComments}`,
      );
    } catch (e) {
      console.error("Failed to fetch comment history:", e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    await storage.removeItem(CACHE_KEY);
    setData(null);
    setLastFetchTime(null);
    setFromCache(false);
    console.log("Comment history cache cleared");
  };

  return {
    data,
    isLoading,
    error,
    lastFetchTime,
    fromCache,
    fetch: () => fetchHistory(14),
    fetchWithDays: fetchHistory,
    clearCache,
  };
}

/**
 * Build CommentHistoryData for a specific number of days
 */
function buildHistoryData(
  allDailyCounts: Record<string, number>,
  days: number,
  endDate: Date,
): CommentHistoryData {
  const dailyCounts: Record<string, number> = {};
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  // Fill in all dates for the period
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = toDateString(date);
    dailyCounts[dateStr] = allDailyCounts[dateStr] || 0;
  }

  const totalComments = Object.values(dailyCounts).reduce((a, b) => a + b, 0);

  return {
    dailyCounts,
    totalComments,
    startDate: toDateString(startDate),
    endDate: toDateString(endDate),
  };
}
