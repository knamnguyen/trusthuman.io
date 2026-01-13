/**
 * Comment Utilities Types
 *
 * Defines operations for interacting with LinkedIn comments.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */

/**
 * Comment Utilities Interface
 *
 * Defines operations for creating and submitting comments on LinkedIn posts.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */
export interface CommentUtilities {
  /**
   * Find the editable comment field within a post container.
   * The comment input must already be visible (after clicking comment button).
   *
   * @param postContainer - The LinkedIn post container element
   * @returns The contenteditable element, or null if not found
   */
  findEditableField(postContainer: HTMLElement): HTMLElement | null;

  /**
   * Click the comment button to open the comment input section.
   * Tries the "Show X comments" button first, then falls back to "Comment" action button.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns true if a button was found and clicked, false otherwise
   */
  clickCommentButton(postContainer: HTMLElement): boolean;

  /**
   * Insert text into a comment field.
   * Handles multi-line content and triggers input events for LinkedIn to recognize changes.
   *
   * @param editableField - The contenteditable element
   * @param comment - The comment text to insert
   */
  insertComment(editableField: HTMLElement, comment: string): Promise<void>;

  /**
   * Submit a comment to a LinkedIn post.
   * Full flow: wait for editable field, insert text, click submit, verify posted.
   *
   * @param postContainer - The LinkedIn post container element
   * @param commentText - The comment text to submit
   * @returns true if comment was successfully submitted and verified
   */
  submitComment(
    postContainer: HTMLElement,
    commentText: string
  ): Promise<boolean>;

  /**
   * Wait for comments to load after clicking the comment button.
   * Polls until comment count increases or timeout is reached.
   *
   * @param container - The post container element
   * @param beforeCount - Comment count before clicking the comment button
   */
  waitForCommentsReady(
    container: HTMLElement,
    beforeCount: number
  ): Promise<void>;
}
