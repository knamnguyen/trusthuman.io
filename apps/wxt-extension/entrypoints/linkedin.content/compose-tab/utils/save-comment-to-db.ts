/**
 * Save Comment to DB Helper
 *
 * Shared helper to save successfully submitted comments to the database.
 * Called from ComposeTab, ComposeCard, and PostPreviewSheet after successful submission.
 */

import { parseTimeToHours } from "@sassy/linkedin-automation/post/utils-shared/parse-time-to-hours";

import type { ComposeCard } from "../../stores/compose-store";
import { getTrpcClient } from "../../../../lib/trpc/client";

interface SaveCommentOptions {
  /** URL of the submitted comment (from SubmitCommentResult) */
  commentUrl?: string;
}

/**
 * Save a successfully submitted comment to the database.
 * Fire-and-forget - we don't block on this completing.
 *
 * @param card - The ComposeCard that was submitted
 * @param options - Additional options including commentUrl from submission result
 */
export async function saveCommentToDb(
  card: ComposeCard,
  options?: SaveCommentOptions,
): Promise<void> {
  try {
    const trpc = getTrpcClient();

    // Convert display time (e.g., "2h", "1d") to Date
    let postCreatedAt: Date | undefined;
    if (card.postTime?.displayTime) {
      const hoursAgo = parseTimeToHours(card.postTime.displayTime);
      if (hoursAgo !== null) {
        postCreatedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      }
    }

    // Get post URL from the first postUrls entry
    const postUrl = card.postUrls[0]?.url ?? "";

    await trpc.comment.saveSubmitted.mutate({
      postUrl,
      postFullCaption: card.fullCaption,
      postCreatedAt,
      comment: card.commentText,
      commentUrl: options?.commentUrl,
      originalAiComment: card.originalCommentText || undefined,
      peakTouchScore: card.peakTouchScore,
      postAlternateUrns: card.postUrls.map((p) => p.urn),
      postComments: card.comments.map((c) => ({
        authorName: c.authorName,
        authorHeadline: c.authorHeadline,
        authorProfileUrl: c.authorProfileUrl,
        authorPhotoUrl: c.authorPhotoUrl,
        content: c.content,
        urn: c.urn,
        isReply: c.isReply,
      })),
      authorName: card.authorInfo?.name ?? null,
      authorProfileUrl: card.authorInfo?.profileUrl ?? null,
      authorAvatarUrl: card.authorInfo?.photoUrl ?? null,
      authorHeadline: card.authorInfo?.headline ?? null,
    });

    console.log("EngageKit: Comment saved to DB", postUrl);
  } catch (error) {
    // Log but don't throw - we don't want to block the UI flow
    console.error("EngageKit: Failed to save comment to DB", error);
  }
}
