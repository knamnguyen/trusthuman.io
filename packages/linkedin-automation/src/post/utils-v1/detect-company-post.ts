/**
 * Detect Company Post - DOM v1 (Legacy)
 *
 * Detects if a post is from a company page (not a personal profile).
 * Company posts have "/company/" or "/showcase/" in the author anchor href.
 * Showcase pages are a type of company page with a different URL pattern.
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
      // Check for both /company/ and /showcase/ URLs
      // Showcase pages are company sub-pages (e.g., LinkedIn News Asia)
      return (
        authorAnchor.href.includes("/company/") ||
        authorAnchor.href.includes("/showcase/")
      );
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect company post (v1)", error);
  }

  return false;
}
