import type { CommentUtilities } from "./types";
import { findEditableField } from "./utils-v2/find-editable-field";
import { clickCommentButton } from "./utils-v2/click-comment-button";

export class CommentUtilitiesV2 implements CommentUtilities {
  findEditableField(postContainer: HTMLElement): HTMLElement | null {
    return findEditableField(postContainer);
  }

  clickCommentButton(postContainer: HTMLElement): boolean {
    return clickCommentButton(postContainer);
  }

  insertComment(
    _editableField: HTMLElement,
    _comment: string
  ): Promise<void> {
    throw new Error("Not implemented yet");
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
