/**
 * Parse Tracking Scope - DOM v2 (React SSR + SDUI)
 *
 * Parses data-view-tracking-scope JSON and extracts URN from buffer data.
 * The tracking scope is a JSON array containing breadcrumb objects with
 * buffer data that decodes to JSON containing URNs.
 *
 * Used by both post and profile utilities for V2 DOM.
 */

/**
 * Parse data-view-tracking-scope JSON and extract URN from buffer data.
 *
 * For comments, prioritizes commentUrn over updateUrn (which is the post URN).
 * For posts, uses updateUrn (activity URN).
 *
 * @param trackingScope - The data-view-tracking-scope attribute value (JSON string)
 * @returns The extracted URN string, or null if not found
 */
export function parseTrackingScope(trackingScope: string): string | null {
  try {
    const parsed = JSON.parse(trackingScope);
    if (!Array.isArray(parsed)) return null;

    // First pass: look for CommentServedEvent with commentUrn (for comments)
    for (const entry of parsed) {
      if (entry?.topicName !== "CommentServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      // Convert byte array to string
      const jsonString = String.fromCharCode(...bufferData);

      // Look for commentUrn field specifically
      const commentUrnMatch = jsonString.match(
        /"commentUrn"\s*:\s*"(urn:li:comment:\([^)]+\))"/
      );
      if (commentUrnMatch?.[1]) {
        return commentUrnMatch[1];
      }
    }

    // Second pass: look for FeedUpdateServedEvent with updateUrn (for posts)
    for (const entry of parsed) {
      if (entry?.topicName !== "FeedUpdateServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);

      // Look for updateUrn field specifically
      const updateUrnMatch = jsonString.match(
        /"updateUrn"\s*:\s*"(urn:li:activity:\d+)"/
      );
      if (updateUrnMatch?.[1]) {
        return updateUrnMatch[1];
      }
    }

    // Fallback: look for any activity or comment URN pattern
    for (const entry of parsed) {
      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);

      const commentMatch = jsonString.match(/urn:li:comment:\([^)]+\)/);
      if (commentMatch) {
        return commentMatch[0];
      }

      const activityMatch = jsonString.match(/urn:li:activity:\d+/);
      if (activityMatch) {
        return activityMatch[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Walk up DOM tree to find element with data-view-tracking-scope attribute
 * and extract the URN.
 *
 * @param element - Starting element to search from
 * @returns The extracted URN string, or null if not found
 */
export function extractUrnFromTrackingScope(element: Element): string | null {
  let current: Element | null = element;

  while (current) {
    const trackingScope = current.getAttribute("data-view-tracking-scope");
    if (trackingScope) {
      const urn = parseTrackingScope(trackingScope);
      if (urn) {
        return urn;
      }
    }
    current = current.parentElement;
  }

  return null;
}
