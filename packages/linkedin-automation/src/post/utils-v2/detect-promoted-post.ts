/**
 * Detect Promoted Post - DOM v2 (React SSR + SDUI)
 *
 * Detects if a post is promoted/sponsored content.
 * Promoted posts have "Promoted" text in the actor description area.
 */

/**
 * Detects if a post is promoted/sponsored content.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns True if the post is promoted/sponsored
 */
export function detectPromotedPost(postContainer: HTMLElement): boolean {
  try {
    // Find the author photo anchor as starting point
    const photoAnchor = postContainer.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    if (!photoAnchor) {
      return false;
    }

    // Get the parent container that holds all actor info
    const parent = photoAnchor.parentElement;
    if (!parent) {
      return false;
    }

    // Search all <p> elements in the actor area for "Promoted" text
    const paragraphs = parent.querySelectorAll<HTMLParagraphElement>("p");
    for (const p of paragraphs) {
      const text = p.textContent?.toLowerCase() || "";
      if (text.includes("promoted")) {
        return true;
      }
    }

    // Fallback: search broader area for promoted indicator
    // Some layouts may have it in a different structure
    const actorContainer = photoAnchor.closest('[class*="actor"]');
    if (actorContainer) {
      const allText = actorContainer.textContent?.toLowerCase() || "";
      if (allText.includes("promoted")) {
        return true;
      }
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect promoted post (v2)", error);
  }

  return false;
}
