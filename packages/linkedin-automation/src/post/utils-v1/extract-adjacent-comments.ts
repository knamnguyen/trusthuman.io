/**
 * Extract Adjacent Comments - DOM v1 (Legacy)
 *
 * Extracts simplified comment data for AI context generation.
 * Returns comment content + engagement metrics (likes, replies).
 *
 * V1 Selectors:
 * - Comments: article[data-id^="urn:li:comment:"]
 * - Content: div[dir="ltr"] span[dir="ltr"]
 * - Reactions: button[aria-label*="Reactions on"]
 * - Replies: span[aria-label*="Replies on"] or span[aria-label*="Reply on"]
 */

import type { AdjacentCommentInfo } from "../types";

/**
 * Extract adjacent comments from a LinkedIn post container.
 * Used to provide context to the AI for better comment generation.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Array of simplified comment info (limited to top 5)
 */
export function extractAdjacentComments(
  postContainer: HTMLElement
): AdjacentCommentInfo[] {
  const comments: AdjacentCommentInfo[] = [];

  // Find comment articles using data-id attribute (URN format)
  const commentElements = postContainer.querySelectorAll(
    'article[data-id^="urn:li:comment:"]'
  );

  commentElements.forEach((el) => {
    // Extract comment text from directional span elements
    const contentEl = el.querySelector('div[dir="ltr"] span[dir="ltr"]');
    const content = contentEl?.textContent?.trim();

    if (content && content.length > 0) {
      // Extract like count from aria-label (e.g., "11 Reactions on X's comment")
      const likeEl = el.querySelector('button[aria-label*="Reactions on"]');
      const likeAriaLabel = likeEl?.getAttribute("aria-label") || "";
      const likeMatch = likeAriaLabel.match(/^(\d+)\s+Reactions?/i);
      const likeCount = likeMatch?.[1] ? parseInt(likeMatch[1], 10) : 0;

      // Extract reply count from aria-label
      const replyCountEl = el.querySelector(
        'span[aria-label*="Replies on"], span[aria-label*="Reply on"]'
      );
      let replyCount = 0;

      if (replyCountEl) {
        const replyAriaLabel = replyCountEl.getAttribute("aria-label") || "";
        const replyMatch = replyAriaLabel.match(/^(\d+)\s+Repl/i);
        replyCount = replyMatch?.[1] ? parseInt(replyMatch[1], 10) : 0;
      } else {
        // Fallback: look for visually-hidden span with reply count text
        const hiddenSpans = el.querySelectorAll("span");
        for (const span of hiddenSpans) {
          const text = span.textContent?.trim() || "";
          const match = text.match(/^(\d+)\s+repl/i);
          if (match?.[1]) {
            replyCount = parseInt(match[1], 10);
            break;
          }
        }
      }

      comments.push({ commentContent: content, likeCount, replyCount });
    }
  });

  // Limit to top 5 comments to keep payload reasonable
  return comments.slice(0, 5);
}
