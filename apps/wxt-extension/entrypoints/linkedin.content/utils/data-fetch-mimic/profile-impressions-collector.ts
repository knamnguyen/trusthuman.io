import { DataCollector } from "./data-collector";
import {
  fetchProfileImpressions,
  type ProfileImpressionsData,
} from "./linkedin-profile-impressions-fetcher";

/**
 * Collector for profile impressions (appearances)
 * - Stores last 90 snapshots
 * - Minimum 24 hours between auto-fetches
 * - Storage key: "local:profile-impressions"
 */
export const profileImpressionsCollector =
  new DataCollector<ProfileImpressionsData>(
    {
      storageKey: "profile-impressions",
      maxSnapshots: 90,
      minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
    },
    fetchProfileImpressions,
  );
