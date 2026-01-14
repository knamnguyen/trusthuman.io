/**
 * Detect Promoted Post - DOM v1 (Legacy)
 *
 * Detects if a post is promoted/sponsored content.
 *
 * Detection Methods (V1):
 * 1. Check data-view-tracking-scope for sponsored indicators
 * 2. Search for <span> elements containing "Promoted" text in the author section
 * 3. Check for leadGenForm links (sponsored lead generation posts)
 */

/**
 * Detects if a post is promoted/sponsored content.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns True if the post is promoted/sponsored
 */
export function detectPromotedPost(postContainer: HTMLElement): boolean {
  try {
    // Strategy 1: Check data-view-tracking-scope for sponsored indicators
    // Same as V2, the tracking data contains sponsored info
    const trackingElements = postContainer.querySelectorAll(
      "[data-view-tracking-scope]"
    );
    for (const el of trackingElements) {
      const scope = el.getAttribute("data-view-tracking-scope") || "";
      if (
        scope.includes('"isSponsored":true') ||
        scope.includes("SponsoredUpdateServed")
      ) {
        return true;
      }
    }

    // Strategy 2: Search for "Promoted" text in spans
    // The text appears in the author section, typically in the first portion of the post
    const spans = postContainer.querySelectorAll<HTMLSpanElement>("span");
    for (const span of spans) {
      const text = span.textContent?.trim().toLowerCase() || "";
      // Exact match to avoid false positives
      if (text === "promoted") {
        return true;
      }
    }

    // Strategy 3: Check for leadGenForm links (sponsored lead gen posts)
    // These are always sponsored content
    const leadGenLinks = postContainer.querySelectorAll('a[href*="leadGenForm"]');
    if (leadGenLinks.length > 0) {
      return true;
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect promoted post (v1)", error);
  }

  return false;
}
