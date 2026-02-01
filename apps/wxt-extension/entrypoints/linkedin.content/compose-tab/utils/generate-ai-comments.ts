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

import { deferAsync } from "@/lib/commons";
import { QueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";

import type { AdjacentCommentInfo } from "@sassy/linkedin-automation/post/types";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import type { CommentGenerateSettings } from "../../stores/target-list-queue";
import { getTrpcClient, useTRPC } from "../../../../lib/trpc/client";
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

    if (results.status === "error") {
      return results;
    }

    const result = results.data[0];
    if (!result) {
      const error = new Error(
        "[generateSingleComment] No result returned from generateDynamic",
      );
      posthog.captureException(error, {
        extra: {
          postContent,
          adjacentCommentsCount: mappedAdjacentComments.length,
        },
      });
      throw error;
    }

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

    if (result.status === "error") {
      return result;
    }

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
      status: "success",
      comment: result.comment,
      styleId: styleConfig.styleId,
      styleSnapshot,
    } as const;
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
) {
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

    if (results.status === "error") {
      return results;
    }

    // Map server results to our format
    return {
      status: "success",
      data: results.data.map((result) => ({
        comment: result.comment,
        styleId: result.styleId,
        styleSnapshot: result.styleSnapshot,
      })),
      fails: [],
    } as const;
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
    const promises = Array.from({ length: count }, () =>
      trpcClient.aiComments.generateComment.mutate(baseRequestParams),
    );

    const results = await Promise.all(promises);

    const fails = [];
    const successes = [];

    for (const result of results) {
      if (result.status === "error") {
        fails.push(result);
      } else {
        successes.push({
          comment: result.comment,
          styleId: styleConfig.styleId,
          styleSnapshot,
        });
      }
    }

    return {
      status: "success",
      data: successes,
      fails,
    } as const;
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
    queryClient: QueryClient;
    trpc: ReturnType<typeof useTRPC>;
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
    onError?: (
      result: // extract fail result types from generateMultipleComments
      // we have 2 cases of fails, one is the overall error
      | Extract<
            Awaited<ReturnType<typeof generateMultipleComments>>,
            { status: "error" }
          >
        // the other is per-item fail for static mode batch generations
        | Extract<
            Awaited<ReturnType<typeof generateMultipleComments>>,
            { status: "success" }
          >["fails"][number],
    ) => void;
  },
): Promise<void> {
  const {
    cardIds,
    updateCardComment,
    updateCardStyleInfo,
    queryClient,
    trpc,
    ...generateParams
  } = params;

  if (cardIds.length !== generateParams.count) {
    console.error(
      `[generateAndUpdateCards] cardIds length (${cardIds.length}) doesn't match count (${generateParams.count})`,
    );
  }

  await using _ = deferAsync(async () => {
    await queryClient.refetchQueries(trpc.aiComments.quota.queryOptions());
  });

  try {
    const results = await generateMultipleComments(generateParams);

    if (results.status === "error") {
      params.onError?.(results);
      return;
    }

    // Map results to cards
    results.data.forEach((result, index) => {
      const cardId = cardIds[index];
      if (cardId) {
        updateCardComment(cardId, result.comment);
        updateCardStyleInfo(cardId, {
          commentStyleId: result.styleId,
          styleSnapshot: result.styleSnapshot,
        });
      }
    });

    const firstFail = results.fails[0];

    if (firstFail !== undefined) {
      console.warn(
        `[generateAndUpdateCards] Some comment generations failed: ${results.fails.length}`,
        results.fails,
      );
      params.onError?.(firstFail);
    }
  } catch (err) {
    console.error("[generateAndUpdateCards] Error generating comments:", err);
    // Set empty comments on error so isGenerating becomes false
    cardIds.forEach((cardId) => {
      updateCardComment(cardId, "");
    });
  }
}
