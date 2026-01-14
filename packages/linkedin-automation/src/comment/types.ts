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
   * Clicks the submit button and verifies the comment was posted.
   *
   * Note: Comment text should already be inserted via insertComment()
   * before calling this function. This allows for tagging and image
   * attachment between insert and submit.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns true if comment was successfully submitted and verified
   */
  submitComment(postContainer: HTMLElement): Promise<boolean>;

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

  /**
   * Click the like button on a post if not already liked.
   * Used after commenting to also like the post.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns Promise<boolean> - true if post was liked, false if already liked or error
   */
  likePost(postContainer: HTMLElement): Promise<boolean>;

  /**
   * Like the user's own comment after posting it.
   * Finds comments with "• You" indicator and clicks the like button.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns Promise<boolean> - true if own comment was found and liked, false otherwise
   */
  likeOwnComment(postContainer: HTMLElement): Promise<boolean>;

  /**
   * Tag the post author at the END of a comment.
   * Uses LinkedIn's mention picker to create a proper mention.
   * Should be called after inserting the comment text.
   *
   * Flow:
   * 1. Moves cursor to end of content
   * 2. Ensures space before @ (required for mention picker)
   * 3. Types "@" and waits for dropdown
   * 4. Uses keyboard navigation (ArrowDown + Enter) to select first option
   *
   * @param postContainer - The LinkedIn post container element
   * @returns Promise<boolean> - true if author was tagged, false otherwise
   */
  tagPostAuthor(postContainer: HTMLElement): Promise<boolean>;

  /**
   * Attach an image to a comment before submitting.
   * Downloads the image from URL (or uses Blob directly) and attaches it to the comment box.
   *
   * Flow:
   * 1. Find "Add photo" button and click it (blocking file picker)
   * 2. If URL: Fetch image and convert to File object
   *    If Blob: Wrap in File object directly
   * 3. Set file on the input using DataTransfer API
   * 4. Dispatch change event to trigger LinkedIn's handler
   *
   * @param postContainer - The LinkedIn post container element
   * @param imageSource - URL string or Blob of the image to attach
   * @returns Promise<boolean> - true if image was attached successfully
   */
  attachImageToComment(postContainer: HTMLElement, imageSource: string | Blob): Promise<boolean>;

  /**
   * Click the submit button (Comment/Reply) in a post's comment editor.
   * Used by the manual flow after inserting text, tagging, and attaching.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns boolean - true if button was found and clicked
   */
  clickSubmitButton(postContainer: HTMLElement): boolean;
}
