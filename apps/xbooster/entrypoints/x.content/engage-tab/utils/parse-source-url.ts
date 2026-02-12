/**
 * parse-source-url.ts -- Parse X list/community URLs into structured source data.
 */

export interface ParsedSource {
  type: "list" | "community";
  id: string;
}

/**
 * Parse an X.com list or community URL into a structured source.
 *
 * Handles:
 * - https://x.com/i/lists/{id}
 * - https://x.com/i/communities/{id}
 * - https://twitter.com/i/lists/{id} (legacy domain)
 * - https://twitter.com/i/communities/{id} (legacy domain)
 * - Trailing slashes, query params, and fragments are stripped.
 *
 * Returns null if the URL is invalid or doesn't match a known pattern.
 */
export function parseSourceUrl(url: string): ParsedSource | null {
  try {
    const parsed = new URL(url.trim());

    // Only allow x.com and twitter.com domains
    const hostname = parsed.hostname.toLowerCase();
    if (hostname !== "x.com" && hostname !== "twitter.com") {
      return null;
    }

    // Strip trailing slashes from pathname
    const pathname = parsed.pathname.replace(/\/+$/, "");

    // Match list URLs: /i/lists/{id}
    const listMatch = pathname.match(/^\/i\/lists\/(\d+)$/);
    if (listMatch) {
      return { type: "list", id: listMatch[1]! };
    }

    // Match community URLs: /i/communities/{id}
    const communityMatch = pathname.match(/^\/i\/communities\/(\d+)$/);
    if (communityMatch) {
      return { type: "community", id: communityMatch[1]! };
    }

    return null;
  } catch {
    return null;
  }
}
