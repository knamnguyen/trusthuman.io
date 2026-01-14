/**
 * Save Comment to DB Helper
 *
 * Shared helper to save successfully submitted comments to the database.
 * Called from ComposeTab, ComposeCard, and PostPreviewSheet after successful submission.
 */

import type { ComposeCard } from "../stores/compose-store";
import { getTrpcClient } from "../../../lib/trpc/client";

/**
 * Save a successfully submitted comment to the database.
 * Fire-and-forget - we don't block on this completing.
 *
 * @param card - The ComposeCard that was submitted
 */
export async function saveCommentToDb(card: ComposeCard): Promise<void> {
  try {
    const trpc = getTrpcClient();

    await trpc.comment.saveSubmitted.mutate({
      postUrn: card.urn,
      postFullCaption: card.fullCaption,
      postCaptionPreview: card.captionPreview,
      comment: card.commentText,
      originalAiComment: card.originalCommentText || undefined,
      postAlternateUrns: card.postUrls.map((p) => p.urn),
      adjacentComments: card.comments.map((c) => ({
        authorName: c.authorName,
        content: c.content,
      })),
      authorName: card.authorInfo?.name ?? null,
      authorProfileUrl: card.authorInfo?.profileUrl ?? null,
      authorAvatarUrl: card.authorInfo?.photoUrl ?? null,
      authorHeadline: card.authorInfo?.headline ?? null,
    });

    console.log("EngageKit: Comment saved to DB", card.urn);
  } catch (error) {
    // Log but don't throw - we don't want to block the UI flow
    console.error("EngageKit: Failed to save comment to DB", error);
  }
}
