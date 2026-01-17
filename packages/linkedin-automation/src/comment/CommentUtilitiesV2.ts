import type {
  CommentUtilities,
  OnCommentEditorTargetsChange,
  OnNativeCommentButtonClick,
} from "./types";
import { findEditableField } from "./utils-v2/find-editable-field";
import { clickCommentButton } from "./utils-v2/click-comment-button";
import { insertComment } from "./utils-v2/insert-comment";
import { submitComment, findSubmitButton } from "./utils-v2/submit-comment";
import { waitForCommentsReady } from "./utils-v2/wait-for-comments-ready";
import { watchForCommentEditors } from "./utils-v2/watch-for-comment-editors";
import { watchForNativeCommentButtonClicks } from "./utils-v2/watch-for-native-comment-clicks";
import { likePost } from "./utils-v2/like-post";
import { likeOwnComment } from "./utils-v2/like-own-comment";
import { tagPostAuthor } from "./utils-v2/tag-post-author";
import { attachImageToComment } from "./utils-v2/attach-image-to-comment";

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

  submitComment(postContainer: HTMLElement) {
    return submitComment(postContainer);
  }

  clickSubmitButton(postContainer: HTMLElement): boolean {
    const button = findSubmitButton(postContainer);
    if (button) {
      button.click();
      return true;
    }
    return false;
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

  watchForNativeCommentButtonClicks(
    onClick: OnNativeCommentButtonClick
  ): () => void {
    return watchForNativeCommentButtonClicks(onClick);
  }

  likePost(postContainer: HTMLElement): Promise<boolean> {
    return likePost(postContainer);
  }

  likeOwnComment(postContainer: HTMLElement): Promise<boolean> {
    return likeOwnComment(postContainer);
  }

  tagPostAuthor(postContainer: HTMLElement): Promise<boolean> {
    return tagPostAuthor(postContainer);
  }

  attachImageToComment(postContainer: HTMLElement, imageSource: string | Blob): Promise<boolean> {
    return attachImageToComment(postContainer, imageSource);
  }
}
