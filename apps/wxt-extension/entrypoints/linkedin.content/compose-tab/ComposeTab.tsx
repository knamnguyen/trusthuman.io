import { useCallback, useEffect, useRef, useState } from "react";
import {
  Edit3,
  Feather,
  Loader2,
  Send,
  Settings,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import { useShallow } from "zustand/shallow";

import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { Button } from "@sassy/ui/button";
import { TooltipWithDialog } from "@sassy/ui/components/tooltip-with-dialog";

import type { PendingNavigationState } from "../stores/navigation-state";
import type { PostLoadSettings } from "../stores/target-list-queue";
import { useShadowRootStore } from "../stores";
import { useComposeStore } from "../stores/compose-store";
import { useSettingsDBStore } from "../stores/settings-db-store";
import {
  continueQueueProcessing,
  processTargetListQueue,
} from "../utils/multi-tab-navigation";
import { ComposeCard } from "./ComposeCard";
import { PostPreviewSheet } from "./PostPreviewSheet";
import { SettingsSheet } from "./settings/SettingsSheet";
import { SettingsTags } from "./settings/SettingsTags";
import { buildQueueItems } from "./utils/build-queue-items";
import { loadPostsToCards } from "./utils/load-posts-to-cards";
import { submitCommentFullFlow } from "./utils/submit-comment-full-flow";

// Initialize utilities (auto-detects DOM version)
const commentUtils = createCommentUtilities();

/** Queue progress info for display */
interface QueueProgressInfo {
  currentIndex: number;
  totalLists: number;
  currentListName: string;
}

export function ComposeTab() {
  // DEBUG: Track renders
  console.log("[ComposeTab] Render");

  // Shadow root for tooltip/dialog portals
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);

  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Target number of drafts to collect (user configurable, max 100) */
  const [targetDraftCount, setTargetDraftCount] = useState<number>(10);
  /** Live progress counter during loading */
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  /** Ref to signal stop request to the streaming loop */
  const stopRequestedRef = useRef(false);
  /** Queue progress info (only set during queue processing) */
  const [queueProgress, setQueueProgress] = useState<QueueProgressInfo | null>(
    null,
  );

  // Subscribe to isUserEditing for paused indicator
  const isUserEditing = useComposeStore((state) => state.isUserEditing);
  // Subscribe to isEngageButtonGenerating for conflict handling
  const isEngageButtonGenerating = useComposeStore(
    (state) => state.isEngageButtonGenerating,
  );
  const clearAllCards = useComposeStore((state) => state.clearAllCards);


  // Use separate subscriptions for different concerns to minimize re-renders
  // Card IDs for rendering the list - only changes when cards are added/removed
  const cardIds = useComposeStore(
    useShallow((state) => {
      // console.log(
      //   "[ComposeTab] cardIds selector called, count:",
      //   state.cards.length,
      // );
      return state.cards.map((c) => c.id);
    }),
  );
  // Single-post card IDs (from EngageButton) for different styling
  const singlePostCardIds = useComposeStore((state) => state.singlePostCardIds);

  // Check if we have cards from each source (for mutual exclusivity)
  const hasEngageButtonCards = singlePostCardIds.length > 0;
  const hasLoadPostsCards = cardIds.some(
    (id) => !singlePostCardIds.includes(id),
  );

  // Stats for display - uses shallow comparison
  const { generatingCount, draftCount, sentCount } = useComposeStore(
    useShallow((state) => ({
      generatingCount: state.cards.filter((c) => c.isGenerating).length,
      draftCount: state.cards.filter(
        (c) => c.status === "draft" && !c.isGenerating,
      ).length,
      sentCount: state.cards.filter((c) => c.status === "sent").length,
    })),
  );

  // Actions and other state
  const isSubmitting = useComposeStore((state) => state.isSubmitting);
  const addCard = useComposeStore((state) => state.addCard);
  const setIsSubmitting = useComposeStore((state) => state.setIsSubmitting);
  const setIsCollecting = useComposeStore((state) => state.setIsCollecting);
  const updateCardStatus = useComposeStore((state) => state.updateCardStatus);
  const updateCardComment = useComposeStore((state) => state.updateCardComment);
  const updateCardStyleInfo = useComposeStore((state) => state.updateCardStyleInfo);
  const isUrnIgnored = useComposeStore((state) => state.isUrnIgnored);

  // Get cards array only when needed for operations (not for rendering)
  const getCards = useComposeStore((state) => state.cards);
  const setPreviewingCard = useComposeStore((state) => state.setPreviewingCard);
  const previewingCardId = useComposeStore((state) => state.previewingCardId);

  // Conflict flags - disable certain actions when others are running
  const isAnyGenerating = isLoading || isEngageButtonGenerating;

  // Ensure only one sub-sidebar open at a time: close settings when post preview opens
  useEffect(() => {
    if (previewingCardId) {
      setSettingsOpen(false);
    }
  }, [previewingCardId]);

  // Track if we've checked for pending navigation (prevent double-trigger)
  const checkedPendingNavRef = useRef(false);

  // Auto-resume system: checks global variable set by content script
  // Content script detects pending navigation and opens sidebar, ComposeTab triggers Load Posts
  useEffect(() => {
    if (checkedPendingNavRef.current) return;
    checkedPendingNavRef.current = true;

    console.log(
      "[ComposeTab] Checking for pending navigation from content script...",
    );

    // Check for pending navigation set by content script
    const pendingNav = (
      window as unknown as {
        __engagekit_pending_navigation?: PendingNavigationState;
      }
    ).__engagekit_pending_navigation;

    if (!pendingNav) {
      console.log("[ComposeTab] No pending navigation found");
      return;
    }

    // Clear the global variable (one-time use)
    delete (
      window as unknown as {
        __engagekit_pending_navigation?: PendingNavigationState;
      }
    ).__engagekit_pending_navigation;

    console.log(
      "[ComposeTab] Found pending navigation, triggering Load Posts",
      {
        type: pendingNav.type,
        targetDraftCount: pendingNav.targetDraftCount,
      },
    );

    // Trigger Load Posts with the saved settings
    const runAutoResume = async () => {
      console.log("[ComposeTab] runAutoResume started");
      const {
        postLoadSettings,
        commentGenerateSettings,
        targetDraftCount: savedTargetDraftCount,
        queueState,
      } = pendingNav;

      console.log("[ComposeTab] runAutoResume settings:", {
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

      // Update the target draft count in UI
      setTargetDraftCount(savedTargetDraftCount);

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

      // Set up loading state
      setIsLoading(true);
      setIsCollecting(true);
      setLoadingProgress(0);
      stopRequestedRef.current = false;

      // NOTE: We skip restoring settings to DB store during auto-resume
      // because the account store might not be loaded yet (we skipped waitForStoresReady).
      // The postLoadSettings from pendingNavigation already has all the settings we need.
      // The DB store will sync when the account loads in the background.
      console.log(
        "[ComposeTab] runAutoResume: Using settings from pendingNavigation (skipping DB update)",
      );

      // Get existing URNs to skip
      const existingUrns = new Set(getCards.map((card) => card.urn));

      // Run post collection using utility (blacklist is fetched internally)
      console.log("[ComposeTab] runAutoResume: Starting loadPostsToCards...");
      try {
        await loadPostsToCards({
          targetCount: savedTargetDraftCount,
          postLoadSettings,
          commentGenerateSettings,
          existingUrns,
          isUrnIgnored,
          shouldStop: () => stopRequestedRef.current,
          addCard,
          updateCardComment,
          updateCardStyleInfo,
          onProgress: setLoadingProgress,
          setPreviewingCard,
        });
        console.log(
          "[ComposeTab] runAutoResume: loadPostsToCards completed successfully",
        );
      } catch (error) {
        console.error(
          "[ComposeTab] runAutoResume: loadPostsToCards FAILED:",
          error,
        );
      }

      console.log("[ComposeTab] Auto-resume Load Posts completed");
      setIsLoading(false);
      setIsCollecting(false);

      // If this was part of a queue, continue to next tab
      if (pendingNav.type === "queue") {
        console.log("[ComposeTab] Queue processing, checking for next tab");
        const hasNext = await continueQueueProcessing();

        if (hasNext) {
          console.log("[ComposeTab] Opened next tab in queue");
        } else {
          console.log("[ComposeTab] Queue complete");
        }
      }
    };

    void runAutoResume();
  }, [
    addCard,
    getCards,
    isUrnIgnored,
    setIsCollecting,
    setPreviewingCard,
    updateCardComment,
    updateCardStyleInfo,
  ]);

  // Handler to open settings (closes post preview first)
  const handleOpenSettings = useCallback(() => {
    setPreviewingCard(null);
    setSettingsOpen(true);
  }, [setPreviewingCard]);

  /**
   * Start batch collection:
   * - Scrolls feed, clicks ALL comment buttons at once per batch
   * - Waits for ALL comments to load in parallel
   * - Adds all cards and fires all AI requests at once
   * - Much faster than sequential processing
   */
  const handleStart = useCallback(async () => {
    // Close settings sheet when starting load (post preview will open for first card)
    setSettingsOpen(false);

    setIsLoading(true);
    setIsCollecting(true); // Mark as collecting so ComposeCard can refocus on blur
    setLoadingProgress(0);
    stopRequestedRef.current = false;

    // Get settings from DB store (snapshot at start time)
    const postLoadSettings = useSettingsDBStore.getState().postLoad;
    const commentGenerateSettingsDB = useSettingsDBStore.getState().commentGenerate;

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
        `[EngageKit] Building queue for ${targetListIds.length} target lists...`,
      );

      try {
        const queueItems = await buildQueueItems(targetListIds);

        if (queueItems.length > 0) {
          console.log(
            `[EngageKit] Starting queue with ${queueItems.length} lists`,
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
          console.error(`[EngageKit] No valid target lists with URNs`);
          setIsLoading(false);
          setIsCollecting(false);
          return;
        }
      } catch (err) {
        // Target list enabled but failed - stop, don't fall through to feed collection
        console.error(`[EngageKit] Failed to build queue:`, err);
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
      updateCardComment,
      updateCardStyleInfo,
      onProgress: setLoadingProgress,
      setPreviewingCard,
    });

    setIsLoading(false);
    setIsCollecting(false); // Done collecting, stop refocusing on blur
  }, [
    addCard,
    getCards,
    isUrnIgnored,
    setIsCollecting,
    setPreviewingCard,
    targetDraftCount,
    updateCardComment,
    updateCardStyleInfo,
  ]);

  /**
   * Stop the batch collection
   */
  const handleStop = useCallback(() => {
    stopRequestedRef.current = true;
    setIsCollecting(false); // Stop refocusing immediately when user stops
  }, [setIsCollecting]);

  /**
   * Submit all draft comments to LinkedIn
   * Uses submitCommentFullFlow utility for each card with random delays between submissions.
   */
  const handleSubmitAll = useCallback(async () => {
    // Only submit cards that are drafts AND have finished generating
    const cardsToSubmit = getCards.filter(
      (c) => c.status === "draft" && !c.isGenerating,
    );
    if (cardsToSubmit.length === 0) return;

    // Get submit delay settings (use defaults if not loaded yet)
    const submitSettings = useSettingsDBStore.getState().submitComment;
    const [minDelay = 5, maxDelay = 20] = (
      submitSettings?.submitDelayRange ?? "5-20"
    )
      .split("-")
      .map(Number);

    setIsSubmitting(true);

    for (const card of cardsToSubmit) {
      // Skip empty comments
      if (!card.commentText.trim()) {
        continue;
      }

      const success = await submitCommentFullFlow(card, commentUtils);
      if (success) {
        updateCardStatus(card.id, "sent");
      }

      // Random delay between submissions (based on settings)
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      await new Promise((r) => setTimeout(r, delay * 1000));
    }

    setIsSubmitting(false);
  }, [getCards, setIsSubmitting, updateCardStatus]);

  return (
    <div className="bg-background flex flex-col gap-3 px-4">
      {/* Sticky Compact Header */}
      <div className="bg-background sticky top-0 z-10 -mx-4 border-b px-4 py-2">
        {/* Row 1: Title + Settings Icon */}
        <div className="mb-2 flex items-center justify-between border-b pb-2">
          <TooltipWithDialog
            tooltipContent={
              <p className="text-sm">
                Load posts from your feed and generate AI comments.
              </p>
            }
            buttonText="Watch tutorial"
            dialogTitle="How to use Compose"
            dialogDescription="Learn how to efficiently engage with posts using EngageKit."
            dialogContent={
              <div className="flex flex-col gap-4">
                <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                  <span className="text-muted-foreground text-sm">
                    Tutorial video coming soon
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>1. Load Posts:</strong> Click "Load Posts" to
                    collect posts from your current feed.
                  </p>
                  <p>
                    <strong>2. Configure Settings:</strong> Use the settings
                    icon to customize filters and AI behavior.
                  </p>
                  <p>
                    <strong>3. Review & Edit:</strong> Review AI-generated
                    comments and edit as needed.
                  </p>
                  <p>
                    <strong>4. Submit:</strong> Submit comments individually or
                    use "Submit All" for batch posting.
                  </p>
                </div>
              </div>
            }
            tooltipSide="bottom"
            portalContainer={shadowRoot}
            dialogClassName="max-w-md"
          >
            <div className="flex cursor-help items-center gap-2">
              <Feather className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Compose</span>
            </div>
          </TooltipWithDialog>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 shrink-0 p-0"
            onClick={handleOpenSettings}
            title="Open settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Queue Progress Banner (only shown during queue processing) */}
        {queueProgress && (
          <div className="mb-2 rounded-md bg-blue-50 px-3 py-2 text-xs">
            <div className="font-medium text-blue-700">
              Loading list {queueProgress.currentIndex}/
              {queueProgress.totalLists}
            </div>
            <div className="truncate text-blue-600">
              {queueProgress.currentListName}
            </div>
          </div>
        )}

        {/* Row 2: Settings Tags */}
        <div className="mb-2 overflow-x-auto">
          <SettingsTags />
        </div>

        {/* Row 2: Load Posts + Target Input */}
        <div className="mb-2 flex items-center gap-2">
          {isLoading ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              size="sm"
              className="h-7 flex-1 text-xs"
            >
              <Square className="mr-1 h-3 w-3" />
              Stop ({loadingProgress}/{targetDraftCount})
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={
                isSubmitting || isEngageButtonGenerating || hasEngageButtonCards
              }
              size="sm"
              className="h-7 flex-1 text-xs"
              title={
                hasEngageButtonCards
                  ? "Clear EngageButton cards first"
                  : undefined
              }
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Load Posts
            </Button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Target:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={targetDraftCount}
              onChange={(e) =>
                setTargetDraftCount(
                  Math.min(100, Math.max(1, parseInt(e.target.value) || 1)),
                )
              }
              className="border-input bg-background h-6 w-12 rounded border px-1 text-center text-xs"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Row 3: Stats + Actions (only when cards exist) */}
        {cardIds.length > 0 && (
          <div className="flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              {isLoading && isUserEditing && (
                <span
                  className="flex items-center gap-1 text-amber-600"
                  title="Click outside edit box to continue"
                >
                  <Edit3 className="h-3 w-3" />
                  editing
                </span>
              )}
              {generatingCount > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {generatingCount} generating
                </span>
              )}
              <span>{draftCount} drafts</span>
              {sentCount > 0 && (
                <span className="text-green-600">{sentCount} sent</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Clear All */}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-6 px-2 text-xs"
                onClick={clearAllCards}
                title="Clear all cards and reset"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear All
              </Button>
              {/* Submit All - disabled when EngageButton cards exist (use individual submit) */}
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleSubmitAll}
                disabled={
                  isSubmitting ||
                  isAnyGenerating ||
                  draftCount === 0 ||
                  hasEngageButtonCards
                }
                title={
                  hasEngageButtonCards
                    ? "Use individual submit for EngageButton cards"
                    : undefined
                }
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3 w-3" />
                )}
                {isSubmitting ? "Submitting..." : "Submit All"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {cardIds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <Feather className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No comments yet</p>
          <p className="text-muted-foreground text-xs">
            Click "Load Posts" or use the EngageKit button on any post
          </p>
        </div>
      )}

      {/* Compose Cards List */}
      {cardIds.length > 0 && (
        <div className="flex flex-col gap-3">
          {cardIds.map((cardId) => {
            const isSinglePost = singlePostCardIds.includes(cardId);
            // Auto-focus the first single-post card (manual card) for quick typing
            const isFirstManualCard =
              isSinglePost && singlePostCardIds[0] === cardId;
            return (
              <ComposeCard
                key={cardId}
                cardId={cardId}
                isSinglePostCard={isSinglePost}
                autoFocus={isFirstManualCard}
              />
            );
          })}
        </div>
      )}
      {/* Post Preview Sheet - positioned at sidebar's left edge, clips content as it slides */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-[-1] w-[600px] -translate-x-full overflow-hidden">
        <PostPreviewSheet />
      </div>

      {/* Settings Sheet - positioned at sidebar's left edge */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-[400px] -translate-x-full overflow-hidden">
        <SettingsSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
