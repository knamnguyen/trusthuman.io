/**
 * Count Posts - DOM v2 (React SSR + SDUI)
 *
 * Counts the number of posts currently loaded in the LinkedIn feed.
 * Uses data-view-name="feed-full-update" attribute.
 *
 * Note: feed-full-update is the post content only (no comments).
 * The parent element is the full post container (post + comments).
 */

/**
 * Count posts in the feed using v2 DOM selectors.
 * @returns Number of posts found
 */
export function countPosts(): number {
  try {
    return document.querySelectorAll('div[data-view-name="feed-full-update"]')
      .length;
  } catch {
    return 0;
  }
}
