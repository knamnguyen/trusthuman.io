/**
 * Detect Connection Degree - DOM v1 (Legacy)
 *
 * Extracts the connection degree from a post (1st, 2nd, 3rd, 3rd+, Following).
 * V1 shows degree near author name: "Name • 1st" or "• Following"
 *
 * Uses alt text pattern and text matching - no class selectors.
 */

import type { ConnectionDegree } from "../types";

/**
 * Detects the connection degree of the post author.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The connection degree or null if not found
 *
 * @example
 * // For a post showing "Minh-Thu Lam • Following"
 * detectConnectionDegree(postContainer) // "following"
 */
export function detectConnectionDegree(
  postContainer: HTMLElement
): ConnectionDegree {
  try {
    // Strategy 1: Find via author image (regular posts)
    const authorImg = postContainer.querySelector<HTMLImageElement>(
      'img[alt^="View "]'
    );

    if (authorImg) {
      const photoAnchor = authorImg.closest("a");
      const authorContainer =
        photoAnchor?.parentElement?.parentElement || photoAnchor?.parentElement;

      if (authorContainer) {
        const textContent = (authorContainer.textContent || "").replace(
          /\s+/g,
          " "
        );
        const degreeMatch = textContent.match(
          /•\s*(1st|2nd|3rd\+?|following)/i
        );
        if (degreeMatch?.[1]) {
          return parseDegree(degreeMatch[1]);
        }
      }
    }

    // Strategy 2: Fallback for friend activity posts
    // Search entire post for first degree pattern
    const textContent = (postContainer.textContent || "").replace(/\s+/g, " ");
    const degreeMatch = textContent.match(/•\s*(1st|2nd|3rd\+?|following)/i);
    if (degreeMatch?.[1]) {
      return parseDegree(degreeMatch[1]);
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect connection degree (v1)", error);
  }

  return null;
}

/**
 * Parse degree string to ConnectionDegree type.
 */
function parseDegree(degree: string): ConnectionDegree {
  const d = degree.toLowerCase();
  if (d === "1st") return "1st";
  if (d === "2nd") return "2nd";
  if (d.startsWith("3rd")) return "3rd";
  if (d === "following") return "following";
  return null;
}
