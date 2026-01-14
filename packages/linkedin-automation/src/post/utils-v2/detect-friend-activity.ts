/**
 * Detect Friend Activity - DOM v2 (React SSR + SDUI)
 *
 * Detects if a post is shown due to friend activity (e.g., "X liked this").
 * Friend activity posts have a header with the friend who interacted,
 * separate from the post author.
 *
 * Detection Method (V2):
 * - Friend activity posts have: a[data-view-name="feed-header-actor-image"]
 * - This is the friend who liked/commented/celebrated
 * - Regular posts only have: a[data-view-name="feed-actor-image"] (the author)
 */

/**
 * Detects if a post is a "friend activity" post.
 *
 * Friend activity posts appear in feed when a connection interacts
 * with someone else's post (likes, comments, celebrates, etc.)
 *
 * @param postContainer - The LinkedIn post container element
 * @returns True if this is a friend activity post
 */
export function detectFriendActivity(postContainer: HTMLElement): boolean {
  try {
    // V2 friend activity posts have a header actor image (the friend who interacted)
    // This is separate from feed-actor-image which is always the post author
    const headerActorImage = postContainer.querySelector(
      'a[data-view-name="feed-header-actor-image"]'
    );

    return headerActorImage !== null;
  } catch (error) {
    console.error("EngageKit: Failed to detect friend activity (v2)", error);
    return false;
  }
}
