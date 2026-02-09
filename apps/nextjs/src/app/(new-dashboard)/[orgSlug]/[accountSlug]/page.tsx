"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useAchievementsStore } from "~/stores/zustand-store";
import { useTRPC } from "~/trpc/react";

import { AchievementsSection } from "./_components/achievements/AchievementsSection";
import { AnalyticsSection } from "./_components/analytics";

export default function AccountDashboardPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const trpc = useTRPC();

  // Zustand store actions
  const setProfileMetrics = useAchievementsStore((s) => s.setProfileMetrics);
  const setNetworkData = useAchievementsStore((s) => s.setNetworkData);
  const setActivityData = useAchievementsStore((s) => s.setActivityData);
  const setLoading = useAchievementsStore((s) => s.setLoading);
  const setError = useAchievementsStore((s) => s.setError);

  const { data: account } = useQuery(
    trpc.account.getBySlug.queryOptions({ slug: accountSlug }),
  );

  // Achievements data queries
  const {
    data: profileMetrics,
    isLoading: isProfileLoading,
    error: profileError,
  } = useQuery(trpc.achievements.getProfileMetrics.queryOptions());

  const {
    data: networkData,
    isLoading: isNetworkLoading,
    error: networkError,
  } = useQuery(trpc.achievements.getNetworkData.queryOptions());

  const {
    data: activityData,
    isLoading: isActivityLoading,
    error: activityError,
  } = useQuery(trpc.achievements.getActivityData.queryOptions());

  // Update Zustand store when data changes
  useEffect(() => {
    if (profileMetrics) {
      setProfileMetrics(profileMetrics);
    }
  }, [profileMetrics, setProfileMetrics]);

  useEffect(() => {
    if (networkData) {
      setNetworkData(networkData);
    }
  }, [networkData, setNetworkData]);

  useEffect(() => {
    if (activityData) {
      setActivityData(activityData);
    }
  }, [activityData, setActivityData]);

  // Update loading state (any query loading = global loading)
  useEffect(() => {
    setLoading(isProfileLoading || isNetworkLoading || isActivityLoading);
  }, [isProfileLoading, isNetworkLoading, isActivityLoading, setLoading]);

  // Update error state (prioritize first error encountered)
  useEffect(() => {
    const firstError = profileError ?? networkError ?? activityError;
    setError(firstError?.message ?? null);
  }, [profileError, networkError, activityError, setError]);

  return (
    <div className="flex h-screen flex-col">
      {/* Header - fixed at top, doesn't scroll */}
      <div className="shrink-0 border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Account Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview for {account?.profileSlug ?? accountSlug}
        </p>
      </div>

      {/* Main content - scrolls independently */}
      <div className="relative flex min-h-0 flex-1">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Analytics Section */}
            <AnalyticsSection />

            {/* Achievements Section */}
            <AchievementsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
