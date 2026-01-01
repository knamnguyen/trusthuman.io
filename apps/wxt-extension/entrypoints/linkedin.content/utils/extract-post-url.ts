/**
 * Extract post URL(s) from a LinkedIn post container.
 *
 * The URN is stored in the data-urn attribute on the post container:
 * - Single: <div data-urn="urn:li:activity:7410741511803297792">
 * - Aggregate: <div data-urn="urn:li:aggregate:(urn:li:activity:...,urn:li:activity:...)">
 *
 * Falls back to data-id attribute if data-urn is not available.
 *
 * Converts to URL format:
 * https://www.linkedin.com/feed/update/urn:li:activity:7410741511803297792
 */

export interface PostUrlInfo {
  /** The raw URN (e.g., "urn:li:activity:7410741511803297792") */
  urn: string;
  /** The full LinkedIn URL to the post */
  url: string;
}

/**
 * Extracts post URL(s) from a LinkedIn post container.
 * Handles both single activity URNs and aggregate URNs (multiple posts).
 * Uses .closest() to find the parent container with the URN attribute.
 *
 * @param postContainer - The LinkedIn post container element (or any child element)
 * @returns Array of PostUrlInfo objects (empty if no valid URNs found)
 */
export function extractPostUrl(postContainer: HTMLElement): PostUrlInfo[] {
  try {
    // Find the container with URN - prefer data-urn, fallback to data-id
    let container = postContainer.closest(
      "div[data-urn]"
    ) as HTMLElement | null;
    let attrName: "data-urn" | "data-id" = "data-urn";

    if (!container) {
      // Fallback to data-id
      container = postContainer.closest("div[data-id]") as HTMLElement | null;
      attrName = "data-id";
    }

    if (!container) {
      return [];
    }

    const raw = container.getAttribute(attrName);
    if (!raw) {
      return [];
    }

    // Extract URNs - handle both single and aggregate format
    const urns: string[] = [];

    if (raw.startsWith("urn:li:aggregate:")) {
      // Aggregate: "urn:li:aggregate:(urn:li:activity:...,urn:li:activity:...)"
      const match = raw.match(/urn:li:aggregate:\((.*)\)/);
      if (match?.[1]) {
        const innerUrns = match[1]
          .split(",")
          .map((urn) => urn.trim())
          .filter((urn) => urn.startsWith("urn:li:activity:"));
        urns.push(...innerUrns);
      }
    } else if (raw.startsWith("urn:li:activity:")) {
      // Single: "urn:li:activity:7341086723700936704"
      urns.push(raw);
    }

    // Convert URNs to PostUrlInfo objects
    return urns.map((urn) => ({
      urn,
      url: `https://www.linkedin.com/feed/update/${urn}`,
    }));
  } catch (error) {
    console.error("EngageKit: Failed to extract post URL", error);
    return [];
  }
}
