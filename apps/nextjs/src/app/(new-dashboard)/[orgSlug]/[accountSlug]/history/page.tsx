"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useParams } from "next/navigation";

import { Badge } from "@sassy/ui/badge";
import { Skeleton } from "@sassy/ui/skeleton";

import { useTRPC } from "~/trpc/react";
import { CommentCard } from "./_components/CommentCard";
import { PostPreviewSidebar } from "./_components/PostPreviewSidebar";
import type { HistoryComment, PostCommentInfo } from "./_components/types";

export default function HistoryPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const trpc = useTRPC();

  // Selected comment state
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery(
    trpc.comment.listByAccount.queryOptions({ limit: 50 }),
  );

  // Transform the raw data to typed HistoryComment[]
  const comments: HistoryComment[] = (data?.data ?? []).map((c) => ({
    ...c,
    postComments: c.postComments as PostCommentInfo[] | null,
  }));

  // Find selected comment
  const selectedComment = comments.find((c) => c.id === selectedCommentId) ?? null;
  const selectedIndex = selectedCommentId
    ? comments.findIndex((c) => c.id === selectedCommentId)
    : -1;

  // Navigation handlers
  const canGoPrev = selectedIndex > 0;
  const canGoNext = selectedIndex >= 0 && selectedIndex < comments.length - 1;

  const handlePrev = useCallback(() => {
    if (canGoPrev && comments[selectedIndex - 1]) {
      setSelectedCommentId(comments[selectedIndex - 1]!.id);
    }
  }, [canGoPrev, comments, selectedIndex]);

  const handleNext = useCallback(() => {
    if (canGoNext && comments[selectedIndex + 1]) {
      setSelectedCommentId(comments[selectedIndex + 1]!.id);
    }
  }, [canGoNext, comments, selectedIndex]);

  // Select first comment by default when data loads
  const handleSelectComment = (commentId: string) => {
    setSelectedCommentId(commentId);
  };

  return (
    <div className="bg-background flex h-full min-h-dvh flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Comment History</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Comments posted for {accountSlug}
          {comments.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {comments.length} comments
            </Badge>
          )}
        </p>
      </div>

      {/* Main layout with 50/50 split */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left side - Comment Cards List (50%) */}
        <div className="w-1/2 overflow-auto border-r p-4">
          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 rounded-lg border p-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-destructive text-sm">
                Failed to load comments. Please try again.
              </p>
            </div>
          )}

          {!isLoading && !error && comments.length === 0 && (
            <div className="flex h-[400px] flex-col items-center justify-center gap-2">
              <MessageSquare className="text-muted-foreground h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                No comments posted yet
              </p>
              <p className="text-muted-foreground text-xs">
                Use the extension to start engaging!
              </p>
            </div>
          )}

          {!isLoading && !error && comments.length > 0 && (
            <div className="flex flex-col gap-3">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isSelected={selectedCommentId === comment.id}
                  onSelect={() => handleSelectComment(comment.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right side - Post Preview Sidebar (50%) */}
        <div className="w-1/2">
          <PostPreviewSidebar
            comment={selectedComment}
            currentIndex={selectedIndex}
            totalCount={comments.length}
            onPrev={handlePrev}
            onNext={handleNext}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
          />
        </div>
      </div>
    </div>
  );
}
