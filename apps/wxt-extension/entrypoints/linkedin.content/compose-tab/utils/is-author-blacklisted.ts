/**
 * Blacklist Matching Utility
 *
 * Checks if a post author matches any profile in the blacklist.
 * Uses PARTIAL URL matching since profile URLs may differ slightly
 * between what's stored and what appears on posts.
 *
 * Examples of URL formats:
 * - Post author: "/in/john-doe-123"
 * - Stored: "https://www.linkedin.com/in/john-doe-123/"
 * - Both should match based on the "john-doe-123" slug
 */

/**
 * Extract the profile slug from a LinkedIn profile URL
 * Handles various URL formats:
 * - "/in/john-doe-123"
 * - "linkedin.com/in/john-doe-123"
 * - "https://www.linkedin.com/in/john-doe-123/"
 * - "https://www.linkedin.com/in/john-doe-123?param=value"
 *
 * @returns The lowercase slug (e.g., "john-doe-123") or null if not found
 */
export function extractProfileSlug(url: string | null | undefined): string | null {
  if (!url) return null;

  // Match /in/username pattern, stopping at / or ? or end of string
  const match = url.match(/\/in\/([^\/\?\#]+)/i);
  if (!match || !match[1]) return null;

  return match[1].toLowerCase();
}

/**
 * Check if an author's profile URL matches any blacklisted profile
 *
 * @param authorProfileUrl - The author's profile URL from the post (e.g., "/in/john-doe")
 * @param blacklistProfileUrls - Array of profile URLs from the blacklist
 * @returns true if the author is blacklisted, false otherwise
 */
export function isAuthorBlacklisted(
  authorProfileUrl: string | null | undefined,
  blacklistProfileUrls: string[],
): boolean {
  if (!authorProfileUrl || blacklistProfileUrls.length === 0) {
    return false;
  }

  const authorSlug = extractProfileSlug(authorProfileUrl);
  if (!authorSlug) {
    console.log(
      `[BlacklistFilter] Could not extract slug from author URL: "${authorProfileUrl}"`,
    );
    return false;
  }

  // Check if author slug matches any blacklisted profile slug
  for (const blacklistUrl of blacklistProfileUrls) {
    const blacklistSlug = extractProfileSlug(blacklistUrl);
    if (blacklistSlug && authorSlug === blacklistSlug) {
      console.log(
        `[BlacklistFilter] ⛔ Author BLOCKED: "${authorSlug}" matches blacklist`,
      );
      return true;
    }
  }

  return false;
}

/**
 * Filter an array of profile URLs to get just the slugs
 * Useful for debugging and logging
 */
export function extractAllSlugs(profileUrls: string[]): string[] {
  return profileUrls
    .map(extractProfileSlug)
    .filter((slug): slug is string => slug !== null);
}
