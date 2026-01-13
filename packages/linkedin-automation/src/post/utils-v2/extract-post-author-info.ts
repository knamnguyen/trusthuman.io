/**
 * Extract Author Info - DOM v2 (React SSR + SDUI)
 *
 * Extracts author information from a LinkedIn post container.
 * Uses data-view-name="feed-actor-image" anchor pattern.
 *
 * DOM Structure (V2):
 * - a[data-view-name="feed-actor-image"] (author photo link)
 *   - img (author photo)
 * - a (sibling - author name/headline link)
 *   - p (name)
 *   - p (headline)
 */

import type { PostAuthorInfo } from "../types";

/**
 * Extracts LinkedIn URL without query params.
 */
function extractCleanUrl(href: string | null): string | null {
  if (!href) return null;
  // Handle relative URLs
  if (href.startsWith("/in/")) {
    return `https://www.linkedin.com${href.split("?")[0]}`;
  }
  return href.split("?")[0] || null;
}

/**
 * Clean name text by removing connection degree suffix and badges.
 */
function cleanNameText(text: string): string {
  // Remove connection degree suffix like " • 3rd+" or " • Following"
  const cleaned = text.replace(/\s*[•·]\s*(3rd\+?|2nd|1st|Following).*$/i, "");
  return cleaned.trim();
}

/**
 * Find the name/headline container element.
 * For posts: sibling anchor after the photo anchor
 */
function findNameHeadlineContainer(photoAnchor: Element): Element | null {
  // Try sibling approach (works for V2 posts)
  const siblingAnchor = photoAnchor.nextElementSibling;
  if (siblingAnchor?.tagName === "A" && siblingAnchor.querySelector("p")) {
    return siblingAnchor;
  }

  // Try parent's sibling anchors
  const parent = photoAnchor.parentElement;
  if (parent) {
    for (const sibling of parent.children) {
      if (sibling === photoAnchor) continue;
      if (sibling.tagName === "A" && sibling.querySelector("p")) {
        return sibling;
      }
    }
  }

  return null;
}

/**
 * Extract name from container element.
 */
function extractName(container: Element): string | null {
  // Find first <p> element which contains the name
  const nameP = container.querySelector("p");
  if (!nameP) return null;

  const text = nameP.textContent?.trim() || "";
  return cleanNameText(text) || null;
}

/**
 * Extract headline from container element.
 */
function extractHeadline(container: Element): string | null {
  // Find all <p> elements - second one is headline
  const paragraphs = container.querySelectorAll("p");
  if (paragraphs.length < 2) return null;

  return paragraphs[1]?.textContent?.trim() || null;
}

/**
 * Extracts author information from a LinkedIn post container.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns PostAuthorInfo object with available information
 */
export function extractPostAuthorInfo(postContainer: HTMLElement): PostAuthorInfo {
  const result: PostAuthorInfo = {
    name: null,
    photoUrl: null,
    headline: null,
    profileUrl: null,
  };

  try {
    // Step 1: Find author anchor by data-view-name
    const photoAnchor = postContainer.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    if (!photoAnchor) {
      return result;
    }

    // Step 2: Extract profile URL from anchor
    result.profileUrl = extractCleanUrl(photoAnchor.getAttribute("href"));

    // Step 3: Extract photo URL from img inside anchor
    const img = photoAnchor.querySelector("img");
    if (img) {
      result.photoUrl = img.getAttribute("src");
    }

    // Step 4: Find name/headline container (sibling anchor)
    const nameContainer = findNameHeadlineContainer(photoAnchor);
    if (nameContainer) {
      result.name = extractName(nameContainer);
      result.headline = extractHeadline(nameContainer);
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract author info from post (v2)", error);
  }

  return result;
}
