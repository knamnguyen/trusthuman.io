import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useSettingsStore } from "../stores/settings-store";
import { useMostVisiblePost } from "../utils";

/**
 * Floating post navigator component that appears at the bottom center of the screen.
 * Tracks the most visible post and allows quick navigation to prev/next posts.
 * Also highlights the most visible post with a pink outline.
 *
 * Only renders when postNavigator setting is enabled.
 */
export function PostNavigator() {
  // Get settings from settings store
  const postNavigatorEnabled = useSettingsStore(
    (state) => state.behavior.postNavigator,
  );

  // Use shared hook for tracking most visible post
  const { currentIndex, totalPosts, scrollToPost } = useMostVisiblePost({
    enabled: postNavigatorEnabled,
    highlight: true, // PostNavigator also shows highlight
  });

  /**
   * Navigate to previous post
   */
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      scrollToPost(currentIndex - 1);
    }
  }, [currentIndex, scrollToPost]);

  /**
   * Navigate to next post
   */
  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < totalPosts - 1) {
      scrollToPost(currentIndex + 1);
    }
  }, [currentIndex, totalPosts, scrollToPost]);

  // Don't render if disabled
  if (!postNavigatorEnabled) {
    return null;
  }

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < totalPosts - 1;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-lg"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3"
        onClick={handlePrev}
        disabled={!canGoPrev}
        title="Previous post"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Prev
      </Button>
      <span className="text-muted-foreground min-w-[50px] text-center text-xs">
        {currentIndex >= 0 ? `${currentIndex + 1} / ${totalPosts}` : "—"}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3"
        onClick={handleNext}
        disabled={!canGoNext}
        title="Next post"
      >
        Next
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
