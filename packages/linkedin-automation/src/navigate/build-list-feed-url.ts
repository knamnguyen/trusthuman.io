/**
 * Build LinkedIn Search URL for Target List Feed
 *
 * Constructs a LinkedIn content search URL that filters posts
 * to only show content from specific members (by their URNs).
 *
 * The resulting URL shows a feed of recent posts from the specified members,
 * sorted by date posted (most recent first).
 *
 * @param urns - Array of LinkedIn member URNs (e.g., ["urn:li:member:123", "urn:li:member:456"])
 * @returns LinkedIn search URL string
 *
 * @example
 * const url = buildListFeedUrl(["urn:li:member:123", "urn:li:member:456"]);
 * // Returns: "https://www.linkedin.com/search/results/content/?fromMember=[...]&origin=FACETED_SEARCH&sortBy=%22date_posted%22"
 */
export function buildListFeedUrl(urns: string[]): string {
  const base = "https://www.linkedin.com/search/results/content/";
  const params = new URLSearchParams();

  // JSON-encode the URN array for the fromMember parameter
  params.set("fromMember", JSON.stringify(urns));
  params.set("origin", "FACETED_SEARCH");
  // LinkedIn expects quotes around the sort value
  params.set("sortBy", '"date_posted"');

  return `${base}?${params.toString()}`;
}

/**
 * Base URL for LinkedIn content search results
 */
export const LIST_FEED_BASE_URL =
  "https://www.linkedin.com/search/results/content/" as const;
