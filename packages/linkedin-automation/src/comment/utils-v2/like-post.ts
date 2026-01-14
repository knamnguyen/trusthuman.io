/**
 * Like Post - DOM v2 (React SSR + SDUI)
 *
 * Clicks the like button on a post after commenting.
 *
 * Detection Methods (V2):
 * - Find button[data-view-name="reaction-button"]
 * - Check aria-label contains "no reaction" (not yet liked)
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
    // Find the reaction button using data-view-name attribute
    const reactionButton = postContainer.querySelector<HTMLButtonElement>(
      'button[data-view-name="reaction-button"]'
    );

    if (!reactionButton) {
      console.warn("EngageKit: Like button not found (v2)");
      return false;
    }

    // Check if already liked by checking aria-label
    const ariaLabel = reactionButton.getAttribute("aria-label") || "";

    // "no reaction" means not liked yet
    if (!ariaLabel.toLowerCase().includes("no reaction")) {
      console.log("EngageKit: Post already liked (v2)");
      return false;
    }

    // Click the like button
    reactionButton.click();

    // Wait a short moment for the UI to update
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Verify the like was registered by checking aria-label changed
    const newAriaLabel = reactionButton.getAttribute("aria-label") || "";
    const success = !newAriaLabel.toLowerCase().includes("no reaction");

    if (success) {
      console.log("EngageKit: Post liked successfully (v2)");
    } else {
      console.warn("EngageKit: Like may not have been registered (v2)");
    }

    return success;
  } catch (error) {
    console.error("EngageKit: Failed to like post (v2)", error);
    return false;
  }
}
