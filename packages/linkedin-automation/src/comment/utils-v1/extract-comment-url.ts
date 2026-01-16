/**
 * Extract Comment URL - DOM v1 (Legacy Ember)
 *
 * Extracts comment URLs from LinkedIn post containers.
 * Used after submitting a comment to get the URL of the newly posted comment.
 *
 * V1 DOM Structure:
 * - Comments have data-id="urn:li:comment:(activity:postId,commentId)"
 * - URN format: urn:li:comment:(activity:123,456)
 *
 * URL format (LinkedIn's official format):
 * https://www.linkedin.com/feed/update/urn:li:activity:XXX/?dashCommentUrn=urn%3Ali%3Afsd_comment%3A%28YYY%2Curn%3Ali%3Aactivity%3AXXX%29
 */

/**
 * Comment URL info returned by extraction
 */
export interface CommentUrlInfo {
  /** Full comment URN from DOM, e.g., "urn:li:comment:(activity:123,456)" */
  urn: string;
  /** Full LinkedIn URL to the comment */
  url: string;
}

/**
 * Parse a comment URN and build the LinkedIn URL
 * V1 format: urn:li:comment:(activity:123,456)
 *
 * @param urn - The comment URN string
 * @returns URL string or null if invalid format
 */
function buildUrlFromUrn(urn: string): string | null {
  // V1 format: urn:li:comment:(activity:postId,commentId)
  const match = urn.match(
    /^urn:li:comment:\((activity:(\d+)),(\d+)\)$/
  );
  if (!match || !match[1] || !match[3]) {
    return null;
  }

  const activityPart = match[1]; // "activity:123"
  const commentId = match[3];

  // Build full post URN
  const fullPostUrn = `urn:li:${activityPart}`;

  // Format: urn:li:fsd_comment:(commentId,postUrn)
  const dashCommentUrn = `urn:li:fsd_comment:(${commentId},${fullPostUrn})`;

  // Encode with explicit parentheses encoding (encodeURIComponent doesn't encode parens)
  const encoded = encodeURIComponent(dashCommentUrn)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");

  return `https://www.linkedin.com/feed/update/${fullPostUrn}/?dashCommentUrn=${encoded}`;
}

/**
 * Extract all comment URLs from a post container (V1)
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Map of comment URN to CommentUrlInfo
 */
export function getCommentUrls(
  postContainer: HTMLElement
): Map<string, CommentUrlInfo> {
  const results = new Map<string, CommentUrlInfo>();

  // V1: article.comments-comment-entity[data-id="urn:li:comment:(...)"]
  const commentElements = postContainer.querySelectorAll(
    'article.comments-comment-entity[data-id^="urn:li:comment:"]'
  );

  for (const el of commentElements) {
    const urn = el.getAttribute("data-id");
    if (!urn) continue;

    // Skip duplicates
    if (results.has(urn)) continue;

    const url = buildUrlFromUrn(urn);
    if (!url) continue;

    results.set(urn, { urn, url });
  }

  return results;
}

/**
 * Find a new comment URL by comparing before/after states
 *
 * @param beforeUrls - Comment URLs before submission (from getCommentUrls)
 * @param afterUrls - Comment URLs after submission (from getCommentUrls)
 * @returns The new comment's URL info, or null if not found
 */
export function findNewCommentUrl(
  beforeUrls: Map<string, CommentUrlInfo>,
  afterUrls: Map<string, CommentUrlInfo>
): CommentUrlInfo | null {
  for (const [urn, info] of afterUrls) {
    if (!beforeUrls.has(urn)) {
      return info;
    }
  }
  return null;
}
