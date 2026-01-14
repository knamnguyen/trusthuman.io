/**
 * Extract Adjacent Comments - DOM v2 (React SSR + SDUI)
 *
 * Extracts simplified comment data for AI context generation.
 * Returns comment content + engagement metrics (likes, replies).
 *
 * V2 Selectors:
 * - Comment picture: a[data-view-name="comment-actor-picture"]
 * - Reply picture: a[data-view-name="reply-actor-picture"]
 * - Content: [data-testid="expandable-text-box"]
 * - Engagement: Parsed from data-view-tracking-scope (CommentServedEvent)
 *   - totalReactions
 *   - totalReplies
 */

import type { AdjacentCommentInfo } from "../types";

interface CommentEngagement {
  totalReactions: number;
  totalReplies: number;
}

/**
 * Parse data-view-tracking-scope JSON and extract engagement metrics.
 * Looks for CommentServedEvent with totalReactions and totalReplies fields.
 */
function parseEngagementFromTrackingScope(
  trackingScope: string
): CommentEngagement {
  const result: CommentEngagement = { totalReactions: 0, totalReplies: 0 };

  try {
    const parsed = JSON.parse(trackingScope);
    if (!Array.isArray(parsed)) return result;

    // Look for CommentServedEvent
    for (const entry of parsed) {
      if (entry?.topicName !== "CommentServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      // Convert byte array to string
      const jsonString = String.fromCharCode(...bufferData);

      // Parse the JSON string to get the actual values
      try {
        const commentData = JSON.parse(jsonString);
        result.totalReactions = commentData.totalReactions || 0;
        result.totalReplies = commentData.totalReplies || 0;
        return result;
      } catch {
        // Fallback: use regex to extract values
        const reactionsMatch = jsonString.match(/"totalReactions"\s*:\s*(\d+)/);
        if (reactionsMatch?.[1]) {
          result.totalReactions = parseInt(reactionsMatch[1], 10);
        }

        const repliesMatch = jsonString.match(/"totalReplies"\s*:\s*(\d+)/);
        if (repliesMatch?.[1]) {
          result.totalReplies = parseInt(repliesMatch[1], 10);
        }
        return result;
      }
    }

    return result;
  } catch {
    return result;
  }
}

/**
 * Walk up DOM tree to find element with data-view-tracking-scope
 * and extract engagement metrics.
 */
function extractEngagement(element: Element): CommentEngagement {
  let current: Element | null = element;

  while (current) {
    const trackingScope = current.getAttribute("data-view-tracking-scope");
    if (trackingScope && trackingScope.includes("CommentServedEvent")) {
      return parseEngagementFromTrackingScope(trackingScope);
    }
    current = current.parentElement;
  }

  return { totalReactions: 0, totalReplies: 0 };
}

/**
 * Extract comment content from a comment picture element.
 * Walks up the DOM to find the text content.
 */
function extractCommentContent(pictureAnchor: Element): string | null {
  let parent: Element | null = pictureAnchor.parentElement;
  let levelsUp = 0;
  const maxLevels = 8;

  while (parent && levelsUp < maxLevels) {
    // Look for expandable text box (common pattern for comment content)
    const textBox = parent.querySelector<HTMLElement>(
      '[data-testid="expandable-text-box"]'
    );
    if (textBox) {
      return textBox.textContent?.trim() || null;
    }

    parent = parent.parentElement;
    levelsUp++;
  }

  return null;
}

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

  // Find all comment actor pictures (main comments)
  const commentPictures = postContainer.querySelectorAll<HTMLElement>(
    'a[data-view-name="comment-actor-picture"]'
  );

  for (const picture of commentPictures) {
    const content = extractCommentContent(picture);

    if (content && content.length > 0) {
      const engagement = extractEngagement(picture);

      comments.push({
        commentContent: content,
        likeCount: engagement.totalReactions,
        replyCount: engagement.totalReplies,
      });
    }
  }

  // Also find reply actor pictures (nested replies)
  const replyPictures = postContainer.querySelectorAll<HTMLElement>(
    'a[data-view-name="reply-actor-picture"]'
  );

  for (const picture of replyPictures) {
    const content = extractCommentContent(picture);

    if (content && content.length > 0) {
      const engagement = extractEngagement(picture);

      comments.push({
        commentContent: content,
        likeCount: engagement.totalReactions,
        replyCount: engagement.totalReplies,
      });
    }
  }

  // Limit to top 5 comments to keep payload reasonable
  return comments.slice(0, 5);
}
