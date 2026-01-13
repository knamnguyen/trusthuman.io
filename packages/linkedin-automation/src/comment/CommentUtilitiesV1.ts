import type {
  CommentUtilities,
  OnCommentEditorTargetsChange,
} from "./types";
import { findEditableField } from "./utils-v1/find-editable-field";
import { clickCommentButton } from "./utils-v1/click-comment-button";
import { insertComment } from "./utils-v1/insert-comment";
import { submitComment } from "./utils-v1/submit-comment";
import { waitForCommentsReady } from "./utils-v1/wait-for-comments-ready";
import { watchForCommentEditors } from "./utils-v1/watch-for-comment-editors";

export class CommentUtilitiesV1 implements CommentUtilities {
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

  watchForCommentEditors(onChange: OnCommentEditorTargetsChange): () => void {
    return watchForCommentEditors(onChange);
  }
}
