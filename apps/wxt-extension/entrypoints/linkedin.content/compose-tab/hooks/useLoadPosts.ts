/**
 * useLoadPosts Hook
 *
 * Handles the "Load Posts" flow:
 * - Queue building for target lists and discovery sets
 * - Multi-tab navigation for queue processing
 * - Normal feed collection
 * - Progress tracking and stop mechanism
 */

import { useCallback, useRef, useState } from "react";
import { useTRPC } from "@/lib/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { defer } from "lib/commons";

import type { PostLoadSettings } from "../../stores/queue";
import type { GenerationCompleteMetadata } from "./useSubmitBatch";
import { useSettingsLocalStore } from "../../stores";
import { useComposeStore } from "../../stores/compose-store";
import { useDailyQuotaLimitHitDialogStore } from "../../stores/dialog-store";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { processQueue } from "../../utils/multi-tab-navigation";
import {
  buildDiscoverySetQueueItems,
  buildTargetListQueueItems,
} from "../utils/build-queue-items";
import { loadPostsToCards } from "../utils/load-posts-to-cards";

/**
 * Hook for loading posts from feed, target lists, or discovery sets
 */
export function useLoadPosts(
  targetDraftCount: number,
  onGenerationComplete: (
    metadata: GenerationCompleteMetadata,
  ) => void | Promise<void>,
) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const stopRequestedRef = useRef(false);

  // Store actions and selectors
  const setIsCollecting = useComposeStore((state) => state.setIsCollecting);
  const addCard = useComposeStore((state) => state.addCard);
  const addBatchCards = useComposeStore((state) => state.addBatchCards);
  const updateCardComment = useComposeStore((state) => state.updateCardComment);
  const updateCardStyleInfo = useComposeStore(
    (state) => state.updateCardStyleInfo,
  );
  const updateBatchCardCommentAndStyle = useComposeStore(
    (state) => state.updateBatchCardCommentAndStyle,
  );
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isUrnIgnored = useComposeStore((state) => state.isUrnIgnored);
  const getCards = useComposeStore((state) => state.cards);
  const showDailyAIQuotaExceededOverlay = useDailyQuotaLimitHitDialogStore(
    (state) => state.open,
  );

  /**
   * Start batch collection:
   * - Scrolls feed, clicks ALL comment buttons at once per batch
   * - Waits for ALL comments to load in parallel
   * - Adds all cards and fires all AI requests at once
   * - Much faster than sequential processing
   */
  const handleStart = useCallback(async () => {
    setIsLoading(true);

    using _ = defer(() => {
      setIsLoading(false);
    });

    const behavior = useSettingsLocalStore.getState().behavior;

    if (behavior.humanOnlyMode === false) {
      const quota = await queryClient.fetchQuery(
        // staletime: 0 to always fetch latest quota
        trpc.aiComments.quota.queryOptions(undefined, {
          staleTime: 0,
        }),
      );

      // technically quota should never be null here because null is only returned if account not found
      // but adding a null for type narrowing
      if (quota === null) {
        console.error(`[useLoadPosts] Failed to retrieve account quota`);
        return;
      }

      if (quota.left <= 0) {
        showDailyAIQuotaExceededOverlay({
          showTurnOffAiCommentGenerationButton: true,
        });
        return;
      }
    }

    setIsCollecting(true); // Mark as collecting so ComposeCard can refocus on blur
    setLoadingProgress(0);
    setScrollProgress(0); // Reset scroll progress
    stopRequestedRef.current = false;

    // Get settings from DB store (snapshot at start time)
    const postLoadSettings = useSettingsDBStore.getState().postLoad;
    const commentGenerateSettingsDB =
      useSettingsDBStore.getState().commentGenerate;

    // Only use queue if we're not already on a search/content page (already navigated)
    const isOnSearchPage = window.location.pathname.startsWith(
      "/search/results/content",
    );

    // Build comment generate settings snapshot for queue processing
    // Includes all settings needed for AI generation in new tabs without waiting for DB store
    const commentGenerateSettings = commentGenerateSettingsDB
      ? {
          dynamicChooseStyleEnabled:
            commentGenerateSettingsDB.dynamicChooseStyleEnabled,
          adjacentCommentsEnabled:
            commentGenerateSettingsDB.adjacentCommentsEnabled,
          commentStyleId: commentGenerateSettingsDB.commentStyleId,
        }
      : undefined;

    // If target list is enabled with list IDs, use queue system to process lists
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
        const queueItems = await buildTargetListQueueItems(targetListIds);

        if (queueItems.length > 0) {
          console.log(
            `[useLoadPosts] Starting queue with ${queueItems.length} target lists`,
          );

          // Build settings snapshot for queue (omit DB-only fields)
          const { accountId, createdAt, updatedAt, ...settingsForQueue } =
            postLoadSettings;

          // Start queue processing - this opens first tab via background script
          await processQueue(
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
        console.error(`[useLoadPosts] Failed to build target list queue:`, err);
        setIsLoading(false);
        setIsCollecting(false);
        return;
      }
    }

    // If discovery sets are enabled with set IDs, use queue system to process sets
    const discoverySetIds = postLoadSettings?.discoverySetIds ?? [];
    if (
      postLoadSettings?.discoverySetEnabled &&
      discoverySetIds.length > 0 &&
      !isOnSearchPage
    ) {
      console.log(
        `[useLoadPosts] Building queue for ${discoverySetIds.length} discovery sets...`,
      );

      try {
        const queueItems = await buildDiscoverySetQueueItems(discoverySetIds);

        if (queueItems.length > 0) {
          console.log(
            `[useLoadPosts] Starting queue with ${queueItems.length} discovery sets`,
          );

          // Build settings snapshot for queue (omit DB-only fields)
          const { accountId, createdAt, updatedAt, ...settingsForQueue } =
            postLoadSettings;

          // Start queue processing - this opens first tab via background script
          await processQueue(
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
          // No valid discovery sets found - show error and stop
          console.error(`[useLoadPosts] No valid discovery sets found`);
          setIsLoading(false);
          setIsCollecting(false);
          return;
        }
      } catch (err) {
        // Discovery sets enabled but failed - stop, don't fall through to feed collection
        console.error(
          `[useLoadPosts] Failed to build discovery set queue:`,
          err,
        );
        setIsLoading(false);
        setIsCollecting(false);
        return;
      }
    }

    // Get current cards to find existing URNs (snapshot at start time)
    const existingUrns = new Set(getCards.map((card) => card.urn));

    // we only want to show it once per load posts action to not be so annoying
    let dailyQuotaExceededShown = false;

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
      onScrollProgress: setScrollProgress,
      onGenerationComplete,
      onBatchComplete: () => {
        void queryClient.invalidateQueries(
          trpc.aiComments.quota.queryOptions(),
        );
      },
      onDailyAiGenerationQuotaExceeded: () => {
        if (dailyQuotaExceededShown) {
          return;
        }

        dailyQuotaExceededShown = true;
        showDailyAIQuotaExceededOverlay({
          showTurnOffAiCommentGenerationButton: true,
        });
      },
    });

    setIsLoading(false);
    setIsCollecting(false); // Done collecting, stop refocusing on blur
    setScrollProgress(0); // Reset scroll progress when done
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
    setScrollProgress(0); // Reset scroll progress when stopped
  }, [setIsCollecting]);

  return {
    handleStart,
    handleStop,
    isLoading,
    loadingProgress,
    scrollProgress,
  };
}
