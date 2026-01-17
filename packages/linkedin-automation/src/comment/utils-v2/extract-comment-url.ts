/**
 * Extract Comment URL - DOM v2 (React SSR + SDUI)
 *
 * Extracts comment URLs from LinkedIn post containers.
 * Used after submitting a comment to get the URL of the newly posted comment.
 *
 * V2 DOM Structure:
 * - Comments have componentkey="replaceableComment_urn:li:comment:(postUrn,commentId)"
 * - URN format: urn:li:comment:(urn:li:activity:123,456) or urn:li:comment:(urn:li:ugcPost:123,456)
 *
 * URL format (LinkedIn's official format):
 * https://www.linkedin.com/feed/update/{postUrn}/?dashCommentUrn=urn%3Ali%3Afsd_comment%3A%28{commentId}%2C{postUrn}%29
 */

/**
 * Comment URL info returned by extraction
 */
export interface CommentUrlInfo {
  /** Full comment URN from DOM, e.g., "urn:li:comment:(urn:li:activity:123,456)" */
  urn: string;
  /** Full LinkedIn URL to the comment */
  url: string;
}

/**
 * Parse a comment URN and build the LinkedIn URL
 * Format: urn:li:comment:(urn:li:ugcPost:123,456) or urn:li:comment:(urn:li:activity:123,456)
 *
 * @param urn - The comment URN string
 * @returns URL string or null if invalid format
 */
function buildUrlFromUrn(urn: string): string | null {
  const match = urn.match(
    /^urn:li:comment:\((urn:li:(ugcPost|activity):(\d+)),(\d+)\)$/
  );
  if (!match || !match[1] || !match[4]) {
    return null;
  }

  const fullPostUrn = match[1];
  const commentId = match[4];

  // Format: urn:li:fsd_comment:(commentId,postUrn)
  const dashCommentUrn = `urn:li:fsd_comment:(${commentId},${fullPostUrn})`;

  // Encode with explicit parentheses encoding (encodeURIComponent doesn't encode parens)
  const encoded = encodeURIComponent(dashCommentUrn)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");

  return `https://www.linkedin.com/feed/update/${fullPostUrn}/?dashCommentUrn=${encoded}`;
}

/**
 * Extract all comment URLs from a post container (V2)
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Map of comment URN to CommentUrlInfo
 */
export function getCommentUrls(
  postContainer: HTMLElement
): Map<string, CommentUrlInfo> {
  const results = new Map<string, CommentUrlInfo>();

  // V2: componentkey="replaceableComment_urn:li:comment:(postUrn,commentId)"
  const commentElements = postContainer.querySelectorAll(
    '[componentkey^="replaceableComment_urn:li:comment:"]'
  );

  for (const el of commentElements) {
    const key = el.getAttribute("componentkey");
    if (!key) continue;

    // Extract URN from componentkey
    const urnMatch = key.match(
      /^replaceableComment_(urn:li:comment:\([^)]+\))$/
    );
    if (!urnMatch || !urnMatch[1]) continue;

    const urn = urnMatch[1];

    // Skip duplicates (same componentkey can appear on nested elements)
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
