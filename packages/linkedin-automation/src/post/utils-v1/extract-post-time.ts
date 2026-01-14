/**
 * Extract Post Time - DOM v1 (Legacy)
 *
 * Extracts post time from a LinkedIn post container.
 * Uses sibling navigation from author anchor.
 */

import type { PostTimeInfo } from "../types";

/**
 * Extracts post time from a LinkedIn post container.
 *
 * Strategy:
 * 1. Find the author image via alt text pattern
 * 2. Navigate to the author anchor
 * 3. Find sibling spans that contain time-like text
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
    // Find the author image
    const authorImg = postContainer.querySelector<HTMLImageElement>(
      'img[alt^="View "]'
    );

    if (!authorImg) {
      return result;
    }

    // Navigate to the author anchor
    const authorAnchor = authorImg.closest("a");
    if (!authorAnchor) {
      return result;
    }

    // The time span is typically a sibling of the author anchor's parent container
    const authorMetaContainer = authorAnchor.parentElement;
    if (!authorMetaContainer) {
      return result;
    }

    // Look for spans that are siblings of the author anchor
    // The time span typically contains text like "1h •", "2d •", "1w •"
    const siblingSpans =
      authorMetaContainer.querySelectorAll<HTMLElement>(":scope > span");

    for (const span of siblingSpans) {
      // Skip if this span is inside the anchor
      if (authorAnchor.contains(span)) continue;

      // Check for time patterns in aria-hidden content
      const ariaHiddenSpan = span.querySelector<HTMLElement>(
        'span[aria-hidden="true"]'
      );
      const visuallyHiddenSpan = span.querySelector<HTMLElement>(
        "span.visually-hidden"
      );

      // Try to get display time from aria-hidden span
      if (ariaHiddenSpan) {
        const text = ariaHiddenSpan.textContent?.trim() || "";
        // Time patterns: "1h •", "2d •", "1w •", "3mo •"
        const timeMatch = text.match(/^(\d+[hdwmoy]+)\s*[•·]/i);
        if (timeMatch?.[1]) {
          result.displayTime = timeMatch[1];
        }
      }

      // Try to get full time from visually-hidden span
      if (visuallyHiddenSpan) {
        const text = visuallyHiddenSpan.textContent?.trim() || "";
        const fullTimeMatch = text.match(
          /^(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i
        );
        if (fullTimeMatch?.[1]) {
          result.fullTime = fullTimeMatch[1];
        }
      }

      // If we found time info, we're done
      if (result.displayTime || result.fullTime) {
        break;
      }
    }

    // Fallback: Search more broadly if sibling approach didn't work
    if (!result.displayTime && !result.fullTime) {
      const allVisuallyHiddenSpans = postContainer.querySelectorAll<HTMLElement>(
        'span[class*="visually-hidden"]'
      );

      for (const span of allVisuallyHiddenSpans) {
        const text = span.textContent?.trim() || "";
        const match = text.match(
          /^(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i
        );
        if (match?.[1]) {
          result.fullTime = match[1];
          // Try to create display time from full time
          const numMatch = match[1].match(/^(\d+)\s+(\w)/);
          if (numMatch) {
            result.displayTime = `${numMatch[1]}${numMatch[2]}`;
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract post time (v1)", error);
  }

  return result;
}
