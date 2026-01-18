import { useCallback, useEffect, useRef } from "react";

import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import { useComposeStore } from "../../stores/compose-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { SIDEBAR_TABS, useSidebarStore } from "../../stores/sidebar-store";
import { useMostVisiblePost } from "../../utils";
import { generateAndUpdateCards } from "../utils/generate-ai-comments";

// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();

// Helper function for caption preview
function getCaptionPreview(fullCaption: string, wordLimit: number): string {
  const words = fullCaption.split(/\s+/);
  if (words.length <= wordLimit) return fullCaption;
  return words.slice(0, wordLimit).join(" ") + "...";
}

/**
 * Observer component that highlights the most visible post and triggers
 * engage flow when spacebar is pressed.
 *
 * When spacebarAutoEngage setting is enabled:
 * - Tracks which post is most visible in the viewport using shared hook
 * - Highlights that post with a pink ring outline (if PostNavigator isn't already highlighting)
 * - Listens for spacebar keypress (skips when in input/textarea)
 * - Triggers single-post engage flow (1 manual or 3 AI cards based on humanOnlyMode)
 *
 * This component renders nothing - it only sets up observers and listeners.
 */
export function SpacebarEngageObserver() {
  // Compose store for creating cards and checking settings
  const {
    addCard,
    updateCardComment,
    updateCardStyleInfo,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
  } = useComposeStore();

  // Sidebar store for UI state
  const { openToTab } = useSidebarStore();

  // Get settings from settings store
  const spacebarEnabled = useSettingsLocalStore(
    (state) => state.behavior.spacebarAutoEngage,
  );
  const postNavigatorEnabled = useSettingsLocalStore(
    (state) => state.behavior.postNavigator,
  );

  // Track the most visible post ref for spacebar handler (updated via callback)
  const mostVisiblePostRef = useRef<HTMLElement | null>(null);

  // Use shared hook for tracking most visible post
  // Only highlight if PostNavigator is NOT enabled (to avoid duplicate highlights)
  const { mostVisiblePost } = useMostVisiblePost({
    enabled: spacebarEnabled,
    highlight: spacebarEnabled && !postNavigatorEnabled,
    onPostChange: (post) => {
      mostVisiblePostRef.current = post;
    },
  });

  // Keep ref in sync with hook result
  useEffect(() => {
    mostVisiblePostRef.current = mostVisiblePost;
  }, [mostVisiblePost]);

  /**
   * Handle generation flow for a post (same as AutoEngageObserver)
   */
  const triggerGeneration = useCallback(
    async (postContainer: HTMLElement) => {
      // Extract full post data for ComposeCards
      const fullCaption = postUtils.extractPostCaption(postContainer);
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
      const authorInfo = postUtils.extractPostAuthorInfo(postContainer);
      const postTime = postUtils.extractPostTime(postContainer);
      const postUrls = postUtils.extractPostUrl(postContainer);
      const urn =
        postContainer.getAttribute("data-urn") ||
        postContainer.getAttribute("data-id") ||
        `unknown-${Date.now()}`;

      // Get humanOnlyMode setting from settings store
      const { humanOnlyMode } = useSettingsLocalStore.getState().behavior;

      // Create card IDs based on mode
      const manualCardId = humanOnlyMode ? crypto.randomUUID() : null;
      const aiCardIds = humanOnlyMode
        ? []
        : [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
      const allCardIds = manualCardId ? [manualCardId] : aiCardIds;

      console.log(
        `[SpacebarEngageObserver] ▶▶▶ TRIGGERED - ${humanOnlyMode ? "creating 1 manual card (100% human mode)" : "generating 3 AI variations"} for post:`,
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
          peakTouchScore: 0,
          postContainer,
          status: "draft",
          isGenerating: false,
          authorInfo,
          postTime,
          postUrls,
          comments: [],
          commentStyleId: null,
          styleSnapshot: null,
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
            peakTouchScore: 0,
            postContainer,
            status: "draft",
            isGenerating: true,
            authorInfo,
            postTime,
            postUrls,
            comments: [],
            commentStyleId: null,
            styleSnapshot: null,
          });
        });
      }

      // INSTANT: Track as single-post cards and open sidebar immediately
      setSinglePostCards(allCardIds);
      openToTab(SIDEBAR_TABS.COMPOSE);

      // Load comments for preview (useful in both modes)
      const beforeCount = postUtils.extractPostComments(postContainer).length;
      commentUtils.clickCommentButton(postContainer);
      await commentUtils.waitForCommentsReady(postContainer, beforeCount);

      // Blur focus from LinkedIn's comment box (contenteditable) so spacebar can trigger new generation
      // Only blur contenteditable elements (LinkedIn's comment box), not our sidebar's textarea
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable
      ) {
        document.activeElement.blur();
      }

      // Extract comments for display in preview
      const loadedComments = postUtils.extractPostComments(postContainer);
      if (loadedComments.length > 0) {
        updateCardsComments(urn, loadedComments);
      }

      // Skip AI generation in human mode
      if (humanOnlyMode) {
        setIsEngageButtonGenerating(false);
        return;
      }

      // Generate AI comments using shared utility
      try {
        await generateAndUpdateCards({
          postContent: fullCaption,
          postContainer,
          count: 3,
          cardIds: aiCardIds,
          updateCardComment,
          updateCardStyleInfo,
        });
      } finally {
        // Mark as done generating
        setIsEngageButtonGenerating(false);
      }
    },
    [
      addCard,
      updateCardComment,
      updateCardStyleInfo,
      setSinglePostCards,
      setIsEngageButtonGenerating,
      clearSinglePostCards,
      updateCardsComments,
      openToTab,
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

      // Get fresh state from stores to avoid closure issues
      const composeState = useComposeStore.getState();
      const settingsState = useSettingsLocalStore.getState();

      // Skip if feature is disabled
      if (!settingsState.behavior.spacebarAutoEngage) {
        return;
      }

      // Only block if Load Posts is running or Load Posts cards exist
      const hasLoadPostsCardsNow = composeState.cards.some(
        (c) => !composeState.singlePostCardIds.includes(c.id),
      );
      if (composeState.isCollecting || hasLoadPostsCardsNow) {
        console.log(
          "EngageKit SpacebarEngage: ignoring - Load Posts running or Load Posts cards exist",
        );
        return;
      }

      // Check if we have a highlighted post (use ref for latest value)
      if (!mostVisiblePostRef.current) {
        console.log("EngageKit SpacebarEngage: no post highlighted");
        return;
      }

      // Prevent page scroll
      e.preventDefault();

      console.log(
        "EngageKit SpacebarEngage: spacebar pressed, triggering generation",
      );

      // Trigger generation flow
      await triggerGeneration(mostVisiblePostRef.current);
    },
    [triggerGeneration],
  );

  // Set up keydown listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // This component renders nothing
  return null;
}
