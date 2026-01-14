/**
 * Extract Post URL - DOM v1 (Legacy)
 *
 * Extracts post URL(s) from a LinkedIn post container.
 * Uses data-urn and data-id attributes.
 *
 * URN formats:
 * - Single: <div data-urn="urn:li:activity:7410741511803297792">
 * - Aggregate: <div data-urn="urn:li:aggregate:(urn:li:activity:...,urn:li:activity:...)">
 *
 * Converts to URL format:
 * https://www.linkedin.com/feed/update/urn:li:activity:7410741511803297792
 */

import type { PostUrlInfo } from "../types";

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
    console.error("EngageKit: Failed to extract post URL (v1)", error);
    return [];
  }
}
