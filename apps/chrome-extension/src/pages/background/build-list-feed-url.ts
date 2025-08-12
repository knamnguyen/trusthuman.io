export const buildListFeedUrl = (urns: string[]): string => {
  const base = "https://www.linkedin.com/search/results/content/";
  const params = new URLSearchParams();
  // Keep behavior consistent with popup: JSON string for fromMember
  params.set("fromMember", JSON.stringify(urns));
  params.set("origin", "FACETED_SEARCH");
  // Popup includes quotes in value
  params.set("sortBy", '"date_posted"');
  return `${base}?${params.toString()}`;
};

export const LIST_FEED_BASE_URL =
  "https://www.linkedin.com/search/results/content/" as const;
