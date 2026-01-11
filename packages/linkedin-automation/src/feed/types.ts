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
}
