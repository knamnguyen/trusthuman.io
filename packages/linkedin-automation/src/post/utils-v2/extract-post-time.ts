/**
 * Extract Post Time - DOM v2 (React SSR + SDUI)
 *
 * Extracts post time from a LinkedIn post container.
 * Uses data-view-name="feed-actor-image" as anchor point.
 *
 * DOM Structure (V2):
 * - a[data-view-name="feed-actor-image"] (author photo)
 * - a (sibling - author name/headline/time link)
 *   - div
 *     - div (name)
 *     - div (headline)
 *     - div (time container)
 *       - p containing "21h • Edited •" or similar
 */

import type { PostTimeInfo } from "../types";

/**
 * Extracts post time from a LinkedIn post container.
 *
 * Strategy:
 * 1. Find the author photo anchor by data-view-name
 * 2. Navigate to sibling anchor with name/headline/time
 * 3. Look for time text pattern in <p> elements
 *
 * @param postContainer - The LinkedIn post container element
 * @returns PostTimeInfo with display and full time
 */
export function extractPostTime(postContainer: HTMLElement): PostTimeInfo {
  const result: PostTimeInfo = {
    displayTime: null,
    fullTime: null,
  };

  try {
    // Find the author photo anchor
    const photoAnchor = postContainer.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    if (!photoAnchor) {
      return result;
    }

    // Find the parent container
    const parent = photoAnchor.parentElement;
    if (!parent) {
      return result;
    }

    // Look for sibling anchors with <p> elements containing time
    for (const sibling of parent.children) {
      if (sibling === photoAnchor) continue;
      if (sibling.tagName !== "A") continue;

      // Look for all <p> elements in this sibling
      const paragraphs = sibling.querySelectorAll<HTMLParagraphElement>("p");

      for (const p of paragraphs) {
        const text = p.textContent?.trim() || "";

        // Time pattern: "21h •", "2d •", "1w •", "3mo •", "1y •"
        // Can also have "• Edited" suffix
        const timeMatch = text.match(/^(\d+[hdwmoy]+)\s*[•·]/i);
        if (timeMatch?.[1]) {
          result.displayTime = timeMatch[1];

          // Try to extract full time from the text (if available)
          // V2 might not have separate full time, so derive it
          const num = parseInt(timeMatch[1]);
          const unit = timeMatch[1].replace(/\d+/, "").toLowerCase();

          const unitMap: Record<string, string> = {
            h: "hour",
            d: "day",
            w: "week",
            m: "month",
            mo: "month",
            y: "year",
          };

          const fullUnit = unitMap[unit] || unit;
          result.fullTime = `${num} ${fullUnit}${num > 1 ? "s" : ""} ago`;

          return result;
        }
      }
    }

    // Fallback: Search all <p> elements in the post for time pattern
    if (!result.displayTime) {
      const allParagraphs =
        postContainer.querySelectorAll<HTMLParagraphElement>("p");

      for (const p of allParagraphs) {
        const text = p.textContent?.trim() || "";
        const timeMatch = text.match(/^(\d+[hdwmoy]+)\s*[•·]/i);
        if (timeMatch?.[1]) {
          result.displayTime = timeMatch[1];

          const num = parseInt(timeMatch[1]);
          const unit = timeMatch[1].replace(/\d+/, "").toLowerCase();

          const unitMap: Record<string, string> = {
            h: "hour",
            d: "day",
            w: "week",
            m: "month",
            mo: "month",
            y: "year",
          };

          const fullUnit = unitMap[unit] || unit;
          result.fullTime = `${num} ${fullUnit}${num > 1 ? "s" : ""} ago`;

          return result;
        }
      }
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract post time (v2)", error);
  }

  return result;
}
