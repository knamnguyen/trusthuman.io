/**
 * Extract Comments - DOM v2 (React SSR + SDUI)
 *
 * Extracts comments from a LinkedIn post container.
 * Uses data-view-name attributes and data-view-tracking-scope for URNs.
 *
 * DOM Structure (V2):
 * - Comment picture: a[data-view-name="comment-actor-picture"]
 * - Comment description: a[data-view-name="comment-actor-description"]
 * - Reply picture: a[data-view-name="reply-actor-picture"]
 * - Reply description: a[data-view-name="reply-actor-description"]
 * - URN: Extracted from data-view-tracking-scope (CommentServedEvent)
 */

import type { PostCommentInfo } from "../types";

/**
 * Parse data-view-tracking-scope JSON and extract comment URN.
 * Looks for CommentServedEvent with commentUrn field.
 */
function parseCommentUrnFromTrackingScope(
  trackingScope: string
): string | null {
  try {
    const parsed = JSON.parse(trackingScope);
    if (!Array.isArray(parsed)) return null;

    // Look for CommentServedEvent with commentUrn
    for (const entry of parsed) {
      if (entry?.topicName !== "CommentServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      // Convert byte array to string
      const jsonString = String.fromCharCode(...bufferData);

      // Look for commentUrn field
      const commentUrnMatch = jsonString.match(
        /"commentUrn"\s*:\s*"(urn:li:comment:\([^)]+\))"/
      );
      if (commentUrnMatch?.[1]) {
        return commentUrnMatch[1];
      }
    }

    // Fallback: look for any comment URN pattern
    for (const entry of parsed) {
      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);
      const commentMatch = jsonString.match(/urn:li:comment:\([^)]+\)/);
      if (commentMatch) {
        return commentMatch[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Walk up DOM tree to find element with data-view-tracking-scope and extract comment URN.
 */
function extractCommentUrn(element: Element): string | null {
  let current: Element | null = element;

  while (current) {
    const trackingScope = current.getAttribute("data-view-tracking-scope");
    if (trackingScope) {
      const urn = parseCommentUrnFromTrackingScope(trackingScope);
      if (urn) {
        return urn;
      }
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Extract LinkedIn URL without query params.
 */
function extractLinkedInUrl(href: string | null): string | null {
  if (!href) return null;
  if (href.startsWith("/in/")) {
    return `https://www.linkedin.com${href.split("?")[0]}`;
  }
  return href.split("?")[0] || null;
}

/**
 * Extract comment info from a comment actor picture element.
 */
function extractCommentInfoFromPicture(
  pictureAnchor: HTMLAnchorElement,
  isReply: boolean
): PostCommentInfo {
  const result: PostCommentInfo = {
    authorName: null,
    authorHeadline: null,
    authorProfileUrl: null,
    authorPhotoUrl: null,
    content: null,
    urn: null,
    isReply,
  };

  try {
    // Extract profile URL from picture anchor
    result.authorProfileUrl = extractLinkedInUrl(
      pictureAnchor.getAttribute("href")
    );

    // Extract photo URL from img inside anchor
    const img = pictureAnchor.querySelector("img");
    result.authorPhotoUrl = img?.getAttribute("src") || null;

    // Extract URN from tracking scope
    result.urn = extractCommentUrn(pictureAnchor);

    // Find the description anchor (contains name, headline, and comment text)
    // It's a sibling or nearby element with comment-actor-description or reply-actor-description
    const descViewName = isReply
      ? "reply-actor-description"
      : "comment-actor-description";

    // Go up to find common parent, then search for description
    let parent: Element | null = pictureAnchor.parentElement;
    let levelsUp = 0;
    const maxLevels = 5;

    while (parent && levelsUp < maxLevels) {
      const description = parent.querySelector<HTMLAnchorElement>(
        `a[data-view-name="${descViewName}"]`
      );

      if (description && !pictureAnchor.contains(description)) {
        // Extract name and headline from <p> elements
        // Structure varies:
        // - Normal: [name, headline]
        // - Post author: [name, "Author" badge, headline]
        const paragraphs = description.querySelectorAll("p");

        for (let i = 0; i < paragraphs.length; i++) {
          const text = paragraphs[i]?.textContent?.trim() || "";

          if (i === 0) {
            // First paragraph is always the name
            result.authorName = text || null;
          } else if (text && text.toLowerCase() !== "author") {
            // Skip "Author" badge, take first non-badge paragraph as headline
            result.authorHeadline = text;
            break;
          }
        }
        break;
      }

      parent = parent.parentElement;
      levelsUp++;
    }

    // Extract comment text content
    // Look for the comment text container near the picture
    // This is typically in a sibling div or the same parent structure
    parent = pictureAnchor.parentElement;
    levelsUp = 0;

    while (parent && levelsUp < maxLevels && !result.content) {
      // Look for expandable text box (common pattern for comment content)
      const textBox = parent.querySelector<HTMLElement>(
        '[data-testid="expandable-text-box"]'
      );
      if (textBox) {
        result.content = textBox.textContent?.trim() || null;
        break;
      }

      // Fallback: look for p elements that might contain the comment
      // Skip the name/headline paragraphs by looking outside the description anchor
      const allPs = parent.querySelectorAll("p");
      for (const p of allPs) {
        const text = p.textContent?.trim() || "";
        // Skip if it's the author name or headline
        if (text === result.authorName || text === result.authorHeadline)
          continue;
        // Skip very short text (likely timestamps or UI elements)
        if (text.length < 5) continue;
        // Skip time patterns
        if (/^\d+[hdwmoy]\s*[•·]/.test(text)) continue;

        result.content = text;
        break;
      }

      parent = parent.parentElement;
      levelsUp++;
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract comment info (v2)", error);
  }

  return result;
}

/**
 * Extract comments from a post container (assumes comments are already loaded).
 * Does NOT click any buttons - only extracts existing comment data.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Array of comment info objects
 */
export function extractPostComments(postContainer: HTMLElement): PostCommentInfo[] {
  try {
    const comments: PostCommentInfo[] = [];

    // Find all comment actor pictures (main comments)
    const commentPictures = postContainer.querySelectorAll<HTMLAnchorElement>(
      'a[data-view-name="comment-actor-picture"]'
    );

    for (const picture of commentPictures) {
      const commentInfo = extractCommentInfoFromPicture(picture, false);
      comments.push(commentInfo);
    }

    // Find all reply actor pictures (replies to comments)
    const replyPictures = postContainer.querySelectorAll<HTMLAnchorElement>(
      'a[data-view-name="reply-actor-picture"]'
    );

    for (const picture of replyPictures) {
      const replyInfo = extractCommentInfoFromPicture(picture, true);
      comments.push(replyInfo);
    }

    return comments;
  } catch (error) {
    console.error("EngageKit: Failed to extract comments (v2)", error);
    return [];
  }
}
