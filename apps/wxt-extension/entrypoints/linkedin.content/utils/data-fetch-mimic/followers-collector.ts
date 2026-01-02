import { DataCollector } from "./data-collector";
import { fetchFollowers, type FollowersData } from "./linkedin-followers-fetcher";

/**
 * Collector for followers count
 * - Stores last 90 snapshots
 * - Minimum 24 hours between auto-fetches
 * - Storage key: "local:followers-count"
 */
export const followersCollector = new DataCollector<FollowersData>(
  {
    storageKey: "followers-count",
    maxSnapshots: 90,
    minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  fetchFollowers,
);
