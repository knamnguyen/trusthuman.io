/**
 * Counts the number of posts currently loaded in the LinkedIn feed
 * Uses data attributes (data-id, data-urn) for resilience against class changes
 */
export const countPosts = (): number => {
  try {
    const byDataId = document.querySelectorAll("div[data-id]").length;
    const byDataUrn = document.querySelectorAll("div[data-urn]").length;
    return Math.max(byDataId, byDataUrn);
  } catch {
    return 0;
  }
};
