"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Button } from "@sassy/ui/button";
import { ScrollArea } from "@sassy/ui/scroll-area";
import { cn } from "@sassy/ui/utils";

import type { HistoryComment, PostCommentInfo } from "./types";

/** Get touch score color based on percentage */
function getTouchScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "text-muted-foreground";
  if (score >= 70) return "text-green-600";
  if (score >= 30) return "text-yellow-600";
  return "text-red-500";
}

interface PostPreviewSidebarProps {
  comment: HistoryComment | null;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

/**
 * PostPreviewSidebar - Displays full post details for a selected comment.
 * Shows author info, full caption, adjacent comments, and your posted comment.
 */
export function PostPreviewSidebar({
  comment,
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
}: PostPreviewSidebarProps) {
  const [showAiDraft, setShowAiDraft] = useState(false);

  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  // Parse postComments from JSON (may be stored as unknown type from Prisma)
  const parsePostComments = (raw: unknown): PostCommentInfo[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) {
      return raw as PostCommentInfo[];
    }
    return [];
  };

  const postComments = parsePostComments(comment?.postComments);

  // Check if the comment was AI-generated and edited
  const hasAiDraft =
    comment?.originalAiComment &&
    comment.originalAiComment !== comment.comment;

  // Empty state
  if (!comment) {
    return (
      <div className="bg-background flex h-full flex-col border-l">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground text-sm">
            Select a comment to view details
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-full flex-col border-l">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Post Preview</h2>
          {comment.postUrl && (
            <a
              href={comment.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="Open post on LinkedIn"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Author Section */}
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={comment.authorAvatarUrl ?? undefined}
                alt={comment.authorName ?? "Author"}
              />
              <AvatarFallback>{getInitials(comment.authorName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">
                  {comment.authorName || "Unknown Author"}
                </p>
                {comment.postCreatedAt && (
                  <span
                    className="text-muted-foreground text-xs"
                    title={comment.postCreatedAt.toLocaleString()}
                  >
                    •{" "}
                    {formatDistanceToNow(new Date(comment.postCreatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              {comment.authorHeadline && (
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {comment.authorHeadline}
                </p>
              )}
              {comment.authorProfileUrl && (
                <a
                  href={comment.authorProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  View Profile
                </a>
              )}
            </div>
          </div>

          {/* Post Caption */}
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              Post Content
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {comment.postFullCaption}
            </p>
          </div>

          {/* Adjacent Comments Section */}
          {postComments.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Comments ({postComments.length})
              </p>
              <div className="flex flex-col gap-3">
                {postComments.map((pc, index) => (
                  <div
                    key={pc.urn || index}
                    className={cn(
                      "rounded-md border p-3",
                      pc.isReply ? "bg-muted/50 ml-4" : "bg-muted/30"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      {pc.authorPhotoUrl && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={pc.authorPhotoUrl}
                            alt={pc.authorName || "Commenter"}
                          />
                          <AvatarFallback className="text-xs">
                            {getInitials(pc.authorName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {pc.authorName || "Unknown"}
                        </p>
                        {pc.authorHeadline && (
                          <p className="text-muted-foreground truncate text-[10px]">
                            {pc.authorHeadline}
                          </p>
                        )}
                      </div>
                    </div>
                    {pc.content && <p className="text-xs">{pc.content}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Sticky Your Comment Section at Bottom */}
      <div className="bg-background flex flex-col gap-3 border-t p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          Your Comment
        </p>

        {/* Final Comment (readonly) */}
        <div className="bg-primary/5 border-primary/20 rounded-md border p-3">
          <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
        </div>

        {/* AI Draft Toggle (if exists and differs) */}
        {hasAiDraft && (
          <div>
            <button
              onClick={() => setShowAiDraft(!showAiDraft)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
            >
              {showAiDraft ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <span>View AI Draft</span>
              <span className="text-muted-foreground">
                (edited {comment.peakTouchScore ?? 0}%)
              </span>
            </button>
            {showAiDraft && (
              <div className="bg-muted/50 mt-2 rounded-md border p-3">
                <p className="text-muted-foreground mb-1 text-[10px] font-medium uppercase">
                  Original AI Draft
                </p>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap italic">
                  {comment.originalAiComment}
                </p>
              </div>
            )}
          </div>
        )}

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
            <span className="font-medium">Your Touch:</span>
            <span>{comment.peakTouchScore ?? 0}%</span>
          </div>
          {comment.commentedAt && (
            <span className="text-muted-foreground text-xs">
              Posted{" "}
              {formatDistanceToNow(new Date(comment.commentedAt), {
                addSuffix: true,
              })}
            </span>
          )}
          {comment.commentUrl && (
            <a
              href={comment.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary ml-auto text-xs hover:underline"
            >
              View on LinkedIn
            </a>
          )}
        </div>

        {/* Navigation Row */}
        <div className="flex items-center justify-center gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={onPrev}
            disabled={!canGoPrev}
            title="Previous comment"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <span className="text-muted-foreground min-w-[50px] text-center text-sm">
            {currentIndex + 1} / {totalCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3"
            onClick={onNext}
            disabled={!canGoNext}
            title="Next comment"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
