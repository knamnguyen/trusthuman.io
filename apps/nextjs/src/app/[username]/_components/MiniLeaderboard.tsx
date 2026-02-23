"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";

import { MOCK_USERS, type MockUser } from "./mock-users";

interface LeaderboardUser {
  id: string;
  humanNumber: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalVerifications: number;
  currentStreak: number;
  rank: number;
}

interface MiniLeaderboardProps {
  // Real leaderboard data from API
  leaderboard: {
    users: LeaderboardUser[];
    total: number;
  } | null;
  // Current profile being viewed
  currentProfile: {
    username: string;
    humanNumber: number;
    totalVerifications: number;
    rank: number;
    avatarUrl: string | null;
    displayName: string | null;
  };
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
  return (
    (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
  ).toUpperCase();
}

// Rank badge styles
function getRankStyle(rank: number): { icon: string; bgClass: string } {
  switch (rank) {
    case 1:
      return { icon: "🥇", bgClass: "bg-yellow-100 dark:bg-yellow-900/30" };
    case 2:
      return { icon: "🥈", bgClass: "bg-gray-100 dark:bg-gray-800/50" };
    case 3:
      return { icon: "🥉", bgClass: "bg-orange-100 dark:bg-orange-900/30" };
    default:
      return { icon: "", bgClass: "" };
  }
}

export function MiniLeaderboard({
  leaderboard,
  currentProfile,
}: MiniLeaderboardProps) {
  // Determine if we need mock users (< 5 real users)
  const realUsers = leaderboard?.users || [];
  const totalRealUsers = leaderboard?.total || 0;
  const needsMockUsers = totalRealUsers < 5;

  // Build display list: top 3 + current user (if not in top 3)
  let displayUsers: (LeaderboardUser | (MockUser & { rank: number; isMock?: boolean }))[] = [];
  let showCurrentSeparately = true;

  if (needsMockUsers) {
    // When < 5 real users: ALWAYS show mock users as top 3
    // This creates aspirational leaderboard to encourage participation
    displayUsers = MOCK_USERS.slice(0, 3).map((mock, idx) => ({
      ...mock,
      rank: idx + 1,
      isMock: true,
    }));
    // Current user always shown separately at bottom with their real rank
    showCurrentSeparately = true;
  } else {
    // Enough real users - show actual top 3
    displayUsers = realUsers.slice(0, 3);

    // Check if current profile is in top 3
    const currentInTop3 = displayUsers.some(
      (u) => u.username === currentProfile.username
    );
    showCurrentSeparately = !currentInTop3;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          🏆 Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-3 pb-3 pt-0 flex-1 flex flex-col">
        {/* Top 3 */}
        {displayUsers.map((user) => {
          const isCurrentProfile = user.username === currentProfile.username;
          const isMock = "isMock" in user && user.isMock;
          const rankStyle = getRankStyle(user.rank);

          return (
            <LeaderboardRow
              key={user.id}
              user={user}
              rank={user.rank}
              isCurrentProfile={isCurrentProfile}
              isMock={isMock ?? false}
              rankStyle={rankStyle}
            />
          );
        })}

        {/* Gap indicator + Current user (if not in top 3) */}
        {showCurrentSeparately && (
          <>
            <div className="flex items-center justify-center py-0.5">
              <span className="text-muted-foreground text-[10px]">• • •</span>
            </div>
            <LeaderboardRow
              user={{
                id: currentProfile.username,
                username: currentProfile.username,
                displayName: currentProfile.displayName,
                avatarUrl: currentProfile.avatarUrl,
                humanNumber: currentProfile.humanNumber,
                totalVerifications: currentProfile.totalVerifications,
              }}
              rank={currentProfile.rank}
              isCurrentProfile={true}
              isMock={false}
              // When showing separately (not in top 3), don't show medal - just show rank number
              rankStyle={{ icon: "", bgClass: "" }}
            />
          </>
        )}

        {/* Spacer to push link to bottom */}
        <div className="flex-1" />

        {/* View full leaderboard link */}
        <Link
          href="/leaderboard"
          className="block text-center text-xs text-primary hover:underline pt-1"
        >
          View full leaderboard
        </Link>
      </CardContent>
    </Card>
  );
}

// Individual row component
function LeaderboardRow({
  user,
  rank,
  isCurrentProfile,
  isMock = false,
  rankStyle,
}: {
  user: {
    id?: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    humanNumber: number;
    totalVerifications: number;
  };
  rank: number;
  isCurrentProfile: boolean;
  isMock?: boolean;
  rankStyle: { icon: string; bgClass: string };
}) {
  const content = (
    <div
      className={`flex items-center gap-1.5 p-1.5 rounded-md transition-colors ${
        isCurrentProfile
          ? "bg-primary/10 ring-1 ring-primary/30"
          : rankStyle.bgClass || "hover:bg-muted/50"
      } ${isMock ? "cursor-default" : "cursor-pointer"}`}
    >
      {/* Rank */}
      <div className="w-5 text-center shrink-0">
        {rankStyle.icon ? (
          <span className="text-xs">{rankStyle.icon}</span>
        ) : (
          <span className="text-[10px] text-muted-foreground font-medium">
            {rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarImage src={user.avatarUrl || undefined} />
        <AvatarFallback className="text-[9px]">
          {getInitials(user.displayName || user.username)}
        </AvatarFallback>
      </Avatar>

      {/* Name + stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-0.5">
          <span className="text-[11px] font-medium truncate">
            {user.displayName || user.username}
          </span>
          {isCurrentProfile && (
            <MapPin className="h-2.5 w-2.5 text-primary shrink-0" />
          )}
        </div>
        <div className="text-[9px] text-muted-foreground">
          Human #{user.humanNumber}
        </div>
      </div>

      {/* Verification count */}
      <div className="text-right shrink-0">
        <div className="text-[11px] font-semibold">{user.totalVerifications}</div>
        <div className="text-[9px] text-muted-foreground">verified</div>
      </div>
    </div>
  );

  // Mock users don't link anywhere
  if (isMock) {
    return content;
  }

  return <Link href={`/${user.username}`}>{content}</Link>;
}
