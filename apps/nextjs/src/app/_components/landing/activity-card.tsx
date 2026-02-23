"use client";

import type { LucideProps } from "lucide-react";
import { forwardRef } from "react";
import Link from "next/link";
import { CheckCircle2, ExternalLink, Linkedin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";

// X icon component (lucide-react doesn't have X/Twitter brand icon)
const XIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
);
XIcon.displayName = "XIcon";

// Facebook icon component
const FacebookIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      {...props}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
);
FacebookIcon.displayName = "FacebookIcon";

// Standardized activity type from backend
export interface ActivityCardProps {
  id: string;
  type: "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";
  commentText: string;
  commentUrl: string | null;
  parentUrl: string | null;
  parentAuthorName: string;
  parentAuthorAvatarUrl: string;
  parentTextSnippet: string;
  verified: boolean;
  activityAt: Date | string;
  createdAt: Date | string;
  // User info (joined from getRecentActivity)
  humanNumber: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
  return (
    (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
  ).toUpperCase();
}

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ActivityCard({
  type,
  commentText,
  commentUrl,
  parentUrl,
  parentAuthorName,
  parentAuthorAvatarUrl,
  parentTextSnippet,
  verified,
  createdAt,
  humanNumber,
  username,
  displayName,
  avatarUrl,
}: ActivityCardProps) {
  const activityUrl = commentUrl || parentUrl;

  return (
    <Card
      className={`overflow-hidden ${
        verified ? "ring-primary/30 ring-1" : "ring-destructive/30 ring-1"
      }`}
    >
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header: User info + platform badge */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${username}`}
            className="flex items-center gap-2 hover:opacity-80"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium">
                  Human #{humanNumber}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">
                @{username}
              </span>
            </div>
          </Link>
          <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[10px] ${
              type === "x"
                ? "border-black bg-black text-white"
                : type === "linkedin"
                  ? "border-[#0a66c2] bg-[#0a66c2] text-white"
                  : type === "facebook"
                    ? "border-[#1877f2] bg-[#1877f2] text-white"
                    : "border-gray-500 bg-gray-500 text-white"
            }`}
          >
            {type === "x" ? "X" : type === "linkedin" ? "LinkedIn" : type === "facebook" ? "Facebook" : type.charAt(0).toUpperCase() + type.slice(1)}
          </Badge>
        </div>

        {/* Original post/tweet context - what user replied to */}
        <div className="bg-muted/30 border-muted-foreground/30 rounded-lg border-l-2 p-3">
          <div className="mb-1.5 flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={parentAuthorAvatarUrl || undefined} />
              <AvatarFallback className="text-[8px]">
                {getInitials(parentAuthorName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium">
              {parentAuthorName || "Unknown"}
            </span>
          </div>
          {parentTextSnippet && (
            <p className="text-muted-foreground line-clamp-2 text-xs">
              {parentTextSnippet}
            </p>
          )}
        </div>

        {/* User's reply/comment - prominent */}
        <div>
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
            <CheckCircle2 className="text-primary h-3 w-3" />
            <span>
              Verified {type === "x" ? "reply" : "comment"}
            </span>
          </div>
          <p className="text-sm line-clamp-3">{commentText}</p>
        </div>

        {/* Footer: Date + View button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Badge
              variant={verified ? "default" : "destructive"}
              className="px-1.5 py-0 text-[10px]"
            >
              {verified ? "Verified" : "Failed"}
            </Badge>
            <span className="text-muted-foreground text-xs">
              {timeAgo(createdAt)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => activityUrl && window.open(activityUrl, "_blank")}
            disabled={!activityUrl}
          >
            <ExternalLink className="h-3 w-3" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
