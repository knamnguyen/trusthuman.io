/**
 * Find Post Container - DOM v1 (legacy)
 *
 * Finds the post container element by traversing up the DOM.
 * Uses data-urn, data-id, and article selectors.
 */

/**
 * Find the post container element from an anchor element.
 * Works for both EngageButton (inside forms) and LinkedIn's native comment buttons.
 *
 * @param anchorElement - Any element within a post
 * @returns The post container element, or null if not found
 */
export function findPostContainer(anchorElement: Element): Element | null {
  // Try finding post container directly from anchor element first
  // This works for LinkedIn's native comment buttons
  const directMatch =
    anchorElement.closest("div[data-urn]") ||
    anchorElement.closest("div[data-id]") ||
    anchorElement.closest("article[role='article']");

  if (directMatch) {
    return directMatch;
  }

  // Fallback: try from form (for EngageButton which is inside comment forms)
  const form = anchorElement.closest("form");
  if (form) {
    const fromForm =
      form.closest("div[data-urn]") ||
      form.closest("div[data-id]") ||
      form.closest("article[role='article']");
    if (fromForm) {
      return fromForm;
    }
  }

  // Last resort fallback
  return document.querySelector("main");
}

/**
 * Find Post Container on /feed/update page - DOM v1 (legacy)
 *
 * On /feed/update page, posts are in article elements with role="article"
 *
 * @returns The post container element, or null if not found
 */
export function findPostContainerFromFeedUpdatePage(): HTMLElement | null {
  return document.querySelector(
    "div[data-urn], div[data-id], article[role='article']",
  );
}
