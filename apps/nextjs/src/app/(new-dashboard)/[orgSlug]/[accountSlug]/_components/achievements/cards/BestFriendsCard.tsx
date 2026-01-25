"use client";

import { useMemo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";

import { useAchievementsStore } from "~/stores/zustand-store";

// Get medal for top 3 positions
function getMedalIcon(position: number): string | null {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

interface BestFriend {
  position: number;
  name: string;
  avatarUrl: string | null;
  profileUrl: string;
  interactionCount: number;
  percentage: number;
}

export function BestFriendsCard() {
  const networkData = useAchievementsStore((s) => s.networkData);
  const isLoading = useAchievementsStore((s) => s.isLoading);

  const bestFriends = useMemo<BestFriend[]>(() => {
    if (!networkData || networkData.length === 0) return [];

    // Get top 5 profiles
    const top5 = networkData.slice(0, 5);

    // Find max interaction count for scaling progress bars
    const maxCount = Math.max(...top5.map((p) => p.interactionCount));

    return top5.map((profile, index) => ({
      position: index + 1,
      name: profile.authorName ?? "Unknown",
      avatarUrl: profile.authorAvatarUrl,
      profileUrl: profile.authorProfileUrl,
      interactionCount: profile.interactionCount,
      percentage: Math.round((profile.interactionCount / maxCount) * 100),
    }));
  }, [networkData]);

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Best Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!networkData || networkData.length === 0) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Best Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No network interactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle>Best Friends</CardTitle>
        <p className="text-muted-foreground text-xs">
          Top {bestFriends.length} most engaged profiles
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bestFriends.map((friend) => {
            const medal = getMedalIcon(friend.position);

            return (
              <div
                key={friend.profileUrl}
                className="group cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => {
                  window.open(friend.profileUrl, "_blank", "noopener,noreferrer");
                }}
              >
                {/* Friend row */}
                <div className="flex items-center gap-3">
                  {/* Position/Medal */}
                  <div className="flex w-8 items-center justify-center">
                    {medal ? (
                      <span className="text-2xl">{medal}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm font-semibold">
                        #{friend.position}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-12 w-12 border-2 border-black">
                    <AvatarImage src={friend.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-chart-1/20 text-sm font-semibold">
                      {friend.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name and count */}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <p className="font-semibold text-sm">
                        {friend.name.length > 25
                          ? `${friend.name.substring(0, 25)}...`
                          : friend.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {friend.interactionCount} cmts
                      </p>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-black/20 bg-muted">
                      <div
                        className="h-full bg-chart-1 transition-all"
                        style={{ width: `${friend.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
