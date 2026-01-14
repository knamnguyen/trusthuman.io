/**
 * Click Comment Button - DOM v1 (Legacy)
 *
 * Handles two types of comment buttons:
 * 1. Number button - "Show X comments" (aria-label contains "comment")
 * 2. Show button - "Comment" action button (aria-label="Comment")
 */

/**
 * Click the "Show X comments" button to load/reveal comments.
 * This is the button showing comment count (e.g., "Show 3 comments on John's post").
 *
 * @param postContainer - The LinkedIn post container element
 * @returns true if button was found and clicked, false otherwise
 */
export function clickCommentNumberButton(postContainer: HTMLElement): boolean {
  try {
    const commentButton = postContainer.querySelector<HTMLButtonElement>(
      'button[aria-label*="comment"]'
    );

    if (commentButton) {
      commentButton.click();
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
 * @param postContainer - The LinkedIn post container element
 * @returns true if button was found and clicked, false otherwise
 */
export function clickCommentShowButton(postContainer: HTMLElement): boolean {
  const commentButton = postContainer.querySelector<HTMLButtonElement>(
    'button[aria-label="Comment"]'
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
