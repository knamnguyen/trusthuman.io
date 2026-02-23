"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";

import { useTRPC } from "~/trpc/react";
import { MESSAGING } from "./landing-content";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
  return (
    (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
  ).toUpperCase();
}

// Rank badge with medal for top 3 - matches leaderboard page exactly
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-lg">🥇</span>;
  }
  if (rank === 2) {
    return <span className="text-lg">🥈</span>;
  }
  if (rank === 3) {
    return <span className="text-lg">🥉</span>;
  }
  return (
    <span className="text-muted-foreground font-mono text-sm font-medium">
      {rank}
    </span>
  );
}

export function LeaderboardPreviewSection() {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.trustProfile.getLeaderboard.queryOptions({ limit: 10, offset: 0 }),
    refetchInterval: 60000, // Refresh every minute
  });

  // Don't render section if no users
  if (!isLoading && (!data?.users || data.users.length === 0)) {
    return null;
  }

  return (
    <section className="bg-muted/30 py-20 md:py-32">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            {MESSAGING.leaderboard.headline}
          </h2>
          <p className="text-muted-foreground text-xl">
            {MESSAGING.leaderboard.subheadline}
          </p>
        </div>

        <Card>
          {/* Table Header (sticky) - Responsive columns - matches leaderboard page */}
          <div className="sticky top-16 z-10 bg-card border-b rounded-t-lg">
            <div className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[3rem_1fr_5rem_4.5rem] gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-muted-foreground">
              <div className="text-center">#</div>
              <div>User</div>
              <div className="text-right">Verified</div>
              <div className="text-right hidden sm:block">Streak</div>
              <div className="text-right sm:hidden">🔥</div>
            </div>
          </div>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[3rem_1fr_5rem_4.5rem] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-0"
                  >
                    <div className="bg-muted/50 h-5 animate-pulse rounded" />
                    <div className="flex items-center gap-2">
                      <div className="bg-muted/50 h-8 w-8 animate-pulse rounded-full shrink-0" />
                      <div className="bg-muted/50 h-4 w-20 animate-pulse rounded" />
                    </div>
                    <div className="bg-muted/50 h-4 animate-pulse rounded" />
                    <div className="bg-muted/50 h-4 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {data?.users.map((user) => (
                  <Link
                    key={user.id}
                    href={`/${user.username}`}
                    className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[3rem_1fr_5rem_4.5rem] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-0 transition-colors hover:bg-muted/50"
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center">
                      <RankBadge rank={user.rank} />
                    </div>

                    {/* User - Compact on mobile */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm truncate">
                            {user.displayName || user.username}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="truncate">@{user.username}</span>
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary text-[9px] px-1 py-0 hidden sm:inline-flex"
                          >
                            #{user.humanNumber}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Verified count */}
                    <div className="flex items-center justify-end">
                      <span className="font-semibold text-sm">
                        {user.totalVerifications}
                      </span>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center justify-end">
                      {user.currentStreak > 0 ? (
                        <div className="flex items-center gap-0.5 text-orange-500">
                          <Flame className="h-3.5 w-3.5" />
                          <span className="font-semibold text-sm">
                            {user.currentStreak}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/leaderboard">{MESSAGING.leaderboard.viewAllCTA}</Link>
          </Button>
        </div>

        {/* Total count */}
        {data?.total !== undefined && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {data.total} verified humans and counting
          </div>
        )}
      </div>
    </section>
  );
}
