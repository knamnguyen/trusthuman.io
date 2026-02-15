/**
 * Checks if a tweet has meaningful text content beyond @mentions and URLs.
 * Returns false for tweets that are just images/links with no real caption.
 */
export function hasCaption(text: string): boolean {
  if (!text) return false;

  // Strip @mentions, t.co URLs, and other URLs
  const stripped = text
    .replace(/@\w+/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .trim();

  return stripped.length > 0;
}
