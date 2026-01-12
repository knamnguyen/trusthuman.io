/**
 * Extract Profile Info from Save Button - DOM v1 (legacy)
 *
 * Extracts profile info when save button is clicked.
 * Uses aria-label pattern for name extraction.
 */

import type { SaveButtonProfileInfo } from "../types";
import { convertUrnToUrl } from "../utils-shared/convert-urn-to-url";

/**
 * Extract LinkedIn URL without query params.
 */
function extractLinkedInUrl(href: string | null): string | null {
  if (!href) return null;
  return href.split("?")[0] || null;
}

/**
 * Extract profile slug from LinkedIn URL.
 * e.g., "https://www.linkedin.com/in/john-doe" => "john-doe"
 */
function extractProfileSlug(href: string | null): string | null {
  if (!href) return null;
  const match = href.match(/\/in\/([^/?]+)/);
  return match?.[1] || null;
}

/**
 * Extract name from img alt text.
 * e.g., "View Will McTighe's graphic link" => "Will McTighe"
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
 * Extract headline from the element after the profile link/button container.
 */
function extractHeadline(buttonContainer: Element): string | null {
  const nextSibling = buttonContainer.nextElementSibling;
  if (!nextSibling) return null;

  let headlineElement: Element | null = null;

  if (nextSibling.tagName === "A") {
    headlineElement = nextSibling.lastElementChild;
  } else if (nextSibling.tagName === "DIV") {
    const innerAnchor = nextSibling.querySelector("a");
    if (innerAnchor) {
      headlineElement = innerAnchor.lastElementChild;
    }
  }

  if (headlineElement) {
    return headlineElement.textContent?.trim() || null;
  }

  return null;
}

/**
 * Walk up DOM tree to find element with data-id attribute containing activity URN.
 * Returns the URN string (urn:li:activity:... or urn:li:comment:...) or null.
 */
function extractActivityUrn(container: Element): string | null {
  let current: Element | null = container;

  while (current) {
    const dataId = current.getAttribute("data-id");
    if (dataId) {
      // Check for activity URN: urn:li:activity:7413960032142196736
      if (dataId.startsWith("urn:li:activity:")) {
        return dataId;
      }
      // Check for comment URN: urn:li:comment:(activity:7413928473452470272,7413960021136474112)
      if (dataId.startsWith("urn:li:comment:")) {
        return dataId;
      }
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Extract profile info from anchor element when save button is clicked.
 */
export function extractProfileInfoFromSaveButton(
  anchorElement: Element,
  container: Element
): SaveButtonProfileInfo {
  const href = anchorElement.getAttribute("href");
  const profileUrl = extractLinkedInUrl(href);
  const profileSlug = extractProfileSlug(href);

  // Find img element inside the anchor with alt starting with "View "
  const img = anchorElement.querySelector('img[alt^="View "]');
  const photoUrl = img?.getAttribute("src") || null;
  const name = extractNameFromAlt(img?.getAttribute("alt") || null);

  const headline = extractHeadline(container);
  const activityUrn = extractActivityUrn(container);
  const activityUrl = convertUrnToUrl(activityUrn);

  return {
    name,
    profileSlug,
    profileUrl,
    photoUrl,
    headline,
    activityUrn,
    activityUrl,
    profileUrn: null, // Will be fetched from activity page
  };
}
