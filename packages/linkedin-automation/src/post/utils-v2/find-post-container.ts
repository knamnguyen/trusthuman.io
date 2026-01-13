/**
 * Find Post Container - DOM v2 (React SSR + SDUI)
 *
 * Finds the post container element by traversing up the DOM.
 *
 * DOM Structure:
 * - div[role="listitem"] (post container - includes post + comments)
 *   - div (wrapper)
 *     - div[data-view-name="feed-full-update"] (post content only)
 *   - div (comment section - sibling, NOT inside feed-full-update)
 *     - form (comment form)
 *       - div[aria-label="Text editor for creating comment"]
 */

/**
 * Find the post container element from an anchor element.
 * Works for both elements inside post content and comment forms.
 *
 * Strategy:
 * 1. Try finding div[role="listitem"] (the full post container)
 * 2. Fallback to feed-full-update's parent (for elements inside post content)
 *
 * @param anchorElement - Any element within a post
 * @returns The post container element, or null if not found
 */
export function findPostContainer(anchorElement: Element): Element | null {
  // Primary: Find the listitem container (full post including comments)
  const listItem = anchorElement.closest('div[role="listitem"]');
  if (listItem) {
    return listItem;
  }

  // Fallback: Try finding feed-full-update and get its parent
  // (for cases where listitem isn't present)
  const feedUpdate = anchorElement.closest(
    'div[data-view-name="feed-full-update"]'
  );
  if (feedUpdate?.parentElement) {
    return feedUpdate.parentElement;
  }

  // Last resort fallback
  return document.querySelector("main");
}
