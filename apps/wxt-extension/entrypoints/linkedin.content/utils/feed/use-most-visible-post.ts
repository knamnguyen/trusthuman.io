import { useCallback, useEffect, useRef, useState } from "react";

import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();

/** Selectors for LinkedIn post containers (auto-detected based on DOM version) */
export const POST_SELECTORS = postUtils.getPostContainerSelector();

/** Default highlight style for focused post */
export const DEFAULT_HIGHLIGHT_STYLE = "3px solid #ec4899";

export interface UseMostVisiblePostOptions {
  /** Whether the tracking is enabled */
  enabled: boolean;
  /** Whether to apply highlight style to the most visible post */
  highlight?: boolean;
  /** Custom highlight style (default: pink outline) */
  highlightStyle?: string;
  /** Minimum visibility ratio to consider a post "visible" (default: 0.25) */
  minVisibilityRatio?: number;
  /** Callback when the most visible post changes */
  onPostChange?: (post: HTMLElement | null, index: number) => void;
}

export interface UseMostVisiblePostResult {
  /** The currently most visible post element */
  mostVisiblePost: HTMLElement | null;
  /** Index of the most visible post in the posts array */
  currentIndex: number;
  /** Total number of posts tracked */
  totalPosts: number;
  /** All tracked posts (top-level only) */
  posts: HTMLElement[];
  /** Scroll to a specific post by index */
  scrollToPost: (index: number) => void;
  /** Manually refresh the posts list */
  refreshPosts: () => HTMLElement[];
}

/**
 * Filter posts to only get top-level posts (not nested within other posts).
 * This prevents counting nested post matches (e.g., shared posts within posts).
 */
function filterTopLevelPosts(posts: NodeListOf<HTMLElement>): HTMLElement[] {
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

  return topLevelPosts;
}

/**
 * Hook to track the most visible LinkedIn post in the viewport.
 *
 * Uses IntersectionObserver to track visibility of all posts and determines
 * which post is most visible. Automatically watches for new posts added to
 * the DOM via MutationObserver.
 *
 * Features:
 * - Tracks only top-level posts (filters out nested/shared posts)
 * - Optional highlight styling for the focused post
 * - Provides navigation helpers (scrollToPost, currentIndex)
 * - Cleans up observers and styles on unmount
 */
export function useMostVisiblePost(
  options: UseMostVisiblePostOptions,
): UseMostVisiblePostResult {
  const {
    enabled,
    highlight = false,
    highlightStyle = DEFAULT_HIGHLIGHT_STYLE,
    minVisibilityRatio = 0.25,
    onPostChange,
  } = options;

  // Track the currently focused post element
  const focusedPostRef = useRef<HTMLElement | null>(null);
  // Track visibility ratios for all observed posts
  const visibilityMapRef = useRef<Map<HTMLElement, number>>(new Map());
  // Track all posts - stored in ref for consistency
  const postsRef = useRef<HTMLElement[]>([]);
  // Track observers for cleanup
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  // Store callback in ref to avoid re-creating updateFocus on every render
  const onPostChangeRef = useRef(onPostChange);
  onPostChangeRef.current = onPostChange;

  // Store updateFocus in ref so observers don't need to depend on it
  const updateFocusRef = useRef<() => void>(() => {});

  // State for UI updates
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [totalPosts, setTotalPosts] = useState(0);

  /**
   * Refresh the posts list from DOM and re-observe
   */
  const refreshPosts = useCallback((): HTMLElement[] => {
    const allPosts = document.querySelectorAll<HTMLElement>(POST_SELECTORS);
    const topLevelPosts = filterTopLevelPosts(allPosts);
    postsRef.current = topLevelPosts;
    setTotalPosts(topLevelPosts.length);

    // Re-observe all posts with the intersection observer
    if (intersectionObserverRef.current) {
      // Clear old observations
      intersectionObserverRef.current.disconnect();

      // Clean visibility map - remove entries for posts no longer in DOM
      const postSet = new Set(topLevelPosts);
      visibilityMapRef.current.forEach((_, element) => {
        if (!postSet.has(element)) {
          visibilityMapRef.current.delete(element);
        }
      });

      // Observe all current posts
      topLevelPosts.forEach((post) => {
        intersectionObserverRef.current?.observe(post);
      });
    }

    return topLevelPosts;
  }, []);

  /**
   * Find the most visible post based on current visibility map
   */
  const findMostVisiblePost = useCallback((): {
    post: HTMLElement | null;
    index: number;
  } => {
    let maxRatio = 0;
    let mostVisiblePost: HTMLElement | null = null;

    visibilityMapRef.current.forEach((ratio, element) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisiblePost = element;
      }
    });

    // Only consider visible if above threshold
    if (maxRatio < minVisibilityRatio) {
      mostVisiblePost = null;
    }

    // Find index in posts array
    const index = mostVisiblePost
      ? postsRef.current.indexOf(mostVisiblePost)
      : -1;

    return { post: mostVisiblePost, index };
  }, [minVisibilityRatio]);

  /**
   * Update which post is focused based on visibility
   */
  const updateFocus = useCallback(() => {
    if (!enabled) {
      // Remove highlight and reset state if disabled
      if (focusedPostRef.current && highlight) {
        focusedPostRef.current.style.outline = "";
      }
      focusedPostRef.current = null;
      setCurrentIndex(-1);
      return;
    }

    const { post: mostVisiblePost, index } = findMostVisiblePost();

    // Update state
    setCurrentIndex(index);

    // Handle highlight changes
    if (mostVisiblePost !== focusedPostRef.current) {
      // Remove old highlight
      if (focusedPostRef.current && highlight) {
        focusedPostRef.current.style.outline = "";
      }

      // Apply new highlight
      if (mostVisiblePost && highlight) {
        mostVisiblePost.style.outline = highlightStyle;
      }

      // Update ref and notify
      const oldPost = focusedPostRef.current;
      focusedPostRef.current = mostVisiblePost;

      // Call change callback (use ref to avoid dependency issues)
      if (onPostChangeRef.current && mostVisiblePost !== oldPost) {
        onPostChangeRef.current(mostVisiblePost, index);
      }
    }
  }, [enabled, highlight, highlightStyle, findMostVisiblePost]);

  // Keep ref in sync with latest updateFocus
  updateFocusRef.current = updateFocus;

  /**
   * Scroll to a specific post by index
   */
  const scrollToPost = useCallback((index: number) => {
    const post = postsRef.current[index];
    if (post) {
      post.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Set up IntersectionObserver and MutationObserver (runs once on mount)
  useEffect(() => {
    // Create IntersectionObserver
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        // Update visibility map for each entry
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            visibilityMapRef.current.set(element, entry.intersectionRatio);
          } else {
            visibilityMapRef.current.delete(element);
          }
        });

        // Update which post is focused (use ref to get latest function)
        updateFocusRef.current();
      },
      {
        // Use multiple thresholds for smoother tracking
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
      },
    );

    intersectionObserverRef.current = intersectionObserver;

    // Initial post discovery
    const allPosts = document.querySelectorAll<HTMLElement>(POST_SELECTORS);
    const topLevelPosts = filterTopLevelPosts(allPosts);
    postsRef.current = topLevelPosts;
    setTotalPosts(topLevelPosts.length);
    topLevelPosts.forEach((post) => intersectionObserver.observe(post));

    // Create MutationObserver to watch for new posts
    const mutationObserver = new MutationObserver((mutations) => {
      let hasNewPosts = false;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // Check if the added node is a post
            if (node.matches(POST_SELECTORS)) {
              hasNewPosts = true;
            }
            // Check for posts within the added node
            if (node.querySelectorAll(POST_SELECTORS).length > 0) {
              hasNewPosts = true;
            }
          }
        });
      });

      // Refresh posts list if new posts were added
      if (hasNewPosts) {
        const allPosts = document.querySelectorAll<HTMLElement>(POST_SELECTORS);
        const topLevelPosts = filterTopLevelPosts(allPosts);
        postsRef.current = topLevelPosts;
        setTotalPosts(topLevelPosts.length);

        // Re-observe all posts
        intersectionObserver.disconnect();
        visibilityMapRef.current.clear();
        topLevelPosts.forEach((post) => intersectionObserver.observe(post));
      }
    });

    mutationObserverRef.current = mutationObserver;

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      intersectionObserver.disconnect();
      mutationObserver.disconnect();
      visibilityMapRef.current.clear();
    };
  }, []); // Empty deps - only run once on mount

  // Re-check focus when enabled or highlight changes
  useEffect(() => {
    updateFocus();
  }, [enabled, highlight, updateFocus]);

  // Clean up highlight on unmount
  useEffect(() => {
    return () => {
      if (focusedPostRef.current) {
        focusedPostRef.current.style.outline = "";
        focusedPostRef.current = null;
      }
    };
  }, []);

  return {
    mostVisiblePost: focusedPostRef.current,
    currentIndex,
    totalPosts,
    posts: postsRef.current,
    scrollToPost,
    refreshPosts,
  };
}
