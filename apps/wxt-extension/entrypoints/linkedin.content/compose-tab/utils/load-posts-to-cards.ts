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

import type { ReadyPost } from "@sassy/linkedin-automation/feed/collect-posts";
import type { PostFilterConfig } from "@sassy/linkedin-automation/feed/collect-posts";
import { collectPostsBatch } from "@sassy/linkedin-automation/feed/collect-posts";

import type { PostLoadSettings } from "../../stores/target-list-queue";
import type { ComposeCard } from "../../stores/compose-store";
import { useComposeStore } from "../../stores/compose-store";
import { getCachedBlacklist, prefetchBlacklist } from "../../stores/blacklist-cache";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { isAuthorBlacklisted } from "./is-author-blacklisted";
import { generateSingleComment, type CommentGenerateSettingsSnapshot } from "./generate-ai-comments";

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
  /** Callback when progress updates (posts loaded so far) */
  onProgress: (count: number) => void;
  /** Callback to set the first card as preview */
  setPreviewingCard: (cardId: string) => void;
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
  const {
    targetCount,
    postLoadSettings,
    commentGenerateSettings,
    existingUrns,
    isUrnIgnored,
    shouldStop,
    addCard,
    updateCardComment,
    updateCardStyleInfo,
    onProgress,
    setPreviewingCard,
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

  // Batch callback - called when each batch of posts is ready
  // NOTE: Blacklist filtering happens in collectPostsBatch, so all posts here are valid
  const onBatchReady = async (posts: ReadyPost[]) => {
    console.log(
      `[loadPostsToCards] Batch received: ${posts.length} posts (humanMode: ${isHumanMode})`,
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
        generateSingleComment({
          postContent: post.fullCaption,
          postContainer: post.postContainer,
          settingsOverride: commentGenerateSettings,
        })
          .then((result) => {
            console.log("[loadPostsToCards] AI result for card", cardId.slice(0, 8), {
              commentLength: result.comment?.length,
              styleId: result.styleId,
              styleSnapshotName: result.styleSnapshot?.name,
              hasStyleSnapshot: !!result.styleSnapshot,
            });
            updateCardComment(cardId, result.comment);
            updateCardStyleInfo(cardId, {
              commentStyleId: result.styleId,
              styleSnapshot: result.styleSnapshot,
            });
          })
          .catch((err) => {
            console.error(
              "[loadPostsToCards] Error generating comment for card",
              cardId,
              err,
            );
            updateCardComment(cardId, "");
          });
      }
    }

    // Update progress for the whole batch
    loadedCount += posts.length;
    onProgress(loadedCount);

    // Set first card as preview
    if (firstCardId) {
      setPreviewingCard(firstCardId);
    }
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

  // Log summary
  console.log(`[loadPostsToCards] ✅ Complete: ${loadedCount} posts loaded`);

  return loadedCount;
}
