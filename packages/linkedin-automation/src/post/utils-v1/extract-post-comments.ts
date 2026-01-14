/**
 * Extract Comments - DOM v1 (Legacy)
 *
 * Extracts comments from a LinkedIn post container.
 * Uses article[data-id] elements with urn:li:comment URNs.
 *
 * DOM Structure (V1):
 * - Comments are in article elements with data-id="urn:li:comment:(...)"
 * - Author image has alt="View {name}'s profile"
 * - Comment text is in span[dir="ltr"]
 * - Replies are nested articles within parent comment articles
 */

import type { PostCommentInfo } from "../types";

/**
 * Extract comment info from a single article element.
 */
function extractCommentInfoFromArticle(article: HTMLElement): PostCommentInfo {
  const result: PostCommentInfo = {
    authorName: null,
    authorHeadline: null,
    authorProfileUrl: null,
    authorPhotoUrl: null,
    content: null,
    urn: null,
    isReply: false,
  };

  try {
    // Get URN from data-id attribute
    result.urn = article.getAttribute("data-id");

    // Check if this is a reply (nested comment)
    // Replies are typically in a nested structure
    const parentArticle = article.parentElement?.closest(
      'article[data-id^="urn:li:comment:"]'
    );
    result.isReply = !!parentArticle;

    // Find author image using alt text pattern
    const authorImg =
      article.querySelector<HTMLImageElement>('img[alt^="View "]');

    if (authorImg) {
      result.authorPhotoUrl = authorImg.getAttribute("src");

      // Extract name from alt text
      const alt = authorImg.getAttribute("alt");
      if (alt) {
        const match = alt.match(/^View\s+(.+?)[''\u2019\u0027]s?\s+/i);
        if (match?.[1]) {
          result.authorName = match[1].trim();
        }
      }

      // Get profile URL from parent anchor
      const parentAnchor = authorImg.closest("a");
      if (parentAnchor) {
        const href = parentAnchor.getAttribute("href");
        if (href) {
          result.authorProfileUrl = href.split("?")[0] || null;
        }
      }
    }

    // Extract comment text content
    // Comments typically have their text in a span with dir="ltr"
    const commentTextSpan =
      article.querySelector<HTMLElement>('span[dir="ltr"]');
    if (commentTextSpan) {
      result.content = commentTextSpan.textContent?.trim() || null;
    }

    // Try to find headline - usually near the author name
    if (authorImg) {
      const authorSection = authorImg.closest("a")?.parentElement;
      if (authorSection) {
        const spans = authorSection.querySelectorAll("span");
        for (const span of spans) {
          const text = span.textContent?.trim();
          if (
            text &&
            text.length > 5 &&
            text !== result.authorName &&
            !text.startsWith("View ")
          ) {
            result.authorHeadline = text;
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract comment info (v1)", error);
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
    const articles = postContainer.querySelectorAll<HTMLElement>(
      'article[data-id^="urn:li:comment:"]'
    );

    if (!articles.length) {
      return [];
    }

    return Array.from(articles).map((article) =>
      extractCommentInfoFromArticle(article)
    );
  } catch (error) {
    console.error("EngageKit: Failed to extract comments (v1)", error);
    return [];
  }
}
