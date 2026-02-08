import {
  getAutoFetchIntervalMs,
  getLastUnifiedFetchTime,
  setLastUnifiedFetchTime,
} from "./auto-fetch-config";
import { contentImpressionsCollector } from "./content-impressions-collector";
import { commentsCollector } from "./dashboard-activity-collectors";
import { followersCollector } from "./followers-collector";
import { inviteCountCollector } from "./invite-count-collector";
import { fetchContentImpressions } from "./linkedin-content-impressions-fetcher";
import { fetchDashboardActivity } from "./linkedin-dashboard-activity-fetcher";
import { fetchFollowers } from "./linkedin-followers-fetcher";
import { fetchInviteCount } from "./linkedin-invite-count-fetcher";
import { fetchProfileViews } from "./linkedin-personal-profile-view-fetcher";
import { fetchProfileImpressions } from "./linkedin-profile-impressions-fetcher";
import { profileImpressionsCollector } from "./profile-impressions-collector";
import { profileViewsCollector } from "./profile-views-collector";
import { syncToDatabase } from "./sync-to-database";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second

/**
 * Unified auto-fetch for all 6 analytics metrics
 *
 * Features:
 * - Fetches ALL metrics together (all-or-nothing)
 * - Checks unified rate limit (configurable interval, default 2h)
 * - Retries up to 3 times with exponential backoff on failure
 * - Only saves data if ALL fetches succeed
 *
 * @param accountId - LinkedIn account ID for account-specific storage
 * @returns true if all metrics were fetched and saved successfully
 */
export async function autoFetchAllMetrics(accountId: string): Promise<boolean> {
  console.log(`🔄 Unified auto-fetch starting for account: ${accountId}`);

  // Check rate limit
  const [intervalMs, lastFetch] = await Promise.all([
    getAutoFetchIntervalMs(),
    getLastUnifiedFetchTime(),
  ]);

  // If fetching is disabled (intervalMs is Infinity), skip
  if (intervalMs === Infinity) {
    console.log(`⏸️ Auto-fetch is disabled`);
    return false;
  }

  if (lastFetch) {
    const timeSinceLastFetch = Date.now() - lastFetch;
    if (timeSinceLastFetch < intervalMs) {
      const remainingMinutes = Math.round(
        (intervalMs - timeSinceLastFetch) / 60000
      );
      const remainingHours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;

      console.log(
        `⏱️ Rate limited: ${remainingHours > 0 ? `${remainingHours}h ` : ""}${mins}m until next fetch`
      );
      return false;
    }
  }

  // Attempt fetch with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`📡 Fetch attempt ${attempt}/${MAX_RETRIES}...`);

      // Fetch all 6 metrics in parallel
      const [
        profileViews,
        dashboardActivity,
        inviteCount,
        followers,
        profileImpressions,
        contentImpressions,
      ] = await Promise.all([
        fetchProfileViews(),
        fetchDashboardActivity(), // Returns both posts and comments
        fetchInviteCount(),
        fetchFollowers(),
        fetchProfileImpressions(),
        fetchContentImpressions(),
      ]);

      // Check ALL succeeded (none are null)
      const results = {
        profileViews,
        dashboardActivity,
        inviteCount,
        followers,
        profileImpressions,
        contentImpressions,
      };

      const failedMetrics = Object.entries(results)
        .filter(([, value]) => value === null)
        .map(([key]) => key);

      if (failedMetrics.length > 0) {
        throw new Error(`Failed to fetch: ${failedMetrics.join(", ")}`);
      }

      // ALL succeeded - save all snapshots
      console.log("✅ All fetches succeeded, saving snapshots...");

      // Extract comments from dashboardActivity
      const commentsData = {
        totalComments: dashboardActivity!.comments,
        period: dashboardActivity!.period,
      };

      await Promise.all([
        profileViewsCollector.saveSnapshot(profileViews!, accountId),
        inviteCountCollector.saveSnapshot(inviteCount!, accountId),
        commentsCollector.saveSnapshot(commentsData, accountId),
        followersCollector.saveSnapshot(followers!, accountId),
        profileImpressionsCollector.saveSnapshot(profileImpressions!, accountId),
        contentImpressionsCollector.saveSnapshot(contentImpressions!, accountId),
      ]);

      // Update unified lastFetchTime
      await setLastUnifiedFetchTime(Date.now());

      console.log("✅ All 6 metrics fetched and saved successfully");

      // Sync to database (silent failure - don't block on errors)
      syncToDatabase(accountId).catch((err) => {
        console.error("⚠️ Database sync failed (non-blocking):", err);
      });

      return true;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error("❌ All retries failed - no data saved (rollback)");
  return false;
}

/**
 * Check if auto-fetch is due (rate limit check only, no fetching)
 *
 * @returns Object with isDue flag, disabled state, and time info
 */
export async function checkAutoFetchStatus(): Promise<{
  isDue: boolean;
  isDisabled: boolean;
  lastFetchTime: number | null;
  nextFetchTime: number | null;
  intervalMs: number;
}> {
  const [intervalMs, lastFetch] = await Promise.all([
    getAutoFetchIntervalMs(),
    getLastUnifiedFetchTime(),
  ]);

  // If intervalMs is Infinity, fetching is disabled
  const isDisabled = intervalMs === Infinity;
  const isDue = !isDisabled && (!lastFetch || Date.now() - lastFetch >= intervalMs);
  const nextFetchTime = isDisabled ? null : (lastFetch ? lastFetch + intervalMs : null);

  return {
    isDue,
    isDisabled,
    lastFetchTime: lastFetch,
    nextFetchTime,
    intervalMs,
  };
}
