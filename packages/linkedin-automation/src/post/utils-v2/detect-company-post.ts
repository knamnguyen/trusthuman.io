/**
 * Detect Company Post - DOM v2 (React SSR + SDUI)
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
    // V2 uses data-view-name="feed-actor-image" for author photo anchor
    const authorAnchor = postContainer.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    if (authorAnchor?.href) {
      return authorAnchor.href.includes("/company/");
    }
  } catch (error) {
    console.error("EngageKit: Failed to detect company post (v2)", error);
  }

  return false;
}
