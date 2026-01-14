/**
 * Detect Promoted Post - DOM v2 (React SSR + SDUI)
 *
 * Detects if a post is promoted/sponsored content.
 *
 * Detection Methods (V2):
 * 1. Check for data-view-name attributes containing "sponsored"
 * 2. Look for "Promoted" text in <p> elements near the author section
 * 3. Check data-view-tracking-scope for sponsored indicators
 */

/**
 * Detects if a post is promoted/sponsored content.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns True if the post is promoted/sponsored
 */
export function detectPromotedPost(postContainer: HTMLElement): boolean {
  try {
    // Strategy 1: Check for sponsored data-view-name attributes
    // Promoted posts have elements with data-view-name containing "sponsored"
    const sponsoredElements = postContainer.querySelectorAll(
      '[data-view-name*="sponsored"]'
    );
    if (sponsoredElements.length > 0) {
      return true;
    }

    // Strategy 2: Check data-view-tracking-scope for sponsored indicators
    const trackingElements = postContainer.querySelectorAll(
      "[data-view-tracking-scope]"
    );
    for (const el of trackingElements) {
      const scope = el.getAttribute("data-view-tracking-scope") || "";
      // Check for isSponsored:true or SponsoredUpdateServed in the tracking data
      if (
        scope.includes('"isSponsored":true') ||
        scope.includes("SponsoredUpdateServed")
      ) {
        return true;
      }
    }

    // Strategy 3: Look for "Promoted" text near the author section
    const photoAnchor = postContainer.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    if (photoAnchor) {
      // Check sibling anchor (usually contains name, headline, "Promoted" text)
      const siblingAnchor = photoAnchor.nextElementSibling;
      if (siblingAnchor) {
        const paragraphs = siblingAnchor.querySelectorAll<HTMLParagraphElement>("p");
        for (const p of paragraphs) {
          const text = p.textContent?.trim().toLowerCase() || "";
          if (text === "promoted") {
            return true;
          }
        }
      }

      // Also check parent container for "Promoted" text
      const parent = photoAnchor.parentElement;
      if (parent) {
        const allParagraphs = parent.querySelectorAll<HTMLParagraphElement>("p");
        for (const p of allParagraphs) {
          const text = p.textContent?.trim().toLowerCase() || "";
          if (text === "promoted") {
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect promoted post (v2)", error);
  }

  return false;
}
