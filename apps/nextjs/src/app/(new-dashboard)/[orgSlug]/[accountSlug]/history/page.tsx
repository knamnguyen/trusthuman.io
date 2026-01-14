"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, MessageSquare } from "lucide-react";
import { useParams } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";

import { useTRPC } from "~/trpc/react";

export default function HistoryPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const trpc = useTRPC();

  const { data, isLoading, error } = useQuery(
    trpc.comment.listByAccount.queryOptions(),
  );

  const comments = data?.data ?? [];

  // Get initials for avatar fallback
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  // Build LinkedIn post URL from URN
  const getPostUrl = (postUrn: string): string => {
    // Extract activity ID from URN like "urn:li:activity:7410741511803297792"
    const match = postUrn.match(/urn:li:activity:(\d+)/);
    if (match?.[1]) {
      return `https://www.linkedin.com/feed/update/urn:li:activity:${match[1]}`;
    }
    return "#";
  };

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">History</h1>
        <p className="mb-6 text-gray-600">
          Comments posted for {accountSlug}
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Posted Comments
            </CardTitle>
            <CardDescription>
              Comments you&apos;ve posted through EngageKit
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p className="text-destructive text-sm">
                Failed to load comments. Please try again.
              </p>
            )}

            {!isLoading && !error && comments.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No comments posted yet. Use the extension to start engaging!
              </p>
            )}

            {!isLoading && !error && comments.length > 0 && (
              <div className="flex flex-col gap-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 rounded-lg border p-4"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={comment.authorAvatarUrl ?? undefined}
                        alt={comment.authorName ?? "Author"}
                      />
                      <AvatarFallback>
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {comment.authorName || "Unknown Author"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          •
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {comment.commentedAt
                            ? formatDistanceToNow(new Date(comment.commentedAt), {
                                addSuffix: true,
                              })
                            : "Unknown time"}
                        </span>
                        <a
                          href={getPostUrl(comment.postUrn)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground ml-auto"
                          title="View post on LinkedIn"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                      <p className="text-muted-foreground mb-2 line-clamp-1 text-xs">
                        On: {comment.postCaptionPreview}
                      </p>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
