"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@sassy/ui/utils";

import { ActivityCard, type ActivityData } from "./activity-card";

export interface ActivityGridProps {
  /** Initial activities to display */
  activities: ActivityData[];
  /** Whether more activities are available */
  hasMore?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Called when user scrolls to load more */
  onLoadMore?: () => void;
  /** Number of columns (responsive by default) */
  columns?: 1 | 2 | 3;
  /** Additional className */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
}

/**
 * ActivityGrid - Pinterest-style masonry grid with infinite scroll
 * 3 columns on desktop, 2 on tablet, 1 on mobile
 */
export function ActivityGrid({
  activities,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  columns,
  className,
  emptyMessage = "No activities yet",
}: ActivityGridProps) {
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Set up intersection observer for infinite scroll
  React.useEffect(() => {
    if (!onLoadMore || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onLoadMore, hasMore, isLoading]);

  // Empty state
  if (activities.length === 0 && !isLoading) {
    return (
      <div className={cn("py-12 text-center", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Grid column classes
  const _gridClasses = columns
    ? {
        1: "grid-cols-1",
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      }[columns]
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  // For true masonry, we use CSS columns on wider screens
  // But for simpler implementation, we use a grid with distributed columns

  return (
    <div className={cn("space-y-4", className)}>
      {/* Pinterest-style masonry grid using CSS columns */}
      <div
        className={cn(
          "columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4",
          columns === 1 && "columns-1 sm:columns-1 lg:columns-1",
          columns === 2 && "columns-1 sm:columns-2 lg:columns-2",
        )}
      >
        {activities.map((activity) => (
          <div key={activity.id} className="break-inside-avoid mb-4">
            <ActivityCard activity={activity} variant="full" />
          </div>
        ))}
      </div>

      {/* Load more trigger / Loading state */}
      <div
        ref={loadMoreRef}
        className="flex justify-center py-4"
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading more...</span>
          </div>
        )}
        {!isLoading && hasMore && (
          <button
            onClick={onLoadMore}
            className="text-sm text-primary hover:underline"
          >
            Load more
          </button>
        )}
        {!hasMore && activities.length > 0 && (
          <p className="text-sm text-muted-foreground">
            You've seen all activities
          </p>
        )}
      </div>
    </div>
  );
}

export default ActivityGrid;
