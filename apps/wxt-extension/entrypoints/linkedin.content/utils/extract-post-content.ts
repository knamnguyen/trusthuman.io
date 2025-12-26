/**
 * Extract post content from a LinkedIn post container
 * Tries multiple selectors as LinkedIn's DOM structure varies
 */
export function extractPostContent(postContainer: Element): string {
  const postContentEl =
    postContainer.querySelector('[data-ad-preview="message"]') ||
    postContainer.querySelector(".feed-shared-update-v2__description") ||
    postContainer.querySelector(".update-components-text");

  return postContentEl?.textContent?.trim() || "";
}
