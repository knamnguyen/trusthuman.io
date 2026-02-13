/**
 * Build LinkedIn Search URL for Discovery Sets
 *
 * Constructs a LinkedIn content search URL that filters posts
 * based on keywords, author job title, and industries.
 *
 * The resulting URL shows a feed of posts matching the search criteria,
 * sorted by date posted (most recent first).
 *
 * @param params - Discovery search parameters
 * @returns LinkedIn search URL string
 *
 * @example
 * const url = buildDiscoverySearchUrl({
 *   keywords: ["startup", "founder"],
 *   keywordsMode: "OR",
 *   excluded: ["hiring"],
 *   authorJobTitle: "CEO",
 *   authorIndustries: ["4", "6"],
 * });
 * // Returns: "https://www.linkedin.com/search/results/content/?keywords=..."
 */

export interface DiscoverySearchParams {
  keywords: string[];
  keywordsMode: "AND" | "OR";
  excluded: string[];
  authorJobTitle?: string;
  authorIndustries?: string[];
}

/**
 * Base URL for LinkedIn content search results
 */
export const DISCOVERY_SEARCH_BASE_URL =
  "https://www.linkedin.com/search/results/content/" as const;

/**
 * Escapes a keyword for LinkedIn search
 * Wraps keywords containing spaces in quotes
 */
function escapeKeyword(keyword: string): string {
  const trimmed = keyword.trim();
  if (trimmed.includes(" ")) {
    return `"${trimmed}"`;
  }
  return trimmed;
}

/**
 * Builds the keywords query string with AND/OR operators and NOT exclusions
 */
function buildKeywordsQuery(
  keywords: string[],
  mode: "AND" | "OR",
  excluded: string[]
): string {
  // Filter empty keywords
  const validKeywords = keywords.map((k) => k.trim()).filter(Boolean);
  const validExcluded = excluded.map((k) => k.trim()).filter(Boolean);

  if (validKeywords.length === 0) {
    return "";
  }

  // Build the main keywords part with AND/OR
  const escapedKeywords = validKeywords.map(escapeKeyword);
  let query =
    escapedKeywords.length === 1
      ? escapedKeywords[0]!
      : `(${escapedKeywords.join(` ${mode} `)})`;

  // Add NOT exclusions
  if (validExcluded.length > 0) {
    const escapedExcluded = validExcluded.map(escapeKeyword);
    query += ` NOT ${escapedExcluded.join(" NOT ")}`;
  }

  return query;
}

export function buildDiscoverySearchUrl(params: DiscoverySearchParams): string {
  const {
    keywords,
    keywordsMode,
    excluded,
    authorJobTitle,
    authorIndustries,
  } = params;

  console.log("[buildDiscoverySearchUrl] Params:", {
    keywords,
    keywordsMode,
    authorJobTitle,
    authorIndustries,
    authorIndustriesLength: authorIndustries?.length,
  });

  const urlParams = new URLSearchParams();

  // Build keywords query string
  const keywordsQuery = buildKeywordsQuery(keywords, keywordsMode, excluded);
  if (keywordsQuery) {
    urlParams.set("keywords", keywordsQuery);
  }

  // Add author job title (wrapped in quotes)
  if (authorJobTitle?.trim()) {
    urlParams.set("authorJobTitle", `"${authorJobTitle.trim()}"`);
  }

  // Add author industries as JSON array
  if (authorIndustries && authorIndustries.length > 0) {
    urlParams.set("authorIndustry", JSON.stringify(authorIndustries));
  }

  // Required LinkedIn parameters
  urlParams.set("origin", "FACETED_SEARCH");
  // LinkedIn expects quotes around the sort value
  urlParams.set("sortBy", '["date_posted"]');

  const finalUrl = `${DISCOVERY_SEARCH_BASE_URL}?${urlParams.toString()}`;
  console.log("[buildDiscoverySearchUrl] Final URL:", finalUrl);
  return finalUrl;
}
