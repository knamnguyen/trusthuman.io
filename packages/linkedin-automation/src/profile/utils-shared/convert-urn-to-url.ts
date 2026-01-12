/**
 * Convert Activity/Comment URN to LinkedIn URL
 *
 * Post URLs:
 * - https://www.linkedin.com/feed/update/urn:li:activity:7416169543003320321/
 * - https://www.linkedin.com/feed/update/urn:li:ugcPost:7416402497470136321/
 *
 * Comment URL: https://www.linkedin.com/feed/update/urn:li:ugcPost:7416402497470136321/?dashCommentUrn=urn%3Ali%3Afsd_comment%3A%28{commentId}%2Curn%3Ali%3Augcpost%3A{postId}%29
 */

/**
 * Parse comment URN to extract post ID, comment ID, and URN type.
 * Handles multiple formats:
 * - urn:li:comment:(activity:7415085236587360257,7415100015834062848)
 * - urn:li:comment:(urn:li:activity:7415085236587360257,7415100015834062848)
 * - urn:li:comment:(urn:li:ugcPost:7416402497470136321,7416403500626169857) (DOM v2)
 */
function parseCommentUrn(
  urn: string
): { postId: string; commentId: string; urnType: "activity" | "ugcPost" } | null {
  // Match: urn:li:comment:((urn:li:)?(activity|ugcPost):ID,COMMENT_ID)
  const match = urn.match(
    /urn:li:comment:\((?:urn:li:)?(activity|ugcPost):(\d+),(\d+)\)/
  );
  if (!match) return null;

  return {
    urnType: match[1] as "activity" | "ugcPost",
    postId: match[2]!,
    commentId: match[3]!,
  };
}

/**
 * Convert URN (activity, ugcPost, or comment) to a clickable LinkedIn URL.
 *
 * @param urn - The URN string (urn:li:activity:..., urn:li:ugcPost:..., or urn:li:comment:...)
 * @returns LinkedIn URL or null if URN cannot be parsed
 */
export function convertUrnToUrl(urn: string | null): string | null {
  if (!urn) return null;

  // Handle activity URN (posts)
  if (urn.startsWith("urn:li:activity:")) {
    return `https://www.linkedin.com/feed/update/${urn}/`;
  }

  // Handle ugcPost URN (posts - DOM v2)
  if (urn.startsWith("urn:li:ugcPost:")) {
    return `https://www.linkedin.com/feed/update/${urn}/`;
  }

  // Handle comment URN
  if (urn.startsWith("urn:li:comment:")) {
    const parsed = parseCommentUrn(urn);
    if (!parsed) return null;

    const { postId, commentId, urnType } = parsed;

    // Build the comment URL with encoded dashCommentUrn parameter
    // Format: urn:li:fsd_comment:(commentId,urn:li:activity:postId) or urn:li:fsd_comment:(commentId,urn:li:ugcPost:postId)
    const dashCommentUrn = encodeURIComponent(
      `urn:li:fsd_comment:(${commentId},urn:li:${urnType}:${postId})`
    );

    return `https://www.linkedin.com/feed/update/urn:li:${urnType}:${postId}/?dashCommentUrn=${dashCommentUrn}`;
  }

  return null;
}
