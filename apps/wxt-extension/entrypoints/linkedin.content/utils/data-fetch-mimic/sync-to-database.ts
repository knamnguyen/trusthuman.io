import { storage } from "wxt/storage";

import { getTrpcClient } from "@/lib/trpc/client";

import { commentsCollector } from "./dashboard-activity-collectors";
import { contentImpressionsCollector } from "./content-impressions-collector";
import type { DataSnapshot } from "./data-collector";
import { followersCollector } from "./followers-collector";
import { inviteCountCollector } from "./invite-count-collector";
import { profileImpressionsCollector } from "./profile-impressions-collector";
import { profileViewsCollector } from "./profile-views-collector";

const BACKFILL_DONE_KEY = "local:analytics-backfill-done" as const;

interface DailyMetrics {
  date: string; // ISO datetime string (YYYY-MM-DDTHH:mm:ss.sssZ)
  followers: number;
  invites: number;
  comments: number;
  contentReach: number;
  profileViews: number;
  engageReach: number;
  timestamp: number; // Latest timestamp for this day (for debugging)
}

/**
 * Normalize Unix timestamp to YYYY-MM-DD date string (UTC)
 */
function timestampToDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0]!;
}

/**
 * Aggregate multiple snapshots by date, taking latest value per day
 */
function aggregateSnapshotsByDate<T extends { [key: string]: number }>(
  snapshots: DataSnapshot<T>[],
  valueKey: keyof T,
): Map<string, { value: number; timestamp: number }> {
  const dateMap = new Map<string, { value: number; timestamp: number }>();

  for (const snapshot of snapshots) {
    const dateStr = timestampToDateString(snapshot.timestamp);
    const existing = dateMap.get(dateStr);

    // Take snapshot with latest timestamp for each day
    if (!existing || snapshot.timestamp > existing.timestamp) {
      dateMap.set(dateStr, {
        value: snapshot.data[valueKey] as number,
        timestamp: snapshot.timestamp,
      });
    }
  }

  return dateMap;
}

/**
 * Check if backfill has been completed for this account
 */
async function isBackfillDone(accountId: string): Promise<boolean> {
  const key = `${BACKFILL_DONE_KEY}-${accountId}` as `local:${string}`;
  const done = await storage.getItem<boolean>(key);
  return done === true;
}

/**
 * Mark backfill as completed for this account
 */
async function markBackfillDone(accountId: string): Promise<void> {
  const key = `${BACKFILL_DONE_KEY}-${accountId}` as `local:${string}`;
  await storage.setItem(key, true);
  console.log(`✅ Backfill marked as done for account: ${accountId}`);
}

/**
 * Sync analytics data to database
 *
 * Strategy:
 * 1. Check if backfill has been done for this account
 * 2. If not: Read all historical data, batch sync via backfillAnalytics
 * 3. If yes: Only sync today's data via syncDailyMetrics
 *
 * @param accountId - LinkedIn account ID
 * @param forceTodayOnly - Force sync only today's data (skip backfill check)
 */
export async function syncToDatabase(
  accountId: string,
  forceTodayOnly = false,
): Promise<{ success: boolean; synced: number }> {
  try {
    console.log(`🔄 Starting database sync for account: ${accountId}`);

    const trpc = getTrpcClient();

    // Check if backfill already done (unless forcing today only)
    const backfillDone = forceTodayOnly || (await isBackfillDone(accountId));

    if (backfillDone) {
      // Only sync today's data
      console.log("📅 Syncing today's metrics only (backfill already done)");

      const [
        followersHistory,
        invitesHistory,
        commentsHistory,
        contentImpressionsHistory,
        profileViewsHistory,
        profileImpressionsHistory,
      ] = await Promise.all([
        followersCollector.getHistory(accountId),
        inviteCountCollector.getHistory(accountId),
        commentsCollector.getHistory(accountId),
        contentImpressionsCollector.getHistory(accountId),
        profileViewsCollector.getHistory(accountId),
        profileImpressionsCollector.getHistory(accountId),
      ]);

      // Get latest snapshot for each metric (today's data)
      const latestFollowers = followersHistory.snapshots[0];
      const latestInvites = invitesHistory.snapshots[0];
      const latestComments = commentsHistory.snapshots[0];
      const latestContentImpressions = contentImpressionsHistory.snapshots[0];
      const latestProfileViews = profileViewsHistory.snapshots[0];
      const latestProfileImpressions = profileImpressionsHistory.snapshots[0];

      // Check if we have data
      if (
        !latestFollowers ||
        !latestInvites ||
        !latestComments ||
        !latestContentImpressions ||
        !latestProfileViews ||
        !latestProfileImpressions
      ) {
        console.warn("⚠️ Missing metrics data, skipping sync");
        return { success: false, synced: 0 };
      }

      // Sync today's metrics
      await trpc.analytics.syncDailyMetrics.mutate({
        followers: latestFollowers.data.totalFollowers,
        invites: latestInvites.data.totalInvites,
        comments: latestComments.data.totalComments,
        contentReach: latestContentImpressions.data.totalImpressions,
        profileViews: latestProfileViews.data.totalViews,
        engageReach: latestProfileImpressions.data.totalImpressions,
        // date defaults to today
      });

      console.log("✅ Today's metrics synced successfully");
      return { success: true, synced: 1 };
    }

    // First time: Backfill all historical data
    console.log("📦 First sync: Backfilling historical data...");

    const [
      followersHistory,
      invitesHistory,
      commentsHistory,
      contentImpressionsHistory,
      profileViewsHistory,
      profileImpressionsHistory,
    ] = await Promise.all([
      followersCollector.getHistory(accountId),
      inviteCountCollector.getHistory(accountId),
      commentsCollector.getHistory(accountId),
      contentImpressionsCollector.getHistory(accountId),
      profileViewsCollector.getHistory(accountId),
      profileImpressionsCollector.getHistory(accountId),
    ]);

    // Aggregate snapshots by date (take latest timestamp per day)
    const followersByDate = aggregateSnapshotsByDate(
      followersHistory.snapshots,
      "totalFollowers",
    );
    const invitesByDate = aggregateSnapshotsByDate(
      invitesHistory.snapshots,
      "totalInvites",
    );
    const commentsByDate = aggregateSnapshotsByDate(
      commentsHistory.snapshots,
      "totalComments",
    );
    const contentImpressionsByDate = aggregateSnapshotsByDate(
      contentImpressionsHistory.snapshots,
      "totalImpressions",
    );
    const profileViewsByDate = aggregateSnapshotsByDate(
      profileViewsHistory.snapshots,
      "totalViews",
    );
    const profileImpressionsByDate = aggregateSnapshotsByDate(
      profileImpressionsHistory.snapshots,
      "totalImpressions",
    );

    // Get all unique dates (union of all metrics)
    const allDates = new Set<string>([
      ...followersByDate.keys(),
      ...invitesByDate.keys(),
      ...commentsByDate.keys(),
      ...contentImpressionsByDate.keys(),
      ...profileViewsByDate.keys(),
      ...profileImpressionsByDate.keys(),
    ]);

    // Build daily records array
    const dailyRecords: DailyMetrics[] = [];
    for (const dateStr of allDates) {
      // Skip if any metric is missing for this date (integrity check)
      if (
        !followersByDate.has(dateStr) ||
        !invitesByDate.has(dateStr) ||
        !commentsByDate.has(dateStr) ||
        !contentImpressionsByDate.has(dateStr) ||
        !profileViewsByDate.has(dateStr) ||
        !profileImpressionsByDate.has(dateStr)
      ) {
        console.warn(`⚠️ Incomplete data for ${dateStr}, skipping`);
        continue;
      }

      dailyRecords.push({
        date: `${dateStr}T00:00:00.000Z`, // Convert to full ISO datetime (midnight UTC)
        followers: followersByDate.get(dateStr)!.value,
        invites: invitesByDate.get(dateStr)!.value,
        comments: commentsByDate.get(dateStr)!.value,
        contentReach: contentImpressionsByDate.get(dateStr)!.value,
        profileViews: profileViewsByDate.get(dateStr)!.value,
        engageReach: profileImpressionsByDate.get(dateStr)!.value,
        timestamp: Math.max(
          followersByDate.get(dateStr)!.timestamp,
          invitesByDate.get(dateStr)!.timestamp,
          commentsByDate.get(dateStr)!.timestamp,
          contentImpressionsByDate.get(dateStr)!.timestamp,
          profileViewsByDate.get(dateStr)!.timestamp,
          profileImpressionsByDate.get(dateStr)!.timestamp,
        ),
      });
    }

    // Sort by date (oldest first)
    dailyRecords.sort((a, b) => a.date.localeCompare(b.date));

    console.log(`📊 Prepared ${dailyRecords.length} daily records for backfill`);

    if (dailyRecords.length === 0) {
      console.warn("⚠️ No data to sync");
      return { success: false, synced: 0 };
    }

    // Call backfillAnalytics
    const result = await trpc.analytics.backfillAnalytics.mutate({
      dailyRecords,
    });

    // Mark backfill as done
    await markBackfillDone(accountId);

    console.log(
      `✅ Backfill completed: ${result.synced} records synced to database`,
    );

    return { success: true, synced: result.synced };
  } catch (error) {
    console.error("❌ Database sync error:", error);
    return { success: false, synced: 0 };
  }
}
