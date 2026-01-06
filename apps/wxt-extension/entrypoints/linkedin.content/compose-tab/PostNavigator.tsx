import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useComposeStore } from "../stores/compose-store";

/** Selectors for LinkedIn post containers */
const POST_SELECTORS = "div[data-urn], div[data-id], article[role='article']";

/**
 * Floating post navigator component that appears at the bottom center of the screen.
 * Tracks the most visible post and allows quick navigation to prev/next posts.
 *
 * Only renders when postNavigator setting is enabled.
 */
export function PostNavigator() {
  // Track the currently focused post element
  const focusedPostRef = useRef<HTMLElement | null>(null);
  // Track visibility ratios for all observed posts
  const visibilityMapRef = useRef<Map<Element, number>>(new Map());
  // Track all posts - stored in ref for consistency during navigation
  const postsRef = useRef<HTMLElement[]>([]);
  // State for UI updates
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Get settings from store
  const postNavigatorEnabled = useComposeStore(
    (state) => state.settings.postNavigator,
  );

  /**
   * Refresh the posts list from DOM
   */
  const refreshPosts = useCallback(() => {
    const posts = document.querySelectorAll<HTMLElement>(POST_SELECTORS);
    // Filter to only get "top-level" posts (not nested matches)
    const topLevelPosts: HTMLElement[] = [];
    posts.forEach((post) => {
      // Check if this post is not contained within another matched post
      let isNested = false;
      let parent = post.parentElement;
      while (parent) {
        if (parent.matches(POST_SELECTORS)) {
          isNested = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (!isNested) {
        topLevelPosts.push(post);
      }
    });
    postsRef.current = topLevelPosts;
    setTotalPosts(topLevelPosts.length);
    return topLevelPosts;
  }, []);

  /**
   * Find index of a post in the current posts array
   */
  const findPostIndex = useCallback((post: HTMLElement | null): number => {
    if (!post) return -1;
    return postsRef.current.findIndex((p) => p === post);
  }, []);

  /**
   * Update which post is focused based on visibility
   */
  const updateFocus = useCallback(() => {
    if (!postNavigatorEnabled) {
      focusedPostRef.current = null;
      setCurrentIndex(-1);
      return;
    }

    // Refresh posts list
    refreshPosts();

    // Find the post with highest visibility ratio
    let maxRatio = 0;
    let mostVisiblePost: HTMLElement | null = null;

    visibilityMapRef.current.forEach((ratio, element) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisiblePost = element as HTMLElement;
      }
    });

    // Only focus if post is at least 25% visible
    if (maxRatio < 0.25) {
      mostVisiblePost = null;
    }

    focusedPostRef.current = mostVisiblePost;

    // Find index of the focused post
    const idx = findPostIndex(mostVisiblePost);
    setCurrentIndex(idx);
  }, [postNavigatorEnabled, refreshPosts, findPostIndex]);

  /**
   * Navigate to previous post
   */
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevPost = postsRef.current[currentIndex - 1];
      if (prevPost) {
        prevPost.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentIndex]);

  /**
   * Navigate to next post
   */
  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < postsRef.current.length - 1) {
      const nextPost = postsRef.current[currentIndex + 1];
      if (nextPost) {
        nextPost.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentIndex]);

  // Set up IntersectionObserver to track post visibility
  useEffect(() => {
    if (!postNavigatorEnabled) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Update visibility map for each entry
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibilityMapRef.current.set(entry.target, entry.intersectionRatio);
          } else {
            visibilityMapRef.current.delete(entry.target);
          }
        });

        // Update which post is focused
        updateFocus();
      },
      {
        // Use multiple thresholds for smoother tracking
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      },
    );

    // Observe all existing posts
    const posts = document.querySelectorAll(POST_SELECTORS);
    posts.forEach((post) => observer.observe(post));

    // Set up MutationObserver to watch for new posts added to the feed
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            // Check if the added node is a post
            if (node.matches(POST_SELECTORS)) {
              observer.observe(node);
            }
            // Check for posts within the added node
            node.querySelectorAll(POST_SELECTORS).forEach((post) => {
              observer.observe(post);
            });
          }
        });
      });
      // Update posts list when DOM changes
      updateFocus();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      visibilityMapRef.current.clear();
    };
  }, [postNavigatorEnabled, updateFocus]);

  // Re-check focus when settings change
  useEffect(() => {
    let prevEnabled = useComposeStore.getState().settings.postNavigator;

    const unsubscribe = useComposeStore.subscribe((state) => {
      const enabled = state.settings.postNavigator;
      if (enabled !== prevEnabled) {
        prevEnabled = enabled;
        updateFocus();
      }
    });

    return unsubscribe;
  }, [updateFocus]);

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
