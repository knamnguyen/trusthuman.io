import type { CommentUtilities } from "./types";
import { findEditableField } from "./utils-v2/find-editable-field";
import { clickCommentButton } from "./utils-v2/click-comment-button";
import { insertComment } from "./utils-v2/insert-comment";
import { submitComment } from "./utils-v2/submit-comment";
import { waitForCommentsReady } from "./utils-v2/wait-for-comments-ready";

export class CommentUtilitiesV2 implements CommentUtilities {
  findEditableField(postContainer: HTMLElement): HTMLElement | null {
    return findEditableField(postContainer);
  }

  clickCommentButton(postContainer: HTMLElement): boolean {
    return clickCommentButton(postContainer);
  }

  insertComment(editableField: HTMLElement, comment: string): Promise<void> {
    return insertComment(editableField, comment);
  }

  submitComment(
    postContainer: HTMLElement,
    commentText: string
  ): Promise<boolean> {
    return submitComment(postContainer, commentText);
  }

  waitForCommentsReady(
    container: HTMLElement,
    beforeCount: number
  ): Promise<void> {
    return waitForCommentsReady(container, beforeCount);
  }
}
