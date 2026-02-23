"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Flame,
  MapPin,
  Trophy,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";

import { Header } from "~/app/_components/landing/header";
import { Footer } from "~/app/_components/landing/footer";
import { useTRPC } from "~/trpc/react";

const PAGE_SIZE = 25;

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
  return (
    (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
  ).toUpperCase();
}

// Rank badge with medal for top 3
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

export default function LeaderboardPage() {
  const trpc = useTRPC();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const [currentPage, setCurrentPage] = useState(0);

  // Get logged-in user's profile for "jump to me" feature
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: !!clerkUser,
  });

  // Get leaderboard data with pagination
  const { data, isLoading } = useQuery({
    ...trpc.trustProfile.getLeaderboard.queryOptions({
      limit: PAGE_SIZE,
      offset: currentPage * PAGE_SIZE,
    }),
    refetchInterval: 60000,
  });

  const totalPages = data?.total ? Math.ceil(data.total / PAGE_SIZE) : 0;

  // Jump to the page containing the current user
  const jumpToMe = useCallback(() => {
    if (myProfile?.rank) {
      const pageIndex = Math.floor((myProfile.rank - 1) / PAGE_SIZE);
      setCurrentPage(pageIndex);
    }
  }, [myProfile?.rank]);

  // Calculate percentile for logged-in user
  const percentile =
    myProfile && data?.total
      ? Math.round(((data.total - myProfile.rank + 1) / data.total) * 100)
      : null;

  return (
    <div className="bg-card text-foreground min-h-screen">
      <Header />

      <main className="container mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Page Title */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            The most active verified humans on TrustHuman
          </p>
        </div>

        {/* User Summary Card (if logged in) - Mobile Responsive */}
        {isUserLoaded && clerkUser && myProfile && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-3 sm:p-4">
              {/* Mobile: Stack vertically, Desktop: Horizontal */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Top row on mobile: Avatar + Name + Jump button */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-primary/30 shrink-0">
                    <AvatarImage src={myProfile.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(myProfile.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm sm:text-base truncate">
                        {myProfile.displayName || myProfile.username}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-primary/30 text-primary text-[10px] sm:text-xs px-1.5"
                      >
                        #{myProfile.humanNumber}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      @{myProfile.username}
                    </span>
                  </div>

                  {/* Jump to me - visible on mobile too */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={jumpToMe}
                    className="shrink-0 h-8 text-xs sm:text-sm"
                  >
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Jump to me</span>
                    <span className="sm:hidden">Find me</span>
                  </Button>
                </div>

                {/* Stats row - horizontal on all sizes */}
                <div className="flex items-center justify-around sm:justify-end gap-4 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 sm:ml-auto">
                  {/* Rank */}
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold text-primary">
                      #{myProfile.rank}
                    </div>
                    <div className="text-muted-foreground text-[10px] sm:text-xs">
                      {percentile !== null ? `Top ${100 - percentile + 1}%` : "rank"}
                    </div>
                  </div>

                  {/* Verifications */}
                  <div className="text-center">
                    <div className="text-lg sm:text-xl font-bold">
                      {myProfile.totalVerifications}
                    </div>
                    <div className="text-muted-foreground text-[10px] sm:text-xs">verified</div>
                  </div>

                  {/* Streak */}
                  {myProfile.currentStreak > 0 && (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-0.5 text-orange-500">
                        <Flame className="h-4 w-4" />
                        <span className="text-lg sm:text-xl font-bold">
                          {myProfile.currentStreak}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px] sm:text-xs">streak</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <Card>
          {/* Table Header (sticky) - Responsive columns */}
          <div className="sticky top-16 z-10 bg-card border-b rounded-t-lg">
            <div className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[3rem_1fr_5rem_4.5rem_4rem] gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-muted-foreground">
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
                    className="grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[3rem_1fr_5rem_4.5rem_4rem] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-0"
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
            ) : data?.users && data.users.length > 0 ? (
              <div>
                {data.users.map((user) => {
                  const isCurrentUser = myProfile?.id === user.id;

                  return (
                    <Link
                      key={user.id}
                      href={`/${user.username}`}
                      className={`grid grid-cols-[2.5rem_1fr_4rem_3.5rem] sm:grid-cols-[3rem_1fr_5rem_4.5rem_4rem] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 border-b last:border-0 transition-colors ${
                        isCurrentUser
                          ? "bg-primary/10 hover:bg-primary/15 ring-1 ring-inset ring-primary/30"
                          : "hover:bg-muted/50"
                      }`}
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
                            {isCurrentUser && (
                              <MapPin className="h-3 w-3 text-primary shrink-0" />
                            )}
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
                  );
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center">
                <User className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  No verified humans yet. Be the first!
                </p>
                <Button asChild size="sm">
                  <Link href="/">Get Started</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls - Mobile Responsive */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            {/* Page info */}
            <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
              {currentPage * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, data?.total ?? 0)} of {data?.total ?? 0}
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="h-8 w-8"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="px-2 sm:px-3 text-xs sm:text-sm font-medium whitespace-nowrap">
                {currentPage + 1} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage >= totalPages - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="h-8 w-8"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Total count */}
        {data?.total !== undefined && (
          <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-muted-foreground">
            {data.total} verified humans and counting
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
