import { DataCollector } from "./data-collector";
import {
  fetchContentImpressions,
  type ContentImpressionsData,
} from "./linkedin-content-impressions-fetcher";

/**
 * Collector for content impressions
 * - Stores last 365 snapshots (1 year)
 * - Minimum 24 hours between auto-fetches
 * - Storage key: "local:content-impressions"
 */
export const contentImpressionsCollector =
  new DataCollector<ContentImpressionsData>(
    {
      storageKey: "content-impressions",
      maxSnapshots: 365,
      minIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
    },
    fetchContentImpressions,
  );
