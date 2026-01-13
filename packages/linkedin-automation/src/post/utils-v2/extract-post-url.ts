/**
 * Extract Post URL - DOM v2 (React SSR + SDUI)
 *
 * Extracts post URL(s) from a LinkedIn post container.
 * Uses data-view-tracking-scope attribute which contains encoded URN data.
 *
 * V2 stores URNs in JSON-encoded buffer data within tracking scope attributes.
 * Uses shared parseTrackingScope utility to decode.
 *
 * Converts to URL format:
 * https://www.linkedin.com/feed/update/urn:li:activity:7410741511803297792
 */

import type { PostUrlInfo } from "../types";
import { extractUrnFromTrackingScope } from "../../utils-shared-v2/parse-tracking-scope";

/**
 * Extracts post URL(s) from a LinkedIn post container.
 * Walks up the DOM to find data-view-tracking-scope and decodes the URN.
 *
 * @param postContainer - The LinkedIn post container element (or any child element)
 * @returns Array of PostUrlInfo objects (empty if no valid URNs found)
 */
export function extractPostUrl(postContainer: HTMLElement): PostUrlInfo[] {
  try {
    const urn = extractUrnFromTrackingScope(postContainer);

    if (!urn) {
      return [];
    }

    // V2 can return activity URN or ugcPost URN
    if (urn.startsWith("urn:li:activity:") || urn.startsWith("urn:li:ugcPost:")) {
      return [
        {
          urn,
          url: `https://www.linkedin.com/feed/update/${urn}`,
        },
      ];
    }

    // For comment URNs, we might want to extract the post URN differently
    // For now, return empty if it's a comment URN
    if (urn.startsWith("urn:li:comment:")) {
      // Comment URN contains the post URN, but extractPostUrl should return post URLs
      // Could parse this later if needed
      return [];
    }

    return [];
  } catch (error) {
    console.error("EngageKit: Failed to extract post URL (v2)", error);
    return [];
  }
}
