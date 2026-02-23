"use client";

import * as React from "react";
import {
  Award,
  Calendar,
  Edit3,
  ExternalLink,
  Flame,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

export interface ProfileCardProps {
  humanNumber: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  totalVerifications: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  createdAt: Date | string;
  platformLinks?: Array<{
    platform: string;
    profileHandle: string;
    profileUrl: string;
  }>;
  /** Is this the current user's own profile? */
  isOwner?: boolean;
  /** Called when edit button is clicked (only shown if isOwner) */
  onEdit?: () => void;
  /** Called when bio is updated inline */
  onBioUpdate?: (bio: string) => Promise<void>;
  /** Base URL for profile links */
  baseUrl?: string;
  /** Additional className */
  className?: string;
  /** Variant: full (page) or compact (sidebar) */
  variant?: "full" | "compact";
}

/**
 * Get initials from a name
 */
function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
  return (
    (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
  ).toUpperCase();
}

/**
 * Format date as "Human since Month Year"
 */
function formatHumanSince(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/**
 * ProfileCard - Displays a user's trust profile with stats
 * Shared between webapp and extension
 */
export function ProfileCard({
  humanNumber,
  username,
  displayName,
  avatarUrl,
  bio,
  totalVerifications,
  currentStreak,
  longestStreak,
  rank,
  createdAt,
  platformLinks,
  isOwner = false,
  onEdit,
  onBioUpdate,
  baseUrl = "https://trusthuman.io",
  className,
  variant = "full",
}: ProfileCardProps) {
  const [isEditingBio, setIsEditingBio] = React.useState(false);
  const [bioValue, setBioValue] = React.useState(bio || "");
  const [isSavingBio, setIsSavingBio] = React.useState(false);

  const handleSaveBio = async () => {
    if (!onBioUpdate) return;
    setIsSavingBio(true);
    try {
      await onBioUpdate(bioValue);
      setIsEditingBio(false);
    } finally {
      setIsSavingBio(false);
    }
  };

  const isCompact = variant === "compact";

  return (
    <Card className={cn("relative", isCompact && "border-primary/30", className)}>
      <CardHeader className={cn("pb-2", isCompact ? "pt-3 px-3" : "pt-6")}>
        <div className={cn("flex items-center", isCompact ? "gap-3" : "gap-4")}>
          {/* Avatar */}
          <Avatar className={cn(isCompact ? "h-12 w-12" : "h-20 w-20")}>
            <AvatarImage src={avatarUrl || undefined} alt={displayName || username} />
            <AvatarFallback className={isCompact ? "text-lg" : "text-2xl"}>
              {getInitials(displayName || username)}
            </AvatarFallback>
          </Avatar>

          {/* Name + Badge */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={cn("font-semibold truncate", isCompact ? "text-base" : "text-2xl")}>
                {displayName || username}
              </h2>
              <Badge
                variant="default"
                className={cn(
                  "shrink-0",
                  isCompact ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5",
                )}
              >
                <ShieldCheck className={cn(isCompact ? "h-2.5 w-2.5 mr-0.5" : "h-3 w-3 mr-1")} />
                Human
              </Badge>
            </div>
            <p className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
              #{humanNumber} &bull; Rank #{rank}
            </p>
            {!isCompact && (
              <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                <Calendar className="h-3 w-3" />
                Human since {formatHumanSince(createdAt)}
              </p>
            )}
          </div>

          {/* Edit button (owner only) */}
          {isOwner && onEdit && !isCompact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="shrink-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn(isCompact ? "pt-0 pb-3 px-3" : "pt-2")}>
        {/* Bio Section */}
        {!isCompact && (
          <div className="mb-4">
            {isEditingBio && isOwner && onBioUpdate ? (
              <div className="space-y-2">
                <textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value.slice(0, 160))}
                  placeholder="Write a short bio..."
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                  maxLength={160}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {bioValue.length}/160
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBioValue(bio || "");
                        setIsEditingBio(false);
                      }}
                      disabled={isSavingBio}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveBio}
                      disabled={isSavingBio}
                    >
                      {isSavingBio ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="group relative">
                {bio ? (
                  <p className="text-sm text-muted-foreground">{bio}</p>
                ) : isOwner ? (
                  <p className="text-sm text-muted-foreground italic">
                    No bio yet. Click to add one.
                  </p>
                ) : null}
                {isOwner && onBioUpdate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={() => setIsEditingBio(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className={cn("grid gap-2 text-center", isCompact ? "grid-cols-3" : "grid-cols-3")}>
          <div className={cn("bg-muted/50 rounded-lg", isCompact ? "p-1.5" : "p-3")}>
            <div className="flex items-center justify-center gap-1">
              <Award className={cn("text-primary", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
              <span className={cn("font-bold", isCompact ? "text-sm" : "text-xl")}>
                {totalVerifications}
              </span>
            </div>
            <p className={cn("text-muted-foreground", isCompact ? "text-[9px]" : "text-xs")}>
              Verified
            </p>
          </div>
          <div className={cn("bg-muted/50 rounded-lg", isCompact ? "p-1.5" : "p-3")}>
            <div className="flex items-center justify-center gap-1">
              <Flame className={cn("text-orange-500", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
              <span className={cn("font-bold", isCompact ? "text-sm" : "text-xl")}>
                {currentStreak}
              </span>
            </div>
            <p className={cn("text-muted-foreground", isCompact ? "text-[9px]" : "text-xs")}>
              Streak
            </p>
          </div>
          <div className={cn("bg-muted/50 rounded-lg", isCompact ? "p-1.5" : "p-3")}>
            <div className="flex items-center justify-center gap-1">
              <Trophy className={cn("text-yellow-500", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
              <span className={cn("font-bold", isCompact ? "text-sm" : "text-xl")}>
                {longestStreak}
              </span>
            </div>
            <p className={cn("text-muted-foreground", isCompact ? "text-[9px]" : "text-xs")}>
              Best
            </p>
          </div>
        </div>

        {/* Platform Links */}
        {platformLinks && platformLinks.length > 0 && !isCompact && (
          <div className="mt-4 flex flex-wrap gap-2">
            {platformLinks.map((link) => (
              <a
                key={link.profileUrl}
                href={link.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded-full hover:bg-muted/80 transition-colors"
              >
                <span
                  className={cn(
                    "font-medium",
                    link.platform === "linkedin" && "text-[#0a66c2]",
                    link.platform === "x" && "text-black dark:text-white",
                  )}
                >
                  {link.platform === "linkedin" ? "LinkedIn" : "X"}
                </span>
                <span className="text-muted-foreground">@{link.profileHandle}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {/* View Full Profile Link (compact variant only) */}
        {isCompact && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 gap-1.5 h-7 text-xs"
            onClick={() => {
              window.open(`${baseUrl}/${username}`, "_blank");
            }}
          >
            <ExternalLink className="h-3 w-3" />
            View Full Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default ProfileCard;
