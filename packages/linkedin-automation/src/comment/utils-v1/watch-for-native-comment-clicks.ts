/**
 * Watch for Native Comment Button Clicks - DOM v1 (Legacy)
 *
 * Intercepts clicks on LinkedIn's native comment buttons:
 * - Number button: button[aria-label*="comment"] - "Show X comments"
 * - Show button: button[aria-label="Comment"] - "Comment" action
 *
 * Uses event delegation on document to catch all clicks.
 */

import type { OnNativeCommentButtonClick } from "../types";

// V1 Selectors (from click-comment-button.ts)
const COMMENT_NUMBER_SELECTOR = 'button[aria-label*="comment"]';
const COMMENT_SHOW_SELECTOR = 'button[aria-label="Comment"]';

// Post container in V1
const POST_CONTAINER_SELECTOR = "div[data-urn], div[data-id]";

/**
 * Check if element matches the comment number button selector
 * (contains "comment" in aria-label, but NOT exact match "Comment")
 */
function isCommentNumberButton(element: Element): boolean {
  if (!element.matches("button")) return false;
  const ariaLabel = element.getAttribute("aria-label") || "";
  // Must contain "comment" (case-insensitive) but not be exactly "Comment"
  return (
    ariaLabel.toLowerCase().includes("comment") && ariaLabel !== "Comment"
  );
}

/**
 * Check if element matches the comment show button selector
 * (exact aria-label="Comment")
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
  // Check show button first (more specific)
  if (isCommentShowButton(target)) {
    return { button: target as HTMLElement, type: "show" };
  }
  if (isCommentNumberButton(target)) {
    return { button: target as HTMLElement, type: "number" };
  }

  // Check ancestors (for clicks on icon inside button)
  // Check show button first (more specific)
  const showButton = target.closest(COMMENT_SHOW_SELECTOR);
  if (showButton) {
    return { button: showButton as HTMLElement, type: "show" };
  }

  // For number button, find closest button and check aria-label
  const anyButton = target.closest("button");
  if (anyButton && isCommentNumberButton(anyButton)) {
    return { button: anyButton as HTMLElement, type: "number" };
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
