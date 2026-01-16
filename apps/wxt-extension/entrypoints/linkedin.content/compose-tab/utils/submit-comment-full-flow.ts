/**
 * Submit Comment Full Flow
 *
 * Shared utility for submitting a comment to LinkedIn with all enabled settings.
 * Used by ComposeCard, PostPreviewSheet, and ComposeTab (batch submit).
 *
 * Flow:
 * 1. Wait for editable field (poll up to 3s)
 * 2. Insert comment text
 * 3. Tag author if enabled
 * 4. Attach image if enabled
 * 5. Submit comment (click button + verify)
 * 6. Like post if enabled
 * 7. Like own comment if enabled
 * 8. Save to database
 */

import type { CommentUtilities } from "@sassy/linkedin-automation/comment/types";

import type { ComposeCard } from "../../stores/compose-store";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { saveCommentToDb } from "./save-comment-to-db";

/**
 * Submit a comment to LinkedIn with all enabled settings applied.
 *
 * @param card - The ComposeCard containing post container and comment text
 * @param commentUtils - LinkedIn comment utilities instance
 * @returns true if submission succeeded, false otherwise
 */
export async function submitCommentFullFlow(
  card: ComposeCard,
  commentUtils: CommentUtilities,
): Promise<boolean> {
  // Get submit settings from DB store (may be null if not loaded)
  const submitSettings = useSettingsDBStore.getState().submitComment;

  try {
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
      return false;
    }

    // 2. Insert comment text
    editableField.focus();
    await commentUtils.insertComment(editableField, card.commentText);
    await new Promise((r) => setTimeout(r, 300));

    // 3. Tag author if enabled
    if (submitSettings?.tagPostAuthorEnabled) {
      await commentUtils.tagPostAuthor(card.postContainer);
      await new Promise((r) => setTimeout(r, 300));
    }

    // 4. Attach image if enabled
    if (submitSettings?.attachPictureEnabled) {
      const imageBlob = useSettingsLocalStore.getState().getImageBlob();
      if (imageBlob) {
        await commentUtils.attachImageToComment(card.postContainer, imageBlob);
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // 5. Submit comment (click button + verify)
    const result = await commentUtils.submitComment(card.postContainer);

    if (result.success) {
      // 6. Like post if enabled
      if (submitSettings?.likePostEnabled) {
        await commentUtils.likePost(card.postContainer);
        await new Promise((r) => setTimeout(r, 300));
      }

      // 7. Like own comment if enabled
      if (submitSettings?.likeCommentEnabled) {
        await new Promise((r) => setTimeout(r, 500));
        await commentUtils.likeOwnComment(card.postContainer);
      }

      // 8. Save to database (fire-and-forget)
      void saveCommentToDb(card, { commentUrl: result.commentUrl });
    }

    return result.success;
  } catch (err) {
    console.error("EngageKit: Error in submit flow", err);
    return false;
  }
}
