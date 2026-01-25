"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Card, CardContent, CardHeader } from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";

import { useAchievementsStore } from "~/stores/zustand-store";

export function ProfileMetricsCard() {
  const profileMetrics = useAchievementsStore((s) => s.profileMetrics);
  const isLoading = useAchievementsStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <Skeleton className="h-20 w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Left Side - Profile Info */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profileMetrics?.profileImageUrl ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {profileMetrics?.profileSlug?.charAt(0).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <p className="text-sm font-semibold">
                @{profileMetrics?.profileSlug ?? "—"}
              </p>
              <p className="text-muted-foreground text-xs">
                LinkedIn Engagement 2026
              </p>
            </div>
          </div>

          {/* Right Side - Metrics Grid (2 rows × 3 columns) */}
          <div className="flex flex-1 flex-col justify-center gap-3">
            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {profileMetrics?.verifiedCount ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">🎯 Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {profileMetrics?.assistedCount ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">🤝 Assisted</div>
              </div>
              <div className="text-center">
                <div className="text-primary text-2xl font-bold">
                  TOP {profileMetrics?.percentile ?? 0}%
                </div>
                <div className="text-muted-foreground text-xs">🏆 Warrior</div>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold">
                  🔥 {profileMetrics?.currentStreak ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">
                  🏅 {profileMetrics?.longestStreak ?? 0}
                </div>
                <div className="text-muted-foreground text-xs">Longest Streak</div>
              </div>
              <div className="text-center">
                {/* Empty slot for balance */}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
