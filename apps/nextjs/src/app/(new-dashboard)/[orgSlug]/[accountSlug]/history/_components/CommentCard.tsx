"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Sparkles } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

import type { HistoryComment } from "./types";

/** Get touch score color based on percentage */
function getTouchScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "text-muted-foreground";
  if (score >= 70) return "text-green-600";
  if (score >= 30) return "text-yellow-600";
  return "text-red-500";
}

interface CommentCardProps {
  comment: HistoryComment;
  isSelected: boolean;
  onSelect: () => void;
}

/**
 * CommentCard - Displays a posted comment in the history list.
 * Similar to ComposeCard but readonly (no edit/submit actions).
 */
export function CommentCard({ comment, isSelected, onSelect }: CommentCardProps) {
  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  // Derive caption preview from full caption
  const getCaptionPreview = (fullCaption: string, maxLength = 60): string => {
    if (fullCaption.length <= maxLength) return fullCaption;
    return fullCaption.slice(0, maxLength) + "...";
  };

  // Truncate comment text for card display
  const getCommentPreview = (text: string, maxLength = 120): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "bg-accent ring-ring ring-2"
      )}
      onClick={onSelect}
    >
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Compact Author + Caption Header */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage
              src={comment.authorAvatarUrl ?? undefined}
              alt={comment.authorName ?? "Author"}
            />
            <AvatarFallback className="text-[10px]">
              {getInitials(comment.authorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-medium">
                {comment.authorName || "Unknown"}
              </span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-muted-foreground flex-1 truncate text-[10px]">
                {getCaptionPreview(comment.postFullCaption)}
              </span>
            </div>
          </div>
          <Badge
            variant="default"
            className="shrink-0 bg-green-600 px-1.5 py-0 text-[10px]"
          >
            Posted
          </Badge>
        </div>

        {/* Comment Text Preview */}
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {getCommentPreview(comment.comment)}
        </p>

        {/* Touch Score + Time + Actions Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Touch Score + Time */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                getTouchScoreColor(comment.peakTouchScore)
              )}
              title="How much you personalized the AI-generated comment"
            >
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">Touch:</span>
              <span>{comment.peakTouchScore ?? 0}%</span>
            </div>
            <span className="text-muted-foreground text-xs">
              {comment.commentedAt
                ? formatDistanceToNow(new Date(comment.commentedAt), {
                    addSuffix: true,
                  })
                : "Unknown time"}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* View - switches to this comment in sidebar */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="flex-1"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
