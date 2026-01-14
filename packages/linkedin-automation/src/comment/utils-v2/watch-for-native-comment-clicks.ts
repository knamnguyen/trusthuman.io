/**
 * Watch for Native Comment Button Clicks - DOM v2 (React SSR + SDUI)
 *
 * Intercepts clicks on LinkedIn's native comment buttons:
 * - Number button: div[role="button"][data-view-name="feed-comment-count"] - "X comments"
 * - Show button: button[data-view-name="feed-comment-button"] - "Comment" action
 *
 * Uses event delegation on document to catch all clicks.
 */

import type { OnNativeCommentButtonClick } from "../types";

// V2 Selectors (from click-comment-button.ts)
const COMMENT_NUMBER_SELECTOR =
  'div[role="button"][data-view-name="feed-comment-count"]';
const COMMENT_SHOW_SELECTOR = 'button[data-view-name="feed-comment-button"]';

// Post container in V2
const POST_CONTAINER_SELECTOR = 'div[role="listitem"]';

/**
 * Check if element matches the comment number button selector
 */
function isCommentNumberButton(element: Element): boolean {
  return element.matches(COMMENT_NUMBER_SELECTOR);
}

/**
 * Check if element matches the comment show button selector
 */
function isCommentShowButton(element: Element): boolean {
  return element.matches(COMMENT_SHOW_SELECTOR);
}

/**
 * Find comment button from click target (element or ancestor)
 */
function findCommentButtonFromTarget(
  target: EventTarget | null
): { button: HTMLElement; type: "number" | "show" } | null {
  if (!(target instanceof Element)) return null;

  // Check if clicked element itself is a comment button
  if (isCommentNumberButton(target)) {
    return { button: target as HTMLElement, type: "number" };
  }
  if (isCommentShowButton(target)) {
    return { button: target as HTMLElement, type: "show" };
  }

  // Check ancestors (for clicks on icon inside button)
  const numberButton = target.closest(COMMENT_NUMBER_SELECTOR);
  if (numberButton) {
    return { button: numberButton as HTMLElement, type: "number" };
  }

  const showButton = target.closest(COMMENT_SHOW_SELECTOR);
  if (showButton) {
    return { button: showButton as HTMLElement, type: "show" };
  }

  return null;
}

/**
 * Watch for clicks on LinkedIn's native comment buttons.
 * Returns cleanup function to remove the listener.
 */
export function watchForNativeCommentButtonClicks(
  onClick: OnNativeCommentButtonClick
): () => void {
  const handleClick = (e: MouseEvent) => {
    const result = findCommentButtonFromTarget(e.target);
    if (!result) return;

    const { button, type } = result;

    // Find the post container
    const postContainer = button.closest(
      POST_CONTAINER_SELECTOR
    ) as HTMLElement | null;
    if (!postContainer) {
      console.warn(
        "EngageKit: Native comment button clicked but post container not found"
      );
      return;
    }

    // Fire the callback
    onClick({
      postContainer,
      buttonElement: button,
      buttonType: type,
    });
  };

  // Use capture phase to intercept before LinkedIn's handlers
  document.addEventListener("click", handleClick, { capture: true });

  return () => {
    document.removeEventListener("click", handleClick, { capture: true });
  };
}
