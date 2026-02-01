/**
 * Hook to auto-engage when user clicks LinkedIn's native comment buttons.
 * Uses CommentUtilities from linkedin-automation package for DOM v1/v2 support.
 *
 * When enabled (via settings.autoEngageOnCommentClick):
 * - Intercepts clicks on "X comments" and "Comment" buttons
 * - Triggers the same generation flow as EngageButton
 */

import { useEffect, useRef } from "react";

import type { NativeCommentButtonClickEvent } from "@sassy/linkedin-automation/comment/types";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import { useComposeStore } from "../../stores/compose-store";
import { useDailyQuotaLimitHitDialogStore } from "../../stores/dialog-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { SIDEBAR_TABS, useSidebarStore } from "../../stores/sidebar-store";
import { generateAndUpdateCards } from "../utils/generate-ai-comments";

/**
 * Hook to watch for native comment button clicks and auto-engage.
 */
export function useAutoEngage() {
  const {
    addCard,
    updateCardComment,
    updateCardStyleInfo,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
  } = useComposeStore();
  const { openToTab } = useSidebarStore();

  const showDailyQuotaLimitHitDialog = useDailyQuotaLimitHitDialogStore(
    (state) => state.open,
  );

  // Store refs to avoid recreating handleClick on every render
  const storeRef = useRef({
    addCard,
    updateCardComment,
    updateCardStyleInfo,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
    openToTab,
  });

  // Keep refs up to date
  useEffect(() => {
    storeRef.current = {
      addCard,
      updateCardComment,
      updateCardStyleInfo,
      setSinglePostCards,
      setIsEngageButtonGenerating,
      clearSinglePostCards,
      updateCardsComments,
      openToTab,
    };
  });

  useEffect(() => {
    const commentUtils = createCommentUtilities();
    const postUtils = createPostUtilities();

    const handleNativeCommentClick = async (
      event: NativeCommentButtonClickEvent,
    ) => {
      // Get fresh state from stores
      const composeState = useComposeStore.getState();
      const settingsState = useSettingsLocalStore.getState();

      // Skip if auto-engage is disabled
      if (!settingsState.behavior.autoEngageOnCommentClick) {
        return;
      }

      // Skip if another trigger (EngageButton or SpacebarEngage) already started generation
      // This prevents duplicate requests when programmatic clickCommentButton triggers this watcher
      if (composeState.isEngageButtonGenerating) {
        console.log(
          "[useAutoEngage] SKIPPED - isEngageButtonGenerating already true (another trigger is active)",
        );
        return;
      }

      // Only block if Load Posts is running or Load Posts cards exist
      const hasLoadPostsCards = composeState.cards.some(
        (c) => !composeState.singlePostCardIds.includes(c.id),
      );
      if (composeState.isCollecting || hasLoadPostsCards) {
        console.log(
          "[useAutoEngage] SKIPPED - Load Posts running or Load Posts cards exist",
        );
        return;
      }

      const { postContainer } = event;
      const {
        addCard,
        updateCardComment,
        updateCardStyleInfo,
        setSinglePostCards,
        setIsEngageButtonGenerating,
        clearSinglePostCards,
        updateCardsComments,
        openToTab,
      } = storeRef.current;

      // Extract post data
      const fullCaption = postUtils.extractPostCaption(postContainer);
      if (!fullCaption) {
        console.warn("EngageKit AutoEngage: unable to extract post caption");
        return;
      }

      console.log(
        "[useAutoEngage] ▶▶▶ TRIGGERED - native comment button clicked, starting generation",
      );

      // Clear any existing single-post cards
      clearSinglePostCards();
      setIsEngageButtonGenerating(true);

      // Extract post info using migrated utilities
      const captionPreview = fullCaption.slice(0, 100);
      const authorInfo = postUtils.extractPostAuthorInfo(postContainer);
      const postTime = postUtils.extractPostTime(postContainer);
      const postUrls = postUtils.extractPostUrl(postContainer);
      const urn = postUrls[0]?.urn || `unknown-${Date.now()}`;

      // Get humanOnlyMode setting from settings store
      const { humanOnlyMode } = useSettingsLocalStore.getState().behavior;

      // Create card IDs based on mode
      const manualCardId = humanOnlyMode ? crypto.randomUUID() : null;
      const aiCardIds = humanOnlyMode
        ? []
        : [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
      const allCardIds = manualCardId ? [manualCardId] : aiCardIds;

      console.log(
        `EngageKit AutoEngage: ${humanOnlyMode ? "creating 1 manual card (100% human mode)" : "generating 3 AI variations"} for post:`,
        fullCaption.slice(0, 100),
      );

      // Map author info to expected format
      const authorInfoMapped = {
        name: authorInfo.name,
        headline: authorInfo.headline,
        photoUrl: authorInfo.photoUrl,
        profileUrl: authorInfo.profileUrl,
      };

      // Map post time to expected format
      const postTimeMapped = {
        displayTime: postTime.displayTime,
        fullTime: postTime.fullTime,
      };

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
          authorInfo: authorInfoMapped,
          postTime: postTimeMapped,
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
            authorInfo: authorInfoMapped,
            postTime: postTimeMapped,
            postUrls,
            comments: [],
            commentStyleId: null,
            styleSnapshot: null,
          });
        });
      }

      // Track as single-post cards and open sidebar immediately
      setSinglePostCards(allCardIds);
      openToTab(SIDEBAR_TABS.COMPOSE);

      // Load comments for preview
      const beforeComments = postUtils.extractPostComments(postContainer);
      commentUtils.clickCommentButton(postContainer);
      await commentUtils.waitForCommentsReady(
        postContainer,
        beforeComments.length,
      );

      // Blur focus from LinkedIn's comment box
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable
      ) {
        document.activeElement.blur();
      }

      // Extract comments for display
      const loadedComments = postUtils.extractPostComments(postContainer);
      if (loadedComments.length > 0) {
        const mappedComments = loadedComments.map((c) => ({
          authorName: c.authorName,
          authorHeadline: c.authorHeadline,
          authorProfileUrl: c.authorProfileUrl,
          authorPhotoUrl: c.authorPhotoUrl,
          content: c.content,
          urn: c.urn,
          isReply: c.isReply,
        }));
        updateCardsComments(urn, mappedComments);
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
          onError(error) {
            switch (error.reason) {
              case "daily_quota_exceeded": {
                showDailyQuotaLimitHitDialog();
                break;
              }
              default:
                break;
            }
          },
        });
      } finally {
        setIsEngageButtonGenerating(false);
      }
    };

    // Start watching for native comment button clicks
    const cleanup = commentUtils.watchForNativeCommentButtonClicks(
      handleNativeCommentClick,
    );

    return cleanup;
  }, []);
}
