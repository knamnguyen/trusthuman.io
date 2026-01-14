/**
 * Detect Connection Degree - DOM v2 (React SSR + SDUI)
 *
 * Extracts the connection degree from a post (1st, 2nd, 3rd, 3rd+, Following).
 * V2 shows degree in a span after the author name: "Author Name • 3rd+"
 *
 * Uses data attributes and text pattern matching - no class selectors.
 */

import type { ConnectionDegree } from "../types";

/**
 * Detects the connection degree of the post author.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The connection degree or null if not found
 *
 * @example
 * // For a post showing "Robin Philibert • 3rd+"
 * detectConnectionDegree(postContainer) // "3rd"
 */
export function detectConnectionDegree(
  postContainer: HTMLElement
): ConnectionDegree {
  try {
    // V2: Find the author image link using data attribute (stable)
    const authorLink = postContainer.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    if (!authorLink) {
      return null;
    }

    // Get the parent container that holds the author info
    // Structure: <div><a data-view-name="feed-actor-image">...</a>...<a href="profile">Name • Degree</a></div>
    const parent = authorLink.parentElement;
    if (!parent) {
      return null;
    }

    // Search the entire parent container's text for the degree pattern
    // Normalize whitespace (LinkedIn uses various unicode spaces)
    const parentText = (parent.textContent || "").replace(/\s+/g, " ");

    // Look for degree pattern: "• 1st", "• 2nd", "• 3rd+", "• Following"
    // Note: No word boundary required - text may concatenate like "• 2ndCEO"
    const degreeMatch = parentText.match(/•\s*(1st|2nd|3rd\+?|following)/i);
    if (degreeMatch?.[1]) {
      const degree = degreeMatch[1].toLowerCase();
      if (degree === "1st") return "1st";
      if (degree === "2nd") return "2nd";
      if (degree.startsWith("3rd")) return "3rd";
      if (degree === "following") return "following";
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect connection degree (v2)", error);
  }

  return null;
}
