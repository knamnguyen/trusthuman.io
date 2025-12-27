/**
 * Extract post URL from a LinkedIn post container.
 *
 * The URN is stored in the data-urn attribute on the post container:
 * <div data-urn="urn:li:activity:7410741511803297792">
 *
 * Converts to URL format:
 * https://www.linkedin.com/feed/update/urn:li:activity:7410741511803297792
 */

export interface PostUrlInfo {
  /** The raw URN (e.g., "urn:li:activity:7410741511803297792") */
  urn: string | null;
  /** The full LinkedIn URL to the post */
  url: string | null;
}

/**
 * Extracts post URL from a LinkedIn post container.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns PostUrlInfo with urn and url
 */
export function extractPostUrl(postContainer: HTMLElement): PostUrlInfo {
  const result: PostUrlInfo = {
    urn: null,
    url: null,
  };

  try {
    // Get the data-urn attribute from the container
    const urn = postContainer.getAttribute("data-urn");

    if (!urn) {
      return result;
    }

    // Validate it's an activity URN
    if (!urn.startsWith("urn:li:activity:")) {
      return result;
    }

    result.urn = urn;
    result.url = `https://www.linkedin.com/feed/update/${urn}`;
  } catch (error) {
    console.error("EngageKit: Failed to extract post URL", error);
  }

  return result;
}
