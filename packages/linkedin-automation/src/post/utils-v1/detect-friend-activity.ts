/**
 * Detect Friend Activity - DOM v1 (Legacy)
 *
 * Detects if a post is shown due to friend activity (e.g., "X liked this").
 * Friend activity posts have a header showing who interacted with the post.
 *
 * Detection Method (V1):
 * - Friend activity posts have a[data-control-id] with img (friend's photo)
 *   appearing BEFORE the main author section (img[alt^="View "])
 * - This header anchor links to the friend who interacted
 * - Regular posts only have the author's img[alt^="View "]
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
    // Strategy 1: Check for data-control-id anchor with profile image
    // This is the friend activity header (friend who interacted)
    const headerActorAnchors = postContainer.querySelectorAll("a[data-control-id]");

    for (const anchor of headerActorAnchors) {
      // Check if this anchor contains a profile image
      const img = anchor.querySelector("img");
      if (img) {
        // Verify it's a profile photo (usually has profile-related alt or is in header area)
        const alt = img.getAttribute("alt") || "";
        const src = img.getAttribute("src") || "";

        // Profile photos typically have profile-displayphoto in src or photo-related alt
        if (src.includes("profile-displayphoto") || alt.includes("profile photo")) {
          return true;
        }
      }
    }

    // Strategy 2: Check if there are two distinct profile sections
    // Friend activity = friend header (small img) + post author (img[alt^="View "])
    const authorImg = postContainer.querySelector<HTMLImageElement>('img[alt^="View "]');
    if (!authorImg) return false;

    // Find all profile images before the author image
    const allImages = postContainer.querySelectorAll("img");
    let foundAuthor = false;
    let profileImagesBeforeAuthor = 0;

    for (const img of allImages) {
      if (img === authorImg) {
        foundAuthor = true;
        break;
      }

      // Check if this looks like a profile image (in an anchor, has profile photo src)
      const parentAnchor = img.closest("a");
      const src = img.getAttribute("src") || "";

      if (parentAnchor && src.includes("profile-displayphoto")) {
        profileImagesBeforeAuthor++;
      }
    }

    // If there's a profile image before the main author, it's likely friend activity
    if (foundAuthor && profileImagesBeforeAuthor > 0) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("EngageKit: Failed to detect friend activity (v1)", error);
    return false;
  }
}
