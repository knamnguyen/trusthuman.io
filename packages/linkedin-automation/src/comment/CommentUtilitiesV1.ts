import type { CommentUtilities } from "./types";
import { findEditableField } from "./utils-v1/find-editable-field";
import { clickCommentButton } from "./utils-v1/click-comment-button";
import { insertComment } from "./utils-v1/insert-comment";

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
    _postContainer: HTMLElement,
    _commentText: string
  ): Promise<boolean> {
    throw new Error("Not implemented yet");
  }

  waitForCommentsReady(
    _container: HTMLElement,
    _beforeCount: number
  ): Promise<void> {
    throw new Error("Not implemented yet");
  }
}
