/**
 * Like Own Comment - DOM v2 (React SSR + SDUI)
 *
 * Likes the user's own comment after posting it.
 *
 * Detection Methods (V2):
 * - Find comment containers with data-view-name="comment-container"
 * - Identify own comment by looking for "• You" text in author section
 * - Find data-view-name="comment-reaction-button" within the comment
 * - Check if not already liked (contains "no reaction" in span)
 * - Click to like
 */

/**
 * Finds and likes the user's own comment in a post.
 * Looks for comments with "• You" indicator and clicks the like button.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Promise<boolean> - true if own comment was found and liked, false otherwise
 */
export async function likeOwnComment(
  postContainer: HTMLElement
): Promise<boolean> {
  try {
    // Find all comment containers
    const commentContainers = postContainer.querySelectorAll(
      '[data-view-name="comment-container"]'
    );

    for (const commentContainer of commentContainers) {
      // Check if this is the user's own comment by looking for "• You" text
      const authorText = commentContainer.textContent || "";
      if (!authorText.includes("• You")) {
        continue;
      }

      // Found own comment - now find the like button
      const reactionButton = commentContainer.querySelector<HTMLElement>(
        '[data-view-name="comment-reaction-button"]'
      );

      if (!reactionButton) {
        console.warn("EngageKit: Comment reaction button not found (v2)");
        continue;
      }

      // Check if already liked by looking for "no reaction" text
      const buttonText = reactionButton.textContent || "";
      if (!buttonText.toLowerCase().includes("no reaction")) {
        console.log("EngageKit: Own comment already liked (v2)");
        return false;
      }

      // Click the like button
      reactionButton.click();

      // Wait for UI update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify the like was registered
      const newButtonText = reactionButton.textContent || "";
      const success = !newButtonText.toLowerCase().includes("no reaction");

      if (success) {
        console.log("EngageKit: Own comment liked successfully (v2)");
      } else {
        console.warn("EngageKit: Like may not have been registered (v2)");
      }

      return success;
    }

    console.warn("EngageKit: Own comment not found (v2)");
    return false;
  } catch (error) {
    console.error("EngageKit: Failed to like own comment (v2)", error);
    return false;
  }
}
