import { DataCollector } from "./data-collector";
import {
  fetchProfileViews,
  ProfileViewData,
} from "./linkedin-personal-profile-view-fetcher";

/**
 * Singleton data collector for LinkedIn profile view analytics
 *
 * Configuration:
 * - Stores last 365 snapshots (1 year)
 * - Minimum 24 hours between automatic fetches
 * - Storage key: "profile-views"
 */
export const profileViewsCollector = new DataCollector<ProfileViewData>(
  {
    storageKey: "profile-views",
    maxSnapshots: 365,
    minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  },
  fetchProfileViews,
);
