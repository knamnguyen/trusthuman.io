/**
 * Load Posts to Cards Utility
 *
 * Handles the full flow of:
 * 1. Calling collectPostsBatch to collect posts from the feed
 * 2. Creating compose cards for each post
 * 3. Triggering AI comment generation (if not in human mode)
 *
 * Extracted from ComposeTab to reduce duplication between handleStart and runAutoResume.
 */

import type {
  PostFilterConfig,
  ReadyPost,
} from "@sassy/linkedin-automation/feed/collect-posts";
import { collectPostsBatch } from "@sassy/linkedin-automation/feed/collect-posts";

import type { ComposeCard } from "../../stores/compose-store";
import type { PostLoadSettings } from "../../stores/target-list-queue";
import type { CommentGenerateSettingsSnapshot } from "./generate-ai-comments";
import {
  getCachedBlacklist,
  prefetchBlacklist,
} from "../../stores/blacklist-cache";
import { useComposeStore } from "../../stores/compose-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { generateSingleComment } from "./generate-ai-comments";
import { isAuthorBlacklisted } from "./is-author-blacklisted";

/**
 * Parameters for loadPostsToCards
 */
export interface LoadPostsToCardsParams {
  /** Target number of posts to collect */
  targetCount: number;
  /** Post load settings (filters) */
  postLoadSettings: PostLoadSettings | null;
  /** Comment generation settings snapshot (for auto-resume with snapshotted settings) */
  commentGenerateSettings?: CommentGenerateSettingsSnapshot;
  /** Existing URNs to skip (already in store) */
  existingUrns: Set<string>;
  /** Function to check if a URN is ignored (manually dismissed) */
  isUrnIgnored: (urn: string) => boolean;
  /** Function that returns true when collection should stop */
  shouldStop: () => boolean;
  /** Function to add a card to the store */
  addCard: (card: ComposeCard) => void;
  /** Function to add multiple cards at once (batch operation) */
  addBatchCards: (cards: ComposeCard[]) => void;
  /** Function to update a card's comment text */
  updateCardComment: (cardId: string, commentText: string) => void;
  /** Function to update a card's style info */
  updateCardStyleInfo: (
    cardId: string,
    styleInfo: {
      commentStyleId: string | null;
      styleSnapshot: {
        name: string | null;
        content: string;
        maxWords: number;
        creativity: number;
      } | null;
    },
  ) => void;
  /** Function to update a card's comment and style in one operation (batch operation) */
  updateBatchCardCommentAndStyle: (
    cardId: string,
    comment: string,
    styleInfo: {
      commentStyleId: string | null;
      styleSnapshot: {
        name: string | null;
        content: string;
        maxWords: number;
        creativity: number;
      } | null;
    },
  ) => void;
  /** Callback when progress updates (posts loaded so far) */
  onProgress: (count: number) => void;
  /** Optional callback invoked after ALL AI generation completes (fires with metadata) */
  onGenerationComplete?: (metadata: {
    targetCount: number;
    loadedCount: number;
    generatedCount: number;
  }) => void | Promise<void>;
}

/**
 * Build PostFilterConfig from PostLoadSettings
 * Maps the DB setting names to the collectPostsBatch parameter names
 */
export function buildFilterConfig(
  settings: PostLoadSettings | null,
): PostFilterConfig {
  return {
    timeFilterEnabled: settings?.timeFilterEnabled ?? false,
    minPostAge: settings?.minPostAge ?? null,
    skipPromotedPosts: settings?.skipPromotedPostsEnabled ?? true,
    skipCompanyPages: settings?.skipCompanyPagesEnabled ?? true,
    skipFriendActivities: settings?.skipFriendActivitiesEnabled ?? false,
    skipFirstDegree: settings?.skipFirstDegree ?? false,
    skipSecondDegree: settings?.skipSecondDegree ?? false,
    skipThirdDegree: settings?.skipThirdDegree ?? false,
    skipFollowing: settings?.skipFollowing ?? false,
    skipCommentsLoading: settings?.skipCommentsLoading ?? false,
  };
}

/**
 * Load posts from the feed and create compose cards
 *
 * This is the core "Load Posts" flow extracted from ComposeTab.
 * Used by both handleStart (manual trigger) and runAutoResume (navigation trigger).
 *
 * @returns Number of posts loaded
 */
export async function loadPostsToCards(
  params: LoadPostsToCardsParams,
): Promise<number> {
  console.time(`⏱️ [loadPostsToCards] TOTAL (target: ${params.targetCount} posts)`);
  const {
    targetCount,
    postLoadSettings,
    commentGenerateSettings,
    existingUrns,
    isUrnIgnored,
    shouldStop,
    addCard,
    addBatchCards,
    updateCardComment,
    updateCardStyleInfo,
    updateBatchCardCommentAndStyle,
    onProgress,
    onGenerationComplete,
  } = params;

  // Get settings snapshots
  const isHumanMode = useSettingsLocalStore.getState().behavior.humanOnlyMode;

  // Debug: Log all postLoadSettings to see what's being passed
  console.log("[loadPostsToCards] postLoadSettings:", {
    targetListEnabled: postLoadSettings?.targetListEnabled,
    targetListIds: postLoadSettings?.targetListIds,
    skipBlacklistEnabled: postLoadSettings?.skipBlacklistEnabled,
    blacklistId: postLoadSettings?.blacklistId,
    timeFilterEnabled: postLoadSettings?.timeFilterEnabled,
    minPostAge: postLoadSettings?.minPostAge,
    skipCompanyPagesEnabled: postLoadSettings?.skipCompanyPagesEnabled,
    skipPromotedPostsEnabled: postLoadSettings?.skipPromotedPostsEnabled,
    skipFriendActivitiesEnabled: postLoadSettings?.skipFriendActivitiesEnabled,
    skipFirstDegree: postLoadSettings?.skipFirstDegree,
    skipSecondDegree: postLoadSettings?.skipSecondDegree,
    skipThirdDegree: postLoadSettings?.skipThirdDegree,
    skipFollowing: postLoadSettings?.skipFollowing,
  });

  // === BLACKLIST SETUP ===
  // Get blacklist profile URLs from cache (if enabled and configured)
  let blacklistProfileUrls: string[] = [];
  if (postLoadSettings?.skipBlacklistEnabled && postLoadSettings?.blacklistId) {
    // Try to get from cache first (should be pre-fetched when settings loaded)
    const cached = getCachedBlacklist(postLoadSettings.blacklistId);
    if (cached) {
      blacklistProfileUrls = cached.profileUrls;
      console.log(
        `[loadPostsToCards] Blacklist loaded from cache (${blacklistProfileUrls.length} profiles from "${cached.listName}")`,
      );
    } else {
      // Cache miss - fetch now (shouldn't happen if prefetch worked)
      console.log("[loadPostsToCards] Blacklist cache miss, fetching now...");
      await prefetchBlacklist(postLoadSettings.blacklistId);
      const freshCached = getCachedBlacklist(postLoadSettings.blacklistId);
      if (freshCached) {
        blacklistProfileUrls = freshCached.profileUrls;
        console.log(
          `[loadPostsToCards] Blacklist fetched (${blacklistProfileUrls.length} profiles)`,
        );
      }
    }
  }

  // Log blacklist status
  if (blacklistProfileUrls.length > 0) {
    console.log(
      `[loadPostsToCards] Blacklist active with ${blacklistProfileUrls.length} profiles`,
    );
  }

  let loadedCount = 0;

  // === AI UPDATE BATCHING ===
  // Buffer to collect AI results for batch updates (reduces state updates by ~60%)
  const aiUpdateBuffer: Array<{
    cardId: string;
    comment: string;
    styleInfo: {
      commentStyleId: string | null;
      styleSnapshot: {
        name: string | null;
        content: string;
        maxWords: number;
        creativity: number;
      } | null;
    };
  }> = [];
  let flushTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Track all AI generation promises so we can wait for them to complete
  const aiPromises: Promise<void>[] = [];

  // Flush buffer and update all cards at once
  const flushAIUpdates = () => {
    if (aiUpdateBuffer.length === 0) return;

    console.log(
      `[loadPostsToCards] 🔥 Flushing ${aiUpdateBuffer.length} AI updates`,
    );

    // Update all cards in ONE state update
    console.time(`⏱️ [loadPostsToCards] updateManyCardsCommentAndStyle (${aiUpdateBuffer.length} cards)`);
    useComposeStore.getState().updateManyCardsCommentAndStyle(aiUpdateBuffer);
    console.timeEnd(`⏱️ [loadPostsToCards] updateManyCardsCommentAndStyle (${aiUpdateBuffer.length} cards)`);

    // Clear buffer
    aiUpdateBuffer.length = 0;
    flushTimeoutId = null;
  };

  // Schedule flush if not already scheduled
  const scheduleFlush = () => {
    if (flushTimeoutId !== null) {
      console.log("[loadPostsToCards] ⏭️ Flush already scheduled, skipping");
      return; // Already scheduled
    }

    console.log(`[loadPostsToCards] ⏰ Scheduling flush (buffer has ${aiUpdateBuffer.length} items)`);
    flushTimeoutId = setTimeout(() => {
      flushAIUpdates();
    }, 100); // Flush every 100ms
  };

  // Batch callback - called when each batch of posts is ready
  // NOTE: Blacklist filtering happens in collectPostsBatch, so all posts here are valid
  const onBatchReady = async (posts: ReadyPost[]) => {
    console.time(`⏱️ [loadPostsToCards] onBatchReady total (${posts.length} posts)`);
    console.log(
      `[loadPostsToCards] Batch received: ${posts.length} posts (humanMode: ${isHumanMode})`,
    );

    // Build array of all cards first (no state updates yet)
    console.time(`⏱️ [loadPostsToCards] Build card objects (${posts.length} posts)`);
    const cardsToAdd: ComposeCard[] = [];

    // Process all posts in the batch
    for (const post of posts) {
      const cardId = crypto.randomUUID();

      // Build card object (no state update yet)
      cardsToAdd.push({
        id: cardId,
        urn: post.urn,
        captionPreview: post.captionPreview,
        fullCaption: post.fullCaption,
        commentText: "", // Empty - user writes in human mode, AI fills in AI mode
        originalCommentText: "",
        peakTouchScore: 0,
        postContainer: post.postContainer,
        status: "draft",
        isGenerating: !isHumanMode, // Not generating in human mode
        authorInfo: post.authorInfo,
        postTime: post.postTime,
        postUrls: post.postAlternateUrls,
        comments: post.comments,
        commentStyleId: null, // Will be set after AI generation
        styleSnapshot: null, // Will be set after AI generation
      });

      // Only fire AI generation in AI mode
      if (!isHumanMode) {
        // Fire AI request using shared utility (don't await - run in parallel)
        // generateSingleComment handles dynamic vs static mode internally
        // Pass settingsOverride if provided (for auto-resume with snapshotted settings)
        const aiPromise = generateSingleComment({
          postContent: post.fullCaption,
          postContainer: post.postContainer,
          settingsOverride: commentGenerateSettings,
        })
          .then((result) => {
            console.log(
              "[loadPostsToCards] AI result for card",
              cardId.slice(0, 8),
              {
                commentLength: result.comment?.length,
                styleId: result.styleId,
                styleSnapshotName: result.styleSnapshot?.name,
                hasStyleSnapshot: !!result.styleSnapshot,
              },
            );
            // Add to buffer instead of updating immediately
            aiUpdateBuffer.push({
              cardId,
              comment: result.comment,
              styleInfo: {
                commentStyleId: result.styleId,
                styleSnapshot: result.styleSnapshot,
              },
            });
            // Schedule flush (will batch with other results arriving within 100ms)
            scheduleFlush();
          })
          .catch((err) => {
            console.error(
              "[loadPostsToCards] Error generating comment for card",
              cardId,
              err,
            );
            // Add error case to buffer too
            aiUpdateBuffer.push({
              cardId,
              comment: "",
              styleInfo: {
                commentStyleId: null,
                styleSnapshot: null,
              },
            });
            scheduleFlush();
          });

        // Track this promise so we can wait for all AI generation to complete
        aiPromises.push(aiPromise);
      }
    }
    console.timeEnd(`⏱️ [loadPostsToCards] Build card objects (${posts.length} posts)`);

    // Add ALL cards at once - SINGLE state update for entire batch
    console.time(`⏱️ [loadPostsToCards] addBatchCards (${cardsToAdd.length} cards)`);
    addBatchCards(cardsToAdd);
    console.timeEnd(`⏱️ [loadPostsToCards] addBatchCards (${cardsToAdd.length} cards)`);

    // Update progress for the whole batch
    loadedCount += posts.length;
    onProgress(loadedCount);
    console.timeEnd(`⏱️ [loadPostsToCards] onBatchReady total (${posts.length} posts)`);
  };

  // Build filter config from settings
  const filterConfig = buildFilterConfig(postLoadSettings);

  // Build blacklist filter callback (if blacklist is active)
  // This is passed to collectPostsBatch so filtering happens DURING collection,
  // not after - ensuring we collect the full targetCount of non-blacklisted posts
  const blacklistFilter =
    blacklistProfileUrls.length > 0
      ? (authorProfileUrl: string | null | undefined) =>
          isAuthorBlacklisted(authorProfileUrl, blacklistProfileUrls)
      : undefined;

  // Run batch collection
  console.time(`⏱️ [loadPostsToCards] collectPostsBatch (${targetCount} posts)`);
  await collectPostsBatch(
    targetCount,
    existingUrns,
    isUrnIgnored,
    onBatchReady,
    shouldStop,
    () => useComposeStore.getState().isUserEditing,
    filterConfig,
    blacklistFilter,
  );
  console.timeEnd(`⏱️ [loadPostsToCards] collectPostsBatch (${targetCount} posts)`);

  // Wait for ALL AI generation promises to complete
  if (aiPromises.length > 0) {
    console.log(`[loadPostsToCards] ⏳ Waiting for ${aiPromises.length} AI generation promises to complete...`);
    console.time(`⏱️ [loadPostsToCards] Wait for all AI promises`);
    await Promise.allSettled(aiPromises);
    console.timeEnd(`⏱️ [loadPostsToCards] Wait for all AI promises`);
    console.log(`[loadPostsToCards] ✅ All AI promises resolved`);
  }

  // NOW flush any remaining AI updates (all promises have resolved and added to buffer)
  console.time(`⏱️ [loadPostsToCards] Final flush after promises`);
  if (flushTimeoutId !== null) {
    clearTimeout(flushTimeoutId);
  }
  flushAIUpdates();
  console.timeEnd(`⏱️ [loadPostsToCards] Final flush after promises`);
  console.log(`[loadPostsToCards] ✅ All cards updated with AI comments`);

  // Notify caller that generation is complete (fires AFTER promises resolve AND buffer flushed)
  if (onGenerationComplete) {
    const generatedCount = useComposeStore.getState().cards.filter(
      (c) => c.status === "draft" && !c.isGenerating && c.commentText.trim() !== ""
    ).length;

    console.log("[loadPostsToCards] 🔔 Invoking onGenerationComplete callback", {
      targetCount,
      loadedCount,
      generatedCount,
    });

    await onGenerationComplete({
      targetCount,
      loadedCount,
      generatedCount,
    });
  }

  // Log summary
  console.log(`[loadPostsToCards] ✅ Complete: ${loadedCount} posts loaded`);
  console.timeEnd(`⏱️ [loadPostsToCards] TOTAL (target: ${targetCount} posts)`);

  return loadedCount;
}
