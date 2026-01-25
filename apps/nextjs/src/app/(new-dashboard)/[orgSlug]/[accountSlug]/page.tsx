"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { useAchievementsStore } from "~/stores/zustand-store";
import { useTRPC } from "~/trpc/react";

import { AchievementsSection } from "./_components/achievements/AchievementsSection";

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
            {/* Account Info Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Account Info</CardTitle>
                  <CardDescription>LinkedIn account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>
                      <span className="text-gray-500">Profile:</span>{" "}
                      {account?.profileSlug}
                    </p>
                    <p>
                      <span className="text-gray-500">Status:</span>{" "}
                      {account?.status ?? "Unknown"}
                    </p>
                    {account?.profileUrl && (
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View LinkedIn Profile →
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Use the sidebar to navigate to different sections.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Achievements Section */}
            <AchievementsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
