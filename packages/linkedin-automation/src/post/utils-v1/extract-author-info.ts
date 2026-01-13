/**
 * Extract Author Info - DOM v1 (Legacy)
 *
 * Extracts author information from a LinkedIn post container.
 * Uses img[alt^="View "] pattern to find author image.
 */

import type { PostAuthorInfo } from "../types";

/**
 * Extracts LinkedIn URL without query params.
 */
function extractCleanUrl(href: string | null): string | null {
  if (!href) return null;
  const urlWithoutParams = href.split("?")[0];
  return urlWithoutParams || null;
}

/**
 * Extracts profile name from img alt text.
 * e.g., "View Will McTighe's graphic link" => "Will McTighe"
 * e.g., "View Adrian Betts' graphic link" => "Adrian Betts" (names ending in 's')
 */
function extractNameFromAlt(alt: string | null): string | null {
  if (!alt) return null;

  // Pattern: "View {Name}'s ..." or "View {Name}' ..." (for names ending in 's')
  const possessiveMatch = alt.match(/^View\s+(.+?)[''\u2019\u0027]s?\s+/i);
  if (possessiveMatch?.[1]) {
    return possessiveMatch[1].trim();
  }

  return null;
}

/**
 * Extracts headline from the author section by navigating sibling structure.
 *
 * LinkedIn post author sections typically have this structure:
 * - Author container
 *   - Photo anchor (a > img[alt^="View "])
 *   - Info container (sibling to photo anchor, or its parent)
 *     - Name anchor (a with profile link)
 *       - Name span
 *       - Headline span (often last child or sibling)
 */
function extractHeadlineFromAuthorSection(photoAnchor: Element): string | null {
  // Strategy 1: Look at the parent container and find spans that aren't the name
  const authorContainer = photoAnchor.parentElement;
  if (!authorContainer) return null;

  // The author section usually has the structure where headline is in a sibling anchor
  // or in spans within the container
  const siblingAnchors = authorContainer.querySelectorAll("a");

  for (const anchor of siblingAnchors) {
    // Skip the photo anchor itself
    if (anchor === photoAnchor) continue;

    // Check if this anchor contains profile info (has children with text)
    const lastChild = anchor.lastElementChild;
    if (lastChild) {
      const text = lastChild.textContent?.trim();
      // Headline is usually longer than name and doesn't start with "View"
      if (text && text.length > 5 && !text.startsWith("View ")) {
        return text;
      }
    }

    // Also check anchor's nextElementSibling for headline
    const nextSibling = anchor.nextElementSibling;
    if (nextSibling) {
      const siblingText = nextSibling.textContent?.trim();
      if (siblingText && siblingText.length > 5 && !siblingText.startsWith("View ")) {
        return siblingText;
      }
    }
  }

  // Strategy 2: Look in the grandparent for a different structure
  const grandparent = authorContainer.parentElement;
  if (grandparent) {
    // Find all anchors and look for the one that's not the photo
    const anchors = grandparent.querySelectorAll("a");
    for (const anchor of anchors) {
      if (anchor.contains(photoAnchor) || anchor === photoAnchor) continue;

      // This might be the name/headline anchor
      const lastChild = anchor.lastElementChild;
      if (lastChild) {
        const text = lastChild.textContent?.trim();
        if (text && text.length > 5 && !text.startsWith("View ")) {
          return text;
        }
      }
    }
  }

  return null;
}

/**
 * Extracts author information from a LinkedIn post container.
 *
 * @param postContainer - The LinkedIn post container element (div with data-urn)
 * @returns PostAuthorInfo object with available information
 */
export function extractAuthorInfo(postContainer: HTMLElement): PostAuthorInfo {
  const result: PostAuthorInfo = {
    name: null,
    photoUrl: null,
    headline: null,
    profileUrl: null,
  };

  try {
    // Step 1: Find author image by alt text pattern
    // LinkedIn author images have alt="View {Name}'s profile"
    const authorImg = postContainer.querySelector<HTMLImageElement>(
      'img[alt^="View "]'
    );

    if (!authorImg) {
      return result;
    }

    // Step 2: Extract photo URL
    result.photoUrl = authorImg.getAttribute("src");

    // Step 3: Extract name from alt text
    result.name = extractNameFromAlt(authorImg.getAttribute("alt"));

    // Step 4: Navigate up to find the anchor element for profile URL
    const photoAnchor = authorImg.closest("a");
    if (photoAnchor) {
      result.profileUrl = extractCleanUrl(photoAnchor.getAttribute("href"));

      // Step 5: Extract headline using sibling navigation
      result.headline = extractHeadlineFromAuthorSection(photoAnchor);
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract author info from post (v1)", error);
  }

  return result;
}
