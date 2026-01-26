/**
 * useLoadPosts Hook
 *
 * Handles the "Load Posts" flow:
 * - Queue building for target lists
 * - Multi-tab navigation for queue processing
 * - Normal feed collection
 * - Progress tracking and stop mechanism
 */

import { useCallback, useRef, useState } from "react";

import type { PostLoadSettings } from "../../stores/target-list-queue";
import type { CommentGenerateSettingsSnapshot } from "../utils/generate-ai-comments";
import type { GenerationCompleteMetadata } from "./useSubmitBatch";
import { useComposeStore } from "../../stores/compose-store";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { processTargetListQueue } from "../../utils/multi-tab-navigation";
import { buildQueueItems } from "../utils/build-queue-items";
import { loadPostsToCards } from "../utils/load-posts-to-cards";

/**
 * Hook for loading posts from feed or target lists
 */
export function useLoadPosts(
  targetDraftCount: number,
  onGenerationComplete: (metadata: GenerationCompleteMetadata) => void | Promise<void>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const stopRequestedRef = useRef(false);

  // Store actions and selectors
  const setIsCollecting = useComposeStore((state) => state.setIsCollecting);
  const addCard = useComposeStore((state) => state.addCard);
  const addBatchCards = useComposeStore((state) => state.addBatchCards);
  const updateCardComment = useComposeStore((state) => state.updateCardComment);
  const updateCardStyleInfo = useComposeStore((state) => state.updateCardStyleInfo);
  const updateBatchCardCommentAndStyle = useComposeStore(
    (state) => state.updateBatchCardCommentAndStyle,
  );
  const isUrnIgnored = useComposeStore((state) => state.isUrnIgnored);
  const getCards = useComposeStore((state) => state.cards);

  /**
   * Start batch collection:
   * - Scrolls feed, clicks ALL comment buttons at once per batch
   * - Waits for ALL comments to load in parallel
   * - Adds all cards and fires all AI requests at once
   * - Much faster than sequential processing
   */
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setIsCollecting(true); // Mark as collecting so ComposeCard can refocus on blur
    setLoadingProgress(0);
    stopRequestedRef.current = false;

    // Get settings from DB store (snapshot at start time)
    const postLoadSettings = useSettingsDBStore.getState().postLoad;
    const commentGenerateSettingsDB =
      useSettingsDBStore.getState().commentGenerate;

    // If target list is enabled with list IDs, use queue system to process lists
    // Only use queue if we're not already on a search/content page (already navigated)
    const isOnSearchPage = window.location.pathname.startsWith(
      "/search/results/content",
    );

    const targetListIds = postLoadSettings?.targetListIds ?? [];
    if (
      postLoadSettings?.targetListEnabled &&
      targetListIds.length > 0 &&
      !isOnSearchPage
    ) {
      // Build queue from cached URNs (pre-fetched when target list selector closed)
      console.log(
        `[useLoadPosts] Building queue for ${targetListIds.length} target lists...`,
      );

      try {
        const queueItems = await buildQueueItems(targetListIds);

        if (queueItems.length > 0) {
          console.log(
            `[useLoadPosts] Starting queue with ${queueItems.length} lists`,
            {
              queueItems: JSON.stringify(queueItems),
            },
          );

          // Build settings snapshot for queue
          const settingsForQueue: PostLoadSettings = {
            targetListEnabled: postLoadSettings.targetListEnabled,
            targetListIds: postLoadSettings.targetListIds,
            timeFilterEnabled: postLoadSettings.timeFilterEnabled,
            minPostAge: postLoadSettings.minPostAge,
            skipFriendActivitiesEnabled:
              postLoadSettings.skipFriendActivitiesEnabled,
            skipCompanyPagesEnabled: postLoadSettings.skipCompanyPagesEnabled,
            skipPromotedPostsEnabled: postLoadSettings.skipPromotedPostsEnabled,
            skipBlacklistEnabled: postLoadSettings.skipBlacklistEnabled,
            blacklistId: postLoadSettings.blacklistId,
            skipFirstDegree: postLoadSettings.skipFirstDegree,
            skipSecondDegree: postLoadSettings.skipSecondDegree,
            skipThirdDegree: postLoadSettings.skipThirdDegree,
            skipFollowing: postLoadSettings.skipFollowing,
            skipCommentsLoading: postLoadSettings.skipCommentsLoading,
          };

          // Build comment generate settings snapshot for dynamic style branching
          const commentGenerateSettings = commentGenerateSettingsDB
            ? {
                dynamicChooseStyleEnabled:
                  commentGenerateSettingsDB.dynamicChooseStyleEnabled,
                adjacentCommentsEnabled:
                  commentGenerateSettingsDB.adjacentCommentsEnabled,
              }
            : undefined;

          // Start queue processing - this opens first tab via background script
          await processTargetListQueue(
            queueItems,
            settingsForQueue,
            targetDraftCount,
            commentGenerateSettings,
          );

          // Reset loading state - the new tab will handle Load Posts via auto-resume
          setIsLoading(false);
          setIsCollecting(false);
          return;
        } else {
          // No valid URNs in any target list - show error and stop
          console.error(`[useLoadPosts] No valid target lists with URNs`);
          setIsLoading(false);
          setIsCollecting(false);
          return;
        }
      } catch (err) {
        // Target list enabled but failed - stop, don't fall through to feed collection
        console.error(`[useLoadPosts] Failed to build queue:`, err);
        setIsLoading(false);
        setIsCollecting(false);
        return;
      }
    }

    // Get current cards to find existing URNs (snapshot at start time)
    const existingUrns = new Set(getCards.map((card) => card.urn));

    // Run post collection using utility (blacklist is fetched internally)
    await loadPostsToCards({
      targetCount: targetDraftCount,
      postLoadSettings,
      existingUrns,
      isUrnIgnored,
      shouldStop: () => stopRequestedRef.current,
      addCard,
      addBatchCards,
      updateCardComment,
      updateCardStyleInfo,
      updateBatchCardCommentAndStyle,
      onProgress: setLoadingProgress,
      onGenerationComplete,
    });

    setIsLoading(false);
    setIsCollecting(false); // Done collecting, stop refocusing on blur
  }, [
    targetDraftCount,
    onGenerationComplete,
    setIsCollecting,
    addCard,
    addBatchCards,
    updateCardComment,
    updateCardStyleInfo,
    updateBatchCardCommentAndStyle,
    isUrnIgnored,
    getCards,
  ]);

  /**
   * Stop the batch collection
   */
  const handleStop = useCallback(() => {
    stopRequestedRef.current = true;
    setIsCollecting(false); // Stop refocusing immediately when user stops
  }, [setIsCollecting]);

  return {
    handleStart,
    handleStop,
    isLoading,
    loadingProgress,
  };
}
