/**
 * Click Comment Button - DOM v2 (React SSR + SDUI)
 *
 * Handles two types of comment buttons:
 * 1. Number button - "X comments" (data-view-name="feed-comment-count")
 * 2. Show button - "Comment" action button (data-view-name="feed-comment-button")
 *
 * V2 DOM differences:
 * - Comment number button is a div[role="button"], not a <button>
 * - Uses data-view-name attributes instead of aria-label
 */

/**
 * Click the "X comments" button to load/reveal comments.
 * This is the button showing comment count (e.g., "17 comments").
 *
 * V2: div[role="button"][data-view-name="feed-comment-count"]
 *
 * @param postContainer - The LinkedIn post container element
 * @returns true if button was found and clicked, false otherwise
 */
export function clickCommentNumberButton(postContainer: HTMLElement): boolean {
  try {
    // V2: Comment count is a div with role="button"
    const commentButton = postContainer.querySelector<HTMLElement>(
      'div[role="button"][data-view-name="feed-comment-count"]'
    );

    if (commentButton) {
      commentButton.click();
      return true;
    }

    // Fallback: Try any element with the data-view-name
    const fallback = postContainer.querySelector<HTMLElement>(
      '[data-view-name="feed-comment-count"]'
    );
    if (fallback) {
      fallback.click();
      return true;
    }

    return false;
  } catch (error) {
    console.error("EngageKit: Failed to click comment number button", error);
    return false;
  }
}

/**
 * Click the "Comment" action button to open the comment input box.
 * This is the button in the action bar (like, comment, repost, send).
 *
 * V2: button[data-view-name="feed-comment-button"]
 *
 * @param postContainer - The LinkedIn post container element
 * @returns true if button was found and clicked, false otherwise
 */
export function clickCommentShowButton(postContainer: HTMLElement): boolean {
  const commentButton = postContainer.querySelector<HTMLElement>(
    'button[data-view-name="feed-comment-button"]'
  );

  if (!commentButton) {
    return false;
  }

  commentButton.click();
  return true;
}

/**
 * Click the appropriate comment button for a post.
 * Strategy: Try the number button first (shows existing comments),
 * if not found, fall back to the show button (opens comment input).
 *
 * @param postContainer - The LinkedIn post container element
 * @returns true if any comment button was clicked, false if none found
 */
export function clickCommentButton(postContainer: HTMLElement): boolean {
  // Try number button first (shows existing comments)
  if (clickCommentNumberButton(postContainer)) {
    return true;
  }

  // Fall back to show button (opens comment input box)
  return clickCommentShowButton(postContainer);
}
