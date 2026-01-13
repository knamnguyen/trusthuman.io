/**
 * Detect Promoted Post - DOM v1 (Legacy)
 *
 * Detects if a post is promoted/sponsored content.
 * Promoted posts have "Promoted" text in the sub-description.
 */

/**
 * Detects if a post is promoted/sponsored content.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns True if the post is promoted/sponsored
 */
export function detectPromotedPost(postContainer: HTMLElement): boolean {
  try {
    // V1 has .update-components-actor__sub-description with "Promoted" text
    const subDescription = postContainer.querySelector<HTMLElement>(
      ".update-components-actor__sub-description"
    );

    if (subDescription) {
      const text = subDescription.textContent?.toLowerCase() || "";
      return text.includes("promoted");
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect promoted post (v1)", error);
  }

  return false;
}
