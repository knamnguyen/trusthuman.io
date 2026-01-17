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
import type { AdjacentCommentInfo } from "@sassy/linkedin-automation/post/types";
import { collectPostsBatch } from "@sassy/linkedin-automation/feed/collect-posts";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import type { PostLoadSettings } from "../../stores/target-list-queue";
import type { ComposeCard } from "../../stores/compose-store";
import { useComposeStore } from "../../stores/compose-store";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { DEFAULT_STYLE_GUIDE } from "../../utils";
import { isAuthorBlacklisted } from "./is-author-blacklisted";

// Lazily initialized
let _postUtils: ReturnType<typeof createPostUtilities> | null = null;
function getPostUtils() {
  if (!_postUtils) _postUtils = createPostUtilities();
  return _postUtils;
}

/**
 * Parameters for loadPostsToCards
 */
export interface LoadPostsToCardsParams {
  /** Target number of posts to collect */
  targetCount: number;
  /** Post load settings (filters) */
  postLoadSettings: PostLoadSettings | null;
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
  /** Mutation function to generate AI comment */
  generateCommentMutate: (params: {
    postContent: string;
    styleGuide: string;
    adjacentComments: AdjacentCommentInfo[];
  }) => Promise<{ comment: string }>;
  /** Callback when progress updates (posts loaded so far) */
  onProgress: (count: number) => void;
  /** Callback to set the first card as preview */
  setPreviewingCard: (cardId: string) => void;
  /** Profile URLs from the blacklist (for filtering) */
  blacklistProfileUrls?: string[];
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
    existingUrns,
    isUrnIgnored,
    shouldStop,
    addCard,
    updateCardComment,
    generateCommentMutate,
    onProgress,
    setPreviewingCard,
    blacklistProfileUrls = [],
  } = params;

  // Get settings snapshots
  const isHumanMode = useSettingsLocalStore.getState().behavior.humanOnlyMode;
  const generateSettings = useSettingsDBStore.getState().commentGenerate;

  // Log blacklist status
  if (blacklistProfileUrls.length > 0) {
    console.log(
      `[loadPostsToCards] Blacklist active with ${blacklistProfileUrls.length} profiles`,
    );
  }

  let loadedCount = 0;

  // Batch callback - called when each batch of posts is ready
  // NOTE: Blacklist filtering happens in collectPostsBatch, so all posts here are valid
  const onBatchReady = (posts: ReadyPost[]) => {
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
        postUrls: post.postUrls,
        comments: post.comments,
      });

      // Only fire AI generation in AI mode
      if (!isHumanMode) {
        const postUtils = getPostUtils();
        // Extract adjacent comments for AI context (only if enabled)
        const adjacentComments = generateSettings?.adjacentCommentsEnabled
          ? postUtils.extractAdjacentComments(post.postContainer)
          : [];

        // Fire AI request (don't await - run in parallel)
        generateCommentMutate({
          postContent: post.fullCaption,
          styleGuide: DEFAULT_STYLE_GUIDE,
          adjacentComments,
        })
          .then((result) => {
            updateCardComment(cardId, result.comment);
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
