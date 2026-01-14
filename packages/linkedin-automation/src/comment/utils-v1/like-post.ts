/**
 * Like Post - DOM v1 (Legacy)
 *
 * Clicks the like button on a post after commenting.
 *
 * Detection Methods (V1):
 * - Find button[aria-label="React Like"]
 * - Check aria-pressed="false" (not yet liked)
 * - Click to like
 */

/**
 * Clicks the like button on a post if not already liked.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Promise<boolean> - true if post was liked, false if already liked or error
 */
export async function likePost(postContainer: HTMLElement): Promise<boolean> {
  try {
    // Find the like button using aria-label attribute
    const likeButton = postContainer.querySelector<HTMLButtonElement>(
      'button[aria-label="React Like"]'
    );

    if (!likeButton) {
      console.warn("EngageKit: Like button not found (v1)");
      return false;
    }

    // Check if already liked by checking aria-pressed
    const ariaPressed = likeButton.getAttribute("aria-pressed");

    // aria-pressed="true" means already liked
    if (ariaPressed === "true") {
      console.log("EngageKit: Post already liked (v1)");
      return false;
    }

    // Click the like button
    likeButton.click();

    // Wait a short moment for the UI to update
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify the like was registered by checking aria-pressed changed
    const newAriaPressed = likeButton.getAttribute("aria-pressed");
    const success = newAriaPressed === "true";

    if (success) {
      console.log("EngageKit: Post liked successfully (v1)");
    } else {
      console.warn("EngageKit: Like may not have been registered (v1)");
    }

    return success;
  } catch (error) {
    console.error("EngageKit: Failed to like post (v1)", error);
    return false;
  }
}
