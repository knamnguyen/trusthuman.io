import { useEffect, useState } from "react";
import {
  BarChart3,
  Eye,
  Mail,
  MessageSquare,
  PenSquare,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useAccountStore } from "../stores/account-store";
import {
  DEFAULT_AUTO_FETCH_INTERVAL_HOURS,
  getAutoFetchIntervalHours,
  INTERVAL_OPTIONS,
  setAutoFetchIntervalHours,
} from "../utils/data-fetch-mimic/auto-fetch-config";
import { useContentImpressionsHistory } from "../utils/data-fetch-mimic/use-content-impressions-history";
import {
  useCommentsHistory,
  // usePostsHistory, // COMMENTED OUT - Replaced with invite count
} from "../utils/data-fetch-mimic/use-dashboard-activity-history";
import { useFollowersHistory } from "../utils/data-fetch-mimic/use-followers-history";
import { useInviteCountHistory } from "../utils/data-fetch-mimic/use-invite-count-history";
import { useProfileImpressionsHistory } from "../utils/data-fetch-mimic/use-profile-impressions-history";
import { useProfileViewsHistory } from "../utils/data-fetch-mimic/use-profile-views-history";
import { MetricCard } from "./MetricCard";
import { UnifiedChart } from "./UnifiedChart";

export function AnalyticsTab() {
  const accountId = useAccountStore(
    (state) => state.currentLinkedIn.miniProfileId,
  );

  // Selection state for metrics to display on unified chart
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(["profileViews", "inviteCount", "comments"]), // Default: first 3 selected
  );

  // Auto-fetch interval setting (1-24 hours)
  const [autoFetchIntervalHours, setAutoFetchInterval] = useState(
    DEFAULT_AUTO_FETCH_INTERVAL_HOURS
  );

  // Load saved interval on mount
  useEffect(() => {
    getAutoFetchIntervalHours().then(setAutoFetchInterval);
  }, []);

  // Handle interval change
  const handleIntervalChange = async (hours: number) => {
    setAutoFetchInterval(hours);
    await setAutoFetchIntervalHours(hours);
  };

  const {
    latest: profileViewsLatest,
    snapshots: profileViewsSnapshots,
    lastFetchTime: profileViewsLastFetch,
    isLoading: profileViewsLoading,
    error: profileViewsError,
    refetch: profileViewsRefetch,
  } = useProfileViewsHistory();

  // COMMENTED OUT - Replaced with invite count
  // const {
  //   latest: postsLatest,
  //   snapshots: postsSnapshots,
  //   lastFetchTime: postsLastFetch,
  //   isLoading: postsLoading,
  //   error: postsError,
  //   refetch: postsRefetch,
  // } = usePostsHistory();

  const {
    latest: inviteCountLatest,
    snapshots: inviteCountSnapshots,
    lastFetchTime: inviteCountLastFetch,
    isLoading: inviteCountLoading,
    error: inviteCountError,
    refetch: inviteCountRefetch,
  } = useInviteCountHistory();

  const {
    latest: commentsLatest,
    snapshots: commentsSnapshots,
    lastFetchTime: commentsLastFetch,
    isLoading: commentsLoading,
    error: commentsError,
    refetch: commentsRefetch,
  } = useCommentsHistory();

  const {
    latest: followersLatest,
    snapshots: followersSnapshots,
    lastFetchTime: followersLastFetch,
    isLoading: followersLoading,
    error: followersError,
    refetch: followersRefetch,
  } = useFollowersHistory();

  const {
    latest: profileImpressionsLatest,
    snapshots: profileImpressionsSnapshots,
    lastFetchTime: profileImpressionsLastFetch,
    isLoading: profileImpressionsLoading,
    error: profileImpressionsError,
    refetch: profileImpressionsRefetch,
  } = useProfileImpressionsHistory();

  const {
    latest: contentImpressionsLatest,
    snapshots: contentImpressionsSnapshots,
    lastFetchTime: contentImpressionsLastFetch,
    isLoading: contentImpressionsLoading,
    error: contentImpressionsError,
    refetch: contentImpressionsRefetch,
  } = useContentImpressionsHistory();

  // Toggle metric selection
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  };

  // DEV ONLY - Unified refresh - fetches all metrics at once for synchronized timestamps
  // const refetchAll = async () => {
  //   console.log("🔄 Refreshing all metrics...");
  //   try {
  //     await Promise.all([
  //       profileViewsRefetch(),
  //       inviteCountRefetch(),
  //       commentsRefetch(),
  //       followersRefetch(),
  //       profileImpressionsRefetch(),
  //       contentImpressionsRefetch(),
  //     ]);
  //     console.log("✅ All metrics refresh initiated successfully");
  //   } catch (error) {
  //     console.error("❌ Refresh failed:", error);
  //     throw error;
  //   }
  // };

  // DEV ONLY - Clear all stored data for the current account
  // const clearAllData = async () => {
  //   if (
  //     window.confirm(
  //       "Are you sure you want to clear all analytics data for this LinkedIn account? This cannot be undone.",
  //     )
  //   ) {
  //     if (!accountId) {
  //       console.warn("No account ID available to clear data");
  //       return;
  //     }
  //     const { storage } = await import("wxt/storage");
  //     await storage.removeItem(`local:profile-views-${accountId}` as `local:${string}`);
  //     await storage.removeItem(`local:invite-count-${accountId}` as `local:${string}`);
  //     await storage.removeItem(`local:dashboard-comments-${accountId}` as `local:${string}`);
  //     await storage.removeItem(`local:followers-count-${accountId}` as `local:${string}`);
  //     await storage.removeItem(`local:profile-impressions-${accountId}` as `local:${string}`);
  //     await storage.removeItem(`local:content-impressions-${accountId}` as `local:${string}`);
  //     console.log(`🗑️ All analytics data cleared for account: ${accountId}`);
  //     window.location.reload();
  //   }
  // };

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Grid of metric cards - 2 rows x 3 columns */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("profileViews")}
        >
          <MetricCard
            title="Profile Views"
            icon={BarChart3}
            description={profileViewsLatest?.data.period}
            value={profileViewsLatest?.data.totalViews}
            valueLabel="views"
            lastUpdate={profileViewsLastFetch}
            isLoading={profileViewsLoading}
            error={profileViewsError}
            selected={selectedMetrics.has("profileViews")}
            compact
          />
        </div>

        {/* COMMENTED OUT - Replaced with invite count */}
        {/* <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("posts")}
        >
          <MetricCard
            title="Posts"
            icon={PenSquare}
            description={postsLatest?.data.period}
            value={postsLatest?.data.totalPosts}
            valueLabel="posts"
            lastUpdate={postsLastFetch}
            isLoading={postsLoading}
            error={postsError}
            selected={selectedMetrics.has("posts")}
            compact
          />
        </div> */}

        <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("inviteCount")}
        >
          <MetricCard
            title="Invites"
            icon={Mail}
            value={inviteCountLatest?.data.totalInvites}
            valueLabel="invites"
            lastUpdate={inviteCountLastFetch}
            isLoading={inviteCountLoading}
            error={inviteCountError}
            selected={selectedMetrics.has("inviteCount")}
            compact
          />
        </div>

        <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("comments")}
        >
          <MetricCard
            title="Comments"
            icon={MessageSquare}
            description={commentsLatest?.data.period}
            value={commentsLatest?.data.totalComments}
            valueLabel="comments"
            lastUpdate={commentsLastFetch}
            isLoading={commentsLoading}
            error={commentsError}
            selected={selectedMetrics.has("comments")}
            compact
          />
        </div>

        <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("followers")}
        >
          <MetricCard
            title="Followers"
            icon={Users}
            value={followersLatest?.data.totalFollowers}
            valueLabel="followers"
            lastUpdate={followersLastFetch}
            isLoading={followersLoading}
            error={followersError}
            selected={selectedMetrics.has("followers")}
            compact
          />
        </div>

        <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("profileImpressions")}
        >
          <MetricCard
            title="Engage Reach"
            icon={Eye}
            description={profileImpressionsLatest?.data.period}
            value={profileImpressionsLatest?.data.totalImpressions}
            valueLabel="impressions"
            lastUpdate={profileImpressionsLastFetch}
            isLoading={profileImpressionsLoading}
            error={profileImpressionsError}
            selected={selectedMetrics.has("profileImpressions")}
            compact
          />
        </div>

        <div
          className="cursor-pointer transition-all"
          onClick={() => toggleMetric("contentImpressions")}
        >
          <MetricCard
            title="Content Reach"
            icon={TrendingUp}
            description={contentImpressionsLatest?.data.period}
            value={contentImpressionsLatest?.data.totalImpressions}
            valueLabel="impressions"
            lastUpdate={contentImpressionsLastFetch}
            isLoading={contentImpressionsLoading}
            error={contentImpressionsError}
            selected={selectedMetrics.has("contentImpressions")}
            compact
          />
        </div>
      </div>

      {/* Unified Chart */}
      <UnifiedChart
        snapshots={{
          profileViews: profileViewsSnapshots,
          // posts: postsSnapshots, // COMMENTED OUT - Replaced with invite count
          inviteCount: inviteCountSnapshots,
          comments: commentsSnapshots,
          followers: followersSnapshots,
          profileImpressions: profileImpressionsSnapshots,
          contentImpressions: contentImpressionsSnapshots,
        }}
        selectedMetrics={selectedMetrics}
      />

      {/* Auto-fetch Settings */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">Auto-fetch every:</span>
        <select
          value={autoFetchIntervalHours}
          onChange={(e) => handleIntervalChange(Number(e.target.value))}
          className="rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {INTERVAL_OPTIONS.map((hours) => (
            <option key={hours} value={hours}>
              {hours} {hours === 1 ? "hour" : "hours"}
            </option>
          ))}
        </select>
      </div>

      {/* DEV ONLY - Action Buttons (commented out for production) */}
      {/* <div className="flex gap-2">
        <Button
          onClick={refetchAll}
          variant="primary"
          className="flex-1"
          disabled={
            profileViewsLoading ||
            inviteCountLoading ||
            commentsLoading ||
            followersLoading ||
            profileImpressionsLoading ||
            contentImpressionsLoading
          }
        >
          {profileViewsLoading ||
          inviteCountLoading ||
          commentsLoading ||
          followersLoading ||
          profileImpressionsLoading ||
          contentImpressionsLoading
            ? "Refreshing..."
            : "Refresh All"}
        </Button>
        <Button onClick={clearAllData} variant="destructive" className="flex-1">
          Clear All Data
        </Button>
      </div> */}
    </div>
  );
}
