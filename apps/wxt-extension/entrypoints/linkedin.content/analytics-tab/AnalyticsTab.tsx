import { BarChart3, Eye, MessageSquare, PenSquare, TrendingUp, Users } from "lucide-react";

import { Button } from "@sassy/ui/button";

import {
  useCommentsHistory,
  usePostsHistory,
} from "../utils/data-fetch-mimic/use-dashboard-activity-history";
import { useContentImpressionsHistory } from "../utils/data-fetch-mimic/use-content-impressions-history";
import { useFollowersHistory } from "../utils/data-fetch-mimic/use-followers-history";
import { useProfileImpressionsHistory } from "../utils/data-fetch-mimic/use-profile-impressions-history";
import { useProfileViewsHistory } from "../utils/data-fetch-mimic/use-profile-views-history";
import { CommentsChart } from "./CommentsChart";
import { ContentImpressionsChart } from "./ContentImpressionsChart";
import { FollowersChart } from "./FollowersChart";
import { MetricCard } from "./MetricCard";
import { PostsChart } from "./PostsChart";
import { ProfileImpressionsChart } from "./ProfileImpressionsChart";
import { ProfileViewsChart } from "./ProfileViewsChart";

export function AnalyticsTab() {
  const {
    latest: profileViewsLatest,
    snapshots: profileViewsSnapshots,
    lastFetchTime: profileViewsLastFetch,
    isLoading: profileViewsLoading,
    error: profileViewsError,
    refetch: profileViewsRefetch,
  } = useProfileViewsHistory();

  const {
    latest: postsLatest,
    snapshots: postsSnapshots,
    lastFetchTime: postsLastFetch,
    isLoading: postsLoading,
    error: postsError,
    refetch: postsRefetch,
  } = usePostsHistory();

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

  // Debug: Check what hooks are returning
  console.log("📊 Analytics Tab State:", {
    postsSnapshots: postsSnapshots.length,
    commentsSnapshots: commentsSnapshots.length,
    profileViewsSnapshots: profileViewsSnapshots.length,
    followersSnapshots: followersSnapshots.length,
    profileImpressionsSnapshots: profileImpressionsSnapshots.length,
    contentImpressionsSnapshots: contentImpressionsSnapshots.length,
  });

  // Unified refresh - fetches all metrics at once for synchronized timestamps
  const refetchAll = async () => {
    await Promise.all([
      profileViewsRefetch(),
      postsRefetch(),
      commentsRefetch(),
      followersRefetch(),
      profileImpressionsRefetch(),
      contentImpressionsRefetch(),
    ]);
  };

  // Clear all stored data
  const clearAllData = async () => {
    if (
      window.confirm(
        "Are you sure you want to clear all analytics data? This cannot be undone.",
      )
    ) {
      const { storage } = await import("wxt/storage");
      await storage.removeItem("local:profile-views");
      await storage.removeItem("local:dashboard-posts");
      await storage.removeItem("local:dashboard-comments");
      await storage.removeItem("local:followers-count");
      await storage.removeItem("local:profile-impressions");
      await storage.removeItem("local:content-impressions");
      console.log("🗑️ All analytics data cleared");
      // Refresh page to reset UI
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4">
      <MetricCard
        title="Profile Views"
        icon={BarChart3}
        description={profileViewsLatest?.data.period}
        value={profileViewsLatest?.data.totalViews}
        valueLabel="views"
        lastUpdate={profileViewsLastFetch}
        isLoading={profileViewsLoading}
        error={profileViewsError}
        chartComponent={
          profileViewsSnapshots.length >= 2 ? (
            <ProfileViewsChart snapshots={profileViewsSnapshots} compact />
          ) : undefined
        }
      />

      <MetricCard
        title="Posts"
        icon={PenSquare}
        description={postsLatest?.data.period}
        value={postsLatest?.data.totalPosts}
        valueLabel="posts"
        lastUpdate={postsLastFetch}
        isLoading={postsLoading}
        error={postsError}
        chartComponent={
          postsSnapshots.length >= 2 ? (
            <PostsChart snapshots={postsSnapshots} compact />
          ) : undefined
        }
      />

      <MetricCard
        title="Comments"
        icon={MessageSquare}
        description={commentsLatest?.data.period}
        value={commentsLatest?.data.totalComments}
        valueLabel="comments"
        lastUpdate={commentsLastFetch}
        isLoading={commentsLoading}
        error={commentsError}
        chartComponent={
          commentsSnapshots.length >= 2 ? (
            <CommentsChart snapshots={commentsSnapshots} compact />
          ) : undefined
        }
      />

      <MetricCard
        title="Followers"
        icon={Users}
        value={followersLatest?.data.totalFollowers}
        valueLabel="followers"
        lastUpdate={followersLastFetch}
        isLoading={followersLoading}
        error={followersError}
        chartComponent={
          followersSnapshots.length >= 2 ? (
            <FollowersChart snapshots={followersSnapshots} compact />
          ) : undefined
        }
      />

      <MetricCard
        title="Profile Impressions"
        icon={Eye}
        description={profileImpressionsLatest?.data.period}
        value={profileImpressionsLatest?.data.totalImpressions}
        valueLabel="impressions"
        lastUpdate={profileImpressionsLastFetch}
        isLoading={profileImpressionsLoading}
        error={profileImpressionsError}
        chartComponent={
          profileImpressionsSnapshots.length >= 2 ? (
            <ProfileImpressionsChart
              snapshots={profileImpressionsSnapshots}
              compact
            />
          ) : undefined
        }
      />

      <MetricCard
        title="Content Impressions"
        icon={TrendingUp}
        description={contentImpressionsLatest?.data.period}
        value={contentImpressionsLatest?.data.totalImpressions}
        valueLabel="impressions"
        lastUpdate={contentImpressionsLastFetch}
        isLoading={contentImpressionsLoading}
        error={contentImpressionsError}
        chartComponent={
          contentImpressionsSnapshots.length >= 2 ? (
            <ContentImpressionsChart
              snapshots={contentImpressionsSnapshots}
              compact
            />
          ) : undefined
        }
      />

      <div className="flex gap-2">
        <Button
          onClick={refetchAll}
          variant="default"
          className="flex-1"
          disabled={
            profileViewsLoading ||
            postsLoading ||
            commentsLoading ||
            followersLoading ||
            profileImpressionsLoading ||
            contentImpressionsLoading
          }
        >
          {profileViewsLoading ||
          postsLoading ||
          commentsLoading ||
          followersLoading ||
          profileImpressionsLoading ||
          contentImpressionsLoading ? (
            "Refreshing..."
          ) : (
            "Refresh All"
          )}
        </Button>
        <Button onClick={clearAllData} variant="destructive" className="flex-1">
          Clear All Data
        </Button>
      </div>
    </div>
  );
}
