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

import { getTrpcClient } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import { getCommentStyleConfig } from "../stores/comment-style-cache";
import { useSettingsLocalStore } from "../stores/settings-local-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";

/**
 * Hook to watch for native comment button clicks and auto-engage.
 */
export function useAutoEngage() {
  const {
    addCard,
    updateCardComment,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
  } = useComposeStore();
  const { openToTab } = useSidebarStore();

  // Store refs to avoid recreating handleClick on every render
  const storeRef = useRef({
    addCard,
    updateCardComment,
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
      event: NativeCommentButtonClickEvent
    ) => {
      // Get fresh state from stores
      const composeState = useComposeStore.getState();
      const settingsState = useSettingsLocalStore.getState();

      // Skip if auto-engage is disabled
      if (!settingsState.behavior.autoEngageOnCommentClick) {
        return;
      }

      // Only block if Load Posts is running or Load Posts cards exist
      const hasLoadPostsCards = composeState.cards.some(
        (c) => !composeState.singlePostCardIds.includes(c.id)
      );
      if (composeState.isCollecting || hasLoadPostsCards) {
        console.log(
          "EngageKit AutoEngage: ignoring - Load Posts running or Load Posts cards exist"
        );
        return;
      }

      const { postContainer } = event;
      const {
        addCard,
        updateCardComment,
        setSinglePostCards,
        setIsEngageButtonGenerating,
        clearSinglePostCards,
        updateCardsComments,
        openToTab,
      } = storeRef.current;

      // Get tRPC client for API calls
      const trpcClient = getTrpcClient();

      // Extract post data
      const fullCaption = postUtils.extractPostCaption(postContainer);
      if (!fullCaption) {
        console.warn("EngageKit AutoEngage: unable to extract post caption");
        return;
      }

      console.log(
        "EngageKit AutoEngage: native comment button clicked, triggering generation"
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
        fullCaption.slice(0, 100)
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
        beforeComments.length
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

      // Extract adjacent comments for AI generation
      const adjacentComments = postUtils.extractAdjacentComments(postContainer);

      // Get comment style config (styleGuide, maxWords, creativity)
      const styleConfig = await getCommentStyleConfig();
      console.log("[useAutoEngage] Using comment style config:", {
        styleName: styleConfig.styleName,
        maxWords: styleConfig.maxWords,
        creativity: styleConfig.creativity,
      });

      // Request params for AI generation with style config
      const requestParams = {
        postContent: fullCaption,
        styleGuide: styleConfig.styleGuide,
        adjacentComments: adjacentComments.map((c) => ({
          commentContent: c.commentContent,
          likeCount: c.likeCount,
          replyCount: c.replyCount,
        })),
        // Pass AI generation config from CommentStyle
        maxWords: styleConfig.maxWords,
        creativity: styleConfig.creativity,
      };

      // Fire 3 parallel AI requests
      try {
        await Promise.all(
          aiCardIds.map(async (cardId) => {
            try {
              const result =
                await trpcClient.aiComments.generateComment.mutate(
                  requestParams
                );
              updateCardComment(cardId, result.comment);
            } catch (err) {
              console.error(
                `EngageKit AutoEngage: failed to generate for card ${cardId}`,
                err
              );
              updateCardComment(cardId, "");
            }
          })
        );
      } catch (err) {
        console.error("EngageKit AutoEngage: error generating comments", err);
      } finally {
        setIsEngageButtonGenerating(false);
      }
    };

    // Start watching for native comment button clicks
    const cleanup = commentUtils.watchForNativeCommentButtonClicks(
      handleNativeCommentClick
    );

    return cleanup;
  }, []);
}
