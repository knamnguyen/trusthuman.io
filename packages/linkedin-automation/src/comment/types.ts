/**
 * Comment Utilities Types
 *
 * Defines operations for interacting with LinkedIn comments.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */

/**
 * Target for injecting engage button next to comment editor.
 * Similar to AuthorProfileTarget in profile utilities.
 */
export interface CommentEditorTarget {
  /** Unique ID for this target */
  id: string;
  /** Container div for button injection */
  container: HTMLDivElement;
  /** The anchor element (add-image button or similar) */
  anchorElement: Element;
  /** The post container element (for extracting post info) */
  postContainer: HTMLElement;
}

/**
 * Callback type for comment editor target changes.
 */
export type OnCommentEditorTargetsChange = (
  targets: CommentEditorTarget[]
) => void;

/**
 * Event data for native comment button click.
 */
export interface NativeCommentButtonClickEvent {
  /** The post container element */
  postContainer: HTMLElement;
  /** The comment button that was clicked */
  buttonElement: HTMLElement;
  /** Type of button clicked */
  buttonType: "number" | "show";
}

/**
 * Callback type for native comment button clicks.
 */
export type OnNativeCommentButtonClick = (
  event: NativeCommentButtonClickEvent
) => void;

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

  /**
   * Watch for comment editor elements where we can inject an engage button.
   * Creates container divs for button injection next to the add-image button.
   * Returns cleanup function.
   *
   * @param onChange - Callback fired when targets change
   * @returns Cleanup function to stop watching and remove injected elements
   */
  watchForCommentEditors(onChange: OnCommentEditorTargetsChange): () => void;

  /**
   * Watch for clicks on LinkedIn's native comment buttons.
   * Intercepts clicks on "X comments" number button and "Comment" action button.
   * Returns cleanup function.
   *
   * @param onClick - Callback fired when a native comment button is clicked
   * @returns Cleanup function to stop watching
   */
  watchForNativeCommentButtonClicks(onClick: OnNativeCommentButtonClick): () => void;
}
