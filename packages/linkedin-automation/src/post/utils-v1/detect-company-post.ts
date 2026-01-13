/**
 * Detect Company Post - DOM v1 (Legacy)
 *
 * Detects if a post is from a company page (not a personal profile).
 * Company posts have "/company/" in the author anchor href.
 */

/**
 * Detects if a post is from a company page.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns True if the post is from a company page
 */
export function detectCompanyPost(postContainer: HTMLElement): boolean {
  try {
    // V1 uses .update-components-actor__image or .update-components-actor__meta-link
    const authorAnchor = postContainer.querySelector<HTMLAnchorElement>(
      "a.update-components-actor__image, a.update-components-actor__meta-link"
    );

    if (authorAnchor?.href) {
      return authorAnchor.href.includes("/company/");
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect company post (v1)", error);
  }

  return false;
}
