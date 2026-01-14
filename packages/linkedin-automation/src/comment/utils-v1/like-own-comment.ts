/**
 * Like Own Comment - DOM v1 (Legacy)
 *
 * Likes the user's own comment after posting it.
 *
 * Detection Methods (V1):
 * - Find comment articles with class "comments-comment-entity"
 * - Identify own comment by looking for "• You" text in comments-comment-meta__data span
 * - Find button.react-button__trigger within the comment
 * - Check if aria-pressed="false" (not yet liked)
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
    // Find all comment articles
    const commentArticles = postContainer.querySelectorAll<HTMLElement>(
      "article.comments-comment-entity"
    );

    for (const commentArticle of commentArticles) {
      // Check if this is the user's own comment by looking for "• You" in meta data
      const metaDataSpans = commentArticle.querySelectorAll(
        ".comments-comment-meta__data"
      );
      let isOwnComment = false;

      for (const span of metaDataSpans) {
        const text = span.textContent || "";
        if (text.includes("• You")) {
          isOwnComment = true;
          break;
        }
      }

      if (!isOwnComment) {
        continue;
      }

      // Found own comment - now find the like button
      const likeButton = commentArticle.querySelector<HTMLButtonElement>(
        "button.react-button__trigger"
      );

      if (!likeButton) {
        console.warn("EngageKit: Comment like button not found (v1)");
        continue;
      }

      // Check if already liked by checking aria-pressed
      const ariaPressed = likeButton.getAttribute("aria-pressed");
      if (ariaPressed === "true") {
        console.log("EngageKit: Own comment already liked (v1)");
        return false;
      }

      // Click the like button
      likeButton.click();

      // Wait for UI update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Verify the like was registered
      const newAriaPressed = likeButton.getAttribute("aria-pressed");
      const success = newAriaPressed === "true";

      if (success) {
        console.log("EngageKit: Own comment liked successfully (v1)");
      } else {
        console.warn("EngageKit: Like may not have been registered (v1)");
      }

      return success;
    }

    console.warn("EngageKit: Own comment not found (v1)");
    return false;
  } catch (error) {
    console.error("EngageKit: Failed to like own comment (v1)", error);
    return false;
  }
}
