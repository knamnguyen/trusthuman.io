import { useCallback, useEffect } from "react";
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
  findPostContainer,
  getCaptionPreview,
  waitForCommentsReady,
} from "../utils";
import { clickCommentNumberButton } from "../utils/click-comment-button";

/**
 * Selectors for LinkedIn's comment buttons:
 * 1. "Comment" action button (aria-label="Comment") - in action bar
 * 2. "Show X comments" button (aria-label contains "comment") - shows comment count
 */
const COMMENT_BUTTON_SELECTORS = [
  'button[aria-label="Comment"]',
  'button[aria-label*="comment"]',
];

/**
 * Check if an element matches any of the comment button selectors
 */
function isCommentButton(element: Element): boolean {
  return COMMENT_BUTTON_SELECTORS.some((selector) => element.matches(selector));
}

/**
 * Find comment button from click target (element or ancestor)
 */
function findCommentButtonFromTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;

  // Check if clicked element itself is a comment button
  if (isCommentButton(target)) {
    return target as HTMLElement;
  }

  // Check if any ancestor is a comment button (for clicks on icon inside button)
  for (const selector of COMMENT_BUTTON_SELECTORS) {
    const button = target.closest(selector);
    if (button) {
      return button as HTMLElement;
    }
  }

  return null;
}

/**
 * Observer component that listens for clicks on LinkedIn's native comment buttons.
 * When auto-open-engage is enabled and user clicks a comment button,
 * triggers the same generation flow as EngageButton (1 manual + 3 AI cards).
 *
 * This component renders nothing - it only sets up event listeners.
 */
export function AutoEngageObserver() {
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

  /**
   * Handle generation flow for a post (same as EngageButton)
   */
  const triggerGeneration = useCallback(
    async (postContainer: HTMLElement) => {
      // Extract full post data for ComposeCards
      const fullCaption = extractPostCaption(postContainer);
      if (!fullCaption) {
        console.warn("EngageKit AutoEngage: unable to extract post caption");
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

      console.log(
        "EngageKit AutoEngage: generating 3 variations + 1 manual card for post:",
        fullCaption.slice(0, 100),
      );

      // Create card IDs upfront
      const manualCardId = crypto.randomUUID();
      const aiCardIds = [
        crypto.randomUUID(),
        crypto.randomUUID(),
        crypto.randomUUID(),
      ];
      const allCardIds = [manualCardId, ...aiCardIds];

      // INSTANT: Add empty manual card immediately (user can start typing right away)
      // comments: [] now, will be populated via updateCardsComments after async load
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

      // INSTANT: Add 3 AI cards in generating state
      // comments: [] now, will be populated via updateCardsComments after async load
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

      // INSTANT: Track as single-post cards and open sidebar immediately
      setSinglePostCards(allCardIds);
      openToTab(SIDEBAR_TABS.COMPOSE);

      // NOW load and wait for comments for AI context
      // User clicked a comment button, but it might be "Comment" (opens input) not "Show X comments" (loads existing)
      // So we click the comment number button to ensure existing comments are loaded
      const beforeCount = extractCommentsFromPost(postContainer).length;
      clickCommentNumberButton(postContainer);
      await waitForCommentsReady(postContainer, beforeCount);

      // Extract comments for display in preview
      // Cards were created with comments: [] for instant UX, now update with loaded comments
      const loadedComments = extractCommentsFromPost(postContainer);
      if (loadedComments.length > 0) {
        updateCardsComments(urn, loadedComments);
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
              console.error(`EngageKit AutoEngage: failed to generate for card ${cardId}`, err);
              // Set empty comment on failure so isGenerating becomes false
              updateCardComment(cardId, "");
            }
          }),
        );
      } catch (err) {
        console.error("EngageKit AutoEngage: error generating comments", err);
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
   * Handle click events on the document
   */
  const handleDocumentClick = useCallback(
    async (e: MouseEvent) => {
      // Get fresh state from store to avoid closure issues
      const state = useComposeStore.getState();

      // Skip if auto-engage is disabled
      if (!state.settings.autoEngageOnCommentClick) {
        return;
      }

      // Only block if Load Posts is running or Load Posts cards exist
      // (Single-post cards will be auto-cleared for fresh generation)
      const hasLoadPostsCardsNow = state.cards.some(
        (c) => !state.singlePostCardIds.includes(c.id)
      );
      if (state.isCollecting || hasLoadPostsCardsNow) {
        console.log("EngageKit AutoEngage: ignoring - Load Posts running or Load Posts cards exist");
        return;
      }

      // Check if click target is a comment button
      const commentButton = findCommentButtonFromTarget(e.target);
      if (!commentButton) {
        return;
      }

      // Find the post container for this comment button
      const postContainer = findPostContainer(commentButton) as HTMLElement | null;
      if (!postContainer) {
        console.warn("EngageKit AutoEngage: unable to locate post container");
        return;
      }

      console.log("EngageKit AutoEngage: comment button clicked, triggering generation");

      // Trigger generation flow
      await triggerGeneration(postContainer);
    },
    [triggerGeneration],
  );

  // Set up click listener on document
  useEffect(() => {
    // Use capture phase to intercept before LinkedIn's handlers
    document.addEventListener("click", handleDocumentClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [handleDocumentClick]);

  // This component renders nothing
  return null;
}
