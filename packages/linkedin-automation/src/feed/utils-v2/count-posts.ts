/**
 * Count Posts - DOM v2 (React SSR + SDUI)
 *
 * Counts the number of posts currently loaded in the LinkedIn feed.
 * Uses div[role="listitem"] which is the full post container.
 *
 * DOM Structure:
 * - div[role="listitem"] (post container - includes post + comments)
 *   - div[data-view-name="feed-full-update"] (post content only)
 *   - comment section (sibling to feed-full-update)
 */

/**
 * Count posts in the feed using v2 DOM selectors.
 * @returns Number of posts found
 */
export function countPosts(): number {
  try {
    return document.querySelectorAll('div[role="listitem"]').length;
  } catch {
    return 0;
  }
}
