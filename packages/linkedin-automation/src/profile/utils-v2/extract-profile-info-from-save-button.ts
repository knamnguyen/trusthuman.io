/**
 * Extract Profile Info from Save Button - DOM v2 (React SSR + SDUI)
 *
 * Extracts profile info when save button is clicked.
 * Handles two structures:
 *
 * Posts:
 * <a data-view-name="feed-actor-image" href="/in/...">
 * <div data-engagekit-save-profile>  <!-- our container -->
 * <a href="/in/...">  <!-- sibling with name/headline -->
 *
 * Comments:
 * <a data-view-name="comment-actor-picture" href="/in/...">
 * <div data-engagekit-save-profile>  <!-- our container -->
 * ... (name/headline in separate <a data-view-name="comment-actor-description">)
 */

import type { SaveButtonProfileInfo } from "../types";
import { convertUrnToUrl } from "../utils-shared/convert-urn-to-url";

/**
 * Extract LinkedIn URL without query params.
 */
function extractLinkedInUrl(href: string | null): string | null {
  if (!href) return null;
  // Handle relative URLs
  if (href.startsWith("/in/")) {
    return `https://www.linkedin.com${href.split("?")[0]}`;
  }
  return href.split("?")[0] || null;
}

/**
 * Extract profile slug from LinkedIn URL.
 */
function extractProfileSlug(href: string | null): string | null {
  if (!href) return null;
  const match = href.match(/\/in\/([^/?]+)/);
  return match?.[1] || null;
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
 * For posts: sibling anchor after our container
 * For comments: find comment-actor-description anchor within the same comment block
 */
function findNameHeadlineContainer(container: Element): Element | null {
  // Try sibling approach first (works for posts)
  const siblingAnchor = container.nextElementSibling;
  if (siblingAnchor?.tagName === "A" && siblingAnchor.querySelector("p")) {
    return siblingAnchor;
  }

  // For comments, we need to find the comment-actor-description that belongs
  // to the same comment as our container.
  //
  // Our container is injected right after the comment-actor-picture anchor,
  // so we can identify our anchor as the previous sibling.
  const ourAnchor = container.previousElementSibling;
  if (!ourAnchor) return null;

  // Go up the tree to find the comment wrapper that contains BOTH:
  // 1. Our specific anchor (not a parent comment's anchor)
  // 2. The comment-actor-description
  //
  // Structure:
  // <div comment-wrapper>
  //   <div>
  //     <a comment-actor-picture>  <!-- ourAnchor -->
  //     <div container>            <!-- our container -->
  //   </div>
  //   <div>
  //     <a comment-actor-description>  <!-- what we want -->
  //   </div>
  // </div>

  let parent: Element | null = container.parentElement;
  let levelsUp = 0;
  const maxLevels = 4;

  while (parent && levelsUp < maxLevels) {
    // Check if our specific anchor is a direct descendant at this level
    // (not through nested comments)
    let foundOurAnchor = false;
    for (const child of parent.children) {
      if (child === ourAnchor || child.contains(ourAnchor)) {
        foundOurAnchor = true;
        break;
      }
    }

    if (foundOurAnchor) {
      // This is our comment wrapper level
      // Search for description in sibling children (not in the child containing our anchor)
      for (const child of parent.children) {
        // Skip the child that contains our anchor
        if (child === ourAnchor || child.contains(ourAnchor)) continue;

        // Try comment-actor-description (for main comments)
        // or reply-actor-description (for replies)
        const description = child.querySelector(
          'a[data-view-name="comment-actor-description"], a[data-view-name="reply-actor-description"]'
        );
        if (description) {
          return description;
        }
      }
    }

    parent = parent.parentElement;
    levelsUp++;
  }

  return null;
}

/**
 * Extract name from container element.
 */
function extractName(container: Element): string | null {
  const nameContainer = findNameHeadlineContainer(container);
  if (!nameContainer) return null;

  // Find first <p> element which contains the name
  const nameP = nameContainer.querySelector("p");
  if (!nameP) return null;

  const text = nameP.textContent?.trim() || "";
  return cleanNameText(text) || null;
}

/**
 * Extract headline from container element.
 * Skips "Author" badge when comment author is the post author.
 */
function extractHeadline(container: Element): string | null {
  const nameContainer = findNameHeadlineContainer(container);
  if (!nameContainer) return null;

  // Find all <p> elements
  // Structure varies:
  // - Normal: [name, headline]
  // - Post author commenting: [name, "Author" badge, headline]
  const paragraphs = nameContainer.querySelectorAll("p");

  for (let i = 1; i < paragraphs.length; i++) {
    const text = paragraphs[i]?.textContent?.trim() || "";
    // Skip "Author" badge, return first non-badge paragraph
    if (text && text.toLowerCase() !== "author") {
      return text;
    }
  }

  return null;
}

/**
 * Extract photo URL from the anchor element.
 */
function extractPhotoUrl(anchorElement: Element): string | null {
  const img = anchorElement.querySelector("img");
  return img?.getAttribute("src") || null;
}

/**
 * Parse data-view-tracking-scope JSON and extract URN from buffer data.
 * The tracking scope is a JSON array containing breadcrumb objects with
 * buffer data that decodes to JSON containing URNs.
 *
 * For comments, prioritizes commentUrn over updateUrn (which is the post URN).
 * For posts, uses updateUrn (activity URN).
 */
function parseTrackingScope(trackingScope: string): string | null {
  try {
    const parsed = JSON.parse(trackingScope);
    if (!Array.isArray(parsed)) return null;

    // First pass: look for CommentServedEvent with commentUrn (for comments)
    for (const entry of parsed) {
      if (entry?.topicName !== "CommentServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      // Convert byte array to string
      const jsonString = String.fromCharCode(...bufferData);

      // Look for commentUrn field specifically
      const commentUrnMatch = jsonString.match(
        /"commentUrn"\s*:\s*"(urn:li:comment:\([^)]+\))"/
      );
      if (commentUrnMatch?.[1]) {
        return commentUrnMatch[1];
      }
    }

    // Second pass: look for FeedUpdateServedEvent with updateUrn (for posts)
    for (const entry of parsed) {
      if (entry?.topicName !== "FeedUpdateServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);

      // Look for updateUrn field specifically
      const updateUrnMatch = jsonString.match(
        /"updateUrn"\s*:\s*"(urn:li:activity:\d+)"/
      );
      if (updateUrnMatch?.[1]) {
        return updateUrnMatch[1];
      }
    }

    // Fallback: look for any activity or comment URN pattern
    for (const entry of parsed) {
      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);

      const commentMatch = jsonString.match(/urn:li:comment:\([^)]+\)/);
      if (commentMatch) {
        return commentMatch[0];
      }

      const activityMatch = jsonString.match(/urn:li:activity:\d+/);
      if (activityMatch) {
        return activityMatch[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Walk up DOM tree to find element with data-view-tracking-scope attribute.
 * Parses the JSON structure to extract activity URN.
 */
function extractActivityUrn(container: Element): string | null {
  let current: Element | null = container;

  while (current) {
    const trackingScope = current.getAttribute("data-view-tracking-scope");
    if (trackingScope) {
      const urn = parseTrackingScope(trackingScope);
      if (urn) {
        return urn;
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
  const photoUrl = extractPhotoUrl(anchorElement);
  const name = extractName(container);
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
