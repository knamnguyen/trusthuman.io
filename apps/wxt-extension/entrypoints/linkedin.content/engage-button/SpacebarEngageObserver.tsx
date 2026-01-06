import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import {
  DEFAULT_STYLE_GUIDE,
  extractAdjacentComments,
  extractAuthorInfoFromPost,
  extractCommentsFromPost,
  extractPostCaption,
  extractPostTime,
  extractPostUrl,
  getCaptionPreview,
  waitForCommentsReady,
} from "../utils";
import { clickCommentButton } from "../utils/comment/click-comment-button";

/** Selectors for LinkedIn post containers */
const POST_SELECTORS = "div[data-urn], div[data-id], article[role='article']";

/** Pink highlight color for focused post */
const HIGHLIGHT_STYLE = "3px solid #ec4899";

/**
 * Observer component that highlights the most visible post and triggers
 * engage flow when spacebar is pressed.
 *
 * When spacebarAutoEngage setting is enabled:
 * - Tracks which post is most visible in the viewport using IntersectionObserver
 * - Highlights that post with a pink ring outline
 * - Listens for spacebar keypress (skips when in input/textarea)
 * - Triggers single-post engage flow (1 manual + 3 AI cards)
 *
 * This component renders nothing - it only sets up observers and listeners.
 */
export function SpacebarEngageObserver() {
  const trpc = useTRPC();

  // Compose store for creating cards
  const {
    addCard,
    updateCardComment,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
  } = useComposeStore();

  // Sidebar store for UI state
  const { openToTab } = useSidebarStore();

  const generateComment = useMutation(
    trpc.aiComments.generateComment.mutationOptions(),
  );

  // Track the currently highlighted post
  const highlightedPostRef = useRef<HTMLElement | null>(null);
  // Track visibility ratios for all observed posts
  const visibilityMapRef = useRef<Map<Element, number>>(new Map());
  // Track the IntersectionObserver instance
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * Update which post is highlighted based on visibility
   */
  const updateHighlight = useCallback(() => {
    const state = useComposeStore.getState();
    if (!state.settings.spacebarAutoEngage) {
      // Remove highlight if feature is disabled
      if (highlightedPostRef.current) {
        highlightedPostRef.current.style.outline = "";
        highlightedPostRef.current = null;
      }
      return;
    }

    // Find the post with highest visibility ratio
    let maxRatio = 0;
    let mostVisiblePost: HTMLElement | null = null;

    visibilityMapRef.current.forEach((ratio, element) => {
      if (ratio > maxRatio) {
        maxRatio = ratio;
        mostVisiblePost = element as HTMLElement;
      }
    });

    // Only highlight if post is at least 25% visible
    if (maxRatio < 0.25) {
      mostVisiblePost = null;
    }

    // Update highlight if changed
    if (mostVisiblePost !== highlightedPostRef.current) {
      // Remove old highlight
      if (highlightedPostRef.current) {
        highlightedPostRef.current.style.outline = "";
      }
      // Apply new highlight
      if (mostVisiblePost) {
        (mostVisiblePost as HTMLElement).style.outline = HIGHLIGHT_STYLE;
      }
      highlightedPostRef.current = mostVisiblePost;
    }
  }, []);

  /**
   * Handle generation flow for a post (same as AutoEngageObserver)
   */
  const triggerGeneration = useCallback(
    async (postContainer: HTMLElement) => {
      // Extract full post data for ComposeCards
      const fullCaption = extractPostCaption(postContainer);
      if (!fullCaption) {
        console.warn(
          "EngageKit SpacebarEngage: unable to extract post caption",
        );
        return;
      }

      // Clear any existing single-post cards (fresh start for new post)
      clearSinglePostCards();

      // Mark as generating
      setIsEngageButtonGenerating(true);

      // Extract basic post info immediately (no waiting required)
      const captionPreview = getCaptionPreview(fullCaption, 10);
      const authorInfo = extractAuthorInfoFromPost(postContainer);
      const postTime = extractPostTime(postContainer);
      const postUrls = extractPostUrl(postContainer);
      const urn =
        postContainer.getAttribute("data-urn") ||
        postContainer.getAttribute("data-id") ||
        `unknown-${Date.now()}`;

      // Get humanOnlyMode setting
      const { humanOnlyMode } = useComposeStore.getState().settings;

      // Create card IDs based on mode
      const manualCardId = humanOnlyMode ? crypto.randomUUID() : null;
      const aiCardIds = humanOnlyMode
        ? []
        : [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
      const allCardIds = manualCardId ? [manualCardId] : aiCardIds;

      console.log(
        `EngageKit SpacebarEngage: ${humanOnlyMode ? "creating 1 manual card (100% human mode)" : "generating 3 AI variations"} for post:`,
        fullCaption.slice(0, 100),
      );

      if (humanOnlyMode && manualCardId) {
        // HUMAN MODE: Add only empty manual card
        addCard({
          id: manualCardId,
          urn,
          captionPreview,
          fullCaption,
          commentText: "",
          originalCommentText: "",
          postContainer,
          status: "draft",
          isGenerating: false,
          authorInfo,
          postTime,
          postUrls,
          comments: [],
        });
      } else {
        // AI MODE: Add 3 AI cards in generating state
        aiCardIds.forEach((id) => {
          addCard({
            id,
            urn,
            captionPreview,
            fullCaption,
            commentText: "",
            originalCommentText: "",
            postContainer,
            status: "draft",
            isGenerating: true,
            authorInfo,
            postTime,
            postUrls,
            comments: [],
          });
        });
      }

      // INSTANT: Track as single-post cards and open sidebar immediately
      setSinglePostCards(allCardIds);
      openToTab(SIDEBAR_TABS.COMPOSE);

      // Load comments for preview (useful in both modes)
      const beforeCount = extractCommentsFromPost(postContainer).length;
      clickCommentButton(postContainer);
      await waitForCommentsReady(postContainer, beforeCount);

      // Blur focus from LinkedIn's comment box (contenteditable) so spacebar can trigger new generation
      // Only blur contenteditable elements (LinkedIn's comment box), not our sidebar's textarea
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable
      ) {
        document.activeElement.blur();
      }

      // Extract comments for display in preview
      const loadedComments = extractCommentsFromPost(postContainer);
      if (loadedComments.length > 0) {
        updateCardsComments(urn, loadedComments);
      }

      // Skip AI generation in human mode
      if (humanOnlyMode) {
        setIsEngageButtonGenerating(false);
        return;
      }

      // Extract adjacent comments for AI generation
      const adjacentComments = extractAdjacentComments(postContainer);

      // Request params for AI generation
      const requestParams = {
        postContent: fullCaption,
        styleGuide: DEFAULT_STYLE_GUIDE,
        adjacentComments,
      };

      // Fire 3 parallel AI requests, update each card as it completes
      try {
        await Promise.all(
          aiCardIds.map(async (cardId) => {
            try {
              const result = await generateComment.mutateAsync(requestParams);
              updateCardComment(cardId, result.comment);
            } catch (err) {
              console.error(
                `EngageKit SpacebarEngage: failed to generate for card ${cardId}`,
                err,
              );
              // Set empty comment on failure so isGenerating becomes false
              updateCardComment(cardId, "");
            }
          }),
        );
      } catch (err) {
        console.error(
          "EngageKit SpacebarEngage: error generating comments",
          err,
        );
      } finally {
        // Mark as done generating
        setIsEngageButtonGenerating(false);
      }
    },
    [
      addCard,
      updateCardComment,
      setSinglePostCards,
      setIsEngageButtonGenerating,
      clearSinglePostCards,
      updateCardsComments,
      openToTab,
      generateComment,
    ],
  );

  /**
   * Get the deepest active element, traversing into shadow roots
   */
  const getDeepActiveElement = (): Element | null => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) {
      active = active.shadowRoot.activeElement;
    }
    return active;
  };

  /**
   * Check if an element is a text input where spacebar would insert a character
   * (textarea, text input, contenteditable)
   * We only block spacebar for these - buttons, links, etc. won't block generation
   */
  const isTextInputElement = (element: Element | null): boolean => {
    if (!element) return false;

    const tagName = element.tagName;

    // Textarea - always text input
    if (tagName === "TEXTAREA") {
      return true;
    }

    // Input - only text-like types
    if (tagName === "INPUT") {
      const inputType = (element as HTMLInputElement).type.toLowerCase();
      const textInputTypes = [
        "text",
        "email",
        "password",
        "search",
        "url",
        "tel",
        "number",
      ];
      return textInputTypes.includes(inputType);
    }

    // Contenteditable elements (LinkedIn's comment box)
    if ((element as HTMLElement).isContentEditable) {
      return true;
    }

    // Elements with textbox role
    if (element.getAttribute("role") === "textbox") {
      return true;
    }

    return false;
  };

  /**
   * Handle spacebar keydown
   */
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      // Only handle spacebar
      if (e.code !== "Space") return;

      // Skip if user is typing in a text input (textarea, input, contenteditable)
      // This prevents hijacking spacebar while typing - but buttons/links won't block
      // Use getDeepActiveElement to traverse shadow roots (e.g., compose card textarea)
      const active = getDeepActiveElement();
      if (active && isTextInputElement(active)) {
        return;
      }

      // Get fresh state from store to avoid closure issues
      const state = useComposeStore.getState();

      // Skip if feature is disabled
      if (!state.settings.spacebarAutoEngage) {
        return;
      }

      // Only block if Load Posts is running or Load Posts cards exist
      const hasLoadPostsCardsNow = state.cards.some(
        (c) => !state.singlePostCardIds.includes(c.id),
      );
      if (state.isCollecting || hasLoadPostsCardsNow) {
        console.log(
          "EngageKit SpacebarEngage: ignoring - Load Posts running or Load Posts cards exist",
        );
        return;
      }

      // Check if we have a highlighted post
      if (!highlightedPostRef.current) {
        console.log("EngageKit SpacebarEngage: no post highlighted");
        return;
      }

      // Prevent page scroll
      e.preventDefault();

      console.log(
        "EngageKit SpacebarEngage: spacebar pressed, triggering generation",
      );

      // Trigger generation flow
      await triggerGeneration(highlightedPostRef.current);
    },
    [triggerGeneration],
  );

  // Set up IntersectionObserver to track post visibility
  useEffect(() => {
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

        // Update which post is highlighted
        updateHighlight();
      },
      {
        // Use multiple thresholds for smoother tracking
        threshold: [0, 0.25, 0.5, 0.75, 1.0],
      },
    );

    observerRef.current = observer;

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
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      // Clean up highlight
      if (highlightedPostRef.current) {
        highlightedPostRef.current.style.outline = "";
        highlightedPostRef.current = null;
      }
    };
  }, [updateHighlight]);

  // Set up keydown listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Re-check highlight when settings change
  useEffect(() => {
    let prevEnabled = useComposeStore.getState().settings.spacebarAutoEngage;

    const unsubscribe = useComposeStore.subscribe((state) => {
      const enabled = state.settings.spacebarAutoEngage;
      if (enabled !== prevEnabled) {
        prevEnabled = enabled;
        updateHighlight();
      }
    });

    return unsubscribe;
  }, [updateHighlight]);

  // This component renders nothing
  return null;
}
