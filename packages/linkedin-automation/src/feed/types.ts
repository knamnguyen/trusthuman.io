/**
 * Feed Utilities Interface
 *
 * Defines operations for interacting with LinkedIn feed.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */

export interface FeedUtilities {
  /**
   * Watch for and remove the "New posts" pill button.
   * @returns Cleanup function to stop watching
   */
  watchAndRemoveNewPostsPill(): () => void;

  /**
   * Count the number of posts currently loaded in the feed.
   * @returns Number of posts found
   */
  countPosts(): number;

  /**
   * Load more posts into the feed.
   * Strategy: Try clicking the load more button first (faster loading),
   * if not available, fall back to scrolling (infinite scroll).
   *
   * @returns true if new posts were loaded, false if no new posts appeared
   */
  loadMore(): Promise<boolean>;
}
