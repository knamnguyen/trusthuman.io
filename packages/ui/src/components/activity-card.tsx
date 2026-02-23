"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

export interface ActivityData {
  type: "linkedin_comment" | "x_reply";
  id: string;
  text: string;
  verified: boolean;
  createdAt: Date | string;
  // LinkedIn specific
  postUrl?: string | null;
  postAuthorName?: string | null;
  postAuthorAvatarUrl?: string | null;
  postTextSnippet?: string | null;
  // X specific
  tweetUrl?: string | null;
  tweetAuthorName?: string | null;
  tweetAuthorHandle?: string | null;
  tweetAuthorAvatarUrl?: string | null;
  tweetTextSnippet?: string | null;
}

export interface ActivityCardProps {
  activity: ActivityData;
  /** Variant: 'full' for profile page, 'compact' for sidebar */
  variant?: "full" | "compact";
  /** Additional className */
  className?: string;
  /** Called when view button is clicked */
  onView?: (activity: ActivityData) => void;
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
 * Truncate text for preview
 */
function truncate(text: string | undefined | null, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

/**
 * ActivityCard - Displays a verified activity (LinkedIn comment or X reply)
 * Pinterest-style card with masonry layout support
 */
export function ActivityCard({
  activity,
  variant = "full",
  className,
  onView,
}: ActivityCardProps) {
  const isXReply = activity.type === "x_reply";
  const isCompact = variant === "compact";

  // Get activity URL
  const activityUrl = isXReply ? activity.tweetUrl : activity.postUrl;
  const hasUrl = !!activityUrl;

  // Get author info
  const authorName = isXReply
    ? activity.tweetAuthorName ||
      (activity.tweetAuthorHandle ? `@${activity.tweetAuthorHandle}` : "Unknown")
    : activity.postAuthorName || "Unknown";

  const authorHandle = isXReply ? activity.tweetAuthorHandle : undefined;
  const authorAvatar = isXReply
    ? activity.tweetAuthorAvatarUrl
    : activity.postAuthorAvatarUrl;

  const contentSnippet = isXReply
    ? truncate(activity.tweetTextSnippet, isCompact ? 50 : 100)
    : truncate(activity.postTextSnippet, isCompact ? 50 : 100) || "Post";

  const handleView = () => {
    if (onView) {
      onView(activity);
    } else if (hasUrl && activityUrl) {
      window.open(activityUrl, "_blank");
    }
  };

  const formattedDate =
    typeof activity.createdAt === "string"
      ? new Date(activity.createdAt).toLocaleDateString()
      : activity.createdAt.toLocaleDateString();

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        activity.verified
          ? "ring-1 ring-primary/30"
          : "ring-1 ring-destructive/30",
        className,
      )}
    >
      <CardContent className={cn("flex flex-col gap-2", isCompact ? "p-3" : "p-4")}>
        {/* Platform indicator + Author Header */}
        <div className="flex items-center gap-2">
          {/* Platform badge */}
          <div
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 font-medium",
              isCompact ? "text-[9px]" : "text-[10px]",
              isXReply ? "bg-black text-white" : "bg-[#0a66c2] text-white",
            )}
          >
            {isXReply ? "X" : "LinkedIn"}
          </div>

          <Avatar className={cn(isCompact ? "h-6 w-6" : "h-8 w-8", "shrink-0")}>
            <AvatarImage src={authorAvatar || undefined} alt={authorName} />
            <AvatarFallback className={isCompact ? "text-[10px]" : "text-xs"}>
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate font-medium",
                isCompact ? "text-xs" : "text-sm",
              )}
            >
              {authorName}
              {authorHandle && (
                <span className="text-muted-foreground ml-1">
                  @{authorHandle}
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-muted-foreground block truncate",
                isCompact ? "text-[10px]" : "text-xs",
              )}
            >
              {contentSnippet}
            </span>
          </div>

          <Badge
            variant={activity.verified ? "default" : "destructive"}
            className={cn(
              "shrink-0",
              isCompact ? "px-1.5 py-0 text-[10px]" : "px-2 py-0.5 text-xs",
            )}
          >
            {activity.verified ? "Verified" : "Failed"}
          </Badge>
        </div>

        {/* User's text (comment/reply) */}
        {activity.text && (
          <div
            className={cn(
              "bg-muted/30 rounded-md border",
              isCompact ? "p-2 text-sm line-clamp-3" : "p-3 text-sm",
            )}
          >
            {activity.text}
          </div>
        )}

        {/* Status + Actions Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Verification status + date */}
          <div className={cn("flex items-center gap-2", isCompact ? "text-xs" : "text-sm")}>
            {activity.verified ? (
              <div className="text-primary flex items-center gap-1">
                <CheckCircle2 className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
                <span className="font-medium">Verified</span>
              </div>
            ) : (
              <div className="text-destructive flex items-center gap-1">
                <XCircle className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
                <span className="font-medium">Failed</span>
              </div>
            )}
            <span className="text-muted-foreground">&bull;</span>
            <span className="text-muted-foreground">{formattedDate}</span>
          </div>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={!hasUrl}
            className={cn(
              "gap-1",
              isCompact ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
            )}
          >
            <ExternalLink className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ActivityCard;
