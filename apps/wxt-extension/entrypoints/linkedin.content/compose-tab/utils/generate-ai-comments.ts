/**
 * Shared utility for generating AI comments.
 *
 * Handles the branching logic between:
 * - Dynamic mode: AI selects styles, calls generateDynamic
 * - Static mode: Uses selected default style, calls generateComment
 *
 * Provides two levels of abstraction:
 * - generateSingleComment: Low-level, returns Promise for one comment
 * - generateAndUpdateCards: High-level, generates N comments and updates cards
 *
 * Used by:
 * - useEngageButtons (3-card flow)
 * - useAutoEngage (3-card flow)
 * - SpacebarEngageObserver (3-card flow)
 * - load-posts-to-cards (single-card flow, fire-and-forget)
 * - ComposeCard regenerate (single-card flow)
 * - PostPreviewSheet regenerate (single-card flow)
 */

import type { DynamicStyleResult } from "@sassy/api";
import type { AdjacentCommentInfo } from "@sassy/linkedin-automation/post/types";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import type { CommentGenerateSettings } from "../../stores/target-list-queue";
import { getTrpcClient } from "../../../../lib/trpc/client";
import { getCommentStyleConfig } from "../../stores/comment-style-cache";
import { useSettingsDBStore } from "../../stores/settings-db-store";

// Re-export for convenience (used by load-posts-to-cards)
export type { CommentGenerateSettings as CommentGenerateSettingsSnapshot } from "../../stores/target-list-queue";

// Lazily initialized
let _postUtils: ReturnType<typeof createPostUtilities> | null = null;
function getPostUtils() {
  if (!_postUtils) _postUtils = createPostUtilities();
  return _postUtils;
}

/**
 * Result from generating a single comment
 */
export interface GeneratedCommentResult {
  comment: string;
  styleId: string | null;
  styleSnapshot: {
    name: string | null;
    content: string;
    maxWords: number;
    creativity: number;
  } | null;
}

/**
 * Parameters for generating a single AI comment
 */
export interface GenerateSingleCommentParams {
  /** The post content to generate a comment for */
  postContent: string;
  /** The post container element (for extracting adjacent comments) */
  postContainer: HTMLElement;
  /** Optional: Previous AI comment (for regeneration context) */
  previousAiComment?: string;
  /** Optional: Human edited comment (for regeneration context) */
  humanEditedComment?: string;
  /** Optional: Settings override (for auto-resume with snapshotted settings) */
  settingsOverride?: CommentGenerateSettings;
}

/**
 * Generate a SINGLE AI comment using either dynamic or static style selection.
 *
 * This is the low-level function that:
 * - Checks dynamicChooseStyleEnabled setting
 * - Extracts adjacent comments if enabled
 * - Calls the appropriate API (generateDynamic with count:1 or generateComment)
 * - Returns the result as a Promise
 *
 * Use this for:
 * - Fire-and-forget patterns (load-posts-to-cards)
 * - Single regeneration flows
 *
 * @returns Promise resolving to the generated comment result
 */
export async function generateSingleComment(
  params: GenerateSingleCommentParams,
) {
  const {
    postContent,
    postContainer,
    previousAiComment,
    humanEditedComment,
    settingsOverride,
  } = params;

  // Get settings - use override if provided (for auto-resume), otherwise read from store
  const commentGenerateSettings =
    settingsOverride ?? useSettingsDBStore.getState().commentGenerate;
  const dynamicStyleEnabled =
    commentGenerateSettings?.dynamicChooseStyleEnabled ?? false;
  const adjacentCommentsEnabled =
    commentGenerateSettings?.adjacentCommentsEnabled ?? true;

  // Extract adjacent comments for AI context (if enabled)
  const postUtils = getPostUtils();
  const adjacentComments = adjacentCommentsEnabled
    ? postUtils.extractAdjacentComments(postContainer)
    : [];
  const mappedAdjacentComments: AdjacentCommentInfo[] = adjacentComments.map(
    (c) => ({
      commentContent: c.commentContent,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
    }),
  );

  console.log("[generateSingleComment] Settings:", {
    dynamicStyleEnabled,
    adjacentCommentsEnabled,
    adjacentCommentsCount: mappedAdjacentComments.length,
  });

  const trpcClient = getTrpcClient();

  if (dynamicStyleEnabled) {
    // Dynamic mode: AI selects style, generates 1 comment
    console.log("[generateSingleComment] Using dynamic style selection");

    const results = await trpcClient.aiComments.generateDynamic.mutate({
      postContent,
      adjacentComments:
        mappedAdjacentComments.length > 0 ? mappedAdjacentComments : undefined,
      count: 1,
    });

    const result = results[0] as DynamicStyleResult;
    console.log("[generateSingleComment] Dynamic result:", {
      commentLength: result.comment?.length,
      styleId: result.styleId,
      styleSnapshotName: result.styleSnapshot?.name,
      hasStyleSnapshot: !!result.styleSnapshot,
    });
    return {
      status: "success",
      comment: result.comment,
      styleId: result.styleId,
      styleSnapshot: result.styleSnapshot,
    } as const;
  } else {
    // Static mode: Use selected default style
    const styleConfig = await getCommentStyleConfig();
    console.log("[generateSingleComment] Using static style config:", {
      styleName: styleConfig.styleName,
      maxWords: styleConfig.maxWords,
      creativity: styleConfig.creativity,
    });

    const result = await trpcClient.aiComments.generateComment.mutate({
      postContent,
      styleGuide: styleConfig.styleGuide,
      adjacentComments:
        mappedAdjacentComments.length > 0 ? mappedAdjacentComments : undefined,
      maxWords: styleConfig.maxWords,
      creativity: styleConfig.creativity,
      previousAiComment,
      humanEditedComment,
    });

    // Build style snapshot (null if using hardcoded default)
    const styleSnapshot = styleConfig.styleId
      ? {
          name: styleConfig.styleName,
          content: styleConfig.styleGuide,
          maxWords: styleConfig.maxWords,
          creativity: styleConfig.creativity,
        }
      : null;

    return {
      comment: result.comment,
      styleId: styleConfig.styleId,
      styleSnapshot,
    };
  }
}

/**
 * Parameters for generating multiple AI comments (3-card flows)
 */
export interface GenerateMultipleCommentsParams {
  /** The post content to generate comments for */
  postContent: string;
  /** The post container element (for extracting adjacent comments) */
  postContainer: HTMLElement;
  /** Number of comments to generate (1 for single, 3 for engage flows) */
  count: 1 | 3;
}

/**
 * Generate MULTIPLE AI comments using either dynamic or static style selection.
 *
 * This is optimized for the 3-card engage flows where we want:
 * - Dynamic mode: One API call that returns 3 different style-selected comments
 * - Static mode: 3 parallel API calls with the same style (for variation)
 *
 * @returns Promise resolving to array of generated comment results
 */
export async function generateMultipleComments(
  params: GenerateMultipleCommentsParams,
): Promise<GeneratedCommentResult[]> {
  const { postContent, postContainer, count } = params;

  // Get settings
  const commentGenerateSettings = useSettingsDBStore.getState().commentGenerate;
  const dynamicStyleEnabled =
    commentGenerateSettings?.dynamicChooseStyleEnabled ?? false;
  const adjacentCommentsEnabled =
    commentGenerateSettings?.adjacentCommentsEnabled ?? true;

  // Extract adjacent comments for AI context (if enabled)
  const postUtils = getPostUtils();
  const adjacentComments = adjacentCommentsEnabled
    ? postUtils.extractAdjacentComments(postContainer)
    : [];
  const mappedAdjacentComments: AdjacentCommentInfo[] = adjacentComments.map(
    (c) => ({
      commentContent: c.commentContent,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
    }),
  );

  console.log("[generateMultipleComments] Settings:", {
    dynamicStyleEnabled,
    adjacentCommentsEnabled,
    adjacentCommentsCount: mappedAdjacentComments.length,
    count,
  });

  const trpcClient = getTrpcClient();

  if (dynamicStyleEnabled) {
    // Dynamic mode: AI selects styles, generates all comments in one call
    console.log("[generateMultipleComments] Using dynamic style selection");
    const results = await trpcClient.aiComments.generateDynamic.mutate({
      postContent,
      adjacentComments:
        mappedAdjacentComments.length > 0 ? mappedAdjacentComments : undefined,
      count,
    });

    // Map server results to our format
    return results.map((result: DynamicStyleResult) => ({
      comment: result.comment,
      styleId: result.styleId,
      styleSnapshot: result.styleSnapshot,
    }));
  } else {
    // Static mode: Use selected default style, fire N parallel requests
    const styleConfig = await getCommentStyleConfig();
    console.log("[generateMultipleComments] Using static style config:", {
      styleName: styleConfig.styleName,
      maxWords: styleConfig.maxWords,
      creativity: styleConfig.creativity,
    });

    const baseRequestParams = {
      postContent,
      styleGuide: styleConfig.styleGuide,
      adjacentComments:
        mappedAdjacentComments.length > 0 ? mappedAdjacentComments : undefined,
      maxWords: styleConfig.maxWords,
      creativity: styleConfig.creativity,
    };

    // Build style snapshot (null if using hardcoded default)
    const styleSnapshot = styleConfig.styleId
      ? {
          name: styleConfig.styleName,
          content: styleConfig.styleGuide,
          maxWords: styleConfig.maxWords,
          creativity: styleConfig.creativity,
        }
      : null;

    // Generate `count` comments in parallel
    const promises = Array.from({ length: count }, async () => {
      const result =
        await trpcClient.aiComments.generateComment.mutate(baseRequestParams);
      return {
        comment: result.comment,
        styleId: styleConfig.styleId,
        styleSnapshot,
      };
    });

    return Promise.all(promises);
  }
}

/**
 * Convenience function for generating comments and updating cards.
 *
 * Handles the common pattern of:
 * 1. Generate comments (using generateMultipleComments)
 * 2. Update each card with result
 * 3. Handle errors gracefully
 *
 * Use this for 3-card engage flows where you want to await completion.
 */
export async function generateAndUpdateCards(
  params: GenerateMultipleCommentsParams & {
    /** Card IDs to update (length should match count) */
    cardIds: string[];
    /** Callback to update card comment text */
    updateCardComment: (cardId: string, commentText: string) => void;
    /** Callback to update card style info */
    updateCardStyleInfo: (
      cardId: string,
      styleInfo: {
        commentStyleId: string | null;
        styleSnapshot: GeneratedCommentResult["styleSnapshot"];
      },
    ) => void;
  },
): Promise<void> {
  const { cardIds, updateCardComment, updateCardStyleInfo, ...generateParams } =
    params;

  if (cardIds.length !== generateParams.count) {
    console.error(
      `[generateAndUpdateCards] cardIds length (${cardIds.length}) doesn't match count (${generateParams.count})`,
    );
  }

  try {
    const results = await generateMultipleComments(generateParams);

    // Map results to cards
    results.forEach((result, index) => {
      const cardId = cardIds[index];
      if (cardId) {
        updateCardComment(cardId, result.comment);
        updateCardStyleInfo(cardId, {
          commentStyleId: result.styleId,
          styleSnapshot: result.styleSnapshot,
        });
      }
    });
  } catch (err) {
    console.error("[generateAndUpdateCards] Error generating comments:", err);
    // Set empty comments on error so isGenerating becomes false
    cardIds.forEach((cardId) => {
      updateCardComment(cardId, "");
    });
  }
}
