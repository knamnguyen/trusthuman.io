/**
 * Count Posts - DOM v1 (legacy)
 *
 * Counts the number of posts currently loaded in the LinkedIn feed.
 * Uses data-id attribute which contains urn:li:activity:... values.
 */

/**
 * Count posts in the feed using v1 DOM selectors.
 * @returns Number of posts found
 */
export function countPosts(): number {
  try {
    // v1 DOM uses data-id for feed posts
    const byDataId = document.querySelectorAll("div[data-id]").length;
    // Also check data-urn for individual post pages
    const byDataUrn = document.querySelectorAll("div[data-urn]").length;
    return Math.max(byDataId, byDataUrn);
  } catch {
    return 0;
  }
}
