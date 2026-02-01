/**
 * useAutoResume Hook
 *
 * Handles automatic resumption of post loading when:
 * - Multi-tab queue processing navigates to new tab
 * - Content script detects pending navigation and opens sidebar
 *
 * Checks for pending navigation state set by content script
 * and automatically triggers Load Posts with saved settings.
 */

import { useEffect, useRef, useState } from "react";

import type { PendingNavigationState } from "../../stores/navigation-state";
import type { GenerationCompleteMetadata } from "./useSubmitBatch";
import { useAccountStore } from "../../stores/account-store";
import { useComposeStore } from "../../stores/compose-store";
import { continueQueueProcessing } from "../../utils/multi-tab-navigation";
import { loadPostsToCards } from "../utils/load-posts-to-cards";

/** Queue progress info for display */
export interface QueueProgressInfo {
  currentIndex: number;
  totalLists: number;
  currentListName: string;
}

/**
 * Hook for auto-resume system (multi-tab queue processing)
 */
export function useAutoResume(
  onGenerationComplete: (metadata: GenerationCompleteMetadata) => void | Promise<void>,
) {
  const [queueProgress, setQueueProgress] = useState<QueueProgressInfo | null>(
    null,
  );
  const [isAutoResumeLoading, setIsAutoResumeLoading] = useState(false);
  const [autoResumeScrollProgress, setAutoResumeScrollProgress] = useState(0);

  // Track if we've checked for pending navigation (prevent double-trigger)
  const checkedPendingNavRef = useRef(false);

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

  // Auto-resume system: checks global variable set by content script
  // Content script detects pending navigation and opens sidebar, ComposeTab triggers Load Posts
  useEffect(() => {
    if (checkedPendingNavRef.current) return;
    checkedPendingNavRef.current = true;

    console.log(
      "[useAutoResume] Checking for pending navigation from content script...",
    );

    // Check for pending navigation set by content script
    const pendingNav = (
      window as unknown as {
        __engagekit_pending_navigation?: PendingNavigationState;
      }
    ).__engagekit_pending_navigation;

    if (!pendingNav) {
      console.log("[useAutoResume] No pending navigation found");
      return;
    }

    // Clear the global variable (one-time use)
    delete (
      window as unknown as {
        __engagekit_pending_navigation?: PendingNavigationState;
      }
    ).__engagekit_pending_navigation;

    console.log(
      "[useAutoResume] Found pending navigation, triggering Load Posts",
      {
        type: pendingNav.type,
        targetDraftCount: pendingNav.targetDraftCount,
      },
    );

    // Trigger Load Posts with the saved settings
    const runAutoResume = async () => {
      console.log("[useAutoResume] runAutoResume started");
      const {
        postLoadSettings,
        commentGenerateSettings,
        targetDraftCount: savedTargetDraftCount,
        queueState,
      } = pendingNav;

      console.log("[useAutoResume] runAutoResume settings:", {
        targetDraftCount: savedTargetDraftCount,
        postLoadSettings,
        commentGenerateSettings,
        queueState: queueState
          ? {
              currentIndex: queueState.currentIndex,
              totalLists: queueState.queue.length,
            }
          : null,
      });

      // Set queue progress info if this is a queue
      // NOTE: queueState.currentIndex is the NEXT index (already incremented by getNextQueueItem)
      // So we use currentIndex - 1 to get the actual current item being processed
      if (pendingNav.type === "queue" && queueState) {
        const actualIndex = Math.max(0, queueState.currentIndex - 1);
        const currentItem = queueState.queue[actualIndex];
        setQueueProgress({
          currentIndex: actualIndex + 1, // 1-indexed for display
          totalLists: queueState.queue.length,
          currentListName: currentItem?.targetListName ?? "Unknown",
        });
      }

      // CRITICAL: Restore account ID before generation starts
      // The account store hasn't loaded yet in the new tab, but we need the ID for API requests
      if (pendingNav.accountId) {
        console.log(
          "[useAutoResume] Restoring account ID before generation:",
          pendingNav.accountId,
        );
        useAccountStore.getState().restoreAccountFromId(pendingNav.accountId);
      } else {
        console.warn(
          "[useAutoResume] No account ID in pending navigation - API calls may fail",
        );
      }

      // Set up loading state (uses the same setIsCollecting from store as useLoadPosts)
      setIsCollecting(true);
      setIsAutoResumeLoading(true);
      setAutoResumeScrollProgress(0);

      // NOTE: We skip restoring settings to DB store during auto-resume
      // because the account store might not be loaded yet (we skipped waitForStoresReady).
      // The postLoadSettings from pendingNavigation already has all the settings we need.
      // The DB store will sync when the account loads in the background.
      console.log(
        "[useAutoResume] runAutoResume: Using settings from pendingNavigation (skipping DB update)",
      );

      // Get existing URNs to skip
      const existingUrns = new Set(getCards.map((card) => card.urn));

      // Run post collection using utility (blacklist is fetched internally)
      console.log("[useAutoResume] runAutoResume: Starting loadPostsToCards...");
      try {
        await loadPostsToCards({
          targetCount: savedTargetDraftCount,
          postLoadSettings,
          commentGenerateSettings,
          existingUrns,
          isUrnIgnored,
          shouldStop: () => false, // Auto-resume doesn't support stop
          addCard,
          addBatchCards,
          updateCardComment,
          updateCardStyleInfo,
          updateBatchCardCommentAndStyle,
          onProgress: () => {}, // No progress UI during auto-resume
          onScrollProgress: setAutoResumeScrollProgress, // Track scroll progress for UI
          onGenerationComplete,
        });
        console.log(
          "[useAutoResume] runAutoResume: loadPostsToCards completed successfully",
        );
      } catch (error) {
        console.error(
          "[useAutoResume] runAutoResume: loadPostsToCards FAILED:",
          error,
        );
      }

      console.log("[useAutoResume] Auto-resume Load Posts completed");
      setIsCollecting(false);
      setIsAutoResumeLoading(false);
      setAutoResumeScrollProgress(0);

      // If this was part of a queue, continue to next tab
      if (pendingNav.type === "queue") {
        console.log("[useAutoResume] Queue processing, checking for next tab");
        const hasNext = await continueQueueProcessing();

        if (hasNext) {
          console.log("[useAutoResume] Opened next tab in queue");
        } else {
          console.log("[useAutoResume] Queue complete");
        }
      }
    };

    void runAutoResume();
  }, [
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

  return {
    queueProgress,
    isAutoResumeLoading,
    autoResumeScrollProgress
  };
}
