import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
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

import type { ReadyPost } from "@sassy/linkedin-automation/feed/collect-posts";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { collectPostsBatch } from "@sassy/linkedin-automation/feed/collect-posts";
import { buildListFeedUrl } from "@sassy/linkedin-automation/navigate/build-list-feed-url";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { Button } from "@sassy/ui/button";

import { useTRPC } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import {
  consumePendingNavigation,
  savePendingNavigation,
} from "../stores/navigation-state";
import { useSettingsStore } from "../stores/settings-store";
import { DEFAULT_STYLE_GUIDE } from "../utils";
import { ComposeCard } from "./ComposeCard";
import { PostPreviewSheet } from "./PostPreviewSheet";
import { saveCommentToDb } from "./save-comment-to-db";
import { SettingsSheet } from "./SettingsSheet";
import { SettingsTags } from "./SettingsTags";

// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();

export function ComposeTab() {
  // DEBUG: Track renders
  console.log("[ComposeTab] Render");

  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** Target number of drafts to collect (user configurable, max 100) */
  const [targetDraftCount, setTargetDraftCount] = useState<number>(10);
  /** Live progress counter during loading */
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  /** Ref to signal stop request to the streaming loop */
  const stopRequestedRef = useRef(false);

  // Subscribe to isUserEditing for paused indicator
  const isUserEditing = useComposeStore((state) => state.isUserEditing);
  // Subscribe to isEngageButtonGenerating for conflict handling
  const isEngageButtonGenerating = useComposeStore(
    (state) => state.isEngageButtonGenerating,
  );
  const clearAllCards = useComposeStore((state) => state.clearAllCards);

  const trpc = useTRPC();
  const generateComment = useMutation(
    trpc.aiComments.generateComment.mutationOptions(),
  );

  // Use separate subscriptions for different concerns to minimize re-renders
  // Card IDs for rendering the list - only changes when cards are added/removed
  const cardIds = useComposeStore(
    useShallow((state) => {
      console.log(
        "[ComposeTab] cardIds selector called, count:",
        state.cards.length,
      );
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
  // Ref to store pending targetDraftCount for auto-resume
  const pendingTargetCountRef = useRef<number | null>(null);

  // Check for pending navigation on mount (auto-resume after target list redirect)
  useEffect(() => {
    if (checkedPendingNavRef.current) return;
    checkedPendingNavRef.current = true;

    console.log("[EngageKit] Checking for pending navigation...");
    console.log("[EngageKit] Current URL:", window.location.href);

    const checkAndResume = async () => {
      const pending = await consumePendingNavigation();
      console.log("[EngageKit] Pending navigation result:", pending);
      if (!pending) return;

      console.log("[EngageKit] Resuming from target list navigation");

      // Restore settings
      const { postLoadSettings, targetDraftCount: savedCount } = pending;
      const updatePostLoad = useSettingsStore.getState().updatePostLoad;

      // Restore all postLoad settings
      Object.entries(postLoadSettings).forEach(([key, value]) => {
        updatePostLoad(
          key as keyof typeof postLoadSettings,
          value as (typeof postLoadSettings)[keyof typeof postLoadSettings],
        );
      });

      // Store the target count for the follow-up effect to use
      pendingTargetCountRef.current = savedCount;

      // Restore target draft count - triggers re-render with new value
      setTargetDraftCount(savedCount);
    };

    void checkAndResume();
  }, []);

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

    // Get post load settings (snapshot at start time)
    const postLoadSettings = useSettingsStore.getState().postLoad;

    // If target list is enabled with URNs, navigate to the filtered feed first
    // Only navigate if we're not already on a search/content page
    const isOnSearchPage = window.location.pathname.startsWith(
      "/search/results/content",
    );

    if (
      postLoadSettings.targetListEnabled &&
      postLoadSettings.selectedTargetListUrns.length > 0 &&
      !isOnSearchPage
    ) {
      const feedUrl = buildListFeedUrl(postLoadSettings.selectedTargetListUrns);
      console.log(
        `[EngageKit] Target list URNs:`,
        postLoadSettings.selectedTargetListUrns,
      );
      console.log(`[EngageKit] Navigating to:`, feedUrl);
      console.log(`[EngageKit] Current location before:`, window.location.href);

      // Save state before navigation so we can auto-resume after reload
      try {
        await savePendingNavigation(postLoadSettings, targetDraftCount);
        console.log(`[EngageKit] State saved successfully`);
      } catch (err) {
        console.error(`[EngageKit] Failed to save state:`, err);
      }

      // Full page navigation required - LinkedIn's SPA router doesn't handle search URLs
      console.log(`[EngageKit] About to set window.location.href`);
      window.location.href = feedUrl;
      console.log(`[EngageKit] window.location.href set to:`, window.location.href);
      return; // Stop here - page will reload, auto-resume will trigger
    }

    // Get current cards to find existing URNs (snapshot at start time)
    const existingUrns = new Set(getCards.map((card) => card.urn));

    // Check settings at start time (snapshot for this collection session)
    const isHumanMode = useSettingsStore.getState().behavior.humanOnlyMode;
    const generateSettings = useSettingsStore.getState().commentGenerate;

    // Batch callback - called when each batch of posts is ready
    const onBatchReady = (posts: ReadyPost[]) => {
      console.log(
        `[EngageKit] Batch received: ${posts.length} posts (humanMode: ${isHumanMode})`,
      );

      // Check if no card is being previewed yet - we'll set first card as preview
      const needsFirstPreview =
        useComposeStore.getState().previewingCardId === null;
      let firstCardId: string | null = null;

      // Process all posts in the batch
      for (const post of posts) {
        const cardId = crypto.randomUUID();

        // Track first card ID for setting preview
        if (needsFirstPreview && !firstCardId) {
          firstCardId = cardId;
        }

        // Add card - generating state depends on mode
        addCard({
          id: cardId,
          urn: post.urn,
          captionPreview: post.captionPreview,
          fullCaption: post.fullCaption,
          commentText: "", // Empty - user writes in human mode, AI fills in AI mode
          originalCommentText: "",
          postContainer: post.postContainer,
          status: "draft",
          isGenerating: !isHumanMode, // Not generating in human mode
          authorInfo: post.authorInfo,
          postTime: post.postTime,
          postUrls: post.postUrls,
          comments: post.comments,
        });

        // Only fire AI generation in AI mode
        if (!isHumanMode) {
          // Extract adjacent comments for AI context (only if enabled)
          const adjacentComments = generateSettings.adjacentCommentsEnabled
            ? postUtils.extractAdjacentComments(post.postContainer)
            : [];

          // Fire AI request (don't await - run in parallel)
          generateComment
            .mutateAsync({
              postContent: post.fullCaption,
              styleGuide: DEFAULT_STYLE_GUIDE,
              adjacentComments,
            })
            .then((result) => {
              updateCardComment(cardId, result.comment);
            })
            .catch((err) => {
              console.error(
                "EngageKit: error generating comment for card",
                cardId,
                err,
              );
              updateCardComment(cardId, "");
            });
        }
      }

      // Update progress for the whole batch
      setLoadingProgress((prev) => prev + posts.length);

      // Set first card as preview (panel already open from isCollecting)
      if (firstCardId) {
        setPreviewingCard(firstCardId);
      }
    };

    // Run batch collection with filter config
    await collectPostsBatch(
      targetDraftCount,
      existingUrns,
      isUrnIgnored,
      onBatchReady,
      () => stopRequestedRef.current,
      () => useComposeStore.getState().isUserEditing,
      {
        timeFilterEnabled: postLoadSettings.timeFilterEnabled,
        minPostAge: postLoadSettings.minPostAge,
        skipPromotedPosts: postLoadSettings.skipPromotedPostsEnabled,
        skipCompanyPages: postLoadSettings.skipCompanyPagesEnabled,
        skipFriendActivities: postLoadSettings.skipFriendActivitiesEnabled,
        skipFirstDegree: postLoadSettings.skipFirstDegree,
        skipSecondDegree: postLoadSettings.skipSecondDegree,
        skipThirdDegree: postLoadSettings.skipThirdDegree,
        skipFollowing: postLoadSettings.skipFollowing,
      },
    );

    setIsLoading(false);
    setIsCollecting(false); // Done collecting, stop refocusing on blur
  }, [
    addCard,
    getCards,
    generateComment,
    isUrnIgnored,
    setIsCollecting,
    setPreviewingCard,
    targetDraftCount,
    updateCardComment,
  ]);

  // Follow-up effect: auto-start after targetDraftCount is updated from pending navigation
  useEffect(() => {
    if (pendingTargetCountRef.current === null) return;
    if (targetDraftCount !== pendingTargetCountRef.current) return;

    // Clear the pending flag
    pendingTargetCountRef.current = null;

    // Wait for LinkedIn page to fully load, then auto-start
    const timer = setTimeout(() => {
      console.log("[EngageKit] Auto-triggering Load Posts after navigation");
      handleStart();
    }, 2000);

    return () => clearTimeout(timer);
  }, [targetDraftCount, handleStart]);

  /**
   * Stop the batch collection
   */
  const handleStop = useCallback(() => {
    stopRequestedRef.current = true;
    setIsCollecting(false); // Stop refocusing immediately when user stops
  }, [setIsCollecting]);

  /**
   * Submit all draft comments to LinkedIn
   * Goes through each card from top to bottom:
   * 1. Waits for editable field to appear
   * 2. Inserts the comment text
   * 3. Tags post author if enabled
   * 4. Attaches image if enabled
   * 5. Clicks submit button and verifies
   * 6. Likes post if enabled
   * 7. Likes own comment if enabled
   * 8. Marks card as "sent"
   */
  const handleSubmitAll = useCallback(async () => {
    // Only submit cards that are drafts AND have finished generating
    const cardsToSubmit = getCards.filter(
      (c) => c.status === "draft" && !c.isGenerating,
    );
    if (cardsToSubmit.length === 0) return;

    // Get submit settings
    const submitSettings = useSettingsStore.getState().submitComment;
    const [minDelay = 5, maxDelay = 20] = submitSettings.submitDelayRange
      .split("-")
      .map(Number);

    setIsSubmitting(true);

    for (const card of cardsToSubmit) {
      // Skip empty comments
      if (!card.commentText.trim()) {
        continue;
      }

      // 1. Wait for editable field (poll until found, max 3s)
      let editableField: HTMLElement | null = null;
      const startTime = Date.now();
      while (Date.now() - startTime < 3000) {
        editableField = commentUtils.findEditableField(card.postContainer);
        if (editableField) break;
        await new Promise((r) => setTimeout(r, 100));
      }

      if (!editableField) {
        console.warn("EngageKit: Editable field not found for card", card.id);
        continue;
      }

      // 2. Insert comment text
      editableField.focus();
      await commentUtils.insertComment(editableField, card.commentText);
      await new Promise((r) => setTimeout(r, 300));

      // 3. Tag author if enabled (adds mention at end)
      if (submitSettings.tagPostAuthorEnabled) {
        await commentUtils.tagPostAuthor(card.postContainer);
        await new Promise((r) => setTimeout(r, 300));
      }

      // 4. Attach image if enabled
      if (submitSettings.attachPictureEnabled) {
        // Get random image from comment-image-store
        const { useCommentImageStore } = await import(
          "../stores/comment-image-store"
        );
        const imageUrl = useCommentImageStore.getState().getRandomImage();
        if (imageUrl) {
          await commentUtils.attachImageToComment(card.postContainer, imageUrl);
          await new Promise((r) => setTimeout(r, 500)); // Wait for upload
        }
      }

      // 5. Submit comment (click button + verify)
      const success = await commentUtils.submitComment(card.postContainer);

      if (success) {
        // 6. Like post if enabled
        if (submitSettings.likePostEnabled) {
          await commentUtils.likePost(card.postContainer);
          await new Promise((r) => setTimeout(r, 300));
        }

        // 7. Like own comment if enabled
        if (submitSettings.likeCommentEnabled) {
          await new Promise((r) => setTimeout(r, 500)); // Wait for comment to appear
          await commentUtils.likeOwnComment(card.postContainer);
        }

        // Mark as sent
        updateCardStatus(card.id, "sent");

        // 8. Save to database (fire-and-forget)
        void saveCommentToDb(card);
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
          <div className="flex items-center gap-2">
            <Feather className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">Compose</span>
          </div>
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
