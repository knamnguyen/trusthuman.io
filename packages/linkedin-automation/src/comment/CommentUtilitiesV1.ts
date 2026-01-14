import type {
  CommentUtilities,
  OnCommentEditorTargetsChange,
  OnNativeCommentButtonClick,
} from "./types";
import { clickCommentButton } from "./utils-v1/click-comment-button";
import { findEditableField } from "./utils-v1/find-editable-field";
import { insertComment } from "./utils-v1/insert-comment";
import { likeOwnComment } from "./utils-v1/like-own-comment";
import { likePost } from "./utils-v1/like-post";
import { submitComment } from "./utils-v1/submit-comment";
import { waitForCommentsReady } from "./utils-v1/wait-for-comments-ready";
import { watchForCommentEditors } from "./utils-v1/watch-for-comment-editors";
import { watchForNativeCommentButtonClicks } from "./utils-v1/watch-for-native-comment-clicks";

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
    commentText: string,
  ): Promise<boolean> {
    return submitComment(postContainer, commentText);
  }

  waitForCommentsReady(
    container: HTMLElement,
    beforeCount: number,
  ): Promise<void> {
    return waitForCommentsReady(container, beforeCount);
  }

  watchForCommentEditors(onChange: OnCommentEditorTargetsChange): () => void {
    return watchForCommentEditors(onChange);
  }

  watchForNativeCommentButtonClicks(
    onClick: OnNativeCommentButtonClick,
  ): () => void {
    return watchForNativeCommentButtonClicks(onClick);
  }

  likePost(postContainer: HTMLElement): Promise<boolean> {
    return likePost(postContainer);
  }

  likeOwnComment(postContainer: HTMLElement): Promise<boolean> {
    return likeOwnComment(postContainer);
  }
}
